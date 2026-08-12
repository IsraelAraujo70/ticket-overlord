import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MyTicketsExperience } from "./my-tickets-experience";

const user = {
  id: "customer-id",
  fullName: "Carlos Comprador",
  email: "carlos@example.com",
  role: "CUSTOMER" as const,
  organizationId: null,
};

describe("MyTicketsExperience", () => {
  it("guides a customer whose wallet is empty", () => {
    render(<MyTicketsExperience tickets={[]} user={user} />);

    expect(screen.getByRole("heading", { name: "Sua carteira está vazia" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Explorar eventos" })[0]).toHaveAttribute("href", "/#eventos");
  });

  it("links each individual ticket to its detail", () => {
    render(
      <MyTicketsExperience
        user={user}
        tickets={[{
          id: "ticket-id",
          reservationId: "reservation-id",
          eventId: "event-id",
          sequence: 2,
          manualCode: "MANUALCODE",
          qrCode: "signed-code",
          shareToken: "share-token",
          status: "VALID",
          usedAt: null,
          createdAt: "2026-08-12T12:00:00.000Z",
          event: {
            title: "Cidade de Deus",
            startsAt: "2026-08-22T22:00:00.000Z",
            venue: "Cine Belas Artes",
            city: "São Paulo",
          },
        }]}
      />,
    );

    expect(screen.getByRole("link", { name: /Cidade de Deus/ })).toHaveAttribute(
      "href",
      "/meus-ingressos/ticket-id",
    );
    expect(screen.getByText("Ingresso 2")).toBeInTheDocument();
  });
});
