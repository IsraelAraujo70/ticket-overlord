import { AdminHeader } from "@/components/organisms/admin-header";
import { AppSidebar } from "@/components/organisms/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function AdminTemplate({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 68)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex min-w-0 flex-1 flex-col overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
