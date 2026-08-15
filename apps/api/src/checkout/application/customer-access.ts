import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { CheckoutError } from '../domain/checkout.errors';

/** Restricts checkout operations to customer accounts. */
export function requireCustomer(user: AuthenticatedUser): string {
  if (user.role !== 'CUSTOMER') {
    throw new CheckoutError(
      'CUSTOMER_REQUIRED',
      'Somente clientes podem realizar reservas e pagamentos.',
    );
  }
  return user.id;
}
