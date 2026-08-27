"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-header";
import { useLocale } from "@/components/locale-provider";
import { loginRestaurant } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginForm() {
  const { t, setLocale } = useLocale();
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<
    "required" | "email" | "credentials" | "confirm" | "norestaurant" | "setup" | "generic" | null
  >(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!configured) {
      setError("setup");
      return;
    }
    if (!email.trim() || !password) {
      setError("required");
      return;
    }
    if (!isEmail(email)) {
      setError("email");
      return;
    }

    setSubmitting(true);
    try {
      const result = await loginRestaurant(email, password);
      if (result.defaultLocale) {
        setLocale(result.defaultLocale);
      }
      router.replace("/admin/dashboard");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "generic";
      if (
        message === "required" ||
        message === "credentials" ||
        message === "confirm" ||
        message === "norestaurant" ||
        message === "setup"
      ) {
        setError(message);
      } else {
        setError("generic");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const errorMessage =
    error === "setup"
      ? t("register.setup")
      : error === "required"
        ? t("login.errorRequired")
        : error === "email"
          ? t("login.errorEmail")
          : error === "credentials"
            ? t("login.errorCredentials")
            : error === "confirm"
              ? t("login.errorConfirm")
              : error === "norestaurant"
                ? t("login.errorRestaurant")
                : error
                  ? t("login.error")
                  : null;

  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(ellipse_at_center,black_18%,transparent_70%)]"
      />
      <MarketingHeader />
      <main className="relative z-10 px-6 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-mono text-[11px] tracking-[0.18em] text-accent">{t("login.kicker")}</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {t("login.title")}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">{t("login.body")}</p>
          </div>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="rounded-xl border border-border bg-background p-6 lg:col-span-7 lg:p-8"
          >
            {!configured ? (
              <p className="mb-6 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
                {t("register.setup")}
              </p>
            ) : null}

            <div className="space-y-5">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t("login.email")}</span>
                <input
                  dir="ltr"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t("login.password")}</span>
                <input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                />
              </label>
            </div>

            {errorMessage ? (
              <p className="mt-5 text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
            ) : null}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                {t("login.noAccount")}{" "}
                <Link
                  href="/auth/register?plan=pro"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {t("cta.start")}
                </Link>
              </p>
              <button
                type="submit"
                disabled={submitting || !configured}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
              >
                {submitting ? t("login.submitting") : t("login.submit")}
                {submitting ? null : <ArrowRight className="size-4 rtl:rotate-180" />}
              </button>
            </div>
          </form>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
