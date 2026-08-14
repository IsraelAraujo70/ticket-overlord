import type {
  ReportEvent,
  ReportEventPage,
  ReportingScope,
  ReportingWindow,
  ReportTotals,
} from '../../domain/reporting.types';

export interface ReportEventQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export abstract class ReportingStore {
  abstract totals(
    scope: ReportingScope,
    window: ReportingWindow,
  ): Promise<ReportTotals>;

  abstract upcomingEvents(
    scope: ReportingScope,
    window: ReportingWindow,
    limit: number,
  ): Promise<ReportEvent[]>;

  abstract eventPage(
    scope: ReportingScope,
    window: ReportingWindow,
    query: ReportEventQuery,
  ): Promise<ReportEventPage>;
}
