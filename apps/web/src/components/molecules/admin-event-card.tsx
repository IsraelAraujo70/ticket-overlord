import Image from "next/image";
import { CalendarDaysIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminEvent } from "@/features/events/event.types";
import { PublishEventButton } from "@/components/molecules/publish-event-button";

export function AdminEventCard({ event }: { event: AdminEvent }) {
  const startsAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(event.startsAt));
  const price = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: event.currency,
  }).format(event.priceInCents / 100);

  return (
    <Card className="overflow-hidden">
      <Image
        src={`/api/admin/event-covers/${event.id}`}
        alt={`Capa do evento ${event.title}`}
        width={720}
        height={405}
        unoptimized
        className="aspect-video w-full object-cover"
      />
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={event.status === "PUBLISHED" ? "default" : "secondary"}
          >
            {event.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
          </Badge>
          <Badge variant="outline">TMDb #{event.externalId}</Badge>
        </div>
        <CardTitle>{event.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {event.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p className="flex items-center gap-2">
          <CalendarDaysIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {startsAt}
        </p>
        <p className="flex items-center gap-2">
          <MapPinIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {event.venue}, {event.city}
        </p>
        <p className="flex items-center gap-2">
          <UsersIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {event.capacity} lugares · {price}
        </p>
        {event.status === "DRAFT" ? (
          <PublishEventButton eventId={event.id} />
        ) : null}
      </CardContent>
    </Card>
  );
}
