import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { EventError } from '../domain/event.errors';

/** Ensures event mutations always belong to an organizer organization. */
export function organizerOrganization(user: AuthenticatedUser): string {
  if (user.role !== 'ORGANIZER') {
    throw new EventError(
      'ORGANIZER_REQUIRED',
      'Somente organizadores podem gerenciar eventos.',
    );
  }

  if (!user.organizationId) {
    throw new EventError(
      'ORGANIZATION_REQUIRED',
      'A conta precisa estar vinculada a uma organização.',
    );
  }

  return user.organizationId;
}
