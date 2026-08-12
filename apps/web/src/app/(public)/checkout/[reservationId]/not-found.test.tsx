import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CheckoutNotFound from "./not-found";

describe("CheckoutNotFound", () => {
  it("guides the customer back to available events", () => {
    render(<CheckoutNotFound />);

    expect(screen.getByRole("heading", { name: "Reserva encerrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escolher ingressos novamente" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
