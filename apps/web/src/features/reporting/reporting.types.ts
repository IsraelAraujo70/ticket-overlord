export const REPORTING_PERIODS = ['7d', '30d', '90d', 'all'] as const;

export type ReportingPeriod = (typeof REPORTING_PERIODS)[number];

export interface ReportTotals {
  purchases: number;
  ticketsSold: number;
  grossRevenueInCents: number;
  checkIns: number;
}

export interface ReportEvent extends ReportTotals {
  id: string;
  organizationName: string;
  title: string;
  startsAt: string;
  venue: string;
  city: string;
  capacity: number;
  ticketsSoldAllTime: number;
  checkInsAllTime: number;
  availableQuantity: number;
  occupancyPercentage: number;
}

export interface ReportOverview {
  scope: 'ORGANIZATION' | 'GLOBAL';
  period: ReportingPeriod;
  totals: ReportTotals;
  upcomingEvents: ReportEvent[];
}

export interface ReportEventPage {
  items: ReportEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export function reportingPeriod(value: string | undefined): ReportingPeriod {
  return REPORTING_PERIODS.includes(value as ReportingPeriod)
    ? (value as ReportingPeriod)
    : '30d';
}

export const reportingPeriodLabels: Record<ReportingPeriod, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o histórico',
};
