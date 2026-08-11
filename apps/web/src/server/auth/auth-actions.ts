"use server";

import { redirect } from "next/navigation";
import {
  backendRequest,
  BackendRequestError,
} from "@/server/backend-client";
import {
  clearSession,
  getCurrentUser,
  persistSession,
  SESSION_COOKIE,
} from "@/server/auth/session";
import type {
  AuthActionState,
  AuthUser,
  EmailConfirmationActionState,
  EmailConfirmationResponse,
  LoginResponse,
  OrganizerRegistrationActionState,
} from "./auth.types";
import {
  firstFieldErrors,
  organizerRegistrationFieldsSchema,
} from "@/lib/validation/organizer-registration";
import { cookies } from "next/headers";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function actionError(error: unknown): AuthActionState {
  if (error instanceof BackendRequestError) {
    return {
      status: "error",
      message: error.message,
      code: error.code,
    };
  }

  return {
    status: "error",
    message: "Não foi possível concluir a solicitação.",
  };
}

async function login(
  formData: FormData,
  expectedSurface: "customer" | "admin",
): Promise<AuthActionState> {
  try {
    const result = await backendRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: field(formData, "email"),
        password: String(formData.get("password") ?? ""),
      }),
    });
    const allowed =
      expectedSurface === "customer"
        ? result.user.role === "CUSTOMER"
        : result.user.role === "ORGANIZER" || result.user.role === "ADMIN";

    if (!allowed) {
      await backendRequest<void>("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${result.accessToken}` },
      });
      return {
        status: "error",
        code: "WRONG_LOGIN_SURFACE",
        message:
          expectedSurface === "customer"
            ? "Use a entrada da sua organização para acessar esta conta."
            : "Use a entrada de clientes para acessar esta conta.",
      };
    }

    await persistSession(result);
  } catch (error) {
    return actionError(error);
  }

  redirect(expectedSurface === "customer" ? "/" : "/admin");
}

export async function customerLoginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return login(formData, "customer");
}

export async function organizerLoginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return login(formData, "admin");
}

export async function customerRegisterAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");

  if (password !== String(formData.get("passwordConfirmation") ?? "")) {
    return { status: "error", message: "As senhas não coincidem." };
  }

  try {
    await backendRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        accountType: "customer",
        fullName: field(formData, "fullName"),
        email: field(formData, "email"),
        password,
      }),
    });
  } catch (error) {
    return actionError(error);
  }

  redirect("/cadastro/sucesso");
}

export async function organizerRegisterAction(
  _state: OrganizerRegistrationActionState,
  formData: FormData,
): Promise<OrganizerRegistrationActionState> {
  const password = String(formData.get("password") ?? "");

  if (password !== String(formData.get("passwordConfirmation") ?? "")) {
    return { status: "error", message: "As senhas não coincidem." };
  }

  const registrationFields = organizerRegistrationFieldsSchema.safeParse({
    cnpj: field(formData, "cnpj"),
    phone: field(formData, "phone"),
    state: field(formData, "state"),
  });

  if (!registrationFields.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: firstFieldErrors(registrationFields.error),
    };
  }

  try {
    await backendRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        accountType: "organizer",
        fullName: field(formData, "fullName"),
        email: field(formData, "email"),
        password,
        organization: {
          name: field(formData, "organizationName"),
          cnpj: registrationFields.data.cnpj,
          phone: registrationFields.data.phone,
          address: {
            postalCode: field(formData, "postalCode"),
            street: field(formData, "street"),
            number: field(formData, "number"),
            complement: field(formData, "complement") || undefined,
            neighborhood: field(formData, "neighborhood"),
            city: field(formData, "city"),
            state: registrationFields.data.state,
          },
        },
      }),
    });
  } catch (error) {
    return actionError(error);
  }

  redirect("/admin/cadastro/sucesso");
}

export async function confirmEmailAction(
  token: string,
  surface: "customer" | "admin",
): Promise<EmailConfirmationActionState> {
  try {
    const result = await backendRequest<EmailConfirmationResponse>(
      "/auth/email/confirm",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      },
    );

    if (result.status === "CONFIRMED") {
      await persistSession(result.session);
      return {
        status: "success",
        message: "Seu e-mail foi confirmado.",
        redirectTo: authenticatedPath(result.session.user),
      };
    }

    const currentUser = await getCurrentUser();
    return {
      status: "success",
      message: "Seu e-mail já estava confirmado.",
      redirectTo: currentUser
        ? authenticatedPath(currentUser)
        : surface === "customer"
          ? "/login"
          : "/admin/login",
    };
  } catch (error) {
    return actionError(error);
  }
}

function authenticatedPath(user: AuthUser): string {
  return user.role === "CUSTOMER" ? "/" : "/admin";
}

export async function resendConfirmationAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await backendRequest<void>("/auth/email/resend", {
      method: "POST",
      body: JSON.stringify({ email: field(formData, "email") }),
    });
    return {
      status: "success",
      message: "Se a conta estiver pendente, enviaremos uma nova confirmação.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function forgotPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await backendRequest<void>("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email: field(formData, "email") }),
    });
    return {
      status: "success",
      message: "Se a conta existir, enviaremos as instruções de recuperação.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function resetPasswordAction(
  token: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthActionState> {
  if (password !== passwordConfirmation) {
    return { status: "error", message: "As senhas não coincidem." };
  }

  try {
    await backendRequest<void>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    return {
      status: "success",
      message: "Senha redefinida. Entre novamente com a nova senha.",
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await backendRequest<void>("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // The local cookie is cleared even if the session is already unavailable.
    }
  }

  await clearSession();
  redirect("/");
}
