import Link from 'next/link';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ScanLineIcon,
  ShoppingBasketIcon,
  TicketCheckIcon,
  WalletCardsIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/molecules/page-header';
import { ReportPeriodFilter } from '@/components/molecules/report-period-filter';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ReportOverview as ReportOverviewData } from '@/features/reporting/reporting.types';
import { reportingPeriodLabels } from '@/features/reporting/reporting.types';

export function ReportOverview({ report }: { report: ReportOverviewData }) {
  const global = report.scope === 'GLOBAL';
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <PageHeader
          eyebrow="Bilheteria / visão geral"
          title="Pulso da operação"
          description={
            global
              ? 'Acompanhe, em modo somente leitura, a movimentação de todas as organizações.'
              : 'Acompanhe vendas, receita e entradas dos eventos da sua organização.'
          }
        />
        <ReportPeriodFilter period={report.period} />
      </div>

      <section className="report-ticket overflow-hidden rounded-2xl bg-ticket-ink text-ticket-paper shadow-[0_1.5rem_4rem_rgb(16_20_38_/_18%)]">
        <div className="h-3 bg-[repeating-linear-gradient(135deg,var(--primary)_0_1.5rem,var(--ticket-coral)_1.5rem_3rem,var(--ticket-paper)_3rem_3.25rem)]" />
        <div className="grid lg:grid-cols-[1.25fr_2fr]">
          <div className="flex min-h-64 flex-col justify-between border-white/15 p-6 lg:border-r lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <Badge className="bg-white/10 text-white" variant="outline">
                {reportingPeriodLabels[report.period]}
              </Badge>
              <TicketCheckIcon className="size-7 text-ticket-coral" />
            </div>
            <div>
              <p className="font-mono text-xs tracking-[0.16em] text-white/60 uppercase">
                Ingressos vendidos
              </p>
              <p className="font-heading text-7xl leading-none font-bold tracking-tight tabular-nums sm:text-8xl">
                {formatNumber(report.totals.ticketsSold)}
              </p>
              <p className="mt-2 text-sm text-white/60">
                Entradas emitidas após compras aprovadas
              </p>
            </div>
          </div>
          <div className="grid divide-y divide-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Metric
              icon={ShoppingBasketIcon}
              label="Compras"
              value={formatNumber(report.totals.purchases)}
            />
            <Metric
              icon={WalletCardsIcon}
              label="Receita confirmada"
              value={formatCurrency(report.totals.grossRevenueInCents)}
            />
            <Metric
              icon={ScanLineIcon}
              label="Check-ins"
              value={formatNumber(report.totals.checkIns)}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="upcoming-events">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
              Linha de entrada
            </p>
            <h2 id="upcoming-events" className="font-heading text-3xl font-bold uppercase">
              Próximos eventos
            </h2>
          </div>
          <Link href="/admin/ingressos" className={buttonVariants({ variant: 'outline' })}>
            Ver relatório completo
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>

        {report.upcomingEvents.length ? (
          <div className="grid gap-3">
            {report.upcomingEvents.map((event) => (
              <article
                key={event.id}
                className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-[8.5rem_1fr]"
              >
                <div className="flex items-center gap-3 bg-muted p-4 sm:flex-col sm:items-start sm:justify-center">
                  <CalendarDaysIcon className="size-5 text-primary" />
                  <time className="font-mono text-xs font-semibold uppercase" dateTime={event.startsAt}>
                    {formatDate(event.startsAt)}
                  </time>
                </div>
                <div className="grid gap-4 p-4 lg:grid-cols-[1fr_18rem] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{event.title}</h3>
                      {global ? <Badge variant="outline">{event.organizationName}</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.venue} · {event.city}
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">Ocupação total</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatNumber(event.ticketsSoldAllTime)} / {formatNumber(event.capacity)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(event.occupancyPercentage, 100)}
                      aria-label={`${event.occupancyPercentage}% de ocupação`}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center">
            <CalendarDaysIcon className="mx-auto mb-3 size-7 text-muted-foreground" />
            <p className="font-semibold">Nenhum evento futuro publicado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Eventos publicados aparecerão aqui com a ocupação atualizada.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShoppingBasketIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-40 flex-col justify-between gap-8 p-6 lg:p-8">
      <Icon className="size-5 text-ticket-coral" />
      <div>
        <p className="font-heading text-3xl leading-none font-bold tabular-nums sm:text-4xl">
          {value}
        </p>
        <p className="mt-2 text-xs text-white/60">{label}</p>
      </div>
    </div>
  );
}

export function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}
