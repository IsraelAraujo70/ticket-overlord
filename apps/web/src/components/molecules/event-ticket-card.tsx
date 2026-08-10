import type { LucideIcon } from "lucide-react";
import { MapPinIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EventTicketCardProps {
  category: string;
  date: string;
  day: string;
  description: string;
  icon: LucideIcon;
  location: string;
  price: string;
  title: string;
}

export function EventTicketCard({
  category,
  date,
  day,
  description,
  icon: Icon,
  location,
  price,
  title,
}: EventTicketCardProps) {
  return (
    <article className="ticket-card">
      <div className="ticket-card__stub">
        <Icon className="size-7" aria-hidden="true" />
        <div className="font-mono uppercase">
          <p className="text-xs font-semibold tracking-[0.18em]">{date}</p>
          <p className="font-heading text-5xl leading-none font-bold">{day}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-5 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="secondary">{category}</Badge>
          <span className="font-mono text-xs font-semibold tracking-[0.12em] uppercase">
            a partir de {price}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-heading text-3xl leading-none font-bold uppercase md:text-4xl">
            {title}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {location}
          </p>
          {/* #todo REMOVE: Replace the temporary disabled action when ticket sales are connected. */}
          <Button variant="outline" className="self-start" disabled>
            Ingressos em breve
          </Button>
        </div>
      </div>
    </article>
  );
}
