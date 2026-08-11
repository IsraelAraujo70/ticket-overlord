"use client";

import type { ComponentProps } from "react";
import PhoneNumberInput, { type Value } from "react-phone-number-input/input";
import { Input } from "@/components/ui/input";

interface BrazilianPhoneInputProps
  extends Omit<ComponentProps<typeof Input>, "onChange" | "value"> {
  onValueChange(value: string): void;
  value?: string;
}

export function BrazilianPhoneInput({
  onValueChange,
  value,
  ...props
}: BrazilianPhoneInputProps) {
  return (
    <PhoneNumberInput
      {...props}
      inputComponent={Input}
      defaultCountry="BR"
      value={value}
      onChange={(nextValue?: Value) => onValueChange(nextValue ?? "")}
    />
  );
}
