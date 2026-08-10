import type {
  CatalogEvent,
  CatalogResponse,
} from "@/features/catalog/catalog.types";
import { mockCatalog } from "@/server/catalog/mock-catalog";

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
  const events = normalizedQuery
    ? mockCatalog.filter((event) => matchesQuery(event, normalizedQuery))
    : mockCatalog;
  const categories = [...new Set(events.map((event) => event.category))];

  return {
    featured: events.find((event) => event.featured) ?? events[0] ?? null,
    sections: categories.map((category) => ({
      id: normalize(category).replace(/\s+/g, "-"),
      title: category,
      events: events.filter((event) => event.category === category),
    })),
    meta: {
      query: normalizedQuery,
      total: events.length,
    },
  };
}
