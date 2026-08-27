"use client";

import { useCallback, useEffect, useState } from "react";
import { averageRating, fetchReviews, type Review } from "@/lib/reviews";
import { getSupabase } from "@/lib/supabase";

export function useReviews(restaurantId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(Boolean(restaurantId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!restaurantId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    try {
      const next = await fetchReviews(restaurantId);
      setReviews(next);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "error");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !restaurantId) {
      return;
    }

    const channel = supabase
      .channel(`reviews:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, restaurantId]);

  return {
    reviews,
    loading,
    error,
    average: averageRating(reviews),
    refresh,
  };
}
