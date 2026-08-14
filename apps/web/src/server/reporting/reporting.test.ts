import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/server/backend-client', () => ({ backendRequest: vi.fn() }));
vi.mock('@/server/auth/session', () => ({ getSessionToken: vi.fn() }));

import { reportingPeriod } from '@/features/reporting/reporting.types';
import { getSessionToken } from '@/server/auth/session';
import { backendRequest } from '@/server/backend-client';
import { getEventReport, getReportOverview } from './reporting';

describe('administrative reporting client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionToken).mockResolvedValue('session-token');
    vi.mocked(backendRequest).mockResolvedValue({});
  });

  it('requests the selected overview period with the private session', async () => {
    await getReportOverview('90d');

    expect(backendRequest).toHaveBeenCalledWith('/reports/overview?period=90d', {
      headers: { Authorization: 'Bearer session-token' },
    });
  });

  it('normalizes search and paginates event reports', async () => {
    await getEventReport('30d', 3, '  Festival  ');

    expect(backendRequest).toHaveBeenCalledWith(
      '/reports/events?period=30d&page=3&pageSize=20&search=Festival',
      { headers: { Authorization: 'Bearer session-token' } },
    );
  });

  it('defaults unknown periods to thirty days', () => {
    expect(reportingPeriod('365d')).toBe('30d');
    expect(reportingPeriod(undefined)).toBe('30d');
    expect(reportingPeriod('all')).toBe('all');
  });
});
