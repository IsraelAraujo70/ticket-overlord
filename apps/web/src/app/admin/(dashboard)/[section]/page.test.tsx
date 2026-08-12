import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import AdminSectionPage from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("AdminSectionPage", () => {
  it.each([
    ["eventos", "Eventos"],
    ["ingressos", "Ingressos"],
    ["pedidos", "Pedidos"],
  ])("renders the %s section with the shared construction state", async (section, title) => {
    render(await AdminSectionPage({ params: Promise.resolve({ section }) }));

    expect(screen.getAllByText(new RegExp(title, "i"))).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: "Em construção" }),
    ).toBeInTheDocument();
  });

  it("rejects unknown administrative sections", async () => {
    await expect(
      AdminSectionPage({ params: Promise.resolve({ section: "desconhecida" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });
});
