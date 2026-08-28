"use client";

import { useLocale } from "@/components/locale-provider";
import { getPlan, isPlanId, parsePlanId, type PlanId } from "@/lib/plans";

const PLAN_STYLES: Record<PlanId, string> = {
  starter: "border border-border bg-subtle text-muted",
  pro: "border border-accent/30 bg-accent/10 text-accent",
  enterprise: "border border-foreground/20 bg-foreground text-background",
};

export function PlanBadge({ plan }: { plan: string | undefined | null }) {
  const { t } = useLocale();
  const planId = isPlanId(plan) ? plan : parsePlanId(plan);
  const item = getPlan(planId);

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PLAN_STYLES[planId]}`}
    >
      {t(item.name)}
    </span>
  );
}
