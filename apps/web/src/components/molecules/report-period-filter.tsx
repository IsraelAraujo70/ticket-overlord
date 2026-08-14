import { FilterIcon } from 'lucide-react';
import {
  REPORTING_PERIODS,
  reportingPeriodLabels,
  type ReportingPeriod,
} from '@/features/reporting/reporting.types';
import { buttonVariants } from '@/components/ui/button';

export function ReportPeriodFilter({ period }: { period: ReportingPeriod }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-2"
      aria-label="Filtrar relatório por período"
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Período das movimentações
        </span>
        <span className="relative">
          <FilterIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            name="period"
            defaultValue={period}
            className="h-9 appearance-none rounded-lg border border-input bg-background pr-8 pl-9 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {REPORTING_PERIODS.map((value) => (
              <option key={value} value={value}>
                {reportingPeriodLabels[value]}
              </option>
            ))}
          </select>
        </span>
      </label>
      <button type="submit" className={buttonVariants({ size: 'lg' })}>
        Aplicar
      </button>
    </form>
  );
}
