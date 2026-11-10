// Gramática dos nomes de teoria em cada idioma. Não é tradução de palavra por palavra: em português
// o ordinal concorda em gênero e vem antes da qualidade ("3ª maior", "5º grau"); em inglês a
// qualidade vem antes e o ordinal tem sufixo próprio ("major 3rd", "5th degree").
import { quality, type Convention, type Interval, type Quality } from './core';

/** Ordinal em algarismos: 3º / 3ª em português (pelo gênero do substantivo), 3rd em inglês. */
export function ordinal(n: number, conv: Convention, gender: 'm' | 'f' = 'm') {
  if (conv === 'pt') return `${n}${gender === 'm' ? 'º' : 'ª'}`;
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return n + (teen ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'));
}

const PT_QUALITY: Record<Quality, [masc: string, fem: string]> = {
  J: ['justo', 'justa'], M: ['maior', 'maior'], m: ['menor', 'menor'], A: ['aumentado', 'aumentada'], d: ['diminuto', 'diminuta'],
};
const EN_QUALITY: Record<Quality, string> = { J: 'perfect', M: 'major', m: 'minor', A: 'augmented', d: 'diminished' };

/** Nome do intervalo: "3ª maior", "uníssono justo", "oitava justa" / "major 3rd", "perfect unison". */
export function intervalName(iv: Interval, conv: Convention) {
  const q = quality(iv);
  if (conv === 'pt') {
    if (!q) return `${ordinal(iv.num, 'pt', 'f')} (${iv.semis} semitons)`;
    if (iv.num === 1) return `uníssono ${PT_QUALITY[q][0]}`;
    if (iv.num === 8) return `oitava ${PT_QUALITY[q][1]}`;
    return `${ordinal(iv.num, 'pt', 'f')} ${PT_QUALITY[q][1]}`;
  }
  if (!q) return `${ordinal(iv.num, 'en')} (${iv.semis} semitones)`;
  if (iv.num === 1) return `${EN_QUALITY[q]} unison`;
  if (iv.num === 8) return `${EN_QUALITY[q]} octave`;
  return `${EN_QUALITY[q]} ${ordinal(iv.num, 'en')}`;
}

/**
 * Nome curto, para caber numa célula de grade: `6ªm`, `4ª`, `4ª+`, `7ªM` / `6m`, `4`, `4+`, `7M`.
 *
 * A justa não leva marca — "4ª" já é a justa, e escrever "4ªJ" só ocuparia espaço. As outras levam
 * símbolo em vez de palavra, porque aqui a comparação entre sete células é o que importa, e
 * palavra inteira faria a grade quebrar.
 */
export function intervalShort(iv: Interval, conv: Convention) {
  const q = quality(iv);
  const marca = q === 'J' ? '' : q === 'M' ? 'M' : q === 'm' ? 'm' : q === 'A' ? '+' : q === 'd' ? '°' : '?';
  return `${conv === 'pt' ? `${iv.num}ª` : String(iv.num)}${marca}`;
}

/** Nome do intervalo só pela distância em semitons (0 a 12), como se ouve: o trítono não tem grafia. */
export function semitoneName(semis: number, conv: Convention) {
  const pt = ['uníssono', '2ª menor', '2ª maior', '3ª menor', '3ª maior', '4ª justa', 'trítono', '5ª justa', '6ª menor', '6ª maior', '7ª menor', '7ª maior', 'oitava'];
  const en = ['unison', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th', 'octave'];
  return (conv === 'pt' ? pt : en)[semis];
}

/** Quantos acidentes tem uma armadura (fifths: positivo = sustenidos, negativo = bemóis). */
export function accidentalCount(fifths: number, conv: Convention) {
  const n = Math.abs(fifths);
  if (conv === 'pt') {
    if (n === 0) return 'nenhum';
    return fifths > 0 ? `${n} ${n > 1 ? 'sustenidos' : 'sustenido'}` : `${n} ${n > 1 ? 'bemóis' : 'bemol'}`;
  }
  if (n === 0) return 'none';
  return `${n} ${fifths > 0 ? 'sharp' : 'flat'}${n > 1 ? 's' : ''}`;
}
