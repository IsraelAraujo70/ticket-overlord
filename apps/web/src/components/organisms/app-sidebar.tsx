"use client";

import {
  CalendarDaysIcon,
  ChartNoAxesCombinedIcon,
  ClipboardCheckIcon,
  DoorOpenIcon,
  ShoppingBagIcon,
  TicketCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/atoms/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Visão geral", icon: ChartNoAxesCombinedIcon, available: true },
  { title: "Eventos", icon: CalendarDaysIcon, available: false },
  { title: "Ingressos", icon: TicketCheckIcon, available: false },
  { title: "Pedidos", icon: ShoppingBagIcon, available: false },
  { title: "Portaria", icon: ClipboardCheckIcon, available: false },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/admin" aria-label="Ticket Overlord Admin" />}
              size="lg"
              tooltip="Ticket Overlord"
            >
              <Logo compact inverted />
              <span className="font-heading text-lg font-bold tracking-wide uppercase">
                Ticket Overlord
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.available ? (
                    <SidebarMenuButton
                      render={<Link href="/admin" />}
                      isActive={pathname === "/admin"}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      disabled
                      tooltip={`${item.title}: próxima etapa`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              tooltip="Voltar ao site público"
            >
              <DoorOpenIcon />
              <span>Ver site público</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
