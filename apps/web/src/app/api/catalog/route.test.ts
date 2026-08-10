import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/catalog/route";
import type { CatalogResponse } from "@/features/catalog/catalog.types";

describe("GET /api/catalog", () => {
  it("returns the catalog grouped by category", async () => {
    const response = await GET(new NextRequest("http://localhost/api/catalog"));
    const body = (await response.json()) as CatalogResponse;

    expect(response.status).toBe(200);
    expect(body.highlights.map((event) => event.slug)).toEqual([
      "frequencia-urbana",
      "pulso-eletrico",
      "sabores-do-brasil",
    ]);
    expect(body.meta).toEqual({ query: "", total: 8 });
    expect(body.sections.map((section) => section.title)).toEqual([
      "Shows e festivais",
      "Experiências",
      "Teatro",
      "Comédia",
    ]);
  });

  it("filters by query without requiring accents", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/catalog?query=frequencia"),
    );
    const body = (await response.json()) as CatalogResponse;

    expect(body.meta).toEqual({ query: "frequencia", total: 1 });
    expect(body.highlights[0]?.title).toBe("Frequência Urbana");
    expect(body.sections).toHaveLength(1);
  });

  it("uses the first matching event when the result is not a primary highlight", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/catalog?query=campinas"),
    );
    const body = (await response.json()) as CatalogResponse;

    expect(body.meta.total).toBe(1);
    expect(body.highlights[0]?.title).toBe("Rir de Nós Mesmos");
  });
});
