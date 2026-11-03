// Motor de teoria musical do Clave.
// Uma nota é escrita (letra + acidente + oitava), não só uma altura: Dó♯ e Ré♭ são notas diferentes
// que soam igual. Isso permite grafar intervalos, escalas e acordes do jeito certo.

export type Letter = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Dó Ré Mi Fá Sol Lá Si
export interface Note {
  letter: Letter;
  acc: number; // -2..2 (bemóis negativos, sustenidos positivos)
  oct: number; // oitava científica: Dó central = Dó4
}
export type Naming = 'pt' | 'en';
/** Convenção de cifra de cada idioma: C7M e Cm7(♭5) em português; Cmaj7 e Cm7♭5 em inglês. */
export type Convention = 'pt' | 'en';

const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const PT = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'];
const EN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const mod = (n: number, m: number) => ((n % m) + m) % m;
export const note = (letter: number, acc = 0, oct = 4): Note => ({ letter: mod(letter, 7) as Letter, acc, oct });

export const midi = (n: Note) => 12 * (n.oct + 1) + NATURAL[n.letter] + n.acc;
export const pc = (n: Note) => mod(midi(n), 12);
/** Índice diatônico absoluto (posição na pauta). */
export const step = (n: Note) => n.oct * 7 + n.letter;
export const fromStep = (s: number, acc = 0): Note => ({ letter: mod(s, 7) as Letter, oct: Math.floor(s / 7), acc });
export const sameNote = (a: Note, b: Note) => a.letter === b.letter && a.acc === b.acc;

export function accSymbol(acc: number) {
  return acc === 0 ? '' : acc > 0 ? '♯'.repeat(acc) : '♭'.repeat(-acc);
}
export function letterName(letter: number, naming: Naming) {
  return (naming === 'pt' ? PT : EN)[mod(letter, 7)];
}
export function noteName(n: Pick<Note, 'letter' | 'acc'>, naming: Naming = 'pt') {
  return letterName(n.letter, naming) + accSymbol(n.acc);
}
export function noteNameOct(n: Note, naming: Naming = 'pt') {
  return noteName(n, naming) + n.oct;
}
/** Nome de classe de altura (para teclado e braço), preferindo sustenido e mostrando o enarmônico. */
export function pcName(p: number, naming: Naming = 'pt', both = true) {
  const sharp = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]][mod(p, 12)];
  const flat = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]][mod(p, 12)];
  const s = letterName(sharp[0], naming) + accSymbol(sharp[1]);
  if (!both || sharp[1] === 0) return s;
  return `${s}/${letterName(flat[0], naming) + accSymbol(flat[1])}`;
}
/** Converte uma altura MIDI em nota grafada, preferindo sustenidos ou bemóis. */
export function fromMidi(m: number, prefer: 'sharp' | 'flat' = 'sharp'): Note {
  const p = mod(m, 12);
  const table = prefer === 'sharp'
    ? [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]]
    : [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
  const [letter, acc] = table[p];
  return { letter: letter as Letter, acc, oct: Math.floor(m / 12) - 1 };
}

// ---------------- intervalos ----------------
export interface Interval {
  num: number; // 1 = uníssono, 3 = terça, 8 = oitava...
  semis: number;
}
const PERFECT_BASE: Record<number, number> = { 1: 0, 4: 5, 5: 7 };
const MAJOR_BASE: Record<number, number> = { 2: 2, 3: 4, 6: 9, 7: 11 };
export type Quality = 'J' | 'M' | 'm' | 'A' | 'd';

function simpleNum(num: number) {
  return ((num - 1) % 7) + 1;
}
function baseSemis(num: number) {
  const s = simpleNum(num);
  const octaves = Math.floor((num - 1) / 7);
  return (PERFECT_BASE[s] ?? MAJOR_BASE[s]) + 12 * octaves;
}
export function isPerfectClass(num: number) {
  return [1, 4, 5].includes(simpleNum(num));
}
export function quality(iv: Interval): Quality | null {
  const diff = iv.semis - baseSemis(iv.num);
  if (isPerfectClass(iv.num)) return diff === 0 ? 'J' : diff === 1 ? 'A' : diff === -1 ? 'd' : null;
  return diff === 0 ? 'M' : diff === -1 ? 'm' : diff === 1 ? 'A' : diff === -2 ? 'd' : null;
}
export function semisFor(num: number, q: Quality) {
  const b = baseSemis(num);
  if (isPerfectClass(num)) return b + (q === 'A' ? 1 : q === 'd' ? -1 : 0);
  return b + (q === 'm' ? -1 : q === 'A' ? 1 : q === 'd' ? -2 : 0);
}
/** Intervalo de a até b (b acima de a). */
export function intervalBetween(a: Note, b: Note): Interval {
  return { num: step(b) - step(a) + 1, semis: midi(b) - midi(a) };
}
/** Sobe (ou desce, se dir = -1) um intervalo a partir de uma nota, com a grafia correta. */
export function transpose(n: Note, iv: Interval, dir: 1 | -1 = 1): Note {
  const target = fromStep(step(n) + dir * (iv.num - 1));
  const want = midi(n) + dir * iv.semis;
  return { ...target, acc: want - midi(target) };
}

export function intervalShort(iv: Interval) {
  const q = quality(iv) ?? '?';
  return `${q}${iv.num}`;
}

// ---------------- escalas ----------------
type Deg = [num: number, semis: number];

/**
 * Direção em que a escala é percorrida. Importa para **uma** escala — a menor melódica clássica,
 * que é definida pela assimetria — e por isso `desc` é opcional.
 */
export type Direcao = 'sobe' | 'desce';

export const SCALES = {
  maior: { degs: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 11]] as Deg[] },
  menor: { degs: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10]] as Deg[] },
  'menor-harmonica': { degs: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 11]] as Deg[] },
  // As DUAS melódicas, e são duas escalas, não uma opção (decisão 70).
  //
  // A clássica é *definida* pela assimetria: sobe com 6ª e 7ª elevadas, desce como menor natural.
  // É a definição que uma prova de conservatório cobra, e é o que `desc` registra.
  //
  // A do jazz é a forma ascendente usada nas duas direções, e é conceitualmente outra escala — é a
  // que gera a alterada e a lídia dominante. Ela não tem `desc` porque desce igual.
  //
  // Mesmo nome, duas coisas: era daí que vinha a ambiguidade, e não da direção. E repare que
  // **subindo as duas são idênticas** — por isso quem pede para distingui-las de ouvido só na
  // subida está pedindo o impossível, e o item tem que recusar (decisão 70).
  'menor-melodica': {
    degs: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 11]] as Deg[],
    desc: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10]] as Deg[],
  },
  'menor-melodica-jazz': { degs: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 11]] as Deg[] },
  dorico: { degs: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 10]] as Deg[] },
  frigio: { degs: [[1, 0], [2, 1], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10]] as Deg[] },
  lidio: { degs: [[1, 0], [2, 2], [3, 4], [4, 6], [5, 7], [6, 9], [7, 11]] as Deg[] },
  mixolidio: { degs: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 10]] as Deg[] },
  locrio: { degs: [[1, 0], [2, 1], [3, 3], [4, 5], [5, 6], [6, 8], [7, 10]] as Deg[] },
  'penta-maior': { degs: [[1, 0], [2, 2], [3, 4], [5, 7], [6, 9]] as Deg[] },
  'penta-menor': { degs: [[1, 0], [3, 3], [4, 5], [5, 7], [7, 10]] as Deg[] },
  blues: { degs: [[1, 0], [3, 3], [4, 5], [5, 6], [5, 7], [7, 10]] as Deg[] },
} as const;
export type ScaleId = keyof typeof SCALES;
/** Todas as escalas, na ordem em que estão declaradas. É a lista que as telas oferecem. */
export const ALL_SCALE_IDS = Object.keys(SCALES) as ScaleId[];

/** Os graus da escala na direção pedida; `desce` só difere na melódica clássica. */
export function scaleDegs(id: ScaleId, dir: Direcao = 'sobe'): Deg[] {
  const e = SCALES[id] as { degs: Deg[]; desc?: Deg[] };
  return dir === 'desce' && e.desc ? e.desc : e.degs;
}

export function buildScale(tonic: Note, id: ScaleId, dir: Direcao = 'sobe'): Note[] {
  return scaleDegs(id, dir).map(([num, semis]) => transpose(tonic, { num, semis }));
}

/**
 * O rótulo de um grau a partir do número e dos semitons: `3`, `♭3`, `♯4`.
 *
 * Mora aqui, e não no catálogo, porque é grafia de teoria — e porque o teste do catálogo precisa
 * dela para conferir os distratores. Duas implementações disto divergiriam em silêncio.
 */
export function degreeLabel(num: number, semis: number): string {
  const natural = [0, 2, 4, 5, 7, 9, 11][num - 1];
  const delta = semis - natural;
  return `${delta < 0 ? '♭'.repeat(-delta) : delta > 0 ? '♯'.repeat(delta) : ''}${num}`;
}

/** Os rótulos dos graus da escala, **mais a tônica uma oitava acima** — é o que fecha o desenho. */
export function scaleDegreeLabels(id: ScaleId, dir: Direcao = 'sobe'): string[] {
  return [...scaleDegs(id, dir).map(([num, semis]) => degreeLabel(num, semis)), "1'"];
}

/**
 * As alturas MIDI de uma escala, na direção pedida, **incluindo a oitava nas duas pontas**.
 *
 * `sobe` devolve tônica → oitava; `desce` devolve oitava → tônica, usando os graus descendentes
 * quando a escala tem os seus. É o que os itens de ouvido toca.
 */
export function scaleMidi(tonic: number, id: ScaleId, dir: Direcao = 'sobe'): number[] {
  const semis = scaleDegs(id, dir).map(([, s]) => tonic + s);
  return dir === 'sobe' ? [...semis, tonic + 12] : [tonic + 12, ...semis.slice().reverse()];
}

// ---------------- acordes ----------------
// Os nomes por extenso de escalas e acordes ficam nos textos de cada idioma (theory.* em src/i18n).
export const CHORDS = {
  maior: { suffix: { pt: '', en: '' }, degs: [[1, 0], [3, 4], [5, 7]] as Deg[] },
  menor: { suffix: { pt: 'm', en: 'm' }, degs: [[1, 0], [3, 3], [5, 7]] as Deg[] },
  aum: { suffix: { pt: '(♯5)', en: '+' }, degs: [[1, 0], [3, 4], [5, 8]] as Deg[] },
  dim: { suffix: { pt: '°', en: 'dim' }, degs: [[1, 0], [3, 3], [5, 6]] as Deg[] },
  sus4: { suffix: { pt: 'sus4', en: 'sus4' }, degs: [[1, 0], [4, 5], [5, 7]] as Deg[] },
  '7M': { suffix: { pt: '7M', en: 'maj7' }, degs: [[1, 0], [3, 4], [5, 7], [7, 11]] as Deg[] },
  '7': { suffix: { pt: '7', en: '7' }, degs: [[1, 0], [3, 4], [5, 7], [7, 10]] as Deg[] },
  m7: { suffix: { pt: 'm7', en: 'm7' }, degs: [[1, 0], [3, 3], [5, 7], [7, 10]] as Deg[] },
  m7b5: { suffix: { pt: 'm7(♭5)', en: 'm7♭5' }, degs: [[1, 0], [3, 3], [5, 6], [7, 10]] as Deg[] },
  dim7: { suffix: { pt: '°7', en: 'dim7' }, degs: [[1, 0], [3, 3], [5, 6], [7, 9]] as Deg[] },
} as const satisfies Record<string, { suffix: Record<Convention, string>; degs: Deg[] }>;
export type ChordId = keyof typeof CHORDS;
export const TRIADS: ChordId[] = ['maior', 'menor', 'aum', 'dim'];
export const SEVENTHS: ChordId[] = ['7M', '7', 'm7', 'm7b5', 'dim7'];

export function buildChord(root: Note, id: ChordId, inversion = 0): Note[] {
  const notes = CHORDS[id].degs.map(([num, semis]) => transpose(root, { num, semis }));
  for (let i = 0; i < inversion; i++) {
    const n = notes.shift()!;
    notes.push({ ...n, oct: n.oct + 1 });
  }
  return notes;
}
/** Cifra: no Brasil a cifra usa letras (C, Am7) mesmo quando as notas são ditas em Dó-Ré-Mi.
 *  O que muda entre os idiomas é o sufixo (C7M/Cmaj7, Cm7(♭5)/Cm7♭5, C°/Cdim). */
export function chordSymbol(root: Pick<Note, 'letter' | 'acc'>, id: ChordId, conv: Convention = 'pt') {
  return noteName(root, 'en') + CHORDS[id].suffix[conv];
}

// ---------------- tonalidades ----------------
const SHARP_ORDER: Letter[] = [3, 0, 4, 1, 5, 2, 6]; // Fá Dó Sol Ré Lá Mi Si
const FLAT_ORDER: Letter[] = [6, 2, 5, 1, 4, 0, 3];
/** fifths: -7..7 (bemóis negativos). Devolve a tônica maior. */
export function majorTonic(fifths: number): Note {
  let n = note(0, 0, 4);
  const iv = fifths >= 0 ? { num: 5, semis: 7 } : { num: 4, semis: 5 };
  for (let i = 0; i < Math.abs(fifths); i++) {
    n = transpose(n, iv);
    n.oct = 4;
  }
  return n;
}
export function relativeMinor(fifths: number): Note {
  return transpose(majorTonic(fifths), { num: 6, semis: 9 });
}
/** Acidente de cada letra numa armadura. */
export function keyAccidentals(fifths: number): Record<number, number> {
  const out: Record<number, number> = {};
  if (fifths > 0) SHARP_ORDER.slice(0, fifths).forEach(l => (out[l] = 1));
  if (fifths < 0) FLAT_ORDER.slice(0, -fifths).forEach(l => (out[l] = -1));
  return out;
}
/** Posições (índice diatônico) dos acidentes da armadura na pauta. */
export function keySignatureSteps(fifths: number, clef: Clef): number[] {
  const sharpsTreble = [38, 35, 39, 36, 33, 37, 34]; // Fá5 Dó5 Sol5 Ré5 Lá4 Mi5 Si4
  const flatsTreble = [34, 37, 33, 36, 32, 35, 31]; // Si4 Mi5 Lá4 Ré5 Sol4 Dó5 Fá4
  const shift = clef === 'fa' ? -14 : 0;
  const list = fifths > 0 ? sharpsTreble.slice(0, fifths) : flatsTreble.slice(0, -fifths);
  return list.map(s => s + shift);
}
/** Grafa uma nota de acordo com a armadura (se não tiver acidente explícito). */
export function applyKey(letterStep: number, fifths: number): Note {
  const acc = keyAccidentals(fifths)[mod(letterStep, 7)] ?? 0;
  return fromStep(letterStep, acc);
}

// ---------------- pauta ----------------
export type Clef = 'sol' | 'fa';
/** Índice diatônico da linha de baixo da pauta (Mi4 na clave de sol, Sol2 na de fá). */
export const clefBottom = (clef: Clef) => (clef === 'sol' ? 30 : 18);

// ---------------- campo harmônico ----------------
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export interface Degree {
  degree: number; // 1..7
  root: Note;
  chord: ChordId;
  roman: string;
  symbol: string;
}
export function harmonicField(tonic: Note, mode: 'maior' | 'menor', tetrads = false, conv: Convention = 'pt'): Degree[] {
  const scale = buildScale(tonic, mode);
  const types: ChordId[] = mode === 'maior'
    ? (tetrads ? ['7M', 'm7', 'm7', '7M', '7', 'm7', 'm7b5'] : ['maior', 'menor', 'menor', 'maior', 'maior', 'menor', 'dim'])
    : (tetrads ? ['m7', 'm7b5', '7M', 'm7', 'm7', '7M', '7'] : ['menor', 'dim', 'maior', 'menor', 'menor', 'maior', 'maior']);
  return scale.map((root, i) => {
    const chord = types[i];
    const minorish = ['menor', 'm7', 'dim', 'm7b5', 'dim7'].includes(chord);
    let roman = ROMAN[i];
    if (minorish) roman = roman.toLowerCase();
    if (mode === 'menor' && [2, 5, 6].includes(i)) roman = '♭' + roman;
    const suffix = chord === 'dim' ? '°' : chord === 'm7b5' ? 'ø' : chord === '7M' ? (conv === 'pt' ? '7M' : 'maj7') : chord === '7' ? '7' : chord === 'm7' ? '7' : '';
    return { degree: i + 1, root, chord, roman: roman + suffix, symbol: chordSymbol(root, chord, conv) };
  });
}

// ---------------- aleatoriedade ----------------
export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** Sorteia `count` itens distintos incluindo `must`. */
export function optionsWith<T>(must: T, pool: T[], count: number, eq: (a: T, b: T) => boolean = (a, b) => a === b): T[] {
  const others = shuffle(pool.filter(p => !eq(p, must))).slice(0, count - 1);
  return shuffle([must, ...others]);
}
