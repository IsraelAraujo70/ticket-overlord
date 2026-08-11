import { isValid as isValidCnpj, strip as stripCnpj } from "@fnando/cnpj";
// The package root loads its country-picker UI during Server Action evaluation.
import { parsePhoneNumber } from "react-phone-number-input/input";
import { z } from "zod";
import { BRAZILIAN_STATE_CODES } from "@/lib/brazilian-states";

const INVALID_CNPJ_MESSAGE = "Informe um CNPJ válido.";
const INVALID_PHONE_MESSAGE = "Informe um telefone brasileiro válido.";
const INVALID_STATE_MESSAGE = "Selecione uma UF válida.";

export const cnpjSchema = z
  .string()
  .transform((value) => stripCnpj(value).toUpperCase())
  .refine((value) => isValidCnpj(value), INVALID_CNPJ_MESSAGE);

export const brazilianPhoneSchema = z.string().transform((value, context) => {
  try {
    const phone = parsePhoneNumber(value.trim(), "BR");

    if (phone?.country === "BR" && phone.isValid()) {
      return phone.number;
    }
  } catch {
    // Zod converts malformed input into the field error below.
  }

  context.addIssue({ code: "custom", message: INVALID_PHONE_MESSAGE });
  return z.NEVER;
});

export const brazilianStateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine(
    (value) => BRAZILIAN_STATE_CODES.includes(value),
    INVALID_STATE_MESSAGE,
  );

export const organizerRegistrationFieldsSchema = z.object({
  cnpj: cnpjSchema,
  phone: brazilianPhoneSchema,
  state: brazilianStateSchema,
});

export type OrganizerRegistrationField = keyof z.input<
  typeof organizerRegistrationFieldsSchema
>;

export function firstFieldErrors(
  error: z.ZodError,
): Partial<Record<OrganizerRegistrationField, string>> {
  const errors: Partial<Record<OrganizerRegistrationField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      (field === "cnpj" || field === "phone" || field === "state") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
