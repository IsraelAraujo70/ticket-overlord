import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeBrazilianPhone(value: string): string | null {
  const phone = parsePhoneNumberFromString(value.trim(), 'BR');

  if (!phone || phone.country !== 'BR' || !phone.isValid()) {
    return null;
  }

  return phone.number;
}
