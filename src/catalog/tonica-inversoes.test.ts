// **Sem inversões na Tônica de ouvido** — pedido dele em 26/11.
//
// O risco de prender um dos quatro eixos de variação é o item ficar pobre, e isso se mede: quantos
// voicings sobram por qualidade, e se alguma combinação de família e grau fica sem acorde nenhum.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { CHORDS, midi, mod, type ChordId } from '../theory/core';
import { voicingsDe } from '../theory/voicings';
import { notaGrafada } from './helpers';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', { key: { tonic: 0, mode: 'maior' } }),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'tonica-de-ouvido') as SeriesItem;
const base = { ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) };

describe('o motor prende a fundamental no baixo', () => {
  it('toda qualidade (as 25) tem voicing, e em todos o baixo é a fundamental', () => {
    const magros: string[] = [];
    for (const id of Object.keys(CHORDS) as ChordId[]) {
      const vs = voicingsDe(notaGrafada(ctx, 60), id, { semInversao: true });
      expect(vs.length, `${id} ficou sem voicing`).toBeGreaterThan(0);
      for (const v of vs) expect(mod(midi(v.todas[0]) - 60, 12), `${id}: baixo invertido`).toBe(0);
      if (vs.length < 3) magros.push(`${id}=${vs.length}`);
    }
    // Prende um eixo dos quatro; os outros três — oitava do baixo, quais notas saem, ordem das de
    // cima — seguem variando, e é isso que mantém o exercício vivo.
    expect(magros, 'qualidade com menos de 3 voicings sem inversão').toEqual([]);
  });

  /** ⚠️ Sem fundamental o pedido é impossível, e ali o controle mais específico ganha. */
  it('sem fundamental, o baixo volta a ser outro grau', () => {
    const vs = voicingsDe(notaGrafada(ctx, 60), '7', { semInversao: true, semFundamental: true });
    expect(vs.length).toBeGreaterThan(0);
    for (const v of vs) expect(mod(midi(v.todas[0]) - 60, 12)).not.toBe(0);
  });
});

describe('o item desligado nunca fica mudo', () => {
  const familias = [['triades'], ['tetrades'], ['extensoes'], ['alterados']];
  it.each(familias)('família %s: acorde em pé nos sete graus', (...fams) => {
    for (const g of ['1', '2', '3', '4', '5', '6', '7']) {
      for (let i = 0; i < 20; i++) {
        const q = item.make({ ...base, familias: fams, graus: [g], inversoes: false } as never, ctx);
        const ms = (q.sound?.groups ?? []).flat();
        expect(ms.length, `grau ${g} ficou sem acorde`).toBeGreaterThan(2);
        // O enunciado pede a fundamental; sem inversão ela é a nota mais grave que soa.
        expect(Math.min(...ms)).toBe(ms[0]);
      }
    }
  });
});
