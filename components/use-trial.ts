"use client";

import { useSyncExternalStore } from "react";
import { useMenu } from "@/components/menu-provider";
import { getTrialSnapshot } from "@/lib/trial";

function subscribeNow(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

function getNow() {
  return Date.now();
}

export function useTrial() {
  const { restaurant, loading } = useMenu();
  const now = useSyncExternalStore(subscribeNow, getNow, getNow);
  const snapshot = getTrialSnapshot(restaurant, now);
  return {
    loading,
    restaurant,
    suspended: Boolean(restaurant?.suspended),
    locked: Boolean(restaurant?.suspended) || snapshot.expired,
    ...snapshot,
  };
}
