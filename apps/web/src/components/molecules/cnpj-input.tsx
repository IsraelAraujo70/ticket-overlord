"use client";

import { InputMask, type InputMaskProps } from "@react-input/mask";
import { format as formatCnpj } from "@fnando/cnpj";
import { Input } from "@/components/ui/input";

type CnpjInputProps = InputMaskProps<typeof Input>;

export function CnpjInput({ onChange, ...props }: CnpjInputProps) {
  return (
    <InputMask
      {...props}
      component={Input}
      mask="@@.@@@.@@@/@@@@-__"
      replacement={{ "@": /[A-Za-z0-9]/, _: /\d/ }}
      track={({ data }) => data?.toUpperCase()}
      inputMode="text"
      autoCapitalize="characters"
      maxLength={18}
      onChange={(event) => {
        event.currentTarget.value = formatCnpj(event.currentTarget.value);
        onChange?.(event);
      }}
    />
  );
}
