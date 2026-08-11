import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuyerAuthCard } from "@/components/organisms/buyer-auth-card";

describe("BuyerAuthCard", () => {
  it("keeps customer registration on the public surface", () => {
    render(<BuyerAuthCard mode="register" />);

    expect(screen.getByRole("form", { name: "Cadastro do cliente" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toBeEnabled();
    expect(screen.getByRole("meter", { name: "Força da senha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeEnabled();
    expect(screen.queryByText(/organização/i)).not.toBeInTheDocument();
  });

  it("links customer login to password recovery", () => {
    render(<BuyerAuthCard mode="login" />);

    expect(screen.getByRole("link", { name: "Esqueci minha senha" })).toHaveAttribute(
      "href",
      "/esqueci-senha",
    );
  });
});
