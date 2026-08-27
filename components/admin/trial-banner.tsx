"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useTrial } from "@/components/use-trial";
import { padUnit, splitDuration } from "@/lib/trial";

export function TrialBanner() {
  const { t } = useLocale();
  const { isTrial, expired, remainingMs, suspended } = useTrial();

  if (suspended || !isTrial || expired) {
    return null;
  }

  const parts = splitDuration(remainingMs);
  const urgent = remainingMs < 24 * 60 * 60 * 1000;
  const units = [
    { value: parts.days, label: t("trial.days") },
    { value: parts.hours, label: t("trial.hours") },
    { value: parts.minutes, label: t("trial.minutes") },
    { value: parts.seconds, label: t("trial.seconds") },
  ];

  return (
    <div
      className={`flex flex-col gap-3 border-b px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
        urgent
          ? "border-red-500/25 bg-red-500/10"
          : "border-accent/25 bg-accent/10"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{t("trial.banner")}</p>
        <p className="mt-0.5 text-xs text-muted">{t("trial.hint")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-end gap-2 font-mono tabular-nums" dir="ltr">
          {units.map((unit, index) => (
            <span key={unit.label} className="flex items-end gap-2">
              {index > 0 ? <span className="pb-4 text-muted">:</span> : null}
              <span className="flex flex-col items-center">
                <span className="text-lg font-semibold leading-none tracking-tight">
                  {padUnit(unit.value)}
                </span>
                <span className="mt-1 text-[10px] text-muted">{unit.label}</span>
              </span>
            </span>
          ))}
        </div>
        <Link
          href="/pricing"
          className="inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background"
        >
          {t("trial.upgrade")}
        </Link>
      </div>
    </div>
  );
}

export function TrialExpired() {
  const { t } = useLocale();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-subtle">
        <Sparkles className="size-5 text-accent" strokeWidth={1.5} />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">{t("trial.expiredTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{t("trial.expiredBody")}</p>
      <Link
        href="/pricing"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background"
      >
        {t("trial.expiredCta")}
        <ArrowRight className="size-4 rtl:rotate-180" />
      </Link>
    </div>
  );
}

export function RestaurantSuspended() {
  const { t } = useLocale();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
        <Sparkles className="size-5 text-red-500" strokeWidth={1.5} />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">{t("access.suspendedTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{t("access.suspendedBody")}</p>
    </div>
  );
}
