import { mapRestaurant, RESTAURANT_SELECT, type Restaurant } from "@/lib/mappers";
import { createPublicSupabase, type TypedSupabaseClient } from "@/lib/supabase";

const RESTAURANT_SELECT_NO_SUSPEND =
  "id, name, slug, logo, currency, phone, default_locale, plan, is_trial, trial_ends_at, created_at";
const RESTAURANT_SELECT_LEGACY =
  "id, name, slug, logo, currency, phone, default_locale, plan, created_at";

export async function loadRestaurantRow(client: TypedSupabaseClient, slug: string) {
  const trimmed = slug.trim();
  const full = await client.from("restaurants").select(RESTAURANT_SELECT).eq("slug", trimmed).maybeSingle();
  if (!full.error) {
    return full;
  }

  const mid = await client
    .from("restaurants")
    .select(RESTAURANT_SELECT_NO_SUSPEND)
    .eq("slug", trimmed)
    .maybeSingle();
  if (!mid.error) {
    return mid;
  }

  return client.from("restaurants").select(RESTAURANT_SELECT_LEGACY).eq("slug", trimmed).maybeSingle();
}

export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = createPublicSupabase();
  if (!supabase || !slug.trim()) {
    return null;
  }

  const { data, error } = await loadRestaurantRow(supabase, slug);

  if (error || !data) {
    return null;
  }

  return mapRestaurant(data);
}
