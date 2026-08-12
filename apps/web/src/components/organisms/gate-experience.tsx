"use client";

import { startTransition, useActionState, useState } from "react";
import { AlertTriangleIcon, BanIcon, CalendarXIcon, CheckCircle2Icon, RotateCcwIcon, TicketXIcon } from "lucide-react";
import { QrCameraScanner } from "@/components/molecules/qr-camera-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GateEvent, GateValidationResult } from "@/features/tickets/ticket.types";
import { initialGateActionState } from "@/features/tickets/ticket.types";
import { validateTicketAction } from "@/server/tickets/ticket-actions";

const resultCopy: Record<GateValidationResult, { title: string; message: string; tone: string; icon: typeof CheckCircle2Icon }> = {
  VALID: { title: "Entrada liberada", message: "Ingresso validado. Pode permitir a entrada.", tone: "bg-emerald-500 text-emerald-950", icon: CheckCircle2Icon },
  INVALID: { title: "Ingresso inválido", message: "O código não pertence a um ingresso reconhecido.", tone: "bg-destructive text-white", icon: TicketXIcon },
  ALREADY_USED: { title: "Ingresso já utilizado", message: "Este ingresso já registrou uma entrada anteriormente.", tone: "bg-amber-400 text-amber-950", icon: AlertTriangleIcon },
  WRONG_EVENT: { title: "Evento errado", message: "Este ingresso pertence a outro evento da organização.", tone: "bg-amber-400 text-amber-950", icon: BanIcon },
  OUTSIDE_ADMISSION_WINDOW: { title: "Fora da data", message: "A entrada só pode ser validada no dia do evento.", tone: "bg-secondary text-secondary-foreground", icon: CalendarXIcon },
};

export function GateExperience({ events }: { events: GateEvent[] }) {
  const [state, formAction, pending] = useActionState(validateTicketAction, initialGateActionState);
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [code, setCode] = useState("");
  function scan(value: string): void {
    setCode(value);
    const data = new FormData();
    data.set("eventId", eventId);
    data.set("code", value);
    startTransition(() => formAction(data));
  }

  const result = state.result ? resultCopy[state.result] : undefined;
  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">Controle de acesso</p><h1 className="mt-1 font-heading text-5xl font-bold uppercase">Portaria</h1></div>
        <label className="grid gap-1 text-sm font-semibold">Evento
          <select className="h-10 min-w-72 rounded-lg border bg-white px-3 font-normal" value={eventId} onChange={(event) => setEventId(event.target.value)} disabled={pending || events.length === 0}>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title} · {formatDate(event.startsAt)}</option>)}
          </select>
        </label>
      </div>

      {events.length === 0 ? <section className="mt-8 rounded-2xl border border-dashed bg-white p-10 text-center"><CalendarXIcon className="mx-auto size-12 text-ticket-coral" /><h2 className="mt-4 font-heading text-3xl font-bold uppercase">Nenhum evento publicado</h2><p className="mt-2 text-sm text-muted-foreground">Publique um evento para iniciar a operação da portaria.</p></section> : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <QrCameraScanner onScan={scan} />
          <div className="space-y-6">
            {result ? <section role="status" className={`rounded-2xl p-7 ${result.tone}`}><result.icon className="size-12" aria-hidden="true" /><h2 className="mt-4 font-heading text-4xl font-bold uppercase">{result.title}</h2><p className="mt-2 text-sm opacity-80">{result.message}</p></section> : <section className="rounded-2xl border border-dashed bg-white p-7"><h2 className="font-heading text-3xl font-bold uppercase">Aguardando ingresso</h2><p className="mt-2 text-sm text-muted-foreground">Leia o QR ou digite o código impresso no ingresso.</p></section>}
            <form action={formAction} className="rounded-2xl border bg-white p-6 shadow-sm">
              <input type="hidden" name="eventId" value={eventId} />
              <Label htmlFor="gate-code">Código manual ou conteúdo do QR</Label>
              <Input id="gate-code" name="code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ex.: ABCD1234..." className="mt-2 h-11 font-mono uppercase" autoComplete="off" />
              {state.status === "error" ? <p role="alert" className="mt-3 text-sm text-destructive">{state.message}</p> : null}
              <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending || !code.trim()}>{pending ? "Validando..." : "Validar entrada"}</Button>
              {result ? <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => setCode("")}><RotateCcwIcon />Ler próximo ingresso</Button> : null}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}
