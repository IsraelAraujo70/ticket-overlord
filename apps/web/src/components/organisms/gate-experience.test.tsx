import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GateExperience } from "./gate-experience";

const actionState = vi.hoisted(() => ({
  action: vi.fn(),
  current: { status: "idle" } as {
    status: "idle" | "success" | "error";
    result?: "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT" | "OUTSIDE_ADMISSION_WINDOW";
    message?: string;
  },
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return { ...original, useActionState: () => [actionState.current, actionState.action, false] };
});
vi.mock("@/server/tickets/ticket-actions", () => ({ validateTicketAction: vi.fn() }));
vi.mock("@/components/molecules/qr-camera-scanner", () => ({
  QrCameraScanner: ({ onScan }: { onScan: (value: string) => void }) => (
    <button type="button" onClick={() => onScan("signed-code")}>Simular câmera</button>
  ),
}));

const events = [{
  id: "event-id",
  title: "Cidade de Deus",
  startsAt: "2026-08-22T22:00:00.000Z",
  venue: "Cine Belas Artes",
  city: "São Paulo",
}];

describe("GateExperience", () => {
  beforeEach(() => {
    actionState.action.mockClear();
    actionState.current = { status: "idle" };
  });

  it("keeps manual validation available beside the camera", () => {
    render(<GateExperience events={events} />);

    expect(screen.getByRole("button", { name: "Simular câmera" })).toBeInTheDocument();
    expect(screen.getByLabelText("Código manual ou conteúdo do QR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validar entrada" })).toBeDisabled();
  });

  it.each([
    ["VALID", "Entrada liberada"],
    ["INVALID", "Ingresso inválido"],
    ["ALREADY_USED", "Ingresso já utilizado"],
    ["WRONG_EVENT", "Evento errado"],
    ["OUTSIDE_ADMISSION_WINDOW", "Fora da data"],
  ] as const)("shows %s without relying only on color", (result, heading) => {
    actionState.current = { status: "success", result };
    render(<GateExperience events={events} />);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("fills the same input when the camera reads a QR", () => {
    render(<GateExperience events={events} />);
    fireEvent.click(screen.getByRole("button", { name: "Simular câmera" }));
    expect(screen.getByLabelText("Código manual ou conteúdo do QR")).toHaveValue("signed-code");
    expect(actionState.action).toHaveBeenCalledOnce();
    const submitted = actionState.action.mock.calls[0]?.[0] as FormData;
    expect(submitted.get("eventId")).toBe("event-id");
    expect(submitted.get("code")).toBe("signed-code");
  });
});
