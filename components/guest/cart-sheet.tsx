"use client";

import { useEffect } from "react";
import { Bell, Check, MessageCircle, Minus, Plus, Trash2, X } from "lucide-react";
import { formatMad } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { textFor, type Dish } from "@/lib/menu";

export type CartLine = {
  dish: Dish;
  quantity: number;
};

export function CartSheet({
  open,
  lines,
  total,
  notes,
  sending,
  confirmDisabled,
  whatsappEnabled,
  onClose,
  onAdd,
  onRemove,
  onNotesChange,
  onConfirm,
  onConfirmWhatsApp,
  onCallWaiter,
}: {
  open: boolean;
  lines: CartLine[];
  total: number;
  notes: string;
  sending: boolean;
  confirmDisabled?: boolean;
  whatsappEnabled?: boolean;
  onClose: () => void;
  onAdd: (dishId: string) => void;
  onRemove: (dishId: string) => void;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onConfirmWhatsApp?: () => void;
  onCallWaiter: () => void;
}) {
  const { t, locale } = useLocale();

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label={t("guest.close")}
        className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-cart-title"
        className="relative z-10 flex max-h-[86vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-2xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-5 py-3">
          <h2 id="guest-cart-title" className="text-sm font-medium">
            {t("guest.cart")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-subtle"
            aria-label={t("guest.close")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {lines.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              {t("guest.cartEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map(({ dish, quantity }) => (
                <li key={dish.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{textFor(dish.title, locale)}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted tabular-nums">
                      {formatMad(dish.price, locale)}
                    </p>
                    {!dish.available ? (
                      <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                        {t("guest.unavailable")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onRemove(dish.id)}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:bg-subtle"
                      aria-label={quantity <= 1 ? t("guest.remove") : t("guest.decrease")}
                    >
                      {quantity <= 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                    </button>
                    <span className="min-w-5 text-center font-mono text-xs tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={!dish.available}
                      onClick={() => onAdd(dish.id)}
                      className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:bg-subtle disabled:opacity-40"
                      aria-label={t("guest.increase")}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("guest.notes")}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder={t("guest.notesHint")}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        </div>

        <div className="space-y-2 border-t border-border px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{t("guest.total")}</span>
            <span className="font-mono text-base font-medium tabular-nums">
              {formatMad(total, locale)}
            </span>
          </div>
          <button
            type="button"
            disabled={lines.length === 0 || sending || confirmDisabled}
            onClick={onConfirm}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background disabled:opacity-40"
          >
            <Check className="size-4" />
            {sending ? t("guest.sending") : t("guest.confirm")}
          </button>
          {whatsappEnabled && onConfirmWhatsApp ? (
            <button
              type="button"
              disabled={lines.length === 0 || sending || confirmDisabled}
              onClick={onConfirmWhatsApp}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-medium text-accent disabled:opacity-40"
            >
              <MessageCircle className="size-4" />
              {sending ? t("guest.sending") : t("guest.whatsapp")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCallWaiter}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 text-sm font-medium text-accent"
          >
            <Bell className="size-4" />
            {t("guest.callWaiter")}
          </button>
        </div>
      </div>
    </div>
  );
}
