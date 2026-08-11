import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CnpjInput } from "@/components/molecules/cnpj-input";

describe("CnpjInput", () => {
  it("formats and uppercases an alphanumeric CNPJ", () => {
    render(<CnpjInput aria-label="CNPJ" />);

    const input = screen.getByLabelText("CNPJ");
    fireEvent.change(input, { target: { value: "12abc34501de35" } });

    expect(input).toHaveValue("12.ABC.345/01DE-35");
  });
});
