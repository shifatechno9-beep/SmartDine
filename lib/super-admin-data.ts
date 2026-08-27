import type { PostgrestError } from "@supabase/supabase-js";
import { restaurantAccessStatus, type SuperAdminRestaurant } from "@/lib/super-admin";
import type { createServiceSupabase } from "@/lib/supabase-admin";

type AdminClient = NonNullable<ReturnType<typeof createServiceSupabase>>;

type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  plan?: string | null;
  is_trial?: boolean | null;
  trial_ends_at?: string | null;
  suspended?: boolean | null;
  created_at: string;
};

type AdminRow = {
  restaurant_id: string;
  email: string;
  full_name: string;
  role: string;
};

const RESTAURANT_SELECTS = [
  "id, name, slug, phone, plan, is_trial, trial_ends_at, suspended, created_at",
  "id, name, slug, phone, plan, created_at",
  "id, name, slug, phone, created_at",
] as const;

export function isSchemaGap(error: PostgrestError | null | undefined) {
  if (!error) {
    return false;
  }

  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42703" ||
    code === "42P01" ||
    code === "PGRST204" ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
}

async function loadRestaurantRows(admin: AdminClient) {
  let lastError: PostgrestError | null = null;

  for (const select of RESTAURANT_SELECTS) {
    const { data, error } = await admin
      .from("restaurants")
      .select(select)
      .order("created_at", { ascending: false });

    if (!error) {
      return {
        rows: (data ?? []) as RestaurantRow[],
        schemaLimited: select !== RESTAURANT_SELECTS[0],
      };
    }

    lastError = error;
    if (!isSchemaGap(error)) {
      break;
    }
  }

  throw lastError ?? new Error("restaurants");
}

async function loadAdminRows(admin: AdminClient) {
  const { data, error } = await admin
    .from("restaurant_admins")
    .select("restaurant_id, email, full_name, role");

  if (!error) {
    return data ?? [];
  }

  if (isSchemaGap(error)) {
    return [] as AdminRow[];
  }

  throw error;
}

export async function loadSuperAdminRestaurants(admin: AdminClient) {
  const [{ rows, schemaLimited }, adminRows] = await Promise.all([
    loadRestaurantRows(admin),
    loadAdminRows(admin),
  ]);

  const adminsByRestaurant = new Map<
    string,
    { email: string; ownerName: string; role: string }[]
  >();

  for (const adminRow of adminRows) {
    const list = adminsByRestaurant.get(adminRow.restaurant_id) ?? [];
    list.push({
      email: adminRow.email,
      ownerName: adminRow.full_name,
      role: adminRow.role,
    });
    adminsByRestaurant.set(adminRow.restaurant_id, list);
  }

  const restaurants: SuperAdminRestaurant[] = rows.map((row) => {
    const admins = adminsByRestaurant.get(row.id) ?? [];
    const owner = admins.find((item) => item.role === "owner") ?? admins[0];
    const isTrial = Boolean(row.is_trial);
    const suspended = Boolean(row.suspended);
    const plan = row.plan || "starter";

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      phone: row.phone ?? "",
      email: owner?.email ?? "",
      ownerName: owner?.ownerName ?? "",
      plan,
      isTrial,
      trialEndsAt: row.trial_ends_at ?? null,
      suspended,
      createdAt: row.created_at,
      status: restaurantAccessStatus({
        plan,
        is_trial: isTrial,
        trial_ends_at: row.trial_ends_at ?? null,
        suspended,
      }),
    };
  });

  return { restaurants, schemaLimited };
}
