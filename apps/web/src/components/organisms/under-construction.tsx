import { ArrowUpRightIcon, ConstructionIcon, TicketIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UnderConstructionProps {
  section: string;
}

export function UnderConstruction({ section }: UnderConstructionProps) {
  return (
    <section
      className="grid min-h-[calc(100svh-9rem)] place-items-center py-6"
      aria-labelledby="under-construction-title"
    >
      <Card className="relative w-full max-w-2xl overflow-hidden">
        <div className="h-2 bg-[repeating-linear-gradient(135deg,var(--primary)_0_18px,var(--ticket-coral)_18px_36px)]" />
        <CardContent className="relative grid gap-8 px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex items-start justify-between gap-6">
            <div className="flex size-14 shrink-0 rotate-3 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <TicketIcon className="size-7" aria-hidden="true" />
            </div>
            <Badge variant="secondary">
              <ConstructionIcon data-icon="inline-start" aria-hidden="true" />
              Área temporariamente indisponível
            </Badge>
          </div>

          <div className="grid gap-3 border-y border-dashed py-8">
            <p className="font-mono text-xs font-semibold tracking-[0.16em] text-primary uppercase">
              Administração / {section}
            </p>
            <h1
              id="under-construction-title"
              className="font-heading text-5xl leading-none font-bold tracking-tight uppercase sm:text-6xl"
            >
              Em construção
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Estamos preparando a área de {section.toLowerCase()}. Ela será
              liberada quando o fluxo estiver pronto para uso de ponta a ponta.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs text-muted-foreground uppercase">
              Nenhum dado demonstrativo será exibido
            </p>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Ver site público
              <ArrowUpRightIcon data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
