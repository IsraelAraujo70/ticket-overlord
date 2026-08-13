import Link from "next/link";
import { CalendarPlusIcon, CheckCircle2Icon } from "lucide-react";
import { AdminEventCard } from "@/components/molecules/admin-event-card";
import { PageHeader } from "@/components/molecules/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { AdminEvent } from "@/features/events/event.types";

export function AdminEventsList({
  created,
  events,
  readOnly = false,
}: {
  created: boolean;
  events: AdminEvent[];
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <PageHeader
          eyebrow="Programação"
          title="Eventos"
          description={
            readOnly
              ? "Visualize os eventos de todas as organizações."
              : "Crie sessões de Cinema pelo TMDb ou cadastre outras categorias manualmente."
          }
        />
        {readOnly ? null : (
          <Link
            href="/admin/eventos/novo"
            className={buttonVariants({ size: "lg" })}
          >
            <CalendarPlusIcon data-icon="inline-start" />
            Criar evento
          </Link>
        )}
      </div>

      {created && !readOnly ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Rascunho criado</AlertTitle>
          <AlertDescription>
            O evento está salvo e ainda não aparece no catálogo público.
          </AlertDescription>
        </Alert>
      ) : null}

      {events.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <AdminEventCard key={event.id} event={event} readOnly={readOnly} />
          ))}
        </div>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarPlusIcon />
            </EmptyMedia>
            <EmptyTitle>Nenhum evento criado</EmptyTitle>
            <EmptyDescription>
              {readOnly
                ? "Nenhuma organização cadastrou eventos até agora."
                : "Busque um filme no catálogo externo e monte a primeira sessão da sua organização."}
            </EmptyDescription>
          </EmptyHeader>
          {readOnly ? null : (
            <EmptyContent>
              <Link href="/admin/eventos/novo" className={buttonVariants()}>
                Criar primeiro evento
              </Link>
            </EmptyContent>
          )}
        </Empty>
      )}
    </div>
  );
}
