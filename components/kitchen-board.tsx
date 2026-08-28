"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, CirclePlay, CookingPot, Printer, StickyNote } from "lucide-react";
import { playKitchenAlert } from "@/lib/audio";
import { formatMad } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { useOrders } from "@/components/use-orders";
import { DataStatusBanner } from "@/components/data-status-banner";
import { textFor } from "@/lib/menu";
import { displayOrderId } from "@/lib/mappers";
import { BOARD_COLUMNS, type KitchenTicket, type TicketStatus } from "@/lib/tickets";

let cachedNow = 0;

function subscribeToNow(onChange: () => void) {
  cachedNow = Date.now();
  const id = window.setInterval(() => {
    cachedNow = Date.now();
    onChange();
  }, 1000);
  return () => window.clearInterval(id);
}

function getClientNow() {
  if (cachedNow === 0) {
    cachedNow = Date.now();
  }
  return cachedNow;
}

function ageLabel(createdAt: number, now: number) {
  if (now === 0) {
    return "--:--";
  }

  const elapsed = Math.max(0, now - createdAt);
  const minutes = Math.floor(elapsed / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function KitchenBoard({
  onPrintTicket,
}: {
  onPrintTicket: (ticket: KitchenTicket) => void;
}) {
  const { t } = useLocale();
  const { restaurant, loading: menuLoading } = useMenu();
  const [freshIds, setFreshIds] = useState<Set<string>>(() => new Set());
  const freshTimers = useRef<Map<string, number>>(new Map());

  const onIncoming = useCallback((ticket: KitchenTicket) => {
    if (ticket.status !== "new") {
      return;
    }
    playKitchenAlert();
    setFreshIds((current) => {
      const next = new Set(current);
      next.add(ticket.id);
      return next;
    });
    const previous = freshTimers.current.get(ticket.id);
    if (previous) {
      window.clearTimeout(previous);
    }
    const timer = window.setTimeout(() => {
      setFreshIds((current) => {
        const next = new Set(current);
        next.delete(ticket.id);
        return next;
      });
      freshTimers.current.delete(ticket.id);
    }, 5500);
    freshTimers.current.set(ticket.id, timer);
  }, []);

  useEffect(() => {
    const timers = freshTimers.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const { orders, loading, error, setStatus } = useOrders(
    restaurant?.id ?? null,
    restaurant?.slug ?? "",
    { onIncoming, mode: "board" },
  );
  const now = useSyncExternalStore(subscribeToNow, getClientNow, () => 0);
  const tickets = orders;
  const archived = tickets.filter((ticket) => ticket.status === "complete").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pt-3 sm:px-6">
        <DataStatusBanner />
        {error ? (
          <p className="mt-3 rounded-lg border border-red-500/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {t("kitchen.statusError")}
          </p>
        ) : null}
      </div>
      <p className="px-4 pt-3 font-mono text-[11px] text-muted sm:px-6">
        {t("kitchen.archived", { count: archived })}
      </p>
      <main className="grid flex-1 gap-4 p-4 md:grid-cols-3">
        {BOARD_COLUMNS.map((column) => {
          const columnTickets = tickets.filter((ticket) => ticket.status === column.key);
          return (
            <section key={column.key} className="flex min-h-0 flex-col">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-medium">{t(column.label)}</h2>
                <span className="font-mono text-xs text-muted">{columnTickets.length}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                {menuLoading || loading ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted">
                    {t("data.loading")}
                  </p>
                ) : columnTickets.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted">
                    {t("kitchen.empty")}
                  </p>
                ) : (
                  columnTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      now={now}
                      fresh={freshIds.has(ticket.id)}
                      onStatus={(status) => void setStatus(ticket.id, status)}
                      onPrint={() => onPrintTicket(ticket)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

function TicketCard({
  ticket,
  now,
  fresh,
  onStatus,
  onPrint,
}: {
  ticket: KitchenTicket;
  now: number;
  fresh: boolean;
  onStatus: (status: TicketStatus) => void;
  onPrint: () => void;
}) {
  const { t, locale } = useLocale();
  const hot = now !== 0 && now - ticket.createdAt > 8 * 60_000;

  return (
    <article
      className={`rounded-xl border bg-subtle p-4 transition-[box-shadow,border-color] ${
        fresh
          ? "kds-fresh border-accent ring-2 ring-accent/35"
          : hot
            ? "border-red-500/40"
            : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="font-mono text-xs text-muted">{displayOrderId(ticket.id)}</p>
          {fresh ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent-foreground">
              {t("kitchen.badgeNew")}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <p className={`font-mono text-sm tabular-nums ${hot && !fresh ? "text-red-600 dark:text-red-400" : ""}`}>
            {ageLabel(ticket.createdAt, now)}
          </p>
          <button
            type="button"
            onClick={onPrint}
            aria-label={t("kitchen.print")}
            title={t("kitchen.print")}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-accent/50 bg-accent/15 px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground print:hidden"
          >
            <Printer className="size-5" strokeWidth={2} />
            <span className="hidden min-[420px]:inline">{t("kitchen.print")}</span>
          </button>
        </div>
      </div>
      <p className="mt-2 text-lg font-semibold tracking-tight">
        {ticket.table ? t("kitchen.table", { n: ticket.table }) : t("kitchen.noTable")}
      </p>
      <ul className="mt-3 space-y-1.5">
        {ticket.items.map((item, index) => (
          <li key={`${ticket.id}-${item.dishId}-${index}`} className="flex items-start justify-between gap-3 text-sm">
            <span>
              <span className="font-mono text-xs text-muted">{item.quantity}×</span>{" "}
              {textFor(item.title, locale)}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
              {formatMad(item.price * item.quantity, locale)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-mono text-xs text-muted tabular-nums">
        {t("kitchen.total")} · {formatMad(ticket.total, locale)}
      </p>
      {ticket.notes ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/10 px-2.5 py-2 text-xs leading-5">
          <StickyNote className="mt-0.5 size-3.5 shrink-0 text-accent" />
          <span>
            <span className="font-medium">{t("kitchen.notes")}: </span>
            {ticket.notes}
          </span>
        </p>
      ) : null}
      <TicketActions status={ticket.status} onStatus={onStatus} />
    </article>
  );
}

function TicketActions({
  status,
  onStatus,
}: {
  status: TicketStatus;
  onStatus: (status: TicketStatus) => void;
}) {
  const { t } = useLocale();

  const actions: {
    key: TicketStatus;
    label: "kitchen.accept" | "kitchen.markReady" | "kitchen.complete";
    icon: typeof CirclePlay;
    next: TicketStatus;
    enabled: boolean;
  }[] = [
    {
      key: "new",
      label: "kitchen.accept",
      icon: CirclePlay,
      next: "progress",
      enabled: status === "new",
    },
    {
      key: "progress",
      label: "kitchen.markReady",
      icon: CookingPot,
      next: "ready",
      enabled: status === "progress",
    },
    {
      key: "ready",
      label: "kitchen.complete",
      icon: Check,
      next: "complete",
      enabled: status === "ready",
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-1.5">
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={!action.enabled}
          onClick={() => onStatus(action.next)}
          className={`inline-flex h-9 items-center justify-center gap-1 rounded-md text-[11px] font-medium ${
            action.enabled
              ? "bg-foreground text-background"
              : "border border-border text-muted opacity-40"
          }`}
        >
          <action.icon className="size-3.5" />
          {t(action.label)}
        </button>
      ))}
    </div>
  );
}
