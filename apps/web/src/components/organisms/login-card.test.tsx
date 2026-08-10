import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginCard } from "@/components/organisms/login-card";

describe("LoginCard", () => {
  it("makes the non-functional authentication state explicit", () => {
    render(<LoginCard />);

    expect(screen.getByRole("textbox", { name: "E-mail" })).toBeDisabled();
    expect(screen.getByLabelText("Senha")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled();
    expect(
      screen.getByText("Autenticação ainda não implementada."),
    ).toBeInTheDocument();
  });
});
