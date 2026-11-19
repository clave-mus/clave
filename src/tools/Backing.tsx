// Backing track sandbox: progressão, levada, análise harmônica e sugestão de escalas.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { atTime, Clock, drum, tone, type Drum, type Voice } from '../audio/engine';
import { saveSettings, useStore } from '../state/store';
import {
  buildScale, chordSymbol, CHORDS, harmonicField, majorTonic, midi, mod, note, noteName, pc, transpose,
  type ChordId, type Convention, type Note, type ScaleId,
  type ModoDoCampo,
} from '../theory/core';
import { emprestimosDoCampo } from '../theory/campo-harmonico';
import { voicingsDe } from '../theory/voicings';
import Fretboard, { TUNINGS } from '../components/music/Fretboard';
import Keyboard from '../components/music/Keyboard';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useLocale, useNaming, useT, type MessageKey } from '../i18n';

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
interface Acorde { deg: number; type?: ChordId; flat?: boolean; emp?: string; dur?: Duracao }
/**
 * **Quanto um acorde dura, em compassos** (decisão dele em 19/11, da revisão).
 *
 * Antes todo acorde durava exatamente um compasso, e isso é o limite que mais aparece quando se
 * tenta escrever música de verdade: não havia ii–V dentro do mesmo compasso nem tônica de dois.
 */
type Duracao = 0.5 | 1 | 2;
const DURACOES: Duracao[] = [0.5, 1, 2];
interface Marca { mod: Tonalidade }
type Item = Acorde | Marca;
interface Tonalidade { fifths: number; mode: ModoDoCampo }
const ehMarca = (i: Item): i is Marca => 'mod' in i;
/** A tônica de uma tonalidade. As três menores partem da relativa menor, como o resto da tela. */
const tonicaDe = ({ fifths, mode }: Tonalidade): Note =>
  (mode === 'maior' ? majorTonic(fifths) : transpose(majorTonic(fifths), { num: 6, semis: 9 }));
type Style = 'rock' | 'balada' | 'samba' | 'swing' | 'shuffle' | 'valsa' | 'nenhum';
interface Preset { id: string; name: MessageKey; mode: ModoDoCampo; items: Item[]; style: Style; bpm: number; tetrads: boolean }

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
interface Groove {
  grid: number; tempos: number; kick: number[]; snare: number[]; hat: number[]; rim?: number[];
  bass: [number, GrauDoBaixo, number][]; comp: [number, number][];
  /**
   * **Micro-tempo**: o deslocamento de cada semicolcheia dentro do tempo, em **fração da
   * semicolcheia** — um valor por subdivisão, começando na que cai no tempo.
   *
   * Pedido dele em 19/11 para o samba: *"um atraso sutil (de uns 12 ms em 120 bpm) na segunda
   * semicolcheia e adiantamento na terceira e quarta (de uns 20 ms em 120 bpm)"*.
   *
   * **Em fração, e não em milissegundos**, e esta é a escolha que eu tomei: a 120 bpm a semicolcheia
   * tem 125 ms, então 12 ms são 9,6% dela e 20 ms são 16%. Guardando a fração, o balanço continua o
   * mesmo balanço em qualquer andamento (a 98 bpm do preset dá 14,7 e 24,5 ms); guardando os
   * milissegundos, ele encolheria proporcionalmente ao acelerar e sumiria no andamento rápido. Se
   * você quiser os milissegundos fixos, é trocar o multiplicador por um número.
   *
   * ⚠️ O deslocamento é **sempre relativo ao tempo nominal** do passo, nunca acumulado: a primeira
   * semicolcheia de cada tempo fica em zero, então o pulso não anda. É o que separa balanço de
   * relógio errado.
   */
  micro?: readonly number[];
}

/** Quanto este passo se desloca, em segundos. `sd` é a duração de um passo. */
export function desvioDoPasso(g: Pick<Groove, 'grid' | 'tempos' | 'micro'>, step: number, sd: number): number {
  if (!g.micro) return 0;
  const porTempo = g.grid / g.tempos;
  return (g.micro[step % porTempo] ?? 0) * sd;
}
/**
 * **O baixo fala por nome**, e não por semitom — e isto é o conserto do defeito que o Paulo ouviu em
 * 19/11: *"as linhas de baixo estão sempre meio estranhas no acorde vii diminuto"*.
 *
 * O número `7` queria dizer "a quinta" e era somado **cru** à fundamental: num vii diminuto a quinta
 * é **diminuta** (6 semitons), então o baixo tocava um fá♯ sobre um Si°, que não é nota do acorde.
 * A terça já saía do acorde (`degs[1]`); a quinta, não. Com nome, `quinta` pergunta ao acorde.
 *
 * `quintaGrave` é a quinta **abaixo** da fundamental — pedido dele para o samba, e é como se toca.
 */
export type GrauDoBaixo = 'raiz' | 'terca' | 'quinta' | 'quintaGrave' | 'sexta' | 'aprox';
export const GROOVES: Record<Style, Groove> = {
  rock: { grid: 16, tempos: 4, kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [[0, 'raiz', 2], [2, 'raiz', 2], [4, 'raiz', 2], [6, 'raiz', 2], [8, 'raiz', 2], [10, 'raiz', 2], [12, 'raiz', 2], [14, 'quinta', 2]], comp: [[0, 6], [6, 2], [8, 8]] },
  balada: { grid: 16, tempos: 4, kick: [0, 7, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [[0, 'raiz', 6], [6, 'raiz', 2], [8, 'quinta', 8]], comp: [[0, 16]] },
  /**
   * **O samba**, com a linha de baixo que ele ditou em 19/11 — e esta é a terceira versão dela.
   *
   * *"é pra ser um tempo em cada nota, tipo — colcheia pontuada e semicolcheia na tônica, aí
   * colcheia pontuada e semicolcheia na quinta, depois repete"*.
   *
   * Então **um tempo por nota harmônica**, e dentro do tempo a dupla característica: colcheia
   * pontuada (3 passos) + semicolcheia (1 passo), as duas na mesma nota. Tônica no primeiro tempo,
   * quinta **grave** no segundo, e repete — oito ataques no compasso.
   *
   * As duas versões anteriores eram minhas leituras das palavras dele, e ficam registradas porque o
   * erro foi meu: primeiro seis ataques herdados do código antigo, depois "semicolcheias pontuadas"
   * em todas as notas (1,5 passo), que era a frase dele lida ao pé da letra no lugar errado — a
   * pontuação é da **colcheia**, e a semicolcheia que a segue é que fecha o tempo.
   *
   * A semicolcheia cai no último passo do tempo, onde o micro-tempo a **adianta** 27 ms (a 88 bpm):
   * é ela que dá a antecipação do samba, e as duas coisas se encaixam sem ninguém combinar.
   */
  samba: { grid: 16, tempos: 4, kick: [4, 12], snare: [2, 5, 7, 10, 13, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], bass: [
    [0, 'raiz', 3], [3, 'raiz', 1],
    [4, 'quintaGrave', 3], [7, 'quintaGrave', 1],
    [8, 'raiz', 3], [11, 'raiz', 1],
    [12, 'quintaGrave', 3], [15, 'quintaGrave', 1],
  ], comp: [[2, 2], [5, 2], [7, 3], [10, 2], [13, 3]], micro: [0, 0.096, -0.16, -0.16] },
  swing: { grid: 12, tempos: 4, kick: [0, 6], snare: [], hat: [0, 3, 5, 6, 9, 11], rim: [3, 9], bass: [[0, 'raiz', 3], [3, 'terca', 3], [6, 'quinta', 3], [9, 'aprox', 3]], comp: [[0, 3], [5, 4]] },
  shuffle: { grid: 12, tempos: 4, kick: [0, 6], snare: [3, 9], hat: [0, 2, 3, 5, 6, 8, 9, 11], bass: [[0, 'raiz', 2], [2, 'raiz', 1], [3, 'terca', 2], [5, 'terca', 1], [6, 'quinta', 2], [8, 'quinta', 1], [9, 'sexta', 2], [11, 'quinta', 1]], comp: [[2, 1], [5, 1], [8, 1], [11, 1]] },
  /**
   * **Valsa**: 3 tempos, 12 passos. O baixo faz o que valsa faz — fundamental no 1 e a quinta nos
   * outros dois —, e a caixa marca 2 e 3. É a única levada ternária, e entrou para o compasso
   * ternário deixar de ser impossível; outras ternárias são conteúdo musical, e isso é escolha dele.
   */
  valsa: { grid: 12, tempos: 3, kick: [0], snare: [4, 8], hat: [0, 4, 8], bass: [[0, 'raiz', 4], [4, 'quinta', 4], [8, 'quinta', 4]], comp: [[4, 4], [8, 4]] },
  nenhum: { grid: 16, tempos: 4, kick: [], snare: [], hat: [], bass: [[0, 'raiz', 16]], comp: [[0, 16]] },
};

/**
 * A altura de um grau do baixo. **A quinta e a terça vêm do acorde**, não de uma soma fixa: é o que
 * faz o vii diminuto soar como ele é.
 */
export function alturaDoBaixo(grau: GrauDoBaixo, raiz: number, type: ChordId, proximaRaiz: number): number {
  const doAcorde = (i: number) => CHORDS[type].degs[i]?.[1] ?? [0, 4, 7][i];
  switch (grau) {
    case 'raiz': return raiz;
    case 'terca': return raiz + doAcorde(1);
    case 'quinta': return raiz + doAcorde(2);
    // Uma oitava abaixo da quinta do acorde: num diminuto são 6 semitons, e a grave fica a 6 abaixo.
    case 'quintaGrave': return raiz + doAcorde(2) - 12;
    case 'sexta': return raiz + 9;
    /**
     * **A aproximação CONDUZ**, e isto era um defeito: ela sorteava o lado (`Math.random()`), então a
     * mesma progressão aproximava por cima numa volta e por baixo na outra — a nota mais importante
     * da linha de baixo mudava de lugar a cada laço do loop.
     *
     * A regra é a de um baixista: aproxima-se **contra o movimento**. Subindo para a fundamental
     * seguinte, entra-se por baixo (um semitom abaixo dela); descendo, por cima. Quando as duas
     * fundamentais são a mesma nota, por baixo, que é o que soa como condução e não como erro.
     */
    case 'aprox': return proximaRaiz + (proximaRaiz > raiz ? -1 : proximaRaiz < raiz ? 1 : -1);
  }
}
const STYLE_NAMES: Record<Style, MessageKey> = {
  rock: 'backing.styleRock', balada: 'backing.styleBallad', samba: 'backing.styleSamba',
  swing: 'backing.styleSwing', shuffle: 'backing.styleShuffle', valsa: 'backing.styleWaltz', nenhum: 'backing.styleNone',
};
const VOICES: [Voice, MessageKey][] = [['piano', 'voices.piano'], ['pad', 'voices.pad'], ['violao', 'voices.violao'], ['orgao', 'voices.orgao']];

// ---------------- harmonia ----------------
interface Resolved { root: Note; type: ChordId; symbol: string; roman: string; scales: { id: ScaleId; root: Note; why: MessageKey }[]; tom: Tonalidade; vozes: number[]; dur: Duracao }
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function romanFor(deg: number, type: ChordId, flat: boolean, conv: Convention) {
  const minor = ['menor', 'm7', 'dim', 'm7b5', 'dim7'].includes(type);
  const r = (flat ? '♭' : '') + (minor ? ROMAN[deg - 1].toLowerCase() : ROMAN[deg - 1]);
  return r + sufixoRomano(type, conv);
}
function resolve(item: Acorde, tom: Tonalidade, tetrads: boolean, conv: Convention): Resolved {
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
    chords.push({ ...r, vozes: voicingDoAcorde(r.root, r.type, chords.length ? chords[chords.length - 1].vozes : null) });
  }
  // A tonalidade do FIM é onde um acorde novo cairia — é ela que manda nos botões de grau.
  return { chords, porItem, noFim: tom };
}

/**
 * **A linha do tempo da progressão, em passos da grade.**
 *
 * Era um acorde por compasso (`Math.floor(i / grid) % chords.length`), e com duração isso não serve.
 * Aqui cada acorde ganha janela própria, e o relógio pergunta "que acorde está soando no passo X?".
 *
 * ⚠️ **O loop fecha em compasso inteiro.** Se a soma das durações cair no meio de um compasso (três
 * acordes de meio, por exemplo), o último estica até o fim do compasso — porque a levada é periódica
 * por compasso (`i % grid`), e um loop quebrado faria a bateria entrar fora de fase com a harmonia a
 * cada volta. Esticar é a única saída que mantém as duas em acordo.
 */
export function linhaDoTempo(chords: readonly { dur?: Duracao }[], grid: number) {
  const janelas: { inicio: number; fim: number }[] = [];
  let passo = 0;
  for (const c of chords) {
    const passos = Math.max(1, Math.round((c.dur ?? 1) * grid));
    janelas.push({ inicio: passo, fim: passo + passos });
    passo += passos;
  }
  const total = Math.max(grid, Math.ceil(passo / grid) * grid);
  // o último estica até o fim do compasso, para o loop fechar redondo
  if (janelas.length) janelas[janelas.length - 1].fim = total;
  return { janelas, total };
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
 * **O voicing do acompanhamento, com condução de vozes** — e isto é o conserto do defeito mais audível
 * da ferramenta, achado medindo em 19/11.
 *
 * O que havia: `55 + mod(pc + semi - 55, 12)`, que **colapsa o acorde numa oitava só**. Medido, o que
 * saía: dó maior em segunda inversão (G3 C4 E4), o Cmaj7 com o si colado no dó (G3 B3 C4 E4) e o Am7
 * com o sol colado no lá (G3 A3 C4 E4) — aglomerado na região grave, que é onde isso mais encardi. E
 * nenhuma relação com o acorde anterior: cada um era calculado sozinho.
 *
 * O que entra: `theory/voicings.ts`, o motor que a Tônica de ouvido usa — duas mãos, qualquer grau no
 * baixo, a quinta saindo quando o acorde tem extensão. De todos os voicings do acorde, escolhe-se o
 * que **move menos** em relação ao que soou antes: é o que faz um acompanhamento soar tocado em vez
 * de digitado.
 *
 * O primeiro acorde não tem anterior, e aí a referência é o **centro** (dó4 e redor): sem isso a
 * progressão podia começar no canto do teclado e descer a vida toda.
 */
const CENTRO = [55, 60, 64, 67];
/** A distância entre dois acordes: cada nota do novo até a mais próxima do antigo, somada. */
function distancia(novo: readonly number[], antigo: readonly number[]): number {
  const dele = (m: number) => Math.min(...antigo.map(a => Math.abs(a - m)));
  return novo.reduce((soma, m) => soma + dele(m), 0) / novo.length;
}
/**
 * **Quanto este voicing encardi embaixo** — e esta peça nasceu de medir a anterior.
 *
 * Mover pouco, sozinho, escolhe o voicing mais **compacto**: medindo com só esse critério, o Cmaj7
 * saía `G3 B3 C4 E4` (si colado no dó) e o Am7 `E3 G3 A3 C4` (sol colado no lá) — exatamente o
 * aglomerado que eu havia criticado na função antiga. Um pianista não põe segunda na região grave.
 *
 * A regra é de prática, e por isso é fato e não gosto: **abaixo do dó central, nada menor que uma
 * terça menor** entre vozes vizinhas. Cada infração custa, e quanto mais grave, mais custa.
 */
function encardido(ms: readonly number[]): number {
  let custo = 0;
  for (let i = 1; i < ms.length; i++) {
    const intervalo = ms[i] - ms[i - 1];
    if (ms[i - 1] < 60 && intervalo < 3) custo += (3 - intervalo) * (ms[i - 1] < 52 ? 3 : 2);
  }
  return custo;
}
function voicingDoAcorde(root: Note, type: ChordId, anterior: readonly number[] | null): number[] {
  /**
   * O teto é **dó6** e não sol6: num acompanhamento o acorde não pode brigar com a melodia de quem
   * está tocando por cima, e o motor sozinho chega a alturas que invadem essa faixa.
   */
  const opcoes = voicingsDe(root, type, { teto: 84 });
  if (!opcoes.length) return CHORDS[type].degs.map(([, semi]) => 55 + mod(pc(root) + semi - 55, 12)).sort((a, b) => a - b);
  const alvo = anterior ?? CENTRO;
  let melhor = opcoes[0];
  let menor = Infinity;
  for (const v of opcoes) {
    const ms = v.todas.map(midi);
    // o critério é mover pouco; o desempate é a nota mais aguda ficar perto da de antes
    const d = distancia(ms, alvo) + encardido(ms) + Math.abs(Math.max(...ms) - Math.max(...alvo)) / 24;
    if (d < menor) { menor = d; melhor = v; }
  }
  return melhor.todas.map(midi).sort((a, b) => a - b);
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
const GUARDADO = 'backing';
/**
 * ⚠️ **Os três interruptores de som entram junto** (`contagem`, `baixo`, `timbre do acorde`), e isto
 * foi uma inconsistência que a própria conferência mostrou: recarregando, a levada e o andamento
 * voltavam e a contagem não — "por que ele lembrou da valsa e esqueceu a minha contagem?". Como
 * podem faltar numa versão guardada antes, são opcionais na leitura.
 */
interface Guardado {
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

export default function Backing({ presetId }: { presetId?: string }) {
  const [params] = useSearchParams();
  const naming = useNaming();
  const conv = useLocale();
  const t = useT();
  const instrument = useStore(s => s.profile.instrument);
  /**
   * De onde vem o estado inicial, nesta ordem: **o preset pedido** (rota ou `?p=`, que é intenção
   * explícita), o que ficou **guardado** da última vez, e só então o primeiro preset.
   */
  const pedido = PRESETS.find(p => p.id === (presetId ?? params.get('p')));
  const guardado = useStore(s => s.settings[GUARDADO]);
  const salvo = pedido ? null : lerGuardado(guardado?.progressao);
  const initial = pedido ?? PRESETS[0];
  const [fifths, setFifths] = useState(salvo?.fifths ?? 0);
  const [mode, setMode] = useState(salvo?.mode ?? initial.mode);
  const [items, setItems] = useState<Item[]>(salvo?.items ?? initial.items);
  const [tetrads, setTetrads] = useState(salvo?.tetrads ?? initial.tetrads);
  const [style, setStyle] = useState<Style>(salvo?.style ?? initial.style);
  const [bpm, setBpm] = useState(salvo?.bpm ?? initial.bpm);
  const [compVoice, setCompVoice] = useState<Voice>(salvo?.compVoice ?? 'piano');
  const [bassOn, setBassOn] = useState(salvo?.bassOn ?? true);
  /**
   * **Os acordes também desligam** (pedido dele em 19/11: *"adicione a opção de ter só bateria
   * também"*). Com os dois desligados sobra a levada sozinha, que é o metrônomo com balanço — e com
   * acordes desligados e baixo ligado sobra a linha de baixo, que serve para quem quer tocar por
   * cima dela.
   */
  const [acordesOn, setAcordesOn] = useState(salvo?.acordesOn ?? true);
  /**
   * **Dois compassos de claves antes de a progressão entrar** (da revisão de 19/11).
   *
   * Sem isso a ferramenta entra frio no primeiro tempo: quem está com o instrumento na mão não tem
   * como chegar junto. Ligado por padrão, porque o caso de uso é tocar por cima.
   */
  const [contagem, setContagem] = useState(salvo?.contagem ?? true);
  const [running, setRunning] = useState(false);
  const [bar, setBar] = useState(0);
  const [view, setView] = useState<'teclado' | 'braco'>(instrument === 'piano' ? 'teclado' : 'braco');
  /**
   * **O item selecionado da progressão** (índice em `items`), que é ao mesmo tempo o alvo da edição e
   * o **ponto de inserção**: um acorde novo entra depois dele.
   *
   * Um conceito só, e não dois: com a seleção no último compasso — que é onde ela fica depois de
   * montar —, inserir depois dela é exatamente o "acrescentar no fim" de antes. A tela diz onde o
   * próximo acorde vai cair, então não há adivinhação.
   */
  const [sel, setSel] = useState<number | null>(null);
  /** Para onde a próxima marca de modulação aponta. Começa na quarta acima, que é a mais comum. */
  const [destino, setDestino] = useState<Tonalidade>({ fifths: initial.mode === 'maior' ? -1 : -1, mode: initial.mode });
  const clock = useRef<Clock | null>(null);
  const tonic = useMemo(() => (mode === 'maior' ? majorTonic(fifths) : transpose(majorTonic(fifths), { num: 6, semis: 9 })), [fifths, mode]);  // menor, harmônica e melódica partem da relativa menor
  // O que a pessoa praticou: a tonalidade e o andamento. Só a tonalidade vai em `params`, porque é só
  // ela que esta ferramenta usa — gravar região e material seria afirmar o que ela ignora.
  useToolLog('backing', 'Backing track', 'perception.harmonic', running, {
    // `key.mode` só tem maior e menor; o modo exato (harmônica, melódica) vai nas configurações
    settings: { bpm, campo: mode }, params: { key: { tonic: pc(tonic), mode: mode === 'maior' ? 'maior' : 'menor' } },
  });
  const progressao = useMemo(() => resolverProgressao(items, { fifths, mode }, tetrads, conv), [items, fifths, mode, tetrads, conv]);
  const chords = progressao.chords;
  /**
   * **Os botões de grau são do campo em vigor no FIM da progressão**, e não do campo inicial: é ali
   * que um acorde novo cai. Sem isso, depois de modular para fá maior a tela ofereceria os graus de
   * dó e escreveria o acorde errado — o botão diria "V" e o acorde sairia no V antigo.
   */
  const tomDoFim = progressao.noFim;
  const tonicaDoFim = useMemo(() => tonicaDe(tomDoFim), [tomDoFim]);
  const field = useMemo(() => harmonicField(tonicaDoFim, tomDoFim.mode, tetrads, conv), [tonicaDoFim, tomDoFim.mode, tetrads, conv]);
  /** Os empréstimos do campo em vigor no fim. Só maior e menor têm lista curada — ver `Marca`. */
  const emprestimos = useMemo(
    () => (tomDoFim.mode === 'maior' || tomDoFim.mode === 'menor' ? emprestimosDoCampo(tomDoFim.mode) : []),
    [tomDoFim.mode]);
  const live = useRef({ chords, style, bassOn, compVoice, acordesOn });
  live.current = { chords, style, bassOn, compVoice, acordesOn };

  // Guarda a cada mudança. É escrita no estado global, que já persiste — nada de `localStorage` à mão.
  useEffect(() => {
    saveSettings(GUARDADO, { progressao: JSON.stringify({ items, fifths, mode, tetrads, style, bpm, contagem, bassOn, acordesOn, compVoice } satisfies Guardado) });
  }, [items, fifths, mode, tetrads, style, bpm, contagem, bassOn, acordesOn, compVoice]);

  useEffect(() => () => clock.current?.stop(), []);
  /**
   * **O compasso que está soando entra na tela.** Medido em 19/11: num celular, doze compassos dão
   * uma faixa de 1556 px, e o destaque passava fora da vista — a pessoa perdia o lugar.
   *
   * `block: 'nearest'` de propósito: ele só rola se precisar, então em tela larga (onde tudo cabe)
   * nada se move. E respeita `prefers-reduced-motion`, porque rolagem animada é movimento.
   */
  useEffect(() => {
    if (!running) return;
    const el = document.querySelector('.backing-compasso.soando');
    if (!(el instanceof HTMLElement)) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: suave ? 'smooth' : 'auto' });
  }, [bar, running]);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);

  /** Põe um item **depois do selecionado** — ou no fim, quando não há seleção. */
  const inserir = (novo: Item) => {
    setItems(v => {
      const onde = sel === null || sel >= v.length ? v.length : sel + 1;
      const fora = [...v.slice(0, onde), novo, ...v.slice(onde)];
      return fora;
    });
    setSel(s2 => (s2 === null ? null : s2 + 1));
  };
  /** Tira o item selecionado — compasso ou marca de modulação. */
  const removerSelecionado = () => {
    if (sel === null) return;
    setItems(v => v.filter((_, i) => i !== sel));
    setSel(s2 => (s2 === null ? null : Math.max(0, Math.min(s2, items.length - 2))));
    setBar(0);
  };
  /** Muda a duração do compasso selecionado. Marca de modulação não tem duração. */
  const mudarDuracao = (d: Duracao) => {
    if (sel === null) return;
    setItems(v => v.map((it, i) => (i === sel && !ehMarca(it) ? { ...it, dur: d } : it)));
  };
  const itemSel = sel === null ? undefined : items[sel];
  /** "Fá maior", "Lá menor" — o nome de uma tonalidade, para a marca e para o painel. */
  const nomeDoTom = (tom: Tonalidade) => `${noteName(tonicaDe(tom), naming)} ${t(`backing.mode_${tom.mode}`).toLowerCase()}`;

  const start = () => {
    if (running) { clock.current?.stop(); setRunning(false); return; }
    const g0 = GROOVES[style];
    /**
     * A contagem vive **dentro** do relógio, como um atraso: dois compassos em que só a clave soa.
     * Fazê-la com `setTimeout` antes de iniciar o relógio poria o início da música no relógio da
     * tela, e o relógio do áudio não é o da tela — é a regra do projeto.
     */
    const atraso = contagem ? 2 * g0.grid : 0;
    const c = new Clock(bpm, g0.grid / g0.tempos, (i, t) => {
      const { chords: cs, style: st, bassOn: bo, compVoice: cv } = live.current;
      /**
       * ⚠️ **Ausente quer dizer LIGADO**, e não desligado. O Paulo relatou em 19/11 que os acordes
       * tinham parado de soar com o chip aceso — e a causa era recarga quente de módulo: o relógio
       * já vinha do código novo (com o interruptor) e a `live` ainda do antigo (sem ele), então
       * `acordesOn` chegava `undefined` e o `if` calava tudo.
       *
       * O conserto dele é recarregar a página, mas o padrão certo é este: quando não se sabe, a
       * ferramenta **soa**. Vale também para configuração guardada antes de o interruptor existir.
       */
      const ao = live.current.acordesOn !== false;
      const g = GROOVES[st];
      if (!cs.length) return;
      if (i < atraso) {
        // clave em cada tempo, e a primeira de cada compasso mais forte
        const passoNaContagem = i % g0.grid;
        if (passoNaContagem % (g0.grid / g0.tempos) === 0) drum(passoNaContagem === 0 ? 'clique-forte' : 'clique', t, 0.9);
        return;
      }
      const step = (i - atraso) % g.grid;
      /**
       * **Que acorde está soando neste passo** — a linha do tempo responde, e não mais a conta de
       * "um acorde por compasso". Um acorde de meio compasso troca no meio dele, e a levada (que é
       * periódica por compasso) segue andando por baixo sem saber de nada.
       */
      // Recalculada a cada passo de propósito: a pessoa pode editar a progressão **tocando**, e uma
      // linha do tempo congelada no `start()` tocaria a progressão de antes. São poucos objetos por
      // semicolcheia, e correção vale mais que a alocação.
      const { janelas, total } = linhaDoTempo(cs, g.grid);
      const pos = (i - atraso) % total;
      const bi = Math.max(0, janelas.findIndex(j => pos >= j.inicio && pos < j.fim));
      const ch = cs[bi];
      const nextCh = cs[(bi + 1) % cs.length];
      const sd = 60 / (clock.current?.bpm ?? bpm) / (g.grid / g.tempos);
      // o destaque troca quando o ACORDE troca, não a cada compasso
      if (pos === janelas[bi].inicio) atTime(t, () => setBar(bi));
      /**
       * **O micro-tempo desloca tudo o que soa neste passo** — bateria, baixo e acorde juntos. É o
       * ponto: o balanço é da seção rítmica inteira, e deslocar só um instrumento soaria como erro
       * de quem está tocando, não como levada.
       *
       * O relógio agenda com antecedência (ver `Clock.start`), então um adiantamento de poucos
       * milissegundos continua no futuro — medido, o maior desvio possível (16% da semicolcheia a
       * 50 bpm) são 48 ms, dentro dos 80 ms de antecedência.
       */
      const tq = t + desvioDoPasso(g, step, sd);
      const hit = (arr: number[] | undefined, k: Drum, v = 1) => arr?.includes(step) && drum(k, tq, v);
      hit(g.kick, 'bumbo'); hit(g.snare, 'caixa', st === 'samba' ? 0.45 : 1); hit(g.hat, 'chimbal', step % (g.grid / g.tempos) === 0 ? 0.9 : 0.55); hit(g.rim, 'aro', 0.8);
      const rootMidi = 36 + mod(pc(ch.root) - 36, 12);
      if (bo) g.bass.forEach(([s, grau, d]) => {
        if (s !== step) return;
        const proxima = 36 + mod(pc(nextCh.root) - 36, 12);
        tone(alturaDoBaixo(grau, rootMidi, ch.type, proxima), tq, d * sd * 0.92, 'baixo', 0.9);
      });
      if (ao) g.comp.forEach(([s, d]) => s === step && ch.vozes.forEach(m => tone(m, tq, d * sd * 0.95, cv, cv === 'pad' ? 0.8 : 0.45)));
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };

  const loadPreset = (p: Preset) => {
    setItems(p.items); setMode(p.mode); setStyle(p.style); setBpm(p.bpm); setTetrads(p.tetrads); setBar(0); setSel(null);
    if (clock.current) clock.current.stepsPerBeat = GROOVES[p.style].grid / GROOVES[p.style].tempos;
  };
  const changeStyle = (s: Style) => { setStyle(s); if (clock.current) clock.current.stepsPerBeat = GROOVES[s].grid / GROOVES[s].tempos; };

  const cur = chords[Math.min(bar, chords.length - 1)];
  const [scaleIdx, setScaleIdx] = useState(0);
  const sc = cur?.scales[Math.min(scaleIdx, cur.scales.length - 1)];
  const scaleNotes = sc ? buildScale(sc.root, sc.id) : [];
  const chordPcs = cur ? CHORDS[cur.type].degs.map(([, s]) => mod(pc(cur.root) + s, 12)) : [];
  const scalePcs = scaleNotes.map(pc);
  /**
   * **A janela do teclado cobre o que SOA**, e não três oitavas fixas.
   *
   * Era 48–83 cravado: 36 teclas em 339 px de celular dão teclas de 9 px, que ninguém acerta com o
   * dedo nem lê. Agora ela parte do acorde que está soando e abre **duas oitavas** em volta, em
   * fronteiras de dó — oitava inteira para o desenho não cortar escala no meio.
   */
  const faixaDoTeclado = (() => {
    const base = cur?.vozes.length ? Math.min(...cur.vozes) : 55;
    const lo = Math.max(36, Math.floor(base / 12) * 12);
    return { lo, hi: Math.min(96, lo + 24) };
  })();
  const kMarks: Record<number, string> = {};
  for (let m = faixaDoTeclado.lo; m <= faixaDoTeclado.hi; m++) {
    if (chordPcs.includes(m % 12)) kMarks[m] = 'var(--ve)';
    else if (scalePcs.includes(m % 12)) kMarks[m] = 'var(--mu)';
  }
  const tuning = instrument === 'baixo' ? TUNINGS.baixo : TUNINGS.violao;
  const fMarks = tuning.flatMap((open, s) => Array.from({ length: 13 }, (_, f) => f).filter(f => scalePcs.includes(mod(open + f, 12))).map(f => ({
    s, f, color: chordPcs.includes(mod(open + f, 12)) ? 'var(--ve)' : undefined, label: noteName(scaleNotes[scalePcs.indexOf(mod(open + f, 12))] ?? note(0), naming),
  })));

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="panel" style={{ display: 'grid', gap: 14 }}>
        <div className="row"><span className="eyebrow">{t('backing.readyMade')}</span>{PRESETS.map(p => <Chip key={p.id} onClick={() => loadPreset(p)}>{t(p.name)}</Chip>)}</div>
        <div className="row">
          <span className="eyebrow">{t('backing.key')}</span>
          <select className="sel" value={fifths} onChange={e => setFifths(Number(e.target.value))} aria-label={t('backing.tonality')} id="bk-tom">
            {Array.from({ length: 13 }, (_, i) => i - 6).map(f => <option key={f} value={f}>{noteName(mode === 'maior' ? majorTonic(f) : transpose(majorTonic(f), { num: 6, semis: 9 }), naming)}</option>)}
          </select>
          {/* As duas menores alteradas entraram a pedido do Paulo: o campo delas traz o III aumentado,
              o V maior na menor, e os acordes m(7M) e 7M(♯5). */}
          {(['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as const).map(m => (
            <Chip key={m} on={mode === m} onClick={() => setMode(m)}>{t(`backing.mode_${m}`)}</Chip>
          ))}
          <Chip on={tetrads} onClick={() => setTetrads(v => !v)}>{t('backing.tetrads')}</Chip>
        </div>
      </section>

      {/* A tinta desta faixa é dela (`--on-area`), não `--ink`: o azul é fixo e a tinta do tema
          inverte, e era por isso que ela ficava ilegível — ver `.backing-faixa` no CSS. */}
      <section className="backing-faixa">
        {/* A progressão na ordem em que foi escrita: as marcas de modulação aparecem entre os
            compassos, porque é onde elas agem. `porItem` liga item → compasso que soa. */}
        <div className="row" style={{ alignItems: 'stretch' }}>
          {items.map((it, k) => {
            if (ehMarca(it)) return (
              <button key={k} type="button" onClick={() => setSel(k)} aria-pressed={sel === k}
                className={`backing-marca ${sel === k ? 'sel' : ''}`}>⇢ {nomeDoTom(it.mod)}</button>
            );
            const i = progressao.porItem[k] ?? 0;
            const c = chords[i];
            if (!c) return null;
            return (
              <button key={k} type="button" onClick={() => { setBar(i); setSel(k); }}
                className={`backing-compasso ${running && i === bar ? 'soando' : i === bar ? 'aqui' : ''} ${sel === k ? 'sel' : ''}`}>
                <div className="cifra">{c.symbol}</div>
                <div className="roman">{c.roman}{c.dur !== 1 ? ` · ${c.dur === 0.5 ? '½' : c.dur}` : ''}</div>
              </button>
            );
          })}
        </div>
        <div className="row">
          <Btn onClick={start} tone={running ? 'mu' : undefined}>{t(running ? 'common.stop' : 'common.playPlay')}</Btn>
          <span className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30 }}>♩ = {bpm}</span>
          <input className="range" style={{ maxWidth: 220 }} type="range" min={50} max={220} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label={t('common.tempo')} id="bk-bpm" />
        </div>
        <div className="row"><span className="eyebrow">{t('backing.groove')}</span>{(Object.keys(STYLE_NAMES) as Style[]).map(s => <Chip key={s} on={style === s} onClick={() => changeStyle(s)}>{t(STYLE_NAMES[s])}</Chip>)}</div>
        <div className="row">
          <span className="eyebrow">{t('backing.chordSound')}</span>
          {VOICES.map(([v, l]) => <Chip key={v} on={compVoice === v} onClick={() => setCompVoice(v)}>{t(l)}</Chip>)}
          <Chip on={acordesOn} onClick={() => setAcordesOn(v => !v)}>{t('backing.chords')}</Chip>
          <Chip on={bassOn} onClick={() => setBassOn(v => !v)}>{t('backing.bass')}</Chip>
          <Chip on={contagem} onClick={() => setContagem(v => !v)}>{t('backing.countIn')}</Chip>
        </div>
      </section>

      <section className="panel" style={{ display: 'grid', gap: 10 }}>
        {/* ⚠️ **O enunciado fala da tonalidade do FIM**, como os botões — e isto era um defeito que a
            tela mostrou: com a modulação carregada, os chips vinham de lá menor e a frase acima
            deles ainda dizia "dó maior". Rótulo que descreve outra coisa que o controle é pior que
            rótulo nenhum. */}
        <div className="eyebrow">{t(tomDoFim.mode === 'maior' ? 'backing.buildYoursMajor' : 'backing.buildYoursMinor', { tonic: noteName(tonicaDoFim, naming) })}</div>
        <div className="row">
          {field.map(d => <Chip key={d.degree} onClick={() => inserir({ deg: d.degree })}><b>{d.roman}</b> · {d.symbol}</Chip>)}
        </div>
        {/* **Os empréstimos vêm da lista curada do `ouvido-campo`** — mesma lista, mesmos acordes.
            Nas duas menores alteradas não há lista curada, e a fileira não aparece (decisão 13). */}
        {emprestimos.length > 0 && (
          <div className="row">
            <span className="eyebrow">{t('backing.borrowed')}</span>
            {emprestimos.map(e => {
              const r = resolve({ deg: e.grau, emp: e.id }, tomDoFim, tetrads, conv);
              return <Chip key={e.id} onClick={() => inserir({ deg: e.grau, emp: e.id })}><b>{r.roman}</b> · {r.symbol}</Chip>;
            })}
          </div>
        )}
        {/* A modulação é uma MARCA: ela entra onde está o fim da progressão e vale do ponto em diante. */}
        <div className="row">
          <span className="eyebrow">{t('backing.modulateTo')}</span>
          <select className="sel" value={destino.fifths} onChange={e => setDestino(d => ({ ...d, fifths: Number(e.target.value) }))}
            aria-label={t('backing.modulateTo')} id="bk-mod-tom">
            {Array.from({ length: 13 }, (_, i) => i - 6).map(f2 => (
              <option key={f2} value={f2}>{noteName(tonicaDe({ fifths: f2, mode: destino.mode }), naming)}</option>
            ))}
          </select>
          <select className="sel" value={destino.mode} onChange={e => setDestino(d => ({ ...d, mode: e.target.value as ModoDoCampo }))}
            aria-label={t('backing.field')} id="bk-mod-campo">
            {(['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as const).map(m => (
              <option key={m} value={m}>{t(`backing.mode_${m}`)}</option>
            ))}
          </select>
          <Btn small tone="ghost" onClick={() => inserir({ mod: destino })}>{t('backing.addModulation')}</Btn>
        </div>
        {/* **O compasso selecionado**: duração e remoção. É o que responde ao "para consertar o
            sétimo compasso de um blues eu apago seis". */}
        {itemSel && (
          <div className="row">
            <span className="eyebrow">{ehMarca(itemSel) ? t('backing.selectedMark') : t('backing.selectedBar', { n: String((progressao.porItem[sel!] ?? 0) + 1) })}</span>
            {!ehMarca(itemSel) && DURACOES.map(d => (
              <Chip key={d} on={(itemSel.dur ?? 1) === d} onClick={() => mudarDuracao(d)}>
                {d === 0.5 ? t('backing.durHalf') : d === 1 ? t('backing.durOne') : t('backing.durTwo')}
              </Chip>
            ))}
            <Btn small tone="ghost" onClick={removerSelecionado}>{t('backing.removeSelected')}</Btn>
          </div>
        )}
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>
            {sel === null || sel >= items.length - 1 ? t('backing.insertAtEnd') : t('backing.insertAfter', { n: String((progressao.porItem[sel] ?? 0) + 1) })}
          </span>
          <Btn small tone="ghost" onClick={() => { setItems(v => v.slice(0, -1)); setSel(null); }} disabled={!items.length}>{t('backing.deleteLast')}</Btn>
          <Btn small tone="ghost" onClick={() => { setItems([]); setBar(0); setSel(null); }}>{t('backing.clear')}</Btn>
        </div>
      </section>

      {cur && (
        <section className="panel" style={{ display: 'grid', gap: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow">{t('backing.overChord', { chord: cur.symbol, roman: cur.roman })}</div>
              <div className="row" style={{ marginTop: 8 }}>
                {cur.scales.map((s, i) => <Chip key={s.id} on={i === Math.min(scaleIdx, cur.scales.length - 1)} onClick={() => setScaleIdx(i)}>{noteName(s.root, naming)} {t(`theory.scales.${s.id}` as MessageKey)} ({t(s.why)})</Chip>)}
              </div>
            </div>
            <div className="row">
              <Chip on={view === 'teclado'} onClick={() => setView('teclado')}>{t('backing.keyboard')}</Chip>
              <Chip on={view === 'braco'} onClick={() => setView('braco')}>{t('backing.neck')}</Chip>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            {t('backing.notesLine', { notes: scaleNotes.map(n => noteName(n, naming)).join(' · ') })} <span style={{ color: 'var(--ve)' }}>■</span> {t('backing.chordNotes')} · <span style={{ color: 'var(--mu)' }}>■</span> {t('backing.restOfScale')}
          </div>
          {view === 'teclado'
            ? <Keyboard lo={faixaDoTeclado.lo} hi={faixaDoTeclado.hi} marks={kMarks} naming={naming} />
            : <Fretboard tuning={tuning} from={0} to={12} marks={fMarks} naming={naming} />}
        </section>
      )}
    </div>
  );
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
