import Link from "next/link";

export function Logo({ href = "/" }: { href?: React.ComponentProps<typeof Link>["href"] }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="relative flex size-6 items-center justify-center rounded-md bg-foreground">
        <span className="size-2 rounded-full bg-background" />
        <span className="absolute inset-[5px] rounded-[3px] border border-background/70" />
      </span>
      <span className="text-[15px] font-medium tracking-tight">SmartDine</span>
    </Link>
  );
}
