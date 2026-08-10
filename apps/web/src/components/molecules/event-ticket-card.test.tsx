import { render, screen } from "@testing-library/react";
import { Music2Icon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EventTicketCard } from "@/components/molecules/event-ticket-card";

describe("EventTicketCard", () => {
  it("presents the event details and ticket action", () => {
    render(
      <EventTicketCard
        category="Música"
        date="AGO 2026"
        day="22"
        description="Uma noite de música independente."
        icon={Music2Icon}
        location="Complexo Barra Funda, São Paulo"
        price="R$ 90"
        title="Frequência urbana"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Frequência urbana" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Complexo Barra Funda, São Paulo"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ingressos em breve/i }),
    ).toBeDisabled();
  });
});
