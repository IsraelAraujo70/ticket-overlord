import { isBrazilianState } from './brazilian-state';

describe('Brazilian state validation', () => {
  it('accepts every Brazilian federative unit', () => {
    expect(
      [
        'AC',
        'AL',
        'AP',
        'AM',
        'BA',
        'CE',
        'DF',
        'ES',
        'GO',
        'MA',
        'MT',
        'MS',
        'MG',
        'PA',
        'PB',
        'PR',
        'PE',
        'PI',
        'RJ',
        'RN',
        'RS',
        'RO',
        'RR',
        'SC',
        'SP',
        'SE',
        'TO',
      ].every((state) => isBrazilianState(state)),
    ).toBe(true);
  });

  it.each(['XX', 'sp', ''])('rejects %s', (state) => {
    expect(isBrazilianState(state)).toBe(false);
  });
});
