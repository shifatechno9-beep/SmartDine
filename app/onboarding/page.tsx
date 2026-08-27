import { redirect } from "next/navigation";
import { firstQueryValue } from "@/lib/format";

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const query = await searchParams;
  const plan = firstQueryValue(query.plan);
  redirect(plan ? `/auth/register?plan=${encodeURIComponent(plan)}` : "/auth/register");
}
