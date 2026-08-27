import type { User } from "@supabase/supabase-js";
import { isLocale, type Locale } from "@/lib/i18n";
import { setStoredRestaurantSlug } from "@/lib/restaurant-session";
import { getSupabase, type TypedSupabaseClient } from "@/lib/supabase";

export type LoginRestaurantResult = {
  slug: string;
  defaultLocale: Locale | null;
};

function mapAuthError(error: { message?: string; code?: string; status?: number }) {
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();

  if (code === "email_not_confirmed" || message.includes("not confirmed")) {
    return "confirm";
  }
  if (
    code === "invalid_credentials" ||
    message.includes("invalid login") ||
    message.includes("invalid credentials")
  ) {
    return "credentials";
  }

  return "generic";
}

async function restaurantById(supabase: TypedSupabaseClient, restaurantId: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("slug, default_locale")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error || !data?.slug) {
    return null;
  }

  return {
    slug: data.slug,
    defaultLocale: isLocale(data.default_locale) ? data.default_locale : null,
  };
}

async function resolveOwnerRestaurant(
  supabase: TypedSupabaseClient,
  user: User,
): Promise<LoginRestaurantResult | null> {
  const email = user.email?.trim().toLowerCase() ?? "";

  const { data: byUser } = await supabase
    .from("restaurant_admins")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byUser?.restaurant_id) {
    const restaurant = await restaurantById(supabase, byUser.restaurant_id);
    if (restaurant) {
      return restaurant;
    }
  }

  if (email) {
    const { data: byEmail } = await supabase
      .from("restaurant_admins")
      .select("id, restaurant_id, user_id")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byEmail?.restaurant_id) {
      if (!byEmail.user_id) {
        await supabase.from("restaurant_admins").update({ user_id: user.id }).eq("id", byEmail.id);
      }
      const restaurant = await restaurantById(supabase, byEmail.restaurant_id);
      if (restaurant) {
        return restaurant;
      }
    }
  }

  const { data: owned } = await supabase
    .from("restaurants")
    .select("slug, default_locale")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (owned?.slug) {
    return {
      slug: owned.slug,
      defaultLocale: isLocale(owned.default_locale) ? owned.default_locale : null,
    };
  }

  const metaSlug = user.user_metadata?.restaurant_slug;
  if (typeof metaSlug === "string" && metaSlug.trim()) {
    const { data: fromMeta } = await supabase
      .from("restaurants")
      .select("slug, default_locale")
      .eq("slug", metaSlug.trim())
      .maybeSingle();

    if (fromMeta?.slug) {
      return {
        slug: fromMeta.slug,
        defaultLocale: isLocale(fromMeta.default_locale) ? fromMeta.default_locale : null,
      };
    }

    return { slug: metaSlug.trim(), defaultLocale: null };
  }

  return null;
}

export async function loginRestaurant(
  email: string,
  password: string,
): Promise<LoginRestaurantResult> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("setup");
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    throw new Error("required");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) {
    throw new Error(mapAuthError(error));
  }

  const user = data.user;
  if (!user) {
    throw new Error("credentials");
  }

  const restaurant = await resolveOwnerRestaurant(supabase, user);
  if (!restaurant) {
    throw new Error("norestaurant");
  }

  setStoredRestaurantSlug(restaurant.slug);
  return restaurant;
}
