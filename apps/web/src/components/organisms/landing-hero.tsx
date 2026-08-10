import { ArrowDownIcon, CalendarDaysIcon, MapPinIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="public-grid border-b">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
        <div className="flex flex-col items-start gap-7">
          <Badge variant="outline">Agenda aberta em São Paulo</Badge>
          <div className="flex flex-col gap-5">
            <h1 className="max-w-4xl font-heading text-[clamp(4rem,10vw,8.5rem)] leading-[0.78] font-bold tracking-[-0.045em] uppercase">
              Seu próximo
              <span className="block text-primary">evento começa</span>
              aqui.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              Descubra shows, teatro e experiências. Reserve com transparência e
              leve seu ingresso no celular, do checkout até a entrada.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="#eventos"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
            >
              Ver programação
              <ArrowDownIcon data-icon="inline-end" />
            </a>
            <a
              href="#como-funciona"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-5",
              )}
            >
              Como funciona
            </a>
          </div>
        </div>

        <aside className="hero-poster rounded-3xl p-7 shadow-2xl shadow-primary/10 md:p-10" aria-label="Evento em destaque">
          <div className="relative z-10 flex min-h-[32rem] flex-col justify-between gap-10">
            <div className="flex items-start justify-between gap-4">
              <Badge>Em destaque</Badge>
              <span className="font-mono text-xs tracking-[0.2em] uppercase">
                TO / 0001
              </span>
            </div>
            <div className="flex max-w-md flex-col gap-5">
              <p className="font-mono text-sm font-semibold tracking-[0.18em] text-ticket-coral uppercase">
                Sábado, 22 AGO
              </p>
              <h2 className="font-heading text-6xl leading-[0.84] font-bold tracking-tight uppercase md:text-7xl">
                Frequência urbana
              </h2>
              <p className="max-w-sm text-sm leading-6 text-ticket-paper/70">
                Uma noite de música independente com três palcos e artistas de
                diferentes cenas da cidade.
              </p>
            </div>
            <div className="grid gap-3 border-t border-ticket-paper/20 pt-5 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <CalendarDaysIcon className="size-4" aria-hidden="true" />
                19h às 02h
              </p>
              <p className="flex items-center gap-2">
                <MapPinIcon className="size-4" aria-hidden="true" />
                Complexo Barra Funda
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
