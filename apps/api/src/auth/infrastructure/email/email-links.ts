import type { UserRole } from '../../domain/user-role';

function isAdminSurface(role: UserRole): boolean {
  return role !== 'CUSTOMER';
}

export function confirmationLink(
  baseUrl: string,
  role: UserRole,
  token: string,
): string {
  const path = isAdminSurface(role)
    ? '/admin/confirmar-email'
    : '/confirmar-email';
  return `${baseUrl}${path}#token=${encodeURIComponent(token)}`;
}

export function passwordResetLink(
  baseUrl: string,
  role: UserRole,
  token: string,
): string {
  const path = isAdminSurface(role)
    ? '/admin/redefinir-senha'
    : '/redefinir-senha';
  return `${baseUrl}${path}#token=${encodeURIComponent(token)}`;
}
