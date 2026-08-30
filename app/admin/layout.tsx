import type { Metadata } from "next";
import { isAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KALPAYANA - ADMIN",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const authed = await isAdmin();
  if (!authed) return <LoginForm configured={!!process.env.ADMIN_PASSWORD} />;
  return <>{children}</>;
}
