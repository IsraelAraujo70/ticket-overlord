"use server";

import { getSessionToken } from "@/server/auth/session";
import { backendRequest, BackendRequestError } from "@/server/backend-client";
import type { GateActionState, GateValidationResult } from "@/features/tickets/ticket.types";

export async function validateTicketAction(
  _state: GateActionState,
  formData: FormData,
): Promise<GateActionState> {
  const token = await getSessionToken();
  if (!token) return { status: "error", message: "Entre novamente para continuar." };
  const eventId = String(formData.get("eventId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!eventId || !code) return { status: "error", message: "Selecione o evento e informe o ingresso." };

  try {
    const response = await backendRequest<{ result: GateValidationResult }>(
      `/gate/events/${encodeURIComponent(eventId)}/validate`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      },
    );
    return { status: "success", result: response.result };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof BackendRequestError ? error.message : "Não foi possível validar o ingresso.",
    };
  }
}
