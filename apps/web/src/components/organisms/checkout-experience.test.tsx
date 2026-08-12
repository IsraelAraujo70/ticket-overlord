import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CheckoutExperience } from "@/components/organisms/checkout-experience";

vi.mock("@/server/checkout/checkout-actions", () => ({
  processPaymentAction: vi.fn(),
}));

describe("CheckoutExperience", () => {
  it("shows the reserved total and both required simulation outcomes", () => {
    render(
      <CheckoutExperience
        reservation={{
          id: "reservation-id",
          eventId: "event-id",
          quantity: 2,
          unitPriceInCents: 4550,
          totalInCents: 9100,
          currency: "BRL",
          status: "PENDING_PAYMENT",
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          event: {
            id: "event-id",
            slug: "cinema-session",
            title: "Interestelar",
            startsAt: "2099-09-05T22:00:00.000Z",
            venue: "Cine Belas Artes",
            city: "São Paulo",
          },
        }}
      />,
    );

    expect(screen.getByText("R$ 91,00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simular aprovação" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Simular recusa" })).toBeEnabled();
    expect(screen.getByText(/Nenhum dado financeiro é solicitado/)).toBeInTheDocument();
  });

  it("restores an approved result after the checkout is reloaded", () => {
    render(
      <CheckoutExperience
        reservation={{
          id: "11111111-1111-4111-8111-111111111111",
          eventId: "event-id",
          quantity: 1,
          unitPriceInCents: 4550,
          totalInCents: 4550,
          currency: "BRL",
          status: "PAID",
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          event: {
            id: "event-id",
            slug: "cinema-session",
            title: "Interestelar",
            startsAt: "2099-09-05T22:00:00.000Z",
            venue: "Cine Belas Artes",
            city: "São Paulo",
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Compra confirmada" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Simular aprovação" })).not.toBeInTheDocument();
  });
});
