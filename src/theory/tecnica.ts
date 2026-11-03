// Geradores da área de técnica (decisão 81). Funções puras, sem interface nenhuma.
//
// O critério que os seleciona: *em técnica, a contribuição do app é escolher o que a pessoa não
// escolheria.* Sozinha ela toca 1-2-3-4 e 4-3-2-1; os geradores existem para entregar as outras.
//
// **Enumerar e medir, nunca eleger** (decisão 71): cada um devolve a lista completa de valores, e
// quem anda por ela é a pessoa (avanço manual, decisão 38).

/**
 * Todas as ordenações de 1..n, em ordem lexicográfica, como texto (`'2413'`).
 *
 * Geradas, e não escritas à mão, porque escrever 24 permutações à mão é como se esquece uma — e o
 * exercício depende de serem todas. Limitado a 6 (720): com mais cordas que isso a lista deixa de
 * ser percorrível, e nenhum instrumento do Clave as tem.
 */
export function permutacoesDe(n: number): string[] {
  if (!Number.isInteger(n) || n < 1 || n > 6) throw new RangeError(`permutacoesDe: n deve ir de 1 a 6, veio ${n}`);
  const permutar = (restantes: number[], prefixo: number[]): string[] =>
    restantes.length
      ? restantes.flatMap((d, i) => permutar([...restantes.slice(0, i), ...restantes.slice(i + 1)], [...prefixo, d]))
      : [prefixo.join('')];
  return permutar(Array.from({ length: n }, (_, i) => i + 1), []);
}

/**
 * Em qual índice de corda (0 = a mais grave) cai o número de corda `numero`.
 *
 * **A convenção é a de todo músico de cordas: a corda 1 é a mais AGUDA.** No baixo de quatro, 1 é
 * Sol e 4 é Mi. Por isso "4 2 3 1" começa na corda mais grave.
 */
export const indiceDaCorda = (numero: number, cordas: number) => cordas - numero;

// ---------------------------------------------------------------------------
// Troca de posição (T5)
// ---------------------------------------------------------------------------

/** Deslizar de uma posição da mão para outra, **com um dedo só**. */
export interface Troca { de: number; para: number; dedo: number }

/**
 * Posição é a casa em que o dedo 1 fica por padrão, e o dedo `f` mora em `posição + f − 1` — a regra
 * de um dedo por casa (guia de digitações). Então o dedo `f` sai da casa `de + f − 1` e chega em
 * `para + f − 1`.
 */
export const casasDaTroca = (t: Troca) => ({ de: t.de + t.dedo - 1, para: t.para + t.dedo - 1 });

const POSICOES_BASE = [3, 5, 7];
const DISTANCIAS = [-4, -3, -2, -1, 1, 2, 3, 4];

/**
 * Todas as trocas: de três posições-base, para cada distância de 1 a 4 casas nos dois sentidos, com
 * cada um dos quatro dedos — **menos as que cairiam antes da casa 1**, que não existe. Da posição 3,
 * voltar 3 ou 4 casas cai na casa 0 ou na −1; então são 22 pares de posição × 4 dedos = **88**.
 * (A primeira conta que escrevi, 3 × 8 × 4 = 96, esquecia isso, e o teste de casas pegou.)
 *
 * **Os quatro dedos entram todos, e é o ponto:** quase todo mundo desliza com o indicador e foge de
 * deslizar com o anelar ou o mindinho — que é justamente o que precisa de treino.
 */
export function trocasDePosicao(): Troca[] {
  const out: Troca[] = [];
  for (const de of POSICOES_BASE) {
    for (const d of DISTANCIAS) {
      if (de + d < 1) continue;
      for (const dedo of [1, 2, 3, 4]) out.push({ de, para: de + d, dedo });
    }
  }
  return out;
}

export const codificarTroca = (t: Troca) => `${t.de}-${t.para}-${t.dedo}`;

/** Lê uma troca codificada. Devolve `null` para qualquer coisa que não seja uma. */
export function decodificarTroca(texto: string): Troca | null {
  const m = /^(\d+)-(\d+)-([1-4])$/.exec(texto);
  return m ? { de: Number(m[1]), para: Number(m[2]), dedo: Number(m[3]) } : null;
}

// ---------------------------------------------------------------------------
// Subida de andamento (decisões 82 e 93)
// ---------------------------------------------------------------------------

/**
 * A subida de andamento é uma **opção da pessoa, nunca um padrão**: nasce desligada, sobe pouco e
 * devagar, e **para num teto**. Aumentar o andamento demais costuma ser prejudicial, e para muita coisa
 * o melhor é fazer bem devagar — então o app nunca trata bpm como progressão por conta própria.
 */
export const PASSO_DA_SUBIDA = 4;
export const VOLTAS_POR_PASSO = 2;
/** O teto sugerido quando a pessoa liga a subida. Ela escolhe o dela. */
export const TETO_PADRAO = 100;

export interface Subida { ativa: boolean; teto: number }

/**
 * O andamento depois de `voltas` voltas completas desde `base`.
 *
 * Calculado a partir da base, e não somando 4 a cada volta: sem estado acumulado não há deriva, e o
 * resultado é o mesmo qualquer que seja o momento em que se pergunta.
 *
 * **Nunca baixa o que a pessoa escolheu.** Se a base já passa do teto, devolve a base — o teto limita
 * a subida, não corrige a escolha dela.
 */
export function andamentoNaVolta(base: number, voltas: number, s: Subida): number {
  if (!s.ativa || voltas <= 0) return base;
  const subido = base + PASSO_DA_SUBIDA * Math.floor(voltas / VOLTAS_POR_PASSO);
  return Math.max(base, Math.min(subido, s.teto));
}

// ---------------------------------------------------------------------------
// Grupos de cordas (T2)
// ---------------------------------------------------------------------------

/**
 * A ordem das cordas (T2) é sempre de **quatro cordas vizinhas**. Com as seis da guitarra seriam 720
 * ordens, e ninguém percorre 720: o contador de "já vi" perde o sentido, e a lista vira só um sorteio.
 * Com quatro são 24 em qualquer instrumento — e o contador volta a valer.
 *
 * Na guitarra a pessoa escolhe QUAL grupo (E-A-D-G, A-D-G-B ou D-G-B-E); no baixo de quatro só há um.
 */
export const CORDAS_DO_GRUPO = 4;

/** Quantos grupos de quatro cordas vizinhas o instrumento tem. */
export const gruposDeCordas = (cordas: number) => Math.max(1, cordas - CORDAS_DO_GRUPO + 1);

/**
 * Os índices de corda (0 = a mais grave) do grupo `grupo`, da mais grave para a mais aguda. O grupo
 * é preso ao que existe, para uma escolha antiga não apontar para fora do braço.
 */
export function indicesDoGrupo(grupo: number, cordas: number): number[] {
  const g = Math.min(Math.max(0, Math.floor(grupo)), gruposDeCordas(cordas) - 1);
  return Array.from({ length: Math.min(CORDAS_DO_GRUPO, cordas) }, (_, k) => g + k);
}
