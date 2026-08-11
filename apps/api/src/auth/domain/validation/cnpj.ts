import { isValid, strip } from '@fnando/cnpj/commonjs/index.js';

export function normalizeCnpj(value: string): string {
  return strip(value).toUpperCase();
}

export function isValidCnpj(value: string): boolean {
  return isValid(normalizeCnpj(value));
}
