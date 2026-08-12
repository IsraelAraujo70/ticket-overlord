import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/server/backend-client", () => ({
  BackendRequestError: class BackendRequestError extends Error {},
  backendRequest: vi.fn(),
}));

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest } from "@/server/backend-client";
import {
  confirmEmailAction,
  customerLoginAction,
  customerRegisterAction,
  organizerRegisterAction,
  organizerLoginAction,
} from "@/server/auth/auth-actions";
import { initialAuthActionState } from "@/server/auth/auth.types";

function registrationForm(): FormData {
  const formData = new FormData();
  formData.set("password", "StrongPassword2026!");
  formData.set("passwordConfirmation", "StrongPassword2026!");
  return formData;
}

function organizerRegistrationForm(): FormData {
  const formData = registrationForm();
  formData.set("fullName", "Olívia Organizadora");
  formData.set("email", "organizer@example.com");
  formData.set("organizationName", "Aurora Eventos");
  formData.set("cnpj", "12.abc.345/01de-35");
  formData.set("phone", "+55 35 99742-1900");
  formData.set("postalCode", "37705-202");
  formData.set("street", "Rua Lasarina Alvisi Torraca");
  formData.set("number", "850");
  formData.set("neighborhood", "Jardim Amaryllis");
  formData.set("city", "Poços de Caldas");
  formData.set("state", "MG");
  return formData;
}

describe("registration actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(backendRequest).mockResolvedValue(undefined);
  });

  it("redirects a customer after registration", async () => {
    await customerRegisterAction(initialAuthActionState, registrationForm());

    expect(redirect).toHaveBeenCalledWith("/cadastro/sucesso");
  });

  it("redirects an organizer after registration", async () => {
    await organizerRegisterAction(initialAuthActionState, organizerRegistrationForm());

    expect(redirect).toHaveBeenCalledWith("/admin/cadastro/sucesso");
    expect(backendRequest).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({
        body: expect.stringContaining('"phone":"+5535997421900"'),
      }),
    );
    expect(backendRequest).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({
        body: expect.stringContaining('"cnpj":"12ABC34501DE35"'),
      }),
    );
  });

  it("does not call the API when organizer fields are invalid", async () => {
    const formData = organizerRegistrationForm();
    formData.set("phone", "+1 202-555-0104");

    await expect(
      organizerRegisterAction(initialAuthActionState, formData),
    ).resolves.toEqual(
      expect.objectContaining({
        status: "error",
        fieldErrors: expect.objectContaining({
          phone: "Informe um telefone brasileiro válido.",
        }),
      }),
    );
    expect(backendRequest).not.toHaveBeenCalled();
  });
});

describe("customer login return", () => {
  const cookieStore = { set: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
    vi.mocked(backendRequest).mockResolvedValue({
      accessToken: "session-token",
      expiresAt: "2026-08-18T12:00:00.000Z",
      user: {
        id: "customer-id",
        fullName: "Maria Cliente",
        email: "maria@example.com",
        role: "CUSTOMER",
        organizationId: null,
      },
    });
  });

  it("returns to a local event after login", async () => {
    const formData = new FormData();
    formData.set("email", "maria@example.com");
    formData.set("password", "StrongPassword2026!");
    formData.set("returnTo", "/eventos/cinema-session");

    await customerLoginAction(initialAuthActionState, formData);

    expect(redirect).toHaveBeenCalledWith("/eventos/cinema-session");
  });

  it("rejects an external-looking return path", async () => {
    const formData = new FormData();
    formData.set("email", "maria@example.com");
    formData.set("password", "StrongPassword2026!");
    formData.set("returnTo", "//malicious.example");

    await customerLoginAction(initialAuthActionState, formData);

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("rejects traversal outside the purchase surface", async () => {
    const formData = new FormData();
    formData.set("email", "maria@example.com");
    formData.set("password", "StrongPassword2026!");
    formData.set("returnTo", "/eventos/../admin");

    await customerLoginAction(initialAuthActionState, formData);

    expect(redirect).toHaveBeenCalledWith("/");
  });
});

describe("admin login roles", () => {
  const cookieStore = { set: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
  });

  it("allows gate staff and redirects directly to the gate", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      accessToken: "staff-session",
      expiresAt: "2026-08-18T12:00:00.000Z",
      user: {
        id: "staff-id",
        fullName: "Gabriel Portaria",
        email: "gate@example.com",
        role: "ORGANIZER_STAFF",
        organizationId: "organization-id",
      },
    });

    await organizerLoginAction(initialAuthActionState, new FormData());

    expect(cookieStore.set).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/admin/portaria");
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
    vi.mocked(backendRequest).mockResolvedValue({
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
    vi.mocked(backendRequest).mockResolvedValue({
      status: "ALREADY_CONFIRMED",
    });
    cookieStore.get.mockReturnValue(undefined);

    await expect(confirmEmailAction("used-token", "admin")).resolves.toEqual({
      status: "success",
      message: "Seu e-mail já estava confirmado.",
      redirectTo: "/admin/login",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
