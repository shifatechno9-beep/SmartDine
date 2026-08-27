"use client";

import { useState } from "react";
import { Coffee, Soup, UtensilsCrossed } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import type { Dish, DishCategory } from "@/lib/menu";

const palettes: Record<DishCategory, { from: string; to: string; Icon: typeof Soup }> = {
  starters: { from: "#3a2a1c", to: "#c4a574", Icon: Soup },
  mains: { from: "#1a1410", to: "#9a7348", Icon: UtensilsCrossed },
  drinks: { from: "#14221c", to: "#6f8f78", Icon: Coffee },
};

export function DishPhoto({
  dish,
  title,
  className = "h-44",
}: {
  dish: Dish;
  title: string;
  className?: string;
}) {
  const { t } = useLocale();
  const [failed, setFailed] = useState(false);

  if (dish.imageUrl && !failed) {
    return (
      // Operator-provided URLs; unoptimized on purpose.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={dish.imageUrl}
        alt={title}
        onError={() => setFailed(true)}
        className={`w-full object-cover ${className}`}
      />
    );
  }

  const palette = palettes[dish.category];
  const Icon = palette.Icon;

  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, ${palette.to}55, transparent 50%), linear-gradient(145deg, ${palette.from}, ${palette.to})`,
      }}
      aria-label={title}
    >
      <span className="absolute inset-4 rounded-full border border-white/15" />
      <span className="absolute inset-8 rounded-full border border-white/10" />
      <Icon className="relative size-8 text-white/85" strokeWidth={1.25} />
      <span className="sr-only">{t("menu.imageMissing")}</span>
    </div>
  );
}
