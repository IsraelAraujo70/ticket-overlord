import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { ReportingError } from '../domain/reporting.errors';
import type {
  ReportEvent,
  ReportEventPage,
  ReportingScope,
  ReportingWindow,
  ReportTotals,
} from '../domain/reporting.types';
import type { ReportEventQuery } from './ports/reporting-store';
import { ReportingStore } from './ports/reporting-store';
import { ReportingService, reportingWindow } from './reporting.service';

class FakeReportingStore extends ReportingStore {
  scope?: ReportingScope;
  window?: ReportingWindow;
  limit?: number;

  totals(
    scope: ReportingScope,
    window: ReportingWindow,
  ): Promise<ReportTotals> {
    this.scope = scope;
    this.window = window;
    return Promise.resolve({
      purchases: 2,
      ticketsSold: 4,
      grossRevenueInCents: 10000,
      checkIns: 1,
    });
  }

  upcomingEvents(
    scope: ReportingScope,
    window: ReportingWindow,
    limit: number,
  ): Promise<ReportEvent[]> {
    this.scope = scope;
    this.window = window;
    this.limit = limit;
    return Promise.resolve([]);
  }

  eventPage(
    scope: ReportingScope,
    window: ReportingWindow,
    query: ReportEventQuery,
  ): Promise<ReportEventPage> {
    this.scope = scope;
    this.window = window;
    return Promise.resolve({
      items: [],
      total: 0,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}

describe('ReportingService', () => {
  const now = new Date('2026-08-14T15:00:00.000Z');

  it('scopes organizer reports and calculates the selected period', async () => {
    const store = new FakeReportingStore();
    const service = new ReportingService(store);

    await expect(
      service.overview(organizer, '30d', now),
    ).resolves.toMatchObject({
      scope: 'ORGANIZATION',
      period: '30d',
      totals: { purchases: 2, ticketsSold: 4 },
    });
    expect(store.scope).toEqual({
      mode: 'ORGANIZATION',
      organizationId: 'organization-1',
    });
    expect(store.window).toEqual({
      from: new Date('2026-07-15T15:00:00.000Z'),
      to: now,
    });
    expect(store.limit).toBe(5);
  });

  it('gives administrators a global read-only scope', async () => {
    const store = new FakeReportingStore();
    const service = new ReportingService(store);

    await service.events(admin, 'all', { page: 2, pageSize: 20 }, now);

    expect(store.scope).toEqual({ mode: 'GLOBAL', organizationId: null });
    expect(store.window).toEqual({ from: null, to: now });
  });

  it('denies reporting access to gate staff', async () => {
    const service = new ReportingService(new FakeReportingStore());

    await expect(service.overview(staff, '7d', now)).rejects.toEqual(
      new ReportingError(
        'REPORTING_ACCESS_DENIED',
        'Conta sem acesso aos relatórios administrativos.',
      ),
    );
  });

  it('supports every predefined rolling period', () => {
    expect(reportingWindow('7d', now).from).toEqual(
      new Date('2026-08-07T15:00:00.000Z'),
    );
    expect(reportingWindow('90d', now).from).toEqual(
      new Date('2026-05-16T15:00:00.000Z'),
    );
  });
});

const organizer: AuthenticatedUser = {
  id: 'organizer-1',
  fullName: 'Organizer',
  email: 'organizer@example.com',
  role: 'ORGANIZER',
  organizationId: 'organization-1',
};

const admin: AuthenticatedUser = {
  ...organizer,
  id: 'admin-1',
  role: 'ADMIN',
  organizationId: null,
};

const staff: AuthenticatedUser = {
  ...organizer,
  id: 'staff-1',
  role: 'ORGANIZER_STAFF',
};
