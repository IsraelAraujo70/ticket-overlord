const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';
const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Compares calendar dates in Sao Paulo, independent of server timezone. */
export function isAdmissionDay(eventStartsAt: Date, now: Date): boolean {
  return localDate(eventStartsAt) === localDate(now);
}

function localDate(value: Date): string {
  const parts = localDateFormatter.formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
