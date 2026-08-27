import { getSupabase } from "@/lib/supabase";

const DISH_BUCKETS = ["dishes", "logos"] as const;

export const MAX_DISH_IMAGE_BYTES = 4 * 1024 * 1024;

export function isAllowedDishImage(file: File) {
  return file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp";
}

function imageExtension(file: File) {
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

export async function uploadDishImage(restaurantSlug: string, file: File) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("setup");
  }

  const slug = restaurantSlug.trim();
  if (!slug) {
    throw new Error("setup");
  }

  const path = `${slug}/dishes/${crypto.randomUUID()}.${imageExtension(file)}`;
  const contentType = file.type || "image/jpeg";

  for (const bucket of DISH_BUCKETS) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType,
    });
    if (!error) {
      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
  }

  throw new Error("upload");
}
