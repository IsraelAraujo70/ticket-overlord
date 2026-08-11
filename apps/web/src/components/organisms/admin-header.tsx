import { AccountMenu } from "@/components/molecules/account-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { AuthUser } from "@/server/auth/auth.types";

export function AdminHeader({ user }: { user: AuthUser }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
      <SidebarTrigger />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Operação de eventos</p>
        <p className="hidden text-xs text-muted-foreground sm:block">Painel administrativo</p>
      </div>
      <div className="ml-auto">
        <AccountMenu user={user} />
      </div>
    </header>
  );
}
