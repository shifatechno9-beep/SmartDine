"use client";

import { useSyncExternalStore } from "react";
import { ClipboardList, LayoutGrid, Star, UtensilsCrossed, Wallet } from "lucide-react";
import { formatMad } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { useOrders } from "@/components/use-orders";
import { useReviews } from "@/components/use-reviews";
import { DataStatusBanner } from "@/components/data-status-banner";
import { averageTicketMad, FLOOR_TABLES } from "@/lib/menu";

function subscribeDay(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

function getDayStart() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export function StatsOverview() {
  const { t, locale } = useLocale();
  const { dishes, restaurant, loading: menuLoading } = useMenu();
  const todayStart = useSyncExternalStore(subscribeDay, getDayStart, getDayStart);
  const { orders, loading: ordersLoading } = useOrders(
    restaurant?.id ?? null,
    restaurant?.slug ?? "",
    { mode: "today", sinceMs: todayStart },
  );
  const { reviews, loading: reviewsLoading, average: ratingAverage } = useReviews(
    restaurant?.id ?? null,
  );
  const ready = !menuLoading && !ordersLoading && !reviewsLoading;
  const available = dishes.filter((dish) => dish.available).length;
  const todaysOrders = orders.filter((order) => order.createdAt >= todayStart);
  const sales = todaysOrders.reduce((sum, order) => sum + order.total, 0);
  const activeTables = new Set(
    todaysOrders.filter((order) => order.status !== "complete" && order.table).map((order) => order.table),
  ).size;
  const ticketAverage =
    todaysOrders.length > 0 ? Math.round(sales / todaysOrders.length) : averageTicketMad(dishes);

  const stats = [
    {
      label: t("stats.dishes"),
      value: ready ? String(dishes.length) : "—",
      hint: ready ? t("stats.dishesHint", { count: available }) : t("data.loading"),
      icon: UtensilsCrossed,
    },
    {
      label: t("stats.tables"),
      value: ready ? String(activeTables) : "—",
      hint: ready ? t("stats.tablesHint", { count: FLOOR_TABLES }) : t("data.loading"),
      icon: LayoutGrid,
    },
    {
      label: t("stats.orders"),
      value: ready ? String(todaysOrders.length) : "—",
      hint: ready ? t("stats.ordersHint", { amount: formatMad(sales, locale) }) : t("data.loading"),
      icon: ClipboardList,
    },
    {
      label: t("stats.revenue"),
      value: ready ? formatMad(sales, locale) : "—",
      hint: ready ? t("stats.revenueHint", { amount: formatMad(ticketAverage, locale) }) : t("data.loading"),
      icon: Wallet,
    },
    {
      label: t("reviews.average"),
      value: ready ? (reviews.length ? ratingAverage.toFixed(1) : "—") : "—",
      hint: ready ? t("reviews.count", { count: reviews.length }) : t("data.loading"),
      icon: Star,
    },
  ];

  return (
    <div className="space-y-4">
      <DataStatusBanner />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{stat.label}</p>
              <stat.icon className="size-4 text-accent" strokeWidth={1.5} />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.hint}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
