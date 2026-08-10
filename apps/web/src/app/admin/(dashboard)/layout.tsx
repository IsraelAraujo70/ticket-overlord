import { AdminTemplate } from "@/components/templates/admin-template";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) {
    redirect("/admin/login");
  }

  return <AdminTemplate user={user}>{children}</AdminTemplate>;
}
