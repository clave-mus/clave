// Formas e digitações no braço (M5, 06/11/2026): modo → acorde por graus → posições no braço.
// Porta `docs/doado/gerador_arpejos_baixo.py` (presente do Paulo) para TypeScript.
//
// A grafia das notas é SEMPRE feita por `transpose()`/`Note` daqui — nunca uma tabela própria
// (CLAUDE.md: "grafia correta por tonalidade é de src/theory/core.ts; não contorne"). Os acordes
// cromáticos reusam `CHORDS`: as dez receitas do Python batem exatamente com dez entradas que já
// existem (motor duplicado é proibido). O que É novo aqui é a busca de posições no braço — não
// havia nada parecido no projeto.
//
// Duas decisões do Paulo que a busca preserva, com teste em digitacoes.test.ts:
// 1. Corda solta não conta no vão da mão.
// 2. O vão não tem padrão por `tipo` — quem chama escolhe (4 para acorde, 5 para arpejo, por
//    convenção do Paulo), o mesmo comportamento do gerador doado.
import { CHORDS, mod, noteName, pc, transpose, type ChordId, type Naming, type Note } from './core';

type Deg = readonly [num: number, semis: number];

// ---------------------------------------------------------------------------
// MODOS: rotação genérica de uma família-base
// ---------------------------------------------------------------------------

export type FamiliaBase = 'maior' | 'menor' | 'menor-harmonica' | 'menor-melodica-jazz';

/** As quatro famílias-base, pelos graus EM SEMITONS (sem rotação) — mesmas da escala maior, menor
 *  natural, menor harmônica e menor melódica (forma do jazz, igual nas duas direções). */
const FAMILIAS: Record<FamiliaBase, readonly Deg[]> = {
  maior: [[1, 0], [2, 2], [3, 4], [4, 5], [5, 7], [6, 9], [7, 11]],
  menor: [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 10]],
  'menor-harmonica': [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 8], [7, 11]],
  'menor-melodica-jazz': [[1, 0], [2, 2], [3, 3], [4, 5], [5, 7], [6, 9], [7, 11]],
};

/** Gira os graus de uma família-base a partir do grau que vira a nova tônica — é o que transforma
 *  a escala maior em seus sete modos (dórico = grau 2, frígio = grau 3…), e vale igual para as
 *  outras três famílias (ex.: menor harmônica, grau 5 = frígio dominante). */
function rotacionarGraus(base: readonly Deg[], grauInicial: number): Deg[] {
  const inicio = grauInicial - 1;
  const semisInicio = base[inicio][1];
  return Array.from({ length: 7 }, (_, passo) => {
    const indice = (inicio + passo) % 7;
    const oitava = Math.floor((inicio + passo) / 7);
    const semis = base[indice][1] + 12 * oitava - semisInicio;
    return [passo + 1, semis] as Deg;
  });
}

export interface Modo {
  tonica: Note;
  familia: FamiliaBase;
  grau: number;
  degs: readonly Deg[];
}

/**
 * Constrói um modo a partir de uma família-base e uma rotação.
 *
 * `tonica` é a tônica DO MODO resultante: `getModo(nota, 'maior', 2)` dá dórico sobre `nota` (ex.:
 * C → C D Eb F G A Bb), não dórico sobre o grau 2 da escala maior de `nota`.
 */
export function getModo(tonica: Note, familia: FamiliaBase, grau: number): Modo {
  if (!(familia in FAMILIAS)) throw new RangeError(`familia inválida: ${familia}`);
  if (!Number.isInteger(grau) || grau < 1 || grau > 7) throw new RangeError('grau deve ser um inteiro entre 1 e 7.');
  return { tonica, familia, grau, degs: rotacionarGraus(FAMILIAS[familia], grau) };
}

/** As notas grafadas do modo, uma oitava (sete graus, sem repetir a tônica no topo). */
export function notasDoModo(modo: Modo): Note[] {
  return modo.degs.map(([num, semis]) => transpose(modo.tonica, { num, semis }));
}

// ---------------------------------------------------------------------------
// CONSTRUÇÃO DO ACORDE
// ---------------------------------------------------------------------------

export interface Tom {
  /** Grau ou rótulo (ex.: '1', '3', '5', '6'). */
  role: string;
  pc: number;
  /** Semitons a partir da fundamental DO ACORDE (não da tônica do modo). */
  semisDaFundamental: number;
  nota: Note;
}

const semisAbsolutoNoModo = (modo: Modo, passo: number) => {
  const [, semisBase] = modo.degs[mod(passo, 7)];
  return semisBase + 12 * Math.floor(passo / 7);
};

/**
 * Constrói um acorde por graus diatônicos relativos à própria fundamental.
 *
 * Ex.: modo C dórico, grauFundamental=1, grausDoAcorde=[1,3,5,6] → C, Eb, G, A. Graus acima de 7
 * são aceitos (9, 11, 13…) — é o que permite tétrades e extensões sem um caso especial.
 */
export function tonsPorGraus(modo: Modo, grauFundamental: number, grausDoAcorde: readonly number[]): Tom[] {
  if (!Number.isInteger(grauFundamental) || grauFundamental < 1 || grauFundamental > 7) {
    throw new RangeError('grauFundamental deve ser um inteiro entre 1 e 7.');
  }
  if (!grausDoAcorde.length) throw new RangeError('Informe pelo menos um grau para o acorde.');
  if (grausDoAcorde.some(d => !Number.isInteger(d) || d < 1)) throw new RangeError('Os graus do acorde devem ser inteiros positivos: 1, 3, 5…');

  const passoFund = grauFundamental - 1;
  const semisFund = semisAbsolutoNoModo(modo, passoFund);

  return grausDoAcorde.map(grau => {
    const passoAbs = passoFund + grau - 1;
    const semisAbs = semisAbsolutoNoModo(modo, passoAbs);
    const nota = transpose(modo.tonica, { num: passoAbs + 1, semis: semisAbs });
    return { role: String(grau), pc: pc(nota), semisDaFundamental: semisAbs - semisFund, nota };
  });
}

/** Constrói um acorde a partir de uma receita cromática já conhecida pelo app (`CHORDS`). As dez
 *  receitas do gerador doado são as dez entradas que já existem — ver o cabeçalho do arquivo. */
export function tonsPorReceita(fundamental: Note, id: ChordId): Tom[] {
  return CHORDS[id].degs.map(([num, semis]) => {
    const nota = transpose(fundamental, { num, semis });
    return { role: String(num), pc: pc(nota), semisDaFundamental: semis, nota };
  });
}

/** O acorde pedido sobre cada um dos sete graus do modo — o campo harmônico generalizado para
 *  qualquer combinação de graus, não só tríade/tétrade por terças. */
export function acordesDiatonicos(modo: Modo, grausDoAcorde: readonly number[] = [1, 3, 5, 7]): { grauFundamental: number; tons: Tom[] }[] {
  return Array.from({ length: 7 }, (_, i) => ({ grauFundamental: i + 1, tons: tonsPorGraus(modo, i + 1, grausDoAcorde) }));
}

/** Texto curto de um conjunto de tons, só para log e depuração — não é texto de interface. */
export function descreverTons(tons: readonly Tom[], naming: Naming = 'en'): string {
  return tons.map(t => `${t.role}:${noteName(t.nota, naming)}`).join(' – ');
}

// ---------------------------------------------------------------------------
// MAPA DO BRAÇO E BUSCA DE DIGITAÇÕES
// ---------------------------------------------------------------------------

/** Uma posição física: índice da corda (0 = mais grave) e casa. */
export interface Posicao { corda: number; casa: number; midi: number; pc: number }

/** Uma nota do acorde encaixada numa posição do braço. */
export interface Encaixe { role: string; corda: number; casa: number; midi: number; pc: number; nota: Note }

export type TipoDigitacao = 'acorde' | 'arpejo';
/** Contorno do arpejo — só importa para `tipo: 'arpejo'`. */
export type Contorno = 'qualquer' | 'subindo' | 'descendo';

export interface OpcoesBusca {
  tipo?: TipoDigitacao;
  tuning?: readonly number[];
  maxCasa?: number;
  /** Vão máximo em casas, contando só dedos pressionados — corda solta não conta (decisão do Paulo). */
  maxVaoCasas?: number | null;
  /** Por padrão, acorde exige corda distinta por nota; arpejo permite repetir corda. */
  cordasDistintas?: boolean;
  contorno?: Contorno;
  maxVaoMidi?: number | null;
  limite?: number | null;
}

function posicoesDoBraco(tuning: readonly number[], maxCasa: number): Posicao[] {
  const out: Posicao[] = [];
  for (let corda = 0; corda < tuning.length; corda++) {
    for (let casa = 0; casa <= maxCasa; casa++) {
      const midi = tuning[corda] + casa;
      out.push({ corda, casa, midi, pc: mod(midi, 12) });
    }
  }
  return out;
}

/** Vão da mão: cordas soltas (casa 0) não contam como dedo. */
function vaoCasasOk(escolhidas: readonly Posicao[], maxVaoCasas: number | null | undefined): boolean {
  if (maxVaoCasas == null) return true;
  const pressionadas = escolhidas.filter(p => p.casa > 0).map(p => p.casa);
  return pressionadas.length < 2 || Math.max(...pressionadas) - Math.min(...pressionadas) <= maxVaoCasas;
}

function validarOpcoesBusca(o: OpcoesBusca) {
  const inteiroOuNull = (v: number | null | undefined) => v === undefined || v === null || Number.isInteger(v);
  if (!inteiroOuNull(o.maxCasa) || (o.maxCasa ?? 0) < 0) throw new RangeError('maxCasa deve ser um inteiro não negativo.');
  if (!inteiroOuNull(o.maxVaoCasas) || (o.maxVaoCasas ?? 0) < 0) throw new RangeError('maxVaoCasas deve ser null ou um inteiro não negativo.');
  if (!inteiroOuNull(o.maxVaoMidi) || (o.maxVaoMidi ?? 0) < 0) throw new RangeError('maxVaoMidi deve ser null ou um inteiro não negativo.');
  if (!inteiroOuNull(o.limite) || (o.limite ?? 0) < 0) throw new RangeError('limite deve ser null ou um inteiro não negativo.');
  if (o.tipo === 'acorde' && o.contorno && o.contorno !== 'qualquer') throw new RangeError('contorno só se aplica a arpejo.');
}

/**
 * Busca digitações de um acorde (voicing) ou de um arpejo (sequência) no braço, por backtracking.
 *
 * `tipo: 'acorde'` por padrão exige uma corda diferente por nota; `'arpejo'` permite repetir corda
 * e respeita a ORDEM de `tons` — `contorno: 'descendo'` inverte essa ordem antes de buscar,
 * `'subindo'` mantém, `'qualquer'` não filtra pela direção.
 *
 * As posições são escolhidas por classe de altura, não por oitava fixa — é o que permite achar
 * inversões e registros diferentes. `maxVaoMidi` limita a extensão sonora total, independente do
 * vão de casas.
 *
 * Busca é preguiçosa (generator): `limite` interrompe depois de N resultados sem gerar o resto.
 */
export function* buscarDigitacoes(tons: readonly Tom[], opcoes: OpcoesBusca = {}): Generator<Encaixe[]> {
  if (!tons.length) return;
  const {
    tipo = 'acorde', tuning = [28, 33, 38, 43], maxCasa = 12, maxVaoCasas = 4,
    contorno = 'qualquer', maxVaoMidi = null, limite = null,
  } = opcoes;
  validarOpcoesBusca({ ...opcoes, tipo, maxCasa, maxVaoCasas, contorno, maxVaoMidi, limite });
  const cordasDistintas = opcoes.cordasDistintas ?? tipo === 'acorde';
  if (cordasDistintas && tipo === 'acorde' && tons.length > tuning.length) return;

  const tonsOrdenados = tipo === 'arpejo' && contorno === 'descendo' ? [...tons].reverse() : tons;

  const porPc: Posicao[][] = Array.from({ length: 12 }, () => []);
  for (const p of posicoesDoBraco(tuning, maxCasa)) porPc[p.pc].push(p);
  for (const lista of porPc) lista.sort((a, b) => (contorno === 'descendo' ? b.midi - a.midi : a.midi - b.midi));

  const candidatos = tonsOrdenados.map(t => porPc[t.pc]);
  if (candidatos.some(c => c.length === 0)) return;

  const escolhidas: Posicao[] = [];
  const cordasUsadas = new Set<number>();
  let geradas = 0;

  function* backtrack(indice: number): Generator<Encaixe[]> {
    if (limite !== null && geradas >= limite) return;
    if (indice === tonsOrdenados.length) {
      geradas++;
      yield tonsOrdenados.map((tom, i) => ({
        role: tom.role, corda: escolhidas[i].corda, casa: escolhidas[i].casa,
        midi: escolhidas[i].midi, pc: escolhidas[i].pc, nota: tom.nota,
      }));
      return;
    }
    for (const posicao of candidatos[indice]) {
      if (cordasDistintas && cordasUsadas.has(posicao.corda)) continue;
      if (escolhidas.some(p => p.corda === posicao.corda && p.casa === posicao.casa)) continue;
      if (tipo === 'arpejo' && escolhidas.length) {
        const anterior = escolhidas[escolhidas.length - 1].midi;
        if (contorno === 'subindo' && posicao.midi <= anterior) continue;
        if (contorno === 'descendo' && posicao.midi >= anterior) continue;
      }

      escolhidas.push(posicao);
      if (cordasDistintas) cordasUsadas.add(posicao.corda);

      const vaoOk = vaoCasasOk(escolhidas, maxVaoCasas);
      const midiOk = maxVaoMidi == null || (() => {
        const midis = escolhidas.map(p => p.midi);
        return Math.max(...midis) - Math.min(...midis) <= maxVaoMidi;
      })();

      if (vaoOk && midiOk) yield* backtrack(indice + 1);

      escolhidas.pop();
      if (cordasDistintas) cordasUsadas.delete(posicao.corda);
      if (limite !== null && geradas >= limite) return;
    }
  }

  yield* backtrack(0);
}

export interface DigitacaoDoModo {
  grauFundamental: number;
  tons: Tom[];
  fingering: Encaixe[];
}

/** Atalho: digitações do acorde pedido, em cada grau do modo. */
export function* digitacoesDoModo(
  modo: Modo, grausDoAcorde: readonly number[] = [1, 3, 5, 7], opcoes: OpcoesBusca & { limitePorAcorde?: number | null } = {},
): Generator<DigitacaoDoModo> {
  for (const { grauFundamental, tons } of acordesDiatonicos(modo, grausDoAcorde)) {
    for (const fingering of buscarDigitacoes(tons, { ...opcoes, limite: opcoes.limitePorAcorde ?? opcoes.limite })) {
      yield { grauFundamental, tons, fingering };
    }
  }
}

/** Atalho: digitações de uma receita cromática, sem passar por um modo. */
export function* digitacoesDaReceita(fundamental: Note, id: ChordId, opcoes: OpcoesBusca = {}): Generator<Encaixe[]> {
  yield* buscarDigitacoes(tonsPorReceita(fundamental, id), opcoes);
}
