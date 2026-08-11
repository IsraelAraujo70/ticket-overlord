import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/server/api/api-client", () => ({
  ApiRequestError: class ApiRequestError extends Error {},
  apiRequest: vi.fn(),
}));

import { redirect } from "next/navigation";
import { apiRequest } from "@/server/api/api-client";
import {
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
