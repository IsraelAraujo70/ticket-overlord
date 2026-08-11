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
  const token = await getSessionToken();

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

/** Returns the opaque backend token only to server-side callers. */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}
