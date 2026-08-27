export const QR_SCAN_AR = "سكاني هنا للطلب";
export const QR_SCAN_FR = "Scannez pour commander";

export const QR_CARD_WIDTH = 1200;
export const QR_CARD_HEIGHT = 1680;
export const QR_BRASS = "#9a7348";
export const QR_INK = "#0a0a0a";
export const QR_MUTED = "#71717a";
export const QR_LINE = "#e4e4e7";

export type QrLayout = "tent" | "sticker";

export type QrCardInput = {
  restaurantName: string;
  restaurantSlug: string;
  logoUrl?: string;
  table: number;
  origin: string;
};

export function menuQrUrl(origin: string, slug: string, table: number) {
  const base = (origin || "https://smartdine.app").replace(/\/$/, "");
  const path = encodeURIComponent(slug);
  const tableParam = encodeURIComponent(String(table));
  return `${base}/menu/${path}?table=${tableParam}`;
}

export function cssFont(variable: string, fallback: string) {
  if (typeof document === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}
