import { AlertCircleIcon } from "lucide-react";
import { AdminEventsList } from "@/components/organisms/admin-events-list";
import { PageHeader } from "@/components/molecules/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listOrganizerEvents } from "@/server/events/events";
import type { AdminEvent } from "@/features/events/event.types";
import { getCurrentUser } from "@/server/auth/session";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; page?: string; search?: string }>;
}) {
  const { created, page: requestedPage, search = "" } = await searchParams;
  const parsedPage = Number(requestedPage ?? "1");
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const user = await getCurrentUser();
  let events: AdminEvent[] = [];
  let total = 0;
  let pageSize = 50;
  let failed = false;

  try {
    const result = await listOrganizerEvents(page, search);
    events = result.items;
    total = result.total;
    pageSize = result.pageSize;
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

  return (
    <AdminEventsList
      events={events}
      created={created === "1"}
      readOnly={user?.role === "ADMIN"}
      page={page}
      pages={Math.max(1, Math.ceil(total / pageSize))}
      search={search}
    />
  );
}
