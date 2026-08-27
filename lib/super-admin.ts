import { createHash, createHmac, timingSafeEqual } from "crypto";
import { createPublicSupabase } from "@/lib/supabase";

export const SUPER_ADMIN_COOKIE = "smartdine_super_admin";

export type RestaurantAccessStatus = "active" | "trial" | "expired" | "suspended";

export type SuperAdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  ownerName: string;
  plan: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  suspended: boolean;
  createdAt: string;
  status: RestaurantAccessStatus;
};

function parseEmailList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function superAdminEmails() {
  return parseEmailList(process.env.SUPER_ADMIN_EMAILS);
}

export function superAdminSecret() {
  return process.env.SUPER_ADMIN_SECRET?.trim() || "";
}

export function isSuperAdminConfigured() {
  return superAdminEmails().length > 0 || Boolean(superAdminSecret());
}

export function isSuperAdminEmail(email: string | undefined | null) {
  if (!email) {
    return false;
  }
  return superAdminEmails().includes(email.trim().toLowerCase());
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

export function secretsMatch(provided: string, expected: string) {
  if (!provided || !expected) {
    return false;
  }
  return timingSafeEqual(sha256(provided), sha256(expected));
}

export function superAdminCookieValue(secret: string) {
  return createHmac("sha256", secret).update("smartdine-super-admin").digest("hex");
}

export function restaurantAccessStatus(row: {
  plan: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  suspended: boolean;
}): RestaurantAccessStatus {
  if (row.suspended) {
    return "suspended";
  }

  const ends = row.trial_ends_at ? Date.parse(row.trial_ends_at) : Number.NaN;
  const onTrial = row.is_trial || (row.plan === "starter" && Number.isFinite(ends));
  if (onTrial && Number.isFinite(ends)) {
    return ends > Date.now() ? "trial" : "expired";
  }

  return "active";
}

export async function emailFromBearer(authorization: string | null) {
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    return null;
  }

  const secret = superAdminSecret();
  if (secret && secretsMatch(token, secret)) {
    return "__secret__";
  }

  const supabase = createPublicSupabase();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) {
    return null;
  }

  return data.user.email;
}
