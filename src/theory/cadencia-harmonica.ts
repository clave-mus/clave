/*
 * Cadências que estabelecem uma tonalidade, para servirem de **contexto** antes de um exercício de
 * ouvido.
 *
 * ⚠️ **Não confundir com `theory/cadencia.ts`**, que é cadência RÍTMICA — planos de metrônomo,
 * acento e subdivisão. A palavra serve às duas coisas em música, e os dois arquivos existem; o nome
 * deste diz qual é.
 *
 * ## Por que cadência e não só a tônica
 *
 * Uma nota dá a altura e **não dá o modo**: dó serve a dó maior e a lá menor. Uma tríade dá o modo e
 * não dá a função. Uma cadência dá as duas — é o que a música de verdade usa para dizer onde você
 * está, e foi por isso que o Paulo a pediu como padrão do contexto (`OR-ouvido-relativo.md`).
 *
 * ## As duas, escolhidas por ele
 *
 * `ii-V-I` para jazz, e `I-IV-V-I` porque é o jeito mais claro de estabelecer tonalidade. Ele
 * considerou uma terceira (`I-vi-IV-V`) e cortou.
 */
import { mod, type ModoDoCampo } from './core';
import { conduzirAcorde } from './voicings';
import { acordeDoCampo } from './padrao-de-escala';
import type { ScaleId } from './core';

export type CadenciaId = 'ii-V-I' | 'I-IV-V-I';

/** Os graus de cada cadência, em ordem. */
const GRAUS: Record<CadenciaId, number[]> = {
  'ii-V-I': [2, 5, 1],
  'I-IV-V-I': [1, 4, 5, 1],
};

export const CADENCIAS = Object.keys(GRAUS) as CadenciaId[];

/**
 * Até quantos semitons acima da tônica um acorde da cadência pode chegar antes de descer uma oitava.
 *
 * Sem o teto, empilhar terças no grau V ou VII joga o acorde quase duas oitavas acima da tônica, e a
 * cadência deixa de soar como uma progressão no mesmo registro — soa como três acordes subindo.
 */
const TETO_ACIMA_DA_TONICA = 16;

/**
 * Põe um acorde (semitons sobre a tônica) no registro da cadência: desce de oitava até a nota mais
 * aguda caber no teto. Exportada porque o acorde-ALVO de um exercício tem de morar no mesmo
 * registro do contexto — senão a diferença de registro vira pista, e a pergunta deixa de ser
 * sobre harmonia.
 */
export function acordeNoTeto(tonica: number, semis: number[]): number[] {
  let acorde = semis.map(s => tonica + s);
  while (Math.max(...acorde) > tonica + TETO_ACIMA_DA_TONICA) acorde = acorde.map(m => m - 12);
  return acorde;
}

/**
 * Os acordes de uma cadência, em grupos de alturas MIDI, prontos para tocar em sequência.
 *
 * O campo vem de `acordeDoCampo`, que já resolve o modo e a pentatônica — e é por isso que este
 * arquivo não empilha terça nenhuma: motor duplicado é proibido, e aquele já existia com teste.
 */
export function cadenciaHarmonica(
  id: CadenciaId, tonica: number, escala: ScaleId | ModoDoCampo = 'maior', tetrade = false,
): number[][] {
  const acordes = GRAUS[id].map(grau => acordeNoTeto(tonica, acordeDoCampo(escala as ScaleId, grau, tetrade)));
  return conduzirCadencia(acordes, tonica);
}

/**
 * **A cadência com as vozes conduzidas** — e esta é a parte que mudou em 19/11, depois de medir.
 *
 * O que havia: cada acorde empilhado da fundamental para cima, cada um calculado sozinho. Medido em
 * dó maior, o ii–V–I saía `[Ré4 Fá4 Lá4] → [Sol4 Si4 Ré5] → [Dó4 Mi4 Sol4]`, com **3,17 semitons**
 * de movimento médio por voz nas tríades — o V subindo uma oitava inteira e voltando. É o som de
 * teclado de iniciante, e é a primeira coisa que se ouve em quatro itens do catálogo.
 *
 * Agora cada acorde escolhe a oitava de cada nota para ficar perto do anterior (`conduzirAcorde`),
 * que é a mesma peça que o acompanhamento usa desde a revisão. **O primeiro acorde continua onde
 * estava**: ele é a referência de registro da cadência inteira, e mexer nele moveria o contexto
 * para longe do alvo do exercício — a diferença de registro viraria pista (ver `acordeNoTeto`).
 */
export function conduzirCadencia(acordes: number[][], tonica: number): number[][] {
  const faixa = { lo: tonica - 12, hi: tonica + TETO_ACIMA_DA_TONICA, vao: 16 };
  const out: number[][] = [];
  acordes.forEach((acorde, i) => {
    if (i === 0) { out.push(acorde); return; }
    /**
     * ⚠️ **O último acorde fecha em posição fundamental**, e isto foi um guarda do projeto que me
     * pegou: `direcao-audiar.test.ts` exige que o contexto **feche na tônica**, porque é o acorde
     * final que estabelece o centro — e a primeira versão desta função devolvia o I em primeira
     * inversão (`[Mi4 Sol4 Dó5]`), que conduz lindamente e **não fecha nada**.
     *
     * Um músico faz a mesma coisa: as vozes passeiam no meio da cadência e a última chega com a
     * fundamental no baixo. `baixo` prende a nota mais grave à fundamental daquele acorde.
     */
    const ultimo = i === acordes.length - 1;
    out.push(conduzirAcorde(acorde, out[out.length - 1], ultimo ? { ...faixa, baixo: acorde[0] } : faixa));
  });
  return out;
}

/**
 * O acorde-ALVO de um exercício, conduzido a partir do último acorde do contexto.
 *
 * Irmã de `acordeNoTeto`, e pelo mesmo motivo dela: o alvo tem de morar no registro do contexto. A
 * diferença é que agora ele **continua a condução** em vez de recomeçar da fundamental — assim a
 * cadência e a pergunta soam como uma coisa só, e não como três acordes e um anúncio.
 */
export function alvoConduzido(tonica: number, semis: number[], anterior: readonly number[] | null): number[] {
  const base = acordeNoTeto(tonica, semis);
  if (!anterior?.length) return base;
  return conduzirAcorde(base, anterior, { lo: tonica - 12, hi: tonica + TETO_ACIMA_DA_TONICA, vao: 16 });
}

/**
 * Sobe ou desce um conjunto de grupos **por oitavas inteiras** até caber na faixa.
 *
 * Existe porque a tela não pode mentir sobre o que soou (lição de 09/11): se o contexto soa fora do
 * teclado ou do braço desenhado, a pessoa ouve algo que não consegue apontar. E o deslocamento é do
 * conjunto INTEIRO, nunca de acorde solto: mover um acorde sozinho quebraria a condução, que é
 * justamente o que a cadência estabelece.
 *
 * Quando a faixa é mais estreita que o próprio acorde, caber é impossível — aí vale o piso, porque
 * tocar grave demais é menos ruim que tocar acima do teto de quem ouve.
 */
export function caberNaFaixa(grupos: number[][], lo: number, hi: number): number[][] {
  let desloc = 0;
  const min = () => Math.min(...grupos.flat()) + desloc;
  const max = () => Math.max(...grupos.flat()) + desloc;
  while (min() < lo) desloc += 12;
  while (max() > hi && min() - 12 >= lo) desloc -= 12;
  return desloc ? grupos.map(g => g.map(m => m + desloc)) : grupos;
}

/** O último acorde da cadência é o da tônica? É o que faz uma cadência **fechar**. */
export const fechaNaTonica = (id: CadenciaId): boolean => mod(GRAUS[id][GRAUS[id].length - 1], 7) === 1;
