import { normalizeBrazilianPhone } from './phone';

describe('Brazilian phone validation', () => {
  it.each(['(35) 99742-1900', '+55 35 99742-1900'])(
    'normalizes %s to E.164',
    (phone) => {
      expect(normalizeBrazilianPhone(phone)).toBe('+5535997421900');
    },
  );

  it.each(['+1 202-555-0104', '1234'])(
    'rejects the non-Brazilian or invalid phone %s',
    (phone) => {
      expect(normalizeBrazilianPhone(phone)).toBeNull();
    },
  );
});
