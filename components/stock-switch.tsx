"use client";

export function StockSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-foreground" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-background shadow-sm transition-transform ${
          checked ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0.5 rtl:-translate-x-0.5"
        }`}
      />
    </button>
  );
}
