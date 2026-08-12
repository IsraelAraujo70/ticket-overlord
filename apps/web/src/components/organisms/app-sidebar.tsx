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
import type { UserRole } from "@/server/auth/auth.types";

const navItems = [
  { title: "Visão geral", icon: ChartNoAxesCombinedIcon, href: "/admin" },
  { title: "Eventos", icon: CalendarDaysIcon, href: "/admin/eventos" },
  { title: "Ingressos", icon: TicketCheckIcon, href: "/admin/ingressos" },
  { title: "Pedidos", icon: ShoppingBagIcon, href: "/admin/pedidos" },
  { title: "Portaria", icon: ClipboardCheckIcon, href: "/admin/portaria" },
];

export function AppSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visibleItems = role === "ORGANIZER_STAFF"
    ? navItems.filter((item) => item.href === "/admin/portaria")
    : role === "ADMIN"
      ? navItems.filter((item) => item.href !== "/admin/portaria")
      : navItems;

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
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
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
