import { NextResponse } from "next/server";
import { loadSuperAdminRestaurants } from "@/lib/super-admin-data";
import { requireSuperAdmin } from "@/lib/super-admin-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requireSuperAdmin(request);
  if ("error" in gate) {
    return gate.error;
  }

  try {
    const { restaurants, schemaLimited } = await loadSuperAdminRestaurants(gate.admin);
    return NextResponse.json({ restaurants, schemaLimited });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ error: "schema", detail: message }, { status: 500 });
  }
}
