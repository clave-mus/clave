// O modo "intervalo" de `ache-a-nota` (F6-4): a pessoa **constrói** o intervalo em vez de identificá-lo.
//
// É o modo mais fácil de implementar errado em silêncio — a resposta esperada é uma nota calculada, e
// um erro de transposição dá uma pergunta que ninguém consegue acertar. Daí os testes medirem a
// resposta esperada contra a nota de partida, pergunta por pergunta.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { INTERVALS, ivLabel } from './helpers';
import { midi, mod, semisFor } from '../theory/core';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ache-a-nota')!;
const perguntar = (s: Record<string, SettingValue>) => item.make({ ...item.defaults, ...s } as never, ctx);
const TODOS = INTERVALS.map(i => i.id);

describe('a pergunta pede o intervalo, nas três superfícies', () => {
  it.each(['pauta', 'teclado', 'braco'])('%s pergunta por um intervalo e não pela nota', superficie => {
    for (let i = 0; i < 30; i++) {
      const q = perguntar({ superficie, pedido: 'intervalo', intervalos: TODOS });
      expect(q.prompt.length, superficie).toBeGreaterThan(0);
      // o rótulo do intervalo tem de estar no enunciado: sem ele a pergunta não dá para responder
      expect(TODOS.some(id => q.prompt.includes(ivLabel(id, ctx))), `${superficie}: "${q.prompt}"`).toBe(true);
    }
  });
});

describe('a resposta esperada é de fato aquele intervalo acima da nota de partida', () => {
  // Na PAUTA a nota de partida aparece no visual, então dá para medir as duas e conferir a distância.
  it('na pauta, a distância entre a nota mostrada e a esperada é o intervalo pedido', () => {
    for (let i = 0; i < 120; i++) {
      const q = perguntar({ superficie: 'pauta', pedido: 'intervalo', intervalos: TODOS });
      if (q.visual.kind !== 'staff' || !q.visual.columns[0]?.[0]) continue;
      const partida = q.visual.columns[0][0];
      expect(q.expected.kind).toBe('spelled');
      if (q.expected.kind !== 'spelled' || q.expected.oct === undefined) continue;
      const alvo = { letter: q.expected.letter, acc: q.expected.acc, oct: q.expected.oct } as typeof partida;
      // Em semitons e em GRAUS absolutos: a oitava justa é 8 graus e 12 semitons, e contar graus com
      // `mod 7` a transformaria em uníssono — foi o que a primeira versão deste teste fez.
      const semis = midi(alvo) - midi(partida);
      const graus = (alvo.letter - partida.letter) + 7 * (alvo.oct - partida.oct) + 1;
      const bate = INTERVALS.some(iv => iv.num === graus && semisFor(iv.num, iv.q) === semis);
      expect(bate, `partida ${JSON.stringify(partida)} alvo ${JSON.stringify(alvo)}: ${graus} graus, ${semis} semitons`).toBe(true);
    }
  });

  // No BRAÇO a nota de partida está marcada e o som toca as duas: a distância entre elas é o intervalo.
  it('no braço, o som toca a partida e o alvo, à distância pedida', () => {
    for (let i = 0; i < 80; i++) {
      const q = perguntar({ superficie: 'braco', pedido: 'intervalo', intervalos: TODOS });
      const grupos = q.sound?.groups ?? [];
      expect(grupos).toHaveLength(2);
      const d = grupos[1][0] - grupos[0][0];
      expect(INTERVALS.some(iv => semisFor(iv.num, iv.q) === d), `distância ${d}`).toBe(true);
      // e o esperado é a classe de altura do alvo — a pessoa pode tocá-lo em qualquer corda
      if (q.expected.kind === 'pitchClass') expect(q.expected.pc).toBe(mod(grupos[1][0], 12));
    }
  });

  it('no teclado, o esperado é a classe de altura do alvo, não da partida', () => {
    for (let i = 0; i < 60; i++) {
      const q = perguntar({ superficie: 'teclado', pedido: 'intervalo', intervalos: ['J5'] });
      if (q.expected.kind !== 'pitchClass' || !q.sound) continue;
      expect(q.expected.pc).toBe(mod(q.sound.groups[0][0], 12));
    }
  });
});

describe('o filtro de intervalos vale', () => {
  it('só sorteia entre os escolhidos', () => {
    const vistos = new Set<number>();
    for (let i = 0; i < 120; i++) {
      const q = perguntar({ superficie: 'braco', pedido: 'intervalo', intervalos: ['J5', 'J8'] });
      const g = q.sound!.groups;
      vistos.add(g[1][0] - g[0][0]);
    }
    expect([...vistos].sort((a, b) => a - b)).toEqual([7, 12]);
  });

  it('e com um intervalo só, a pergunta é sempre aquele', () => {
    for (let i = 0; i < 30; i++) {
      const q = perguntar({ superficie: 'braco', pedido: 'intervalo', intervalos: ['m3'] });
      const g = q.sound!.groups;
      expect(g[1][0] - g[0][0]).toBe(3);
    }
  });
});

describe('o modo "nota" não mudou', () => {
  it('nas três superfícies, continua pedindo a nota pelo nome', () => {
    for (const superficie of ['pauta', 'teclado', 'braco']) {
      for (let i = 0; i < 20; i++) {
        const q = perguntar({ superficie, pedido: 'nota' });
        // uma nota só no som: no modo intervalo são duas
        expect(q.sound?.groups, superficie).toHaveLength(1);
      }
    }
  });

  // A lista de intervalos **some** quando o pedido é a nota: oferecer "qual terça" numa pergunta que
  // não é sobre terça é um controle que não faz nada.
  it('a lista de intervalos só aparece no modo intervalo', () => {
    const quando = item.settings(ctx).find(s => s.id === 'intervalos')!.quando!;
    expect(quando({ pedido: 'nota' })).toBe(false);
    expect(quando({ pedido: 'intervalo' })).toBe(true);
  });
});
