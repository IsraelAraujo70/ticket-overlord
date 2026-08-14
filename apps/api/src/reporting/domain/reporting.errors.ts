export class ReportingError extends Error {
  constructor(
    readonly code: 'REPORTING_ACCESS_DENIED',
    message: string,
  ) {
    super(message);
  }
}
