import type {
  CatalogEvent,
  CatalogResponse,
} from "@/features/catalog/catalog.types";
import { listPublishedEvents } from "@/server/events/events";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function matchesQuery(event: CatalogEvent, query: string) {
  const searchable = [
    event.title,
    event.summary,
    event.category,
    event.city,
    event.venue,
  ].join(" ");

  return normalize(searchable).includes(normalize(query));
}

export async function getCatalog(query = ""): Promise<CatalogResponse> {
  const normalizedQuery = query.trim().slice(0, 100);
  const publishedEvents = await listPublishedEvents();
  const catalogEvents = publishedEvents
    .filter((event) => event.category === "Cinema")
    .map(toCatalogEvent);
  const events = normalizedQuery
    ? catalogEvents.filter((event) => matchesQuery(event, normalizedQuery))
    : catalogEvents;
  const featuredEvents = events.filter((event) => event.featured);

  return {
    highlights: featuredEvents.length ? featuredEvents : events.slice(0, 1),
    sections: events.length ? [{ id: "cinema", title: "Cinema", events }] : [],
    meta: {
      query: normalizedQuery,
      total: events.length,
    },
  };
}

function toCatalogEvent(
  event: Awaited<ReturnType<typeof listPublishedEvents>>[number],
  index: number,
): CatalogEvent {
  const startsAt = new Date(event.startsAt);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
    .format(startsAt)
    .replace(".", "")
    .toLocaleUpperCase("pt-BR");

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    category: event.category,
    city: event.city,
    venue: event.venue,
    dateLabel: date,
    startsAt: event.startsAt,
    priceLabel: `a partir de ${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: event.currency,
    }).format(event.priceInCents / 100)}`,
    imageUrl: `/api/event-covers/${event.id}`,
    imageAlt: `Capa do evento ${event.title}`,
    featured: index < 3,
  };
}
