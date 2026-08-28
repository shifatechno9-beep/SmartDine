"use client";

import { BRAND_NAME } from "@/lib/brand";
import { formatMad } from "@/lib/i18n";
import { textFor } from "@/lib/menu";
import { displayOrderId } from "@/lib/mappers";
import type { KitchenTicket } from "@/lib/tickets";

const LABELS = {
  orderId: "رقم الطلب",
  table: "الطاولة",
  walkIn: "بدون طاولة",
  total: "المجموع",
  time: "الوقت",
  notes: "ملاحظات",
} as const;

function formatReceiptTime(createdAt: number) {
  return new Intl.DateTimeFormat("ar-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

export function KitchenPrintReceipt({
  ticket,
  restaurantName,
}: {
  ticket: KitchenTicket | null;
  restaurantName: string;
}) {
  if (!ticket) {
    return null;
  }

  return (
    <div className="kitchen-print-receipt" dir="rtl" lang="ar" aria-hidden>
      <div className="kitchen-print-receipt__inner">
        <header className="kitchen-print-receipt__header">
          <p className="kitchen-print-receipt__brand">{restaurantName || BRAND_NAME}</p>
          <p className="kitchen-print-receipt__meta">
            <span>{LABELS.orderId}</span>
            <span dir="ltr">{displayOrderId(ticket.id)}</span>
          </p>
          <p className="kitchen-print-receipt__meta">
            <span>{LABELS.table}</span>
            <span>{ticket.table ? ticket.table : LABELS.walkIn}</span>
          </p>
          <p className="kitchen-print-receipt__meta">
            <span>{LABELS.time}</span>
            <span dir="ltr">{formatReceiptTime(ticket.createdAt)}</span>
          </p>
        </header>

        <div className="kitchen-print-receipt__rule" />

        <ul className="kitchen-print-receipt__items">
          {ticket.items.map((item, index) => (
            <li key={`${ticket.id}-${item.dishId}-${index}`} className="kitchen-print-receipt__item">
              <span className="kitchen-print-receipt__qty" dir="ltr">
                {item.quantity}×
              </span>
              <span className="kitchen-print-receipt__name">{textFor(item.title, "ar")}</span>
              <span className="kitchen-print-receipt__price" dir="ltr">
                {formatMad(item.price * item.quantity, "ar")}
              </span>
            </li>
          ))}
        </ul>

        <div className="kitchen-print-receipt__rule" />

        <p className="kitchen-print-receipt__total">
          <span>{LABELS.total}</span>
          <span dir="ltr">{formatMad(ticket.total, "ar")}</span>
        </p>

        {ticket.notes ? (
          <>
            <div className="kitchen-print-receipt__rule" />
            <p className="kitchen-print-receipt__notes">
              <span className="kitchen-print-receipt__notes-label">{LABELS.notes}</span>
              {ticket.notes}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
