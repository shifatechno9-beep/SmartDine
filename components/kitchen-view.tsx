"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { KitchenBoard } from "@/components/kitchen-board";
import { KitchenSoundToggle } from "@/components/kitchen-sound-toggle";
import { TrialHeaderAction, TrialExpired, RestaurantSuspended } from "@/components/admin/trial-banner";
import { useLocale } from "@/components/locale-provider";
import { useTrial } from "@/components/use-trial";
import { isKitchenSoundMuted } from "@/lib/audio";

export function KitchenView() {
  const { t } = useLocale();
  const { expired, suspended } = useTrial();
  const [armed, setArmed] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMuted(isKitchenSoundMuted()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Logo href="/kitchen" />
          <span className="hidden h-4 w-px bg-border sm:block" />
          <p className="hidden truncate text-sm text-muted sm:block">{t("kitchen.title")}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <TrialHeaderAction />
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
          <KitchenBoard />
        </>
      )}
    </div>
  );
}
