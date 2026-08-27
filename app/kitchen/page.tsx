import type { Metadata } from "next";
import { KitchenView } from "@/components/kitchen-view";
import { MenuProvider } from "@/components/menu-provider";

export const metadata: Metadata = {
  title: "Kitchen",
};

export default function KitchenPage() {
  return (
    <MenuProvider>
      <KitchenView />
    </MenuProvider>
  );
}
