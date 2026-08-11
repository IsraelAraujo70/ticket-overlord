import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "@/components/molecules/password-input";

describe("PasswordInput", () => {
  it("shows live strength feedback and the strong-password requirements", () => {
    render(<PasswordInput aria-label="Senha" showStrength />);

    const input = screen.getByLabelText("Senha");
    fireEvent.change(input, { target: { value: "lowercase password" } });
    expect(screen.getByText("Fraca")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "LongPassword2026!" } });
    expect(screen.getByText("Forte")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Força da senha" })).toHaveAttribute(
      "aria-valuenow",
      "4",
    );
    expect(input).toHaveAttribute("pattern");
  });

  it("shows and hides the password", () => {
    render(<PasswordInput aria-label="Senha" />);

    const input = screen.getByLabelText("Senha");
    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(input).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
