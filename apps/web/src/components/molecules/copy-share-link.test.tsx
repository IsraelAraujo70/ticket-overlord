import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CopyShareLink } from "./copy-share-link";

describe("CopyShareLink", () => {
  it("copies the public ticket URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CopyShareLink token="secret-token" />);

    fireEvent.click(screen.getByRole("button", { name: "Copiar link do ingresso" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/ingresso/secret-token`));
    expect(screen.getByRole("button", { name: "Link copiado" })).toBeInTheDocument();
  });

  it("explains when the browser blocks clipboard access", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CopyShareLink token="secret-token" />);

    fireEvent.click(screen.getByRole("button", { name: "Copiar link do ingresso" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível copiar",
    );
  });
});
