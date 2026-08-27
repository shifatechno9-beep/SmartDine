import { NextResponse } from "next/server";
import { isPlanId, type PlanId } from "@/lib/plans";
import { requireSuperAdmin } from "@/lib/super-admin-server";
import { trialEndsAtIso } from "@/lib/trial";

export const runtime = "nodejs";

type PatchBody = {
  plan?: string;
  is_trial?: boolean;
  trial_ends_at?: string | null;
  extend_trial_days?: number;
  suspended?: boolean;
};

export async function PATCH(request: Request, ctx: RouteContext<"/api/super-admin/restaurants/[id]">) {
  const gate = await requireSuperAdmin(request);
  if ("error" in gate) {
    return gate.error;
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  const { data: current, error: loadError } = await gate.admin
    .from("restaurants")
    .select("id, plan, is_trial, trial_ends_at, suspended")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !current) {
    return NextResponse.json({ error: "missing" }, { status: 404 });
  }

  const patch: {
    plan?: PlanId;
    is_trial?: boolean;
    trial_ends_at?: string | null;
    suspended?: boolean;
  } = {};

  if (typeof body.suspended === "boolean") {
    patch.suspended = body.suspended;
  }

  if (body.plan !== undefined) {
    if (!isPlanId(body.plan)) {
      return NextResponse.json({ error: "plan" }, { status: 400 });
    }
    patch.plan = body.plan;
    if (body.plan === "starter") {
      patch.is_trial = body.is_trial ?? true;
      patch.trial_ends_at = body.trial_ends_at ?? trialEndsAtIso("starter");
    } else {
      patch.is_trial = false;
      patch.trial_ends_at = null;
    }
  }

  if (typeof body.is_trial === "boolean" && patch.plan === undefined) {
    patch.is_trial = body.is_trial;
    if (!body.is_trial) {
      patch.trial_ends_at = null;
    }
  }

  if (body.trial_ends_at !== undefined && body.extend_trial_days === undefined) {
    patch.trial_ends_at = body.trial_ends_at;
    if (body.trial_ends_at) {
      patch.is_trial = true;
    }
  }

  if (typeof body.extend_trial_days === "number" && Number.isFinite(body.extend_trial_days)) {
    const days = Math.min(90, Math.max(1, Math.round(body.extend_trial_days)));
    const currentEnd = current.trial_ends_at ? Date.parse(current.trial_ends_at) : 0;
    const base = Math.max(Date.now(), Number.isFinite(currentEnd) ? currentEnd : 0);
    patch.trial_ends_at = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
    patch.is_trial = true;
    if (!patch.plan && current.plan !== "starter") {
      patch.plan = "starter";
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  const { error: updateError } = await gate.admin.from("restaurants").update(patch).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
