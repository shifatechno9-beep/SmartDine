"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/components/locale-provider";
import { BRAND_NAME } from "@/lib/brand";

export function MarketingHeader({
  primaryHref = "/auth/register?plan=pro",
  primaryLabel,
}: {
  primaryHref?: string;
  primaryLabel?: string;
}) {
  const { t } = useLocale();

  return (
    <header className="relative z-10 border-b border-border/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#product" className="transition-colors hover:text-foreground">
            {t("nav.product")}
          </Link>
          <Link href="/#how" className="transition-colors hover:text-foreground">
            {t("nav.how")}
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">
            {t("nav.pricing")}
          </Link>
          <Link href="/admin/dashboard" className="transition-colors hover:text-foreground">
            {t("nav.dashboard")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-subtle"
          >
            {t("cta.login")}
          </Link>
          <Link
            href={primaryHref}
            className="hidden h-9 items-center rounded-md bg-foreground px-3.5 text-sm font-medium text-background sm:inline-flex"
          >
            {primaryLabel ?? t("cta.start")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  const { t } = useLocale();

  return (
    <footer className="relative z-10 border-t border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-muted">
        <p>© {new Date().getFullYear()} {BRAND_NAME}</p>
        <p>{t("landing.footer")}</p>
      </div>
    </footer>
  );
}
