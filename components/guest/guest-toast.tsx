"use client";

import { Bell, Check } from "lucide-react";

export function GuestToast({
  kind,
  title,
  body,
}: {
  kind: "waiter" | "order";
  title: string;
  body: string;
}) {
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4"
    >
      <div className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
        <span
          className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full ${
            kind === "waiter" ? "bg-accent/15 text-accent" : "bg-foreground text-background"
          }`}
        >
          {kind === "waiter" ? <Bell className="size-4" /> : <Check className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{body}</p>
        </div>
      </div>
    </div>
  );
}
