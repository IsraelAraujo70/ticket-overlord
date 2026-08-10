import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginCard } from "@/components/organisms/login-card";

describe("LoginCard", () => {
  it("provides the organizer login and acquisition paths", () => {
    render(<LoginCard />);

    expect(screen.getByRole("textbox", { name: "E-mail" })).toBeEnabled();
    expect(screen.getByLabelText("Senha")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Cadastre sua organização" })).toHaveAttribute(
      "href",
      "/admin/cadastro",
    );
  });
});
