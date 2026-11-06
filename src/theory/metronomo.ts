// A grade do metrônomo (M4, 06/11/2026): lógica pura, sem áudio nem tela, para poder testar.
//
// Substitui os dois controles que brigavam ("quais tempos tocam" e "subdivisão") por UM: a grade
// tem `compassos × subdivisao` posições, e cada uma liga/desliga e acentua por conta própria. O
// ciclo de compassos silenciados é outra dimensão, independente da grade — ela decide SE o
// compasso soa; a grade decide O QUE soa dentro dele.
export type EstadoPosicao = 'desligada' | 'ligada' | 'acentuada';

/** O ciclo de edição de uma posição: desligada → ligada (clique fraco) → acentuada → desligada. */
export const PROXIMO_ESTADO: Record<EstadoPosicao, EstadoPosicao> = {
  desligada: 'ligada', ligada: 'acentuada', acentuada: 'desligada',
};

/** A grade padrão: tudo ligado, só a primeira posição do compasso acentuada — o que o metrônomo
 *  sempre tocou, então trocar os controles não muda o som de ninguém de cara. */
export function gradePadrao(compassos: number, subdivisao: number): EstadoPosicao[] {
  return Array.from({ length: compassos * subdivisao }, (_, i) => (i === 0 ? 'acentuada' : 'ligada'));
}

export interface CicloDeCompasso {
  /** Quantos compassos tocam antes de silenciar. */
  tocar: number;
  /** Quantos compassos silenciam depois. 0 = nunca silencia. */
  silenciar: number;
}

export interface Passo {
  /** Posição dentro do compasso (0 a compassos×subdivisao − 1). */
  pos: number;
  /** Qual compasso, desde o início (0, 1, 2…). */
  compasso: number;
  estado: EstadoPosicao;
  /** Se este compasso inteiro está na parte silenciada do ciclo. */
  silenciado: boolean;
  /** O que de fato soa: false se a posição está desligada OU o compasso está silenciado. */
  toca: boolean;
}

/**
 * Decide o que o passo `i` do relógio (0, 1, 2… desde que o metrônomo começou) faz: em que posição
 * da grade ele cai, em que compasso, e se soa.
 *
 * `i` é o índice que `Clock` já produz quando `stepsPerBeat` é passado como a SUBDIVISÃO (não o
 * tamanho da grade inteira) — por isso não é preciso relógio novo: o de `audio/engine.ts` já conta
 * posições dentro do compasso do jeito certo, bastava ler o índice diferente.
 */
export function passoDaGrade(i: number, compassos: number, subdivisao: number, grade: readonly EstadoPosicao[], ciclo: CicloDeCompasso): Passo {
  const total = Math.max(1, compassos * subdivisao);
  const pos = i % total;
  const compasso = Math.floor(i / total);
  const cicloTotal = ciclo.tocar + ciclo.silenciar;
  const silenciado = cicloTotal > 0 && (compasso % cicloTotal) >= ciclo.tocar;
  const estado = grade[pos] ?? 'ligada';
  return { pos, compasso, estado, silenciado, toca: !silenciado && estado !== 'desligada' };
}
