import { isAdmissionDay } from './admission-window';

describe('admission day', () => {
  it('uses the Sao Paulo calendar date at UTC boundaries', () => {
    const event = new Date('2026-08-12T00:30:00-03:00');
    expect(isAdmissionDay(event, new Date('2026-08-12T02:59:59Z'))).toBe(false);
    expect(isAdmissionDay(event, new Date('2026-08-12T03:00:00Z'))).toBe(true);
  });
});
