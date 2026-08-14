import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/database.constants';
import { ReportingStore } from '../../application/ports/reporting-store';
import type { ReportEventQuery } from '../../application/ports/reporting-store';
import type {
  ReportEvent,
  ReportEventPage,
  ReportingScope,
  ReportingWindow,
  ReportTotals,
} from '../../domain/reporting.types';

interface TotalsRow {
  purchases: number | string;
  tickets_sold: number | string;
  gross_revenue_in_cents: number | string;
  check_ins: number | string;
}

interface EventReportRow extends TotalsRow {
  id: string;
  organization_name: string;
  title: string;
  starts_at: Date;
  venue: string;
  city: string;
  capacity: number;
  tickets_sold_all_time: number | string;
  check_ins_all_time: number | string;
}

@Injectable()
export class PostgresReportingStore extends ReportingStore {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

  async totals(
    scope: ReportingScope,
    window: ReportingWindow,
  ): Promise<ReportTotals> {
    const result = await this.pool.query<TotalsRow>(
      `WITH scoped_events AS (
         SELECT id FROM events
         WHERE ($1::uuid IS NULL OR organization_id = $1)
       )
       SELECT
         (SELECT count(*) FROM reservations r JOIN scoped_events e ON e.id = r.event_id
          WHERE r.status = 'PAID' AND ($2::timestamptz IS NULL OR r.created_at >= $2) AND r.created_at < $3) purchases,
         (SELECT COALESCE(sum(r.quantity), 0) FROM reservations r JOIN scoped_events e ON e.id = r.event_id
          WHERE r.status = 'PAID' AND ($2::timestamptz IS NULL OR r.created_at >= $2) AND r.created_at < $3) tickets_sold,
         (SELECT COALESCE(sum(r.total_in_cents), 0) FROM reservations r JOIN scoped_events e ON e.id = r.event_id
          WHERE r.status = 'PAID' AND ($2::timestamptz IS NULL OR r.created_at >= $2) AND r.created_at < $3) gross_revenue_in_cents,
         (SELECT count(*) FROM tickets t JOIN scoped_events e ON e.id = t.event_id
          WHERE t.used_at IS NOT NULL AND ($2::timestamptz IS NULL OR t.used_at >= $2) AND t.used_at < $3) check_ins`,
      [scope.organizationId, window.from, window.to],
    );
    return totals(result.rows[0]);
  }

  async upcomingEvents(
    scope: ReportingScope,
    window: ReportingWindow,
    limit: number,
  ): Promise<ReportEvent[]> {
    const result = await this.pool.query<EventReportRow>(
      `${eventReportSelect}
       WHERE e.status = 'PUBLISHED'
         AND e.starts_at >= $4
         AND ($1::uuid IS NULL OR e.organization_id = $1)
       ORDER BY e.starts_at ASC
       LIMIT $5`,
      [scope.organizationId, window.from, window.to, window.to, limit],
    );
    return result.rows.map(reportEvent);
  }

  async eventPage(
    scope: ReportingScope,
    window: ReportingWindow,
    query: ReportEventQuery,
  ): Promise<ReportEventPage> {
    const normalizedSearch = query.search?.trim() ?? '';
    const search = normalizedSearch ? `%${normalizedSearch}%` : null;
    const offset = (query.page - 1) * query.pageSize;
    const itemConditions = `e.status = 'PUBLISHED'
      AND ($1::uuid IS NULL OR e.organization_id = $1)
      AND ($6::text IS NULL OR e.title ILIKE $6 OR o.name ILIKE $6)`;
    const totalConditions = `e.status = 'PUBLISHED'
      AND ($1::uuid IS NULL OR e.organization_id = $1)
      AND ($2::text IS NULL OR e.title ILIKE $2 OR o.name ILIKE $2)`;
    const [items, total] = await Promise.all([
      this.pool.query<EventReportRow>(
        `${eventReportSelect}
         WHERE ${itemConditions}
         ORDER BY tickets_sold DESC, tickets_sold_all_time DESC, e.starts_at DESC, e.title ASC
         LIMIT $4 OFFSET $5`,
        [
          scope.organizationId,
          window.from,
          window.to,
          query.pageSize,
          offset,
          search,
        ],
      ),
      this.pool.query<{ total: number | string }>(
        `SELECT count(*) total FROM events e
         JOIN organizations o ON o.id = e.organization_id
         WHERE ${totalConditions}`,
        [scope.organizationId, search],
      ),
    ]);
    return {
      items: items.rows.map(reportEvent),
      total: numeric(total.rows[0]?.total),
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}

const eventReportSelect = `SELECT
  e.id, o.name organization_name, e.title, e.starts_at, e.venue, e.city, e.capacity,
  COALESCE(rm.purchases, 0) purchases,
  COALESCE(rm.tickets_sold, 0) tickets_sold,
  COALESCE(rm.gross_revenue_in_cents, 0) gross_revenue_in_cents,
  COALESCE(tm.check_ins, 0) check_ins,
  COALESCE(tm.tickets_sold_all_time, 0) tickets_sold_all_time,
  COALESCE(tm.check_ins_all_time, 0) check_ins_all_time
FROM events e
JOIN organizations o ON o.id = e.organization_id
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE ($2::timestamptz IS NULL OR r.created_at >= $2) AND r.created_at < $3) purchases,
    COALESCE(sum(r.quantity) FILTER (WHERE ($2::timestamptz IS NULL OR r.created_at >= $2) AND r.created_at < $3), 0) tickets_sold,
    COALESCE(sum(r.total_in_cents) FILTER (WHERE ($2::timestamptz IS NULL OR r.created_at >= $2) AND r.created_at < $3), 0) gross_revenue_in_cents
  FROM reservations r WHERE r.event_id = e.id AND r.status = 'PAID'
) rm ON true
LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE t.used_at IS NOT NULL AND ($2::timestamptz IS NULL OR t.used_at >= $2) AND t.used_at < $3) check_ins,
    count(*) tickets_sold_all_time,
    count(*) FILTER (WHERE t.status = 'USED') check_ins_all_time
  FROM tickets t WHERE t.event_id = e.id
) tm ON true`;

function totals(row: TotalsRow | undefined): ReportTotals {
  return {
    purchases: numeric(row?.purchases),
    ticketsSold: numeric(row?.tickets_sold),
    grossRevenueInCents: numeric(row?.gross_revenue_in_cents),
    checkIns: numeric(row?.check_ins),
  };
}

function reportEvent(row: EventReportRow): ReportEvent {
  const ticketsSoldAllTime = numeric(row.tickets_sold_all_time);
  return {
    id: row.id,
    organizationName: row.organization_name,
    title: row.title,
    startsAt: row.starts_at,
    venue: row.venue,
    city: row.city,
    capacity: row.capacity,
    purchases: numeric(row.purchases),
    ticketsSold: numeric(row.tickets_sold),
    grossRevenueInCents: numeric(row.gross_revenue_in_cents),
    checkIns: numeric(row.check_ins),
    ticketsSoldAllTime,
    checkInsAllTime: numeric(row.check_ins_all_time),
    availableQuantity: Math.max(row.capacity - ticketsSoldAllTime, 0),
    occupancyPercentage:
      row.capacity > 0
        ? Math.round((ticketsSoldAllTime / row.capacity) * 1000) / 10
        : 0,
  };
}

function numeric(value: number | string | undefined): number {
  return value === undefined ? 0 : Number(value);
}
