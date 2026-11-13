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
      // `onde: 'teclado'` explícito desde 12/11: a superfície virou parâmetro e o PADRÃO passou a
      // ser o instrumento do perfil. Este teste é sobre o teclado, então ele o pede.
      const q = perguntar({ onde: 'teclado' });
      if (q.surface.kind !== 'keyboard') throw new Error('esperava teclado');
      for (const m of q.sound!.groups.flat()) {
        expect(m, `${m} fora de ${q.surface.lo}–${q.surface.hi}`).toBeGreaterThanOrEqual(q.surface.lo);
        expect(m).toBeLessThanOrEqual(q.surface.hi);
      }
    }
  });

  it('exatamente uma tecla do teclado valida como certa', () => {
    for (let i = 0; i < 40; i++) {
      const q = perguntar({ onde: 'teclado' });
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

/**
 * **A nota só pode soar onde a resposta cabe** — em QUALQUER superfície, não só no teclado.
 *
 * A superfície virou parâmetro em 12/11, e com ela voltou o defeito de 09/11 por outro caminho: o
 * som ia até Si5 e um violão nas casas 0–12 chega ao Mi4, então a pergunta ficava sem resposta
 * possível. Este teste varre as superfícies que têm faixa.
 */
describe('a nota soa onde a resposta cabe', () => {
  it('no braço, toda nota que soa tem casa; na pauta e no teclado, idem', () => {
    for (const onde of ['braco', 'teclado', 'pauta']) {
      for (let i = 0; i < 60; i++) {
        const q = perguntar({ onde });
        const sf = q.surface;
        // **Só a nota a identificar.** A referência (o dó que soa antes) é contexto, não pergunta:
        // ela não precisa existir no instrumento, e exigir isso foi erro meu ao escrever o teste.
        const grupos = q.sound!.groups;
        for (const m of grupos[grupos.length - 1]) {
          if (sf.kind === 'keyboard') {
            expect(m, `${onde}: ${m} fora de ${sf.lo}–${sf.hi}`).toBeGreaterThanOrEqual(sf.lo);
            expect(m).toBeLessThanOrEqual(sf.hi);
          }
          if (sf.kind === 'fretboard') {
            const alcance = sf.tuning.flatMap(t => Array.from({ length: sf.to - sf.from + 1 }, (_, k) => t + sf.from + k));
            expect(alcance, `${onde}: ${m} não tem casa`).toContain(m);
          }
        }
      }
    }
  });

  it('com letras ou graus, a oitava deixa de contar — e o enunciado diz isso', () => {
    for (const onde of ['letras', 'graus']) {
      const q = perguntar({ onde });
      // A conferência relaxa de propósito (decisão do Paulo em 12/11), e por isso o enunciado avisa.
      expect(q.expected.kind === 'pitchClass' || q.expected.kind === 'option', onde).toBe(true);
      expect(q.prompt).toContain('oitava');
    }
  });
});
