import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 md:px-6">
      <SidebarTrigger />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">Operação de eventos</p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Fundação administrativa
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Badge variant="outline">Protótipo local</Badge>
        <Avatar size="sm">
          <AvatarFallback>OR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
