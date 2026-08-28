"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { useOrders } from "@/components/use-orders";
import { DataStatusBanner } from "@/components/data-status-banner";
import { formatMad } from "@/lib/i18n";
import { textFor } from "@/lib/menu";
import {
  ORDER_STORAGE_STATUSES,
  type OrderStorageStatus,
} from "@/lib/order-storage";
import type { KitchenTicket, TicketStatus } from "@/lib/tickets";

type StorageFilter = "all" | OrderStorageStatus | "unset";

function kitchenStatusKey(status: TicketStatus) {
  switch (status) {
    case "new":
      return "kitchen.new" as const;
    case "progress":
      return "kitchen.progress" as const;
    case "ready":
      return "kitchen.ready" as const;
    case "complete":
      return "kitchen.complete" as const;
  }
}

function storageStatusKey(status: OrderStorageStatus) {
  switch (status) {
    case "paid":
      return "orders.storage.paid" as const;
    case "cancelled":
      return "orders.storage.cancelled" as const;
    case "changed":
      return "orders.storage.changed" as const;
  }
}

function storageBadgeClass(status: OrderStorageStatus | null) {
  if (status === "paid") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "cancelled") {
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  if (status === "changed") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-border bg-subtle text-muted";
}

function orderSummary(ticket: KitchenTicket, locale: Parameters<typeof textFor>[1]) {
  return ticket.items
    .map((item) => {
      const title = textFor(item.title, locale) || textFor(item.title, "fr");
      return `${item.quantity}× ${title}`;
    })
    .join(" · ");
}

export function OrdersStoragePanel() {
  const { t, locale } = useLocale();
  const { restaurant } = useMenu();
  const { orders, loading, error, setStorageStatus } = useOrders(
    restaurant?.id ?? null,
    restaurant?.slug ?? "",
    { mode: "today" },
  );
  const [filter, setFilter] = useState<StorageFilter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === "all") {
      return sorted;
    }
    if (filter === "unset") {
      return sorted.filter((order) => !order.storageStatus);
    }
    return sorted.filter((order) => order.storageStatus === filter);
  }, [filter, orders]);

  async function handleSetStatus(id: string, status: OrderStorageStatus) {
    if (savingId) {
      return;
    }
    setSavingId(id);
    try {
      await setStorageStatus(id, status);
    } finally {
      setSavingId(null);
    }
  }

  const filters: { id: StorageFilter; label: string }[] = [
    { id: "all", label: t("orders.storage.filterAll") },
    { id: "paid", label: t("orders.storage.paid") },
    { id: "cancelled", label: t("orders.storage.cancelled") },
    { id: "changed", label: t("orders.storage.changed") },
    { id: "unset", label: t("orders.storage.unset") },
  ];

  return (
    <section>
      <div className="mb-5">
        <DataStatusBanner />
      </div>
      <div>
        <h2 className="text-sm font-medium">{t("orders.storage.heading")}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">{t("orders.storage.body")}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`h-8 rounded-md border px-3 text-xs ${
              filter === item.id
                ? "border-foreground/20 bg-subtle font-medium text-foreground"
                : "border-border text-muted hover:bg-subtle hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <p className="rounded-xl border border-red-500/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {t("data.error")}
          </p>
        ) : loading ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            {t("data.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            {t("orders.storage.empty")}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((order) => (
              <li key={order.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs text-muted tabular-nums">
                        {new Intl.DateTimeFormat(
                          locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA",
                          { hour: "2-digit", minute: "2-digit" },
                        ).format(order.createdAt)}
                      </p>
                      {order.table ? (
                        <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted">
                          {t("orders.storage.table")} {order.table}
                        </span>
                      ) : null}
                      <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted">
                        {t(kitchenStatusKey(order.status))}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] ${storageBadgeClass(order.storageStatus)}`}
                      >
                        {order.storageStatus
                          ? t(storageStatusKey(order.storageStatus))
                          : t("orders.storage.unset")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{orderSummary(order, locale)}</p>
                    {order.notes ? (
                      <p className="mt-1 text-xs text-muted">{order.notes}</p>
                    ) : null}
                  </div>
                  <p className="font-mono text-sm font-medium tabular-nums">
                    {formatMad(order.total, locale)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {ORDER_STORAGE_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={savingId === order.id}
                      onClick={() => void handleSetStatus(order.id, status)}
                      className={`h-8 rounded-md border px-3 text-xs disabled:opacity-40 ${
                        order.storageStatus === status
                          ? storageBadgeClass(status)
                          : "border-border text-muted hover:bg-subtle hover:text-foreground"
                      }`}
                    >
                      {t(storageStatusKey(status))}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
