import { AlertCircleIcon } from 'lucide-react';
import { TicketSalesReport } from '@/components/organisms/ticket-sales-report';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ReportEventPage } from '@/features/reporting/reporting.types';
import { reportingPeriod } from '@/features/reporting/reporting.types';
import type { AuthUser } from '@/server/auth/auth.types';
import { getCurrentUser } from '@/server/auth/session';
import { getEventReport } from '@/server/reporting/reporting';

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; period?: string; search?: string }>;
}) {
  const params = await searchParams;
  const parsedPage = Number(params.page ?? '1');
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const period = reportingPeriod(params.period);
  const search = params.search?.trim().slice(0, 100) ?? '';
  let report: ReportEventPage | undefined;
  let user: AuthUser | null = null;
  try {
    [report, user] = await Promise.all([
      getEventReport(period, page, search),
      getCurrentUser(),
    ]);
  } catch {
    // The stable error state below keeps infrastructure details out of the UI.
  }
  return report ? (
    <TicketSalesReport
      global={user?.role === 'ADMIN'}
      page={page}
      period={period}
      report={report}
      search={search}
    />
  ) : (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Não foi possível carregar o relatório de ingressos</AlertTitle>
      <AlertDescription>
        Confirme se a API e o PostgreSQL estão disponíveis.
      </AlertDescription>
    </Alert>
  );
}
