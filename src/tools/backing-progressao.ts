// **A progressão do backing**: o que cada compasso é, e como ele vira acorde soando.
//
// Saiu de `Backing.tsx` em 19/11 junto com a levada: a tela guardava tipo, presets, resolução
// harmônica e leitura da configuração guardada. Aqui nada sabe de React, e por isso tudo isto tem
// teste direto — `backing-baixo.test.ts` monta progressões sem montar tela nenhuma.
import { chordSymbol, harmonicField, majorTonic, transpose,
  type ChordId, type Convention, type ModoDoCampo, type Note, type ScaleId } from '../theory/core';
import { emprestimosDoCampo } from '../theory/campo-harmonico';
import { voicingConduzido } from '../theory/voicings';
import { GROOVES, type Duracao, type Style } from '../theory/levada';
import type { MessageKey } from '../i18n';
import type { Voice } from '../audio/engine';

/** Os timbres que a tela oferece para o acompanhamento. A leitura do guardado confere contra esta lista. */
export const VOICES: [Voice, MessageKey][] = [['piano', 'voices.piano'], ['pad', 'voices.pad'], ['violao', 'voices.violao'], ['orgao', 'voices.orgao']];

/**
 * **Um compasso da progressão, ou uma marca de modulação.**
 *
 * A progressão era uma lista de graus de **um** campo. Empréstimo e modulação quebram essa premissa
 * de jeitos diferentes, e foi assim que o Paulo decidiu resolver cada um (19/11):
 *
 * - **empréstimo** é acorde de fora do campo que não muda o centro: `emp` traz o id da lista curada
 *   que o `ouvido-campo` já usa — mesma lista, mesmos acordes, motor compartilhado;
 * - **modulação** é uma **marca** entre dois compassos ("daqui em diante, Fá maior"), como a música
 *   escreve uma mudança de armadura. Ela não ocupa compasso: tudo depois dela resolve na tonalidade
 *   nova, e dá para modular quantas vezes quiser.
 */
export interface Acorde { deg: number; type?: ChordId; flat?: boolean; emp?: string; dur?: Duracao }
export interface Marca { mod: Tonalidade }
export type Item = Acorde | Marca;
export interface Tonalidade { fifths: number; mode: ModoDoCampo }
export const ehMarca = (i: Item): i is Marca => 'mod' in i;
/** A tônica de uma tonalidade. As três menores partem da relativa menor, como o resto da tela. */
export const tonicaDe = ({ fifths, mode }: Tonalidade): Note =>
  (mode === 'maior' ? majorTonic(fifths) : transpose(majorTonic(fifths), { num: 6, semis: 9 }));
export interface Preset { id: string; name: MessageKey; mode: ModoDoCampo; items: Item[]; style: Style; bpm: number; tetrads: boolean }

const P = (deg: number, type?: ChordId, flat?: boolean): Item => ({ deg, type, flat });
export const PRESETS: Preset[] = [
  { id: 'pop', name: 'backing.presetPop', mode: 'maior', items: [P(1), P(5), P(6), P(4)], style: 'rock', bpm: 96, tetrads: false },
  { id: 'ii-v-i', name: 'backing.presetIiVI', mode: 'maior', items: [P(2), P(5), P(1), P(1)], style: 'swing', bpm: 132, tetrads: true },
  { id: 'blues', name: 'backing.presetBlues', mode: 'maior', items: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5].map(d => P(d, '7')), style: 'shuffle', bpm: 88, tetrads: true },
  { id: 'samba', name: 'backing.presetSamba', mode: 'maior', items: [P(1), P(6, '7'), P(2), P(5, '7')], style: 'samba', bpm: 98, tetrads: false },
  { id: 'andaluz', name: 'backing.presetAndalusian', mode: 'menor', items: [P(1), P(7), P(6), P(5, 'maior')], style: 'balada', bpm: 80, tetrads: false },
  /**
   * **A modulação, para a coisa não nascer invisível** (pedido dele em 19/11): `ii–V–I` em dó,
   * marca, e `iiø–V7–i` na relativa menor — a modulação mais comum do repertório. O V da menor é
   * **empréstimo** (`V`), porque o v diatônico não puxa; então este preset exercita as duas peças
   * novas de uma vez.
   */
  { id: 'modula', name: 'backing.presetModula', mode: 'maior', items: [P(2), P(5, '7'), P(1), P(1), { mod: { fifths: 0, mode: 'menor' } }, P(2), { deg: 5, emp: 'V' }, P(1), P(1)], style: 'balada', bpm: 100, tetrads: true },
];

// ---------------- levadas ----------------
/**
 * Uma levada. `grid` são os passos de um compasso e `tempos`, quantos tempos ele tem — **4 em todas,
 * menos na valsa**, que é 3. Antes `tempos` não existia e o relógio fazia `grid / 4` em todo lugar:
 * com isso, compasso ternário era impossível de representar (decisão dele em 19/11).
 */

// ---------------- harmonia ----------------
export interface Resolved { root: Note; type: ChordId; symbol: string; roman: string; scales: { id: ScaleId; root: Note; why: MessageKey }[]; tom: Tonalidade; vozes: number[]; dur: Duracao }
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function romanFor(deg: number, type: ChordId, flat: boolean, conv: Convention) {
  const minor = ['menor', 'm7', 'dim', 'm7b5', 'dim7'].includes(type);
  const r = (flat ? '♭' : '') + (minor ? ROMAN[deg - 1].toLowerCase() : ROMAN[deg - 1]);
  return r + sufixoRomano(type, conv);
}
export function resolve(item: Acorde, tom: Tonalidade, tetrads: boolean, conv: Convention): Resolved {
  const tonic = tonicaDe(tom);
  const mode = tom.mode;
  const field = harmonicField(tonic, mode, tetrads, conv);
  /**
   * **O empréstimo sai da lista curada** (`emprestimosDoCampo`), e a grafia sai do grau de onde ele
   * vem: o sexto grau abaixado é Lá♭ em dó maior, nunca Sol♯. É o que `grau`/`alt` guardam.
   */
  const emp = item.emp ? emprestimosDoCampo(mode === 'maior' ? 'maior' : 'menor').find(e => e.id === item.emp) : undefined;
  if (emp) {
    const base = harmonicField(tonic, mode === 'maior' ? 'maior' : 'menor', tetrads, conv)[emp.grau - 1];
    const root = emp.alt === 0 ? base.root : { ...base.root, acc: base.root.acc + emp.alt };
    const type = tetrads ? emp.tetrade : emp.triade;
    return {
      root, type, symbol: chordSymbol(root, type, conv), roman: emp.roman + (tetrads ? sufixoRomano(type, conv) : ''),
      // Empréstimo é acorde de fora: a sugestão de escala segue a mesma porta de "qualidade trocada".
      scales: suggestScales(root, type, emp.grau, mode, true), tom, vozes: [], dur: item.dur ?? 1,
    };
  }
  const f = field[item.deg - 1];
  const root = item.flat ? { ...f.root, acc: f.root.acc - 1 } : f.root;
  const type = item.type ?? f.chord;
  const roman = !item.type && !item.flat ? f.roman : romanFor(item.deg, type, !!item.flat || (mode === 'menor' && [3, 6, 7].includes(item.deg)), conv);
  return { root, type, symbol: chordSymbol(root, type, conv), roman, scales: suggestScales(root, type, item.deg, mode, !!item.type || !!item.flat), tom, vozes: [], dur: item.dur ?? 1 };
}

/**
 * **Resolve a progressão inteira, guardando a tonalidade em vigor.**
 *
 * As marcas não ocupam compasso: elas só trocam o centro para o que vem depois. `porItem` liga cada
 * item ao compasso que ele virou (ou `null`, se é marca), para a tela poder desenhar a progressão na
 * ordem em que foi escrita e ainda saber qual compasso está soando.
 */
export function resolverProgressao(items: Item[], inicial: Tonalidade, tetrads: boolean, conv: Convention) {
  const chords: Resolved[] = [];
  const porItem: (number | null)[] = [];
  let tom = inicial;
  for (const it of items) {
    if (ehMarca(it)) { tom = it.mod; porItem.push(null); continue; }
    porItem.push(chords.length);
    const r = resolve(it, tom, tetrads, conv);
    /**
     * **A condução de vozes é uma cadeia**, e por isso ela mora aqui e não em `resolve`: cada acorde
     * olha o anterior. Calculado na resolução (e não no relógio), o voicing é o **mesmo em todas as
     * voltas** do loop — tocar duas vezes dá o mesmo som, que é o que se espera de um acompanhamento.
     */
    chords.push({ ...r, vozes: voicingConduzido(r.root, r.type, chords.length ? chords[chords.length - 1].vozes : null) });
  }
  // A tonalidade do FIM é onde um acorde novo cairia — é ela que manda nos botões de grau.
  return { chords, porItem, noFim: tom };
}

/** O sufixo da cifra romana de uma qualidade (`7`, `ø`, `°7`…). Vive aqui e em `romanFor`. */
function sufixoRomano(type: ChordId, conv: Convention): string {
  const suf: Partial<Record<ChordId, string>> = { '7': '7', '7M': conv === 'pt' ? '7M' : 'maj7', m7: '7', m7b5: 'ø', dim: '°', dim7: '°7', aum: '+' };
  return suf[type] ?? '';
}
/**
 * Que escala usar sobre cada acorde. **Só para maior e menor natural**: as sugestões para a menor
 * harmônica e a melódica são conteúdo musical que ainda não foi curado (decisão 13 — item ambíguo não
 * afirma), e sugerir errado é pior que não sugerir. Elas chegam com a revisão do Paulo.
 */
function suggestScales(root: Note, type: ChordId, deg: number, mode: ModoDoCampo, borrowed: boolean): Resolved['scales'] {
  if (mode !== 'maior' && mode !== 'menor') return [];
  const s = (id: ScaleId, why: MessageKey) => ({ id, root, why });
  if (type === '7') return [s('mixolidio', 'backing.whyDominant'), s('blues', 'backing.whyBlues')];
  if (type === 'm7b5' || type === 'dim' || type === 'dim7') return [s('locrio', 'backing.whyHalfDim')];
  if (type === '7M' || type === 'maior') {
    if (!borrowed && mode === 'maior' && deg === 4) return [s('lidio', 'backing.whyIvMajor'), s('penta-maior', 'backing.whySafe')];
    return [s('maior', 'backing.whyMajorChord'), s('penta-maior', 'backing.whySafe')];
  }
  if (!borrowed && mode === 'maior') {
    if (deg === 2) return [s('dorico', 'backing.whyIiMajor'), s('penta-menor', 'backing.whySafe')];
    if (deg === 3) return [s('frigio', 'backing.whyIiiMajor'), s('penta-menor', 'backing.whySafe')];
  }
  if (!borrowed && mode === 'menor' && deg === 4) return [s('dorico', 'backing.whyIvMinor'), s('penta-menor', 'backing.whySafe')];
  return [s('menor', 'backing.whyMinorChord'), s('penta-menor', 'backing.whySafe')];
}

/**
 * **O que a pessoa monta não se perde mais** (da revisão de 19/11: *"a progressão não é salva em
 * lugar nenhum: sair da tela apaga"*).
 *
 * Guardado em `settings['backing']`, a mesma gaveta que os itens de catálogo usam — e serializado,
 * porque ali só cabem valores simples. A leitura **valida a forma**: configuração guardada é dado
 * de fora (pode vir de uma versão antiga do app), e dado de fora que entra sem conferência quebra a
 * tela de quem só abriu o app.
 */
export const GUARDADO = 'backing';
/**
 * ⚠️ **Os três interruptores de som entram junto** (`contagem`, `baixo`, `timbre do acorde`), e isto
 * foi uma inconsistência que a própria conferência mostrou: recarregando, a levada e o andamento
 * voltavam e a contagem não — "por que ele lembrou da valsa e esqueceu a minha contagem?". Como
 * podem faltar numa versão guardada antes, são opcionais na leitura.
 */
export interface Guardado {
  items: Item[]; fifths: number; mode: ModoDoCampo; tetrads: boolean; style: Style; bpm: number;
  contagem?: boolean; bassOn?: boolean; acordesOn?: boolean; compVoice?: Voice;
}
export function lerGuardado(cru: unknown): Guardado | null {
  if (typeof cru !== 'string') return null;
  try {
    const o = JSON.parse(cru) as Partial<Guardado>;
    if (!Array.isArray(o.items) || !o.items.length) return null;
    const ok = o.items.every(it => it && typeof it === 'object'
      && (('deg' in it && typeof it.deg === 'number') || ('mod' in it && !!it.mod && typeof it.mod === 'object')));
    if (!ok) return null;
    if (typeof o.fifths !== 'number' || typeof o.bpm !== 'number') return null;
    if (!o.mode || !(o.mode in { maior: 1, menor: 1, 'menor-harmonica': 1, 'menor-melodica': 1 })) return null;
    if (!o.style || !(o.style in GROOVES)) return null;
    return {
      items: o.items, fifths: o.fifths, mode: o.mode, tetrads: o.tetrads === true, style: o.style, bpm: o.bpm,
      // os três de som: ausentes numa versão antiga, e aí quem manda é o padrão da tela
      ...(typeof o.contagem === 'boolean' ? { contagem: o.contagem } : {}),
      ...(typeof o.bassOn === 'boolean' ? { bassOn: o.bassOn } : {}),
      ...(typeof o.acordesOn === 'boolean' ? { acordesOn: o.acordesOn } : {}),
      ...(o.compVoice && VOICES.some(([v]) => v === o.compVoice) ? { compVoice: o.compVoice } : {}),
    };
  } catch { return null; }
}

/**
 * A mesma resolução, exportada com os tipos abertos para o teste — que mede empréstimo e modulação
 * sem montar a tela. Os tipos `Acorde`/`Marca` são internos de propósito: quem escreve progressão é
 * esta tela.
 */
export const resolverProgressaoParaTeste = (
  items: readonly ({ deg: number; type?: ChordId; flat?: boolean; emp?: string } | { mod: { fifths: number; mode: ModoDoCampo } })[],
  inicial: { fifths: number; mode: ModoDoCampo }, tetrads: boolean, conv: Convention,
) => resolverProgressao(items as Item[], inicial, tetrads, conv);
