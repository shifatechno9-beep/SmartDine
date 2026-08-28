"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { orderFromPayload, orderItemsToJson, STATUS_TO_DB } from "@/lib/mappers";
import { getSupabase } from "@/lib/supabase";
import type { KitchenTicket, KitchenTicketItem, TicketStatus } from "@/lib/tickets";
import type { OrderStorageStatus } from "@/lib/order-storage";

export type OrdersMode = "all" | "board" | "today" | "guest" | "none";

type UseOrdersOptions = {
  onIncoming?: (ticket: KitchenTicket) => void;
  mode?: OrdersMode;
  sinceMs?: number;
  table?: string;
};

const ACTIVE_STATUSES = ["pending", "preparing", "ready"] as const;
const ORDER_COLUMNS =
  "id, restaurant_id, table_number, items, status, storage_status, total_amount, notes, created_at";

function startOfLocalDay(at = Date.now()) {
  const start = new Date(at);
  start.setHours(0, 0, 0, 0);
  return start;
}

function ticketInScope(
  ticket: KitchenTicket,
  mode: OrdersMode,
  sinceMs?: number,
  table?: string,
) {
  if (mode === "none") {
    return false;
  }
  if (mode === "guest") {
    return ticket.status !== "complete" && Boolean(table) && ticket.table === table;
  }
  if (mode === "all") {
    return true;
  }

  const dayStart = sinceMs && sinceMs > 0 ? sinceMs : startOfLocalDay().getTime();
  if (mode === "today") {
    return ticket.createdAt >= dayStart;
  }

  return ticket.status !== "complete" || ticket.createdAt >= dayStart;
}

export function useOrders(
  restaurantId: string | null,
  restaurantSlug: string,
  options?: UseOrdersOptions,
) {
  const mode = options?.mode ?? "all";
  const sinceMs = options?.sinceMs;
  const table = options?.table?.trim() || undefined;
  const [orders, setOrders] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(mode !== "none");
  const [error, setError] = useState<string | null>(null);
  const onIncomingRef = useRef(options?.onIncoming);

  useEffect(() => {
    onIncomingRef.current = options?.onIncoming;
  }, [options?.onIncoming]);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || mode === "none") {
      await Promise.resolve();
      setOrders([]);
      setLoading(false);
      return;
    }

    if (!restaurantId) {
      setOrders([]);
      setLoading(true);
      return;
    }

    const mapRows = (data: unknown[] | null) =>
      (data ?? [])
        .map((row) => orderFromPayload(row, restaurantSlug))
        .filter((ticket): ticket is KitchenTicket => Boolean(ticket));

    if (mode === "guest") {
      if (!table) {
        setOrders([]);
        setError(null);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .eq("restaurant_id", restaurantId)
        .eq("table_number", table)
        .in("status", [...ACTIVE_STATUSES])
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setOrders(mapRows(data));
      setError(null);
      setLoading(false);
      return;
    }

    if (mode === "board") {
      const since = startOfLocalDay().toISOString();
      const [active, completed] = await Promise.all([
        supabase
          .from("orders")
          .select(ORDER_COLUMNS)
          .eq("restaurant_id", restaurantId)
          .in("status", [...ACTIVE_STATUSES])
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(ORDER_COLUMNS)
          .eq("restaurant_id", restaurantId)
          .eq("status", "completed")
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
      ]);

      if (active.error || completed.error) {
        setError(active.error?.message ?? completed.error?.message ?? null);
        setLoading(false);
        return;
      }

      setOrders([...mapRows(active.data), ...mapRows(completed.data)]);
      setError(null);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (mode === "today") {
      query = query.gte("created_at", startOfLocalDay(sinceMs).toISOString());
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setOrders(mapRows(data));
    setError(null);
    setLoading(false);
  }, [mode, restaurantId, restaurantSlug, sinceMs, table]);

  useEffect(() => {
    if (mode === "none" || (mode === "guest" && !table)) {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode, refresh]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !restaurantId || mode === "none" || (mode === "guest" && !table)) {
      return;
    }

    const channel = supabase
      .channel(`orders:${restaurantId}:${mode}${table ? `:${table}` : ""}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id =
              payload.old && typeof payload.old === "object" && "id" in payload.old
                ? String(payload.old.id)
                : "";
            if (id) {
              setOrders((current) => current.filter((order) => order.id !== id));
            }
            return;
          }

          const ticket = orderFromPayload(payload.new, restaurantSlug);
          if (!ticket) {
            void refresh();
            return;
          }

          if (!ticketInScope(ticket, mode, sinceMs, table)) {
            setOrders((current) => current.filter((order) => order.id !== ticket.id));
            return;
          }

          if (payload.eventType === "INSERT") {
            setOrders((current) => {
              if (current.some((order) => order.id === ticket.id)) {
                return current;
              }
              return [ticket, ...current];
            });
            onIncomingRef.current?.(ticket);
            return;
          }

          setOrders((current) => {
            const exists = current.some((order) => order.id === ticket.id);
            if (!exists) {
              return [ticket, ...current];
            }
            return current.map((order) => (order.id === ticket.id ? ticket : order));
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [mode, refresh, restaurantId, restaurantSlug, sinceMs, table]);

  const setStatus = useCallback(
    async (id: string, status: TicketStatus) => {
      const supabase = getSupabase();
      if (!supabase || !restaurantId) {
        return;
      }

      let previous: TicketStatus | undefined;
      setOrders((current) => {
        previous = current.find((order) => order.id === id)?.status;
        return current.map((order) => (order.id === id ? { ...order, status } : order));
      });

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: STATUS_TO_DB[status] })
        .eq("id", id)
        .eq("restaurant_id", restaurantId);

      if (updateError) {
        setError(updateError.message);
        setOrders((current) =>
          current.map((order) =>
            order.id === id && previous ? { ...order, status: previous } : order,
          ),
        );
        return;
      }

      setError(null);
    },
    [restaurantId],
  );

  const setStorageStatus = useCallback(
    async (id: string, storageStatus: OrderStorageStatus) => {
      const supabase = getSupabase();
      if (!supabase || !restaurantId) {
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
        setError(updateError.message);
        setOrders((current) =>
          current.map((order) =>
            order.id === id ? { ...order, storageStatus: previous ?? null } : order,
          ),
        );
        return;
      }

      setError(null);
    },
    [restaurantId],
  );

  const createOrder = useCallback(
    async (input: {
      table?: string;
      items: KitchenTicketItem[];
      notes?: string;
    }) => {
      const supabase = getSupabase();
      if (!supabase || !restaurantId) {
        throw new Error("Supabase is not configured.");
      }

      if (input.items.length === 0) {
        throw new Error("empty");
      }

      const total = input.items.reduce(
        (sum, item) => sum + Math.max(0, item.price) * Math.max(1, item.quantity),
        0,
      );

      const { data, error: insertError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_number: input.table ?? null,
          items: orderItemsToJson(input.items),
          status: "pending",
          total_amount: total,
          notes: input.notes || null,
        })
        .select("id")
        .single();

      if (insertError || !data?.id) {
        throw insertError ?? new Error("insert");
      }

      if (mode !== "none") {
        await refresh();
      }

      return data.id;
    },
    [mode, refresh, restaurantId],
  );

  return { orders, loading, error, setStatus, setStorageStatus, createOrder, refresh };
}
