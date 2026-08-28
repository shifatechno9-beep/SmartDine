import type { MessageKey } from "@/lib/i18n";

export type PlanId = "starter" | "pro" | "enterprise";

export type Plan = {
  id: PlanId;
  monthlyMad: number | null;
  highlighted?: boolean;
  name: MessageKey;
  tag: MessageKey;
  features: MessageKey[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    monthlyMad: 199,
    name: "plan.starter.name",
    tag: "plan.starter.tag",
    features: [
      "plan.starter.f1",
      "plan.starter.f2",
      "plan.starter.f3",
      "plan.starter.f4",
      "plan.starter.f5",
    ],
  },
  {
    id: "pro",
    monthlyMad: 399,
    highlighted: true,
    name: "plan.pro.name",
    tag: "plan.pro.tag",
    features: ["plan.pro.f1", "plan.pro.f2", "plan.pro.f3", "plan.pro.f4", "plan.pro.f5"],
  },
  {
    id: "enterprise",
    monthlyMad: null,
    name: "plan.enterprise.name",
    tag: "plan.enterprise.tag",
    features: [
      "plan.enterprise.f1",
      "plan.enterprise.f2",
      "plan.enterprise.f3",
      "plan.enterprise.f4",
      "plan.enterprise.f5",
    ],
  },
];

export function isPlanId(value: string | undefined | null): value is PlanId {
  return value === "starter" || value === "pro" || value === "enterprise";
}

export function parsePlanId(value: string | undefined | null): PlanId {
  return isPlanId(value) ? value : "starter";
}

export function getPlan(id: PlanId) {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}

export function isCustomPlan(plan: Plan) {
  return plan.monthlyMad == null;
}
