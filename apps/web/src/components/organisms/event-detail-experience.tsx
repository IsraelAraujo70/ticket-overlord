"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  CalendarDaysIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  TicketIcon,
} from "lucide-react";
import { PublicFooter } from "@/components/organisms/public-footer";
import { PublicHeader } from "@/components/organisms/public-header";
import { Button } from "@/components/ui/button";
import type { PublishedEventDetail } from "@/features/checkout/checkout.types";
import { initialCheckoutActionState } from "@/features/checkout/checkout.types";
import type { AuthUser } from "@/server/auth/auth.types";
import { createReservationAction } from "@/server/checkout/checkout-actions";

export function EventDetailExperience({
  event,
  user,
}: {
  event: PublishedEventDetail;
  user: AuthUser | null;
}) {
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState(
    createReservationAction,
    initialCheckoutActionState,
  );
  const maximum = Math.min(event.maxQuantityPerReservation, event.availableQuantity);
  const isCustomer = user?.role === "CUSTOMER";
  const returnTo = `/eventos/${event.slug}`;

  return (
    <div className="min-h-screen bg-ticket-mist">
      <PublicHeader isLoading={false} query="" user={user} />
      <main>
        <section className="relative overflow-hidden bg-ticket-ink text-ticket-paper">
          <div className="absolute inset-0 opacity-20">
            <Image src={event.coverUrl} alt="" fill unoptimized className="object-cover blur-2xl" />
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-20">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/15 shadow-2xl">
              <Image
                src={event.coverUrl}
                alt={`Capa do evento ${event.title}`}
                fill
                unoptimized
                sizes="(max-width: 1024px) 90vw, 36vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-mono text-xs tracking-[0.2em] text-ticket-coral uppercase">
                {event.category} · ingressos disponíveis
              </p>
              <h1 className="mt-4 font-heading text-6xl leading-[0.85] font-bold uppercase sm:text-7xl lg:text-8xl">
                {event.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-ticket-paper/75">
                {event.summary}
              </p>
              <div className="mt-8 grid gap-4 border-y border-white/15 py-6 sm:grid-cols-2">
                <EventFact icon={CalendarDaysIcon}>{formatDate(event.startsAt)}</EventFact>
                <EventFact icon={MapPinIcon}>{event.venue}, {event.city}</EventFact>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_24rem] lg:px-8 lg:py-16">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">Entrada geral</p>
            <h2 className="mt-2 font-heading text-4xl font-bold uppercase">Escolha sua quantidade</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Sua reserva fica protegida por 10 minutos enquanto você conclui o pagamento.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
              <TicketIcon className="size-6 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Ingresso individual</p>
                <p className="text-sm text-muted-foreground">{event.availableQuantity} disponíveis agora</p>
              </div>
              <p className="ml-auto font-mono font-semibold">{formatMoney(event.priceInCents)}</p>
            </div>
          </div>

          <aside className="h-fit rounded-2xl border bg-white p-6 shadow-xl shadow-ticket-ink/10 lg:sticky lg:top-24">
            <form action={formAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <input type="hidden" name="slug" value={event.slug} />
              <input type="hidden" name="quantity" value={quantity} />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Quantidade</span>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="icon" aria-label="Diminuir quantidade" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)}>
                    <MinusIcon />
                  </Button>
                  <output className="w-7 text-center font-mono text-lg font-semibold" aria-live="polite">{quantity}</output>
                  <Button type="button" variant="outline" size="icon" aria-label="Aumentar quantidade" disabled={quantity >= maximum} onClick={() => setQuantity((value) => value + 1)}>
                    <PlusIcon />
                  </Button>
                </div>
              </div>
              <div className="my-6 flex items-end justify-between border-t pt-6">
                <span className="text-sm text-muted-foreground">Total</span>
                <strong className="font-heading text-4xl uppercase">{formatMoney(event.priceInCents * quantity)}</strong>
              </div>
              {state.message ? <p role="alert" className="mb-4 text-sm font-medium text-destructive">{state.message}</p> : null}
              {maximum === 0 ? (
                <Button disabled className="w-full" size="lg">Ingressos esgotados</Button>
              ) : !user ? (
                <Button className="w-full" size="lg" nativeButton={false} render={<Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} />}>Entrar para reservar</Button>
              ) : !isCustomer ? (
                <Button className="w-full" size="lg" nativeButton={false} render={<Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} />}>Entrar como cliente</Button>
              ) : (
                <Button type="submit" className="w-full" size="lg" disabled={pending}>{pending ? "Reservando..." : "Reservar por 10 minutos"}</Button>
              )}
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheckIcon className="size-4" aria-hidden="true" /> Inventário protegido contra venda excedente
              </p>
            </form>
          </aside>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function EventFact({ icon: Icon, children }: { icon: typeof CalendarDaysIcon; children: React.ReactNode }) {
  return <p className="flex items-center gap-3 text-sm"><Icon className="size-5 text-ticket-coral" aria-hidden="true" />{children}</p>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}
