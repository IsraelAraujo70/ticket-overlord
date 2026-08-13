import Link from "next/link";
import { CalendarDaysIcon, MapPinIcon, TicketIcon } from "lucide-react";
import { PublicFooter } from "@/components/organisms/public-footer";
import { PublicHeader } from "@/components/organisms/public-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ticket } from "@/features/tickets/ticket.types";
import type { AuthUser } from "@/server/auth/auth.types";

export function MyTicketsExperience({ tickets, user }: { tickets: Ticket[]; user: AuthUser }) {
  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-ticket-mist">
      <PublicHeader isLoading={false} query="" user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 lg:px-8 lg:py-16">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">Carteira de acesso</p>
        <h1 className="mt-2 font-heading text-6xl font-bold uppercase">Meus ingressos</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Cada ingresso tem seu próprio QR e pode entrar separadamente.</p>
        {tickets.length === 0 ? (
          <section className="mt-10 rounded-3xl border border-dashed bg-white p-10 text-center">
            <TicketIcon className="mx-auto size-12 text-ticket-coral" aria-hidden="true" />
            <h2 className="mt-4 font-heading text-3xl font-bold uppercase">Sua carteira está vazia</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ingressos aparecem aqui assim que o pagamento é aprovado.</p>
            <Link href="/#eventos" className={cn(buttonVariants(), "mt-6")}>Explorar eventos</Link>
          </section>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/meus-ingressos/${ticket.id}`} className="group grid overflow-hidden rounded-2xl border bg-white shadow-lg shadow-ticket-ink/5 transition-transform hover:-translate-y-1 sm:grid-cols-[8rem_1fr]">
                <div className="flex flex-col justify-between bg-ticket-coral p-5 text-ticket-coral-foreground">
                  <TicketIcon className="size-7" aria-hidden="true" />
                  <p className="font-mono text-xs font-semibold uppercase">Ingresso {ticket.sequence}</p>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={ticket.status === "VALID" ? "default" : "secondary"}>{ticket.status === "VALID" ? "Disponível" : "Utilizado"}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{ticket.manualCode}</span>
                  </div>
                  <h2 className="mt-4 font-heading text-3xl font-bold uppercase">{ticket.event.title}</h2>
                  <p className="mt-4 flex gap-2 text-sm text-muted-foreground"><CalendarDaysIcon className="size-4 shrink-0" />{formatDate(ticket.event.startsAt)}</p>
                  <p className="mt-2 flex gap-2 text-sm text-muted-foreground"><MapPinIcon className="size-4 shrink-0" />{ticket.event.venue}, {ticket.event.city}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}
