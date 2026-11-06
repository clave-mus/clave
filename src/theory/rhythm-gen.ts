// Gerador de exercícios de leitura rítmica. Lógica pura, sem interface: recebe as configurações e
// devolve compassos completos, montados com as células de rhythm-cells.ts.
//
// Como um compasso é montado:
// 1. Filtra o catálogo pelo nível e pelas figuras, pausas e recursos ligados.
// 2. Sorteia células pulso a pulso, só entre as que ainda deixam o compasso completável
//    (programação dinâmica sobre os pulsos), então nunca sobra nem falta duração.
// 3. Sorteia algumas versões e fica com a que menos fere as regras de bom senso
//    (pausa demais, compasso repetido, final pendurado, compassos do exercício anterior).
// Depois, em blocos de quatro compassos, às vezes o 3º repete o 1º (frase A B A C), e nos níveis
// com síncope algumas colcheias do fim do compasso são ligadas ao tempo 1 do seguinte (antecipação).
import {
  cellsFor, METERS, TPQ, VALUE_TICKS,
  type Cell, type Familia, type Figure, type Level, type Meter, type MeterId, type NoteValue, type RestKind, type Trait,
} from './rhythm-cells';

export interface RhythmSettings {
  meter: MeterId;
  bars: number;
  level: Level;
  figures: Record<Figure, boolean>;
  rests: boolean;
  restKinds: Record<RestKind, boolean>;
  traits: Record<Trait, boolean>;
  /** Família aditiva (X1): quais estilos de subdivisão podem aparecer. Célula sem família marcada
   *  (nota simples, pausa) não entra neste filtro — ele só restringe o que É subdividido. */
  familias: Record<Familia, boolean>;
  /**
   * Preferência por um número de notas soantes no compasso (X1, preset "8 posições, 2 notas").
   * `undefined` é o padrão de sempre: sem preferência, e a regra de "não passar de meio compasso
   * de pausa" vale. Definido, troca essa regra por esta preferência — as duas juntas se
   * contradiriam (poucas notas implica muita pausa).
   */
  metaNotas?: number;
}

export const BAR_COUNTS = [2, 4, 8];
export const DEFAULT_SETTINGS: RhythmSettings = {
  meter: '4/4',
  bars: 4,
  level: 2,
  figures: { w: true, h: true, q: true, '8': true, '16': true },
  rests: true,
  restKinds: { h: true, q: true, '8': true, '16': true },
  traits: { pontuada: true, sincope: true, ligadura: true, quialtera: true },
  familias: { binaria: true, ternaria: true, quaternaria: true, pontuada: true },
};

/** Preset "8 posições, 2 notas" (X1): compasso curto, majoritariamente pausado, com poucas
 *  semicolcheias soltas e sincopadas — para quem está começando a ler ritmo. */
export const PRESET_POUCAS_NOTAS: RhythmSettings = {
  meter: '2/4',
  bars: 4,
  level: 4,
  figures: { w: false, h: false, q: false, '8': false, '16': true },
  rests: true,
  restKinds: { h: true, q: true, '8': true, '16': true },
  traits: DEFAULT_SETTINGS.traits,
  familias: DEFAULT_SETTINGS.familias,
  metaNotas: 2,
};

export interface RhythmEvent {
  at: number; // ticks desde o início do compasso
  dur: number;
  value: NoteValue;
  dots: 0 | 1;
  rest: boolean;
  tie: boolean; // ligada à figura seguinte (que pode estar no próximo compasso)
  tuplet?: { id: number; num: number; occupied: number };
  cell: number; // índice da célula no compasso
}
export interface Bar {
  cells: string[];
  events: RhythmEvent[];
}
export interface Exercise {
  seed: number;
  meter: MeterId;
  level: Level;
  bars: Bar[];
}

/** Erro de configuração (mensagem = SettingsProblem) ou de geração (exercício inválido, um defeito). */
export class GenerationError extends Error {}

/** Gerador pseudoaleatório com semente (mulberry32), para exercícios reproduzíveis e testáveis. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- filtro do catálogo ----------

/**
 * Células que podem aparecer com essas configurações.
 *
 * `familia` é um OU entre si (basta uma marcada bater), diferente de `figures`/`traits`, que são E
 * entre si (a célula precisa de TODAS as que usa ligadas) — porque família é "este estilo pode
 * aparecer", não "esta célula exige todos os estilos que ela mistura". E célula sem família
 * marcada (nota simples, pausa) não entra neste filtro: ele só restringe o que É subdividido.
 */
export function poolFor(s: RhythmSettings): Cell[] {
  return cellsFor(METERS[s.meter]).filter(c =>
    c.level <= s.level &&
    c.figures.every(f => s.figures[f]) &&
    (c.rests.length === 0 || (s.rests && c.rests.every(r => s.restKinds[r]))) &&
    c.traits.every(t => s.traits[t]) &&
    (c.familia.length === 0 || c.familia.some(fam => s.familias[fam])));
}

/** O que o nível oferece nessa fórmula de compasso, antes das restrições do usuário (para a interface). */
export function offeredBy(meter: MeterId, level: Level) {
  const cells = cellsFor(METERS[meter]).filter(c => c.level <= level);
  return {
    figures: new Set(cells.flatMap(c => c.figures)),
    rests: new Set(cells.flatMap(c => c.rests)),
    traits: new Set(cells.flatMap(c => c.traits)),
    familias: new Set(cells.flatMap(c => c.familia)),
  };
}

const spanBeats = (c: Cell, m: Meter) => c.span / m.beatTicks;
function fits(c: Cell, beat: number, m: Meter) {
  if (beat + spanBeats(c, m) > m.beats) return false;
  if (c.align === 'bar') return beat === 0;
  if (c.align === 'strong') return m.strong.includes(beat);
  return true;
}

/** completable[p]: dá para fechar o compasso a partir do pulso p usando só essas células. */
function completable(pool: Cell[], m: Meter): boolean[] {
  const ok = Array<boolean>(m.beats + 1).fill(false);
  ok[m.beats] = true;
  for (let p = m.beats - 1; p >= 0; p--) ok[p] = pool.some(c => fits(c, p, m) && ok[p + spanBeats(c, m)]);
  return ok;
}

/** Problema que impede gerar compassos com essas configurações; a tela explica cada um no idioma. */
export type SettingsProblem = 'noFigures' | 'cantFill';
/** Devolve o problema, ou null se as configurações geram compassos. */
export function checkSettings(s: RhythmSettings): SettingsProblem | null {
  const m = METERS[s.meter];
  const pool = poolFor(s);
  if (!pool.some(c => c.events.some(e => !e.rest))) return 'noFigures';
  if (!completable(pool, m)[0]) return 'cantFill';
  return null;
}

// ---------- montagem ----------

function pick<T>(items: T[], weight: (x: T) => number, r: () => number): T {
  const total = items.reduce((s, x) => s + weight(x), 0);
  let roll = r() * total;
  for (const x of items) {
    roll -= weight(x);
    if (roll < 0) return x;
  }
  return items[items.length - 1];
}

function randomBar(pool: Cell[], m: Meter, ok: boolean[], weight: (c: Cell) => number, r: () => number): Cell[] {
  const out: Cell[] = [];
  let beat = 0;
  while (beat < m.beats) {
    const cands = pool.filter(c => fits(c, beat, m) && ok[beat + spanBeats(c, m)]);
    const c = pick(cands, weight, r);
    out.push(c);
    beat += spanBeats(c, m);
  }
  return out;
}

function barOf(cells: Cell[], nextTuplet: () => number): Bar {
  const events: RhythmEvent[] = [];
  let at = 0;
  cells.forEach((c, ci) => {
    const ids = new Map<number, number>();
    for (const ev of c.events) {
      const tuplet = ev.tuplet && { id: ids.get(ev.tuplet.group) ?? (ids.set(ev.tuplet.group, nextTuplet()), ids.get(ev.tuplet.group)!), num: ev.tuplet.num, occupied: ev.tuplet.occupied };
      events.push({ at: at + ev.at, dur: ev.dur, value: ev.value, dots: ev.dots, rest: ev.rest, tie: ev.tie, cell: ci, ...(tuplet ? { tuplet } : {}) });
    }
    at += c.span;
  });
  return { cells: cells.map(c => c.id), events };
}

/** Assinatura de um compasso, para comparar compassos entre exercícios. */
export function barSignature(bar: Bar): string {
  return bar.events.map(e => `${e.rest ? 'r' : ''}${e.value}${e.dots ? '.' : ''}${e.tie ? '~' : ''}${e.tuplet ? 't' : ''}`).join(' ');
}

/** Penalidade de bom senso de um compasso candidato (0 = perfeito). */
function penalty(cells: Cell[], ctx: { m: Meter; level: Level; index: number; total: number; prev?: Cell[]; avoid?: Set<string>; metaNotas?: number }): number {
  const { m, level, index, total, prev, avoid, metaNotas } = ctx;
  const evs = cells.flatMap(c => c.events);
  const restTicks = evs.filter(e => e.rest).reduce((s, e) => s + e.dur, 0);
  let p = 0;
  // Com `metaNotas` definido (preset "poucas notas", X1), a regra de sempre vira o contrário do
  // que se quer: aqui pausa demais É o objetivo, e quem decide "demais" é a meta de notas abaixo.
  if (metaNotas === undefined) {
    if (restTicks === m.barTicks) p += 1000;
    else if (restTicks > m.barTicks / 2) p += 100;
  } else {
    const soantes = evs.filter(e => !e.rest).length;
    p += Math.abs(soantes - metaNotas) * 8;
  }
  // Duas pausas de pulso inteiro seguidas: escreve-se uma pausa maior, ou é silêncio demais.
  for (let i = 1; i < cells.length; i++) if (cells[i].events.every(e => e.rest) && cells[i - 1].events.every(e => e.rest)) p += 20;
  if (prev && prev.map(c => c.id).join() === cells.map(c => c.id).join()) p += 30;
  if (level >= 2 && cells.length >= 3 && cells.every(c => c.id === cells[0].id)) p += 3; // a mesma célula em todos os tempos cansa
  if (avoid?.has(barSignature(barOf(cells, () => 0)))) p += 10;
  if (index === 0 && level <= 2 && evs[0].rest) p += 5;
  if (index === total - 1) {
    const last = evs[evs.length - 1];
    if (last.rest || last.tie) p += 4;
    if (level <= 3 && last.dur < TPQ) p += 2; // nos níveis iniciais, terminar numa figura longa soa conclusivo
  }
  return p;
}

const focus = (cellLevel: Level, level: Level) => (cellLevel === level ? 3 : cellLevel === level - 1 ? 1.4 : 0.8);

export interface GenerateOptions {
  seed?: number;
  /** Assinaturas de compassos a evitar (por exemplo, os do exercício anterior). */
  avoid?: Set<string>;
}

export function generateExercise(s: RhythmSettings, opts: GenerateOptions = {}): Exercise {
  const problem = checkSettings(s);
  if (problem) throw new GenerationError(problem);
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const r = rng(seed);
  const m = METERS[s.meter];
  const pool = poolFor(s);
  const ok = completable(pool, m);
  const hasLevelCells = pool.some(c => c.level === s.level);
  const n = Math.max(1, Math.round(s.bars));

  let cellsByBar: Cell[][] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    const used = new Set<string>();
    const weight = (c: Cell) => c.weight * focus(c.level, s.level) * (used.has(c.id) ? 1.5 : 1);
    cellsByBar = [];
    for (let b = 0; b < n; b++) {
      // Frase A B A C: em cada bloco de 4, às vezes o 3º compasso retoma o 1º.
      if (b % 4 === 2 && b < n - 1 && r() < 0.4) {
        cellsByBar.push(cellsByBar[b - 2]);
        continue;
      }
      let best: Cell[] = [];
      let bestP = Infinity;
      for (let t = 0; t < 40 && bestP > 0; t++) {
        const cand = randomBar(pool, m, ok, weight, r);
        const p = penalty(cand, { m, level: s.level, index: b, total: n, prev: cellsByBar[b - 1], avoid: opts.avoid, metaNotas: s.metaNotas });
        if (p < bestP) { best = cand; bestP = p; }
      }
      best.forEach(c => used.add(c.id));
      cellsByBar.push(best);
    }
    // O exercício precisa ter material do nível escolhido, senão o nível não muda nada.
    if (!hasLevelCells || cellsByBar.some(bar => bar.some(c => c.level === s.level))) break;
  }

  let tupletId = 0;
  const bars = cellsByBar.map(cells => barOf(cells, () => tupletId++));

  // Antecipação: colcheia (ou semi) no fim do compasso ligada ao tempo 1 do compasso seguinte.
  // Desacoplada do nível (06/11/2026, pedido do Paulo): depende só do trait `ligadura` — um
  // exercício de nível baixo também pode pedir ligadura entre compassos.
  if (s.traits.ligadura) {
    for (let b = 0; b < bars.length - 1; b++) {
      const last = bars[b].events[bars[b].events.length - 1];
      const first = bars[b + 1].events[0];
      if (!last.rest && !last.tie && !last.tuplet && last.dur <= TPQ / 2 && !first.rest && !first.tuplet && r() < 0.22) last.tie = true;
    }
  }

  const ex: Exercise = { seed, meter: s.meter, level: s.level, bars };
  const problems = validateExercise(ex, s);
  if (problems.length) throw new GenerationError(`Exercício inválido: ${problems[0]}`);
  return ex;
}

// ---------- verificação ----------

const writtenTicks = (e: { value: NoteValue; dots: 0 | 1 }) => VALUE_TICKS[e.value] * (e.dots ? 1.5 : 1);

/** Confere a matemática e a escrita do exercício. Devolve a lista de problemas (vazia = correto). */
export function validateExercise(ex: Exercise, s?: RhythmSettings): string[] {
  const m = METERS[ex.meter];
  const out: string[] = [];
  const all = ex.bars.flatMap((bar, bi) => bar.events.map(e => ({ e, bi })));
  ex.bars.forEach((bar, bi) => {
    let at = 0;
    for (const e of bar.events) {
      if (e.at !== at) out.push(`compasso ${bi + 1}: figura começa em ${e.at}, esperado ${at}`);
      const expected = e.tuplet ? (writtenTicks(e) * e.tuplet.occupied) / e.tuplet.num : writtenTicks(e);
      if (e.dur !== expected) out.push(`compasso ${bi + 1}: duração ${e.dur} não bate com a figura escrita (${expected})`);
      at += e.dur;
    }
    if (at !== m.barTicks) out.push(`compasso ${bi + 1}: soma ${at} ticks, o compasso tem ${m.barTicks}`);
    // quiálteras completas e alinhadas à grade de semicolcheias
    const groups = new Map<number, RhythmEvent[]>();
    bar.events.forEach(e => e.tuplet && groups.set(e.tuplet.id, [...(groups.get(e.tuplet.id) ?? []), e]));
    groups.forEach(g => {
      const start = g[0].at;
      const end = g[g.length - 1].at + g[g.length - 1].dur;
      const written = g.reduce((sum, e) => sum + writtenTicks(e), 0);
      if ((written * g[0].tuplet!.occupied) / g[0].tuplet!.num !== end - start) out.push(`compasso ${bi + 1}: quiáltera incompleta`);
      if (start % 6 !== 0 || end % 6 !== 0) out.push(`compasso ${bi + 1}: quiáltera fora da grade`);
    });
  });
  all.forEach(({ e, bi }, i) => {
    if (!e.tie) return;
    const next = all[i + 1];
    if (e.rest) out.push(`compasso ${bi + 1}: pausa com ligadura`);
    else if (!next || next.e.rest) out.push(`compasso ${bi + 1}: ligadura sem nota seguinte`);
  });
  if (s) {
    const allowed = new Set(poolFor(s).map(c => c.id));
    ex.bars.forEach((bar, bi) => bar.cells.forEach(id => { if (!allowed.has(id)) out.push(`compasso ${bi + 1}: célula ${id} fora das configurações`); }));
    const crossTie = ex.bars.some((bar, bi) => bi < ex.bars.length - 1 && bar.events[bar.events.length - 1].tie);
    if (crossTie && !s.traits.ligadura) out.push('ligadura entre compassos com ligaduras desligadas');
  }
  return out;
}

// ---------- reprodução ----------

export interface TimelineEntry {
  at: number; // ticks desde o início do exercício
  bar: number;
  index: number;
  attack: boolean; // falso para pausas e para a continuação de uma ligadura
}

export function timeline(ex: Exercise): { entries: TimelineEntry[]; total: number } {
  const m = METERS[ex.meter];
  const entries: TimelineEntry[] = [];
  let tiedIn = false;
  ex.bars.forEach((bar, bi) => bar.events.forEach((e, i) => {
    entries.push({ at: bi * m.barTicks + e.at, bar: bi, index: i, attack: !e.rest && !tiedIn });
    tiedIn = e.tie;
  }));
  return { entries, total: ex.bars.length * m.barTicks };
}

