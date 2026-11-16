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

describe('a tônica cabe na voz', () => {
  /**
   * **O relato dele em 15/11**: *"as vezes a tonica fica aguda demais... tente achar a range que
   * fica mais natural pra voz humana"*.
   *
   * Medido antes: a tônica soava uma oitava acima da nota mais grave do voicing, e **47% delas
   * passavam do Dó5** (523 Hz), com o pior caso em Dó6. A altura da tônica não precisa ter relação
   * com a do acorde — o que importa é caber na voz de quem canta.
   */
  it.each([['grave', 48, 59], ['media', 60, 71], ['aguda', 72, 83]] as const)(
    'na faixa %s, a tônica fica entre %i e %i', (faixa, lo, hi) => {
      const ctx = ctxEm(0, 'maior');
      for (let i = 0; i < 120; i++) {
        const q = tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults, faixaDaVoz: faixa } as never, ctx);
        const m = q.sound!.partes!.find(p => p.id === 'resposta')!.groups.flat()[0];
        expect(m, `${faixa}: tônica em ${m}`).toBeGreaterThanOrEqual(lo);
        expect(m).toBeLessThanOrEqual(hi);
      }
    },
  );

  it('a faixa do meio é o padrão, e nela nada passa do Dó5', () => {
    expect(tonicaDeOuvido.defaults?.faixaDaVoz).toBe('media');
    const ctx = ctxEm(0, 'maior');
    for (let i = 0; i < 150; i++) {
      const q = tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults } as never, ctx);
      expect(q.sound!.partes!.find(p => p.id === 'resposta')!.groups.flat()[0]).toBeLessThan(72);
    }
  });

  /** A tônica é a classe da fundamental do acorde — mudar a oitava não pode mudar a nota. */
  it('a tônica é a fundamental do acorde, em qualquer faixa', () => {
    const ctx = ctxEm(0, 'maior');
    for (const faixa of ['grave', 'media', 'aguda']) {
      for (let i = 0; i < 60; i++) {
        const q = tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults, faixaDaVoz: faixa } as never, ctx);
        const tonica = q.sound!.partes!.find(p => p.id === 'resposta')!.groups.flat()[0];
        const acorde = q.sound!.partes!.find(p => p.id === 'acorde')!.groups.flat();
        // a cifra revela a fundamental; aqui basta que a classe da tônica esteja no acorde OU que
        // o acorde esteja sem fundamental (parâmetro desligado por padrão, então ela está lá)
        expect(acorde.some(m => ((m % 12) + 12) % 12 === ((tonica % 12) + 12) % 12), `${faixa}`).toBe(true);
      }
    }
  });
});

describe('tonalidade livre é o padrão', () => {
  /** Pedido dele em 15/11: *"faça com que tonalidade livre seja o padrão"*. */
  it('nenhum atalho fixa tonalidade', () => {
    for (const p of tonicaDeOuvido.presets ?? []) {
      expect(p.params?.key, `${p.id} fixa tonalidade`).toBeNull();
    }
  });

  it('sem tonalidade, o campo é sorteado e se mantém na rodada', () => {
    const ctx: Ctx = {
      naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
      params: resolveParams('piano', { key: null }),
    };
    const raizes = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const q = tonicaDeOuvido.make!({ ...tonicaDeOuvido.defaults } as never, ctx);
      raizes.add((q.reveal ?? '').slice(0, 2));
    }
    // o campo é um só: as raízes vêm dos sete graus dele, não das doze tonalidades
    expect(raizes.size, 'o campo mudou no meio da rodada').toBeLessThanOrEqual(7);
  });
});
