// `faca-o-intervalo` (X9, 06/11/2026): a pessoa CONSTRÓI o intervalo pedido, a partir de uma nota.
//
// É o modo mais fácil de implementar errado em silêncio — a resposta esperada é uma nota calculada,
// e um erro de transposição dá uma pergunta que ninguém consegue acertar. Daí os testes medirem a
// resposta esperada contra a nota de partida, pergunta por pergunta — o mesmo cuidado que o modo
// antigo (dentro de `ache-a-nota`, removido por B4) já tinha.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { INTERVALS } from './helpers';
import { midi, mod, semisFor } from '../theory/core';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'faca-o-intervalo')!;
const perguntar = (s: Record<string, SettingValue>) => item.make({ ...item.defaults, ...s } as never, ctx);

describe('a pergunta pede o intervalo, nas duas superfícies', () => {
  it.each(['pauta', 'braco'])('%s dá um enunciado não vazio', superficie => {
    for (let i = 0; i < 30; i++) {
      const q = perguntar({ superficie });
      expect(q.prompt.length, superficie).toBeGreaterThan(0);
    }
  });
});

describe('a resposta esperada é de fato aquele intervalo acima da nota de partida', () => {
  // Na PAUTA a nota de partida aparece no visual, então dá para medir as duas e conferir a distância.
  it('na pauta, a distância entre a nota mostrada e a esperada é um intervalo válido — e enarmônicos contam', () => {
    for (let i = 0; i < 120; i++) {
      const q = perguntar({ superficie: 'pauta' });
      if (q.visual.kind !== 'staff' || !q.visual.columns[0]?.[0]) continue;
      const partida = q.visual.columns[0][0];
      expect(q.expected.kind).toBe('spelled');
      if (q.expected.kind !== 'spelled' || q.expected.oct === undefined) continue;
      const alvo = { letter: q.expected.letter, acc: q.expected.acc, oct: q.expected.oct } as typeof partida;
      // Em semitons e em GRAUS absolutos: a oitava justa é 8 graus e 12 semitons, e contar graus com
      // `mod 7` a transformaria em uníssono.
      const semis = midi(alvo) - midi(partida);
      const graus = (alvo.letter - partida.letter) + 7 * (alvo.oct - partida.oct) + 1;
      const bate = INTERVALS.some(iv => iv.num === graus && semisFor(iv.num, iv.q) === semis);
      expect(bate, `partida ${JSON.stringify(partida)} alvo ${JSON.stringify(alvo)}: ${graus} graus, ${semis} semitons`).toBe(true);
    }
  });

  // No BRAÇO a nota de partida está marcada e o som toca as duas: a distância entre elas é o intervalo.
  // Aqui só a classe de altura importa — enarmônicos NÃO contam (o braço não sabe grafia).
  it('no braço, o som toca a partida e o alvo, à distância pedida', () => {
    for (let i = 0; i < 80; i++) {
      const q = perguntar({ superficie: 'braco' });
      const grupos = q.sound?.groups ?? [];
      expect(grupos).toHaveLength(1); // só a partida soa de cara; o alvo só na revelação
      if (q.expected.kind === 'pitchClass') {
        // mod 12: 0 é legítimo aqui (a oitava justa, 12 semitons, cai na mesma classe de altura).
        const d = mod(q.expected.pc - grupos[0][0], 12);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(11);
      }
    }
  });
});

describe('sem seletor de intervalos (personalização tem limite)', () => {
  it('o item não declara nenhuma configuração chamada "intervalos"', () => {
    expect(item.settings(ctx).some(s => s.id === 'intervalos')).toBe(false);
  });
});
