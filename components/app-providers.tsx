"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";

export function AppProviders({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={locale}>
        {children}
      </LocaleProvider>
    </ThemeProvider>
  );
}
