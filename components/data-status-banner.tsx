"use client";

import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";

export function DataStatusBanner() {
  const { t } = useLocale();
  const { configured, error, loading } = useMenu();

  if (loading) {
    return (
      <p className="rounded-lg border border-border px-4 py-3 text-sm text-muted">
        {t("data.loading")}
      </p>
    );
  }

  if (!configured || error === "setup") {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
        {t("data.setup")}
      </p>
    );
  }

  if (error === "missing") {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
        {t("data.missingRestaurant")}
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        {t("data.error")}
      </p>
    );
  }

  return null;
}
