"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  LayoutDashboard,
  QrCode,
  Timer,
  UtensilsCrossed,
} from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-header";
import { useLocale } from "@/components/locale-provider";
import { formatMad } from "@/lib/i18n";
import { seedDishes, textFor } from "@/lib/menu";
import { PLANS, isCustomPlan } from "@/lib/plans";

export function HomePage() {
  const { t, locale } = useLocale();
  const preview = seedDishes.filter((dish) => dish.available).slice(0, 3);

  const features = [
    { icon: QrCode, title: t("landing.feature.qr.title"), body: t("landing.feature.qr.body") },
    { icon: ChefHat, title: t("landing.feature.kds.title"), body: t("landing.feature.kds.body") },
    {
      icon: LayoutDashboard,
      title: t("landing.feature.admin.title"),
      body: t("landing.feature.admin.body"),
    },
  ];

  const steps = [
    { n: "01", title: t("landing.how.1.title"), body: t("landing.how.1.body") },
    { n: "02", title: t("landing.how.2.title"), body: t("landing.how.2.body") },
    { n: "03", title: t("landing.how.3.title"), body: t("landing.how.3.body") },
  ];

  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />

      <MarketingHeader />

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28">
          <div className="mb-8 size-16 sm:size-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand-mark.png" alt="SavyDine" className="size-full object-contain drop-shadow-[0_0_24px_color-mix(in_oklab,var(--accent)_35%,transparent)]" />
          </div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-accent">
            {t("landing.kicker")}
          </p>
          <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-7xl">
            <span className="brand-gradient-text">{t("landing.title")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted text-pretty sm:text-lg">
            {t("landing.body")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/register?plan=pro"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 text-sm font-medium text-accent-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)] hover:brightness-105"
            >
              {t("cta.start")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-subtle"
            >
              {t("cta.pricing")}
            </Link>
          </div>

          <div className="mt-20 grid gap-4 lg:grid-cols-12">
            <div className="overflow-hidden rounded-xl border border-border bg-background lg:col-span-7">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-mono text-[11px] text-muted">{t("landing.mock.guest")}</span>
                <span className="size-1.5 rounded-full bg-accent" />
              </div>
              <div className="space-y-4 p-5">
                {preview.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{textFor(dish.title, locale)}</p>
                      <p className="mt-0.5 text-xs text-muted">{t("landing.mock.note")}</p>
                    </div>
                    <span className="font-mono text-sm tabular-nums">
                      {formatMad(dish.price, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl border border-border bg-subtle p-5 lg:col-span-5">
              <div>
                <p className="font-mono text-[11px] tracking-widest text-muted">
                  {t("landing.mock.kds")}
                </p>
                <p className="mt-3 text-2xl font-medium tracking-tight">
                  {t("landing.mock.tickets")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{t("landing.mock.kdsBody")}</p>
              </div>
              <Link href="/kitchen" className="mt-8 inline-flex items-center gap-2 text-sm font-medium">
                {t("cta.kitchen")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>

        <section id="product" className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-px bg-border px-0 sm:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="bg-background px-6 py-12 sm:px-8">
                <feature.icon className="size-5 text-accent" strokeWidth={1.5} />
                <h2 className="mt-5 text-base font-medium tracking-tight">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-mono text-[11px] tracking-[0.18em] text-accent">
              {t("landing.how.kicker")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t("landing.how.title")}</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3">
              {steps.map((step) => (
                <li key={step.n}>
                  <p className="font-mono text-xs text-muted">{step.n}</p>
                  <h3 className="mt-3 text-base font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-mono text-[11px] tracking-[0.18em] text-accent">
              {t("landing.pricing.kicker")}
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
              {t("landing.pricing.title")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{t("landing.pricing.body")}</p>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/auth/register?plan=${plan.id}`}
                  className={`rounded-xl border p-5 transition-colors hover:bg-subtle ${
                    plan.highlighted ? "border-accent" : "border-border"
                  }`}
                >
                  <p className="text-sm font-medium">{t(plan.name)}</p>
                  <p className="mt-3 font-mono text-2xl tabular-nums">
                    {isCustomPlan(plan) ? (
                      t("pricing.custom")
                    ) : (
                      <>
                        {formatMad(plan.monthlyMad ?? 0, locale)}
                        <span className="ms-1 text-xs text-muted">{t("pricing.monthly")}</span>
                      </>
                    )}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">{t(plan.tag)}</p>
                </Link>
              ))}
            </div>
            <Link
              href="/pricing"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium"
            >
              {t("cta.pricing")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t("landing.bottom.title")}</h2>
              <p className="mt-2 text-sm text-muted">{t("landing.bottom.body")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/register?plan=pro"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background"
              >
                {t("cta.start")}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              <Link
                href="/menu/dar-zitoun?table=12"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-subtle"
              >
                <UtensilsCrossed className="size-4" />
                {t("cta.guest")}
              </Link>
              <Link
                href="/kitchen"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-subtle"
              >
                <Timer className="size-4" />
                {t("nav.kitchen")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
