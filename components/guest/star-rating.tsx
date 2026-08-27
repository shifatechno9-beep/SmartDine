"use client";

import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  onChange?: (rating: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const interactive = Boolean(onChange);
  const iconClass = size === "sm" ? "size-3.5" : "size-7";

  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const active = rating <= value;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            disabled={!interactive}
            onClick={() => onChange?.(rating)}
            className={`rounded-md p-0.5 disabled:opacity-100 ${interactive ? "hover:scale-105" : "cursor-default"}`}
            aria-label={`${rating}`}
          >
            <Star
              className={`${iconClass} ${
                active ? "fill-accent text-accent" : "text-border"
              }`}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
