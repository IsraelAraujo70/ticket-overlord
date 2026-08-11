import { AlertCircleIcon } from "lucide-react";
import { AdminEventsList } from "@/components/organisms/admin-events-list";
import { PageHeader } from "@/components/molecules/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listOrganizerEvents } from "@/server/events/events";
import type { AdminEvent } from "@/features/events/event.types";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  let events: AdminEvent[] = [];
  let failed = false;

  try {
    events = await listOrganizerEvents();
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Programação"
          title="Eventos"
          description="Gerencie os eventos pertencentes à sua organização."
        />
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Não foi possível carregar os eventos</AlertTitle>
          <AlertDescription>
            Confirme se a API, o PostgreSQL e o MinIO estão disponíveis.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <AdminEventsList events={events} created={created === "1"} />;
}
