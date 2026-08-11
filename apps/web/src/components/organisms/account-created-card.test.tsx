import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountCreatedCard } from "@/components/organisms/account-created-card";

describe("AccountCreatedCard", () => {
  it("makes successful customer registration explicit", () => {
    render(<AccountCreatedCard />);

    expect(screen.getByRole("heading", { name: "Sua conta foi criada" })).toBeInTheDocument();
    expect(screen.getByText("Confirme seu e-mail para poder entrar.", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Reenviar confirmação" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o login" })).toHaveAttribute("href", "/login");
  });

  it("returns organizers to the administrative login", () => {
    render(<AccountCreatedCard admin />);

    expect(screen.getByRole("link", { name: "Ir para o login" })).toHaveAttribute(
      "href",
      "/admin/login",
    );
  });
});
