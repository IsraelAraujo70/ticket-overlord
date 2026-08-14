export const REPORTING_PERIODS = ['7d', '30d', '90d', 'all'] as const;

export type ReportingPeriod = (typeof REPORTING_PERIODS)[number];
export type ReportingScope =
  | { mode: 'ORGANIZATION'; organizationId: string }
  | { mode: 'GLOBAL'; organizationId: null };

export interface ReportingWindow {
  from: Date | null;
  to: Date;
}

export interface ReportTotals {
  purchases: number;
  ticketsSold: number;
  grossRevenueInCents: number;
  checkIns: number;
}

export interface ReportEvent {
  id: string;
  organizationName: string;
  title: string;
  startsAt: Date;
  venue: string;
  city: string;
  capacity: number;
  purchases: number;
  ticketsSold: number;
  grossRevenueInCents: number;
  checkIns: number;
  ticketsSoldAllTime: number;
  checkInsAllTime: number;
  availableQuantity: number;
  occupancyPercentage: number;
}

export interface ReportEventPage {
  items: ReportEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportOverview {
  scope: ReportingScope['mode'];
  period: ReportingPeriod;
  totals: ReportTotals;
  upcomingEvents: ReportEvent[];
}
