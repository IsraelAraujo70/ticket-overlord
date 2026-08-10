import { TicketIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps {
  compact?: boolean;
  inverted?: boolean;
}

export function Logo({ compact = false, inverted = false }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        inverted ? "text-sidebar-foreground" : "text-foreground",
      )}
      aria-label="Ticket Overlord"
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          inverted
            ? "bg-white text-ticket-ink"
            : "bg-primary text-primary-foreground",
        )}
      >
        <TicketIcon aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="flex flex-col font-heading text-lg leading-[0.8] font-bold tracking-[0.04em] uppercase">
          <span>Ticket</span>
          <span>Overlord</span>
        </span>
      ) : null}
    </span>
  );
}
