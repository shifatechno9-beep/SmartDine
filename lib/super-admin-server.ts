import { NextResponse } from "next/server";
import {
  SUPER_ADMIN_COOKIE,
  emailFromBearer,
  isSuperAdminConfigured,
  isSuperAdminEmail,
  secretsMatch,
  superAdminCookieValue,
  superAdminSecret,
} from "@/lib/super-admin";
import { createServiceSupabase } from "@/lib/supabase-admin";

type AdminClient = NonNullable<ReturnType<typeof createServiceSupabase>>;

export async function requireSuperAdmin(
  request: Request,
): Promise<{ admin: AdminClient } | { error: NextResponse }> {
  if (!isSuperAdminConfigured()) {
    return { error: NextResponse.json({ error: "setup" }, { status: 503 }) };
  }

  const admin = createServiceSupabase();
  if (!admin) {
    return { error: NextResponse.json({ error: "setup" }, { status: 503 }) };
  }

  const secret = superAdminSecret();
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SUPER_ADMIN_COOKIE}=`))
    ?.slice(SUPER_ADMIN_COOKIE.length + 1);

  const cookieOk = Boolean(
    secret && cookie && secretsMatch(decodeURIComponent(cookie), superAdminCookieValue(secret)),
  );

  let identity: string | null = null;
  try {
    identity = await emailFromBearer(request.headers.get("authorization"));
  } catch {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const emailOk = identity === "__secret__" || isSuperAdminEmail(identity);

  if (!cookieOk && !emailOk) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  return { admin };
}
