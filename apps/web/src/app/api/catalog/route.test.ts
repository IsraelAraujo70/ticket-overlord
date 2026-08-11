import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/catalog/route";
import type { CatalogResponse } from "@/features/catalog/catalog.types";
import type { AdminEvent } from "@/features/events/event.types";
import { listPublishedEvents } from "@/server/events/events";

vi.mock("@/server/events/events", () => ({
  listPublishedEvents: vi.fn(),
}));

const publishedEvents: AdminEvent[] = [
  event({
    id: "event-1",
    slug: "cidade-de-deus-rio",
    title: "Cidade de Deus",
    summary: "Uma sessão especial do clássico brasileiro.",
    city: "Rio de Janeiro",
    venue: "Cine Odeon",
    startsAt: "2026-08-29T22:00:00.000Z",
    priceInCents: 3200,
  }),
  event({
    id: "event-2",
    slug: "auto-da-compadecida-recife",
    title: "O Auto da Compadecida",
    summary: "Cinema brasileiro em uma noite no Recife.",
    city: "Recife",
    venue: "Cinema São Luiz",
    startsAt: "2026-09-05T22:00:00.000Z",
    priceInCents: 2800,
  }),
  event({
    id: "event-3",
    slug: "bacurau-fortaleza",
    title: "Bacurau",
    summary: "Exibição seguida de conversa sobre o filme.",
    city: "Fortaleza",
    venue: "Cinema do Dragão",
    startsAt: "2026-09-12T22:00:00.000Z",
    priceInCents: 3500,
  }),
  event({
    id: "event-4",
    slug: "central-do-brasil-campinas",
    title: "Central do Brasil",
    summary: "Sessão especial em Campinas.",
    city: "Campinas",
    venue: "MIS Campinas",
    startsAt: "2026-09-19T22:00:00.000Z",
    priceInCents: 2500,
  }),
];

describe("GET /api/catalog", () => {
  beforeEach(() => {
    vi.mocked(listPublishedEvents).mockResolvedValue([
      ...publishedEvents,
      { ...publishedEvents[0], id: "event-5", category: "Shows" },
    ]);
  });

  it("returns the catalog grouped by category", async () => {
    const response = await GET(new NextRequest("http://localhost/api/catalog"));
    const body = (await response.json()) as CatalogResponse;

    expect(response.status).toBe(200);
    expect(body.highlights.map((event) => event.slug)).toEqual([
      "cidade-de-deus-rio",
      "auto-da-compadecida-recife",
      "bacurau-fortaleza",
    ]);
    expect(body.meta).toEqual({ query: "", total: 4 });
    expect(body.sections.map((section) => section.title)).toEqual(["Cinema"]);
    expect(body.sections[0]?.events).toHaveLength(4);
  });

  it("filters by query without requiring accents", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/catalog?query=classico"),
    );
    const body = (await response.json()) as CatalogResponse;

    expect(body.meta).toEqual({ query: "classico", total: 1 });
    expect(body.highlights[0]?.title).toBe("Cidade de Deus");
    expect(body.sections).toHaveLength(1);
  });

  it("filters by title without requiring accents", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/catalog?query=cidade de deus"),
    );
    const body = (await response.json()) as CatalogResponse;

    expect(body.meta).toEqual({ query: "cidade de deus", total: 1 });
    expect(body.highlights[0]?.title).toBe("Cidade de Deus");
    expect(body.sections).toHaveLength(1);
  });

  it("uses the first matching event when the result is not a primary highlight", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/catalog?query=campinas"),
    );
    const body = (await response.json()) as CatalogResponse;

    expect(body.meta.total).toBe(1);
    expect(body.highlights[0]?.title).toBe("Central do Brasil");
  });
});

function event(
  overrides: Pick<
    AdminEvent,
    | "id"
    | "slug"
    | "title"
    | "summary"
    | "city"
    | "venue"
    | "startsAt"
    | "priceInCents"
  >,
): AdminEvent {
  return {
    organizationId: "11111111-1111-4111-8111-111111111111",
    externalSource: "TMDB",
    externalId: overrides.id,
    category: "Cinema",
    sourceReleaseDate: "2000-01-01",
    sourceImageUrl: null,
    capacity: 100,
    currency: "BRL",
    coverContentType: "image/webp",
    status: "PUBLISHED",
    createdAt: "2026-08-11T18:00:00.000Z",
    updatedAt: "2026-08-11T18:00:00.000Z",
    coverUrl: `/events/${overrides.id}/cover`,
    ...overrides,
  };
}
