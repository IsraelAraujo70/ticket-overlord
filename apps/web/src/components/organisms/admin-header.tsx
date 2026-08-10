import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { logoutAction } from "@/server/auth/auth-actions";
import type { AuthUser } from "@/server/auth/auth.types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AdminHeader({ user }: { user: AuthUser }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
      <SidebarTrigger />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Operação de eventos</p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {user.fullName}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Badge variant="outline">{user.role === "ADMIN" ? "Admin" : "Organizador"}</Badge>
        <Avatar size="sm">
          <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
        </Avatar>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">Sair</Button>
        </form>
      </div>
    </header>
  );
}
