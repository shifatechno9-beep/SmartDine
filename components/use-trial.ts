"use client";

import { useSyncExternalStore } from "react";
import { useMenu } from "@/components/menu-provider";
import { getTrialSnapshot } from "@/lib/trial";

let cachedNow = 0;

function subscribeNow(onChange: () => void) {
  cachedNow = Date.now();
  const id = window.setInterval(() => {
    cachedNow = Date.now();
    onChange();
  }, 1000);
  return () => window.clearInterval(id);
}

function getNow() {
  if (cachedNow === 0) {
    cachedNow = Date.now();
  }
  return cachedNow;
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
