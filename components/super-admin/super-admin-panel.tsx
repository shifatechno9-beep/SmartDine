"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocale } from "@/components/locale-provider";
import { getSupabase } from "@/lib/supabase";
import type { SuperAdminRestaurant } from "@/lib/super-admin";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";

async function superFetch(input: string, init?: RequestInit) {
  const supabase = getSupabase();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, credentials: "include", headers });
}

export function SuperAdminPanel() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<SuperAdminRestaurant[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"setup" | "unauthorized" | "schema" | "generic" | null>(null);
  const [schemaLimited, setSchemaLimited] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const response = await superFetch("/api/super-admin/restaurants");
    if (response.status === 401) {
      router.replace("/super-admin/login");
      return;
    }
    if (response.status === 503) {
      setError("setup");
      setLoading(false);
      return;
    }
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error === "schema" ? "schema" : "generic");
      setLoading(false);
      return;
    }
    const payload = (await response.json()) as {
      restaurants: SuperAdminRestaurant[];
      schemaLimited?: boolean;
    };
    setRestaurants(payload.restaurants);
    setSchemaLimited(Boolean(payload.schemaLimited));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return restaurants;
    }
    return restaurants.filter((row) =>
      [row.name, row.slug, row.email, row.phone, row.ownerName].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
  }, [query, restaurants]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const response = await superFetch(`/api/super-admin/restaurants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        router.replace("/super-admin/login");
        return;
      }
      if (!response.ok) {
        setError("generic");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await superFetch("/api/super-admin/session", { method: "DELETE" });
    await getSupabase()?.auth.signOut();
    router.replace("/super-admin/login");
  }

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function statusLabel(status: SuperAdminRestaurant["status"]) {
    if (status === "suspended") {
      return t("super.status.suspended");
    }
    if (status === "trial") {
      return t("super.status.trial");
    }
    if (status === "expired") {
      return t("super.status.expired");
    }
    return t("super.status.active");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo href="/super-admin" />
          <span className="hidden text-sm text-muted sm:inline">{t("super.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void logout()}
            className="h-9 rounded-md border border-border px-3 text-sm hover:bg-subtle"
          >
            {t("super.logout")}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{t("super.heading")}</h1>
            <p className="mt-1 text-sm text-muted">{t("super.body")}</p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("super.search")}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground sm:w-64"
          />
        </div>

        {error === "setup" ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
            {t("super.setup")}
          </p>
        ) : null}
        {error === "schema" ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {t("super.errorSchema")}
          </p>
        ) : null}
        {schemaLimited ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {t("super.schemaLimited")}
          </p>
        ) : null}
        {error === "generic" ? (
          <p className="text-sm text-red-600 dark:text-red-400">{t("super.error")}</p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted">{t("data.loading")}</p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            {t("super.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[860px] text-start text-sm">
              <thead className="border-b border-border bg-subtle text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("super.col.restaurant")}</th>
                  <th className="px-4 py-3 font-medium">{t("super.col.owner")}</th>
                  <th className="px-4 py-3 font-medium">{t("super.col.plan")}</th>
                  <th className="px-4 py-3 font-medium">{t("super.col.trial")}</th>
                  <th className="px-4 py-3 font-medium">{t("super.col.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("super.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium">{row.name}</p>
                      <p dir="ltr" className="mt-0.5 font-mono text-[11px] text-muted">
                        /menu/{row.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p>{row.ownerName || "—"}</p>
                      <p dir="ltr" className="mt-0.5 text-xs text-muted">
                        {row.email || "—"}
                      </p>
                      <p dir="ltr" className="text-xs text-muted">
                        {row.phone || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <select
                        value={isPlanId(row.plan) ? row.plan : "starter"}
                        disabled={busyId === row.id}
                        onChange={(event) =>
                          void patch(row.id, { plan: event.target.value as PlanId })
                        }
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs outline-none"
                      >
                        {PLANS.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {t(plan.name)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs">{formatDate(row.trialEndsAt)}</p>
                      {row.isTrial ? (
                        <p className="mt-0.5 text-[11px] text-muted">{t("super.trialOn")}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          row.status === "suspended"
                            ? "bg-red-500/15 text-red-600 dark:text-red-400"
                            : row.status === "expired"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : row.status === "trial"
                                ? "bg-accent/15 text-accent"
                                : "bg-subtle text-foreground"
                        }`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void patch(row.id, { extend_trial_days: 7 })}
                          className="h-8 rounded-md border border-border px-2 text-[11px] hover:bg-subtle disabled:opacity-50"
                        >
                          {t("super.extend")}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void patch(row.id, { suspended: !row.suspended })}
                          className="h-8 rounded-md border border-border px-2 text-[11px] hover:bg-subtle disabled:opacity-50"
                        >
                          {row.suspended ? t("super.activate") : t("super.suspend")}
                        </button>
                        <Link
                          href={`/menu/${row.slug}`}
                          className="inline-flex h-8 items-center rounded-md px-2 text-[11px] text-muted hover:text-foreground"
                        >
                          {t("nav.preview")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
