import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { replaceRoute } = vi.hoisted(() => ({ replaceRoute: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceRoute }),
}));
vi.mock("@/server/auth/auth-actions", () => ({
  confirmEmailAction: vi.fn(),
  resendConfirmationAction: vi.fn(),
}));

import { EmailConfirmationCard } from "@/components/organisms/email-confirmation-card";
import { confirmEmailAction, resendConfirmationAction } from "@/server/auth/auth-actions";

describe("EmailConfirmationCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState(
      null,
      "",
      "/confirmar-email#token=confirmation-token",
    );
    vi.mocked(resendConfirmationAction).mockResolvedValue({ status: "idle" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("confirms once, removes the token and redirects after the countdown", async () => {
    vi.mocked(confirmEmailAction).mockResolvedValue({
      status: "success",
      message: "Seu e-mail foi confirmado.",
      redirectTo: "/",
    });

    render(<EmailConfirmationCard />);
    await act(async () => Promise.resolve());

    expect(confirmEmailAction).toHaveBeenCalledOnce();
    expect(confirmEmailAction).toHaveBeenCalledWith(
      "confirmation-token",
      "customer",
    );
    expect(window.location.hash).toBe("");
    expect(
      screen.getByRole("heading", { name: "Seu e-mail foi confirmado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Redirecionando para sua conta em 3.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Reenviar confirmação" })).not.toBeInTheDocument();

    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(screen.getByText("Redirecionando para sua conta em 2.")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(screen.getByText("Redirecionando para sua conta em 1.")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(1_000));
    expect(replaceRoute).toHaveBeenCalledWith("/");
  });

  it("keeps recovery available for an invalid token", async () => {
    vi.mocked(confirmEmailAction).mockResolvedValue({
      status: "error",
      code: "INVALID_OR_EXPIRED_TOKEN",
      message: "O link de confirmação é inválido ou expirou.",
    });

    render(<EmailConfirmationCard admin />);
    await act(async () => Promise.resolve());

    expect(confirmEmailAction).toHaveBeenCalledWith(
      "confirmation-token",
      "admin",
    );
    expect(
      screen.getByRole("form", { name: "Reenviar confirmação" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o login" })).toHaveAttribute(
      "href",
      "/admin/login",
    );
  });
});
