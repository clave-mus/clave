// **A tônica sorteada se escreve como a armadura manda** — o conserto de 26/11.
//
// Ele leu na tela, duas vezes: *"a fundamental de C♯♯m7♭5"* e, dias depois, um `B♯m7`. A causa era
// a mesma: com tonalidade livre, a tônica sorteada saía sempre grafada em sustenido, e cair na
// classe 3, 8 ou 10 produzia Ré♯, Sol♯ ou Lá♯ maior — tonalidades que o seletor nem oferece.
import { describe, expect, it } from 'vitest';
import { tonicaGrafada } from './contexto-musical';
import { chordSymbol, fromMidi, harmonicField, noteName, type ModoDoCampo } from '../theory/core';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const DOBRADO = /♯♯|♭♭/;

describe('a grafia da tônica', () => {
  /** As doze do seletor de tonalidade: é a lista que a música usa, e agora o sorteio usa a mesma. */
  it('as doze maiores são as que o app oferece', () => {
    const nomes = Array.from({ length: 12 }, (_, pc) => noteName(tonicaGrafada(pc, 'maior'), 'pt'));
    expect(nomes).toEqual(['Dó', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Lá♭', 'Lá', 'Si♭', 'Si']);
  });

  /** Nas menores o sustenido é que é o usual — ré♯, sol♯ e lá♯ menor são tonalidades de verdade. */
  it('as doze menores seguem a armadura delas', () => {
    const nomes = Array.from({ length: 12 }, (_, pc) => noteName(tonicaGrafada(pc, 'menor'), 'pt'));
    expect(nomes).toEqual(['Dó', 'Dó♯', 'Ré', 'Ré♯', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Sol♯', 'Lá', 'Si♭', 'Si']);
  });

  /**
   * ⚠️ **Nenhum campo harmônico sai ilegível** — era 3 de 24 antes, medido: Ré♯ maior dava `F♯♯m7` e
   * `C♯♯m7(♭5)`; Lá♯ maior dava três graus assim.
   */
  it.each(['maior', 'menor'] as ModoDoCampo[])('%s: nenhum grau com acidente dobrado, em nenhuma tônica', modo => {
    for (let pc = 0; pc < 12; pc++) {
      for (const tetrade of [false, true]) {
        for (const g of harmonicField(tonicaGrafada(pc, modo, 3), modo, tetrade, 'pt')) {
          const cifra = chordSymbol(g.root, g.chord, 'pt');
          expect(cifra, `${noteName(tonicaGrafada(pc, modo), 'pt')} ${modo}: ${cifra}`).not.toMatch(DOBRADO);
        }
      }
    }
  });

  /** A prova de que o conserto era necessário: pelo caminho antigo, três tonalidades quebram. */
  it('pelo caminho antigo (sustenido sempre), três tonalidades quebravam', () => {
    const quebradas = [];
    for (let pc = 0; pc < 12; pc++) {
      const campo = harmonicField(fromMidi(48 + pc, 'sharp'), 'maior', true, 'pt');
      if (campo.some(g => DOBRADO.test(chordSymbol(g.root, g.chord, 'pt')))) quebradas.push(pc);
    }
    expect(quebradas).toEqual([3, 8, 10]);
  });
});

describe('a Tônica de ouvido em tonalidade livre', () => {
  it('300 perguntas, nenhuma cifra ilegível', () => {
    const item = EXERCISES.filter(isSeries).find(e => e.id === 'tonica-de-ouvido') as SeriesItem;
    for (const naming of ['pt', 'en'] as const) {
      const ctx: Ctx = { naming, conv: naming, t: (k: MessageKey, v?: Vars) => translate(naming, k, v),
        params: resolveParams('piano', { key: null }) };
      const base = { ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}),
        familias: ['triades', 'tetrades', 'extensoes', 'alterados'] };
      for (let i = 0; i < 300; i++) {
        const q = item.make(base as never, ctx);
        expect(`${q.prompt} ${q.reveal}`, 'cifra ilegível na tela').not.toMatch(DOBRADO);
      }
    }
  });
});
