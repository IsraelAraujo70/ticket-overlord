import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LandingHero } from "@/components/organisms/landing-hero";
import type { CatalogEvent } from "@/features/catalog/catalog.types";

const highlights: CatalogEvent[] = [
  {
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
  },
  {
    id: "event-002",
    slug: "sabores-do-brasil",
    title: "Sabores do Brasil",
    summary: "Um encontro gastronômico.",
    category: "Experiências",
    city: "São Paulo",
    venue: "Parque Villa-Lobos",
    dateLabel: "05 SET · 11h",
    startsAt: "2026-09-05T11:00:00-03:00",
    priceLabel: "a partir de R$ 45",
    imageUrl: "/images/events/gastronomy.webp",
    imageAlt: "Festival gastronômico",
    featured: true,
  },
];

function mockMotionPreference(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })) as unknown as typeof window.matchMedia,
  );
}

describe("LandingHero", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("rotates automatically and supports manual navigation", () => {
    vi.useFakeTimers();
    mockMotionPreference(false);
    render(<LandingHero events={highlights} />);

    expect(screen.getByRole("heading", { name: "Frequência Urbana" })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(6_000));
    expect(screen.getByRole("heading", { name: "Sabores do Brasil" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Evento anterior" }));
    expect(screen.getByRole("heading", { name: "Frequência Urbana" })).toBeInTheDocument();
  });

  it("pauses autoplay while the carousel is hovered", () => {
    vi.useFakeTimers();
    mockMotionPreference(false);
    render(<LandingHero events={highlights} />);

    fireEvent.mouseEnter(screen.getByRole("region", { name: "Eventos em destaque" }));
    act(() => vi.advanceTimersByTime(6_000));

    expect(screen.getByRole("heading", { name: "Frequência Urbana" })).toBeInTheDocument();
  });

  it("does not autoplay when reduced motion is requested", () => {
    vi.useFakeTimers();
    mockMotionPreference(true);
    render(<LandingHero events={highlights} />);

    act(() => vi.advanceTimersByTime(6_000));

    expect(screen.getByRole("heading", { name: "Frequência Urbana" })).toBeInTheDocument();
  });
});
