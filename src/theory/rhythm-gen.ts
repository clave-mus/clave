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
  type Cell, type Figure, type Meter, type MeterId, type NoteValue, type RestKind, type Trait,
} from './rhythm-cells';

export interface RhythmSettings {
  meter: MeterId;
  bars: number;
  figures: Record<Figure, boolean>;
  rests: boolean;
  restKinds: Record<RestKind, boolean>;
  traits: Record<Trait, boolean>;
  /**
   * Quanto as células COM pausa pesam, de 0 (nenhuma pausa) a 2 (o dobro do normal). 1 é o de
   * sempre. Substitui o liga/desliga como único controle: "poucas pausas" é o que quase todo
   * preset quer, e isso não se diz com um booleano.
   */
  pausas: number;
  /**
   * Chance de ligar a última figura de um compasso à primeira do seguinte (a *antecipação*).
   *
   * Virou configuração em 06/11/2026 porque o preset de ligaduras precisa dela alta: com o valor
   * fixo de antes (0,22) e só mínimas e semínimas, **nenhuma ligadura saía** — a antecipação ainda
   * exigia colcheia, e as duas únicas células com ligadura também.
   */
  chanceDeLigadura: number;
  /**
   * **Focar em células específicas**, pelo id do catálogo (pedido do Paulo, 09/11/2026: "poder
   * escolher focar em células rítmicas essenciais", com uma lista de nove).
   *
   * Quando tem algo aqui, o pool é **exatamente** estas células — `figuras`, `pausas` e `recursos`
   * deixam de filtrar. É de propósito: quem nomeia as células quer aquelas, e manter os filtros
   * por cima tiraria metade da lista (duas das nove do Paulo têm pausa de semicolcheia, e as
   * pontuadas cairiam com o recurso "pontuada" desligado).
   *
   * Se a lista não der para preencher o compasso — em 6/8 nenhuma célula de um tempo serve —,
   * `checkSettings` devolve `cantFill` e a tela já explica. Não precisou de guarda nova.
   */
  celulas?: readonly string[];
  /**
   * Como o compasso é montado. `celulas` é o de sempre: sorteia do catálogo de `rhythm-cells.ts`.
   * `esparso` é posicional — sorteia N casas numa grade de semicolcheias e o resto vira pausa
   * (pedido do Paulo: *"pra cada compasso, você sorteia 2 números entre 1 e 8"*).
   */
  modo?: 'celulas' | 'esparso';
  /** Quantas notas soam por compasso no modo `esparso`. */
  notasPorCompasso?: number;
}

export const BAR_COUNTS = [2, 4, 8];
export const PAUSAS = { min: 0, max: 2, padrao: 1 };

export const DEFAULT_SETTINGS: RhythmSettings = {
  meter: '4/4',
  bars: 4,
  figures: { w: true, h: true, q: true, '8': true, '16': true },
  rests: true,
  restKinds: { h: true, q: true, '8': true, '16': true },
  traits: { pontuada: true, sincope: true, ligadura: true, quialtera: true },
  pausas: PAUSAS.padrao,
  chanceDeLigadura: 0.22,
};

// ---------- presets ----------
//
// **Os presets são a porta de entrada** (decidido com o Paulo em 06/11/2026), no lugar da escada
// de níveis que existia antes. Um preset não é um modo: é só **um pacote nomeado de valores de
// parâmetro**. Depois de escolher um, tudo continua ajustável — é o desenho que o `X6b` propõe,
// *preset primeiro, parâmetro depois*.
//
// A lista e a ordem são do Paulo. Os quatro primeiros são cumulativos (cada um acrescenta uma
// figura) e todos vão com **poucas pausas, sem ligadura e sem pontuada**, como ele pediu.
// Quiáltera fica fora de todos: nenhum preset dele menciona tercina.

export interface Preset {
  id: string;
  settings: Partial<RhythmSettings>;
}

const SEM_ENFEITE = { pontuada: false, sincope: true, ligadura: false, quialtera: false };
const POUCAS_PAUSAS = 0.45;

/**
 * As nove células essenciais que o Paulo listou em 09/11/2026, na ordem dele.
 *
 * **Todas as nove já existiam** em `CELL_DEFS` — eu quase disse a ele que quatro faltavam, porque
 * estava olhando o catálogo antigo de `theory/rhythm.ts`, que tem doze. O que faltava era poder
 * pedir *estas*, e não uma classe de figuras.
 *
 * Todas ocupam um tempo, inclusive a tercina (`3:2(q 8)` soma 24 ticks), então um compasso 4/4 são
 * quatro delas. Em 2/4 e 3/4 também serve; em 6/8 o pulso é semínima pontuada e nenhuma cabe.
 */
export const CELULAS_ESSENCIAIS = [
  '16x4',           // 4 semicolcheias
  '8-16-16',        // 1 colcheia + 2 semicolcheias
  '16-16-8',        // 2 semicolcheias + 1 colcheia
  '16-8-16',        // 1 semicolcheia + 1 colcheia + 1 semicolcheia
  '8d-16',          // colcheia pontuada + semicolcheia
  '16-8d',          // semicolcheia + colcheia pontuada
  'r16-16-16-16',   // pausa de semicolcheia + 3 semicolcheias
  '8-r16-16',       // colcheia + pausa de semicolcheia + semicolcheia
  'tq-8',           // semínima + colcheia, em tercina
] as const;

export const PRESETS: Preset[] = [
  {
    id: 'minimas',
    settings: {
      figures: { w: false, h: true, q: false, '8': false, '16': false },
      traits: SEM_ENFEITE, pausas: POUCAS_PAUSAS, modo: 'celulas',
    },
  },
  {
    id: 'seminimas',
    settings: {
      figures: { w: false, h: true, q: true, '8': false, '16': false },
      traits: SEM_ENFEITE, pausas: POUCAS_PAUSAS, modo: 'celulas',
    },
  },
  {
    id: 'colcheias',
    settings: {
      figures: { w: false, h: true, q: true, '8': true, '16': false },
      traits: SEM_ENFEITE, pausas: POUCAS_PAUSAS, modo: 'celulas',
    },
  },
  {
    id: 'semicolcheias',
    settings: {
      figures: { w: false, h: true, q: true, '8': true, '16': true },
      traits: SEM_ENFEITE, pausas: POUCAS_PAUSAS, modo: 'celulas',
    },
  },
  {
    // Só mínimas e semínimas, e a ligadura é o assunto — por isso a chance vai a 0,85 e as células
    // de semínima ligada entram. Sem isso este preset geraria ZERO ligaduras (ver `chanceDeLigadura`).
    id: 'ligaduras',
    settings: {
      figures: { w: false, h: true, q: true, '8': false, '16': false },
      traits: { pontuada: false, sincope: true, ligadura: true, quialtera: false },
      pausas: 0.3, chanceDeLigadura: 0.85, modo: 'celulas',
    },
  },
  {
    id: 'pontuadas',
    settings: {
      figures: { w: false, h: true, q: true, '8': true, '16': false },
      traits: { pontuada: true, sincope: true, ligadura: false, quialtera: false },
      pausas: POUCAS_PAUSAS, modo: 'celulas',
    },
  },
  {
    // "Notas esparsas" (nome do Paulo). Compasso quase todo pausado, com duas semicolcheias
    // soltas: 2/4 dá exatamente as oito casas que ele descreveu.
    id: 'esparsas',
    settings: {
      meter: '2/4',
      figures: { w: false, h: false, q: false, '8': false, '16': true },
      traits: { pontuada: false, sincope: true, ligadura: false, quialtera: false },
      modo: 'esparso', notasPorCompasso: 2,
    },
  },
  {
    id: 'essenciais',
    settings: {
      celulas: CELULAS_ESSENCIAIS,
      // Com `celulas` preenchido estes três não filtram mais nada; ficam coerentes para o caso de
      // alguém desmarcar a lista depois e cair de volta no modo por figuras.
      figures: { w: false, h: false, q: true, '8': true, '16': true },
      rests: true, traits: { pontuada: true, sincope: true, ligadura: false, quialtera: true },
      pausas: 1, modo: 'celulas',
    },
  },
];

export const presetById = Object.fromEntries(PRESETS.map(p => [p.id, p]));

/** As configurações de um preset, completadas com o padrão. Mantém `bars`, que é escolha de tela. */
export function aplicarPreset(atual: RhythmSettings, id: string): RhythmSettings {
  const p = presetById[id];
  if (!p) return atual;
  return { ...DEFAULT_SETTINGS, bars: atual.bars, meter: atual.meter, ...p.settings };
}

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
 * **Sem filtro de nível desde 06/11/2026:** o que a célula usa — figuras, pausas e recursos — já
 * diz tudo que o nível dizia, e com granularidade melhor. A escada saiu da tela junto.
 */
export function poolFor(s: RhythmSettings): Cell[] {
  const doCompasso = cellsFor(METERS[s.meter]);
  // Células nomeadas mandam: viram o pool inteiro, sem os filtros por cima (ver `celulas`).
  if (s.celulas?.length) {
    const pedidas = new Set(s.celulas);
    return doCompasso.filter(c => pedidas.has(c.id));
  }
  return doCompasso.filter(c =>
    c.figures.every(f => s.figures[f]) &&
    (c.rests.length === 0 || (s.rests && c.rests.every(r => s.restKinds[r]))) &&
    c.traits.every(t => s.traits[t]));
}

/** O que esta fórmula de compasso tem a oferecer, antes das restrições do usuário (para a interface). */
export function offeredBy(meter: MeterId) {
  const cells = cellsFor(METERS[meter]);
  return {
    figures: new Set(cells.flatMap(c => c.figures)),
    rests: new Set(cells.flatMap(c => c.rests)),
    traits: new Set(cells.flatMap(c => c.traits)),
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
export type SettingsProblem = 'noFigures' | 'cantFill' | 'cellsNotInMeter';
/** Devolve o problema, ou null se as configurações geram compassos. */
export function checkSettings(s: RhythmSettings): SettingsProblem | null {
  const m = METERS[s.meter];
  const pool = poolFor(s);
  // Antes de `noFigures`: quando há células NOMEADAS e nenhuma serve para esta fórmula, dizer
  // "nenhuma figura escolhida" mentiria — a pessoa escolheu nove, e o problema é o compasso. Em
  // 6/8 o pulso é semínima pontuada e nenhuma célula de um tempo cabe.
  if (s.celulas?.length && pool.length === 0) return 'cellsNotInMeter';
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

// ---------- modo esparso (posicional) ----------
//
// O outro jeito de montar um compasso, e o pedido do Paulo em 06/11/2026 nas palavras dele:
// *"pra cada compasso, você sorteia 2 números entre 1 e 8 e os que caírem serão as notas daquele
// compasso. o resto vai ser pausa."* Oito casas de semicolcheia = um compasso de 2/4.
//
// **Por que não dá para fazer isso com células.** O catálogo monta o compasso encaixando padrões
// prontos; aqui o compasso nasce de um sorteio de posições, e qualquer uma das combinações pode
// sair. Enumerar as 2⁸ combinações como células seria descrever à mão o que uma linha de sorteio
// resolve. São duas estratégias de montagem, não dois geradores: o resto do arquivo — validação,
// linha do tempo, desenho — não sabe a diferença.

/** As casas de semicolcheia de um compasso. */
const casasDe = (m: Meter) => m.barTicks / VALUE_TICKS['16'];

/**
 * Junta pausas vizinhas no que a escrita pede: quatro semicolcheias de pausa dentro de um tempo
 * viram uma pausa de semínima, duas dentro de meio tempo viram uma de colcheia.
 *
 * **Sem isto o compasso fica ilegível** — sete pausas de semicolcheia enfileiradas é o tipo de
 * coisa que nenhuma partitura escreve, e era o risco real deste modo.
 */
function agruparPausas(soa: boolean[], inicio: number, fim: number, out: RhythmEvent[], at: (i: number) => number) {
  const vazio = (a: number, b: number) => soa.slice(a, b).every(x => !x);
  const pausa = (i: number, value: NoteValue, dur: number) =>
    out.push({ at: at(i), dur, value, dots: 0, rest: true, tie: false, cell: 0 });
  if (vazio(inicio, fim) && fim - inicio === 4) { pausa(inicio, 'q', VALUE_TICKS.q); return; }
  for (let meio = inicio; meio < fim; meio += 2) {
    if (vazio(meio, meio + 2)) { pausa(meio, '8', VALUE_TICKS['8']); continue; }
    for (let i = meio; i < meio + 2; i++) if (!soa[i]) pausa(i, '16', VALUE_TICKS['16']);
      else out.push({ at: at(i), dur: VALUE_TICKS['16'], value: '16', dots: 0, rest: false, tie: false, cell: 0 });
  }
}

/** Um compasso esparso: `notas` casas sorteadas soam, o resto é pausa agrupada. */
export function barraEsparsa(m: Meter, notas: number, r: () => number): Bar {
  const n = casasDe(m);
  const soa = Array<boolean>(n).fill(false);
  const alvo = Math.max(1, Math.min(n, Math.round(notas)));
  let postas = 0;
  // sorteio sem repetição: tenta uma casa livre até preencher o alvo
  while (postas < alvo) {
    const i = Math.floor(r() * n);
    if (soa[i]) continue;
    soa[i] = true;
    postas++;
  }
  const events: RhythmEvent[] = [];
  const at = (i: number) => i * VALUE_TICKS['16'];
  // tempo a tempo (quatro casas), para a pausa de semínima nunca atravessar o pulso
  for (let t = 0; t < n; t += 4) agruparPausas(soa, t, Math.min(t + 4, n), events, at);
  events.sort((a, b) => a.at - b.at);
  return { cells: [], events };
}

/** Assinatura de um compasso, para comparar compassos entre exercícios. */
export function barSignature(bar: Bar): string {
  return bar.events.map(e => `${e.rest ? 'r' : ''}${e.value}${e.dots ? '.' : ''}${e.tie ? '~' : ''}${e.tuplet ? 't' : ''}`).join(' ');
}

/**
 * Penalidade de bom senso de um compasso candidato (0 = perfeito).
 *
 * Onde antes se lia `level <= 2`, hoje se lê `simples` — o conjunto escolhido não tem
 * semicolcheia nem quiáltera. É a mesma intenção ("nos começos, soe conclusivo") sem depender da
 * escada que saiu.
 */
function penalty(cells: Cell[], ctx: { m: Meter; simples: boolean; index: number; total: number; prev?: Cell[]; avoid?: Set<string> }): number {
  const { m, simples, index, total, prev, avoid } = ctx;
  const evs = cells.flatMap(c => c.events);
  const restTicks = evs.filter(e => e.rest).reduce((s, e) => s + e.dur, 0);
  let p = 0;
  if (restTicks === m.barTicks) p += 1000;
  else if (restTicks > m.barTicks / 2) p += 100;
  // Duas pausas de pulso inteiro seguidas: escreve-se uma pausa maior, ou é silêncio demais.
  for (let i = 1; i < cells.length; i++) if (cells[i].events.every(e => e.rest) && cells[i - 1].events.every(e => e.rest)) p += 20;
  if (prev && prev.map(c => c.id).join() === cells.map(c => c.id).join()) p += 30;
  if (cells.length >= 3 && cells.every(c => c.id === cells[0].id)) p += 3; // a mesma célula em todos os tempos cansa
  if (avoid?.has(barSignature(barOf(cells, () => 0)))) p += 10;
  if (index === 0 && simples && evs[0].rest) p += 5;
  if (index === total - 1) {
    const last = evs[evs.length - 1];
    if (last.rest || last.tie) p += 4;
    if (simples && last.dur < TPQ) p += 2; // num conjunto simples, terminar numa figura longa soa conclusivo
  }
  return p;
}

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
  const n = Math.max(1, Math.round(s.bars));

  let bars: Bar[];
  if (s.modo === 'esparso') {
    bars = Array.from({ length: n }, () => barraEsparsa(m, s.notasPorCompasso ?? 2, r));
  } else {
    const pool = poolFor(s);
    const ok = completable(pool, m);
    // "Simples" no lugar do nível: sem semicolcheia e sem quiáltera à vista.
    const simples = !s.figures['16'] && !s.traits.quialtera;
    const used = new Set<string>();
    const weight = (c: Cell) =>
      c.weight * (c.rests.length ? s.pausas : 1) * (used.has(c.id) ? 1.5 : 1);
    const cellsByBar: Cell[][] = [];
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
        const p = penalty(cand, { m, simples, index: b, total: n, prev: cellsByBar[b - 1], avoid: opts.avoid });
        if (p < bestP) { best = cand; bestP = p; }
      }
      best.forEach(c => used.add(c.id));
      cellsByBar.push(best);
    }
    let tupletId = 0;
    bars = cellsByBar.map(cells => barOf(cells, () => tupletId++));
  }

  // Antecipação: a última figura do compasso ligada ao tempo 1 do seguinte.
  //
  // Duas coisas mudaram em 06/11/2026, e juntas destravam o preset de ligaduras: a chance virou
  // configuração (`chanceDeLigadura`), e a figura pode ser até uma **semínima** — antes só
  // colcheia ou menor, o que sozinho já zerava as ligaduras de um exercício sem colcheias.
  if (s.traits.ligadura && s.chanceDeLigadura > 0) {
    for (let b = 0; b < bars.length - 1; b++) {
      const last = bars[b].events[bars[b].events.length - 1];
      const first = bars[b + 1].events[0];
      if (!last.rest && !last.tie && !last.tuplet && last.dur <= TPQ && !first.rest && !first.tuplet && r() < s.chanceDeLigadura) last.tie = true;
    }
  }

  const ex: Exercise = { seed, meter: s.meter, bars };
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

