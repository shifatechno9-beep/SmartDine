"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Star, X } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { StarRating } from "@/components/guest/star-rating";
import { submitReview } from "@/lib/reviews";
import { openWhatsApp } from "@/lib/whatsapp";

export function FeedbackModal({
  open,
  restaurantId,
  table,
  whatsappUrl,
  onClose,
}: {
  open: boolean;
  restaurantId: string;
  table?: string;
  whatsappUrl?: string | null;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    if (rating < 1 || sending) {
      setError(true);
      return;
    }

    setSending(true);
    setError(false);
    try {
      await submitReview({
        restaurantId,
        rating,
        comment,
        table,
      });
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("guest.close")}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-feedback-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-background p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="guest-feedback-title" className="text-sm font-medium">
              {done ? t("guest.rateThanks") : t("guest.rateTitle")}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              {done ? t("guest.rateThanksBody") : t("guest.rateBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-subtle"
            aria-label={t("guest.close")}
          >
            <X className="size-4" />
          </button>
        </div>

        {!done ? (
          <div className="mt-5 space-y-4">
            <StarRating value={rating} onChange={setRating} label={t("guest.rateTitle")} />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                {t("guest.rateComment")}
              </span>
              <textarea
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </label>
            {error ? (
              <p className="text-xs text-red-600 dark:text-red-400">{t("guest.rateError")}</p>
            ) : null}
            <button
              type="button"
              disabled={sending || rating < 1}
              onClick={() => void handleSubmit()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background disabled:opacity-40"
            >
              <Star className="size-4" />
              {sending ? t("guest.rateSending") : t("guest.rateSubmit")}
            </button>
          </div>
        ) : null}

        {whatsappUrl ? (
          <button
            type="button"
            onClick={() => openWhatsApp(whatsappUrl)}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-medium text-accent"
          >
            <MessageCircle className="size-4" />
            {t("guest.whatsappOpen")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
