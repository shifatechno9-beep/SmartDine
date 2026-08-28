export type OrderStorageStatus = "paid" | "cancelled" | "changed";

export const ORDER_STORAGE_STATUSES: OrderStorageStatus[] = ["paid", "cancelled", "changed"];

export function isOrderStorageStatus(value: unknown): value is OrderStorageStatus {
  return value === "paid" || value === "cancelled" || value === "changed";
}
