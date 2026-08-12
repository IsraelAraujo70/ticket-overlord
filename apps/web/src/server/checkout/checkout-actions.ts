"use server";

import { redirect } from "next/navigation";
import type {
  CheckoutActionState,
  PaymentResponse,
  Reservation,
} from "@/features/checkout/checkout.types";
import { getSessionToken } from "@/server/auth/session";
import { backendRequest, BackendRequestError } from "@/server/backend-client";

function actionError(error: unknown): CheckoutActionState {
  if (error instanceof BackendRequestError) {
    return {
      status: "error",
      code: error.code,
      message: error.message,
    };
  }

  return {
    status: "error",
    message: "Não foi possível concluir a solicitação.",
  };
}

export async function createReservationAction(
  _state: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const token = await getSessionToken();
  const eventId = String(formData.get("eventId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!token) {
    redirect(`/login?returnTo=${encodeURIComponent(`/eventos/${slug}`)}`);
  }

  let reservation: Reservation;
  try {
    reservation = await backendRequest<Reservation>("/reservations", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        eventId,
        quantity: Number(formData.get("quantity")),
      }),
    });
  } catch (error) {
    return actionError(error);
  }

  redirect(`/checkout/${reservation.id}`);
}

export async function processPaymentAction(
  _state: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const token = await getSessionToken();
  if (!token) {
    return { status: "error", message: "Entre novamente para continuar." };
  }

  const reservationId = String(formData.get("reservationId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");
  if (outcome !== "APPROVED" && outcome !== "REFUSED") {
    return { status: "error", message: "Resultado de pagamento inválido." };
  }

  try {
    const result = await backendRequest<PaymentResponse>(
      `/reservations/${encodeURIComponent(reservationId)}/payment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": String(formData.get("idempotencyKey") ?? ""),
        },
        body: JSON.stringify({ outcome }),
      },
    );

    return {
      status: "success",
      outcome: result.payment.status,
      message:
        result.payment.status === "APPROVED"
          ? "Pagamento aprovado. Sua compra está confirmada."
          : "Pagamento recusado. Nenhuma cobrança foi realizada.",
    };
  } catch (error) {
    return actionError(error);
  }
}
