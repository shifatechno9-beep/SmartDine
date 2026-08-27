import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { MenuProvider } from "@/components/menu-provider";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <MenuProvider>
      <AdminDashboard />
    </MenuProvider>
  );
}
