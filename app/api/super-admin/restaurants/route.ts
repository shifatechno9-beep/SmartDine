import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/super-admin-server";
import { restaurantAccessStatus, type SuperAdminRestaurant } from "@/lib/super-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requireSuperAdmin(request);
  if ("error" in gate) {
    return gate.error;
  }

  const [{ data: restaurantRows, error: restaurantError }, { data: adminRows, error: adminError }] =
    await Promise.all([
      gate.admin
        .from("restaurants")
        .select("id, name, slug, phone, plan, is_trial, trial_ends_at, suspended, created_at")
        .order("created_at", { ascending: false }),
      gate.admin.from("restaurant_admins").select("restaurant_id, email, full_name, role"),
    ]);

  if (restaurantError) {
    return NextResponse.json({ error: restaurantError.message }, { status: 500 });
  }
  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  const adminsByRestaurant = new Map<
    string,
    { email: string; ownerName: string; role: string }[]
  >();
  for (const admin of adminRows ?? []) {
    const list = adminsByRestaurant.get(admin.restaurant_id) ?? [];
    list.push({
      email: admin.email,
      ownerName: admin.full_name,
      role: admin.role,
    });
    adminsByRestaurant.set(admin.restaurant_id, list);
  }

  const restaurants: SuperAdminRestaurant[] = (restaurantRows ?? []).map((row) => {
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
      trialEndsAt: row.trial_ends_at,
      suspended,
      createdAt: row.created_at,
      status: restaurantAccessStatus({
        plan,
        is_trial: isTrial,
        trial_ends_at: row.trial_ends_at,
        suspended,
      }),
    };
  });

  return NextResponse.json({ restaurants });
}
