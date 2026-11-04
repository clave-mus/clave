// O que os itens do catálogo compartilham: configurações reaproveitadas, sorteio com contexto musical
// e os geradores de pergunta que servem a mais de um item.
//
// Existe porque `catalog.ts` tinha 946 linhas e quatro pessoas mexendo nele: todo PR tocava o mesmo
// arquivo e todo PR dava conflito (F1-5). Agora cada família mora em `items/<id>.ts` e o que é comum
// mora aqui.
//
// Os textos vêm de ctx.t (src/i18n): os fixos por chave e os de teoria montados com a gramática de
// cada idioma (src/theory/names.ts). As cifras seguem a convenção do idioma (ctx.conv).
import { buildChord, buildScale, CHORDS, chordSymbol, clefBottom, FLAT_ORDER, harmonicField, ALL_SCALE_IDS, majorTonic, mod, note, noteName, optionsWith, pc, pcName, pick, randInt, relativeMinor, SCALES, scaleMidi, semisFor, SHARP_ORDER, shuffle, transpose, type ChordId, type Clef, type Direcao, type Note, type Quality, type ScaleId } from '../theory/core';
import { accidentalCount, intervalName, ordinal, semitoneName } from '../theory/names';
import type { MessageKey } from '../i18n';
import { TUNINGS } from '../components/music/Fretboard';
import type { ChoiceOption, Ctx, Expected, Question, Setting, SettingValue } from './types';
import { clave, pcsPermitidas } from './contexto-musical';

// Reexportado para o item declarar **um import só**. Sem isto, cada `items/<id>.ts` abriria com cinco
// linhas de import de quatro módulos, e a declaração — que é o que se lê — ficaria enterrada.
export {
  buildChord, buildScale, CHORDS, chordSymbol, clefBottom, FLAT_ORDER, harmonicField, ALL_SCALE_IDS, majorTonic, SHARP_ORDER,
  scaleDegreeLabels, midi, mod, note, noteName, optionsWith, pc, pcName, pick, randInt, relativeMinor,
  SCALES, scaleDegs, scaleMidi, semisFor, shuffle, transpose,
} from '../theory/core';
export type { ChordId, Clef, Direcao, Note, Quality, ScaleId } from '../theory/core';
export { accidentalCount, intervalName, ordinal, semitoneName } from '../theory/names';
export { CELLS, RHYTHM_PRESETS, randomBars } from '../theory/rhythm';
export type { CellId } from '../theory/rhythm';
export { TUNINGS } from '../components/music/Fretboard';
export { alturaDoPc, alturaNaRegiao, clave, notaNaPauta, pcPermitido, pcsPermitidas, regiao, tonicaNaRegiao } from './contexto-musical';
export type { ChoiceOption, Ctx, Expected, Question, Setting, SettingValue } from './types';
export type { MessageKey } from '../i18n';

// ## As quatro fusões por superfície (decisões 16 e 53)
//
// Doze itens eram quatro perguntas repetidas em três superfícies. **A superfície é parâmetro, não
// exercício** — e o que prova que isto não é só arrumação é a validação: a mesma pergunta valida
// GRAFIA na pauta (Dó♯ ≠ Ré♭, porque a pauta distingue) e ALTURA no teclado e no braço (onde a
// tecla é a mesma). Três itens separados escondiam essa diferença atrás de três telas.
//
// Cada superfície traz as suas configurações, e as outras **somem** (`Setting.quando`). A extensão
// não se unifica, de propósito: `pauta / suplementares`, `1 / 2 oitavas` e faixas de casa são três
// unidades incomparáveis, e um parâmetro só precisaria de três listas de opções — o que é três
// parâmetros com um nome em comum.

export type S = Record<string, SettingValue>;
export const arr = (v: SettingValue | undefined, fallback: string[]) => (Array.isArray(v) && v.length ? v : fallback);

// ---------------- configurações reaproveitadas ----------------
// CLEFS, INST e as superfícies de resposta ficam SEM `tier` de propósito: não existe "clave de sol
// mais fácil que clave de fá" nem "violão mais fácil que baixo". Inventar ordem onde ela não existe
// é o erro que a decisão 9 proíbe.
export const CLEFS = ({ t }: Ctx): Setting => ({ id: 'claves', label: t('settings.clefs'), type: 'multi', options: [{ id: 'sol', label: t('settings.clefSol') }, { id: 'fa', label: t('settings.clefFa') }] });
export const EXT = ({ t }: Ctx): Setting => ({ id: 'extensao', label: t('settings.range'), type: 'single', options: [{ id: 'pauta', label: t('settings.rangeStaff'), tier: 1 }, { id: 'suplementares', label: t('settings.rangeLedger'), tier: 2 }] });
export const ACC = ({ t }: Ctx): Setting => ({ id: 'acidentes', label: t('settings.accidentals'), type: 'toggle' });
export const INST = ({ t }: Ctx): Setting => ({ id: 'instrumento', label: t('settings.instrument'), type: 'single', options: [
  { id: 'auto', label: t('settings.myInstrument') }, { id: 'violao', label: t('settings.guitar') }, { id: 'baixo', label: t('settings.bass') }] });
export const FRETS = ({ t }: Ctx): Setting => ({ id: 'casas', label: t('settings.frets'), type: 'single', options: [
  { id: '0-5', label: t('settings.frets05'), tier: 1 }, { id: '5-9', label: t('settings.frets59'), tier: 2 }, { id: '0-12', label: t('settings.frets012'), tier: 3 }] });
/** Direção de percurso. Entra em todo item que toca uma escala ou um arpejo (decisão 70). */
/**
 * O seletor de superfície (decisão 16). **A superfície é parâmetro, não exercício** — e o que muda
 * com ela não é só o desenho: é o que a pergunta consegue cobrar.
 *
 * `present` existe porque o arpejo depende da superfície: um acorde de violão soa dedilhado, um de
 * pauta quase em bloco, e um de teclado em bloco.
 */
export const SUPERFICIES = { pauta: 'settings.surfaceStaff', teclado: 'settings.surfaceKeyboard', braco: 'settings.surfaceFretboard' } as const;
export type SuperficieId = keyof typeof SUPERFICIES;
export const SUP = ({ t }: Ctx, quais: SuperficieId[], present?: Setting['present']): Setting => ({
  id: 'superficie', label: t('settings.surface'), type: 'single',
  options: quais.map(id => ({ id, label: t(SUPERFICIES[id]) })),
  ...(present ? { present } : {}),
});

/**
 * As configurações de cada superfície, cada uma visível só quando a sua está ativa.
 *
 * **A extensão não se unifica, de propósito.** `pauta / suplementares`, `1 / 2 oitavas` e faixas de
 * casa são três unidades incomparáveis: um parâmetro só precisaria de três listas de opções, o que é
 * três parâmetros com um nome em comum.
 */
export function porSuperficie(ctx: Ctx, opts: { semOitavas?: boolean } = {}): Setting[] {
  const naPauta = (s: S) => s.superficie === 'pauta' || s.superficie === undefined;
  return [
    { ...CLEFS(ctx), quando: naPauta },
    { ...EXT(ctx), quando: naPauta },
    { ...ACC(ctx), quando: naPauta },
    { id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle', quando: s => s.superficie === 'teclado' },
    ...(opts.semOitavas ? [] : [{
      id: 'oitavas', label: ctx.t('settings.octaves'), type: 'single' as const, quando: (s: S) => s.superficie === 'teclado',
      options: [{ id: '1', label: '1' }, { id: '2', label: '2' }],
    }]),
    { ...INST(ctx), quando: s => s.superficie === 'braco' },
    { ...FRETS(ctx), quando: s => s.superficie === 'braco' },
  ];
}

/**
 * O que a pergunta pede: a nota pelo nome, ou o intervalo a partir de uma nota (F6-4).
 *
 * `intervalos` só aparece no segundo modo — pedir "qual terça" quando a pergunta é "toque o Fá" seria
 * oferecer um controle que não faz nada.
 */
const ACHAR_MODOS = { nota: 'settings.askNote', intervalo: 'settings.askInterval' } as const;
export const ACHAR = ({ t }: Ctx): Setting[] => [
  { id: 'pedido', label: t('settings.ask'), type: 'single',
    options: (Object.keys(ACHAR_MODOS) as (keyof typeof ACHAR_MODOS)[]).map(id => ({ id, label: t(ACHAR_MODOS[id]) })) },
  { id: 'intervalos', label: t('settings.intervals'), type: 'multi', quando: s => s.pedido === 'intervalo',
    options: INTERVALS.map(i => ({ id: i.id, label: ivLabel(i.id, { t } as Ctx), tier: i.tier })) },
];

/** O intervalo sorteado entre os escolhidos, com o número de semitons e o rótulo pronto. */
export function intervaloPedido(s: S, ctx: Ctx) {
  const ids = arr(s.intervalos, ['M3', 'J5']);
  const iv = INTERVALS.find(i => i.id === pick(ids)) ?? INTERVALS[0];
  return { num: iv.num, semis: semisFor(iv.num, iv.q), rotulo: ivLabel(iv.id, ctx) };
}

/** As teclas pretas, por classe de altura. */
export const PRETAS = [1, 3, 6, 8, 10];

/** As alternativas de nota no teclado, sem as pretas quando a pessoa as desligou. */
export const teclasPermitidas = (ctx: Ctx, s: S): ChoiceOption[] =>
  pcOptions(ctx.naming).filter(o => s.pretas || !PRETAS.includes(Number(o.id)));

/** Uma altura do teclado que o material permite. */
export function alturaDeTeclado(ctx: Ctx, s: S, lo: number, hi: number): number {
  const permitidas = pcsPermitidas(ctx).filter(p => s.pretas || !PRETAS.includes(p));
  let m: number;
  do m = randInt(lo, hi); while (!permitidas.includes(mod(m, 12)));
  return m;
}

/** Quatro cordas é baixo; seis é violão. */
export const vozDoBraco = (tuning: readonly number[]) => (tuning.length === 4 ? 'baixo' as const : 'violao' as const);

/** Como a pergunta chama a corda. No violão as duas Mi se distinguem por grave e aguda. */
export function nomeDaCorda(tuning: readonly number[], str: number, ctx: Ctx): string {
  const open = pcName(tuning[str], ctx.naming, false);
  if (tuning.length === 6 && str === 0) return ctx.t('quiz.lowString', { note: open });
  if (tuning.length === 6 && str === 5) return ctx.t('quiz.highString', { note: open });
  return open;
}

/** Quantos semitons tem um intervalo da lista. */
export const semisDoIntervalo = (id: string) => { const iv = INTERVALS.find(i => i.id === id)!; return semisFor(iv.num, iv.q); };

/**
 * Os pares de casas tocáveis no braço, com a distância de cada um.
 *
 * **Enumera em vez de passear no aleatório**, e usa o braço inteiro sem interseccionar com a região em
 * MIDI — ver `casaPermitida`: a região esmagava o alcance e sobrava um par só (decisão 101).
 */
export function paresNoBraco(tuning: readonly number[]) {
  const faixa = { lo: tuning[0], hi: tuning[tuning.length - 1] + 9 };
  const pares: { s1: number; f1: number; s2: number; f2: number; d: number }[] = [];
  for (let a = 0; a < tuning.length - 1; a++) {
    for (let fa = 1; fa <= 6; fa++) {
      const ma = tuning[a] + fa;
      if (ma < faixa.lo || ma > faixa.hi) continue;
      for (let b = a; b < Math.min(tuning.length, a + 3); b++) {
        for (let fb = Math.max(0, fa - 2); fb <= fa + 4; fb++) {
          const d = tuning[b] + fb - ma;
          if (d >= 1 && d <= 12) pares.push({ s1: a, f1: fa, s2: b, f2: fb, d });
        }
      }
    }
  }
  return pares;
}

/**
 * Os tópicos de um item de teoria em texto. Cada item recebe só os seus.
 *
 * **Item com um tópico só não declara configuração nenhuma**, em vez de declarar uma lista de um item:
 * uma lista com uma opção é um controle que não controla nada, e esconder a única configuração do item
 * deixaria o botão "Personalizar" abrindo o vazio.
 */
export const TOPICOS = {
  graus: 'settings.topicDegrees', modos: 'settings.topicModes', acordes: 'settings.topicChords',
  campo: 'settings.topicField', tonalidades: 'settings.topicKeys', sub5: 'settings.topicSub5',
  // 04/11: os quatro novos. A regra que os escolheu é **resposta única e calculável** — ver
  // `theoryQuestion`, onde está escrito o que ficou de fora e por quê.
  enarmonia: 'settings.topicEnharmonic', armadura: 'settings.topicSignature',
  'intervalo-nomeado': 'settings.topicNamedInterval', 'campo-menor': 'settings.topicMinorField',
  inversoes: 'settings.topicInversions', 'modo-do-grau': 'settings.topicModeDegree',
} as const;
export type TopicoId = keyof typeof TOPICOS;
export const TEMAS = ({ t }: Ctx, quais: TopicoId[]): Setting => ({
  id: 'temas', label: t('settings.topics'), type: 'multi',
  options: quais.map(id => ({ id, label: t(TOPICOS[id]) })),
});

export const DIRECAO = ({ t }: Ctx): Setting => ({ id: 'direcao', label: t('settings.direction'), type: 'single', options: [
  { id: 'sobe', label: t('settings.up') }, { id: 'desce', label: t('settings.down') }, { id: 'ambos', label: t('settings.upDown') }] });

/**
 * As alturas a tocar de uma escala, na direção escolhida.
 *
 * `ambos` sobe e desce, e é o único caso em que a melódica clássica **mostra o que ela é**: sobe
 * com 6ª e 7ª elevadas e desce como menor natural. A oitava do topo não se repete na virada.
 */
export function scaleSound(tonic: number, id: ScaleId, dir?: SettingValue): number[] {
  const d = (dir ?? 'sobe') as Direcao | 'ambos';
  if (d === 'ambos') return [...scaleMidi(tonic, id, 'sobe'), ...scaleMidi(tonic, id, 'desce').slice(1)];
  return scaleMidi(tonic, id, d);
}

export const chordName = (t: Ctx['t'], id: ChordId) => t(`theory.chords.${id}` as MessageKey);
export const scaleName = (t: Ctx['t'], id: ScaleId) => t(`theory.scales.${id}` as MessageKey);
export const chordTypes = (t: Ctx['t'], ids: ChordId[]) => ids.map(c => ({ id: c, label: chordName(t, c) }));
export const ALL_CHORDS = Object.keys(CHORDS) as ChordId[];
export const ALL_SCALES = ALL_SCALE_IDS;

// O `tier` é dica de dificuldade relativa, só para a variação automática pré-marcar (F2-2).
// Aqui existe ordem defensável: oitava, quinta e terças antes das segundas e sétimas, e o trítono
// por último. Onde não houver ordem defensável, o tier fica ausente — ver abaixo.
export const INTERVALS: { id: string; num: number; q: Quality; tier: 1 | 2 | 3 }[] = [
  { id: 'J8', num: 8, q: 'J', tier: 1 }, { id: 'J5', num: 5, q: 'J', tier: 1 }, { id: 'J4', num: 4, q: 'J', tier: 1 },
  { id: 'M3', num: 3, q: 'M', tier: 1 }, { id: 'm3', num: 3, q: 'm', tier: 1 },
  { id: 'M6', num: 6, q: 'M', tier: 2 }, { id: 'm6', num: 6, q: 'm', tier: 2 },
  { id: 'M2', num: 2, q: 'M', tier: 2 }, { id: 'm2', num: 2, q: 'm', tier: 2 },
  { id: 'm7', num: 7, q: 'm', tier: 3 }, { id: 'M7', num: 7, q: 'M', tier: 3 },
  { id: 'A4', num: 4, q: 'A', tier: 3 }, { id: 'd5', num: 5, q: 'd', tier: 3 },
];
export const ivLabel = (id: string, ctx: Ctx) => { const iv = INTERVALS.find(i => i.id === id)!; return intervalName({ num: iv.num, semis: semisFor(iv.num, iv.q) }, ctx.conv); };
export const semiOptions = (ctx: Ctx): ChoiceOption[] => Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), label: semitoneName(i + 1, ctx.conv) }));
/** A mesma ordem de dificuldade dos intervalos escritos, em semitons (F2-2). */
export const SEMI_TIER: Record<number, 1 | 2 | 3> = { 12: 1, 7: 1, 5: 1, 4: 1, 3: 1, 9: 2, 8: 2, 2: 2, 1: 2, 10: 3, 11: 3, 6: 3 };
export const ROOTS: Note[] = [note(0), note(1, -1), note(1), note(2, -1), note(2), note(3), note(3, 1), note(4), note(5, -1), note(5), note(6, -1), note(6)];
export const spellPc = (p: number, oct = 4): Note => ({ ...ROOTS[mod(p, 12)], oct });
export const MODES: ScaleId[] = ['maior', 'dorico', 'frigio', 'lidio', 'mixolidio', 'menor', 'locrio'];

/** A clave da pergunta: o que o item escolheu, ou a clave global quando ele não escolheu (F2-3). */
export function pickClef(s: S, ctx: Ctx): Clef {
  const escolhidas = Array.isArray(s.claves) && s.claves.length ? (s.claves as string[]) : [clave(ctx)];
  return pick(escolhidas) as Clef;
}
export function stepRange(clef: Clef, ext: SettingValue | undefined): [number, number] {
  const b = clefBottom(clef);
  return ext === 'suplementares' ? [b - 6, b + 14] : [b - 1, b + 9];
}
export function randAcc(on: SettingValue | undefined) {
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
export function casaPermitida(tuning: readonly number[], from: number, to: number, ctx: Ctx) {
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

export function fretRange(s: S): [number, number] {
  const [a, b] = String(s.casas ?? '0-5').split('-').map(Number);
  return [a, b];
}
export function tuningOf(s: S, ctx: Ctx) {
  if (s.instrumento === 'auto' || !s.instrumento) return ctx.params.tuning;
  return TUNINGS[s.instrumento as 'violao' | 'baixo'];
}
export const pcOptions = (naming: Ctx['naming']): ChoiceOption[] => Array.from({ length: 12 }, (_, p) => ({ id: String(p), label: pcName(p, naming), value: { kind: 'pitchClass', pc: p } }));
/** Opção que é uma cifra: confere pela fundamental e pela qualidade, não pelo texto. */
export const chordOption = (label: string): ChoiceOption => ({ id: label, label, value: { kind: 'chord', text: label } });
export const chordExpected = (root: Pick<Note, 'letter' | 'acc'>, quality: ChordId): Expected => ({ kind: 'chord', root: pc({ ...root, oct: 4 }), quality });
/** Opção comum, escolhida pelo id. */
export const plain = (o: string): ChoiceOption => ({ id: o, label: o });

// =====================================================================

// =====================================================================
// Quiz de teoria: perguntas geradas
// =====================================================================
// Cada frase é uma mensagem com lacunas (quiz.* em src/i18n); o que muda de forma conforme o
// idioma — ordinais, nomes de intervalo, plural de acidentes — vem de src/theory/names.ts.
/**
 * Os pares enarmônicos que valem perguntar.
 *
 * As cinco teclas pretas, onde as duas grafias são correntes, **mais** os quatro casos de tecla branca
 * (Mi/Fá♭, Si/Dó♭, Fá/Mi♯, Dó/Si♯) — que são os que confundem de verdade, porque parecem erro e não são.
 * Dobrados ficam fora: aparecem em música real, mas numa pergunta de múltipla escolha viram pegadinha.
 */
export const ENARMONIAS: [Note, Note][] = [
  [note(0, 1), note(1, -1)], // Dó♯ / Ré♭
  [note(1, 1), note(2, -1)], // Ré♯ / Mi♭
  [note(3, 1), note(4, -1)], // Fá♯ / Sol♭
  [note(4, 1), note(5, -1)], // Sol♯ / Lá♭
  [note(5, 1), note(6, -1)], // Lá♯ / Si♭
  [note(2), note(3, -1)],    // Mi / Fá♭
  [note(6), note(0, -1)],    // Si / Dó♭
  [note(3), note(2, 1)],     // Fá / Mi♯
  [note(0), note(6, 1)],     // Dó / Si♯
];

/**
 * Quais acidentes a armadura de `f` quintas tem, **na ordem**.
 *
 * A ordem vem de `theory/core.ts` — ela já estava lá, para montar a armadura na pauta. A primeira
 * versão disto a redigitou aqui, e duas cópias da ordem dos acidentes é uma a mais do que precisa
 * existir.
 */
export function acidentesDaArmadura(f: number): Note[] {
  const ordem = f > 0 ? SHARP_ORDER : FLAT_ORDER;
  return ordem.slice(0, Math.abs(f)).map(letra => note(letra, f > 0 ? 1 : -1));
}

/** Como a qualidade de um intervalo se inverte: maior↔menor, aumentado↔diminuto, justo fica. */
export const INVERTE: Record<Quality, Quality> = { M: 'm', m: 'M', A: 'd', d: 'A', J: 'J' };

export function theoryQuestion(topic: string, ctx: Ctx): Question {
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
  // ---------------------------------------------------------------------------------------------
  // Os quatro tópicos novos (04/11/2026). A regra que os escolheu: **resposta única e calculável**.
  // Função harmônica e nome de cadência ficaram FORA — divergem entre tradições, e item ambíguo não
  // pode gerar "erro do usuário" (decisão 13).
  // ---------------------------------------------------------------------------------------------

  if (topic === 'enarmonia') {
    // A mesma tecla com dois nomes. É o buraco mais prático do catálogo para quem toca instrumento de
    // corda: `braco-*` responde por CLASSE DE ALTURA e nunca cobra a grafia.
    const [a, b] = pick(ENARMONIAS);
    const certa = Math.random() < 0.5;
    const [alvo, resposta] = certa ? [a, b] : [b, a];
    // As distratoras: notas a um semitom de distância e a grafia "óbvia e errada" (mesma letra).
    const pool = ENARMONIAS.flatMap(([x, y]) => [nm(x), nm(y)])
      .filter(x => x !== nm(resposta) && x !== nm(alvo));
    return text(t('quiz.enharmonicOf', { note: nm(alvo) }), optionsWith(nm(resposta), [...new Set(pool)], 6), nm(resposta));
  }

  if (topic === 'armadura') {
    // O inverso do que já existia: `tonalidades` pergunta quantos acidentes tem a tonalidade; isto
    // pergunta **quais**, na ordem. É a pergunta que faz a ordem dos acidentes virar útil em vez de
    // decorada.
    const f = pick(keyPool.filter(x => x !== 0));
    const lista = acidentesDaArmadura(f).map(n => nm(n)).join(' ');
    const erradas = new Set<string>();
    for (const g of shuffle(keyPool.filter(x => x !== 0 && x !== f))) {
      if (erradas.size >= 4) break;
      const outra = acidentesDaArmadura(g).map(n => nm(n)).join(' ');
      if (outra !== lista) erradas.add(outra);
    }
    return text(t('quiz.signatureOf', { key: major(majorTonic(f)) }), shuffle([lista, ...erradas]), lista, lista, true);
  }

  if (topic === 'intervalo-nomeado') {
    const a = pick(ROOTS);
    if (Math.random() < 0.5) {
      // De uma nota a outra, **sem pauta e sem som**: é a única forma de cobrar intervalo em silêncio
      // e sem olhar notação.
      const iv = pick(INTERVALS);
      const b = transpose({ ...a, oct: 4 }, { num: iv.num, semis: semisFor(iv.num, iv.q) });
      if (Math.abs(b.acc) > 1) return theoryQuestion('intervalo-nomeado', ctx);
      const ans = ivLabel(iv.id, ctx);
      const pool = INTERVALS.map(x => ivLabel(x.id, ctx)).filter(x => x !== ans);
      return text(t('quiz.intervalFromTo', { a: nm(a), b: nm(b) }), optionsWith(ans, pool, 6), ans);
    }
    // A inversão: a terça maior inverte em sexta menor. Calculada, não tabelada.
    const iv = pick(INTERVALS.filter(x => x.num > 1 && x.num < 8));
    const inv = INTERVALS.find(x => x.num === 9 - iv.num && x.q === INVERTE[iv.q])!;
    const ans = ivLabel(inv.id, ctx);
    const pool = INTERVALS.map(x => ivLabel(x.id, ctx)).filter(x => x !== ans);
    return text(t('quiz.inversionOf', { interval: ivLabel(iv.id, ctx) }), optionsWith(ans, pool, 6), ans);
  }

  if (topic === 'campo-menor') {
    // O `campo` só cobria MAIOR. Os campos menores (natural e harmônica) são metade da harmonia que
    // esta gente toca, e `harmonicField` já sabe os quatro modos — era só perguntar.
    const modo = pick(['menor', 'menor-harmonica'] as const);
    const tonic = pick(ROOTS);
    const field = harmonicField(tonic, modo, Math.random() < 0.5, conv);
    const d = pick(field);
    const outros = harmonicField(tonic, modo === 'menor' ? 'menor-harmonica' : 'menor', true, conv);
    const pool = [...field.map(x => x.symbol), ...outros.map(x => x.symbol)];
    return chordText(
      t('quiz.minorFieldDegree', { note: nm(tonic), mode: t(`theory.scales.${modo}` as MessageKey), roman: d.roman }),
      optionsWith(d.symbol, [...new Set(pool)], 6), chordExpected(d.root, d.chord), d.symbol,
    );
  }

  if (topic === 'inversoes') {
    // A cifra com barra, que é notação de verdade: aparece em toda cifra de música popular e não era
    // cobrada em lugar nenhum. Resposta única — a nota do baixo de uma inversão é calculada.
    const root = pick(ROOTS);
    const type = pick(['maior', 'menor', '7', 'm7', '7M'] as ChordId[]);
    const notas = buildChord(root, type);
    const inv = randInt(1, notas.length - 1);
    const baixo = buildChord(root, type, inv)[0];
    // **O baixo da cifra usa letra**, como o resto da cifra — `chordSymbol` sempre usa `noteName(.., 'en')`.
    // A primeira versão usava o nome no idioma da pessoa e produzia `B7M/Lá♯`, que não é cifra de
    // nada: foi o teste que pegou.
    const nomeNaCifra = (n: Pick<Note, 'letter' | 'acc'>) => noteName(n, 'en');
    const cifra = `${sym(root, type)}/${nomeNaCifra(baixo)}`;
    if (Math.random() < 0.5) {
      // "Dó maior com a terça no baixo se escreve como?"
      const ans = cifra;
      const pool = notas.slice(1).map(x => `${sym(root, type)}/${nomeNaCifra(x)}`).filter(x => x !== ans);
      // **A fundamental fica fora das distratoras**: `D/D` não é inversão de nada, e alternativa
      // absurda não ensina — ela só diminui o número real de opções. Foi o teste que pegou.
      const outras = ROOTS.filter(r => nomeNaCifra(r) !== nomeNaCifra(root))
        .slice(0, 6).map(r => `${sym(root, type)}/${nomeNaCifra(r)}`).filter(x => x !== ans);
      return text(t('quiz.inversionAs', { chord: sym(root, type), ord: ordinal(inv * 2 + 1, conv, 'f') }),
        optionsWith(ans, [...new Set([...pool, ...outras])], 5), ans);
    }
    // "Em C/E, que nota está no baixo?" — a volta, e é a que diz se a notação foi entendida. Aqui a
    // resposta é no idioma da pessoa: a pergunta é sobre a NOTA, não sobre como se escreve a cifra.
    const ans = nm(baixo);
    return text(t('quiz.whatIsBass', { chord: cifra }), optionsWith(ans, notePool(ans), 6), ans);
  }

  if (topic === 'modo-do-grau') {
    // Os modos **por posição**. Hoje eles são cobrados por grau alterado e por diferença entre dois
    // modos, mas nunca por "qual é o quarto" — que é como quase todo mundo os aprendeu.
    const i = randInt(0, MODES.length - 1);
    const mode = MODES[i];
    const ords = MODES.map((_, k) => ordinal(k + 1, conv, 'm'));
    if (Math.random() < 0.5) {
      const ans = modeName(mode);
      return text(t('quiz.modeOfDegree', { ord: ords[i] }), optionsWith(ans, MODES.map(modeName), 6), ans);
    }
    return text(t('quiz.degreeOfMode', { mode: modeName(mode) }), ords, ords[i]);
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
  const sorteio = Math.random();
  if (sorteio < 0.34) {
    const ans = nm(relativeMinor(f));
    return text(t('quiz.relativeOf', { key: major(tonic) }), optionsWith(ans, keyPool.map(k => nm(relativeMinor(k))), 6), ans, t('theory.keyMinor', { note: ans }));
  }
  if (sorteio < 0.67) {
    // **A direção que faltava.** A relativa só era perguntada de maior para menor, e é a de volta que
    // trava na prática: quem vê uma música em Fá menor precisa saber que a armadura é a de Lá♭ maior.
    const menor = relativeMinor(f);
    const ans = nm(tonic);
    return text(
      t('quiz.relativeMajorOf', { key: t('theory.keyMinor', { note: nm(menor) }) }),
      optionsWith(ans, keyPool.map(k => nm(majorTonic(k))), 6), ans, major(tonic),
    );
  }
  const accLabel = (k: number) => accidentalCount(k, conv);
  return text(t('quiz.accidentalsOf', { key: major(tonic) }), optionsWith(accLabel(f), keyPool.map(accLabel), 6), accLabel(f));
}

// ---------------- acordes desenhados ----------------
export type Shape = (number | null)[];
export const OPEN: { root: Note; type: ChordId; frets: Shape }[] = [
  { root: note(0), type: 'maior', frets: [null, 3, 2, 0, 1, 0] }, { root: note(4), type: 'maior', frets: [3, 2, 0, 0, 0, 3] },
  { root: note(1), type: 'maior', frets: [null, null, 0, 2, 3, 2] }, { root: note(5), type: 'maior', frets: [null, 0, 2, 2, 2, 0] },
  { root: note(2), type: 'maior', frets: [0, 2, 2, 1, 0, 0] }, { root: note(5), type: 'menor', frets: [null, 0, 2, 2, 1, 0] },
  { root: note(2), type: 'menor', frets: [0, 2, 2, 0, 0, 0] }, { root: note(1), type: 'menor', frets: [null, null, 0, 2, 3, 1] },
  { root: note(2), type: '7', frets: [0, 2, 0, 1, 0, 0] }, { root: note(5), type: '7', frets: [null, 0, 2, 0, 2, 0] },
  { root: note(1), type: '7', frets: [null, null, 0, 2, 1, 2] }, { root: note(5), type: 'm7', frets: [null, 0, 2, 0, 1, 0] },
  { root: note(2), type: 'm7', frets: [0, 2, 0, 0, 0, 0] }, { root: note(0), type: '7M', frets: [null, 3, 2, 0, 0, 0] },
  { root: note(0), type: '7', frets: [null, 3, 2, 3, 1, 0] }, { root: note(1), type: '7M', frets: [null, null, 0, 2, 2, 2] },
];
export const E_FORM: Partial<Record<ChordId, (r: number) => Shape>> = {
  maior: r => [r, r + 2, r + 2, r + 1, r, r], menor: r => [r, r + 2, r + 2, r, r, r], '7': r => [r, r + 2, r, r + 1, r, r],
  m7: r => [r, r + 2, r, r, r, r], '7M': r => [r, null, r + 1, r + 1, r, null],
};
export const A_FORM: Partial<Record<ChordId, (r: number) => Shape>> = {
  maior: r => [null, r, r + 2, r + 2, r + 2, r], menor: r => [null, r, r + 2, r + 2, r + 1, r], '7': r => [null, r, r + 2, r, r + 2, r],
  m7: r => [null, r, r + 2, r, r + 1, r], '7M': r => [null, r, r + 2, r + 1, r + 2, r],
};
/**
 * As alternativas de uma pergunta de acorde: a cifra certa, as outras qualidades em jogo sobre a mesma
 * fundamental, e a mesma qualidade sobre outras fundamentais.
 *
 * `emJogo` são as qualidades que a pessoa escolheu. Quando não vêm (as formas de violão são posições
 * reais, não uma escolha de qualidade), caem nas cinco que o desenho de violão produz.
 */
export function chordOptions(root: Note, type: ChordId, conv: Ctx['conv'], emJogo?: ChordId[]) {
  const sym = chordSymbol(root, type, conv);
  const types: ChordId[] = emJogo?.length ? emJogo : ['maior', 'menor', '7', 'm7', '7M'];
  const pool = [...types.map(t => chordSymbol(root, t, conv)), ...shuffle(ROOTS).slice(0, 5).map(r => chordSymbol(r, type, conv))];
  return { sym, options: optionsWith(sym, [...new Set(pool)], 6).map(chordOption), expected: chordExpected(root, type) };
}
export function guitarChordQuestion(forms: string, ctx: Ctx): Question {
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
