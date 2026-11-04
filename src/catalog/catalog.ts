// Catálogo de exercícios. Cada um sorteia uma pergunta a partir das configurações escolhidas.
// Os textos vêm de ctx.t (src/i18n): os fixos por chave e os de teoria montados com a gramática de
// cada idioma (src/theory/names.ts). As cifras seguem a convenção do idioma (ctx.conv).
import {
  buildChord, buildScale, CHORDS, chordSymbol, clefBottom, harmonicField,
  ALL_SCALE_IDS, majorTonic, scaleDegreeLabels, midi, mod, note, noteName, optionsWith, pc, pcName, pick, randInt, relativeMinor, SCALES, scaleDegs, scaleMidi, semisFor, shuffle, transpose,
  type ChordId, type Clef, type Direcao, type Note, type Quality, type ScaleId,
} from '../theory/core';
import { accidentalCount, intervalName, ordinal, semitoneName } from '../theory/names';
import type { MessageKey } from '../i18n';
import { CELLS, RHYTHM_PRESETS, randomBars, type CellId } from '../theory/rhythm';
import { TUNINGS } from '../components/music/Fretboard';
import { LEGADO } from './publicacao';
import type { CatalogItem, ChoiceOption, Ctx, Expected, Question, Setting, SettingValue } from './types';
// F2-3: o contexto musical vem da cascata, não de faixas escritas no código
import { alturaDoPc, alturaNaRegiao, clave, notaNaPauta, pcPermitido, pcsPermitidas, regiao, tonicaNaRegiao } from './contexto-musical';

type S = Record<string, SettingValue>;
const arr = (v: SettingValue | undefined, fallback: string[]) => (Array.isArray(v) && v.length ? v : fallback);

// ---------------- configurações reaproveitadas ----------------
// CLEFS, INST e as superfícies de resposta ficam SEM `tier` de propósito: não existe "clave de sol
// mais fácil que clave de fá" nem "violão mais fácil que baixo". Inventar ordem onde ela não existe
// é o erro que a decisão 9 proíbe.
const CLEFS = ({ t }: Ctx): Setting => ({ id: 'claves', label: t('settings.clefs'), type: 'multi', options: [{ id: 'sol', label: t('settings.clefSol') }, { id: 'fa', label: t('settings.clefFa') }] });
const EXT = ({ t }: Ctx): Setting => ({ id: 'extensao', label: t('settings.range'), type: 'single', options: [{ id: 'pauta', label: t('settings.rangeStaff'), tier: 1 }, { id: 'suplementares', label: t('settings.rangeLedger'), tier: 2 }] });
const ACC = ({ t }: Ctx): Setting => ({ id: 'acidentes', label: t('settings.accidentals'), type: 'toggle' });
const INST = ({ t }: Ctx): Setting => ({ id: 'instrumento', label: t('settings.instrument'), type: 'single', options: [
  { id: 'auto', label: t('settings.myInstrument') }, { id: 'violao', label: t('settings.guitar') }, { id: 'baixo', label: t('settings.bass') }] });
const FRETS = ({ t }: Ctx): Setting => ({ id: 'casas', label: t('settings.frets'), type: 'single', options: [
  { id: '0-5', label: t('settings.frets05'), tier: 1 }, { id: '5-9', label: t('settings.frets59'), tier: 2 }, { id: '0-12', label: t('settings.frets012'), tier: 3 }] });
/** Direção de percurso. Entra em todo item que toca uma escala ou um arpejo (decisão 70). */
const DIRECAO = ({ t }: Ctx): Setting => ({ id: 'direcao', label: t('settings.direction'), type: 'single', options: [
  { id: 'sobe', label: t('settings.up') }, { id: 'desce', label: t('settings.down') }, { id: 'ambos', label: t('settings.upDown') }] });

/**
 * As alturas a tocar de uma escala, na direção escolhida.
 *
 * `ambos` sobe e desce, e é o único caso em que a melódica clássica **mostra o que ela é**: sobe
 * com 6ª e 7ª elevadas e desce como menor natural. A oitava do topo não se repete na virada.
 */
function scaleSound(tonic: number, id: ScaleId, dir?: SettingValue): number[] {
  const d = (dir ?? 'sobe') as Direcao | 'ambos';
  if (d === 'ambos') return [...scaleMidi(tonic, id, 'sobe'), ...scaleMidi(tonic, id, 'desce').slice(1)];
  return scaleMidi(tonic, id, d);
}

const chordName = (t: Ctx['t'], id: ChordId) => t(`theory.chords.${id}` as MessageKey);
const scaleName = (t: Ctx['t'], id: ScaleId) => t(`theory.scales.${id}` as MessageKey);
const chordTypes = (t: Ctx['t'], ids: ChordId[]) => ids.map(c => ({ id: c, label: chordName(t, c) }));
const ALL_CHORDS = Object.keys(CHORDS) as ChordId[];
const ALL_SCALES = ALL_SCALE_IDS;

// O `tier` é dica de dificuldade relativa, só para a variação automática pré-marcar (F2-2).
// Aqui existe ordem defensável: oitava, quinta e terças antes das segundas e sétimas, e o trítono
// por último. Onde não houver ordem defensável, o tier fica ausente — ver abaixo.
const INTERVALS: { id: string; num: number; q: Quality; tier: 1 | 2 | 3 }[] = [
  { id: 'J8', num: 8, q: 'J', tier: 1 }, { id: 'J5', num: 5, q: 'J', tier: 1 }, { id: 'J4', num: 4, q: 'J', tier: 1 },
  { id: 'M3', num: 3, q: 'M', tier: 1 }, { id: 'm3', num: 3, q: 'm', tier: 1 },
  { id: 'M6', num: 6, q: 'M', tier: 2 }, { id: 'm6', num: 6, q: 'm', tier: 2 },
  { id: 'M2', num: 2, q: 'M', tier: 2 }, { id: 'm2', num: 2, q: 'm', tier: 2 },
  { id: 'm7', num: 7, q: 'm', tier: 3 }, { id: 'M7', num: 7, q: 'M', tier: 3 },
  { id: 'A4', num: 4, q: 'A', tier: 3 }, { id: 'd5', num: 5, q: 'd', tier: 3 },
];
const ivLabel = (id: string, ctx: Ctx) => { const iv = INTERVALS.find(i => i.id === id)!; return intervalName({ num: iv.num, semis: semisFor(iv.num, iv.q) }, ctx.conv); };
const semiOptions = (ctx: Ctx): ChoiceOption[] => Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), label: semitoneName(i + 1, ctx.conv) }));
/** A mesma ordem de dificuldade dos intervalos escritos, em semitons (F2-2). */
const SEMI_TIER: Record<number, 1 | 2 | 3> = { 12: 1, 7: 1, 5: 1, 4: 1, 3: 1, 9: 2, 8: 2, 2: 2, 1: 2, 10: 3, 11: 3, 6: 3 };
const ROOTS: Note[] = [note(0), note(1, -1), note(1), note(2, -1), note(2), note(3), note(3, 1), note(4), note(5, -1), note(5), note(6, -1), note(6)];
const spellPc = (p: number, oct = 4): Note => ({ ...ROOTS[mod(p, 12)], oct });
const MODES: ScaleId[] = ['maior', 'dorico', 'frigio', 'lidio', 'mixolidio', 'menor', 'locrio'];

/** A clave da pergunta: o que o item escolheu, ou a clave global quando ele não escolheu (F2-3). */
function pickClef(s: S, ctx: Ctx): Clef {
  const escolhidas = Array.isArray(s.claves) && s.claves.length ? (s.claves as string[]) : [clave(ctx)];
  return pick(escolhidas) as Clef;
}
function stepRange(clef: Clef, ext: SettingValue | undefined): [number, number] {
  const b = clefBottom(clef);
  return ext === 'suplementares' ? [b - 6, b + 14] : [b - 1, b + 9];
}
function randAcc(on: SettingValue | undefined) {
  if (!on) return 0;
  const r = Math.random();
  return r < 0.5 ? 0 : r < 0.75 ? 1 : -1;
}
/** Uma casa do braço cuja nota o material permite (F2-3). Tenta algumas vezes e desiste para a
 *  primeira que couber — com `diatonico` numa região curta, nem toda corda tem nota da tonalidade. */
/**
 * Uma casa do braço que o material permite.
 *
 * **Não usa `params.range`, e isso é a correção de um bug que travava três exercícios.** A versão
 * anterior interseccionava com a região em MIDI: num baixo com casas 0–5 e a região padrão (48–72),
 * sobrava **uma única casa no braço inteiro** — a corda Sol na casa 5 —, e o exercício repetia a mesma
 * pergunta para sempre. Medido: 1 posição distinta em 200 sorteios.
 *
 * E a causa é conceitual, não um descuido de limite: **num exercício de braço, a região é a faixa de
 * casas** (`casas`), que a pessoa escolhe. A região em MIDI foi feita para ouvido e pauta ("quero
 * praticar no grave"), e sobrepô-la ao braço mede a mesma coisa duas vezes com unidades diferentes.
 */
function casaPermitida(tuning: readonly number[], from: number, to: number, ctx: Ctx) {
  const permitidas = pcsPermitidas(ctx);
  const lo = from === 0 ? 0 : from + 1;
  const todas: { str: number; f: number; m: number }[] = [];
  for (let str = 0; str < tuning.length; str++) {
    for (let f = lo; f <= to; f++) {
      const m = tuning[str] + f;
      if (permitidas.includes(mod(m, 12))) todas.push({ str, f, m });
    }
  }
  if (todas.length) return pick(todas);
  const str = randInt(0, tuning.length - 1), f = randInt(lo, to);
  return { str, f, m: tuning[str] + f };
}

function fretRange(s: S): [number, number] {
  const [a, b] = String(s.casas ?? '0-5').split('-').map(Number);
  return [a, b];
}
function tuningOf(s: S, ctx: Ctx) {
  if (s.instrumento === 'auto' || !s.instrumento) return ctx.params.tuning;
  return TUNINGS[s.instrumento as 'violao' | 'baixo'];
}
const pcOptions = (naming: Ctx['naming']): ChoiceOption[] => Array.from({ length: 12 }, (_, p) => ({ id: String(p), label: pcName(p, naming), value: { kind: 'pitchClass', pc: p } }));
/** Opção que é uma cifra: confere pela fundamental e pela qualidade, não pelo texto. */
const chordOption = (label: string): ChoiceOption => ({ id: label, label, value: { kind: 'chord', text: label } });
const chordExpected = (root: Pick<Note, 'letter' | 'acc'>, quality: ChordId): Expected => ({ kind: 'chord', root: pc({ ...root, oct: 4 }), quality });
/** Opção comum, escolhida pelo id. */
const plain = (o: string): ChoiceOption => ({ id: o, label: o });

// =====================================================================
export const EXERCISES: CatalogItem[] = [
  // ---------------- LEITURA ----------------
  {
    id: 'pauta-nota',
    objetos: ['notacao'], tarefas: ['ler'],
    primaryModule: 'theory', skillTags: ['notation.pitch_reading'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'clef.treble', 'clef.bass', 'staff.ledger_lines'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'material'],
    publicacao: LEGADO,
    settings: ctx => [CLEFS(ctx), EXT(ctx), ACC(ctx)], defaults: { claves: ['sol'], extensao: 'pauta', acidentes: false },
    make(s, ctx): Question {
      const clef = pickClef(s, ctx);
      const n = notaNaPauta(ctx, stepRange(clef, s.extensao), () => randAcc(s.acidentes));
      return {
        prompt: ctx.t('quiz.whatNote'), visual: { kind: 'staff', clef, columns: [[n]] },
        surface: { kind: 'letters', accidentals: !!s.acidentes }, expected: { kind: 'spelled', letter: n.letter, acc: n.acc },
        sound: { groups: [[midi(n)]] },
        reveal: noteName(n, ctx.naming) + n.oct,
      };
    },
  },
  {
    id: 'pauta-construir',
    objetos: ['notacao'], tarefas: ['escrever'],
    primaryModule: 'theory', skillTags: ['notation.pitch_writing'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'clef.treble', 'clef.bass', 'staff.ledger_lines'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'material'],
    publicacao: LEGADO,
    settings: ctx => [CLEFS(ctx), EXT(ctx), ACC(ctx)], defaults: { claves: ['sol'], extensao: 'pauta', acidentes: false },
    make(s, ctx) {
      const clef = pickClef(s, ctx);
      const n = notaNaPauta(ctx, stepRange(clef, s.extensao), () => randAcc(s.acidentes));
      return {
        prompt: ctx.t('quiz.writeNote', { note: `${noteName(n, ctx.naming)}${n.oct}` }), visual: { kind: 'text', text: '' },
        surface: { kind: 'staff', clef, accidentals: !!s.acidentes }, expected: { kind: 'spelled', letter: n.letter, acc: n.acc, oct: n.oct },
        sound: { groups: [[midi(n)]] },
        reveal: `${noteName(n, ctx.naming)}${n.oct}`,
      };
    },
  },
  {
    id: 'pauta-armadura',
    objetos: ['notacao'], tarefas: ['nomear'],
    primaryModule: 'theory', skillTags: ['notation.key_signature', 'theory.key_relations'],
    contentTags: ['key.major', 'key.minor', 'key.signatures', 'clef.treble', 'clef.bass'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: [],
    publicacao: LEGADO,
    settings: ctx => [CLEFS(ctx), { id: 'modo', label: ctx.t('settings.keyMode'), type: 'single', options: [{ id: 'maior', label: ctx.t('settings.major') }, { id: 'menor', label: ctx.t('settings.minor') }, { id: 'ambos', label: ctx.t('settings.both') }] },
      { id: 'max', label: ctx.t('settings.maxAccidentals'), type: 'single', options: [{ id: '2', label: '2', tier: 1 }, { id: '4', label: '4', tier: 2 }, { id: '7', label: '7', tier: 3 }] }],
    defaults: { claves: ['sol'], modo: 'maior', max: '4' },
    make(s, ctx) {
      const max = Number(s.max ?? 4);
      const minor = s.modo === 'menor' || (s.modo === 'ambos' && Math.random() < 0.5);
      const label = (f: number) => (minor ? ctx.t('theory.keyMinor', { note: noteName(relativeMinor(f), ctx.naming) }) : ctx.t('theory.keyMajor', { note: noteName(majorTonic(f), ctx.naming) }));
      const f = randInt(-max, max);
      const pool = Array.from({ length: 2 * max + 1 }, (_, i) => i - max);
      const opts = optionsWith(f, pool, Math.min(6, pool.length));
      return {
        prompt: ctx.t(minor ? 'quiz.whichKeyMinor' : 'quiz.whichKeyMajor'), visual: { kind: 'staff', clef: pickClef(s, ctx), fifths: f, columns: [] },
        surface: { kind: 'choices', options: opts.map(o => ({ id: String(o), label: label(o) })) }, expected: { kind: 'option', id: String(f) },
        reveal: label(f),
      };
    },
  },
  // ---------------- HARMONIA ----------------
  {
    id: 'pauta-intervalo',
    objetos: ['intervalos', 'notacao'], tarefas: ['ler'],
    primaryModule: 'theory', skillTags: ['theory.interval_naming', 'notation.pitch_reading'],
    contentTags: ['interval.simple', 'pitch.accidentals', 'clef.treble', 'clef.bass'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'material'],
    publicacao: LEGADO,
    settings: ctx => [CLEFS(ctx), { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: INTERVALS.map(i => ({ id: i.id, label: ivLabel(i.id, ctx), tier: i.tier })) },
      { id: 'forma', label: ctx.t('settings.form'), type: 'single', options: [{ id: 'melodico', label: ctx.t('settings.melodic') }, { id: 'harmonico', label: ctx.t('settings.harmonic') }] }],
    defaults: { claves: ['sol'], intervalos: ['m2', 'M2', 'm3', 'M3', 'J4', 'J5', 'm6', 'M6', 'J8'], forma: 'melodico' },
    make(s, ctx) {
      const clef = pickClef(s, ctx);
      const ids = arr(s.intervalos, ['M3']);
      const id = pick(ids);
      const iv = INTERVALS.find(i => i.id === id)!;
      const b = clefBottom(clef);
      let lower: Note, upper: Note;
      do {
        lower = notaNaPauta(ctx, [b - 1, b + 9 - (iv.num - 1)], () => (Math.random() < 0.25 ? pick([1, -1]) : 0));
        upper = transpose(lower, { num: iv.num, semis: semisFor(iv.num, iv.q) });
      } while (Math.abs(upper.acc) > 1);
      const columns = s.forma === 'harmonico' ? [[lower, upper]] : [[lower], [upper]];
      return {
        prompt: ctx.t('quiz.whatInterval'), visual: { kind: 'staff', clef, columns },
        surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: ivLabel(i, ctx) })) }, expected: { kind: 'option', id },
        sound: { groups: s.forma === 'harmonico' ? [[midi(lower), midi(upper)]] : [[midi(lower)], [midi(upper)]] },
        reveal: ivLabel(id, ctx),
      };
    },
  },
  {
    id: 'pauta-acorde',
    objetos: ['acordes', 'notacao'], tarefas: ['ler'],
    primaryModule: 'theory', skillTags: ['theory.chord_identification', 'notation.pitch_reading'],
    contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions', 'clef.treble', 'clef.bass'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'material'],
    publicacao: LEGADO,
    settings: ctx => [CLEFS(ctx), { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', options: chordTypes(ctx.t, ALL_CHORDS) },
      { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle' }],
    defaults: { claves: ['sol'], tipos: ['maior', 'menor', 'dim', 'aum'], inversoes: false },
    presentation: { arp: 0.08 },
    make(s, ctx) {
      const clef = pickClef(s, ctx);
      const types = arr(s.tipos, ['maior']) as ChordId[];
      const type = pick(types);
      const root = { ...ROOTS[pcPermitido(ctx)], oct: clef === 'sol' ? 4 : 2 };
      const inv = s.inversoes ? randInt(0, CHORDS[type].degs.length - 1) : 0;
      const notes = buildChord(root, type, inv);
      const sym = chordSymbol(root, type, ctx.conv);
      const pool = [...types.map(t => chordSymbol(root, t, ctx.conv)), ...shuffle(ROOTS).slice(0, 6).map(r => chordSymbol(r, type, ctx.conv))];
      const opts = optionsWith(sym, [...new Set(pool)], 6);
      return {
        prompt: ctx.t('quiz.whatChord'), visual: { kind: 'staff', clef, columns: [notes] },
        surface: { kind: 'choices', options: opts.map(chordOption) }, expected: chordExpected(root, type),
        sound: { groups: [notes.map(midi)] }, reveal: ctx.t('quiz.chordReveal', { symbol: sym, name: chordName(ctx.t, type).toLowerCase() }),
      };
    },
  },
  {
    id: 'pauta-escala',
    objetos: ['escalas', 'notacao'], tarefas: ['ler'],
    primaryModule: 'theory', skillTags: ['theory.scale_identification', 'notation.pitch_reading'],
    contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues', 'clef.treble', 'clef.bass'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'material'],
    publicacao: LEGADO,
    settings: ctx => [CLEFS(ctx), { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) }],
    defaults: { claves: ['sol'], tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] },
    presentation: { gap: 0.32 },
    make(s, ctx) {
      const clef = pickClef(s, ctx);
      const types = arr(s.tipos, ['maior']) as ScaleId[];
      const type = pick(types);
      const tonic = { ...ROOTS[pcPermitido(ctx)], oct: clef === 'sol' ? 4 : 2 };
      const notes = [...buildScale(tonic, type), { ...tonic, oct: tonic.oct + 1 }];
      const name = (t: Note, id: ScaleId) => ctx.t('quiz.scaleOf', { note: noteName(t, ctx.naming), scale: ctx.t(`theory.scalesInline.${id}` as MessageKey) });
      const pool = [...types.map(t => name(tonic, t)), ...shuffle(ROOTS).slice(0, 4).map(r => name(r, type))];
      const correct = name(tonic, type);
      return {
        prompt: ctx.t('quiz.whatScale'), visual: { kind: 'staff', clef, columns: notes.map(n => [n]) },
        surface: { kind: 'choices', options: optionsWith(correct, [...new Set(pool)], 6).map(plain), wide: true }, expected: { kind: 'option', id: correct },
        sound: { groups: notes.map(n => [midi(n)]) }, reveal: correct,
      };
    },
  },
  {
    id: 'quiz-teoria',
    objetos: ['escalas', 'acordes', 'harmonia', 'notacao'], tarefas: ['nomear'],
    primaryModule: 'theory', skillTags: ['theory.scale_degrees', 'theory.modes', 'theory.chord_construction', 'theory.harmonic_field', 'theory.key_relations', 'theory.reharmonization'],
    contentTags: ['scale.major', 'scale.modes', 'chord.triads', 'chord.sevenths', 'harmony.diatonic_field', 'harmony.tritone_sub', 'key.major', 'key.minor', 'key.signatures'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: [],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'temas', label: ctx.t('settings.topics'), type: 'multi', options: [
      { id: 'graus', label: ctx.t('settings.topicDegrees') }, { id: 'modos', label: ctx.t('settings.topicModes') }, { id: 'acordes', label: ctx.t('settings.topicChords') },
      { id: 'campo', label: ctx.t('settings.topicField') }, { id: 'tonalidades', label: ctx.t('settings.topicKeys') }, { id: 'sub5', label: ctx.t('settings.topicSub5') }] }],
    defaults: { temas: ['graus', 'modos', 'acordes', 'campo', 'tonalidades'] },
    make(s, ctx) {
      return theoryQuestion(pick(arr(s.temas, ['graus'])), ctx);
    },
  },
  // ---------------- MAPEAMENTO: teclado ----------------
  {
    id: 'teclado-nota',
    objetos: ['notas'], tarefas: ['nomear'],
    primaryModule: 'theory', skillTags: ['keyboard.note_naming'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.keyboard'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range', 'material'],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle' }, { id: 'oitavas', label: ctx.t('settings.octaves'), type: 'single', options: [{ id: '1', label: '1' }, { id: '2', label: '2' }] }],
    defaults: { pretas: true, oitavas: '2' },
    make(s, ctx) {
      const { lo, hi } = regiao(ctx, { lo: 48, hi: s.oitavas === '1' ? 59 : 71 });
      const permitidas = pcsPermitidas(ctx).filter(p => s.pretas || ![1, 3, 6, 8, 10].includes(p));
      let m: number;
      do m = randInt(lo, hi); while (!permitidas.includes(m % 12));
      return {
        prompt: ctx.t('quiz.whatKey'), visual: { kind: 'keyboard', lo, hi, marks: [m] },
        surface: { kind: 'choices', options: pcOptions(ctx.naming).filter(o => s.pretas || ![1, 3, 6, 8, 10].includes(Number(o.id))) }, expected: { kind: 'pitchClass', pc: m % 12 },
        sound: { groups: [[m]] }, reveal: pcName(m, ctx.naming),
      };
    },
  },
  {
    id: 'teclado-tecla',
    objetos: ['notas'], tarefas: ['tocar'],
    primaryModule: 'theory', skillTags: ['keyboard.note_finding'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.keyboard'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range', 'material'],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle' }], defaults: { pretas: true },
    make(s, ctx) {
      const permitidas = pcsPermitidas(ctx).filter(x => s.pretas || ![1, 3, 6, 8, 10].includes(x));
      const p = pick(permitidas);
      const soa = alturaDoPc(ctx, p, { lo: 48, hi: 71 });
      const n = spellPc(p);
      return {
        prompt: ctx.t('quiz.tapNote', { note: noteName(n, ctx.naming) }), visual: { kind: 'text', text: '' },
        surface: { kind: 'keyboard', lo: 48, hi: 71 }, expected: { kind: 'pitchClass', pc: p }, sound: { groups: [[soa]] }, reveal: noteName(n, ctx.naming),
      };
    },
  },
  {
    id: 'teclado-acorde',
    objetos: ['acordes'], tarefas: ['nomear'],
    primaryModule: 'theory', skillTags: ['keyboard.chord_shapes', 'theory.chord_identification'],
    contentTags: ['chord.triads', 'chord.sevenths', 'instrument.keyboard'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range', 'material'],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'tipos', label: ctx.t('settings.types'), type: 'multi', options: chordTypes(ctx.t, ['maior', 'menor', 'dim', 'aum', '7M', '7', 'm7', 'm7b5']) }],
    defaults: { tipos: ['maior', 'menor', '7', 'm7'] },
    make(s, ctx) {
      const types = arr(s.tipos, ['maior']) as ChordId[];
      const type = pick(types);
      const pcRaiz = pcPermitido(ctx);
      const base = alturaDoPc(ctx, pcRaiz, { lo: 48, hi: 72 });
      const root = { ...ROOTS[mod(pcRaiz, 12)], oct: Math.floor(base / 12) - 1 };
      const notes = buildChord(root, type).map(midi).map(m => (m > 76 ? m - 12 : m));
      const sym = chordSymbol(root, type, ctx.conv);
      const pool = [...types.map(t => chordSymbol(root, t, ctx.conv)), ...shuffle(ROOTS).slice(0, 6).map(r => chordSymbol(r, type, ctx.conv))];
      return {
        prompt: ctx.t('quiz.whatChord'), visual: { kind: 'keyboard', lo: 48, hi: 83, marks: notes },
        surface: { kind: 'choices', options: optionsWith(sym, [...new Set(pool)], 6).map(chordOption) }, expected: chordExpected(root, type),
        sound: { groups: [notes] }, reveal: sym,
      };
    },
  },
  // ---------------- MAPEAMENTO: braço ----------------
  {
    id: 'braco-nota',
    objetos: ['notas'], tarefas: ['nomear'],
    primaryModule: 'theory', skillTags: ['fretboard.note_naming'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.guitar', 'instrument.bass'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'material'],
    publicacao: LEGADO,
    settings: ctx => [INST(ctx), FRETS(ctx)], defaults: { instrumento: 'auto', casas: '0-5' },
    make(s, ctx) {
      const tuning = tuningOf(s, ctx);
      const [from, to] = fretRange(s);
      const { str, f, m } = casaPermitida(tuning, from, to, ctx);
      return {
        prompt: ctx.t('quiz.whatNote'), visual: { kind: 'fretboard', tuning, from, to, marks: [{ s: str, f }] },
        surface: { kind: 'choices', options: pcOptions(ctx.naming) }, expected: { kind: 'pitchClass', pc: m % 12 },
        sound: { groups: [[m]], instrument: tuning.length === 4 ? 'baixo' : 'violao' }, reveal: pcName(m, ctx.naming),
      };
    },
  },
  {
    id: 'braco-ache',
    objetos: ['notas'], tarefas: ['tocar'],
    primaryModule: 'theory', skillTags: ['fretboard.note_finding'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.guitar', 'instrument.bass'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'material'],
    publicacao: LEGADO,
    settings: ctx => [INST(ctx), FRETS(ctx)], defaults: { instrumento: 'auto', casas: '0-12' },
    make(s, ctx) {
      const tuning = tuningOf(s, ctx);
      const [from, to] = fretRange(s);
      const { str, f, m } = casaPermitida(tuning, from, to, ctx);
      const open = pcName(tuning[str], ctx.naming, false);
      // no violão as duas cordas Mi se distinguem por grave e aguda
      const string = tuning.length === 6 && str === 0 ? ctx.t('quiz.lowString', { note: open }) : tuning.length === 6 && str === 5 ? ctx.t('quiz.highString', { note: open }) : open;
      return {
        prompt: ctx.t('quiz.tapOnString', { note: pcName(m, ctx.naming, false), string }), visual: { kind: 'text', text: '' },
        surface: { kind: 'fretboard', tuning, from, to, onlyString: str }, expected: { kind: 'pitchClass', pc: m % 12 },
        sound: { groups: [[m]], instrument: tuning.length === 4 ? 'baixo' : 'violao' }, reveal: ctx.t('quiz.atFret', { note: pcName(m, ctx.naming), fret: f }),
      };
    },
  },
  {
    id: 'braco-intervalo',
    objetos: ['intervalos', 'notas'], tarefas: ['nomear'],
    primaryModule: 'theory', skillTags: ['fretboard.interval_shapes'],
    contentTags: ['interval.simple', 'instrument.guitar', 'instrument.bass'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: [],
    publicacao: LEGADO,
    settings: ctx => [INST(ctx)], defaults: { instrumento: 'auto' },
    make(s, ctx) {
      const tuning = tuningOf(s, ctx);
      // Enumera os pares tocáveis dentro da região em vez de passear no aleatório. Além de ler a
      // cascata (F2-3), conserta a distribuição descontrolada que o passeio produzia — alguns
      // intervalos apareciam muito mais que outros, sem a pessoa poder escolher.
      // O braço inteiro, sem interseccionar com a região em MIDI — ver `casaPermitida`: a região
      // esmagava o alcance e sobrava um par só.
      const faixa = { lo: tuning[0], hi: tuning[tuning.length - 1] + 9 };
      const pares: { s1: number; f1: number; s2: number; f2: number; d: number }[] = [];
      for (let a = 0; a < tuning.length - 1; a++) {
        for (let fa = 1; fa <= 6; fa++) {
          const ma = tuning[a] + fa;
          if (ma < faixa.lo || ma > faixa.hi) continue;
          for (let b = a; b < Math.min(tuning.length, a + 3); b++) {
            for (let fb = Math.max(0, fa - 2); fb <= fa + 4; fb++) {
              const d0 = tuning[b] + fb - ma;
              if (d0 >= 1 && d0 <= 12) pares.push({ s1: a, f1: fa, s2: b, f2: fb, d: d0 });
            }
          }
        }
      }
      const par = pares.length ? pick(pares) : { s1: 0, f1: 1, s2: 1, f2: 1, d: tuning[1] + 1 - (tuning[0] + 1) };
      const { s1, f1, s2, f2, d } = par;
      const lo = tuning[s1] + f1;
      return {
        prompt: ctx.t('quiz.whatInterval'), visual: { kind: 'fretboard', tuning, from: 0, to: 9, marks: [{ s: s1, f: f1, label: '1' }, { s: s2, f: f2, color: 'var(--ve)' }] },
        surface: { kind: 'choices', options: semiOptions(ctx) }, expected: { kind: 'option', id: String(d) },
        sound: { groups: [[lo], [lo + d]], instrument: tuning.length === 4 ? 'baixo' : 'violao' }, reveal: semitoneName(d, ctx.conv),
      };
    },
  },
  {
    id: 'acorde-visual',
    objetos: ['acordes'], tarefas: ['nomear'],
    primaryModule: 'theory', skillTags: ['fretboard.chord_shapes', 'keyboard.chord_shapes', 'theory.chord_identification'],
    contentTags: ['chord.triads', 'chord.sevenths', 'chord.open_shapes', 'chord.barre_shapes', 'instrument.guitar', 'instrument.keyboard'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: [],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'onde', label: ctx.t('settings.instrument'), type: 'single', options: [{ id: 'violao', label: ctx.t('settings.guitar') }, { id: 'piano', label: ctx.t('settings.piano') }],
        present: v => (v === 'violao' ? { arp: 0.04 } : {}) },
      { id: 'formas', label: ctx.t('settings.shapes'), type: 'single', options: [{ id: 'abertos', label: ctx.t('settings.openChords') }, { id: 'pestana', label: ctx.t('settings.barreChords') }, { id: 'todos', label: ctx.t('settings.all') }] }],
    defaults: { onde: 'violao', formas: 'abertos' },
    make(s, ctx) {
      return s.onde === 'piano' ? pianoChordQuestion(ctx) : guitarChordQuestion(String(s.formas ?? 'abertos'), ctx);
    },
  },
  // ---------------- OUVIDO ----------------
  {
    id: 'ouvido-tecla',
    objetos: ['notas'], tarefas: ['ouvir', 'tocar'],
    primaryModule: 'perception.melodic', skillTags: ['ear.pitch_identification', 'keyboard.note_finding'],
    contentTags: ['pitch.naturals', 'pitch.accidentals'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range', 'material'],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'referencia', label: ctx.t('settings.reference', { note: noteName(note(0), ctx.naming) }), type: 'toggle' }, { id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle' }],
    defaults: { referencia: true, pretas: false },
    presentation: { gap: 0.9 },
    make(s, ctx): Question {
      const permitidas = pcsPermitidas(ctx).filter(x => s.pretas || ![1, 3, 6, 8, 10].includes(x));
      const p = pick(permitidas);
      const m = alturaDoPc(ctx, p, { lo: 48, hi: 83 });
      return {
        prompt: s.referencia ? ctx.t('quiz.earNoteRef', { note: noteName(note(0), ctx.naming) }) : ctx.t('quiz.earNote'), visual: { kind: 'ear' },
        surface: { kind: 'keyboard', lo: 60, hi: 71 }, expected: { kind: 'pitchClass', pc: p },
        sound: { groups: s.referencia ? [[60], [m]] : [[m]] }, autoplay: true,
        reveal: pcName(m, ctx.naming),
      };
    },
  },
  {
    id: 'ouvido-intervalo',
    objetos: ['intervalos'], tarefas: ['ouvir'],
    primaryModule: 'perception.melodic', skillTags: ['ear.interval_identification'],
    contentTags: ['interval.simple'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range', 'material'],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: semiOptions(ctx).map(o => ({ ...o, tier: SEMI_TIER[Number(o.id)] })) },
      { id: 'direcao', label: ctx.t('settings.direction'), type: 'single', options: [{ id: 'sobe', label: ctx.t('settings.up') }, { id: 'desce', label: ctx.t('settings.down') }, { id: 'juntas', label: ctx.t('settings.together') }, { id: 'misto', label: ctx.t('settings.mixed') }] }],
    defaults: { intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' },
    make(s, ctx) {
      const ids = arr(s.intervalos, ['4', '7']);
      const d = Number(pick(ids));
      const base = alturaNaRegiao(ctx, { lo: 52, hi: 67 });
      const dir = s.direcao === 'misto' ? pick(['sobe', 'desce', 'juntas']) : s.direcao;
      const groups = dir === 'juntas' ? [[base, base + d]] : dir === 'desce' ? [[base + d], [base]] : [[base], [base + d]];
      return {
        prompt: ctx.t('quiz.earInterval'), visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
        surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: semitoneName(Number(i), ctx.conv) })) }, expected: { kind: 'option', id: String(d) },
        sound: { groups }, autoplay: true, reveal: semitoneName(d, ctx.conv),
      };
    },
  },
  {
    id: 'ouvido-acorde',
    objetos: ['acordes'], tarefas: ['ouvir'],
    primaryModule: 'perception.harmonic', skillTags: ['ear.chord_quality'],
    contentTags: ['chord.triads', 'chord.sevenths'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range'],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'tipos', label: ctx.t('settings.types'), type: 'multi', options: chordTypes(ctx.t, ALL_CHORDS) },
      { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true, present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
      { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.5, max: 4, step: 0.1, format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) }],
    defaults: { tipos: ['maior', 'menor'], arpejo: true, duracao: 2 },
    presets: [
      { id: 'maior-menor', nome: 'presets.maiorMenor', settings: { tipos: ['maior', 'menor'] } },
      { id: 'triades', nome: 'presets.triades', settings: { tipos: ['maior', 'menor', 'aum', 'dim'] } },
      { id: 'tetrades', nome: 'presets.tetrades', settings: { tipos: ['7M', '7', 'm7', 'm7b5', 'dim7'] } },
      { id: 'suspensos', nome: 'presets.suspensos', settings: { tipos: ['maior', 'menor', 'sus2', 'sus4'] } },
      { id: 'tudo', nome: 'presets.tudo', settings: { tipos: ALL_CHORDS } },
    ],
    presentation: { gap: 0.45 },
    make(s, ctx): Question {
      const types = arr(s.tipos, ['maior', 'menor']) as ChordId[];
      const type = pick(types);
      const root = tonicaNaRegiao(ctx, { lo: 53, hi: 64 });
      const ms = CHORDS[type].degs.map(([, semi]) => root + semi);
      return {
        prompt: ctx.t('quiz.earChord'), visual: { kind: 'ear' },
        surface: { kind: 'choices', options: chordTypes(ctx.t, types) }, expected: { kind: 'option', id: type },
        sound: { groups: [ms] }, autoplay: true, reveal: chordName(ctx.t, type),
      };
    },
  },
  {
    id: 'ouvido-escala',
    objetos: ['escalas'], tarefas: ['ouvir'],
    primaryModule: 'perception.melodic', skillTags: ['ear.scale_quality'],
    contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range'],
    publicacao: LEGADO,
    settings: ctx => [
      { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
      DIRECAO(ctx),
    ],
    defaults: { tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'sobe' },
    presentation: { gap: 0.3 },
    // As duas melódicas são IDÊNTICAS subindo (decisão 70). Com as duas marcadas e direção só
    // ascendente, a pergunta é fisicamente impossível de responder: é o mesmo áudio. Recusar é o
    // que a decisão 13 manda — item ambíguo não pode gerar "erro do usuário".
    problema(s, ctx) {
      const types = arr(s.tipos, []) as ScaleId[];
      const asDuas = types.includes('menor-melodica') && types.includes('menor-melodica-jazz');
      return asDuas && (s.direcao ?? 'sobe') === 'sobe' ? ctx.t('player.sameAscending') : null;
    },
    make(s, ctx) {
      const types = arr(s.tipos, ['maior', 'menor']) as ScaleId[];
      const type = pick(types);
      const tonic = tonicaNaRegiao(ctx, { lo: 55, hi: 62 });
      const ms = scaleSound(tonic, type, s.direcao);
      return {
        prompt: ctx.t('quiz.whatScale'), visual: { kind: 'ear' },
        surface: { kind: 'choices', options: types.map(t => ({ id: t, label: scaleName(ctx.t, t) })), wide: true }, expected: { kind: 'option', id: type },
        sound: { groups: ms.map(m => [m]) }, autoplay: true, reveal: scaleName(ctx.t, type),
      };
    },
  },
  {
    id: 'ouvido-celulas',
    objetos: ['escalas', 'melodia'], tarefas: ['ouvir'],
    primaryModule: 'perception.melodic', skillTags: ['ear.scale_degrees'],
    contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: ['key', 'range'],
    publicacao: LEGADO,
    // Era pentatônico-only sem razão (decisão 54): a célula é um desenho de graus, e graus existem
    // em qualquer escala. Agora aceita todas, inclusive as duas melódicas.
    settings: ctx => [{ id: 'escala', label: ctx.t('settings.scale'), type: 'single', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
      { id: 'tamanho', label: ctx.t('settings.cellSize'), type: 'single', options: [{ id: '3', label: '3' }, { id: '4', label: '4' }] }],
    defaults: { escala: 'penta-maior', tamanho: '3' },
    presentation: { gap: 0.55},
    make(s, ctx) {
      const id = (ALL_SCALES.includes(s.escala as ScaleId) ? s.escala : 'penta-maior') as ScaleId;
      const degs = scaleDegreeLabels(id);
      const semis = [...scaleDegs(id).map(([, semi]) => semi), 12];
      const top = semis.length - 1;
      const size = Number(s.tamanho ?? 3);
      // O que define uma célula: graus vizinhos distam 1 ou 2 posições, e **nunca se repetem**.
      // Isto é uma só regra, e ela vale igual para a resposta certa e para os distratores — foi
      // onde eu errei na primeira tentativa desta tarefa: consertei a certa e recriei o bug nos
      // distratores, com 30% deles saindo `6 6 6`. Distrator que não é célula válida entrega a
      // resposta.
      const valida = (x: number[]) => x.every((v, k) => k === 0 || [1, 2].includes(Math.abs(v - x[k - 1])));

      // BUG 1 (consertado): o gerador antigo era `clamp(anterior + pick([-2,-1,1,2]), 0, top)`, e
      // nas bordas o clamp devolvia o MESMO grau — saía `5 5 4`. Agora o passo é sorteado DENTRO
      // do que cabe, em vez de cortado depois.
      const cell = () => {
        const out: number[] = [randInt(0, top)];
        while (out.length < size) {
          const de = out[out.length - 1];
          const cabem = [-2, -1, 1, 2].filter(d => de + d >= 0 && de + d <= top);
          out.push(de + pick(cabem));
        }
        return out;
      };
      const c = cell();
      const key = (x: number[]) => x.map(i => degs[i]).join(' ');

      // BUG 2 (consertado): os distratores eram células sorteadas do zero e diferiam demais. A
      // visão pede o contrário — "distratores que diferem em apenas uma nota".
      //
      // São ENUMERADOS, não sorteados: todas as células válidas que trocam uma posição da certa.
      // Enumerar aqui é o certo porque o espaço é minúsculo (no máximo 8 posições × 4 notas), e
      // sortear com tentativa e erro é o que produzia os casos inválidos.
      const umaNotaDiferente = (base: number[]) => {
        const out: number[][] = [];
        for (let i = 0; i < base.length; i++) {
          for (let v = 0; v <= top; v++) {
            if (v === base[i]) continue;
            const cand = base.slice(); cand[i] = v;
            if (valida(cand)) out.push(cand);
          }
        }
        return out;
      };
      const others = new Set<string>();
      for (const v of shuffle(umaNotaDiferente(c))) {
        if (others.size >= 3) break;
        if (key(v) !== key(c)) others.add(key(v));
      }
      // Célula encurralada (bordas estreitas): abre para duas notas de diferença, ainda válidas.
      // Melhor um distrator a duas notas do que três opções em vez de quatro.
      if (others.size < 3) {
        for (const base of shuffle(umaNotaDiferente(c))) {
          for (const v of shuffle(umaNotaDiferente(base))) {
            if (others.size >= 3) break;
            if (key(v) !== key(c)) others.add(key(v));
          }
          if (others.size >= 3) break;
        }
      }
      const tonic = tonicaNaRegiao(ctx, { lo: 57, hi: 64 });
      const terca = semis.find(x => x === 3 || x === 4) ?? 4;
      const triad = [tonic, tonic + terca, tonic + 7];
      return {
        prompt: ctx.t('quiz.cells'), visual: { kind: 'ear', hint: ctx.t('quiz.cellsHint') },
        surface: { kind: 'choices', options: shuffle([key(c), ...others]).map(plain) }, expected: { kind: 'option', id: key(c) },
        sound: { groups: [triad, ...c.map(i => [tonic + semis[i]])] }, autoplay: true, reveal: key(c),
      };
    },
  },
  // ---------------- RITMO ----------------
  {
    id: 'ritmo-ouvido',
    objetos: ['ritmo'], tarefas: ['ouvir'],
    primaryModule: 'perception.rhythmic', skillTags: ['ear.rhythm_recognition', 'notation.rhythm_reading'],
    contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.rests', 'rhythm.syncopation', 'rhythm.triplets'],
    kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
    respeita: [],
    publicacao: LEGADO,
    settings: ctx => [{ id: 'nivel', label: ctx.t('settings.rhythmValues'), type: 'single', options: RHYTHM_PRESETS.map(p => ({ id: p.id, label: ctx.t(`theory.rhythmPresets.${p.id}` as MessageKey) })) }],
    defaults: { nivel: 'duas' },
    presentation: { bpm: 84 },
    make(s, ctx) {
      const cells = (RHYTHM_PRESETS.find(p => p.id === s.nivel) ?? RHYTHM_PRESETS[0]).cells;
      const bar = randomBars(cells, 1);
      const key = (b: CellId[][]) => b[0].join('|');
      const others = new Map<string, CellId[][]>();
      for (let tries = 0; others.size < 3 && tries < 60; tries++) { const o = randomBars(cells, 1); if (key(o) !== key(bar)) others.set(key(o), o); }
      const opts = shuffle([{ id: key(bar), label: '', rhythm: bar }, ...[...others].map(([k, b]) => ({ id: k, label: '', rhythm: b }))]);
      const onsets: number[] = [];
      let t = 0;
      bar[0].forEach(c => CELLS[c].events.forEach(ev => { if (!ev.rest) onsets.push(t); t += ev.d; }));
      return {
        prompt: ctx.t('quiz.rhythm'), visual: { kind: 'ear', hint: ctx.t('quiz.rhythmHint') },
        surface: { kind: 'choices', options: opts, wide: true }, expected: { kind: 'option', id: key(bar) },
        sound: { groups: [], drums: onsets }, autoplay: true, reveal: ctx.t('quiz.rhythmReveal'),
      };
    },
  },
];

export const exerciseById = Object.fromEntries(EXERCISES.map(e => [e.id, e])) as Record<string, CatalogItem>;

// =====================================================================
// Quiz de teoria: perguntas geradas
// =====================================================================
// Cada frase é uma mensagem com lacunas (quiz.* em src/i18n); o que muda de forma conforme o
// idioma — ordinais, nomes de intervalo, plural de acidentes — vem de src/theory/names.ts.
function theoryQuestion(topic: string, ctx: Ctx): Question {
  const { t, conv } = ctx;
  const nm = (n: Pick<Note, 'letter' | 'acc'>) => noteName(n, ctx.naming);
  const sym = (root: Pick<Note, 'letter' | 'acc'>, id: ChordId) => chordSymbol(root, id, conv);
  const major = (n: Pick<Note, 'letter' | 'acc'>) => t('theory.keyMajor', { note: nm(n) });
  const modeName = (id: ScaleId) => t(`theory.modes.${id}` as MessageKey);
  const keyPool = Array.from({ length: 13 }, (_, i) => i - 6);
  const text = (q: string, opts: string[], correct: string, reveal = correct, wide = false): Question => ({
    prompt: q, visual: { kind: 'text', text: q }, surface: { kind: 'choices', options: opts.map(plain), wide }, expected: { kind: 'option', id: correct }, reveal,
  });
  // respostas que são cifras: conferem pela fundamental e pela qualidade, não pelo texto
  const chordText = (q: string, opts: string[], expected: Expected, reveal: string): Question => ({
    prompt: q, visual: { kind: 'text', text: q }, surface: { kind: 'choices', options: opts.map(chordOption) }, expected, reveal,
  });
  const notePool = (exclude: string) => ROOTS.map(r => nm(r)).filter(x => x !== exclude);

  if (topic === 'graus') {
    const f = pick(keyPool);
    const tonic = majorTonic(f);
    const scale = buildScale(tonic, 'maior');
    if (Math.random() < 0.5) {
      const d = randInt(2, 7);
      const ans = nm(scale[d - 1]);
      return text(t('quiz.degreeOf', { ord: ordinal(d, conv), key: major(tonic) }), optionsWith(ans, notePool(ans), 6), ans);
    }
    const d = randInt(2, 7);
    const degrees = [1, 2, 3, 4, 5, 6, 7].map(n => ordinal(n, conv));
    return text(t('quiz.whichDegree', { note: nm(scale[d - 1]), key: major(tonic) }), degrees, ordinal(d, conv));
  }
  if (topic === 'modos') {
    if (Math.random() < 0.5) {
      const mode = pick(MODES);
      const tonic = pick(ROOTS);
      const d = pick([2, 3, 6, 7]);
      const ans = nm(buildScale(tonic, mode)[d - 1]);
      // as distratoras mais traiçoeiras: a versão maior e a menor do mesmo grau
      const maj = nm(transpose(tonic, { num: d, semis: semisFor(d, 'M') }));
      const min = nm(transpose(tonic, { num: d, semis: semisFor(d, 'm') }));
      const pool = [...new Set([maj, min, ...shuffle(notePool(ans))])].filter(x => x !== ans).slice(0, 5);
      return text(t('quiz.modeDegree', { ord: ordinal(d, conv, 'f'), note: nm(tonic), mode: modeName(mode) }), shuffle([ans, ...pool]), ans);
    }
    const label = (id: ScaleId, i: number) => {
      const [num, semi] = SCALES[id].degs[i];
      const diff = semi - SCALES.maior.degs[i][1];
      return (diff < 0 ? '♭' : diff > 0 ? '♯' : '') + num;
    };
    const pairs: [ScaleId, ScaleId][] = [];
    MODES.forEach(a => MODES.forEach(b => {
      if (a === b) return;
      const diffs = SCALES[a].degs.filter((d, i) => d[1] !== SCALES[b].degs[i][1]);
      if (diffs.length === 1) pairs.push([a, b]);
    }));
    const [a, b] = pick(pairs);
    const i = SCALES[a].degs.findIndex((d, k) => d[1] !== SCALES[b].degs[k][1]);
    const ans = label(a, i);
    const pool = ['♭2', '2', '♭3', '3', '4', '♯4', '♭5', '5', '♭6', '6', '♭7', '7'];
    return text(t('quiz.modeDiff', { a: modeName(a), b: modeName(b) }), optionsWith(ans, pool, 5), ans);
  }
  if (topic === 'acordes') {
    const root = pick(ROOTS);
    const type = pick(['maior', 'menor', '7', 'm7', '7M', 'm7b5', 'dim'] as ChordId[]);
    const notes = buildChord(root, type);
    if (Math.random() < 0.4) {
      const third = nm(notes[1]);
      return text(t('quiz.thirdOf', { chord: sym(root, type) }), optionsWith(third, notePool(third), 6), third);
    }
    const fmt = (ns: Note[]) => ns.map(nm).join(' – ');
    const ans = fmt(notes);
    // Para cada nota (menos a fundamental), tenta as duas direções de acidente; em acordes com
    // acidentes extremos (ex.: b5 soletrado como dobrado-bemol) só uma direção é válida, então
    // sortear a direção ao acaso às vezes não achava nenhuma em 20 tentativas (teste instável).
    const wrongs = new Set<string>();
    for (const i of shuffle([...notes.keys()].slice(1))) {
      if (wrongs.size >= 3) break;
      for (const d of shuffle([1, -1])) {
        const alt = notes.map((n, j) => (j === i ? { ...n, acc: n.acc + d } : n));
        if (alt.every(n => Math.abs(n.acc) <= 1)) { wrongs.add(fmt(alt)); break; }
      }
    }
    return text(t('quiz.chordNotes', { chord: sym(root, type) }), shuffle([ans, ...wrongs]), ans, ans, true);
  }
  if (topic === 'campo') {
    const f = pick(keyPool);
    const tonic = majorTonic(f);
    const field = harmonicField(tonic, 'maior', Math.random() < 0.5, conv);
    const d = pick(field);
    const pool = [...field.map(x => x.symbol), ...field.map(x => sym(x.root, x.chord === 'maior' ? 'menor' : x.chord === 'menor' ? 'maior' : '7'))];
    return chordText(t('quiz.fieldDegree', { key: major(tonic), roman: d.roman }), optionsWith(d.symbol, [...new Set(pool)], 6), chordExpected(d.root, d.chord), d.symbol);
  }
  if (topic === 'sub5') {
    const f = pick(keyPool);
    const tonic = majorTonic(f);
    const v = transpose(tonic, { num: 5, semis: 7 });
    const sub = transpose(tonic, { num: 2, semis: 1 });
    const ans = sym(sub, '7');
    const pool = [sym(v, '7'), sym(transpose(tonic, { num: 4, semis: 5 }), '7'), sym(transpose(tonic, { num: 7, semis: 10 }), '7'), sym(transpose(tonic, { num: 6, semis: 8 }), '7'), sym(transpose(tonic, { num: 3, semis: 3 }), '7')];
    return chordText(t('quiz.sub5', { chord: sym(tonic, 'maior') }), optionsWith(ans, pool, 5), chordExpected(sub, '7'), t('quiz.sub5Reveal', { answer: ans, dominant: sym(v, '7') }));
  }
  // tonalidades
  const f = pick(keyPool.filter(x => x !== 0));
  const tonic = majorTonic(f);
  if (Math.random() < 0.5) {
    const ans = nm(relativeMinor(f));
    return text(t('quiz.relativeOf', { key: major(tonic) }), optionsWith(ans, keyPool.map(k => nm(relativeMinor(k))), 6), ans, t('theory.keyMinor', { note: ans }));
  }
  const accLabel = (k: number) => accidentalCount(k, conv);
  return text(t('quiz.accidentalsOf', { key: major(tonic) }), optionsWith(accLabel(f), keyPool.map(accLabel), 6), accLabel(f));
}

// ---------------- acordes desenhados ----------------
type Shape = (number | null)[];
const OPEN: { root: Note; type: ChordId; frets: Shape }[] = [
  { root: note(0), type: 'maior', frets: [null, 3, 2, 0, 1, 0] }, { root: note(4), type: 'maior', frets: [3, 2, 0, 0, 0, 3] },
  { root: note(1), type: 'maior', frets: [null, null, 0, 2, 3, 2] }, { root: note(5), type: 'maior', frets: [null, 0, 2, 2, 2, 0] },
  { root: note(2), type: 'maior', frets: [0, 2, 2, 1, 0, 0] }, { root: note(5), type: 'menor', frets: [null, 0, 2, 2, 1, 0] },
  { root: note(2), type: 'menor', frets: [0, 2, 2, 0, 0, 0] }, { root: note(1), type: 'menor', frets: [null, null, 0, 2, 3, 1] },
  { root: note(2), type: '7', frets: [0, 2, 0, 1, 0, 0] }, { root: note(5), type: '7', frets: [null, 0, 2, 0, 2, 0] },
  { root: note(1), type: '7', frets: [null, null, 0, 2, 1, 2] }, { root: note(5), type: 'm7', frets: [null, 0, 2, 0, 1, 0] },
  { root: note(2), type: 'm7', frets: [0, 2, 0, 0, 0, 0] }, { root: note(0), type: '7M', frets: [null, 3, 2, 0, 0, 0] },
  { root: note(0), type: '7', frets: [null, 3, 2, 3, 1, 0] }, { root: note(1), type: '7M', frets: [null, null, 0, 2, 2, 2] },
];
const E_FORM: Partial<Record<ChordId, (r: number) => Shape>> = {
  maior: r => [r, r + 2, r + 2, r + 1, r, r], menor: r => [r, r + 2, r + 2, r, r, r], '7': r => [r, r + 2, r, r + 1, r, r],
  m7: r => [r, r + 2, r, r, r, r], '7M': r => [r, null, r + 1, r + 1, r, null],
};
const A_FORM: Partial<Record<ChordId, (r: number) => Shape>> = {
  maior: r => [null, r, r + 2, r + 2, r + 2, r], menor: r => [null, r, r + 2, r + 2, r + 1, r], '7': r => [null, r, r + 2, r, r + 2, r],
  m7: r => [null, r, r + 2, r, r + 1, r], '7M': r => [null, r, r + 2, r + 1, r + 2, r],
};
function chordOptions(root: Note, type: ChordId, conv: Ctx['conv']) {
  const sym = chordSymbol(root, type, conv);
  const types: ChordId[] = ['maior', 'menor', '7', 'm7', '7M'];
  const pool = [...types.map(t => chordSymbol(root, t, conv)), ...shuffle(ROOTS).slice(0, 5).map(r => chordSymbol(r, type, conv))];
  return { sym, options: optionsWith(sym, [...new Set(pool)], 6).map(chordOption), expected: chordExpected(root, type) };
}
function guitarChordQuestion(forms: string, ctx: Ctx): Question {
  const tuning = TUNINGS.violao;
  let root: Note, type: ChordId, frets: Shape;
  if (forms === 'abertos' || (forms === 'todos' && Math.random() < 0.4)) {
    ({ root, type, frets } = pick(OPEN));
  } else {
    type = pick(['maior', 'menor', '7', 'm7', '7M'] as ChordId[]);
    const useE = Math.random() < 0.5;
    const r = randInt(1, 8);
    frets = (useE ? E_FORM : A_FORM)[type]!(r);
    root = spellPc(tuning[useE ? 0 : 1] + r);
  }
  const played = frets.map((f, s) => (f === null ? null : tuning[s] + f)).filter((m): m is number => m !== null);
  const used = frets.filter((f): f is number => f !== null && f > 0);
  const from = used.length && Math.min(...used) > 3 ? Math.min(...used) - 1 : 0;
  const { sym, options, expected } = chordOptions(root, type, ctx.conv);
  return {
    prompt: ctx.t('quiz.whatChord'),
    visual: { kind: 'fretboard', tuning, from, to: from + 5, marks: frets.flatMap((f, s) => (f === null ? [] : [{ s, f, color: f === 0 ? 'var(--cream)' : undefined }])), muted: frets.flatMap((f, s) => (f === null ? [s] : [])) },
    surface: { kind: 'choices', options }, expected, sound: { groups: [played], instrument: 'violao' }, reveal: sym,
  };
}
function pianoChordQuestion(ctx: Ctx): Question {
  const type = pick(['maior', 'menor', '7', 'm7', '7M'] as ChordId[]);
  const root = { ...pick(ROOTS), oct: 4 };
  const ms = buildChord(root, type).map(midi);
  const { sym, options, expected } = chordOptions(root, type, ctx.conv);
  return { prompt: ctx.t('quiz.whatChord'), visual: { kind: 'keyboard', lo: 48, hi: 83, marks: ms }, surface: { kind: 'choices', options }, expected, sound: { groups: [ms] }, reveal: sym };
}
