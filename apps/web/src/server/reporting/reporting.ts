import 'server-only';

import type {
  ReportEventPage,
  ReportOverview,
  ReportingPeriod,
} from '@/features/reporting/reporting.types';
import { getSessionToken } from '@/server/auth/session';
import { backendRequest } from '@/server/backend-client';

async function authenticatedHeaders(): Promise<HeadersInit> {
  const token = await getSessionToken();
  if (!token) throw new Error('Authentication required.');
  return { Authorization: `Bearer ${token}` };
}

export async function getReportOverview(
  period: ReportingPeriod,
): Promise<ReportOverview> {
  return backendRequest<ReportOverview>(
    `/reports/overview?period=${encodeURIComponent(period)}`,
    { headers: await authenticatedHeaders() },
  );
}

export async function getEventReport(
  period: ReportingPeriod,
  page = 1,
  search = '',
): Promise<ReportEventPage> {
  const params = new URLSearchParams({
    period,
    page: String(page),
    pageSize: '20',
  });
  const normalizedSearch = search.trim().slice(0, 100);
  if (normalizedSearch) params.set('search', normalizedSearch);
  return backendRequest<ReportEventPage>(`/reports/events?${params.toString()}`, {
    headers: await authenticatedHeaders(),
  });
}
