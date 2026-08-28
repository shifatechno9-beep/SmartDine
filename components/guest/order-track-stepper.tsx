"use client";

import { useLocale } from "@/components/locale-provider";
import { textFor } from "@/lib/menu";
import type { KitchenTicket, TicketStatus } from "@/lib/tickets";

const STEPS = [
  "guest.track.placed",
  "guest.track.preparing",
  "guest.track.ready",
] as const;

function activeStepIndex(status: TicketStatus) {
  if (status === "new") {
    return 0;
  }
  if (status === "progress") {
    return 1;
  }
  if (status === "ready") {
    return 2;
  }
  return 3;
}

function orderLabel(ticket: KitchenTicket, locale: Parameters<typeof textFor>[1]) {
  const [first, ...rest] = ticket.items;
  if (!first) {
    return "";
  }

  const name = textFor(first.title, locale);
  if (rest.length > 0) {
    return `${name} +${rest.length}`;
  }
  if (first.quantity > 1) {
    return `${first.quantity}× ${name}`;
  }
  return name;
}

export function OrderTrackStepper({ ticket }: { ticket: KitchenTicket }) {
  const { t, locale } = useLocale();
  const current = activeStepIndex(ticket.status);
  const label = orderLabel(ticket, locale);
  const statusLabel =
    current === 0
      ? t("guest.track.placed")
      : current === 1
        ? t("guest.track.preparing")
        : current === 2
          ? t("guest.track.ready")
          : "";

  return (
    <div className="rounded-xl border border-border bg-subtle px-3 py-3" aria-live="polite">
      {label ? (
        <p className="mb-2 flex min-w-0 items-center gap-1.5 text-xs leading-5">
          <span className="truncate font-medium">{label}</span>
          {statusLabel ? (
            <>
              <span className="shrink-0 text-muted">·</span>
              <span className="shrink-0 font-medium text-emerald-600 dark:text-emerald-400">
                {statusLabel}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
      <ol className="grid grid-cols-3 gap-1">
        {STEPS.map((labelKey, index) => {
          const done = current >= index;
          return (
            <li key={labelKey} className="flex flex-col items-center text-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={`h-0.5 flex-1 ${current >= index ? "bg-emerald-500" : "bg-border"}`}
                  />
                ) : (
                  <span className="flex-1" />
                )}
                <span
                  className={`size-3 shrink-0 rounded-full border-2 ${
                    done
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-border bg-background"
                  }`}
                />
                {index < STEPS.length - 1 ? (
                  <span
                    className={`h-0.5 flex-1 ${current > index ? "bg-emerald-500" : "bg-border"}`}
                  />
                ) : (
                  <span className="flex-1" />
                )}
              </div>
              <p
                className={`mt-2 text-[10px] leading-4 font-medium ${
                  done ? "text-emerald-600 dark:text-emerald-400" : "text-muted"
                }`}
              >
                {t(labelKey)}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
