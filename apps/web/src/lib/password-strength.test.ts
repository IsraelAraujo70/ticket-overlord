import { describe, expect, it } from "vitest";
import { getPasswordStrength, isStrongPassword } from "@/lib/password-strength";

describe("password strength", () => {
  it.each([
    ["Short1!", "Fraca"],
    ["LongPassword2026", "Média"],
    ["LongPassword2026!", "Forte"],
  ] as const)("classifies %s as %s", (password, label) => {
    expect(getPasswordStrength(password).label).toBe(label);
  });

  it("requires every password criterion", () => {
    expect(isStrongPassword("LongPassword2026!")).toBe(true);
    expect(isStrongPassword("long password 2026!")).toBe(false);
    expect(isStrongPassword("Long Password2026")).toBe(false);
  });
});
