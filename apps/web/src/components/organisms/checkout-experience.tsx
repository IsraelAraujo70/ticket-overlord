"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2Icon, Clock3Icon, ShieldCheckIcon, XCircleIcon } from "lucide-react";
import { Logo } from "@/components/atoms/logo";
import { Button } from "@/components/ui/button";
import type { Reservation } from "@/features/checkout/checkout.types";
import { initialCheckoutActionState } from "@/features/checkout/checkout.types";
import { processPaymentAction } from "@/server/checkout/checkout-actions";

export function CheckoutExperience({ reservation }: { reservation: Reservation }) {
  const [state, formAction, pending] = useActionState(processPaymentAction, initialCheckoutActionState);
  const [remainingSeconds, setRemainingSeconds] = useState(() => secondsUntil(reservation.expiresAt));

  useEffect(() => {
    const interval = window.setInterval(() => setRemainingSeconds(secondsUntil(reservation.expiresAt)), 1000);
    return () => window.clearInterval(interval);
  }, [reservation.expiresAt]);

  const persistedOutcome = reservation.status === "PAID"
    ? "APPROVED"
    : reservation.status === "PAYMENT_REFUSED"
      ? "REFUSED"
      : undefined;
  const terminalOutcome = state.status === "success" ? state.outcome : persistedOutcome;
  const holdLost = state.status === "error" && (state.code === "HOLD_EXPIRED" || state.code === "RESERVATION_EXPIRED" || state.code === "RESERVATION_NOT_FOUND");
  const expired = holdLost || reservation.status === "EXPIRED" || (remainingSeconds === 0 && reservation.status === "PENDING_PAYMENT");
  const canPay = reservation.status === "PENDING_PAYMENT" && !expired && !terminalOutcome;

  return (
    <div className="min-h-screen bg-ticket-ink px-5 py-8 text-ticket-paper sm:py-12">
      <header className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <Link href="/" aria-label="Voltar ao início"><Logo inverted /></Link>
        <span className="font-mono text-xs tracking-[0.18em] text-ticket-paper/55 uppercase">Checkout simulado</span>
      </header>
      <main className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_22rem]">
        <section className="overflow-hidden rounded-2xl bg-ticket-paper text-ticket-ink">
          <div className="border-b border-dashed border-ticket-ink/20 p-6 sm:p-8">
            <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">Sua reserva</p>
            <h1 className="mt-2 font-heading text-5xl leading-none font-bold uppercase">{reservation.event.title}</h1>
            <p className="mt-4 text-sm text-muted-foreground">{formatDate(reservation.event.startsAt)} · {reservation.event.venue}, {reservation.event.city}</p>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-3 sm:p-8">
            <Summary label="Quantidade" value={`${reservation.quantity} ingresso${reservation.quantity > 1 ? "s" : ""}`} />
            <Summary label="Preço unitário" value={formatMoney(reservation.unitPriceInCents)} />
            <Summary label="Total" value={formatMoney(reservation.totalInCents)} emphasis />
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          {terminalOutcome ? (
            <Result
              outcome={terminalOutcome}
              message={state.message ?? (terminalOutcome === "APPROVED" ? "Pagamento aprovado. Sua compra está confirmada." : "Pagamento recusado. Nenhuma cobrança foi realizada.")}
              slug={reservation.event.slug}
            />
          ) : expired ? (
            <Result message={holdLost ? "Outra pessoa conseguiu assegurar esse ingresso primeiro." : "O prazo terminou e os ingressos voltaram para a venda."} slug={reservation.event.slug} soldOut={holdLost} />
          ) : (
            <form action={formAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <input type="hidden" name="idempotencyKey" value={reservation.id} />
              <div className="flex items-center gap-3 text-ticket-coral">
                <Clock3Icon className="size-5" aria-hidden="true" />
                <span className="font-mono text-2xl font-semibold">{formatCountdown(remainingSeconds)}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-ticket-paper/65">Conclua a simulação antes que a reserva expire.</p>
              <div className="mt-6 space-y-3">
                <Button type="submit" name="outcome" value="APPROVED" size="lg" className="w-full" disabled={!canPay || pending}>Simular aprovação</Button>
                <Button type="submit" name="outcome" value="REFUSED" variant="outline" size="lg" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" disabled={!canPay || pending}>Simular recusa</Button>
              </div>
              {state.status === "error" ? <p role="alert" className="mt-4 text-sm font-medium text-ticket-coral">{state.code === "CHECKOUT_UNAVAILABLE" ? "O checkout está temporariamente indisponível. Tente novamente." : state.message}</p> : null}
              <p className="mt-5 flex gap-2 text-xs leading-5 text-ticket-paper/50"><ShieldCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Ambiente demonstrativo. Nenhum dado financeiro é solicitado.</p>
            </form>
          )}
        </aside>
      </main>
    </div>
  );
}

function Summary({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div><p className="text-xs text-muted-foreground uppercase">{label}</p><p className={emphasis ? "mt-1 font-heading text-3xl font-bold" : "mt-1 font-semibold"}>{value}</p></div>;
}

function Result({ outcome, message, slug, soldOut = false }: { outcome?: "APPROVED" | "REFUSED"; message: string | undefined; slug: string; soldOut?: boolean }) {
  const approved = outcome === "APPROVED";
  const Icon = approved ? CheckCircle2Icon : XCircleIcon;
  return <div className="text-center"><Icon className={approved ? "mx-auto size-12 text-emerald-400" : "mx-auto size-12 text-ticket-coral"} aria-hidden="true" /><h2 className="mt-4 font-heading text-3xl font-bold uppercase">{approved ? "Compra confirmada" : outcome === "REFUSED" ? "Pagamento recusado" : soldOut ? "Ingresso esgotado" : "Reserva expirada"}</h2><p className="mt-3 text-sm leading-6 text-ticket-paper/65">{message}</p><Link href={approved ? "/" : `/eventos/${slug}`} className="mt-6 flex h-9 w-full items-center justify-center rounded-lg border border-white/20 bg-ticket-paper px-3 text-sm font-semibold text-ticket-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/40">{approved ? "Voltar ao início" : "Tentar novamente"}</Link></div>;
}

function secondsUntil(value: string) { return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000)); }
function formatCountdown(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function formatMoney(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100); }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
