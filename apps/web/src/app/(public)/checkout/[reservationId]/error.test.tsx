import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CheckoutError from "./error";

describe("CheckoutError", () => {
  it("allows retrying the checkout request", () => {
    const reset = vi.fn();

    render(<CheckoutError reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
