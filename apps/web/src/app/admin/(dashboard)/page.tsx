import { AlertCircleIcon } from 'lucide-react';
import { ReportOverview } from '@/components/organisms/report-overview';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ReportOverview as ReportOverviewData } from '@/features/reporting/reporting.types';
import { reportingPeriod } from '@/features/reporting/reporting.types';
import { getReportOverview } from '@/server/reporting/reporting';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: requestedPeriod } = await searchParams;
  const period = reportingPeriod(requestedPeriod);
  let report: ReportOverviewData | undefined;
  try {
    report = await getReportOverview(period);
  } catch {
    // The stable error state below keeps infrastructure details out of the UI.
  }
  return report ? (
    <ReportOverview report={report} />
  ) : (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Não foi possível carregar a visão geral</AlertTitle>
      <AlertDescription>
        Confirme se a API e o PostgreSQL estão disponíveis.
      </AlertDescription>
    </Alert>
  );
}
