"use client";

import { QRCodeCanvas } from "qrcode.react";
import { QR_SCAN_AR, QR_SCAN_FR } from "@/lib/qr-card";

export function QrTentCard({
  restaurantName,
  logoUrl,
  table,
  url,
}: {
  restaurantName: string;
  logoUrl?: string;
  table: number;
  url: string;
}) {
  return (
    <article
      data-qr-card
      className="qr-card flex break-inside-avoid flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-950 shadow-[0_1px_0_rgba(10,10,10,0.04)]"
    >
      <div className="h-1.5 bg-[#0f8f8a]" />
      <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
        <header className="flex items-center gap-3">
          <RestaurantMark name={restaurantName} logoUrl={logoUrl} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight">{restaurantName}</p>
            <p className="font-mono text-[10px] tracking-[0.14em] text-zinc-500 uppercase">
              SavyDine
            </p>
          </div>
        </header>

        <div className="mt-5 text-center">
          <p
            dir="rtl"
            className="font-[family-name:var(--font-arabic)] text-xl font-semibold tracking-tight"
          >
            الطاولة {table}
          </p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight">Table {table}</p>
        </div>

        <div className="qr-plate mx-auto mt-4 flex size-[196px] items-center justify-center rounded-2xl border border-zinc-200 bg-white p-3">
          <QRCodeCanvas
            value={url}
            size={512}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
            level="H"
            marginSize={2}
            title={`${restaurantName} · Table ${table}`}
            style={{ width: 168, height: 168 }}
            className="size-[168px]"
          />
        </div>

        <div className="mt-5 text-center">
          <p
            dir="rtl"
            className="font-[family-name:var(--font-arabic)] text-base font-semibold tracking-tight"
          >
            {QR_SCAN_AR}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{QR_SCAN_FR}</p>
        </div>
      </div>
    </article>
  );
}

function RestaurantMark({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        crossOrigin="anonymous"
        className="size-11 shrink-0 rounded-xl border border-zinc-200 object-cover"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand-mark.png"
      alt=""
      aria-hidden
      className="size-11 shrink-0 object-contain"
    />
  );
}
