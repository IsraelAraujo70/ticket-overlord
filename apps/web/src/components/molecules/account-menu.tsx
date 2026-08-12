"use client";

import Link from "next/link";
import { ChevronDownIcon, LogOutIcon, ScanLineIcon, TicketIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/auth/auth-actions";
import type { AuthUser, UserRole } from "@/server/auth/auth.types";

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Perfil cliente",
  ORGANIZER: "Perfil organizador",
  ADMIN: "Perfil administrador",
  ORGANIZER_STAFF: "Perfil portaria",
};

export function AccountMenu({
  appearance = "default",
  user,
}: {
  appearance?: "default" | "inverted";
  user: AuthUser;
}) {
  const inverted = appearance === "inverted";
  const roleLabel = roleLabels[user.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              "h-auto min-w-0 gap-2 px-2 py-1.5",
              inverted &&
                "text-primary-foreground hover:bg-white/10 hover:text-primary-foreground",
            )}
            aria-label={`Abrir menu de ${user.fullName}`}
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback
            className={cn(
              "font-mono font-semibold",
              inverted && "bg-white text-primary",
            )}
          >
            {initials(user.fullName)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="max-w-36 truncate text-sm font-semibold leading-4">
            {user.fullName}
          </span>
          <span
            className={cn(
              "font-mono text-[0.65rem] leading-4 tracking-wide uppercase",
              inverted
                ? "text-primary-foreground/70 group-aria-expanded/button:text-muted-foreground"
                : "text-muted-foreground",
            )}
          >
            {roleLabel}
          </span>
        </span>
        <ChevronDownIcon data-icon="inline-end" className="hidden sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {user.fullName}
            </span>
            <span className="truncate font-normal">{user.email}</span>
            <span className="font-mono text-[0.65rem] tracking-wide uppercase">
              {roleLabel}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user.role === "CUSTOMER" ? (
            <DropdownMenuItem nativeButton={false} render={<Link href="/meus-ingressos" />}>
              <TicketIcon />
              Meus ingressos
            </DropdownMenuItem>
          ) : null}
          {user.role === "ORGANIZER" || user.role === "ORGANIZER_STAFF" ? (
            <DropdownMenuItem nativeButton={false} render={<Link href="/admin/portaria" />}>
              <ScanLineIcon />
              Portaria
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <form action={logoutAction}>
            <DropdownMenuItem
              nativeButton
              render={<button type="submit" className="w-full" />}
            >
              <LogOutIcon />
              Sair
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
