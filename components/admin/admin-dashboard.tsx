"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, LayoutGrid, LogOut, MessageSquareQuote, QrCode, UtensilsCrossed } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/components/locale-provider";
import { StatsOverview } from "@/components/admin/stats-overview";
import { MenuManager } from "@/components/admin/menu-manager";
import { QrGenerator } from "@/components/admin/qr-generator";
import { ReviewsPanel } from "@/components/admin/reviews-panel";
import { TrialBanner, TrialExpired, RestaurantSuspended } from "@/components/admin/trial-banner";
import { useMenu } from "@/components/menu-provider";
import { useTrial } from "@/components/use-trial";
import { logoutRestaurant } from "@/lib/auth";

type Tab = "overview" | "menu" | "qr" | "reviews";

export function AdminDashboard() {
  const { t } = useLocale();
  const router = useRouter();
  const { restaurant } = useMenu();
  const { expired, suspended, locked } = useTrial();
  const [tab, setTab] = useState<Tab>("overview");
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await logoutRestaurant();
      router.replace("/auth/login");
    } catch {
      setSigningOut(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: "overview", label: t("nav.overview"), icon: LayoutGrid },
    { id: "menu", label: t("nav.menu"), icon: UtensilsCrossed },
    { id: "qr", label: t("nav.qr"), icon: QrCode },
    { id: "reviews", label: t("nav.reviews"), icon: MessageSquareQuote },
  ];

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 border-e border-border print:hidden md:flex md:flex-col">
        <div className="flex h-14 items-center px-5">
          <Logo href="/admin/dashboard" />
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!locked) {
                  setTab(item.id);
                }
              }}
              disabled={locked}
              className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-start text-sm disabled:opacity-40 ${
                tab === item.id
                  ? "bg-subtle font-medium text-foreground"
                  : "text-muted hover:bg-subtle hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
          <Link
            href="/kitchen"
            className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted hover:bg-subtle hover:text-foreground"
          >
            <ChefHat className="size-4" strokeWidth={1.5} />
            {t("nav.kitchen")}
          </Link>
          {restaurant ? (
            <Link
              href={`/menu/${restaurant.slug}?table=12`}
              className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted hover:bg-subtle hover:text-foreground"
            >
              <QrCode className="size-4" strokeWidth={1.5} />
              {t("nav.preview")}
            </Link>
          ) : (
            <span className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted opacity-40">
              <QrCode className="size-4" strokeWidth={1.5} />
              {t("nav.preview")}
            </span>
          )}
        </nav>
        <div className="border-t border-border px-3 py-3">
          <p className="truncate px-2.5 pb-2 text-[11px] text-muted">
            {restaurant ? `${restaurant.name} · ${t("dashboard.service")}` : t("dashboard.floor")}
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={signingOut}
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-start text-sm text-muted hover:bg-subtle hover:text-foreground disabled:opacity-40"
          >
            <LogOut className="size-4 rtl:rotate-180" strokeWidth={1.5} />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 print:hidden sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{t("nav.dashboard")}</p>
            <p className="truncate text-xs text-muted">
              {restaurant ? `${restaurant.name} · ${t("dashboard.service")}` : t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={signingOut}
              aria-label={t("nav.logout")}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle hover:text-foreground disabled:opacity-40"
            >
              <LogOut className="size-4 rtl:rotate-180" strokeWidth={1.5} />
              <span className="hidden sm:inline">{t("nav.logout")}</span>
            </button>
          </div>
        </header>

        <TrialBanner />

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 print:hidden md:hidden">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!locked) {
                  setTab(item.id);
                }
              }}
              disabled={locked}
              className={`h-8 shrink-0 rounded-md px-3 text-xs disabled:opacity-40 ${
                tab === item.id ? "bg-subtle font-medium" : "text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 print:p-0">
          {suspended ? (
            <RestaurantSuspended />
          ) : expired ? (
            <TrialExpired />
          ) : (
            <>
              {tab === "overview" ? (
                <div className="print:hidden">
                  <StatsOverview />
                </div>
              ) : null}
              {tab === "menu" ? (
                <div className="print:hidden">
                  <MenuManager />
                </div>
              ) : null}
              {tab === "qr" ? <QrGenerator /> : null}
              {tab === "reviews" ? (
                <div className="print:hidden">
                  <ReviewsPanel />
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
