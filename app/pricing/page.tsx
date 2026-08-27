import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing-page";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Offres SmartDine pour les restaurants au Maroc. Starter, Pro et Enterprise, facturés en MAD par mois.",
};

export default function PricingRoute() {
  return <PricingPage />;
}
