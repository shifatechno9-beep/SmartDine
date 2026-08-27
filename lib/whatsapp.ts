import { formatMad } from "@/lib/i18n";
import { textFor, type LocalizedText } from "@/lib/menu";
import { whatsappDigits } from "@/lib/phone";

export type WhatsAppOrderLine = {
  title: LocalizedText;
  quantity: number;
  price: number;
};

export type WhatsAppOrderInput = {
  restaurantName: string;
  phone: string;
  table?: string;
  items: WhatsAppOrderLine[];
  total: number;
  notes?: string;
};

function dualMad(amount: number) {
  return `${formatMad(amount, "fr")} / ${formatMad(amount, "ar")}`;
}

export function buildWhatsAppOrderMessage(input: WhatsAppOrderInput) {
  const tableAr = input.table ? `الطاولة ${input.table}` : "بدون طاولة";
  const tableFr = input.table ? `Table ${input.table}` : "Sans table";
  const lines = input.items.map((item) => {
    const ar = textFor(item.title, "ar") || textFor(item.title, "fr");
    const fr = textFor(item.title, "fr") || textFor(item.title, "en");
    return `• ${item.quantity}× ${fr} / ${ar} — ${dualMad(item.price * item.quantity)}`;
  });

  const notes = input.notes?.trim()
    ? `\n\nNotes / ملاحظات:\n${input.notes.trim()}`
    : "";

  return [
    "*SmartDine — Nouvelle commande / طلب جديد*",
    input.restaurantName,
    "",
    `🪑 ${tableFr} / ${tableAr}`,
    "",
    "*Articles / الأطباق:*",
    ...lines,
    "",
    `*Total / المجموع: ${dualMad(input.total)}*`,
    notes,
  ].join("\n").trim();
}

export function buildWhatsAppOrderUrl(input: WhatsAppOrderInput) {
  const digits = whatsappDigits(input.phone);
  if (!digits || input.items.length === 0) {
    return null;
  }

  const text = encodeURIComponent(buildWhatsAppOrderMessage(input));
  return `https://wa.me/${digits}?text=${text}`;
}

export function openWhatsApp(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(opened);
}
