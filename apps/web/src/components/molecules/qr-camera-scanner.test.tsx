import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QrCameraScanner } from "./qr-camera-scanner";

const scanner = vi.hoisted(() => ({
  callback: undefined as ((result?: { getText(): string }) => void) | undefined,
  stop: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  BrowserQRCodeReader: class {
    async decodeFromConstraints(
      _constraints: MediaStreamConstraints,
      _video: HTMLVideoElement,
      callback: (result?: { getText(): string }) => void,
    ) {
      scanner.callback = callback;
      return { stop: scanner.stop };
    }
  },
}));

describe("QrCameraScanner", () => {
  it("returns the first QR value and stops scanning", async () => {
    const onScan = vi.fn();
    render(<QrCameraScanner onScan={onScan} />);

    fireEvent.click(screen.getByRole("button", { name: "Ler QR Code" }));
    await waitFor(() => expect(scanner.callback).toBeDefined());
    act(() => scanner.callback?.({ getText: () => "signed-code" }));

    expect(onScan).toHaveBeenCalledWith("signed-code");
    expect(scanner.stop).toHaveBeenCalledOnce();
  });
});
