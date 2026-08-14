import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResetPasswordCard } from "@/components/organisms/reset-password-card";

describe("ResetPasswordCard", () => {
  afterEach(() => {
    window.location.hash = "";
  });

  it("uses strong-password feedback for a new password", () => {
    window.location.hash = "token=test-token";
    render(<ResetPasswordCard />);

    expect(window.location.hash).toBe("");
    expect(screen.getByRole("meter", { name: "Força da senha" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Mostrar senha" })).toHaveLength(2);
  });
});
