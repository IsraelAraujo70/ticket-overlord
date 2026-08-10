import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CatalogExperience } from "@/components/organisms/catalog-experience";
import type { CatalogResponse } from "@/features/catalog/catalog.types";

const event = {
  id: "event-001",
  slug: "frequencia-urbana",
  title: "Frequência Urbana",
  summary: "Uma noite de música.",
  category: "Shows e festivais",
  city: "São Paulo",
  venue: "Complexo Barra Funda",
  dateLabel: "22 AGO · 19h",
  startsAt: "2026-08-22T19:00:00-03:00",
  priceLabel: "a partir de R$ 90",
  imageUrl: "/images/events/concert-hero.webp",
  imageAlt: "Público em um show",
  featured: true,
};

const catalog: CatalogResponse = {
  highlights: [event],
  sections: [{ id: "shows", title: "Shows e festivais", events: [event] }],
  meta: { query: "", total: 1 },
};

function jsonResponse(body: CatalogResponse, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

describe("CatalogExperience", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a loading state while the catalog is pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<CatalogExperience />);
    expect(screen.getByLabelText("Carregando eventos")).toBeInTheDocument();
  });

  it("shows an error state when the BFF request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse(catalog, false)));
    render(<CatalogExperience />);
    expect(await screen.findByText("Não foi possível carregar a agenda")).toBeInTheDocument();
  });

  it("shows an empty state when no events match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse({ highlights: [], sections: [], meta: { query: "x", total: 0 } })),
    );
    render(<CatalogExperience />);
    expect(await screen.findByText("Nenhum evento encontrado")).toBeInTheDocument();
  });

  it("keeps search navigation separate from the home catalog", async () => {
    const fetchMock = vi.fn(() => jsonResponse(catalog));
    vi.stubGlobal("fetch", fetchMock);
    render(<CatalogExperience />);

    expect(await screen.findAllByText("Frequência Urbana")).toHaveLength(2);
    expect(screen.getByRole("search")).toHaveAttribute("action", "/search");
    expect(screen.getByRole("search")).toHaveAttribute("method", "get");
    expect(screen.getByLabelText("Pesquisar eventos")).toHaveAttribute("name", "q");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/catalog",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });
});
