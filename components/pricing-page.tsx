"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-header";
import { useLocale } from "@/components/locale-provider";
import { formatMad } from "@/lib/i18n";
import { PLANS, isCustomPlan } from "@/lib/plans";

export function PricingPage() {
  const { t, locale } = useLocale();

  const faqs = [
    { q: t("pricing.faq.1.q"), a: t("pricing.faq.1.a") },
    { q: t("pricing.faq.2.q"), a: t("pricing.faq.2.a") },
    { q: t("pricing.faq.3.q"), a: t("pricing.faq.3.a") },
  ] as const;

  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[72px_72px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />

      <MarketingHeader />

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-12 sm:pt-28">
          <p className="font-mono text-[11px] tracking-[0.18em] text-accent">{t("pricing.kicker")}</p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
            {t("pricing.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted text-pretty sm:text-lg">
            {t("pricing.body")}
          </p>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`flex flex-col rounded-xl border bg-background p-6 ${
                plan.highlighted
                  ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-medium tracking-tight">{t(plan.name)}</h2>
                  <p className="mt-1 text-sm text-muted">{t(plan.tag)}</p>
                </div>
                {plan.highlighted ? (
                  <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[10px] tracking-wide text-accent">
                    {t("pricing.popular")}
                  </span>
                ) : null}
              </div>
              <p className="mt-8 flex items-baseline gap-1.5">
                {isCustomPlan(plan) ? (
                  <span className="text-4xl font-medium tracking-tight">{t("pricing.custom")}</span>
                ) : (
                  <>
                    <span className="font-mono text-4xl font-medium tracking-tight tabular-nums">
                      {formatMad(plan.monthlyMad ?? 0, locale)}
                    </span>
                    <span className="text-sm text-muted">{t("pricing.monthly")}</span>
                  </>
                )}
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm leading-6">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.75} />
                    <span>{t(feature)}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/auth/register?plan=${plan.id}`}
                className={`mt-8 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium ${
                  plan.highlighted
                    ? "bg-foreground text-background"
                    : "border border-border hover:bg-subtle"
                }`}
              >
                {isCustomPlan(plan)
                  ? t("pricing.ctaEnterprise")
                  : t("pricing.cta", { plan: t(plan.name) })}
              </Link>
            </article>
          ))}
        </section>

        <p className="mx-auto max-w-6xl px-6 pb-6 text-sm text-muted">{t("pricing.note")}</p>
        <p className="mx-auto max-w-6xl px-6 pb-20 text-xs text-muted">{t("pricing.footnote")}</p>

        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-mono text-[11px] tracking-[0.18em] text-accent">
              {t("pricing.faq.kicker")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t("pricing.faq.title")}</h2>
            <dl className="mt-12 grid gap-10 sm:grid-cols-3">
              {faqs.map((item) => (
                <div key={item.q}>
                  <dt className="text-base font-medium">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
