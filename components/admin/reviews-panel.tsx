"use client";

import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { useReviews } from "@/components/use-reviews";
import { DataStatusBanner } from "@/components/data-status-banner";
import { StarRating } from "@/components/guest/star-rating";
import { ratingCounts } from "@/lib/reviews";

export function ReviewsPanel() {
  const { t, locale } = useLocale();
  const { restaurant } = useMenu();
  const { reviews, loading, error, average } = useReviews(restaurant?.id ?? null);
  const counts = ratingCounts(reviews);
  const maxCount = Math.max(1, ...counts);

  return (
    <section>
      <div className="mb-5">
        <DataStatusBanner />
      </div>
      <div>
        <h2 className="text-sm font-medium">{t("reviews.heading")}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">{t("reviews.body")}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
        <article className="rounded-xl border border-border p-5">
          <p className="text-xs text-muted">{t("reviews.average")}</p>
          <p className="mt-2 font-mono text-4xl font-semibold tabular-nums">
            {loading ? "—" : average.toFixed(1)}
          </p>
          <div className="mt-2">
            <StarRating value={Math.round(average)} label={t("reviews.average")} size="sm" />
          </div>
          <p className="mt-3 text-xs text-muted">
            {t("reviews.count", { count: reviews.length })}
          </p>
          <ul className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <li key={star} className="flex items-center gap-2 text-[11px] text-muted">
                <span className="w-3 font-mono tabular-nums">{star}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(counts[star - 1] / maxCount) * 100}%` }}
                  />
                </span>
                <span className="w-5 text-end font-mono tabular-nums">{counts[star - 1]}</span>
              </li>
            ))}
          </ul>
        </article>

        <div>
          {error ? (
            <p className="rounded-xl border border-red-500/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {t("data.error")}
            </p>
          ) : loading ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              {t("data.loading")}
            </p>
          ) : reviews.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
              {t("reviews.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <StarRating value={review.rating} label={`${review.rating}`} size="sm" />
                    <p className="font-mono text-[11px] text-muted tabular-nums">
                      {new Intl.DateTimeFormat(
                        locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-MA",
                        { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
                      ).format(review.createdAt)}
                    </p>
                  </div>
                  {review.table ? (
                    <p className="mt-2 text-xs text-muted">{t("kitchen.table", { n: review.table })}</p>
                  ) : null}
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-6">{review.comment}</p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">{t("reviews.noComment")}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
