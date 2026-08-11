import type { UserRole } from './user-role';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
}

export interface AuthenticatedSession {
  tokenHash: string;
  user: AuthenticatedUser;
}
