import Image from "next/image";
import Link from "next/link";
import { BRAND_MARK_SRC, BRAND_NAME } from "@/lib/brand";

export function Logo({ href = "/" }: { href?: React.ComponentProps<typeof Link>["href"] }) {
  return (
    <Link href={href} className="group flex items-center gap-2">
      <Image
        src={BRAND_MARK_SRC}
        alt=""
        width={36}
        height={36}
        className="size-9 object-contain"
        priority
      />
      <span className="brand-gradient-text font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-[0.02em]">
        {BRAND_NAME}
      </span>
    </Link>
  );
}
