"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Database } from "@/lib/database.types";
import { DEMO_RESTAURANT_SLUG, type Dish } from "@/lib/menu";
import { mapDish, mapRestaurant, toDescriptionJson, type Restaurant } from "@/lib/mappers";
import {
  getStoredRestaurantSlug,
  subscribeRestaurantSlug,
} from "@/lib/restaurant-session";
import { loadRestaurantRow } from "@/lib/restaurants";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type MenuContextValue = {
  restaurant: Restaurant | null;
  dishes: Dish[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  addDish: (dish: Omit<Dish, "id">) => Promise<void>;
  updateDish: (id: string, patch: Partial<Dish>) => Promise<void>;
  removeDish: (id: string) => Promise<void>;
  toggleAvailable: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({
  children,
  slug,
}: {
  children: React.ReactNode;
  slug?: string;
}) {
  const configured = isSupabaseConfigured();
  const storedSlug = useSyncExternalStore(
    subscribeRestaurantSlug,
    getStoredRestaurantSlug,
    () => null,
  );
  const resolvedSlug = slug != null ? slug.trim() : (storedSlug ?? DEMO_RESTAURANT_SLUG);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      await Promise.resolve();
      setRestaurant(null);
      setDishes([]);
      setError("setup");
      setLoading(false);
      return;
    }

    const { data: restaurantRow, error: restaurantError } = await loadRestaurantRow(
      supabase,
      resolvedSlug,
    );

    if (restaurantError) {
      setError(restaurantError.message);
      setLoading(false);
      return;
    }

    if (!restaurantRow) {
      setRestaurant(null);
      setDishes([]);
      setError("missing");
      setLoading(false);
      return;
    }

    const mappedRestaurant = mapRestaurant(restaurantRow);
    const { data: dishRows, error: dishError } = await supabase
      .from("dishes")
      .select(
        "id, restaurant_id, title_ar, title_fr, title_en, description, price, category, image_url, is_available",
      )
      .eq("restaurant_id", mappedRestaurant.id)
      .order("created_at", { ascending: true });

    if (dishError) {
      setError(dishError.message);
      setLoading(false);
      return;
    }

    setRestaurant(mappedRestaurant);
    setDishes((dishRows ?? []).map(mapDish));
    setError(null);
    setLoading(false);
  }, [resolvedSlug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !restaurant?.id) {
      return;
    }

    const channel = supabase
      .channel(`dishes:${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dishes",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, restaurant?.id]);

  const addDish = useCallback(
    async (dish: Omit<Dish, "id">) => {
      const supabase = getSupabase();
      if (!supabase || !restaurant) {
        throw new Error("Supabase is not configured.");
      }

      const { error: insertError } = await supabase.from("dishes").insert({
        restaurant_id: restaurant.id,
        title_ar: dish.title.ar,
        title_fr: dish.title.fr,
        title_en: dish.title.en,
        description: toDescriptionJson(dish.description),
        price: dish.price,
        category: dish.category,
        image_url: dish.imageUrl || null,
        is_available: dish.available,
      });

      if (insertError) {
        throw insertError;
      }

      await refresh();
    },
    [refresh, restaurant],
  );

  const updateDish = useCallback(
    async (id: string, patch: Partial<Dish>) => {
      const supabase = getSupabase();
      if (!supabase || !restaurant) {
        throw new Error("Supabase is not configured.");
      }

      const payload: Database["public"]["Tables"]["dishes"]["Update"] = {};
      if (patch.title) {
        payload.title_ar = patch.title.ar;
        payload.title_fr = patch.title.fr;
        payload.title_en = patch.title.en;
      }
      if (patch.description) {
        payload.description = toDescriptionJson(patch.description);
      }
      if (patch.price !== undefined) {
        payload.price = patch.price;
      }
      if (patch.category) {
        payload.category = patch.category;
      }
      if (patch.imageUrl !== undefined) {
        payload.image_url = patch.imageUrl || null;
      }
      if (patch.available !== undefined) {
        payload.is_available = patch.available;
      }

      const { error: updateError } = await supabase
        .from("dishes")
        .update(payload)
        .eq("id", id)
        .eq("restaurant_id", restaurant.id);
      if (updateError) {
        throw updateError;
      }

      await refresh();
    },
    [refresh, restaurant],
  );

  const removeDish = useCallback(
    async (id: string) => {
      const supabase = getSupabase();
      if (!supabase || !restaurant) {
        throw new Error("Supabase is not configured.");
      }

      const { error: deleteError } = await supabase
        .from("dishes")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", restaurant.id);
      if (deleteError) {
        throw deleteError;
      }

      await refresh();
    },
    [refresh, restaurant],
  );

  const toggleAvailable = useCallback(
    async (id: string) => {
      const current = dishes.find((dish) => dish.id === id);
      if (!current) {
        return;
      }
      await updateDish(id, { available: !current.available });
    },
    [dishes, updateDish],
  );

  const value = useMemo<MenuContextValue>(
    () => ({
      restaurant,
      dishes,
      loading,
      error,
      configured,
      addDish,
      updateDish,
      removeDish,
      toggleAvailable,
      refresh,
    }),
    [
      addDish,
      configured,
      dishes,
      error,
      loading,
      refresh,
      removeDish,
      restaurant,
      toggleAvailable,
      updateDish,
    ],
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error("useMenu must be used within MenuProvider");
  }

  return context;
}
