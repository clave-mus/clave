// A resposta do intervalo harmônico pode ser **as notas** (OR-ouvido-relativo.md, §3.3).
//
// Pedido do Paulo no rascunho dele: *"Resposta: indicar as notas que tocaram. Pode ser feito na
// pauta, no piano, no violão, no baixo ou em botões."* O modo de nomear o intervalo continua, porque
// ele pediu os dois — são duas habilidades, e nomear é a que o item já treinava.
//
// **Em 20/11 o harmônico virou item**, e as medidas de "juntas" passaram para ele. As de ordem
// seguem no melódico, que é onde a ordem existe.
import { describe, expect, it } from 'vitest';
import { ouvidoIntervalo, ouvidoIntervaloHarmonico } from './items/ouvido-intervalo';
import { validate } from './validate';
import { resolveParams } from './params';
import type { Ctx, Response, SettingValue } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 0, mode: 'maior' } }),
};
const perguntar = (s: Record<string, SettingValue>) => ouvidoIntervalo.make!({ ...ouvidoIntervalo.defaults, ...s } as never, ctx);
/** O harmônico: aqui `direcao` não é configuração, é o que o item é. */
const perguntarJuntas = (s: Record<string, SettingValue>) =>
  ouvidoIntervaloHarmonico.make!({ ...ouvidoIntervaloHarmonico.defaults, ...s } as never, ctx);
const pitches = (midis: number[]): Response => ({ kind: 'pitches', midis });

describe('responder as notas do intervalo', () => {
  it('a superfície acumula tantas alturas quantas soaram', () => {
    for (const [notas, onde, esperada] of [['2', 'teclado', 'keyboard'], ['3', 'braco', 'fretboard'], ['3', 'pauta', 'staff']] as const) {
      const q = perguntarJuntas({ resposta: 'notas', notas, superficie: onde });
      expect(q.surface.kind, onde).toBe(esperada);
      expect('quantas' in q.surface && q.surface.quantas, `${onde} com ${notas}`).toBe(Number(notas));
      expect(q.expected.kind).toBe('contorno');
    }
  });

  /**
   * **Harmônico: a ordem dos cliques não é resposta.** As notas soam juntas, então exigir ordem
   * mediria a ordem em que a pessoa move a mão, não o que ela ouviu.
   */
  it('com três notas juntas, aceita qualquer ordem e recusa uma delas deslocada sozinha', () => {
    for (let i = 0; i < 40; i++) {
      const q = perguntarJuntas({ resposta: 'notas', notas: '3', superficie: 'teclado' });
      const certas = (q.expected as { midis: number[] }).midis;
      expect(certas).toHaveLength(3);
      expect(validate(q.expected, pitches([...certas].reverse())), 'ordem trocada').toBe(true);
      expect(validate(q.expected, pitches(certas.map(m => m - 12))), 'tudo uma oitava abaixo').toBe(true);
      expect(validate(q.expected, pitches(certas.map((m, k) => (k === 1 ? m + 12 : m)))), 'a do meio sozinha').toBe(false);
    }
  });

  /** **Melódico: a ordem é metade do que se ouviu.** Responder sol–dó onde soou dó–sol é outra coisa. */
  it('melódico exige a ordem em que soou, subindo e descendo', () => {
    for (const direcao of ['sobe', 'desce'] as const) {
      for (let i = 0; i < 20; i++) {
        const q = perguntar({ resposta: 'notas', notas: '2', direcao, superficie: 'teclado' });
        const certas = (q.expected as { midis: number[] }).midis;
        // o gabarito está na ordem em que soou
        const soaram = q.sound!.groups.flat();
        expect(certas, direcao).toEqual(soaram);
        expect(validate(q.expected, pitches(certas)), direcao).toBe(true);
        expect(validate(q.expected, pitches([...certas].reverse())), `${direcao} invertido`).toBe(false);
      }
    }
  });

  it('nenhuma nota passa do teto da janela, mesmo com dois intervalos empilhados', () => {
    // Era a armadilha: duas oitavas sobre a base jogariam o topo fora da região.
    for (let i = 0; i < 200; i++) {
      const q = perguntarJuntas({ resposta: 'notas', notas: '3', intervalos: ['11', '12'] });
      for (const m of q.sound!.groups.flat()) expect(m).toBeLessThanOrEqual(79);
    }
  });

  it('`comTonica` faz o intervalo partir sempre da tônica em vigor', () => {
    for (const pc of [0, 5, 9]) {
      const c: Ctx = { ...ctx, params: resolveParams('violao', { key: { tonic: pc, mode: 'maior' } }) };
      for (let i = 0; i < 20; i++) {
        const q = ouvidoIntervaloHarmonico.make!({ ...ouvidoIntervaloHarmonico.defaults, resposta: 'notas', comTonica: true } as never, c);
        const baixo = Math.min(...(q.expected as { midis: number[] }).midis);
        expect(((baixo % 12) + 12) % 12, `tônica ${pc}`).toBe(pc);
      }
    }
  });

  it('três notas com alternativas é recusado, não sorteado', () => {
    // Decisão 13: configuração que torna a pergunta impossível explica e recusa.
    expect(ouvidoIntervalo.problema!({ ...ouvidoIntervalo.defaults, notas: '3', resposta: 'alternativas' } as never, ctx)).toBeTruthy();
    expect(ouvidoIntervalo.problema!({ ...ouvidoIntervalo.defaults, notas: '3', resposta: 'notas' } as never, ctx)).toBeNull();
  });

  it('o modo de nomear o intervalo continua existindo', () => {
    const q = perguntar({ resposta: 'alternativas', notas: '2' });
    expect(q.surface.kind).toBe('choices');
    expect(q.expected.kind).toBe('option');
  });
});
