import type { Locale } from "@/lib/i18n";
import type { LocalizedText } from "@/lib/menu";

export type TicketStatus = "new" | "progress" | "ready" | "complete";

export type KitchenTicketItem = {
  dishId: string;
  title: LocalizedText;
  quantity: number;
  price: number;
};

export type KitchenTicket = {
  id: string;
  restaurantSlug: string;
  table?: string;
  items: KitchenTicketItem[];
  total: number;
  notes: string;
  status: TicketStatus;
  createdAt: number;
  locale: Locale;
};

export const BOARD_COLUMNS: {
  key: TicketStatus;
  label: "kitchen.new" | "kitchen.progress" | "kitchen.ready";
}[] = [
  { key: "new", label: "kitchen.new" },
  { key: "progress", label: "kitchen.progress" },
  { key: "ready", label: "kitchen.ready" },
];
