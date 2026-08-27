import { getSupabase } from "@/lib/supabase";

export type Review = {
  id: string;
  restaurantId: string;
  rating: number;
  comment: string;
  table?: string;
  createdAt: number;
};

export function mapReview(row: {
  id: string;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  table_number: string | null;
  created_at: string;
}): Review {
  const rating = Math.min(5, Math.max(1, Math.round(Number(row.rating) || 1)));
  const createdAt = Date.parse(row.created_at);
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    rating,
    comment: (row.comment ?? "").trim(),
    table: row.table_number ?? undefined,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
}

export function averageRating(reviews: Review[]) {
  if (reviews.length === 0) {
    return 0;
  }
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function ratingCounts(reviews: Review[]) {
  const counts = [0, 0, 0, 0, 0];
  for (const review of reviews) {
    counts[review.rating - 1] += 1;
  }
  return counts;
}

export async function fetchReviews(restaurantId: string): Promise<Review[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("setup");
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("id, restaurant_id, rating, comment, table_number, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapReview);
}

export async function submitReview(input: {
  restaurantId: string;
  rating: number;
  comment?: string;
  table?: string;
}) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("setup");
  }

  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const { error } = await supabase.from("reviews").insert({
    restaurant_id: input.restaurantId,
    rating,
    comment: input.comment?.trim() || null,
    table_number: input.table || null,
  });

  if (error) {
    throw error;
  }
}
