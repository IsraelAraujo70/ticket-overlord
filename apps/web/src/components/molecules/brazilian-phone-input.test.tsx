import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { BrazilianPhoneInput } from "@/components/molecules/brazilian-phone-input";

function PhoneInputFixture() {
  const [value, setValue] = useState("");
  return (
    <BrazilianPhoneInput
      aria-label="Telefone"
      value={value}
      onValueChange={setValue}
    />
  );
}

describe("BrazilianPhoneInput", () => {
  it("formats a Brazilian mobile phone while preserving its E.164 value", () => {
    render(<PhoneInputFixture />);

    const input = screen.getByLabelText("Telefone");
    fireEvent.change(input, { target: { value: "35997421900" } });

    expect(input).toHaveValue("(35) 99742-1900");
  });
});
