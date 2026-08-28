"use client";

import { useCallback, useEffect, useState } from "react";
import { mapStoredOrder } from "@/lib/mappers";
import { isMissingStorageStatusColumn, type OrderStorageStatus } from "@/lib/order-storage";
import { getSupabase } from "@/lib/supabase";
import type { StoredOrder } from "@/lib/tickets";

const STORAGE_ORDER_COLUMNS =
  "id, restaurant_id, table_number, items, status, storage_status, total_amount, notes, created_at";

function startOfLocalDay(at = Date.now()) {
  const start = new Date(at);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function useOrdersStorage(restaurantId: string | null, restaurantSlug: string) {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(Boolean(restaurantId));
  const [error, setError] = useState<string | null>(null);
  const [schemaMissing, setSchemaMissing] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !restaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const dayStart = startOfLocalDay().toISOString();
    const { data, error: queryError } = await supabase
      .from("orders")
      .select(STORAGE_ORDER_COLUMNS)
      .eq("restaurant_id", restaurantId)
      .gte("created_at", dayStart)
      .order("created_at", { ascending: false });

    if (queryError) {
      if (isMissingStorageStatusColumn(queryError.message)) {
        setSchemaMissing(true);
        setError(null);
        setOrders([]);
        setLoading(false);
        return;
      }
      setSchemaMissing(false);
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setSchemaMissing(false);
    setError(null);
    setOrders(
      (data ?? [])
        .map((row) => mapStoredOrder(row, restaurantSlug))
        .filter((ticket): ticket is StoredOrder => Boolean(ticket)),
    );
    setLoading(false);
  }, [restaurantId, restaurantSlug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setStorageStatus = useCallback(
    async (id: string, storageStatus: OrderStorageStatus) => {
      const supabase = getSupabase();
      if (!supabase || !restaurantId || schemaMissing) {
        return;
      }

      let previous: OrderStorageStatus | null | undefined;
      setOrders((current) => {
        previous = current.find((order) => order.id === id)?.storageStatus ?? null;
        return current.map((order) =>
          order.id === id ? { ...order, storageStatus } : order,
        );
      });

      const { error: updateError } = await supabase
        .from("orders")
        .update({ storage_status: storageStatus })
        .eq("id", id)
        .eq("restaurant_id", restaurantId);

      if (updateError) {
        if (isMissingStorageStatusColumn(updateError.message)) {
          setSchemaMissing(true);
        } else {
          setError(updateError.message);
        }
        setOrders((current) =>
          current.map((order) =>
            order.id === id ? { ...order, storageStatus: previous ?? null } : order,
          ),
        );
        return;
      }

      setError(null);
    },
    [restaurantId, schemaMissing],
  );

  return { orders, loading, error, schemaMissing, setStorageStatus, refresh };
}
