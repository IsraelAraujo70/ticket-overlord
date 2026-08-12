import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getSessionToken: vi.fn() }));
vi.mock("@/server/backend-client", () => ({
  BackendRequestError: class BackendRequestError extends Error {},
  backendRequest: vi.fn(),
}));

import { redirect } from "next/navigation";
import { getSessionToken } from "@/server/auth/session";
import { backendRequest } from "@/server/backend-client";
import { initialCheckoutActionState } from "@/features/checkout/checkout.types";
import {
  createReservationAction,
  processPaymentAction,
} from "@/server/checkout/checkout-actions";

describe("checkout actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionToken).mockResolvedValue("session-token");
  });

  it("creates a reservation and sends the customer to checkout", async () => {
    vi.mocked(backendRequest).mockResolvedValue({ id: "reservation-id" });
    const formData = new FormData();
    formData.set("eventId", "event-id");
    formData.set("slug", "cinema-session");
    formData.set("quantity", "3");

    await createReservationAction(initialCheckoutActionState, formData);

    expect(backendRequest).toHaveBeenCalledWith("/reservations", {
      method: "POST",
      headers: { Authorization: "Bearer session-token" },
      body: JSON.stringify({ eventId: "event-id", quantity: 3 }),
    });
    expect(redirect).toHaveBeenCalledWith("/checkout/reservation-id");
  });

  it("forwards the stable idempotency key to payment", async () => {
    vi.mocked(backendRequest).mockResolvedValue({
      payment: { status: "APPROVED" },
      reservation: { status: "PAID" },
    });
    const formData = new FormData();
    formData.set("reservationId", "reservation-id");
    formData.set("outcome", "APPROVED");
    formData.set("idempotencyKey", "11111111-1111-4111-8111-111111111111");

    await expect(
      processPaymentAction(initialCheckoutActionState, formData),
    ).resolves.toEqual({
      status: "success",
      outcome: "APPROVED",
      message: "Pagamento aprovado. Sua compra está confirmada.",
    });
    expect(backendRequest).toHaveBeenCalledWith(
      "/reservations/reservation-id/payment",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer session-token",
          "Idempotency-Key": "11111111-1111-4111-8111-111111111111",
        },
      }),
    );
  });
});
