import { cookies } from "next/headers";
import { backendRequest } from "@/server/backend-client";
import type { AuthUser, LoginResponse } from "./auth.types";

export const SESSION_COOKIE = "ticket_overlord_session";

export async function persistSession(login: LoginResponse): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, login.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(login.expiresAt),
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    return await backendRequest<AuthUser>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
}
