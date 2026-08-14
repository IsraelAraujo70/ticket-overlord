import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TicketSalesReport } from './ticket-sales-report';

describe('TicketSalesReport', () => {
  it('shows period activity separately from all-time occupancy', () => {
    render(
      <TicketSalesReport
        global
        page={1}
        period="7d"
        search="Tech"
        report={{ items: [event], total: 1, page: 1, pageSize: 20 }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Desempenho por evento' })).toBeInTheDocument();
    expect(screen.getAllByText('Aurora Eventos')).toHaveLength(2);
    expect(screen.getByText(/período afeta compras/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tech')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Últimos 7 dias' })).toBeInTheDocument();
    expect(screen.queryByText('Pedidos')).not.toBeInTheDocument();
  });

  it('directs an empty report toward search or publication', () => {
    render(
      <TicketSalesReport
        global={false}
        page={1}
        period="30d"
        search=""
        report={{ items: [], total: 0, page: 1, pageSize: 20 }}
      />,
    );

    expect(screen.getByText('Nenhum evento encontrado')).toBeInTheDocument();
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
  purchases: 2,
  ticketsSold: 4,
  grossRevenueInCents: 32000,
  checkIns: 1,
  ticketsSoldAllTime: 8,
  checkInsAllTime: 2,
  availableQuantity: 92,
  occupancyPercentage: 8,
};
