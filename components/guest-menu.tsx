"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ShoppingBag, Star } from "lucide-react";
import { LOCALE_COOKIE, formatMad } from "@/lib/i18n";
import { playWaiterChime } from "@/lib/audio";
import { titleFromSlug } from "@/lib/format";
import { whatsappDigits } from "@/lib/phone";
import { buildWhatsAppOrderUrl, openWhatsApp } from "@/lib/whatsapp";
import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { useOrders } from "@/components/use-orders";
import { DataStatusBanner } from "@/components/data-status-banner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { GuestDishCard } from "@/components/guest/guest-dish-card";
import { OrderTrackStepper } from "@/components/guest/order-track-stepper";
import { CartSheet } from "@/components/guest/cart-sheet";
import { FeedbackModal } from "@/components/guest/feedback-modal";
import { GuestToast } from "@/components/guest/guest-toast";
import {
  CATEGORY_KEYS,
  type DishCategory,
} from "@/lib/menu";

type Filter = "all" | DishCategory;
type Toast = { kind: "waiter" | "order"; title: string; body: string };

export function GuestMenu({
  restaurantSlug,
  table,
}: {
  restaurantSlug: string;
  table?: string;
}) {
  const { t, locale, setLocale } = useLocale();
  const { restaurant, dishes, loading: menuLoading } = useMenu();
  const { createOrder } = useOrders(restaurant?.id ?? null, restaurantSlug, { mode: "none" });
  const { orders: tableOrders, refresh: refreshTableOrders } = useOrders(
    restaurant?.id ?? null,
    restaurantSlug,
    {
      mode: "guest",
      table,
    },
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [tablePulse, setTablePulse] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const toastTimer = useRef<number>(0);

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    if (!restaurant?.defaultLocale) {
      return;
    }
    try {
      if (window.localStorage.getItem(LOCALE_COOKIE)) {
        return;
      }
    } catch {
      return;
    }
    if (restaurant.defaultLocale === locale) {
      return;
    }
    const timer = window.setTimeout(() => setLocale(restaurant.defaultLocale), 0);
    return () => window.clearTimeout(timer);
  }, [locale, restaurant?.defaultLocale, setLocale]);

  const restaurantName = restaurant?.name || titleFromSlug(restaurantSlug);

  const visible = useMemo(() => {
    const listed = dishes.filter((dish) => (filter === "all" ? true : dish.category === filter));
    return listed;
  }, [dishes, filter]);

  const lines = useMemo(
    () =>
      dishes
        .map((dish) => ({ dish, quantity: quantities[dish.id] ?? 0 }))
        .filter((line) => line.quantity > 0),
    [dishes, quantities],
  );
  const orderableLines = useMemo(
    () => lines.filter((line) => line.dish.available && Number.isFinite(line.dish.price)),
    [lines],
  );

  const itemCount = orderableLines.reduce((sum, line) => sum + line.quantity, 0);
  const total = orderableLines.reduce((sum, line) => sum + line.dish.price * line.quantity, 0);

  const activeTableOrders = useMemo(
    () => [...tableOrders].sort((a, b) => b.createdAt - a.createdAt),
    [tableOrders],
  );

  const add = useCallback(
    (dishId: string) => {
      const dish = dishes.find((item) => item.id === dishId);
      if (!dish?.available) {
        return;
      }
      setQuantities((current) => ({ ...current, [dishId]: (current[dishId] ?? 0) + 1 }));
    },
    [dishes],
  );

  const remove = useCallback((dishId: string) => {
    setQuantities((current) => {
      const nextCount = (current[dishId] ?? 0) - 1;
      if (nextCount <= 0) {
        const next = { ...current };
        delete next[dishId];
        return next;
      }
      return { ...current, [dishId]: nextCount };
    });
  }, []);

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const callWaiter = useCallback(() => {
    playWaiterChime();
    setTablePulse(true);
    window.setTimeout(() => setTablePulse(false), 1800);
    showToast({
      kind: "waiter",
      title: t("guest.waiterTitle"),
      body: table ? t("guest.waiterBody", { n: table }) : t("guest.waiterNoTable"),
    });
  }, [showToast, t, table]);

  async function confirmOrder(sendWhatsApp: boolean) {
    if (sending || menuLoading || !restaurant) {
      return;
    }
    if (orderableLines.length === 0) {
      showToast({
        kind: "order",
        title: t("guest.unavailable"),
        body: t("guest.unavailableCart"),
      });
      return;
    }

    const items = orderableLines.map(({ dish, quantity }) => ({
      dishId: dish.id,
      title: dish.title,
      quantity,
      price: dish.price,
    }));
    const nextWhatsappUrl = restaurant.phone
      ? buildWhatsAppOrderUrl({
          restaurantName: restaurant.name,
          phone: restaurant.phone,
          table,
          items,
          total,
          notes: notes.trim(),
        })
      : null;

    setSending(true);
    try {
      await createOrder({
        table,
        items,
        notes: notes.trim(),
      });
      void refreshTableOrders();

      setQuantities({});
      setNotes("");
      setCartOpen(false);
      setWhatsappUrl(nextWhatsappUrl);
      setFeedbackKey((current) => current + 1);
      setFeedbackOpen(true);
      if (sendWhatsApp && nextWhatsappUrl) {
        openWhatsApp(nextWhatsappUrl);
      }
      showToast({
        kind: "order",
        title: t("guest.confirmedTitle"),
        body: table ? t("guest.confirmedBody", { n: table }) : t("guest.confirmedNoTable"),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      showToast({
        kind: "order",
        title: t("data.error"),
        body: message.includes("not configured") ? t("data.setup") : t("guest.orderFailed"),
      });
    } finally {
      setSending(false);
    }
  }

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: t("menu.all") },
    ...CATEGORY_KEYS.map((category) => ({ id: category.id, label: t(category.label) })),
  ];

  const itemLabel = itemCount === 1 ? t("guest.item") : t("guest.items", { count: itemCount });

  if (restaurant?.suspended) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{t("access.suspendedTitle")}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{t("access.guestSuspended")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      {toast ? <GuestToast kind={toast.kind} title={toast.title} body={toast.body} /> : null}

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex min-w-0 items-start gap-3">
            {restaurant?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logo}
                alt=""
                className="size-11 shrink-0 rounded-xl border border-border object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.18em] text-accent uppercase">SavyDine</p>
              <h1 className="truncate text-xl font-semibold tracking-tight">{restaurantName}</h1>
              <p
                className={`mt-1 text-sm text-muted transition-shadow ${
                  tablePulse ? "text-accent" : ""
                }`}
              >
                {table ? t("guest.table", { n: table }) : t("guest.noTable")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                setWhatsappUrl(null);
                setFeedbackKey((current) => current + 1);
                setFeedbackOpen(true);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-[11px] text-muted hover:bg-subtle hover:text-foreground"
            >
              <Star className="size-3.5" />
              {t("guest.rate")}
            </button>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-3">
          {activeTableOrders.length > 0 ? (
            <div className="space-y-2">
              {activeTableOrders.map((order) => (
                <OrderTrackStepper key={order.id} ticket={order} />
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={callWaiter}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-medium text-accent"
          >
            <Bell className="size-4" />
            {t("guest.callWaiter")}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`h-8 shrink-0 rounded-full px-3.5 text-xs font-medium whitespace-nowrap ${
                filter === tab.id
                  ? "bg-foreground text-background"
                  : "border border-border text-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-28">
        <div className="mb-4">
          <DataStatusBanner />
        </div>
        {!table ? (
          <p className="mb-4 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted">
            {t("guest.tableHint")}
          </p>
        ) : null}

        <div className="grid gap-4">
          {visible.map((dish) => (
            <GuestDishCard
              key={dish.id}
              dish={dish}
              quantity={quantities[dish.id] ?? 0}
              onAdd={() => add(dish.id)}
              onRemove={() => remove(dish.id)}
            />
          ))}
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center p-4">
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="pointer-events-auto flex h-14 w-full max-w-md items-center justify-between rounded-2xl bg-foreground px-5 text-background shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-background/15">
              <ShoppingBag className="size-3.5" />
            </span>
            {itemCount === 0 ? t("guest.review") : itemLabel}
          </span>
          <span className="font-mono text-sm tabular-nums">{formatMad(total, locale)}</span>
        </button>
      </div>

      <CartSheet
        open={cartOpen}
        lines={lines}
        total={total}
        notes={notes}
        sending={sending}
        confirmDisabled={!restaurant || menuLoading || orderableLines.length === 0}
        whatsappEnabled={Boolean(restaurant?.phone && whatsappDigits(restaurant.phone))}
        onClose={() => setCartOpen(false)}
        onAdd={add}
        onRemove={remove}
        onNotesChange={setNotes}
        onConfirm={() => void confirmOrder(false)}
        onConfirmWhatsApp={() => void confirmOrder(true)}
        onCallWaiter={callWaiter}
      />

      {restaurant ? (
        <FeedbackModal
          key={feedbackKey}
          open={feedbackOpen}
          restaurantId={restaurant.id}
          table={table}
          whatsappUrl={whatsappUrl}
          onClose={() => setFeedbackOpen(false)}
        />
      ) : null}
    </div>
  );
}
