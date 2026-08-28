import type { Dish, DishCategory, LocalizedText } from "@/lib/menu";
import type { Json, OrderStatusDb } from "@/lib/database.types";
import { parseLocale, type Locale } from "@/lib/i18n";
import { resolveStarterTrialEnd } from "@/lib/trial";
import type { KitchenTicket, KitchenTicketItem, TicketStatus } from "@/lib/tickets";

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  currency: string;
  phone: string;
  defaultLocale: Locale;
  plan: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  suspended: boolean;
  createdAt: string;
};

export const RESTAURANT_SELECT =
  "id, name, slug, logo, currency, phone, default_locale, plan, is_trial, trial_ends_at, suspended, created_at";

export const STATUS_TO_DB: Record<TicketStatus, OrderStatusDb> = {
  new: "pending",
  progress: "preparing",
  ready: "ready",
  complete: "completed",
};

export const STATUS_FROM_DB: Record<OrderStatusDb, TicketStatus> = {
  pending: "new",
  preparing: "progress",
  ready: "ready",
  completed: "complete",
};

export function isDishCategory(value: string): value is DishCategory {
  return value === "starters" || value === "mains" || value === "drinks";
}

function finiteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseLocalized(value: Json | null | undefined, fallback = ""): LocalizedText {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      ar: String(record.ar ?? fallback),
      fr: String(record.fr ?? fallback),
      en: String(record.en ?? fallback),
    };
  }

  if (typeof value === "string" && value.trim()) {
    return { ar: value, fr: value, en: value };
  }

  return { ar: fallback, fr: fallback, en: fallback };
}

export function toDescriptionJson(value: LocalizedText): Json {
  return { ar: value.ar, fr: value.fr, en: value.en };
}

export function mapDish(row: {
  id: string;
  title_ar: string;
  title_fr: string;
  title_en: string;
  description: Json;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
}): Dish {
  return {
    id: row.id,
    title: {
      ar: row.title_ar,
      fr: row.title_fr,
      en: row.title_en,
    },
    description: parseLocalized(row.description),
    price: Math.max(0, finiteNumber(row.price, 0)),
    category: isDishCategory(row.category) ? row.category : "mains",
    imageUrl: row.image_url ?? "",
    available: row.is_available,
  };
}

export function mapRestaurant(row: {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  currency: string;
  phone?: string | null;
  default_locale?: string | null;
  plan?: string | null;
  is_trial?: boolean | null;
  trial_ends_at?: string | null;
  suspended?: boolean | null;
  created_at?: string | null;
}): Restaurant {
  const trial = resolveStarterTrialEnd(row);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo ?? "",
    currency: row.currency || "MAD",
    phone: row.phone ?? "",
    defaultLocale: parseLocale(row.default_locale),
    plan: row.plan || "starter",
    isTrial: trial.isTrial,
    trialEndsAt: trial.trialEndsAt,
    suspended: Boolean(row.suspended),
    createdAt: row.created_at ?? "",
  };
}

function mapOrderItems(value: Json): KitchenTicketItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const record = item && typeof item === "object" && !Array.isArray(item) ? item : {};
    const title = parseLocalized(
      "title" in record ? (record.title as Json) : null,
      String("name" in record ? record.name : ""),
    );

    return {
      dishId: String(record.dishId ?? record.dish_id ?? `item-${index}`),
      title,
      quantity: Math.max(1, Math.round(finiteNumber(record.quantity, 1))),
      price: Math.max(0, finiteNumber(record.price, 0)),
    };
  });
}

export function isOrderStatusDb(value: unknown): value is OrderStatusDb {
  return value === "pending" || value === "preparing" || value === "ready" || value === "completed";
}

export function mapOrder(
  row: {
    id: string;
    restaurant_id: string;
    table_number: string | null;
    items: Json;
    status: OrderStatusDb;
    total_amount: number;
    notes: string | null;
    created_at: string;
  },
  restaurantSlug: string,
): KitchenTicket {
  return {
    id: row.id,
    restaurantSlug,
    table: row.table_number ?? undefined,
    items: mapOrderItems(row.items),
    total: Math.max(0, finiteNumber(row.total_amount, 0)),
    notes: row.notes ?? "",
    status: STATUS_FROM_DB[row.status] ?? "new",
    createdAt: finiteNumber(new Date(row.created_at).getTime(), Date.now()),
    locale: "fr",
  };
}

export function orderFromPayload(value: unknown, restaurantSlug: string): KitchenTicket | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") {
    return null;
  }

  return mapOrder(
    {
      id: row.id,
      restaurant_id: String(row.restaurant_id ?? ""),
      table_number: row.table_number == null ? null : String(row.table_number),
      items: (row.items as Json) ?? [],
      status: isOrderStatusDb(row.status) ? row.status : "pending",
      total_amount: finiteNumber(row.total_amount, 0),
      notes: row.notes == null ? null : String(row.notes),
      created_at: String(row.created_at ?? new Date().toISOString()),
    },
    restaurantSlug,
  );
}

export function orderItemsToJson(items: KitchenTicketItem[]): Json {
  return items.map((item) => ({
    dishId: item.dishId,
    title: item.title,
    quantity: item.quantity,
    price: item.price,
  }));
}

export function displayOrderId(id: string) {
  return `T-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
