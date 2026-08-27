"use client";

import { LOCALES } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className="inline-flex rounded-md border border-border p-0.5"
    >
      {LOCALES.map((item) => {
        const active = item.code === locale;

        return (
          <button
            key={item.code}
            type="button"
            onClick={() => setLocale(item.code)}
            className={`h-8 min-w-9 rounded-[5px] px-2 text-[11px] font-medium tracking-wide transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
            aria-pressed={active}
            title={item.label}
          >
            {compact ? item.short : item.label}
          </button>
        );
      })}
    </div>
  );
}
