import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّلوا الدخول إلى لوحة تحكم مطعمكم على سافي داين.",
};

export default function LoginPage() {
  return <LoginForm />;
}
