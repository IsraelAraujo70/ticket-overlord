export const STRONG_PASSWORD_PATTERN =
  "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{12,128}";

export interface PasswordRequirement {
  id: "length" | "letterCase" | "number" | "symbol";
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  label: "Fraca" | "Média" | "Forte";
  score: number;
  requirements: PasswordRequirement[];
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    {
      id: "length",
      label: "De 12 a 128 caracteres",
      met: password.length >= 12 && password.length <= 128,
    },
    {
      id: "letterCase",
      label: "Letras maiúscula e minúscula",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "Pelo menos um número",
      met: /\d/.test(password),
    },
    {
      id: "symbol",
      label: "Pelo menos um símbolo",
      met: /[^A-Za-z0-9\s]/.test(password),
    },
  ];
  const score = requirements.filter((requirement) => requirement.met).length;
  const hasValidLength = requirements[0].met;

  return {
    score,
    label:
      hasValidLength && score === requirements.length
        ? "Forte"
        : hasValidLength && score >= 3
          ? "Média"
          : "Fraca",
    requirements,
  };
}

export function isStrongPassword(password: string): boolean {
  return getPasswordStrength(password).score === 4;
}
