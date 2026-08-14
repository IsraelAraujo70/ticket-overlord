import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/auth.types';
import { ReportingError } from '../domain/reporting.errors';
import type {
  ReportEventPage,
  ReportOverview,
  ReportingPeriod,
  ReportingScope,
  ReportingWindow,
} from '../domain/reporting.types';
import type { ReportEventQuery } from './ports/reporting-store';
import { ReportingStore } from './ports/reporting-store';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReportingService {
  constructor(private readonly store: ReportingStore) {}

  async overview(
    user: AuthenticatedUser,
    period: ReportingPeriod,
    now = new Date(),
  ): Promise<ReportOverview> {
    const scope = reportingScope(user);
    const window = reportingWindow(period, now);
    const [totals, upcomingEvents] = await Promise.all([
      this.store.totals(scope, window),
      this.store.upcomingEvents(scope, window, 5),
    ]);
    return { scope: scope.mode, period, totals, upcomingEvents };
  }

  async events(
    user: AuthenticatedUser,
    period: ReportingPeriod,
    query: ReportEventQuery,
    now = new Date(),
  ): Promise<ReportEventPage> {
    return this.store.eventPage(
      reportingScope(user),
      reportingWindow(period, now),
      query,
    );
  }
}

export function reportingWindow(
  period: ReportingPeriod,
  now: Date,
): ReportingWindow {
  if (period === 'all') return { from: null, to: now };
  const days = Number.parseInt(period, 10);
  return {
    from: new Date(now.getTime() - days * DAY_IN_MILLISECONDS),
    to: now,
  };
}

function reportingScope(user: AuthenticatedUser): ReportingScope {
  if (user.role === 'ADMIN') {
    return { mode: 'GLOBAL', organizationId: null };
  }
  if (user.role === 'ORGANIZER' && user.organizationId) {
    return { mode: 'ORGANIZATION', organizationId: user.organizationId };
  }
  throw new ReportingError(
    'REPORTING_ACCESS_DENIED',
    'Conta sem acesso aos relatórios administrativos.',
  );
}
