import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminEventsList } from "@/components/organisms/admin-events-list";
import type { AdminEvent } from "@/features/events/event.types";

describe("AdminEventsList", () => {
  it("guides the organizer when no event exists", () => {
    render(<AdminEventsList created={false} events={[]} />);

    expect(screen.getByText("Nenhum evento criado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Criar primeiro evento" })).toHaveAttribute(
      "href",
      "/admin/eventos/novo",
    );
  });

  it("shows the created feedback and the organization events", () => {
    render(<AdminEventsList created events={[draftEvent]} />);

    expect(screen.getByText("Rascunho criado")).toBeInTheDocument();
    expect(screen.getByText("Interestelar")).toBeInTheDocument();
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByText(/150 lugares/)).toBeInTheDocument();
  });
});

const draftEvent: AdminEvent = {
  id: "event-1",
  organizationId: "organization-1",
  externalSource: "TMDB",
  externalId: "157336",
  slug: "interestelar-event-1",
  title: "Interestelar",
  summary: "Uma jornada para além das estrelas.",
  category: "Cinema",
  sourceReleaseDate: "2014-11-05",
  sourceImageUrl: null,
  startsAt: "2099-09-05T22:00:00.000Z",
  venue: "Cine Belas Artes",
  city: "São Paulo",
  capacity: 150,
  priceInCents: 4550,
  currency: "BRL",
  coverContentType: "image/png",
  status: "DRAFT",
  createdAt: "2026-08-11T18:00:00.000Z",
  updatedAt: "2026-08-11T18:00:00.000Z",
  coverUrl: "/events/event-1/cover",
};
