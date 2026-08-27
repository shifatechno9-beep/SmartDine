"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useLocale } from "@/components/locale-provider";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SuperAdminLogin() {
  const { t } = useLocale();
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<"required" | "credentials" | "forbidden" | "setup" | "generic" | null>(
    null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!configured) {
      setError("setup");
      return;
    }

    const hasSecret = Boolean(secret.trim());
    const hasAccount = Boolean(email.trim() && password);
    if (!hasSecret && !hasAccount) {
      setError("required");
      return;
    }
    if (hasAccount && !isEmail(email)) {
      setError("required");
      return;
    }

    setSubmitting(true);
    try {
      if (hasSecret) {
        const response = await fetch("/api/super-admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ secret: secret.trim() }),
        });
        if (response.status === 503) {
          throw new Error("setup");
        }
        if (!response.ok) {
          throw new Error("forbidden");
        }
      }

      if (hasAccount) {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error("setup");
        }
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (authError) {
          throw new Error("credentials");
        }
      }

      router.replace("/super-admin");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "generic";
      if (message === "setup" || message === "credentials" || message === "forbidden" || message === "required") {
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
      ? t("super.setup")
      : error === "required"
        ? t("super.errorRequired")
        : error === "credentials"
          ? t("login.errorCredentials")
          : error === "forbidden"
            ? t("super.errorForbidden")
            : error
              ? t("super.error")
              : null;

  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(ellipse_at_center,black_18%,transparent_70%)]"
      />
      <header className="relative z-10 border-b border-border/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-md px-6 py-16">
        <p className="font-mono text-[11px] tracking-[0.18em] text-accent">{t("super.kicker")}</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("super.loginTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{t("super.loginBody")}</p>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-8 space-y-5 rounded-xl border border-border bg-background p-6"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("login.email")}</span>
            <input
              dir="ltr"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("login.password")}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("super.secret")}</span>
            <input
              dir="ltr"
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
            />
            <span className="mt-1 block text-[11px] text-muted">{t("super.secretHint")}</span>
          </label>
          {errorMessage ? (
            <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background disabled:opacity-50"
          >
            {submitting ? t("login.submitting") : t("super.submit")}
            {submitting ? null : <ArrowRight className="size-4 rtl:rotate-180" />}
          </button>
        </form>
      </main>
    </div>
  );
}
