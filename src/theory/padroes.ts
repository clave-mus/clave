// Padrões rítmicos nomeados (F6-11, decisões 84, 85 e 103).
//
// **Um padrão não é uma célula, e isto é a decisão 103.** Célula é material de leitura rítmica e cabe
// num compasso por definição (`rhythm-cells.ts` recusa `span > barTicks`). Padrão é um **colar
// nomeado**, com origem, fonte e revisor, e **o vão é propriedade dele**: a clave de son ocupa dois
// compassos de 4/4, o baião ocupa um. Eram dois objetos sob o mesmo nome — como já tinha acontecido
// com forma e digitação.
//
// A notação é a mesma de `rhythm-cells.ts`, inteira: nenhum motor novo.
//
// ⚠️ **NENHUM padrão está declarado aqui ainda, e isso é a regra bloqueante da decisão 85:**
// sem **revisão de quem conhece a tradição**, o padrão não entra. Nomear e grafar clave, telecoteco
// ou baião é culturalmente específico, e errar não é erro de teoria — é erro de atribuição. As fontes
// já levantadas e as doze perguntas que faltam estão em `docs/padroes-ritmicos.md`.
import { METERS, parsePattern, TPQ, type MeterId, type PatternEvent } from './rhythm-cells';

/** A grade em que os intervalos do padrão se contam. Semicolcheia para os brasileiros, colcheia para a clave. */
export type Grade = '8' | '16';
const GRADE_TICKS: Record<Grade, number> = { '8': TPQ / 2, '16': TPQ / 4 };

/**
 * Quem revisou o padrão **de dentro da tradição** (decisão 85, regra 2).
 *
 * Não tem valor-padrão e não é opcional por acidente: um padrão sem isto existe no arquivo e **não
 * chega a quem usa**. É o que `padroesUsaveis` filtra.
 */
export interface RevisaoDeTradicao {
  por: string;
  /** `AAAA-MM-DD`. */
  em: string;
}

export interface PadraoDef {
  id: string;
  /** Fórmula de compasso em que o padrão se escreve. */
  compasso: MeterId;
  /** Quantos compassos o colar ocupa. É o que a decisão 103 tornou propriedade do padrão. */
  compassos: number;
  grade: Grade;
  /** Na notação de `rhythm-cells.ts`: `8. 8. q 8 q`. */
  pattern: string;
  /** De onde o padrão vem. Texto livre, porque "Cuba" e "Brasil (Nordeste)" não são a mesma coisa. */
  origem: string;
  /** Método, gravação, tese ou pessoa. **Sem fonte o padrão não entra** (decisão 85, regra 1). */
  fonte: string;
  /** Ausente = ninguém de dentro da tradição revisou, e o padrão não chega a quem usa. */
  revisao?: RevisaoDeTradicao;
}

export interface Padrao extends PadraoDef {
  events: PatternEvent[];
  /** Ticks do colar inteiro. */
  span: number;
  /** Quantas casas a grade tem no colar: 16 para a clave em dois compassos de 4/4 em colcheias. */
  casas: number;
  /** Onde os ataques caem, em casas da grade, do início do colar. */
  ataques: number[];
  /** As distâncias entre ataques consecutivos, fechando o colar. A clave de son é `3 3 4 2 4`. */
  intervalos: number[];
}

/** O vão que o padrão declarou, em ticks. */
export const vaoDeclarado = (d: Pick<PadraoDef, 'compasso' | 'compassos'>) => METERS[d.compasso].barTicks * d.compassos;

/**
 * Monta um padrão e **confere que ele fecha o vão que declarou**.
 *
 * O erro é lançado, não tolerado: padrão que não fecha o compasso é colar que gira fora de fase, e
 * descobrir isso na tela é descobrir tarde.
 */
export function montarPadrao(d: PadraoDef): Padrao {
  const events = parsePattern(d.pattern);
  const span = events.reduce((a, e) => a + e.dur, 0);
  const vao = vaoDeclarado(d);
  if (span !== vao) {
    throw new Error(`Padrão "${d.id}": o padrão soma ${span} ticks e declara ${d.compassos} compasso(s) de ${d.compasso} (${vao} ticks)`);
  }
  const casa = GRADE_TICKS[d.grade];
  if (span % casa !== 0) throw new Error(`Padrão "${d.id}": o vão não é múltiplo da grade ${d.grade}`);

  const ataques: number[] = [];
  for (const e of events) {
    if (e.rest) continue;
    if (e.at % casa !== 0) throw new Error(`Padrão "${d.id}": ataque fora da grade ${d.grade} (tick ${e.at})`);
    ataques.push(e.at / casa);
  }
  const casas = span / casa;
  const intervalos = ataques.map((a, n) => (n + 1 < ataques.length ? ataques[n + 1] : ataques[0] + casas) - a);
  return { ...d, events, span, casas, ataques, intervalos };
}

/**
 * Os padrões declarados.
 *
 * **Vazio de propósito.** Ver o aviso no topo: o que falta não é código, é o revisor de tradição.
 * Declarar padrão aqui antes dele é o erro de atribuição que a decisão 85 existe para impedir.
 */
export const PADRAO_DEFS: PadraoDef[] = [];

export const PADROES: Padrao[] = PADRAO_DEFS.map(montarPadrao);

/**
 * Os que podem chegar a quem usa: os que têm fonte **e** revisão de tradição.
 *
 * O item *Identificar o padrão* sorteia daqui. Hoje devolve lista vazia, e é por isso que ele não
 * entra — não é atraso, é a regra 3 da decisão 85 funcionando.
 */
export const padroesUsaveis = (ps: readonly Padrao[] = PADROES): Padrao[] =>
  ps.filter(p => !!p.revisao && p.fonte.trim() !== '');

// ---------------------------------------------------------------------------
// Colares
// ---------------------------------------------------------------------------

/**
 * As rotações de um colar de intervalos, a começar pela própria.
 *
 * Existe para que a afirmação do repositório **seja executável**: a clave de rumba (`3 4 3 2 4`)
 * **não** é uma rotação da de son (`3 3 4 2 4`). São colares diferentes, não modos do mesmo — e
 * escrever numa aula que uma é modo da outra seria erro de atribuição.
 */
export function rotacoesDoColar(intervalos: readonly number[]): number[][] {
  return intervalos.map((_, n) => intervalos.map((__, k) => intervalos[(n + k) % intervalos.length]));
}

/** Um colar é rotação do outro? Compara como colar, não como lista. */
export const mesmoColar = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && rotacoesDoColar(a).some(r => r.every((x, n) => x === b[n]));
