import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchExperience } from "@/components/organisms/search-experience";
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

const results: CatalogResponse = {
  highlights: [event],
  sections: [{ id: "shows", title: "Shows e festivais", events: [event] }],
  meta: { query: "fre", total: 1, page: 1, pageSize: 48, pages: 1 },
};

function jsonResponse(body: CatalogResponse, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

describe("SearchExperience", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows a loading state while search is pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<SearchExperience initialQuery="fre" />);

    expect(screen.getByLabelText("Buscando eventos")).toBeInTheDocument();
  });

  it("explains the minimum query length without calling the catalog", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<SearchExperience initialQuery="a" />);

    expect(
      screen.getByRole("heading", { name: "Digite pelo menos 2 caracteres" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Buscando eventos")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Pesquisar eventos")).toHaveAttribute(
      "minlength",
      "2",
    );
  });

  it("shows an error state when the search request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => jsonResponse(results, false)));
    render(<SearchExperience initialQuery="fre" />);

    expect(await screen.findByText("Não foi possível buscar eventos")).toBeInTheDocument();
  });

  it("shows an empty state for a query without matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => jsonResponse({ highlights: [], sections: [], meta: { query: "xyz", total: 0, page: 1, pageSize: 48, pages: 1 } })),
    );
    render(<SearchExperience initialQuery="xyz" />);

    expect(await screen.findByText("Nenhum evento encontrado")).toBeInTheDocument();
  });

  it("fetches and renders results without the landing hero", async () => {
    const fetchMock = vi.fn(() => jsonResponse(results));
    vi.stubGlobal("fetch", fetchMock);
    render(<SearchExperience initialQuery="fre" />);

    expect(await screen.findByRole("heading", { name: "Resultados para “fre”" })).toBeInTheDocument();
    expect(await screen.findByText("1 evento encontrado")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resultados da busca" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Eventos em destaque" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Pesquisar eventos")).toHaveValue("fre");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/catalog?page=1&query=fre",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });
});
