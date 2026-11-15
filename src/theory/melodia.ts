/**
 * Melodias curtas sorteadas, para a linha **Melodia** do ouvido relativo.
 *
 * Este arquivo é o motivo pelo qual a direção `audiar` mudou de casa (decisão do Paulo em
 * 12/11/2026): uma nota solta não tem gerador, mas uma melodia tem — quantas notas, de que notas,
 * em que extensão, com que salto máximo. Esse gerador é da linha Melodia, e se o "oposto" (ler a
 * melodia e audiá-la) morasse num item de notação, aquele item precisaria do mesmo gerador. Motor
 * duplicado é proibido, então quem tem o gerador tem as duas direções.
 *
 * Nada aqui conhece tela nem tonalidade: recebe as classes de altura permitidas e a faixa, devolve
 * alturas MIDI. Quem resolve tonalidade e material é `catalog/contexto-musical.ts`.
 */
export const MIN_NOTAS = 2;
export const MAX_NOTAS = 8;
/** Salto máximo padrão entre duas notas seguidas: uma quinta justa (decisão do Paulo). */
export const SALTO_PADRAO = 7;

export interface PedidoDeMelodia {
  /** Classes de altura permitidas (0–11). Vem do material e da tonalidade. */
  pcs: number[];
  /** A faixa em que a melodia pode andar, em MIDI. */
  lo: number;
  hi: number;
  /** Quantas notas. */
  n: number;
  /** Salto máximo entre notas seguidas, em semitons. */
  saltoMax: number;
  /** Injetável para o teste ser determinístico, como em `amostrasDeCorda`. */
  rnd?: () => number;
}

/**
 * Uma melodia de `n` alturas, cada uma a no máximo `saltoMax` semitons da anterior.
 *
 * **Nota nunca repete logo em seguida.** É a regra que o Paulo escreveu para a linha Nota — *"nunca
 * repetir a exata mesma nota 2 vezes seguidas"* — e dentro de uma melodia ela vale pelo mesmo
 * motivo, só mais forte: duas iguais coladas soam como uma nota mais longa, e a pessoa responderia
 * duas notas tendo ouvido uma.
 *
 * Quando o salto não deixa nenhuma candidata (faixa curta, poucas classes permitidas), o salto é
 * afrouxado para aquela nota em vez de a melodia sair menor. Melodia com menos notas que o pedido
 * seria mentir sobre a configuração; um salto maior é só menos fácil.
 */
export function sortearMelodia(p: PedidoDeMelodia): number[] {
  const rnd = p.rnd ?? Math.random;
  const permitidas: number[] = [];
  for (let m = p.lo; m <= p.hi; m++) if (p.pcs.includes(((m % 12) + 12) % 12)) permitidas.push(m);
  if (!permitidas.length) return Array.from({ length: p.n }, (_, i) => p.lo + i);

  const escolher = (de: number[]) => de[Math.floor(rnd() * de.length)];
  const melodia = [escolher(permitidas)];
  while (melodia.length < p.n) {
    const anterior = melodia[melodia.length - 1];
    const perto = permitidas.filter(m => m !== anterior && Math.abs(m - anterior) <= p.saltoMax);
    // Sem candidata no salto pedido, vale qualquer outra nota: a quantidade pedida é promessa, o
    // salto é preferência.
    const de = perto.length ? perto : permitidas.filter(m => m !== anterior);
    if (!de.length) break;
    melodia.push(escolher(de));
  }
  return melodia;
}
