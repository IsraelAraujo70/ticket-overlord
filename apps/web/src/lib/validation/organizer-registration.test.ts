import { describe, expect, it } from "vitest";
import {
  brazilianPhoneSchema,
  cnpjSchema,
  organizerRegistrationFieldsSchema,
} from "@/lib/validation/organizer-registration";

describe("organizer registration fields", () => {
  it.each(["(35) 99742-1900", "+55 35 99742-1900"])(
    "normalizes the Brazilian phone %s to E.164",
    (phone) => {
      expect(brazilianPhoneSchema.parse(phone)).toBe("+5535997421900");
    },
  );

  it.each(["+1 202-555-0104", "1234"])("rejects the phone %s", (phone) => {
    expect(brazilianPhoneSchema.safeParse(phone).success).toBe(false);
  });

  it("normalizes numeric and alphanumeric CNPJ values", () => {
    expect(cnpjSchema.parse("11.222.333/0001-81")).toBe("11222333000181");
    expect(cnpjSchema.parse("12.abc.345/01de-35")).toBe("12ABC34501DE35");
  });

  it("rejects invalid CNPJ and state values", () => {
    expect(cnpjSchema.safeParse("11.222.333/0001-82").success).toBe(false);
    expect(
      organizerRegistrationFieldsSchema.safeParse({
        cnpj: "11.222.333/0001-81",
        phone: "(35) 99742-1900",
        state: "XX",
      }).success,
    ).toBe(false);
  });
});
