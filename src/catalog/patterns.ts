// Motor de padrões (FM-1): regras de percurso sobre uma escala.
//
// Dada uma escala e uma regra, devolve a sequência de POSIÇÕES a tocar. Não conhece braço, áudio,
// tela nem instrumento — é uma função pura, e é de propósito: o mesmo motor serve "Percorrer
// escalas" no baixo e "Solfejar escalas" sem instrumento nenhum.
//
// A regra que faz tudo funcionar (catalogo.md): o padrão é definido por **posição na escala**,
// nunca por número de grau. Assim o mesmo padrão vale igual para pentatônicas, diatônicas e
// simétricas, sem nenhum caso especial.
//
// Exemplo que ilustra por quê, e que está travado em teste: na pentatônica maior de Dó
// (Dó Ré Mi Sol Lá), o motivo que o músico chama de "1-2-3-5" é, em posições, `0 1 2 3` —
// quatro posições consecutivas. No passo seguinte vira `1 2 3 4`, que ele chama de "2-3-5-6".
// Os NOMES dos graus mudam porque a pentatônica pula graus; o padrão não muda.

/**
 * Uma posição na escala. `0` é a tônica, `tamanho` é a tônica uma oitava acima.
 *
 * **Pode passar de `tamanho` e pode ser negativa**: é assim que a subida alcança a oitava de cima
 * e que a vizinha inferior do primeiro grau cai na oitava de baixo. Quem converte para altura usa
 * `grauDaPos` e `oitavaDaPos`.
 */
export type Pos = number;

export type Percurso =
  /** 1-2-3-4-5-6-7-8. */
  | { kind: 'sequencial' }
  /** Pares separados por um intervalo de grau: terças = 1-3-2-4-3-5… (`grau: 3`). */
  | { kind: 'intervalo'; grau: number }
  /** Pedal: 1-2-1-3-1-4… O pedal é um grau (1 = tônica). */
  | { kind: 'pedal'; grau?: number }
  /** Nota e vizinha: 1-7-2-1-3-2… com `k: 1`. `k` negativo usa a vizinha de cima. */
  | { kind: 'vizinha'; k: number }
  /** Grupos de n: 1-2-3, 2-3-4, 3-4-5… O `passo` é quanto o grupo anda (padrão 1). */
  | { kind: 'grupos'; n: number; passo?: number };

export type Direcao = 'sobe' | 'desce' | 'ambos';

export interface OpcoesPercurso {
  /** Até que posição a subida vai. Padrão: `tamanho`, ou seja, uma oitava. */
  ate?: number;
  /** Padrão: 'sobe'. */
  direcao?: Direcao;
  /**
   * Índices **na sequência produzida** cujas notas sobem uma oitava. É o que força saltos entre
   * cordas, em vez de o braço resolver tudo em linha reta.
   */
  saltoDeOitava?: number[];
}

/** Em que grau da escala a posição cai, sempre dentro de `[0, tamanho)`. */
export function grauDaPos(pos: Pos, tamanho: number): number {
  return ((pos % tamanho) + tamanho) % tamanho;
}
/** Quantas oitavas acima (ou abaixo, se negativo) da tônica a posição está. */
export function oitavaDaPos(pos: Pos, tamanho: number): number {
  return Math.floor(pos / tamanho);
}

/**
 * O percurso faz sentido nesta escala?
 *
 * Nem todo padrão cabe em toda escala: "sétimas" é um salto de 6 posições, e numa pentatônica
 * (5 posições) isso passa da oitava — o par deixaria de ser uma sétima e viraria outra coisa.
 * A tela usa isto para não oferecer o que não se aplica, em vez de oferecer e sair vazio.
 */
export function aplicavel(tamanho: number, p: Percurso): boolean {
  switch (p.kind) {
    case 'intervalo':
      return p.grau - 1 < tamanho && p.grau >= 2;
    case 'grupos':
      return p.n >= 2 && p.n <= tamanho;
    case 'pedal':
      return (p.grau ?? 1) - 1 < tamanho;
    case 'vizinha':
      return Math.abs(p.k) < tamanho;
    case 'sequencial':
      return true;
  }
}

/** A sequência ascendente de um percurso, de 0 até `ate`. */
function subida(p: Percurso, ate: number): Pos[] {
  const out: Pos[] = [];
  switch (p.kind) {
    case 'sequencial':
      for (let i = 0; i <= ate; i++) out.push(i);
      return out;

    case 'intervalo': {
      // "terças" (grau 3) são um salto de 2 posições; o nome é 1-based, a posição é 0-based
      const salto = p.grau - 1;
      for (let i = 0; i + salto <= ate; i++) out.push(i, i + salto);
      return out;
    }

    case 'pedal': {
      const pedal = (p.grau ?? 1) - 1;
      for (let i = 0; i <= ate; i++) {
        if (i === pedal) continue;
        out.push(pedal, i);
      }
      return out;
    }

    case 'vizinha':
      for (let i = 0; i <= ate; i++) out.push(i, i - p.k);
      return out;

    case 'grupos': {
      const passo = p.passo ?? 1;
      for (let inicio = 0; inicio + p.n - 1 <= ate; inicio += passo) {
        for (let j = 0; j < p.n; j++) out.push(inicio + j);
      }
      return out;
    }
  }
}

/**
 * Percorre a escala segundo a regra.
 *
 * `desce` é o **espelho** da subida — a mesma sequência de trás para frente. É o que faz
 * "terças descendentes" sair 8-6-7-5-6-4, que é o que o músico espera.
 *
 * Devolve `[]` quando o percurso não se aplica à escala (ver `aplicavel`).
 */
export function percorrer(tamanho: number, p: Percurso, o: OpcoesPercurso = {}): Pos[] {
  if (tamanho < 2) throw new Error(`escala precisa de pelo menos 2 notas, veio ${tamanho}`);
  // devolve vazio em vez de lançar: o catálogo pode oferecer uma combinação que não cabe, e a tela
  // resolve isso escondendo o preset (ver `aplicavel`), não quebrando no meio da prática
  if (!aplicavel(tamanho, p)) return [];
  const ate = o.ate ?? tamanho;
  const sobe = subida(p, ate);

  let seq: Pos[];
  if (o.direcao === 'desce') {
    seq = [...sobe].reverse();
  } else if (o.direcao === 'ambos') {
    const desce = [...sobe].reverse();
    // sem repetir o ápice, que é a última da subida e a primeira da descida
    seq = [...sobe, ...(desce[0] === sobe[sobe.length - 1] ? desce.slice(1) : desce)];
  } else {
    seq = sobe;
  }

  if (o.saltoDeOitava?.length) {
    const quais = new Set(o.saltoDeOitava);
    seq = seq.map((pos, i) => (quais.has(i) ? pos + tamanho : pos));
  }
  return seq;
}

// ---------------------------------------------------------------------------
// Presets: o vocabulário que a pessoa vê. Nomeados pelo que ela FAZ, nunca por uma sequência
// bruta de números (catalogo.md). Os rótulos traduzidos ficam em src/i18n, pela chave.
// ---------------------------------------------------------------------------

export interface PresetPadrao {
  id: string;
  percurso: Percurso;
  direcao: Direcao;
}

export const PRESETS: PresetPadrao[] = [
  { id: 'sequencial', percurso: { kind: 'sequencial' }, direcao: 'ambos' },
  { id: 'tercas', percurso: { kind: 'intervalo', grau: 3 }, direcao: 'sobe' },
  { id: 'tercas-desc', percurso: { kind: 'intervalo', grau: 3 }, direcao: 'desce' },
  { id: 'quartas', percurso: { kind: 'intervalo', grau: 4 }, direcao: 'sobe' },
  { id: 'quintas', percurso: { kind: 'intervalo', grau: 5 }, direcao: 'sobe' },
  { id: 'sextas', percurso: { kind: 'intervalo', grau: 6 }, direcao: 'sobe' },
  { id: 'setimas', percurso: { kind: 'intervalo', grau: 7 }, direcao: 'sobe' },
  { id: 'pedal-tonica', percurso: { kind: 'pedal', grau: 1 }, direcao: 'ambos' },
  { id: 'vizinha-abaixo', percurso: { kind: 'vizinha', k: 1 }, direcao: 'sobe' },
  { id: 'vizinha-acima', percurso: { kind: 'vizinha', k: -1 }, direcao: 'sobe' },
  { id: 'grupos-3', percurso: { kind: 'grupos', n: 3 }, direcao: 'ambos' },
  { id: 'grupos-4', percurso: { kind: 'grupos', n: 4 }, direcao: 'ambos' },
  { id: 'grupos-3-saltando', percurso: { kind: 'grupos', n: 3, passo: 3 }, direcao: 'sobe' },
];

export const presetById = Object.fromEntries(PRESETS.map(p => [p.id, p])) as Record<string, PresetPadrao | undefined>;
