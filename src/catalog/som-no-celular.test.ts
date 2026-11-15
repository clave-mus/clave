// **O som que um alto-falante de celular reproduz** (15/11/2026).
//
// O Paulo testou o `mapa-do-braco` no celular, sem fone: *"o som está meio bugado, mas acho que é
// por ser grave demais pro celular — está dando umas craqueladas. no PC está ok."*
//
// Ele estava certo no diagnóstico, e medir deu o número: num Mi1 (41 Hz) **0%** da energia da nota
// fica acima de 300 Hz, que é onde esses alto-falantes começam a responder. O cone se move sem
// produzir som, e o craquelado é esse esforço.
//
// ## O que NÃO resolveu, medido antes de escolher
//
// - **abrir o filtro do laço** da corda: 0,1% → 0,2%. O limite não é o filtro, é a forma triangular
//   do estouro, cujos harmônicos caem com 1/k²;
// - **saturação suave** (o que um amplificador de baixo faz): até 1,2% com ganho pesado, que já
//   descaracteriza o timbre;
// - **subir uma oitava**, que foi a primeira ideia dele: Mi1 → Mi2 leva de 0% a **1%**. Pouco,
//   porque o problema não é só a fundamental — é a corda ter poucos harmônicos.
//
// O salto está em a fundamental cruzar os 300 Hz: Lá3 (220 Hz) dá 3–10%, Mi4 (330 Hz) dá 100%.
import { describe, expect, it } from 'vitest';
import { mapaDoBraco } from './items/mapa-do-braco';
import { PISO_AUDIVEL } from './helpers';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import type { Ctx } from './types';

const ctxDe = (inst: 'violao' | 'baixo'): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams(inst, { key: { tonic: 0, mode: 'maior' } }),
});
const perguntar = (ctx: Ctx, over: Record<string, unknown>) => {
  const q = mapaDoBraco.make!({ ...mapaDoBraco.defaults, ...(mapaDoBraco.defaultsDo?.(ctx) ?? {}), ...over } as never, ctx);
  if (q.surface.kind !== 'mapa') throw new Error('esperava a superfície do mapa');
  return q;
};

describe('o som na faixa do celular', () => {
  it('ligado, nenhuma altura soa abaixo de Mi4 (330 Hz)', () => {
    for (const inst of ['baixo', 'violao'] as const) {
      const ctx = ctxDe(inst);
      for (let i = 0; i < 120; i++) {
        const q = perguntar(ctx, { somAudivel: true });
        if (q.surface.kind !== 'mapa') continue;
        for (const p of q.surface.posicoes) {
          expect(p.soa, `${inst}: soa ${p.soa}, abaixo do piso`).toBeGreaterThanOrEqual(PISO_AUDIVEL);
        }
      }
    }
  });

  /**
   * **O desenho não muda, só o som.** A casa é a casa: transpor o braço junto com o som
   * transformaria o exercício em outro, e a pergunta é *onde está esta nota*.
   */
  it('as posições desenhadas continuam as reais', () => {
    const ctx = ctxDe('baixo');
    for (let i = 0; i < 60; i++) {
      const q = perguntar(ctx, { somAudivel: true });
      if (q.surface.kind !== 'mapa') continue;
      for (const p of q.surface.posicoes) {
        expect(p.midi, 'a altura da posição tem de ser a da casa').toBe(q.surface.tuning[p.corda] + p.casa);
      }
    }
  });

  /**
   * **O contorno sobrevive**: o arpejo sobe inteiro, pelo mesmo número de oitavas. Achatar cada nota
   * na sua própria oitava seria mais simples e embaralharia o desenho melódico, que é justamente o
   * que o exercício mostra. Medido: preservado em 150 de 150 perguntas.
   */
  it('o arpejo sobe inteiro: as distâncias entre as notas não mudam', () => {
    for (const inst of ['baixo', 'violao'] as const) {
      const ctx = ctxDe(inst);
      for (let i = 0; i < 80; i++) {
        const q = perguntar(ctx, { somAudivel: true });
        if (q.surface.kind !== 'mapa') continue;
        const reais = q.surface.posicoes.map(p => p.midi);
        const soam = q.surface.posicoes.map(p => p.soa);
        const dif = (xs: number[]) => xs.slice(1).map((v, k) => v - xs[k]).join(',');
        expect(dif(soam), `${inst}: contorno mudou`).toBe(dif(reais));
        // e o deslocamento é múltiplo de 12: a classe de altura da resposta não pode mudar
        for (let k = 0; k < reais.length; k++) {
          expect((soam[k] - reais[k]) % 12, 'deslocamento não é por oitavas').toBe(0);
        }
      }
    }
  });

  it('desligado, o som é a altura real da posição', () => {
    const ctx = ctxDe('violao');
    for (let i = 0; i < 60; i++) {
      const q = perguntar(ctx, { somAudivel: false });
      if (q.surface.kind !== 'mapa') continue;
      for (const p of q.surface.posicoes) expect(p.soa).toBe(p.midi);
    }
  });

  /** No baixo vem ligado, porque lá o braço inteiro fica abaixo dos 300 Hz; no violão, não. */
  it('o padrão segue o instrumento', () => {
    expect(mapaDoBraco.defaultsDo?.(ctxDe('baixo')).somAudivel, 'baixo').toBe(true);
    expect(mapaDoBraco.defaultsDo?.(ctxDe('violao')).somAudivel, 'violão').toBe(false);
  });
});
