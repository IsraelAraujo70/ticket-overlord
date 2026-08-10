export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

function calculateDigit(base: number[], weights: number[]): number {
  const sum = base.reduce(
    (total, digit, index) => total + digit * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value: string): boolean {
  const normalized = normalizeCnpj(value);

  if (!/^\d{14}$/.test(normalized) || /^(\d)\1{13}$/.test(normalized)) {
    return false;
  }

  const digits = [...normalized].map(Number);
  const first = calculateDigit(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const second = calculateDigit(
    [...digits.slice(0, 12), first],
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return digits[12] === first && digits[13] === second;
}
