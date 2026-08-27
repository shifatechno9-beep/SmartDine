import type { Metadata } from "next";
import { SuperAdminLogin } from "@/components/super-admin/super-admin-login";

export const metadata: Metadata = {
  title: "Super Admin",
  robots: { index: false, follow: false },
};

export default function SuperAdminLoginPage() {
  return <SuperAdminLogin />;
}
