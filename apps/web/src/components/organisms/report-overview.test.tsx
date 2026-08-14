import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportOverview } from './report-overview';

describe('ReportOverview', () => {
  it('renders scoped operational metrics and upcoming occupancy', () => {
    render(
      <ReportOverview
        report={{
          scope: 'ORGANIZATION',
          period: '30d',
          totals: {
            purchases: 4,
            ticketsSold: 8,
            grossRevenueInCents: 64000,
            checkIns: 2,
          },
          upcomingEvents: [event],
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Pulso da operação' })).toBeInTheDocument();
    expect(screen.getByText(/640,00/)).toBeInTheDocument();
    expect(screen.getByText('8 / 100')).toBeInTheDocument();
    expect(screen.getByLabelText('8% de ocupação')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /relatório completo/i })).toHaveAttribute(
      'href',
      '/admin/ingressos',
    );
  });

  it('identifies the global read-only view', () => {
    render(
      <ReportOverview
        report={{
          scope: 'GLOBAL',
          period: 'all',
          totals: { purchases: 0, ticketsSold: 0, grossRevenueInCents: 0, checkIns: 0 },
          upcomingEvents: [event],
        }}
      />,
    );

    expect(screen.getByText(/todas as organizações/i)).toBeInTheDocument();
    expect(screen.getByText('Aurora Eventos')).toBeInTheDocument();
  });
});

const event = {
  id: 'event-1',
  organizationName: 'Aurora Eventos',
  title: 'Tech Futures',
  startsAt: '2026-09-05T22:00:00.000Z',
  venue: 'Centro de Convenções',
  city: 'São Paulo',
  capacity: 100,
  purchases: 4,
  ticketsSold: 8,
  grossRevenueInCents: 64000,
  checkIns: 2,
  ticketsSoldAllTime: 8,
  checkInsAllTime: 2,
  availableQuantity: 92,
  occupancyPercentage: 8,
};
