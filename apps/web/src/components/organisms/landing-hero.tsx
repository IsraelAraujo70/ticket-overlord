import Image from "next/image";
import { CalendarDaysIcon, MapPinIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CatalogEvent } from "@/features/catalog/catalog.types";

export function LandingHero({ event }: { event: CatalogEvent }) {
  return (
    <section className="relative isolate min-h-[31rem] overflow-hidden bg-ticket-ink text-ticket-paper">
      <Image
        src={event.imageUrl}
        alt={event.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,23,0.94)_0%,rgba(7,10,23,0.72)_42%,rgba(7,10,23,0.12)_78%)]" />
      <div className="relative mx-auto flex min-h-[31rem] max-w-7xl items-end px-5 py-12 lg:px-8 lg:py-16">
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <Badge className="bg-ticket-coral text-ticket-coral-foreground">Em destaque</Badge>
            <span className="font-mono text-xs tracking-[0.18em] text-ticket-paper/70 uppercase">
              Agenda 2026
            </span>
          </div>
          <h1 className="font-heading text-[clamp(4rem,10vw,7.5rem)] leading-[0.76] font-bold tracking-[-0.04em] uppercase">
            {event.title}
          </h1>
          <p className="max-w-lg text-base leading-7 text-ticket-paper/80">
            {event.summary}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/20 pt-4 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDaysIcon className="size-4 text-ticket-coral" aria-hidden="true" />
              {event.dateLabel}
            </p>
            <p className="flex items-center gap-2">
              <MapPinIcon className="size-4 text-ticket-coral" aria-hidden="true" />
              {event.venue}, {event.city}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
