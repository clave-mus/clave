// **O acorde é o do grau** — a correção de rota que o Paulo pediu em 15/11.
//
// Eu havia feito a fundamental vir do grau do campo e a **qualidade** vir da seleção, e documentei
// como intencional. Em dó maior isso produzia `Mim7(♭5)` no grau III: um acorde que aquele campo não
// tem. Ele havia dito *"quis dizer os graus do campo harmônico"*, e tinha razão.
//
// A decisão dele ao ver o problema: *"acho que pode ser um parâmetro que fica desligado por
// padrão"*. Então o padrão é fiel ao campo, e soltar a qualidade é um degrau opcional.
import { describe, expect, it } from 'vitest';
import { tonicaDeOuvido } from './items/tonica-de-ouvido';
import { chordSymbol, comMesmoNucleo, harmonicField, note } from '../theory/core';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import type { Ctx } from './types';

const ctxEm = (tonic: number, mode: 'maior' | 'menor'): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('piano', { key: { tonic, mode } }),
});
const cifraDe = (q: { reveal?: string }) => (q.reveal ?? '').split(' —')[0];

/**
 * As cifras que aquele campo tem, e opcionalmente os enfeites de cada grau.
 *
 * `chordSymbol(d.root, id)` resolve isso numa linha: a mesma fundamental do grau com outra
 * qualidade do mesmo núcleo. (A primeira versão deste helper reconstruía o sufixo a partir da cifra
 * de dó, com um `require` que nem existe em módulo ES. Era complicação minha.)
 */
function cifrasAceitas(tonic: number, mode: 'maior' | 'menor', comEnfeite: boolean): Set<string> {
  const letra = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][tonic] as 0;
  const acc = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][tonic];
  const tonica = note(letra, acc, 4);
  const out = new Set<string>();
  for (const tetrades of [true, false]) {
    for (const d of harmonicField(tonica, mode, tetrades, 'pt')) {
      out.add(d.symbol);
      if (comEnfeite) for (const id of comMesmoNucleo(d.chord)) out.add(chordSymbol(d.root, id, 'pt'));
    }
  }
  return out;
}

describe('o acorde é o do grau (padrão)', () => {
  it.each([[0, 'maior'], [7, 'maior'], [9, 'menor']] as const)(
    'em %i %s, toda cifra sorteada é um grau do campo', (tonic, mode) => {
      const ctx = ctxEm(tonic, mode);
      const aceitas = cifrasAceitas(tonic, mode, false);
      for (let i = 0; i < 120; i++) {
        const q = tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults, familias: ['tetrades'] } as never, ctx);
        expect(aceitas.has(cifraDe(q)), `${cifraDe(q)} não é do campo`).toBe(true);
      }
    },
  );

  /**
   * Com extensões e alterações, a **função** não muda: o V de dó maior pode sair Sol7(♭9), que é
   * onde a alteração de fato aparece na música — e nunca um acorde de outro grau.
   */
  it('com extensões e alterações, o enfeite é do mesmo grau', () => {
    const ctx = ctxEm(0, 'maior');
    const aceitas = cifrasAceitas(0, 'maior', true);
    for (let i = 0; i < 200; i++) {
      const q = tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults, familias: ['tetrades', 'extensoes', 'alterados'] } as never, ctx);
      expect(aceitas.has(cifraDe(q)), `${cifraDe(q)} não é grau nem enfeite de grau`).toBe(true);
    }
  });

  it('as sete cifras do campo saem, nenhuma a mais', () => {
    const ctx = ctxEm(0, 'maior');
    const vistas = new Set<string>();
    for (let i = 0; i < 200; i++) {
      vistas.add(cifraDe(tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults, familias: ['tetrades'] } as never, ctx)));
    }
    expect([...vistas].sort()).toEqual(['Am7', 'Bm7(♭5)', 'C7M', 'Dm7', 'Em7', 'F7M', 'G7']);
  });
});

describe('qualidade livre: o degrau opcional', () => {
  it('ligada, sai do campo — e é por isso que ela é opcional', () => {
    const ctx = ctxEm(0, 'maior');
    const doCampo = cifrasAceitas(0, 'maior', false);
    const vistas = new Set<string>();
    for (let i = 0; i < 200; i++) {
      vistas.add(cifraDe(tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults, familias: ['tetrades'], qualidadeLivre: true } as never, ctx)));
    }
    // Mais variedade que o campo tem, e necessariamente com acordes de fora dele.
    expect(vistas.size).toBeGreaterThan(doCampo.size);
    expect([...vistas].some(c => !doCampo.has(c)), 'nada saiu do campo').toBe(true);
  });

  it('desligada por padrão', () => {
    expect(tonicaDeOuvido.defaults?.qualidadeLivre).toBe(false);
  });
});
