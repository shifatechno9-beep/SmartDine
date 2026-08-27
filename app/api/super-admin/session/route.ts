import { NextResponse } from "next/server";
import {
  SUPER_ADMIN_COOKIE,
  isSuperAdminConfigured,
  secretsMatch,
  superAdminCookieValue,
  superAdminSecret,
} from "@/lib/super-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSuperAdminConfigured()) {
    return NextResponse.json({ error: "setup" }, { status: 503 });
  }

  const secret = superAdminSecret();
  if (!secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { secret?: string } = {};
  try {
    body = (await request.json()) as { secret?: string };
  } catch {
    return NextResponse.json({ error: "required" }, { status: 400 });
  }

  if (!secretsMatch(body.secret?.trim() ?? "", secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SUPER_ADMIN_COOKIE,
    value: superAdminCookieValue(secret),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SUPER_ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
