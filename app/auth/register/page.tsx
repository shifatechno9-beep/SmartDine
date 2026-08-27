import type { Metadata } from "next";
import { firstQueryValue } from "@/lib/format";
import { RegisterWizard } from "@/components/register-wizard";

type RegisterPageProps = PageProps<"/auth/register">;

export const metadata: Metadata = {
  title: "Ouvrir un restaurant",
  description:
    "Créez votre restaurant SmartDine : nom, URL de menu, téléphone, langue, et tableau de bord.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const query = await searchParams;
  const plan = firstQueryValue(query.plan);

  return <RegisterWizard initialPlan={plan} />;
}
