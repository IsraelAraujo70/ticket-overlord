import { isValidCnpj, normalizeCnpj } from './cnpj';

describe('CNPJ validation', () => {
  it('normalizes punctuation and accepts valid check digits', () => {
    expect(normalizeCnpj('11.222.333/0001-81')).toBe('11222333000181');
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
  });

  it.each(['11.111.111/1111-11', '11.222.333/0001-82', '123'])(
    'rejects %s',
    (cnpj) => {
      expect(isValidCnpj(cnpj)).toBe(false);
    },
  );
});
