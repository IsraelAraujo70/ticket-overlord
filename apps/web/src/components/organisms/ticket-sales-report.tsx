import Link from 'next/link';
import { InfoIcon, SearchIcon, TicketCheckIcon } from 'lucide-react';
import { PageHeader } from '@/components/molecules/page-header';
import { ReportPeriodFilter } from '@/components/molecules/report-period-filter';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type {
  ReportEvent,
  ReportEventPage,
  ReportingPeriod,
} from '@/features/reporting/reporting.types';
import { formatCurrency, formatDate, formatNumber } from './report-overview';

export function TicketSalesReport({
  global,
  page,
  period,
  report,
  search,
}: {
  global: boolean;
  page: number;
  period: ReportingPeriod;
  report: ReportEventPage;
  search: string;
}) {
  const pages = Math.max(1, Math.ceil(report.total / report.pageSize));
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          eyebrow="Bilheteria / ingressos"
          title="Desempenho por evento"
          description={
            global
              ? 'Compare vendas e entradas de todas as organizações em modo somente leitura.'
              : 'Compare vendas, ocupação e entradas dos eventos da sua organização.'
          }
        />
        <ReportPeriodFilter period={period} />
      </div>

      <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          O período afeta compras, vendidos, receita e check-ins. Ocupação e disponíveis usam todo o histórico do evento.
        </p>
      </div>

      <form method="get" className="flex max-w-xl gap-2" role="search">
        <input type="hidden" name="period" value={period} />
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            defaultValue={search}
            minLength={2}
            maxLength={100}
            className="pl-9"
            placeholder={global ? 'Buscar evento ou organização' : 'Buscar evento'}
            aria-label="Buscar no relatório"
          />
        </div>
        <button type="submit" className={buttonVariants({ variant: 'outline' })}>
          Buscar
        </button>
      </form>

      {report.items.length ? (
        <>
          <div className="grid gap-3 md:hidden">
            {report.items.map((event) => (
              <MobileEventReport key={event.id} event={event} global={global} />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[70rem] border-collapse text-sm">
              <thead className="bg-ticket-ink text-ticket-paper">
                <tr className="text-left font-mono text-[0.65rem] tracking-[0.12em] uppercase">
                  <th className="px-4 py-3 font-medium">Evento</th>
                  <th className="px-3 py-3 text-right font-medium">Compras</th>
                  <th className="px-3 py-3 text-right font-medium">Vendidos</th>
                  <th className="px-3 py-3 text-right font-medium">Receita</th>
                  <th className="px-3 py-3 text-right font-medium">Check-ins</th>
                  <th className="px-3 py-3 font-medium">Ocupação total</th>
                  <th className="px-4 py-3 text-right font-medium">Disponíveis</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.items.map((event) => (
                  <tr key={event.id} className="align-middle hover:bg-muted/40">
                    <td className="max-w-80 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{event.title}</p>
                        {global ? <Badge variant="outline">{event.organizationName}</Badge> : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {formatDate(event.startsAt)} · {event.venue} · {event.city}
                      </p>
                    </td>
                    <DataCell value={event.purchases} />
                    <DataCell value={event.ticketsSold} />
                    <td className="px-3 py-4 text-right font-mono text-xs tabular-nums">
                      {formatCurrency(event.grossRevenueInCents)}
                    </td>
                    <DataCell value={event.checkIns} />
                    <td className="w-52 px-3 py-4">
                      <div className="mb-2 flex justify-between gap-3 font-mono text-xs tabular-nums">
                        <span>{event.occupancyPercentage.toLocaleString('pt-BR')}%</span>
                        <span className="text-muted-foreground">
                          {formatNumber(event.ticketsSoldAllTime)} / {formatNumber(event.capacity)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(event.occupancyPercentage, 100)}
                        aria-label={`${event.occupancyPercentage}% de ocupação em ${event.title}`}
                      />
                    </td>
                    <DataCell value={event.availableQuantity} padded />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <TicketCheckIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-semibold">Nenhum evento encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajuste a busca ou publique um evento para acompanhar seus ingressos.
          </p>
        </div>
      )}

      {pages > 1 ? (
        <nav className="flex items-center justify-center gap-4" aria-label="Paginação do relatório de ingressos">
          <Link
            aria-disabled={page <= 1}
            className={buttonVariants({
              variant: 'outline',
              className: page <= 1 ? 'pointer-events-none opacity-50' : '',
            })}
            href={reportHref(Math.max(1, page - 1), period, search)}
          >
            Anterior
          </Link>
          <span className="font-mono text-sm">Página {page} de {pages}</span>
          <Link
            aria-disabled={page >= pages}
            className={buttonVariants({
              variant: 'outline',
              className: page >= pages ? 'pointer-events-none opacity-50' : '',
            })}
            href={reportHref(Math.min(pages, page + 1), period, search)}
          >
            Próxima
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

function MobileEventReport({ event, global }: { event: ReportEvent; global: boolean }) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-ticket-ink p-4 text-ticket-paper">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">{event.title}</h2>
          {global ? (
            <Badge className="border-white/25 text-white" variant="outline">
              {event.organizationName}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-white/60">
          {formatDate(event.startsAt)} · {event.venue} · {event.city}
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y">
        <MobileMetric label="Compras" value={formatNumber(event.purchases)} />
        <MobileMetric label="Vendidos" value={formatNumber(event.ticketsSold)} />
        <MobileMetric label="Receita" value={formatCurrency(event.grossRevenueInCents)} />
        <MobileMetric label="Check-ins" value={formatNumber(event.checkIns)} />
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium">Ocupação total</span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {event.occupancyPercentage.toLocaleString('pt-BR')}% ·{' '}
            {formatNumber(event.ticketsSoldAllTime)} / {formatNumber(event.capacity)}
          </span>
        </div>
        <Progress
          value={Math.min(event.occupancyPercentage, 100)}
          aria-label={`${event.occupancyPercentage}% de ocupação em ${event.title}`}
        />
        <p className="font-mono text-xs text-muted-foreground">
          {formatNumber(event.availableQuantity)} ingressos disponíveis
        </p>
      </div>
    </article>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <p className="font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function DataCell({ value, padded = false }: { value: number; padded?: boolean }) {
  return (
    <td className={`${padded ? 'pr-4' : 'px-3'} py-4 text-right font-mono text-xs tabular-nums`}>
      {formatNumber(value)}
    </td>
  );
}

function reportHref(page: number, period: ReportingPeriod, search: string): string {
  const params = new URLSearchParams({ page: String(page), period });
  if (search) params.set('search', search);
  return `/admin/ingressos?${params.toString()}`;
}
