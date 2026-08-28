"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ImagePlus, Upload } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-header";
import { useLocale } from "@/components/locale-provider";
import { DEFAULT_LOCALE, LOCALES, formatMad, type Locale } from "@/lib/i18n";
import {
  checkSlugAvailability,
  mapRegisterError,
  registerRestaurant,
  type RegisterErrorCode,
  type SlugStatus,
} from "@/lib/onboarding";
import { getPlan, isCustomPlan, parsePlanId, type PlanId } from "@/lib/plans";
import { isValidPhone } from "@/lib/phone";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isReservedSlug, isValidSlug, slugify } from "@/lib/slug";

const STEPS = ["restaurant", "account", "review"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, "register.step.restaurant" | "register.step.account" | "register.step.review"> = {
  restaurant: "register.step.restaurant",
  account: "register.step.account",
  review: "register.step.review",
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RegisterWizard({ initialPlan }: { initialPlan?: string }) {
  const { t, locale, setLocale } = useLocale();
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const planId = parsePlanId(initialPlan);
  const plan = getPlan(planId);

  const [step, setStep] = useState<Step>("restaurant");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [phone, setPhone] = useState("");
  const [defaultLocale, setDefaultLocale] = useState<Locale>(locale || DEFAULT_LOCALE);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<RegisterErrorCode | null>(null);

  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (!logoFile) {
      const timer = window.setTimeout(() => setLogoPreview(null), 0);
      return () => window.clearTimeout(timer);
    }

    const url = URL.createObjectURL(logoFile);
    const timer = window.setTimeout(() => setLogoPreview(url), 0);
    return () => {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [logoFile]);

  useEffect(() => {
    const value = slug.trim();
    if (!value) {
      const timer = window.setTimeout(() => setSlugStatus("idle"), 0);
      return () => window.clearTimeout(timer);
    }

    if (!isValidSlug(value) || isReservedSlug(value)) {
      const timer = window.setTimeout(() => setSlugStatus("invalid"), 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSlugStatus("checking");
      void checkSlugAvailability(value)
        .then((status) => {
          if (!cancelled) {
            setSlugStatus(status);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSlugStatus("invalid");
          }
        });
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug]);

  const handleName = useCallback(
    (value: string) => {
      setName(value);
      if (!slugTouched) {
        setSlug(slugify(value));
      }
    },
    [slugTouched],
  );

  const restaurantReady =
    name.trim().length >= 2 && slugStatus === "available" && isValidPhone(phone);
  const accountReady =
    ownerName.trim().length >= 2 &&
    isEmail(email) &&
    password.length >= 8 &&
    password === passwordConfirm;

  const slugMessage = useMemo(() => {
    if (slugStatus === "checking") {
      return t("register.slugChecking");
    }
    if (slugStatus === "available") {
      return t("register.slugAvailable");
    }
    if (slugStatus === "taken") {
      return t("register.slugTaken");
    }
    if (slugStatus === "invalid" && slug.trim()) {
      return t("register.slugInvalid");
    }
    return t("register.slugHint");
  }, [slug, slugStatus, t]);

  async function handleSubmit() {
    setError(null);

    if (!configured) {
      setError("setup");
      return;
    }
    if (!restaurantReady) {
      setError("required");
      return;
    }
    if (!accountReady) {
      setError(password !== passwordConfirm || password.length < 8 ? "password" : "email");
      return;
    }

    setSubmitting(true);
    try {
      await registerRestaurant({
        name,
        slug,
        plan: planId,
        phone,
        defaultLocale,
        logoFile,
        ownerName,
        email,
        password,
      });
      setLocale(defaultLocale);
      router.replace("/admin/dashboard");
    } catch (caught) {
      const code = mapRegisterError(caught);
      setError(code);
      if (code === "slug" || code === "phone" || code === "required") {
        setStep("restaurant");
      } else if (
        code === "email" ||
        code === "emailTaken" ||
        code === "password" ||
        code === "rateLimit"
      ) {
        setStep("account");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingShell planId={planId}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="font-mono text-[11px] tracking-[0.18em] text-accent">{t("register.kicker")}</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t("register.title")}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">{t("register.body")}</p>

          <ol className="mt-10 space-y-4">
            {STEPS.map((item, index) => (
              <li key={item} className="flex items-center gap-3">
                <span
                  className={`flex size-7 items-center justify-center rounded-md font-mono text-[11px] ${
                    index === stepIndex
                      ? "bg-foreground text-background"
                      : index < stepIndex
                        ? "bg-accent/20 text-accent"
                        : "border border-border text-muted"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={index === stepIndex ? "text-sm font-medium" : "text-sm text-muted"}>
                  {t(STEP_LABELS[item])}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-xl border border-border bg-subtle p-5">
            <p className="font-mono text-[11px] tracking-widest text-muted">{t("register.plan")}</p>
            <p className="mt-2 text-base font-medium">{t(plan.name)}</p>
            <p className="mt-1 text-sm text-muted">{t(plan.tag)}</p>
            <p className="mt-4 font-mono text-sm tabular-nums">
              {isCustomPlan(plan) ? (
                t("pricing.custom")
              ) : (
                <>
                  {formatMad(plan.monthlyMad ?? 0, locale)}
                  <span className="ms-1 text-muted">{t("pricing.monthly")}</span>
                </>
              )}
            </p>
            <Link href="/pricing" className="mt-4 inline-block text-xs text-muted underline-offset-2 hover:underline">
              {t("cta.pricing")}
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 lg:col-span-7 lg:p-8">
          {!configured ? (
            <p className="mb-6 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
              {t("register.setup")}
            </p>
          ) : null}

          {step === "restaurant" ? (
            <div className="space-y-5">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t("register.name")}</span>
                <input
                  value={name}
                  onChange={(event) => handleName(event.target.value)}
                  autoComplete="organization"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                />
                <span className="mt-1 block text-[11px] text-muted">{t("register.nameHint")}</span>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t("register.slug")}</span>
                <div className="flex overflow-hidden rounded-md border border-border focus-within:border-foreground">
                  <span className="hidden items-center bg-subtle px-3 font-mono text-[11px] text-muted sm:inline-flex">
                    savydine.app/menu/
                  </span>
                  <input
                    dir="ltr"
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(slugify(event.target.value));
                    }}
                    className="h-10 min-w-0 flex-1 bg-background px-3 font-mono text-sm outline-none"
                  />
                </div>
                <span
                  className={`mt-1 block text-[11px] ${
                    slugStatus === "taken" || slugStatus === "invalid"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted"
                  }`}
                >
                  {slug.trim()
                    ? t("register.slugPreview", { slug: slug || "le-pacha" })
                    : t("register.slugPreview", { slug: "le-pacha" })}
                  {" · "}
                  {slugMessage}
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t("register.phone")}</span>
                <input
                  dir="ltr"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+212 6 00 00 00 00"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                />
                <span className="mt-1 block text-[11px] text-muted">{t("register.phoneHint")}</span>
              </label>

              <fieldset>
                <legend className="mb-2 text-xs font-medium text-muted">{t("register.language")}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {LOCALES.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setDefaultLocale(item.code)}
                      className={`h-10 rounded-md border text-sm ${
                        defaultLocale === item.code
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:bg-subtle"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <span className="mt-1 block text-[11px] text-muted">{t("register.languageHint")}</span>
              </fieldset>

              <div>
                <span className="mb-1 block text-xs font-medium text-muted">{t("register.logo")}</span>
                <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-border px-4 py-4 hover:bg-subtle">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-subtle">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="" className="size-full object-cover" />
                    ) : (
                      <ImagePlus className="size-5 text-muted" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Upload className="size-3.5" />
                      {logoFile ? logoFile.name : t("register.logo")}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted">{t("register.logoHint")}</span>
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.size > 2_000_000) {
                        return;
                      }
                      setLogoFile(file);
                    }}
                  />
                </label>
                {logoFile ? (
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-foreground"
                      onClick={() => setLogoFile(null)}
                    >
                      {t("register.logoRemove")}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === "account" ? (
            <div className="space-y-5">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t("register.ownerName")}</span>
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  autoComplete="name"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">{t("register.email")}</span>
                <input
                  dir="ltr"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">{t("register.password")}</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    {t("register.passwordConfirm")}
                  </span>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    autoComplete="new-password"
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                  />
                </label>
              </div>
              <p className="text-[11px] text-muted">{t("register.passwordHint")}</p>
            </div>
          ) : null}

          {step === "review" ? (
            <dl className="divide-y divide-border rounded-xl border border-border">
              <div className="flex items-start justify-between gap-4 px-4 py-4">
                <dt className="text-xs text-muted">{t("register.plan")}</dt>
                <dd className="text-end text-sm font-medium">
                  {t(plan.name)}
                  <span className="mt-1 block font-mono text-xs font-normal text-muted">
                    {isCustomPlan(plan)
                      ? t("pricing.custom")
                      : `${formatMad(plan.monthlyMad ?? 0, locale)} ${t("pricing.monthly")}`}
                  </span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-4">
                <dt className="text-xs text-muted">{t("register.reviewName")}</dt>
                <dd className="text-end text-sm font-medium">{name}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-4">
                <dt className="text-xs text-muted">{t("register.reviewUrl")}</dt>
                <dd dir="ltr" className="text-end font-mono text-xs">
                  {t("register.slugPreview", { slug })}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-4">
                <dt className="text-xs text-muted">{t("register.reviewPhone")}</dt>
                <dd dir="ltr" className="text-end font-mono text-xs">
                  {phone}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-4">
                <dt className="text-xs text-muted">{t("register.reviewLanguage")}</dt>
                <dd className="text-end text-sm font-medium">
                  {LOCALES.find((item) => item.code === defaultLocale)?.label ?? defaultLocale}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 px-4 py-4">
                <dt className="text-xs text-muted">{t("register.reviewOwner")}</dt>
                <dd className="text-end text-sm">
                  <span className="font-medium">{ownerName}</span>
                  <span className="mt-1 block text-xs text-muted">{email}</span>
                </dd>
              </div>
            </dl>
          ) : null}

          {error ? (
            <p className="mt-5 text-xs text-red-600 dark:text-red-400">
              {error === "setup"
                ? t("register.setup")
                : error === "slug"
                  ? t("register.errorSlug")
                  : error === "password"
                    ? t("register.errorPassword")
                    : error === "phone"
                      ? t("register.errorPhone")
                      : error === "email"
                        ? t("register.errorEmail")
                        : error === "emailTaken"
                          ? t("register.errorEmailTaken")
                          : error === "rateLimit"
                            ? t("register.errorRateLimit")
                            : error === "required"
                          ? t("register.errorRequired")
                          : t("register.error")}
            </p>
          ) : null}

          <p className="mt-6 text-sm text-muted">
            {t("register.hasAccount")}{" "}
            <Link href="/auth/login" className="font-medium text-foreground underline-offset-2 hover:underline">
              {t("cta.login")}
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-between gap-3">
            {step === "restaurant" ? (
              <Link href="/pricing" className="text-sm text-muted hover:text-foreground">
                {t("register.back")}
              </Link>
            ) : (
              <button
                type="button"
                className="text-sm text-muted hover:text-foreground"
                onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)])}
              >
                {t("register.back")}
              </button>
            )}
            {step === "review" ? (
              <button
                type="button"
                disabled={submitting || !configured}
                onClick={() => void handleSubmit()}
                className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
              >
                {submitting ? t("register.submitting") : t("register.submit")}
              </button>
            ) : (
              <button
                type="button"
                disabled={step === "restaurant" ? !restaurantReady : !accountReady}
                onClick={() => {
                  if (step === "restaurant" && !restaurantReady) {
                    setError(isValidPhone(phone) ? "required" : "phone");
                    return;
                  }
                  if (step === "account" && !accountReady) {
                    if (ownerName.trim().length < 2) {
                      setError("required");
                    } else if (!isEmail(email)) {
                      setError("email");
                    } else {
                      setError("password");
                    }
                    return;
                  }
                  setError(null);
                  setStep(STEPS[Math.min(STEPS.length - 1, stepIndex + 1)]);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
              >
                {t("register.next")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}

function OnboardingShell({ children, planId }: { children: React.ReactNode; planId: PlanId }) {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(ellipse_at_center,black_18%,transparent_70%)]"
      />
      <MarketingHeader
        primaryHref={`/auth/register?plan=${planId}`}
        primaryLabel={undefined}
      />
      <main className="relative z-10 px-6 py-12 sm:py-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
