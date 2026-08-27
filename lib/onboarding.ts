import type { Locale } from "@/lib/i18n";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import type { PlanId } from "@/lib/plans";
import { setStoredRestaurantSlug } from "@/lib/restaurant-session";
import { isReservedSlug, isValidSlug } from "@/lib/slug";
import { getSupabase } from "@/lib/supabase";
import { trialEndsAtIso } from "@/lib/trial";

export type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export type RegisterRestaurantInput = {
  name: string;
  slug: string;
  plan: PlanId;
  phone: string;
  defaultLocale: Locale;
  logoFile: File | null;
  ownerName: string;
  email: string;
  password: string;
};

export type RegisterRestaurantResult = {
  restaurantId: string;
  slug: string;
  needsEmailConfirm: boolean;
};

function logoExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName === "png" || fromName === "jpg" || fromName === "jpeg" || fromName === "webp") {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/png") {
    return "png";
  }
  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function checkSlugAvailability(slug: string): Promise<SlugStatus> {
  if (!isValidSlug(slug) || isReservedSlug(slug)) {
    return "invalid";
  }

  const supabase = getSupabase();
  if (!supabase) {
    return "available";
  }

  const { data, error } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
  if (error) {
    throw error;
  }

  return data ? "taken" : "available";
}

async function uploadLogo(slug: string, file: File) {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const path = `${slug}/logo.${logoExtension(file)}`;
  const { error } = await supabase.storage.from("logos").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    return null;
  }

  return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
}

export async function registerRestaurant(
  input: RegisterRestaurantInput,
): Promise<RegisterRestaurantResult> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("setup");
  }

  const name = input.name.trim();
  const slug = input.slug.trim();
  const ownerName = input.ownerName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);

  if (!name || !isValidSlug(slug) || isReservedSlug(slug)) {
    throw new Error("slug");
  }
  if (!isValidPhone(input.phone)) {
    throw new Error("phone");
  }

  const availability = await checkSlugAvailability(slug);
  if (availability === "taken") {
    throw new Error("slug");
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: ownerName,
        restaurant_slug: slug,
        restaurant_name: name,
        phone,
        default_locale: input.defaultLocale,
      },
    },
  });

  if (authError) {
    throw authError;
  }

  const logo = input.logoFile ? await uploadLogo(slug, input.logoFile) : null;
  const ownerId = authData.user?.id ?? null;

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .insert({
      name,
      slug,
      logo,
      currency: "MAD",
      plan: input.plan,
      owner_id: ownerId,
      phone,
      default_locale: input.defaultLocale,
      is_trial: input.plan === "starter",
      trial_ends_at: trialEndsAtIso(input.plan),
    })
    .select("id")
    .single();

  if (restaurantError) {
    throw restaurantError;
  }

  const { error: adminError } = await supabase.from("restaurant_admins").insert({
    restaurant_id: restaurant.id,
    user_id: ownerId,
    email,
    full_name: ownerName,
    role: "owner",
  });

  if (adminError) {
    throw adminError;
  }

  setStoredRestaurantSlug(slug);

  return {
    restaurantId: restaurant.id,
    slug,
    needsEmailConfirm: !authData.session,
  };
}
