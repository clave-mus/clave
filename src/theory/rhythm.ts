// Células rítmicas: cada uma ocupa um tempo (ou mais). Somar células é como o gerador de leitura
// rítmica monta compassos, e é também como agrupamos as colcheias e semicolcheias na escrita.

export type CellId = 'q' | 'qr' | 'h' | 'w' | '8-8' | '8r-8' | '16x4' | '8-16-16' | '16-16-8' | '8.-16' | '16-8-16' | '3x8';
export interface RhythmEvent {
  d: number; // duração em tempos
  rest?: boolean;
  dot?: boolean;
}
export interface Cell {
  id: CellId;
  name: string;
  beats: number;
  events: RhythmEvent[];
  triplet?: boolean;
}

const e = (d: number, rest = false, dot = false): RhythmEvent => ({ d, rest, dot });
export const CELLS: Record<CellId, Cell> = {
  q: { id: 'q', name: 'Semínima', beats: 1, events: [e(1)] },
  qr: { id: 'qr', name: 'Pausa de semínima', beats: 1, events: [e(1, true)] },
  h: { id: 'h', name: 'Mínima', beats: 2, events: [e(2)] },
  w: { id: 'w', name: 'Semibreve', beats: 4, events: [e(4)] },
  '8-8': { id: '8-8', name: 'Duas colcheias', beats: 1, events: [e(0.5), e(0.5)] },
  '8r-8': { id: '8r-8', name: 'Contratempo', beats: 1, events: [e(0.5, true), e(0.5)] },
  '16x4': { id: '16x4', name: 'Quatro semicolcheias', beats: 1, events: [e(0.25), e(0.25), e(0.25), e(0.25)] },
  '8-16-16': { id: '8-16-16', name: 'Colcheia e duas semis', beats: 1, events: [e(0.5), e(0.25), e(0.25)] },
  '16-16-8': { id: '16-16-8', name: 'Duas semis e colcheia', beats: 1, events: [e(0.25), e(0.25), e(0.5)] },
  '8.-16': { id: '8.-16', name: 'Colcheia pontuada', beats: 1, events: [e(0.75, false, true), e(0.25)] },
  '16-8-16': { id: '16-8-16', name: 'Síncope', beats: 1, events: [e(0.25), e(0.5), e(0.25)] },
  '3x8': { id: '3x8', name: 'Tercina', beats: 1, events: [e(1 / 3), e(1 / 3), e(1 / 3)], triplet: true },
};

/**
 * Grupos de figuras para os presets, do mais simples ao mais difícil.
 *
 * **Sem `name`**: o texto mora em `theory.rhythmPresets.<id>` nos dois idiomas, e quem mostra
 * traduz pelo id. Tinha um `name` em português cru aqui, e `Leitura.tsx` o imprimia direto — em
 * inglês os chips diziam "Duas figuras: semínima e colcheias". Guardar o texto no dado é o que
 * permitiu isso acontecer; agora não há onde.
 */
export const RHYTHM_PRESETS: { id: string; cells: CellId[] }[] = [
  { id: 'duas', cells: ['q', '8-8'] },
  { id: 'pausas', cells: ['q', '8-8', 'qr', 'h'] },
  { id: 'contratempo', cells: ['q', '8-8', '8r-8'] },
  { id: 'semis', cells: ['q', '8-8', '16x4', '8-16-16', '16-16-8'] },
  { id: 'sincope', cells: ['8-8', '8.-16', '16-8-16', '8r-8'] },
  { id: 'tercinas', cells: ['q', '8-8', '3x8'] },
];

/** Monta `bars` compassos de 4 tempos a partir das células permitidas. */
export function randomBars(allowed: CellId[], bars = 4): CellId[][] {
  const out: CellId[][] = [];
  for (let b = 0; b < bars; b++) {
    const bar: CellId[] = [];
    let left = 4;
    while (left > 0) {
      const fits = allowed.filter(c => CELLS[c].beats <= left && !(CELLS[c].beats === 2 && left % 2 !== 0));
      const pool = fits.length ? fits : (['q'] as CellId[]);
      const c = pool[Math.floor(Math.random() * pool.length)];
      bar.push(c);
      left -= CELLS[c].beats;
    }
    out.push(bar);
  }
  return out;
}

/** Deslocamento: a mesma célula de 1 tempo, empurrada uma semicolcheia por compasso. */
export function displacedBars(cell: CellId, bars = 4): { onsets: number[] }[] {
  const base: number[] = [];
  let t = 0;
  CELLS[cell].events.forEach(ev => { if (!ev.rest) base.push(t); t += ev.d; });
  return Array.from({ length: bars }, (_, b) => {
    const shift = b * 0.25;
    const onsets: number[] = [];
    for (let beat = 0; beat < 4; beat++) base.forEach(o => onsets.push((beat + o + shift) % 4));
    return { onsets: onsets.sort((a, z) => a - z) };
  });
}

/** Lista de ataques (em tempos, a partir do início) de uma sequência de compassos. */
export function onsetsOf(bars: CellId[][]): { at: number; bar: number }[] {
  const out: { at: number; bar: number }[] = [];
  let t = 0;
  bars.forEach((bar, bi) => bar.forEach(c => CELLS[c].events.forEach(ev => {
    if (!ev.rest) out.push({ at: t, bar: bi });
    t += ev.d;
  })));
  return out;
}
