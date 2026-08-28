export const QR_SCAN_AR = "سكاني هنا للطلب";
export const QR_SCAN_FR = "Scannez pour commander";

export const QR_CARD_WIDTH = 1200;
export const QR_CARD_HEIGHT = 1680;
export const QR_BRASS = "#0f8f8a";
export const QR_INK = "#0e1212";
export const QR_MUTED = "#5c6b68";
export const QR_LINE = "#cfdcd8";

export type QrLayout = "tent" | "sticker";

export type QrCardInput = {
  restaurantName: string;
  restaurantSlug: string;
  logoUrl?: string;
  table: number;
  origin: string;
};

export function menuQrUrl(origin: string, slug: string, table: number) {
  const base = (origin || "https://savydine.app").replace(/\/$/, "");
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
