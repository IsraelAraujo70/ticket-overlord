import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TicketQr } from "./ticket-qr";

const toDataURL = vi.hoisted(() => vi.fn().mockResolvedValue("data:image/png;base64,qr"));

vi.mock("qrcode", () => ({ default: { toDataURL } }));

describe("TicketQr", () => {
  it("renders the exact signed ticket code", async () => {
    render(<TicketQr code="to1.key.ticket.event.signature" label="QR do ingresso" />);

    await waitFor(() => {
      expect(toDataURL).toHaveBeenCalledWith(
        "to1.key.ticket.event.signature",
        expect.objectContaining({ errorCorrectionLevel: "M" }),
      );
    });
    expect(screen.getByRole("img", { name: "QR do ingresso" })).toHaveAttribute(
      "src",
      "data:image/png;base64,qr",
    );
  });
});
