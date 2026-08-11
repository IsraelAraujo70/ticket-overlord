export type UserRole =
  | "CUSTOMER"
  | "ORGANIZER"
  | "ADMIN"
  | "ORGANIZER_STAFF";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

export type EmailConfirmationResponse =
  | { status: "CONFIRMED"; session: LoginResponse }
  | { status: "ALREADY_CONFIRMED" };

export interface AuthActionState {
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
}

export interface OrganizerRegistrationActionState extends AuthActionState {
  fieldErrors?: Partial<Record<"cnpj" | "phone" | "state", string>>;
}

export interface EmailConfirmationActionState extends AuthActionState {
  redirectTo?: string;
}

export const initialAuthActionState: AuthActionState = { status: "idle" };
export const initialOrganizerRegistrationActionState: OrganizerRegistrationActionState = {
  status: "idle",
};
