import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/server/api/api-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {},
  apiRequest: vi.fn(),
}));

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "@/server/api/api-client";
import {
  confirmEmailAction,
  customerRegisterAction,
  organizerRegisterAction,
} from "@/server/auth/auth-actions";
import { initialAuthActionState } from "@/server/auth/auth.types";

function registrationForm(): FormData {
  const formData = new FormData();
  formData.set("password", "StrongPassword2026!");
  formData.set("passwordConfirmation", "StrongPassword2026!");
  return formData;
}

describe("registration actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiRequest).mockResolvedValue(undefined);
  });

  it("redirects a customer after registration", async () => {
    await customerRegisterAction(initialAuthActionState, registrationForm());

    expect(redirect).toHaveBeenCalledWith("/cadastro/sucesso");
  });

  it("redirects an organizer after registration", async () => {
    await organizerRegisterAction(initialAuthActionState, registrationForm());

    expect(redirect).toHaveBeenCalledWith("/admin/cadastro/sucesso");
  });
});

describe("email confirmation action", () => {
  const cookieStore = {
    delete: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
  });

  it("persists the first confirmation session and selects the customer area", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      status: "CONFIRMED",
      session: {
        accessToken: "session-token",
        expiresAt: "2026-08-18T12:00:00.000Z",
        user: {
          id: "user-id",
          fullName: "Maria Cliente",
          email: "maria@example.com",
          role: "CUSTOMER",
          organizationId: null,
        },
      },
    });

    await expect(confirmEmailAction("confirmation-token", "customer")).resolves.toEqual({
      status: "success",
      message: "Seu e-mail foi confirmado.",
      redirectTo: "/",
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      "ticket_overlord_session",
      "session-token",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
  });

  it("does not create a cookie from an already used confirmation link", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ status: "ALREADY_CONFIRMED" });
    cookieStore.get.mockReturnValue(undefined);

    await expect(confirmEmailAction("used-token", "admin")).resolves.toEqual({
      status: "success",
      message: "Seu e-mail já estava confirmado.",
      redirectTo: "/admin/login",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
