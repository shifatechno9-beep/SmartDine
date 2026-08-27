import { mapRestaurant, type Restaurant } from "@/lib/mappers";
import { createPublicSupabase } from "@/lib/supabase";

const RESTAURANT_COLUMNS = "id, name, slug, logo, currency, phone, default_locale, plan";

export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const supabase = createPublicSupabase();
  if (!supabase || !slug.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("slug", slug.trim())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRestaurant(data);
}
