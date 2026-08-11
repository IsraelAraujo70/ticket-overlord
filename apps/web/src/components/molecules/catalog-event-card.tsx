import Image from "next/image";
import { CalendarDaysIcon, MapPinIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CatalogEvent } from "@/features/catalog/catalog.types";

export function CatalogEventCard({ event }: { event: CatalogEvent }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/9] overflow-hidden bg-ticket-ink">
        <Image
          src={event.imageUrl}
          alt={event.imageAlt}
          fill
          unoptimized
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          <Badge className="bg-ticket-ink/85 text-ticket-paper backdrop-blur-sm">
            {event.category}
          </Badge>
          <span className="rounded-md bg-ticket-coral px-2 py-1 font-mono text-[0.65rem] font-semibold tracking-wide text-ticket-coral-foreground uppercase">
            {event.dateLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <h3 className="font-heading text-3xl leading-[0.9] font-bold uppercase">
            {event.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
            {event.summary}
          </p>
        </div>
        <div className="mt-auto space-y-2 border-t pt-3 text-xs">
          <p className="flex items-center gap-2 font-medium">
            <MapPinIcon className="size-3.5 text-primary" aria-hidden="true" />
            {event.venue}, {event.city}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
            {event.priceLabel}
          </p>
        </div>
        {/* #todo REMOVE: Replace the temporary disabled action when ticket sales are connected. */}
        <Button variant="outline" disabled className="w-full">
          Venda em breve
        </Button>
      </div>
    </article>
  );
}
