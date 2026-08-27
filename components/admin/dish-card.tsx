"use client";

import { useState } from "react";
import { ImageOff, Pencil } from "lucide-react";
import { formatMad } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { StockSwitch } from "@/components/stock-switch";
import { textFor, type Dish } from "@/lib/menu";

export function DishCard({
  dish,
  onEdit,
  onToggle,
}: {
  dish: Dish;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const { t, locale } = useLocale();
  const title = textFor(dish.title, locale);
  const description = textFor(dish.description, locale);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
      <DishThumb src={dish.imageUrl} alt={title} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{description}</p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border hover:bg-subtle"
            aria-label={t("menu.edit")}
          >
            <Pencil className="size-3.5" />
          </button>
        </div>
        <p className="mt-3 font-mono text-sm tabular-nums">{formatMad(dish.price, locale)}</p>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span
            className={`text-[11px] ${dish.available ? "text-muted" : "text-red-600 dark:text-red-400"}`}
          >
            {dish.available ? t("menu.available") : t("menu.unavailable")}
          </span>
          <StockSwitch
            checked={dish.available}
            onChange={onToggle}
            label={t("form.stock")}
          />
        </div>
      </div>
    </article>
  );
}

function DishThumb({ src, alt }: { src: string; alt: string }) {
  const { t } = useLocale();
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-36 items-center justify-center bg-subtle text-muted">
        <span className="inline-flex items-center gap-2 text-xs">
          <ImageOff className="size-4" />
          {t("menu.imageMissing")}
        </span>
      </div>
    );
  }

  return (
    // External operator-provided URLs; unoptimized on purpose.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-36 w-full object-cover"
    />
  );
}
