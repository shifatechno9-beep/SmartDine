"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { useMenu } from "@/components/menu-provider";
import { QrTentCard } from "@/components/admin/qr-tent-card";
import { FLOOR_TABLES } from "@/lib/menu";
import { type QrLayout } from "@/lib/qr-card";
import { downloadTablePng, downloadTablesPdf, previewMenuUrl } from "@/lib/qr-export";

const TABLE_COUNT_KEY = "smartdine-table-count";

function readTableCount() {
  try {
    const raw = window.localStorage.getItem(TABLE_COUNT_KEY);
    const parsed = raw ? Number(raw) : FLOOR_TABLES;
    if (Number.isFinite(parsed) && parsed >= 1) {
      return Math.min(60, Math.round(parsed));
    }
  } catch {
    // ignore
  }
  return FLOOR_TABLES;
}

const emptySubscribe = () => () => {};

export function QrGenerator() {
  const { t } = useLocale();
  const { restaurant, loading } = useMenu();
  const origin = useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => "",
  );
  const storedCount = useSyncExternalStore(emptySubscribe, readTableCount, () => FLOOR_TABLES);
  const [override, setOverride] = useState<number | null>(null);
  const [layout, setLayout] = useState<QrLayout>("tent");
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const tables = Math.min(60, Math.max(1, override ?? storedCount));
  const restaurantName = restaurant?.name ?? "";
  const restaurantSlug = restaurant?.slug ?? "";
  const logoUrl = restaurant?.logo || undefined;
  const ready = Boolean(restaurantSlug);
  const exporting = Boolean(busy);
  const siteOrigin = origin || "https://savydine.app";

  function onCountChange(value: number) {
    const next = Math.min(60, Math.max(1, value || 1));
    setOverride(next);
    window.localStorage.setItem(TABLE_COUNT_KEY, String(next));
  }

  const cardInput = {
    restaurantName,
    restaurantSlug,
    logoUrl,
    origin: siteOrigin,
  };

  async function runExport(key: string, task: () => Promise<void>) {
    if (exporting || !ready) {
      return;
    }

    setBusy(key);
    setProgress("");
    setExportError(null);
    try {
      await task();
    } catch (error) {
      console.error(error);
      setExportError(t("qr.exportError"));
    } finally {
      setBusy(null);
      setProgress("");
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">{t("qr.title")}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{t("qr.body")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted">{t("qr.tables")}</span>
            <input
              dir="ltr"
              type="number"
              min={1}
              max={60}
              value={tables}
              onChange={(event) => onCountChange(Number(event.target.value))}
              className="h-9 w-24 rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
            />
          </label>
          <div className="block">
            <span className="mb-1 block text-xs text-muted">{t("qr.layout")}</span>
            <div className="inline-flex rounded-md border border-border p-0.5">
              <button
                type="button"
                onClick={() => setLayout("tent")}
                className={`h-8 rounded-[5px] px-3 text-xs font-medium ${
                  layout === "tent" ? "bg-foreground text-background" : "text-muted"
                }`}
              >
                {t("qr.layoutTent")}
              </button>
              <button
                type="button"
                onClick={() => setLayout("sticker")}
                className={`h-8 rounded-[5px] px-3 text-xs font-medium ${
                  layout === "sticker" ? "bg-foreground text-background" : "text-muted"
                }`}
              >
                {t("qr.layoutSticker")}
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={exporting || !ready}
            onClick={() =>
              void runExport("pdf-all", () =>
                downloadTablesPdf({ ...cardInput, tables, layout }, (current, total) =>
                  setProgress(`${current}/${total}`),
                ),
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50"
          >
            <FileText className="size-4" />
            {busy === "pdf-all" && progress
              ? t("qr.exporting", { progress })
              : t("qr.downloadAllPdf")}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-subtle"
          >
            <Printer className="size-4" />
            {t("qr.print")}
          </button>
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted print:hidden">
        {ready ? t("qr.hint", { slug: restaurantSlug, n: "X" }) : loading ? t("data.loading") : t("qr.waitRestaurant")}
      </p>
      {restaurant?.logo ? (
        <p className="mt-2 text-xs text-muted print:hidden">{t("qr.logoCors")}</p>
      ) : null}
      {exportError ? (
        <p className="mt-2 text-xs text-red-600 print:hidden dark:text-red-400">{exportError}</p>
      ) : null}

      <div
        id="qr-print"
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:mt-0 print:grid-cols-2 print:gap-3"
      >
        {ready
          ? Array.from({ length: tables }, (_, index) => {
              const table = index + 1;
              const url = previewMenuUrl(siteOrigin, restaurantSlug, table);
              return (
                <div key={table} className="flex flex-col gap-2">
                  <QrTentCard
                    restaurantName={restaurantName}
                    logoUrl={logoUrl}
                    table={table}
                    url={url}
                  />
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() =>
                      void runExport(`png-${table}`, () =>
                        downloadTablePng({ ...cardInput, table }),
                      )
                    }
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border text-xs hover:bg-subtle print:hidden disabled:opacity-50"
                  >
                    <Download className="size-3.5" />
                    {busy === `png-${table}` ? t("qr.exportingPng") : t("qr.downloadPng")}
                  </button>
                </div>
              );
            })
          : null}
      </div>
    </section>
  );
}
