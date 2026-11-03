// Conferência das respostas, separada da superfície onde a pessoa responde (C1).
// Compara pelo sentido musical: Dó♯ e Ré♭ são a mesma altura (a menos que a grafia seja o que se
// pede), casas diferentes do braço que dão a mesma nota contam igual, e C7M, Cmaj7 e "C 7M" são a
// mesma cifra.
import { midi, mod, type ChordId } from '../theory/core';
import type { ChoiceOption, Expected, Response } from './types';

const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const pcOf = (letter: number, acc: number) => mod(NATURAL[mod(letter, 7)] + acc, 12);

// Sufixos aceitos para cada qualidade, nas convenções brasileira e americana e nas grafias comuns.
// Comparação exata depois de tirar espaços e trocar ♯/♭ por #/b: M (maior) e m (menor) continuam
// diferentes, porque mudam o acorde.
const SUFFIXES: Record<ChordId, string[]> = {
  maior: ['', 'M', 'maj'],
  menor: ['m', 'min', '-'],
  aum: ['+', 'aug', '(#5)', '#5', '+5'],
  dim: ['°', 'o', 'dim'],
  sus4: ['sus4', 'sus'],
  '7M': ['7M', 'maj7', 'M7', 'Δ', 'Δ7', '7+'],
  '7': ['7'],
  m7: ['m7', 'min7', '-7'],
  m7b5: ['m7(b5)', 'm7b5', 'ø', 'ø7', 'm7(-5)', '-7b5'],
  dim7: ['°7', 'o7', 'dim7'],
};
const BY_SUFFIX = new Map<string, ChordId>(
  (Object.entries(SUFFIXES) as [ChordId, string[]][]).flatMap(([q, list]) => list.map(sfx => [sfx, q] as [string, ChordId])),
);

/** Lê uma cifra (C7M, Cmaj7, Bbm7(b5), F#°…) como fundamental + qualidade. Null se não reconhecer. */
export function parseChordSymbol(text: string): { root: number; quality: ChordId } | null {
  const s = text.replace(/\s+/g, '').replace(/♯/g, '#').replace(/♭/g, 'b');
  const m = /^([A-Ga-g])(##|bb|#|b)?(.*)$/.exec(s);
  if (!m) return null;
  const letter = 'CDEFGAB'.indexOf(m[1].toUpperCase());
  const acc = m[2] === '#' ? 1 : m[2] === '##' ? 2 : m[2] === 'b' ? -1 : m[2] === 'bb' ? -2 : 0;
  const rest = m[3];
  // só as palavras (maj, min, dim, aug, sus) valem em qualquer caixa; "M7" nunca vira "m7"
  const lower = rest.toLowerCase();
  const quality = BY_SUFFIX.get(rest) ?? (/^(maj|min|dim|aug|sus)/.test(lower) ? BY_SUFFIX.get(lower) : undefined);
  return quality ? { root: pcOf(letter, acc), quality } : null;
}

/** A resposta que uma opção representa. */
export function optionResponse(o: ChoiceOption): Response {
  return o.value ?? { kind: 'option', id: o.id };
}

/** A resposta está certa? */
export function validate(expected: Expected, r: Response): boolean {
  switch (expected.kind) {
    case 'option':
      return r.kind === 'option' && r.id === expected.id;
    case 'pitchClass':
      if (r.kind === 'pitchClass') return r.pc === expected.pc;
      if (r.kind === 'pitch') return mod(r.midi, 12) === expected.pc;
      if (r.kind === 'spelled') return pcOf(r.letter, r.acc) === expected.pc;
      return false;
    case 'pitch':
      if (r.kind === 'pitch') return r.midi === expected.midi;
      if (r.kind === 'spelled' && r.oct !== undefined) return midi({ letter: mod(r.letter, 7) as 0, acc: r.acc, oct: r.oct }) === expected.midi;
      return false;
    case 'spelled':
      // a grafia é o que se pede: uma altura tocada não diz como foi escrita
      if (r.kind !== 'spelled') return false;
      return mod(r.letter, 7) === mod(expected.letter, 7) && r.acc === expected.acc && (expected.oct === undefined || r.oct === expected.oct);
    case 'chord': {
      if (r.kind !== 'chord') return false;
      const c = parseChordSymbol(r.text);
      return !!c && c.root === expected.root && c.quality === expected.quality;
    }
  }
}
