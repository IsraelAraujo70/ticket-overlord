import { AdminTemplate } from "@/components/templates/admin-template";

export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminTemplate>{children}</AdminTemplate>;
}
