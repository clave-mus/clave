/**
 * Padrões de escala: um desenho de poucas notas que anda pela escala, grau por grau.
 *
 * O mesmo desenho soa diferente em cada posição — é isso que o exercício estuda, e é por isso que
 * um padrão aqui é guardado como **deslocamento em posições da escala**, nunca em semitons nem em
 * graus absolutos. `[0, 2, 1, 4]` na maior começando no grau 1 dá `1-3-2-5`; a mesma lista
 * começando no grau 2 dá `2-4-3-6`. Um só objeto, sete posições.
 *
 * Nada aqui conhece a tela (nem React), e nada aqui sorteia a tonalidade: a altura absoluta é
 * problema de quem toca.
 */
import { mod, pick, scaleDegreeLabels, scaleDegs, type ScaleId } from './core';

/** Deslocamentos em posições da escala. `padrao[0]` é sempre 0; os outros podem repetir e descer. */
export type Padrao = number[];

export interface Posicao {
  /** Índice da posição inicial na escala, 0-based: 0 é o grau 1. */
  inicio: number;
  /** Os graus que soam, por rótulo da escala: `['1','3','2','5']`. */
  graus: string[];
  /** Semitons acima da tônica, com as oitavas já somadas. Pode ser negativo. */
  semis: number[];
}

export const MIN_NOTAS = 3;
export const MAX_NOTAS = 6;

/**
 * A escala em que as terças do campo harmônico são empilhadas.
 *
 * Decisão do Paulo em 09/11/2026, e ele estava certo contra o meu primeiro palpite. Empilhar
 * terças **dentro** de uma pentatônica não dá acorde: no grau I de Dó pentatônica maior sairia
 * Dó–Mi–Lá, que é um Lá menor invertido. Mas a pentatônica é um **subconjunto** de uma escala de
 * sete notas, e o campo dela é o campo dessa escala — que é o que "campo harmônico da pentatônica"
 * quer dizer em música.
 *
 * E isso é melhor do que uniformidade de código: o campo de Dó maior tem Fá e Si, que a
 * pentatônica não tem. A harmonia fica mais larga que o desenho, e o atrito vem exatamente daí.
 *
 * As outras dez escalas têm sete notas e empilham terças nelas mesmas — inclusive os modos, onde a
 * terça empilhada dá o acorde modal certo. Por isso **o resultado tem sempre sete notas**, e há
 * teste conferindo isso nas treze.
 */
const PAI: Partial<Record<ScaleId, ScaleId>> = {
  'penta-maior': 'maior',   // [0,2,4,7,9]  ⊂ [0,2,4,5,7,9,11]
  'penta-menor': 'menor',   // [0,3,5,7,10] ⊂ [0,2,3,5,7,8,10]
  blues: 'menor',           // penta-menor + ♭5
};

export const escalaDoCampo = (id: ScaleId): ScaleId => PAI[id] ?? id;

/** Quantas posições o padrão tem para andar: uma por grau da escala. */
export const quantasPosicoes = (id: ScaleId): number => scaleDegs(id).length;

/**
 * O acorde do grau `grau` (1-based) do campo da escala, em semitons acima da tônica.
 *
 * Empilha terças em `escalaDoCampo`, que é sempre de sete notas, e sobe de oitava ao passar do
 * topo — a mesma conta que o `ouvido-celulas` já usa e que já está certa.
 */
export function acordeDoCampo(escala: ScaleId, grau: number, tetrade = false): number[] {
  const semis = scaleDegs(escalaDoCampo(escala)).map(([, s]) => s);
  const top = semis.length;
  return (tetrade ? [0, 2, 4, 6] : [0, 2, 4]).map(p => {
    const j = grau - 1 + p;
    return semis[mod(j, top)] + 12 * Math.floor(j / top);
  });
}

/**
 * Todas as posições do padrão na escala, de baixo para cima.
 *
 * O rótulo de cada posição (`rotulo`) é **único** dentro de um padrão, porque o primeiro grau já
 * difere — é isso que permite usar o rótulo como `id` de alternativa no exercício, e há teste
 * travando a propriedade nas treze escalas.
 */
export function posicoesDoPadrao(escala: ScaleId, padrao: Padrao): Posicao[] {
  // `scaleDegreeLabels` fecha o desenho com a oitava ("1'"); aqui ela não serve, porque passar do
  // topo é voltar à posição 0 uma oitava acima — a conta de `semis` cuida disso, e o grau é o mesmo.
  const graus = scaleDegreeLabels(escala).slice(0, -1);
  const semis = scaleDegs(escala).map(([, s]) => s);
  const top = semis.length;
  return semis.map((_, inicio) => ({
    inicio,
    graus: padrao.map(d => graus[mod(inicio + d, top)]),
    semis: padrao.map(d => {
      const j = inicio + d;
      return semis[mod(j, top)] + 12 * Math.floor(j / top);
    }),
  }));
}

/** `1-3-2-5` — o que a pessoa lê na alternativa e na posição. */
export const rotulo = (p: Posicao): string => p.graus.join('-');

/**
 * Sorteia um desenho de `n` notas.
 *
 * Passo entre posições vizinhas em ±2 — a mesma regra que faz uma célula ser cantável em
 * `celulaDeGraus`. A diferença é que aqui **repetir grau é permitido** (decisão do Paulo), então o
 * passo 0 entra; o que se recusa é o desenho inteiro parado, e um salto largo demais para caber na
 * escada de uma oitava.
 */
export function sortearPadrao(n: number): Padrao {
  const notas = Math.min(MAX_NOTAS, Math.max(MIN_NOTAS, Math.round(n)));
  const passos = [-2, -1, 0, 1, 2];
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const p: Padrao = [0];
    for (let i = 1; i < notas; i++) p.push(p[i - 1] + pick(passos));
    const amplitude = Math.max(...p) - Math.min(...p);
    if (amplitude >= 1 && amplitude <= 5) return p;
  }
  // Saída determinística: subir a escala. É um padrão legítimo, e evita laço sem fim.
  return Array.from({ length: notas }, (_, i) => i);
}

/** `'0,2,1,4'` → `[0,2,1,4]`. É assim que o padrão viaja da exploração para o exercício. */
export function lerPadrao(s: unknown): Padrao | null {
  if (typeof s !== 'string' || !s.trim()) return null;
  const n = s.split(',').map(x => Number(x.trim()));
  if (n.length < MIN_NOTAS || n.length > MAX_NOTAS) return null;
  if (!n.every(Number.isInteger)) return null;
  if (n[0] !== 0) return null;                      // o primeiro clique é a origem
  if (n.some(x => Math.abs(x) > 12)) return null;
  return n;
}

export const escreverPadrao = (p: Padrao): string => p.join(',');
