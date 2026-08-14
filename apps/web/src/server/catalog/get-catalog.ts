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

export async function getCatalog(query = "", page = 1): Promise<CatalogResponse> {
  const normalizedQuery = query.trim().slice(0, 100);
  const publishedEvents = await listPublishedEvents(page, normalizedQuery);
  const events = publishedEvents.items.map(toCatalogEvent);
  const featuredEvents = events.filter((event) => event.featured);

  return {
    highlights: featuredEvents.length ? featuredEvents : events.slice(0, 1),
    sections: groupByCategory(events),
    meta: {
      query: normalizedQuery,
      total: publishedEvents.total,
      page: publishedEvents.page,
      pageSize: publishedEvents.pageSize,
      pages: Math.max(1, Math.ceil(publishedEvents.total / publishedEvents.pageSize)),
    },
  };
}

function groupByCategory(events: CatalogEvent[]) {
  const categories = new Map<string, CatalogEvent[]>();

  for (const event of events) {
    const categoryEvents = categories.get(event.category) ?? [];
    categoryEvents.push(event);
    categories.set(event.category, categoryEvents);
  }

  return Array.from(categories, ([title, categoryEvents]) => ({
    id: normalize(title)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
    title,
    events: categoryEvents,
  }));
}

function toCatalogEvent(
  event: Awaited<ReturnType<typeof listPublishedEvents>>["items"][number],
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
