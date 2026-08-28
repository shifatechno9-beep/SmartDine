"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { KitchenBoard } from "@/components/kitchen-board";
import { KitchenPrintReceipt } from "@/components/kitchen-print-receipt";
import { KitchenSoundToggle } from "@/components/kitchen-sound-toggle";
import { TrialHeaderAction, TrialExpired, RestaurantSuspended } from "@/components/admin/trial-banner";
import { PlanBadge } from "@/components/admin/plan-badge";
import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { useTrial } from "@/components/use-trial";
import { isKitchenSoundMuted } from "@/lib/audio";
import type { KitchenTicket } from "@/lib/tickets";

export function KitchenView() {
  const { t } = useLocale();
  const { restaurant } = useMenu();
  const { expired, suspended } = useTrial();
  const [armed, setArmed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [printingTicket, setPrintingTicket] = useState<KitchenTicket | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setMuted(isKitchenSoundMuted()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const clearPrint = () => setPrintingTicket(null);
    window.addEventListener("afterprint", clearPrint);
    return () => window.removeEventListener("afterprint", clearPrint);
  }, []);

  const handlePrintTicket = useCallback((ticket: KitchenTicket) => {
    setPrintingTicket(ticket);
    window.requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  return (
    <>
      <div className="kitchen-screen flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Logo href="/kitchen" />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <p className="truncate text-sm text-muted">{t("kitchen.title")}</p>
            {restaurant ? <PlanBadge plan={restaurant.plan} /> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <TrialHeaderAction />
          <Link
            href="/admin/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle hover:text-foreground print:hidden"
          >
            <LayoutGrid className="size-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">{t("nav.dashboard")}</span>
          </Link>
          <span className="hidden items-center gap-2 text-xs text-muted sm:inline-flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {t("kitchen.live")}
          </span>
          <KitchenSoundToggle
            armed={armed}
            muted={muted}
            onArmed={setArmed}
            onMuted={setMuted}
          />
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
      </header>
      {suspended ? (
        <RestaurantSuspended />
      ) : expired ? (
        <TrialExpired />
      ) : (
        <>
          {!armed ? (
            <div className="flex flex-col gap-2 border-b border-accent/25 bg-accent/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-foreground">{t("kitchen.soundHint")}</p>
              <KitchenSoundToggle
                armed={armed}
                muted={muted}
                onArmed={setArmed}
                onMuted={setMuted}
              />
            </div>
          ) : null}
          <KitchenBoard onPrintTicket={handlePrintTicket} />
        </>
      )}
      </div>
      <KitchenPrintReceipt
        ticket={printingTicket}
        restaurantName={restaurant?.name ?? ""}
      />
    </>
  );
}
