import type { Metadata } from "next";
import { SuperAdminPanel } from "@/components/super-admin/super-admin-panel";

export const metadata: Metadata = {
  title: "Super Admin",
  robots: { index: false, follow: false },
};

export default function SuperAdminPage() {
  return <SuperAdminPanel />;
}
