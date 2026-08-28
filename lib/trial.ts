import type { PlanId } from "@/lib/plans";

export const STARTER_TRIAL_DAYS = 7;
export const STARTER_TRIAL_MS = STARTER_TRIAL_DAYS * 24 * 60 * 60 * 1000;

export type TrialSnapshot = {
  isTrial: boolean;
  expired: boolean;
  remainingMs: number;
  trialEndsAt: number | null;
};

export function resolveStarterTrialEnd(
  row: {
    plan?: string | null;
    is_trial?: boolean | null;
    trial_ends_at?: string | null;
    created_at?: string | null;
  },
  now = Date.now(),
) {
  const plan = row.plan || "starter";
  if (plan !== "starter") {
    return {
      isTrial: Boolean(row.is_trial),
      trialEndsAt: row.trial_ends_at ?? null,
    };
  }

  if (row.trial_ends_at) {
    return {
      isTrial: row.is_trial !== false,
      trialEndsAt: row.trial_ends_at,
    };
  }

  const created = row.created_at ? Date.parse(row.created_at) : Number.NaN;
  if (Number.isFinite(created)) {
    return {
      isTrial: true,
      trialEndsAt: new Date(created + STARTER_TRIAL_MS).toISOString(),
    };
  }

  return {
    isTrial: true,
    trialEndsAt: new Date(now + STARTER_TRIAL_MS).toISOString(),
  };
}

export function trialEndsAtIso(plan: PlanId, from = new Date()) {
  if (plan !== "starter") {
    return null;
  }

  return new Date(from.getTime() + STARTER_TRIAL_MS).toISOString();
}

export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

export function padUnit(value: number) {
  return String(value).padStart(2, "0");
}

export function getTrialSnapshot(
  restaurant: {
    plan: string;
    isTrial: boolean;
    trialEndsAt: string | null;
    createdAt?: string | null;
  } | null,
  now = Date.now(),
): TrialSnapshot {
  if (!restaurant) {
    return { isTrial: false, expired: false, remainingMs: 0, trialEndsAt: null };
  }

  const resolved = resolveStarterTrialEnd(
    {
      plan: restaurant.plan,
      is_trial: restaurant.isTrial,
      trial_ends_at: restaurant.trialEndsAt,
      created_at: restaurant.createdAt,
    },
    now,
  );

  const ends = resolved.trialEndsAt ? Date.parse(resolved.trialEndsAt) : Number.NaN;
  const hasEnd = Number.isFinite(ends);
  const isTrial = resolved.isTrial && hasEnd;

  if (!isTrial || !hasEnd) {
    return { isTrial: false, expired: false, remainingMs: 0, trialEndsAt: hasEnd ? ends : null };
  }

  const remainingMs = Math.max(0, ends - now);
  return {
    isTrial: true,
    expired: remainingMs <= 0,
    remainingMs,
    trialEndsAt: ends,
  };
}
