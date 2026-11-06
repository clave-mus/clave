// Vocabulário da leitura rítmica: fórmulas de compasso e o catálogo de células.
// Tudo em "ticks" inteiros (24 por semínima) para a soma dos compassos ser exata, inclusive com quiálteras.
//
// Para acrescentar uma célula, basta uma linha em CELL_DEFS. O padrão é escrito como texto:
//   q h w 8 16      semínima, mínima, semibreve, colcheia, semicolcheia
//   r8  rq          pausa (prefixo r)
//   q.  8.          figura pontuada
//   8~              ligada à figura seguinte
//   3:2(8 8 8)      quiáltera: 3 figuras no lugar de 2 (tercina); 2:3(8 8) é a duína do 6/8
// Figuras, pausas e recursos (pontuada, síncope, ligadura, quiáltera) são deduzidos do padrão,
// e é isso que as configurações usam para filtrar o que pode aparecer.

export const TPQ = 24; // ticks por semínima

export type NoteValue = 'w' | 'h' | 'q' | '8' | '16';
export const VALUE_TICKS: Record<NoteValue, number> = { w: 96, h: 48, q: 24, '8': 12, '16': 6 };

/** Figuras que podem soar (as pausas são controladas à parte). */
export type Figure = NoteValue;
export type RestKind = 'h' | 'q' | '8' | '16';
export type Trait = 'pontuada' | 'sincope' | 'ligadura' | 'quialtera';
export type Level = 1 | 2 | 3 | 4 | 5;

/**
 * Família aditiva da célula (X1, 06/11/2026): como ela agrupa o pulso — em 2, em 3, em 4, ou com
 * ponto —, não em que nível ela mora. **Derivada do padrão**, como os outros recursos acima: o
 * Paulo topou "uma maneira de gerar de forma equilibrada", não uma tabela fechada por célula.
 */
export type Familia = 'binaria' | 'ternaria' | 'quaternaria' | 'pontuada';
export const FAMILIAS: Familia[] = ['binaria', 'ternaria', 'quaternaria', 'pontuada'];

// Nomes de figuras, pausas, recursos e níveis ficam nos textos de cada idioma (rhythm.* em src/i18n).

export const LEVELS: { level: Level }[] = [{ level: 1 }, { level: 2 }, { level: 3 }, { level: 4 }, { level: 5 }];

// ---------- fórmulas de compasso ----------

export type MeterId = '2/4' | '3/4' | '4/4' | '6/8';
export interface Meter {
  id: MeterId;
  num: number;
  den: number;
  compound: boolean;
  beatTicks: number; // duração do pulso: semínima no simples, semínima pontuada no composto
  beats: number; // pulsos por compasso
  barTicks: number;
  /** Pulsos em que células "fortes" (mínima, síncope de dois tempos) podem começar. */
  strong: number[];
}
const meter = (id: MeterId, num: number, den: number, compound: boolean, strong: number[]): Meter => {
  const beatTicks = compound ? TPQ * 1.5 : TPQ;
  const barTicks = (num * TPQ * 4) / den;
  return { id, num, den, compound, beatTicks, beats: barTicks / beatTicks, barTicks, strong };
};
export const METERS: Record<MeterId, Meter> = {
  '2/4': meter('2/4', 2, 4, false, [0]),
  '3/4': meter('3/4', 3, 4, false, [0, 1, 2]),
  '4/4': meter('4/4', 4, 4, false, [0, 2]),
  '6/8': meter('6/8', 6, 8, true, [0]),
};
export const METER_IDS = Object.keys(METERS) as MeterId[];

// ---------- padrões ----------

/** Uma figura escrita dentro de uma célula. `dur` é a duração real, já com ponto e quiáltera. */
export interface PatternEvent {
  at: number; // ticks desde o início da célula
  dur: number;
  value: NoteValue;
  dots: 0 | 1;
  rest: boolean;
  tie: boolean; // ligada à próxima figura
  tuplet?: { group: number; num: number; occupied: number }; // group: índice da quiáltera dentro da célula
}

const TOKEN = /^(r?)(w|h|q|16|8)(\.?)(~?)$/;

/** Lê um padrão como "8 16 16" ou "3:2(8 r8 8)". Lança erro se o texto for inválido. */
export function parsePattern(src: string): PatternEvent[] {
  const out: PatternEvent[] = [];
  let at = 0;
  let group = 0;
  const parts = src.match(/\d+:\d+\([^)]*\)|\S+/g) ?? [];
  for (const part of parts) {
    const tup = part.match(/^(\d+):(\d+)\(([^)]*)\)$/);
    const tokens = tup ? tup[3].trim().split(/\s+/) : [part];
    const num = tup ? Number(tup[1]) : 1;
    const occupied = tup ? Number(tup[2]) : 1;
    for (const tk of tokens) {
      const m = tk.match(TOKEN);
      if (!m) throw new Error(`Figura inválida "${tk}" em "${src}"`);
      const value = m[2] as NoteValue;
      const dots = m[3] ? 1 : 0;
      const written = VALUE_TICKS[value] * (dots ? 1.5 : 1);
      const dur = (written * occupied) / num;
      if (!Number.isInteger(dur)) throw new Error(`Duração fracionária em "${src}"`);
      out.push({ at, dur, value, dots, rest: m[1] === 'r', tie: m[4] === '~', ...(tup ? { tuplet: { group, num, occupied } } : {}) });
      at += dur;
    }
    if (tup) group++;
  }
  return out;
}

// ---------- catálogo ----------

export interface CellDef {
  id: string;
  name: string;
  pattern: string;
  kind: 'simples' | 'composto';
  level: Level;
  /** Onde a célula pode começar: em qualquer pulso, só em pulso forte, ou só no início do compasso. */
  align?: 'beat' | 'strong' | 'bar';
  meters?: MeterId[];
  weight?: number;
}

export interface Cell extends Required<Omit<CellDef, 'meters'>> {
  meters?: MeterId[];
  events: PatternEvent[];
  span: number; // ticks
  figures: Figure[];
  rests: RestKind[];
  traits: Trait[];
  familia: Familia[];
}

export const CELL_DEFS: CellDef[] = [
  // ---- compassos simples (pulso = semínima) ----
  { id: 'q', name: 'Semínima', pattern: 'q', kind: 'simples', level: 1, weight: 3 },
  { id: 'rq', name: 'Pausa de semínima', pattern: 'rq', kind: 'simples', level: 1, weight: 0.8 },
  { id: 'h', name: 'Mínima', pattern: 'h', kind: 'simples', level: 1, align: 'strong', weight: 1.6 },
  { id: 'rh', name: 'Pausa de mínima', pattern: 'rh', kind: 'simples', level: 1, align: 'strong', meters: ['4/4'], weight: 0.4 },
  { id: 'hd', name: 'Mínima pontuada', pattern: 'h.', kind: 'simples', level: 1, align: 'bar', meters: ['3/4', '4/4'], weight: 0.6 },
  { id: 'w', name: 'Semibreve', pattern: 'w', kind: 'simples', level: 1, align: 'bar', meters: ['4/4'], weight: 0.5 },

  { id: '8-8', name: 'Duas colcheias', pattern: '8 8', kind: 'simples', level: 2, weight: 3 },
  { id: '8-r8', name: 'Colcheia e pausa', pattern: '8 r8', kind: 'simples', level: 2, weight: 0.8 },
  { id: 'r8-8', name: 'Contratempo', pattern: 'r8 8', kind: 'simples', level: 2, weight: 1 },

  { id: '16x4', name: 'Quatro semicolcheias', pattern: '16 16 16 16', kind: 'simples', level: 3, weight: 2.4 },
  { id: '8-16-16', name: 'Colcheia e duas semis', pattern: '8 16 16', kind: 'simples', level: 3, weight: 2 },
  { id: '16-16-8', name: 'Duas semis e colcheia', pattern: '16 16 8', kind: 'simples', level: 3, weight: 2 },
  { id: 'r16-16-16-16', name: 'Pausa e três semis', pattern: 'r16 16 16 16', kind: 'simples', level: 3, weight: 0.9 },
  { id: '8-r16-16', name: 'Colcheia, pausa e semi', pattern: '8 r16 16', kind: 'simples', level: 3, weight: 0.9 },
  { id: 'r8-16-16', name: 'Pausa de colcheia e duas semis', pattern: 'r8 16 16', kind: 'simples', level: 3, weight: 0.8 },
  { id: '16-16-r8', name: 'Duas semis e pausa', pattern: '16 16 r8', kind: 'simples', level: 3, weight: 0.5 },

  { id: '8d-16', name: 'Colcheia pontuada e semi', pattern: '8. 16', kind: 'simples', level: 4, weight: 2 },
  { id: '16-8d', name: 'Semi e colcheia pontuada', pattern: '16 8.', kind: 'simples', level: 4, weight: 0.8 },
  { id: '16-8-16', name: 'Síncope no tempo', pattern: '16 8 16', kind: 'simples', level: 4, weight: 1.6 },
  { id: 'qd-8', name: 'Semínima pontuada e colcheia', pattern: 'q. 8', kind: 'simples', level: 4, align: 'strong', weight: 1.6 },
  { id: '8-qd', name: 'Colcheia e semínima pontuada', pattern: '8 q.', kind: 'simples', level: 4, align: 'strong', weight: 0.5 },
  { id: '8-q-8', name: 'Síncope de colcheias', pattern: '8 q 8', kind: 'simples', level: 4, align: 'strong', weight: 1.4 },
  { id: '8-8t-8-8', name: 'Colcheias ligadas entre tempos', pattern: '8 8~ 8 8', kind: 'simples', level: 4, weight: 1 },
  { id: '8-8t-q', name: 'Ligadura para o tempo', pattern: '8 8~ q', kind: 'simples', level: 4, weight: 0.7 },
  { id: 'q-h-q', name: 'Síncope de semínimas', pattern: 'q h q', kind: 'simples', level: 4, align: 'bar', meters: ['4/4'], weight: 0.5 },
  { id: 'r8-q-8', name: 'Pausa e síncope', pattern: 'r8 q 8', kind: 'simples', level: 4, align: 'strong', weight: 0.5 },
  { id: '16-r8-16', name: 'Semis nas pontas', pattern: '16 r8 16', kind: 'simples', level: 4, weight: 0.6 },
  { id: 'r16-8-16', name: 'Pausa e síncope de semis', pattern: 'r16 8 16', kind: 'simples', level: 4, weight: 0.6 },
  { id: 'r8d-16', name: 'Pausa pontuada e semi', pattern: 'r8. 16', kind: 'simples', level: 4, weight: 0.4 },

  { id: 't8x3', name: 'Tercina de colcheias', pattern: '3:2(8 8 8)', kind: 'simples', level: 5, weight: 2.6 },
  { id: 't8-r8-8', name: 'Tercina com pausa no meio', pattern: '3:2(8 r8 8)', kind: 'simples', level: 5, weight: 0.8 },
  { id: 'tr8-8-8', name: 'Tercina com pausa no início', pattern: '3:2(r8 8 8)', kind: 'simples', level: 5, weight: 0.7 },
  { id: 'tq-8', name: 'Semínima e colcheia em tercina', pattern: '3:2(q 8)', kind: 'simples', level: 5, weight: 0.9 },
  { id: 'tqx3', name: 'Tercina de semínimas', pattern: '3:2(q q q)', kind: 'simples', level: 5, align: 'strong', weight: 0.9 },
  { id: 't16x3-8', name: 'Tercina de semis e colcheia', pattern: '3:2(16 16 16) 8', kind: 'simples', level: 5, weight: 0.6 },
  { id: '8-t16x3', name: 'Colcheia e tercina de semis', pattern: '8 3:2(16 16 16)', kind: 'simples', level: 5, weight: 0.6 },
  { id: 's16x6', name: 'Sextina', pattern: '6:4(16 16 16 16 16 16)', kind: 'simples', level: 5, weight: 0.5 },

  // ---- compasso composto (pulso = semínima pontuada) ----
  { id: 'c-qd', name: 'Semínima pontuada', pattern: 'q.', kind: 'composto', level: 1, weight: 2.4 },
  { id: 'c-rqd', name: 'Pausa de semínima pontuada', pattern: 'rq.', kind: 'composto', level: 1, weight: 0.7 },
  { id: 'c-q-8', name: 'Semínima e colcheia', pattern: 'q 8', kind: 'composto', level: 1, weight: 2.4 },
  { id: 'c-hd', name: 'Mínima pontuada', pattern: 'h.', kind: 'composto', level: 1, align: 'bar', weight: 0.6 },

  { id: 'c-8x3', name: 'Três colcheias', pattern: '8 8 8', kind: 'composto', level: 2, weight: 3 },
  { id: 'c-8-q', name: 'Colcheia e semínima', pattern: '8 q', kind: 'composto', level: 2, weight: 1 },
  { id: 'c-q-r8', name: 'Semínima e pausa', pattern: 'q r8', kind: 'composto', level: 2, weight: 0.7 },
  { id: 'c-r8-8-8', name: 'Pausa e duas colcheias', pattern: 'r8 8 8', kind: 'composto', level: 2, weight: 1 },
  { id: 'c-8-r8-8', name: 'Colcheia, pausa e colcheia', pattern: '8 r8 8', kind: 'composto', level: 2, weight: 0.7 },
  { id: 'c-rq-8', name: 'Pausa de semínima e colcheia', pattern: 'rq 8', kind: 'composto', level: 2, weight: 0.5 },

  { id: 'c-8-8-16-16', name: 'Duas colcheias e duas semis', pattern: '8 8 16 16', kind: 'composto', level: 3, weight: 1.6 },
  { id: 'c-16-16-8-8', name: 'Duas semis e duas colcheias', pattern: '16 16 8 8', kind: 'composto', level: 3, weight: 1.6 },
  { id: 'c-8-16-16-8', name: 'Semis no meio', pattern: '8 16 16 8', kind: 'composto', level: 3, weight: 1.4 },
  { id: 'c-16x6', name: 'Seis semicolcheias', pattern: '16 16 16 16 16 16', kind: 'composto', level: 3, weight: 1.4 },
  { id: 'c-q-16-16', name: 'Semínima e duas semis', pattern: 'q 16 16', kind: 'composto', level: 3, weight: 1.2 },
  { id: 'c-r8-16-16-8', name: 'Pausa, semis e colcheia', pattern: 'r8 16 16 8', kind: 'composto', level: 3, weight: 0.6 },

  { id: 'c-8d-16-8', name: 'Siciliana', pattern: '8. 16 8', kind: 'composto', level: 4, weight: 2 },
  { id: 'c-8-8d-16', name: 'Colcheia, pontuada e semi', pattern: '8 8. 16', kind: 'composto', level: 4, weight: 0.8 },
  { id: 'c-8x3t-8x3', name: 'Colcheias ligadas entre tempos', pattern: '8 8 8~ 8 8 8', kind: 'composto', level: 4, weight: 1 },
  { id: 'c-q-8t-8-q', name: 'Ligadura sobre o pulso', pattern: 'q 8~ 8 q', kind: 'composto', level: 4, weight: 0.8 },
  { id: 'c-r16-16-8-8', name: 'Pausa de semi no pulso', pattern: 'r16 16 8 8', kind: 'composto', level: 4, weight: 0.6 },

  { id: 'c-d8x2', name: 'Duína', pattern: '2:3(8 8)', kind: 'composto', level: 5, weight: 2 },
  { id: 'c-dr8-8', name: 'Duína com pausa', pattern: '2:3(r8 8)', kind: 'composto', level: 5, weight: 0.5 },
  { id: 'c-hemiola', name: 'Hemíola', pattern: 'q q q', kind: 'composto', level: 5, align: 'bar', weight: 0.8 },
];

const restKind = (v: NoteValue): RestKind => (v === 'w' ? 'h' : v);

/** Peso métrico de uma posição dentro da célula (que sempre começa num pulso). */
function metricWeight(pos: number, kind: Cell['kind']): number {
  const beat = kind === 'composto' ? TPQ * 1.5 : TPQ;
  if (pos === 0) return 4;
  if (kind === 'simples' && pos % (2 * beat) === 0) return 3.5; // meio do 4/4
  if (pos % beat === 0) return 3;
  if (pos % 12 === 0) return 2;
  if (pos % 6 === 0) return 1;
  return 0;
}

/** Síncope: um ataque em posição fraca que se sustenta (sozinho ou por ligadura) sobre uma posição mais forte. */
function hasSyncopation(events: PatternEvent[], kind: Cell['kind']): boolean {
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    // Quiálteras ficam fora da grade binária; o deslocamento delas não conta como síncope.
    if (ev.rest || ev.tuplet || (i > 0 && events[i - 1].tie)) continue;
    let end = ev.at + ev.dur;
    for (let j = i; events[j].tie && j + 1 < events.length; j++) end = events[j + 1].at + events[j + 1].dur;
    const w0 = metricWeight(ev.at, kind);
    for (let p = ev.at + 6; p < end; p += 6) if (metricWeight(p, kind) > w0) return true;
  }
  return false;
}

/**
 * Família aditiva: em que grupo a célula divide o pulso.
 *
 * `binária` inclui tudo que `quaternária` também marca — dividir em 4 é dividir em 2 duas vezes —
 * e a duína (2:3) importada do composto, que é literalmente "a divisão em 2" dentro de um pulso
 * de 3. `ternária` é a tercina de colcheias (simples) ou a divisão natural do pulso composto em
 * três colcheias, **sem quiáltera** — senão a duína contaria como ternária também.
 */
function deriveFamilia(events: PatternEvent[], kind: CellDef['kind'], traits: Trait[]): Familia[] {
  const out: Familia[] = [];
  if (traits.includes('pontuada')) out.push('pontuada');
  const soa = (v: NoteValue) => events.some(e => !e.rest && e.value === v);
  const temQuialtera = events.some(e => e.tuplet);
  const temTercina = events.some(e => e.tuplet?.num === 3);
  const temDuina = events.some(e => e.tuplet?.num === 2);
  if (soa('16')) out.push('quaternaria');
  if (soa('16') || temDuina || (kind === 'simples' && soa('8') && !temQuialtera)) out.push('binaria');
  if (temTercina || (kind === 'composto' && soa('8') && !temQuialtera)) out.push('ternaria');
  return out;
}

function buildCell(def: CellDef): Cell {
  const events = parsePattern(def.pattern);
  const span = events.reduce((s, e) => s + e.dur, 0);
  const beat = def.kind === 'composto' ? TPQ * 1.5 : TPQ;
  if (span % beat !== 0) throw new Error(`A célula ${def.id} não ocupa um número inteiro de pulsos`);
  const figures = [...new Set(events.filter(e => !e.rest).map(e => e.value))];
  const rests = [...new Set(events.filter(e => e.rest).map(e => restKind(e.value)))];
  const traits: Trait[] = [];
  // Ponto que cai no pulso (semínima pontuada no 6/8, mínima pontuada no 3/4) não cria ritmo pontuado.
  if (events.some(e => e.dots && e.dur % beat !== 0)) traits.push('pontuada');
  if (hasSyncopation(events, def.kind)) traits.push('sincope');
  if (events.some(e => e.tie)) traits.push('ligadura');
  if (events.some(e => e.tuplet)) traits.push('quialtera');
  const familia = deriveFamilia(events, def.kind, traits);
  return { align: 'beat', weight: 1, ...def, events, span, figures, rests, traits, familia };
}

export const CELLS: Cell[] = CELL_DEFS.map(buildCell);
export const cellById: Record<string, Cell> = Object.fromEntries(CELLS.map(c => [c.id, c]));

export function cellsFor(m: Meter): Cell[] {
  const kind = m.compound ? 'composto' : 'simples';
  return CELLS.filter(c => c.kind === kind && (!c.meters || c.meters.includes(m.id)) && c.span <= m.barTicks);
}
