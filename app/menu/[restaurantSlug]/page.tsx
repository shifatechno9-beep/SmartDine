import type { Metadata } from "next";
import { firstQueryValue, titleFromSlug } from "@/lib/format";
import { DEMO_RESTAURANT_SLUG } from "@/lib/menu";
import { fetchRestaurantBySlug } from "@/lib/restaurants";
import { MenuProvider } from "@/components/menu-provider";
import { GuestMenu } from "@/components/guest-menu";

type MenuPageProps = PageProps<"/menu/[restaurantSlug]">;

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const { restaurantSlug } = await params;
  const restaurant = await fetchRestaurantBySlug(restaurantSlug);
  const name =
    restaurant?.name ??
    (restaurantSlug === DEMO_RESTAURANT_SLUG ? "Dar Zitoun" : titleFromSlug(restaurantSlug));

  return {
    title: name,
    description: `Menu ${name} — SavyDine. Arabe, français, anglais. Prix en MAD.`,
  };
}

export default async function GuestMenuPage({ params, searchParams }: MenuPageProps) {
  const { restaurantSlug } = await params;
  const query = await searchParams;
  const table = normalizeTable(firstQueryValue(query.table));

  return (
    <MenuProvider slug={restaurantSlug}>
      <GuestMenu restaurantSlug={restaurantSlug} table={table} />
    </MenuProvider>
  );
}

function normalizeTable(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().slice(0, 24);
  return trimmed.length > 0 ? trimmed : undefined;
}
