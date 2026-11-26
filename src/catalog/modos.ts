/**
 * **Os modos das três famílias**, com o nome que a tela usa.
 *
 * Saiu de dentro do `escala-no-instrumento` em 26/11, quando o `ouvido-escala` passou a oferecer os
 * mesmos modos: a lista de famílias e o mapa de nomes tradicionais estavam prontos para virar duas
 * cópias que divergiriam na primeira correção.
 *
 * ## A convenção do nome é dele, e vale nos dois itens
 *
 * Decidida em 25/11 e reafirmada em 26/11: **o grau no enunciado** (*"o 4º modo da menor
 * melódica"*) e **o nome tradicional na revelação**, quando existe.
 *
 * O argumento: contar o grau é o que o exercício treina, funciona igual nas três famílias, e evita
 * batizar vinte e um modos — mas quem já conhece "lídio dominante" encontra o nome ao conferir.
 */
import type { FamiliaBase } from '../theory/digitacoes';
import type { Ctx } from './types';
import { ordinal, type MessageKey } from './helpers';

/** As três famílias que os exercícios oferecem. A menor natural é o 6º grau da maior. */
export const FAMILIAS_DE_MODO: [FamiliaBase, MessageKey][] = [
  ['maior', 'scaleOnInstrument.family_maior'],
  ['menor-harmonica', 'scaleOnInstrument.familyHarmonica'],
  ['menor-melodica-jazz', 'scaleOnInstrument.familyMelodica'],
];

export const nomeDaFamilia = (f: FamiliaBase): MessageKey =>
  FAMILIAS_DE_MODO.find(([id]) => id === f)?.[1] ?? 'scaleOnInstrument.family_maior';

/**
 * Os modos que têm nome de uso corrente. Os outros se dizem pelo grau, e está certo assim —
 * inventar nome para o 3º modo da menor harmônica seria afirmar um uso que não existe.
 */
export const NOME_TRADICIONAL: Record<string, MessageKey | undefined> = {
  'maior:2': 'scaleOnInstrument.mode_dorico',
  'maior:3': 'scaleOnInstrument.mode_frigio',
  'maior:4': 'scaleOnInstrument.mode_lidio',
  'maior:5': 'scaleOnInstrument.mode_mixolidio',
  'maior:6': 'scaleOnInstrument.mode_eolio',
  'maior:7': 'scaleOnInstrument.mode_locrio',
  'menor-harmonica:5': 'scaleOnInstrument.mode_frigioDominante',
  'menor-melodica-jazz:4': 'scaleOnInstrument.mode_lidioDominante',
  'menor-melodica-jazz:7': 'scaleOnInstrument.mode_superlocrio',
};

/** `4º modo da Menor melódica` — como o enunciado e as alternativas se referem a um modo. */
export const rotuloDoModo = (ctx: Ctx, familia: FamiliaBase, grau: number): string =>
  ctx.t('modes.ofFamily', { degree: ordinal(grau, ctx.conv), family: ctx.t(nomeDaFamilia(familia)) });

/** O mesmo, com o nome tradicional entre parênteses quando ele existe. É o texto da revelação. */
export const rotuloComNome = (ctx: Ctx, familia: FamiliaBase, grau: number): string => {
  const tradicional = NOME_TRADICIONAL[`${familia}:${grau}`];
  const base = rotuloDoModo(ctx, familia, grau);
  return tradicional ? `${base} · ${ctx.t(tradicional)}` : base;
};
