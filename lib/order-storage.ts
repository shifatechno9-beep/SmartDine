export type OrderStorageStatus = "paid" | "cancelled" | "changed";

export const ORDER_STORAGE_STATUSES: OrderStorageStatus[] = ["paid", "cancelled", "changed"];

export function isOrderStorageStatus(value: unknown): value is OrderStorageStatus {
  return value === "paid" || value === "cancelled" || value === "changed";
}

export function isMissingStorageStatusColumn(message: string | null | undefined) {
  if (!message) {
    return false;
  }
  const lower = message.toLowerCase();
  return lower.includes("storage_status") && (lower.includes("does not exist") || lower.includes("42703"));
}
