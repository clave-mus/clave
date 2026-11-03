// Planos de compassos para a "tarefa com metrônomo" (decisões 15, 81 e 83). Funções puras.
//
// É o motor que serve a cinco famílias: deslocamento de acento (T3), subdivisão alternada (T4),
// sustentar e cortar (T6), legato e staccato alternados (T7) e deslocamento de padrão rítmico (T8).
// Cada família é uma **declaração** sobre este motor — um plano diferente —, não uma tela diferente.
//
// Um plano é **um ciclo de compassos** que a tela repete. Cada compasso diz o que tocar em cada
// célula (uma por subdivisão), o que a pessoa está fazendo agora, e — no compasso anterior a uma
// mudança — o que vem depois: **a mudança é avisada um compasso antes**, porque o ponto de T4 e T7 é
// justamente fazer o que a pessoa não consegue fazer sozinha (mudar a própria programação enquanto
// toca) sem pegá-la de surpresa.
//
// **Não há andamento aqui, nem progressão dele.** O andamento é da tela, configurável e neutro
// (decisão 82): o plano nunca o sobe sozinho.
import type { MessageKey } from '../i18n';
import type { Grade, Padrao } from './deslocamento';

/** O que acontece numa célula. */
export type Celula =
  | 'forte'    // acento: o clique mais alto
  | 'normal'   // clique comum
  | 'ataque'   // a nota é tocada aqui (sustentar e cortar, deslocamento)
  | 'segura'   // a nota continua soando
  | 'corte'    // a nota é cortada aqui, no tempo
  | 'silencio'; // nada

export interface Texto { chave: MessageKey; vars?: Record<string, string | number> }

export interface Compasso {
  /** Uma célula por subdivisão, em ordem. */
  celulas: Celula[];
  /** Quantas células cabem em um tempo: 1 só os tempos, 2 colcheias, 3 tercinas, 4 semicolcheias. */
  porTempo: number;
  /** O que a pessoa está fazendo neste compasso. */
  agora: Texto;
  /** O que muda no compasso seguinte. Só existe no último compasso antes da mudança. */
  aviso?: Texto;
}

export type Plano = Compasso[];

const TEMPOS = 4;
const repete = <T>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i));
const comAviso = (plano: Compasso[], porRodada: number, aviso: (rodada: number) => Texto): Compasso[] =>
  plano.map((c, i) => ((i + 1) % porRodada === 0 ? { ...c, aviso: aviso(Math.floor(i / porRodada)) } : c));

/**
 * T3 · deslocamento de acento. A subdivisão acentuada anda uma casa a cada rodada, e a pessoa toca
 * as MESMAS notas — o que muda é só a ênfase. (Na T8 é o contrário: os instantes de ataque mudam.)
 * Um ciclo tem `porTempo` rodadas, e a última volta à primeira.
 */
export function planoAcento(porTempo: number, compassosPorRodada: number): Plano {
  if (!Number.isInteger(porTempo) || porTempo < 2 || porTempo > 4) throw new RangeError(`planoAcento: porTempo de 2 a 4, veio ${porTempo}`);
  if (!Number.isInteger(compassosPorRodada) || compassosPorRodada < 1) throw new RangeError(`planoAcento: compassosPorRodada ≥ 1, veio ${compassosPorRodada}`);
  const plano = repete(porTempo, k =>
    repete(compassosPorRodada, () => ({
      celulas: repete(TEMPOS * porTempo, c => (c % porTempo === k ? 'forte' : 'normal') as Celula),
      porTempo,
      agora: { chave: 'cadence.accentOn' as const, vars: { pos: k + 1, of: porTempo } },
    }))).flat();
  return comAviso(plano, compassosPorRodada, r => ({ chave: 'cadence.accentNext', vars: { pos: ((r + 1) % porTempo) + 1 } }));
}

const SUB = (s: number) => `cadence.sub_${s}` as MessageKey;
const PROXIMA_SUB = (s: number) => `cadence.nextSub_${s}` as MessageKey;

/**
 * T4 · subdivisão alternada. O clique fica no mesmo andamento e **a subdivisão muda** a cada
 * rodada, avisada um compasso antes. É a única das famílias de técnica que a pessoa não consegue
 * fazer sozinha: ninguém muda a própria programação de subdivisão enquanto toca.
 */
export function planoSubdivisao(subdivisoes: number[], compassosPorRodada: number): Plano {
  if (subdivisoes.length < 2) throw new RangeError('planoSubdivisao: precisa de pelo menos duas subdivisões para alternar');
  if (subdivisoes.some(s => !Number.isInteger(s) || s < 1 || s > 4)) throw new RangeError(`planoSubdivisao: subdivisões de 1 a 4, veio ${subdivisoes}`);
  if (new Set(subdivisoes).size !== subdivisoes.length) throw new RangeError('planoSubdivisao: subdivisões repetidas');
  if (!Number.isInteger(compassosPorRodada) || compassosPorRodada < 1) throw new RangeError(`planoSubdivisao: compassosPorRodada ≥ 1, veio ${compassosPorRodada}`);
  const plano = subdivisoes.flatMap(s =>
    repete(compassosPorRodada, () => ({
      // o início de cada tempo é 'forte' para a pulsação ficar ancorada; as subdivisões são 'normal'
      celulas: repete(TEMPOS * s, c => (c % s === 0 ? 'forte' : 'normal') as Celula),
      porTempo: s,
      agora: { chave: SUB(s) },
    })));
  return comAviso(plano, compassosPorRodada, r => ({ chave: PROXIMA_SUB(subdivisoes[(r + 1) % subdivisoes.length]) }));
}

/**
 * T7 · legato e staccato alternados: a mesma passagem, e **o app decide quando trocar** a
 * articulação. O app não ouve como a pessoa toca — ele só marca o momento da troca, e a avaliação
 * é dela (autoavaliação, decisão 37).
 */
export function planoArticulacao(compassosPorFase: number): Plano {
  if (!Number.isInteger(compassosPorFase) || compassosPorFase < 1) throw new RangeError(`planoArticulacao: compassosPorFase ≥ 1, veio ${compassosPorFase}`);
  const fases = [
    { agora: 'cadence.legato' as const, depois: 'cadence.nextStaccato' as const },
    { agora: 'cadence.staccato' as const, depois: 'cadence.nextLegato' as const },
  ];
  const plano = fases.flatMap(f => repete(compassosPorFase, () => ({
    celulas: repete(TEMPOS, c => (c === 0 ? 'forte' : 'normal') as Celula), porTempo: 1, agora: { chave: f.agora },
  })));
  return comAviso(plano, compassosPorFase, r => ({ chave: fases[r].depois }));
}

/**
 * T6 · sustentar e cortar: manter a nota `segurar` tempos exatos e **cortar no tempo**. Quase
 * ninguém treina *parar* uma nota na hora — e no baixo isso é metade do que faz uma linha soar firme.
 * A nota corta dentro do compasso: de 1 a `TEMPOS − 1` tempos.
 */
export function planoSustentar(segurar: number): Plano {
  if (!Number.isInteger(segurar) || segurar < 1 || segurar > TEMPOS - 1) throw new RangeError(`planoSustentar: segurar de 1 a ${TEMPOS - 1}, veio ${segurar}`);
  const celulas: Celula[] = ['ataque', ...repete(segurar - 1, () => 'segura' as Celula), 'corte', ...repete(TEMPOS - segurar - 1, () => 'silencio' as Celula)];
  return [{ celulas, porTempo: 1, agora: { chave: 'cadence.hold', vars: { count: segurar, cut: segurar + 1 } } }];
}

/**
 * T8 · deslocamento de padrão rítmico (decisão 83): o padrão de um tempo, repetido em todos os
 * tempos do compasso. O modo (qual rotação) é escolhido por fora — é o eixo rotacionável, de
 * avanço manual —, então o plano é de **um compasso só**.
 *
 * O primeiro tempo da célula ancora a pulsação mesmo quando o padrão não ataca nele.
 */
export function planoDeslocamento(padrao: Padrao, grade: Grade): Plano {
  const um = repete(grade, i => (padrao.includes(i) ? 'ataque' : i === 0 ? 'normal' : 'silencio') as Celula);
  return [{ celulas: repete(TEMPOS, () => um).flat(), porTempo: grade, agora: { chave: 'cadence.shiftNow' } }];
}

// ---------------------------------------------------------------------------
// Para o executor
// ---------------------------------------------------------------------------

/** Quantas células tem um ciclo inteiro. */
export const celulasDoCiclo = (plano: Plano) => plano.reduce((n, c) => n + c.celulas.length, 0);

export interface Posicao {
  compasso: number;
  celula: number;
  /** É a primeira célula do compasso? É aí que o executor troca a subdivisão do relógio. */
  inicioDeCompasso: boolean;
  /** A célula abre um tempo (múltiplo de `porTempo`)? */
  inicioDeTempo: boolean;
}

/** Onde cai o passo `i` (0, 1, 2…) dentro do ciclo, que se repete para sempre. */
export function posicaoNoCiclo(plano: Plano, i: number): Posicao {
  const total = celulasDoCiclo(plano);
  let resto = ((i % total) + total) % total;
  for (let c = 0; c < plano.length; c++) {
    if (resto < plano[c].celulas.length) {
      return { compasso: c, celula: resto, inicioDeCompasso: resto === 0, inicioDeTempo: resto % plano[c].porTempo === 0 };
    }
    resto -= plano[c].celulas.length;
  }
  throw new Error('posicaoNoCiclo: inalcançável');
}

/** O som de uma célula, ou `null` para silêncio. `drum` e `volume` são os do motor de áudio. */
export function somDaCelula(celula: Celula, inicioDeTempo: boolean): { drum: 'clique' | 'clique-forte' | 'aro'; volume: number } | null {
  switch (celula) {
    case 'forte': case 'ataque': return { drum: 'clique-forte', volume: 0.9 };
    case 'corte': return { drum: 'aro', volume: 0.7 };
    case 'segura': return { drum: 'clique', volume: 0.35 };
    case 'silencio': return null;
    case 'normal': return { drum: 'clique', volume: inicioDeTempo ? 0.55 : 0.3 };
  }
}
