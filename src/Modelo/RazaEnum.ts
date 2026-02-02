export const RazaEnum = {
  AA: 'AA',
  AAC: 'AAC',
  AAN: 'AAN',
  PH: 'PH',
  SH: 'SH',
  LMAn: 'LMAn',
} as const;

export type RazaEnum = typeof RazaEnum[keyof typeof RazaEnum];
