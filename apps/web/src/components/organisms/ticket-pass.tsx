import { CalendarDaysIcon, CheckCircle2Icon, MapPinIcon, TicketIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyShareLink } from "@/components/molecules/copy-share-link";
import { TicketQr } from "@/components/molecules/ticket-qr";
import type { SharedTicket, Ticket } from "@/features/tickets/ticket.types";

export function TicketPass({ ticket, shared = false }: { ticket: Ticket | SharedTicket; shared?: boolean }) {
  const active = ticket.status === "VALID";
  return (
    <article className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-white shadow-2xl shadow-ticket-ink/10 lg:grid-cols-[1fr_21rem]">
      <div className="relative flex min-h-[30rem] flex-col bg-ticket-ink p-7 text-ticket-paper sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-ticket-coral uppercase">Ingresso #{ticket.sequence}</p>
            <h1 className="mt-3 font-heading text-5xl leading-none font-bold uppercase sm:text-7xl">{ticket.event.title}</h1>
          </div>
          <Badge className={active ? "bg-emerald-400 text-emerald-950" : "bg-ticket-paper/15 text-ticket-paper"}>
            {active ? "Pronto para usar" : "Já utilizado"}
          </Badge>
        </div>
        <div className="mt-auto grid gap-5 border-t border-dashed border-white/25 pt-7 sm:grid-cols-2">
          <p className="flex gap-3 text-sm"><CalendarDaysIcon className="size-5 shrink-0 text-ticket-coral" aria-hidden="true" />{formatDate(ticket.event.startsAt)}</p>
          <p className="flex gap-3 text-sm"><MapPinIcon className="size-5 shrink-0 text-ticket-coral" aria-hidden="true" />{ticket.event.venue}, {ticket.event.city}</p>
          {shared && "customerName" in ticket ? <p className="sm:col-span-2 text-sm text-ticket-paper/60">Ingresso de {ticket.customerName}</p> : null}
        </div>
      </div>
      <div className="relative flex flex-col justify-center p-7 sm:p-9">
        <span className="absolute -left-3 top-1/2 hidden size-6 -translate-y-1/2 rounded-full border bg-ticket-mist lg:block" />
        <div className="rounded-2xl border bg-white p-3"><TicketQr code={ticket.qrCode} label={`QR Code do ingresso ${ticket.sequence}`} /></div>
        <p className="mt-5 text-center text-xs text-muted-foreground uppercase">Código manual</p>
        <p className="mt-1 text-center font-mono text-lg font-bold tracking-[0.14em]">{ticket.manualCode}</p>
        {ticket.status === "USED" ? <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground"><CheckCircle2Icon className="size-4" />Utilizado em {ticket.usedAt ? formatDate(ticket.usedAt) : "data registrada"}</p> : null}
        {!shared && "shareToken" in ticket ? <div className="mt-6"><CopyShareLink token={ticket.shareToken} /></div> : null}
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><TicketIcon className="size-4" />Apresente o QR ou código na portaria</p>
      </div>
    </article>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}
