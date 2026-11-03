// As regiões que a pessoa escolhe para praticar, nomeadas pelo que ela ouve e não pelo número MIDI.
// Mora aqui, e não no painel, porque o resumo de uma etapa também precisa do nome.
export const REGIOES = [
  { id: 'grave', lo: 36, hi: 60 },
  { id: 'media', lo: 48, hi: 72 },
  { id: 'aguda', lo: 60, hi: 84 },
  { id: 'toda', lo: 36, hi: 84 },
] as const;

export type RegiaoId = (typeof REGIOES)[number]['id'];

/** Qual região nomeada é esta faixa? `null` quando é uma faixa que não está na lista. */
export const regiaoDe = (r: { lo: number; hi: number }): RegiaoId | null =>
  REGIOES.find(x => x.lo === r.lo && x.hi === r.hi)?.id ?? null;
