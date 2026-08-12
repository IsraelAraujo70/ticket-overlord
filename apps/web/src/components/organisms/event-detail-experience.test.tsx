import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventDetailExperience } from "@/components/organisms/event-detail-experience";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <span data-image-src={src} aria-label={alt || undefined} />
  ),
}));
vi.mock("@/components/organisms/public-header", () => ({ PublicHeader: () => <header /> }));
vi.mock("@/components/organisms/public-footer", () => ({ PublicFooter: () => <footer /> }));
vi.mock("@/server/checkout/checkout-actions", () => ({
  createReservationAction: vi.fn(),
}));

const event = {
  id: "event-id",
  slug: "cinema-session",
  title: "Interestelar",
  summary: "Uma jornada para além das estrelas.",
  category: "Cinema",
  startsAt: "2099-09-05T22:00:00.000Z",
  venue: "Cine Belas Artes",
  city: "São Paulo",
  priceInCents: 4550,
  currency: "BRL" as const,
  coverUrl: "/cover.jpg",
  availableQuantity: 3,
  maxQuantityPerReservation: 10,
};

describe("EventDetailExperience", () => {
  it("calculates the quantity total and respects current availability", () => {
    render(
      <EventDetailExperience
        event={event}
        user={{ id: "customer-id", fullName: "Maria", email: "maria@example.com", role: "CUSTOMER", organizationId: null }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));
    fireEvent.click(screen.getByRole("button", { name: "Aumentar quantidade" }));

    expect(screen.getByText("R$ 136,50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aumentar quantidade" })).toBeDisabled();
  });

  it("sends an unauthenticated visitor to login with the event return path", () => {
    render(<EventDetailExperience event={event} user={null} />);

    expect(screen.getByRole("button", { name: "Entrar para reservar" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Feventos%2Fcinema-session",
    );
  });
});
