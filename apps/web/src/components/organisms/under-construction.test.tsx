import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnderConstruction } from "@/components/organisms/under-construction";

describe("UnderConstruction", () => {
  it("identifies the current administrative area without presenting demo data", () => {
    render(<UnderConstruction section="Ingressos" />);

    expect(
      screen.getByRole("heading", { name: "Em construção" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Ingressos/i)).not.toHaveLength(0);
    expect(screen.getByRole("link", { name: "Ver site público" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
