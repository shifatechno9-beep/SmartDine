"use client";

import { Minus, Plus } from "lucide-react";
import { formatMad } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { DishPhoto } from "@/components/guest/dish-photo";
import { textFor, type Dish } from "@/lib/menu";

export function GuestDishCard({
  dish,
  quantity,
  onAdd,
  onRemove,
}: {
  dish: Dish;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const { t, locale } = useLocale();
  const title = textFor(dish.title, locale);
  const description = textFor(dish.description, locale);

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-border bg-background ${
        dish.available ? "" : "opacity-55"
      }`}
    >
      <DishPhoto dish={dish} title={title} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{description}</p>
          </div>
          {dish.available ? (
            quantity > 0 ? (
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5">
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex size-8 items-center justify-center rounded-full hover:bg-subtle"
                  aria-label={t("guest.decrease")}
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="min-w-5 text-center font-mono text-xs tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={onAdd}
                  className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-background"
                  aria-label={t("guest.increase")}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
                aria-label={`${t("guest.add")} — ${title}`}
              >
                <Plus className="size-4" />
              </button>
            )
          ) : (
            <span className="shrink-0 self-center text-[11px] text-red-600 dark:text-red-400">
              {t("guest.unavailable")}
            </span>
          )}
        </div>
        <p className="mt-3 font-mono text-sm tabular-nums">{formatMad(dish.price, locale)}</p>
      </div>
    </article>
  );
}
