"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { StockSwitch } from "@/components/stock-switch";
import {
  CATEGORY_KEYS,
  emptyLocalized,
  type Dish,
  type DishCategory,
  type LocalizedText,
} from "@/lib/menu";

type Draft = Omit<Dish, "id">;

const blankDraft = (): Draft => ({
  title: emptyLocalized(),
  description: emptyLocalized(),
  price: 0,
  category: "starters",
  imageUrl: "",
  available: true,
});

export function DishFormModal({
  dish,
  onClose,
  onSave,
  onDelete,
}: {
  dish: Dish | null | "new";
  onClose: () => void;
  onSave: (draft: Draft, id?: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}) {
  const { t } = useLocale();
  const formId = useId();
  const isNew = dish === "new";
  const existing = dish && dish !== "new" ? dish : null;
  const [draft, setDraft] = useState<Draft>(existing ?? blankDraft());
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState<"save" | "delete" | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function patchLocalized(field: "title" | "description", code: Locale, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: { ...current[field], [code]: value },
    }));
  }

  async function handleSave() {
    const titled = LOCALES.some((item) => draft.title[item.code].trim());
    if (!titled || draft.price < 0 || Number.isNaN(draft.price)) {
      setError(true);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await onSave(
        {
          ...draft,
          title: trimLocalized(draft.title),
          description: trimLocalized(draft.description),
          imageUrl: draft.imageUrl.trim(),
          price: Number(draft.price),
        },
        existing?.id,
      );
      onClose();
    } catch {
      setSaveError("save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing || !onDelete) {
      return;
    }
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await onDelete(existing.id);
      onClose();
    } catch {
      setSaveError("delete");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t("form.cancel")}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
        onClick={saving ? undefined : onClose}
        disabled={saving}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={`${formId}-title`} className="text-sm font-medium">
            {isNew ? t("form.create") : t("form.edit")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md hover:bg-subtle"
            aria-label={t("form.cancel")}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">{t("form.title")}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {LOCALES.map((item) => (
                <label key={item.code} className="block">
                  <span className="mb-1 block text-[11px] text-muted">{item.label}</span>
                  <input
                    dir={item.code === "ar" ? "rtl" : "ltr"}
                    value={draft.title[item.code]}
                    onChange={(event) => patchLocalized("title", item.code, event.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">{t("form.description")}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {LOCALES.map((item) => (
                <label key={item.code} className="block">
                  <span className="mb-1 block text-[11px] text-muted">{item.label}</span>
                  <textarea
                    dir={item.code === "ar" ? "rtl" : "ltr"}
                    rows={4}
                    value={draft.description[item.code]}
                    onChange={(event) =>
                      patchLocalized("description", item.code, event.target.value)
                    }
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">{t("form.price")}</span>
              <input
                dir="ltr"
                type="number"
                min={0}
                step={1}
                value={draft.price}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, price: Number(event.target.value) }))
                }
                className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">{t("form.category")}</span>
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    category: event.target.value as DishCategory,
                  }))
                }
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
              >
                {CATEGORY_KEYS.map((category) => (
                  <option key={category.id} value={category.id}>
                    {t(category.label)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{t("form.image")}</span>
            <input
              dir="ltr"
              type="url"
              placeholder="https://"
              value={draft.imageUrl}
              onChange={(event) =>
                setDraft((current) => ({ ...current, imageUrl: event.target.value }))
              }
              className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-xs outline-none focus:border-foreground"
            />
            <span className="mt-1 block text-[11px] text-muted">{t("form.imageHint")}</span>
          </label>

          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">{t("form.stock")}</p>
              <p className="mt-0.5 text-xs text-muted">
                {draft.available ? t("form.stockOn") : t("form.stockOff")}
              </p>
            </div>
            <StockSwitch
              checked={draft.available}
              onChange={(available) => setDraft((current) => ({ ...current, available }))}
              label={t("form.stock")}
            />
          </div>

          {error ? <p className="text-xs text-red-600 dark:text-red-400">{t("form.required")}</p> : null}
          {saveError ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {saveError === "delete" ? t("form.deleteError") : t("form.saveError")}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          {existing && onDelete ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleDelete()}
              className="h-9 rounded-md px-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              {confirmDelete ? t("form.delete") : t("menu.delete")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-9 rounded-md border border-border px-3 text-sm hover:bg-subtle disabled:opacity-50"
            >
              {t("form.cancel")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-9 rounded-md bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50"
            >
              {saving ? t("form.saving") : t("form.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function trimLocalized(value: LocalizedText): LocalizedText {
  return {
    ar: value.ar.trim(),
    fr: value.fr.trim(),
    en: value.en.trim(),
  };
}
