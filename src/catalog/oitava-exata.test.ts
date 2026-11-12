// A oitava exata em "Que nota tocou?" (10/11/2026).
//
// O Paulo: "fazer com que o exercício receba como resposta correta apenas a oitava específica da
// nota que foi tocada, e não a mesma nota em outras oitavas como atualmente é."
//
// Era `pitchClass`, e essa frouxura é o que **escondeu** o defeito que ele achou antes: a tela
// desenhava um teclado de 60 a 71 e o som sorteava de 48 a 83, e clicar a nota certa na oitava
// errada acertava. Nem o acerto denunciava.
//
// Nada disso tinha teste — a troca de `pitchClass` para `pitch` passou com 1323 testes verdes.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { validate } from './validate';
import { translate, type MessageKey, type Vars } from '../i18n';
import { mod } from '../theory/core';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-tecla')!;
const perguntar = (s: Record<string, SettingValue> = {}) => item.make({ ...item.defaults, ...s } as never, ctx);

describe('a resposta é a altura, não a classe de altura', () => {
  it('a nota que soa é a resposta certa', () => {
    for (let i = 0; i < 60; i++) {
      const q = perguntar();
      const g = q.sound!.groups;
      const soou = g[g.length - 1][0]; // a referência soa antes; a última é a nota a identificar
      expect(q.expected.kind).toBe('pitch');
      expect(validate(q.expected, { kind: 'pitch', midi: soou })).toBe(true);
    }
  });

  // O coração: a mesma nota uma oitava acima ou abaixo **erra**. Antes acertava.
  it('a mesma nota em outra oitava está errada', () => {
    for (let i = 0; i < 60; i++) {
      const q = perguntar();
      const g = q.sound!.groups;
      const soou = g[g.length - 1][0]; // a referência soa antes; a última é a nota a identificar
      for (const d of [-24, -12, 12, 24]) {
        expect(mod(soou + d, 12), 'mesma classe de altura').toBe(mod(soou, 12));
        expect(validate(q.expected, { kind: 'pitch', midi: soou + d }), `${soou} vs ${soou + d}`).toBe(false);
      }
    }
  });

  // Se a nota pudesse soar fora do teclado desenhado, a pergunta ficaria sem resposta possível —
  // que era exatamente o defeito de antes, agora impossível de passar em silêncio.
  it('a nota que soa está sempre dentro do teclado desenhado', () => {
    for (let i = 0; i < 80; i++) {
      const q = perguntar();
      if (q.surface.kind !== 'keyboard') throw new Error('esperava teclado');
      for (const m of q.sound!.groups.flat()) {
        expect(m, `${m} fora de ${q.surface.lo}–${q.surface.hi}`).toBeGreaterThanOrEqual(q.surface.lo);
        expect(m).toBeLessThanOrEqual(q.surface.hi);
      }
    }
  });

  it('exatamente uma tecla do teclado valida como certa', () => {
    for (let i = 0; i < 40; i++) {
      const q = perguntar();
      if (q.surface.kind !== 'keyboard') throw new Error('esperava teclado');
      let certas = 0;
      for (let m = q.surface.lo; m <= q.surface.hi; m++) if (validate(q.expected, { kind: 'pitch', midi: m })) certas++;
      // Com classe de altura seriam três (uma por oitava da faixa), e a revelação pintava as três.
      expect(certas).toBe(1);
    }
  });
});

describe('a revelação diz a oitava', () => {
  // Errar a oitava e não saber qual era não ensina nada.
  it('o gabarito tem nome e número de oitava, e o número é o da nota que soou', () => {
    for (let i = 0; i < 40; i++) {
      const q = perguntar();
      const g = q.sound!.groups;
      const soou = g[g.length - 1][0]; // a referência soa antes; a última é a nota a identificar
      const oitava = Math.floor(soou / 12) - 1;
      expect(q.reveal, `${soou}`).toMatch(/[0-9]$/);
      expect(q.reveal.endsWith(String(oitava)), `${q.reveal} para MIDI ${soou}`).toBe(true);
    }
  });
});
