// Restringir às notas que a pessoa escolhe (pedido do Paulo, em três linhas do rascunho dele:
// *"restringir à notas específicas da seleção do usuário"*).
//
// A conta mora em `pcsEscolhidas`, e não em cada item, porque são três linhas pedindo a mesma coisa.
import { describe, expect, it } from 'vitest';
import { ouvidoTecla } from './items/ouvido-tecla';
import { melodiaDeOuvido } from './items/melodia-de-ouvido';
import { ouvidoIntervalo } from './items/ouvido-intervalo';
import { pcsEscolhidas } from './contexto-musical';
import { resolveParams } from './params';
import type { Ctx } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctxCom = (p: Parameters<typeof resolveParams>[1] = {}): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', p),
});
const ctx = ctxCom({ key: { tonic: 0, mode: 'maior' }, range: { lo: 55, hi: 79 } });
const DO_MI_SOL = ['0', '4', '7'];

describe('pcsEscolhidas', () => {
  it('vazio é sem restrição: vale o material', () => {
    expect(pcsEscolhidas(ctx, [])).toEqual(pcsEscolhidas(ctx, undefined));
    expect(pcsEscolhidas(ctx, []).length).toBe(12);
  });

  it('cruza com o material, e escolher não abre o que a tonalidade fechou', () => {
    // Em dó maior diatônico, escolher ré♭ (1) não o traz de volta: ele não está na tonalidade.
    const diatonico = ctxCom({ key: { tonic: 0, mode: 'maior' }, material: 'diatonico' });
    expect(pcsEscolhidas(diatonico, ['0', '1', '4'])).toEqual([0, 4]);
  });

  it('cruzamento vazio cai no material em vez de ficar sem nota', () => {
    // Quem recusa configuração impossível é o `problema()` do item, que sabe de quantas precisa.
    const diatonico = ctxCom({ key: { tonic: 0, mode: 'maior' }, material: 'diatonico' });
    expect(pcsEscolhidas(diatonico, ['1', '6'])).toEqual(pcsEscolhidas(diatonico, []));
  });
});

describe('as três linhas respeitam a escolha', () => {
  it('ouvido-tecla sorteia só entre as notas escolhidas', () => {
    const vistas = new Set<number>();
    for (let i = 0; i < 120; i++) {
      const q = ouvidoTecla.make!({ ...ouvidoTecla.defaults, pretas: true, onde: 'teclado', notasEscolhidas: DO_MI_SOL } as never, ctx);
      vistas.add(((q.expected as { midi: number }).midi % 12 + 12) % 12);
    }
    expect([...vistas].sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });

  it('melodia-de-ouvido usa só as notas escolhidas, em toda a melodia', () => {
    for (let i = 0; i < 60; i++) {
      const q = melodiaDeOuvido.make!({ ...melodiaDeOuvido.defaults, notasEscolhidas: DO_MI_SOL } as never, ctx);
      for (const m of (q.expected as { midis: number[] }).midis) expect([0, 4, 7]).toContain(((m % 12) + 12) % 12);
    }
  });

  it('ouvido-intervalo parte de uma das notas escolhidas', () => {
    const vistas = new Set<number>();
    for (let i = 0; i < 80; i++) {
      const q = ouvidoIntervalo.make!({ ...ouvidoIntervalo.defaults, resposta: 'notas', direcao: 'juntas', notasEscolhidas: DO_MI_SOL } as never, ctx);
      vistas.add((Math.min(...(q.expected as { midis: number[] }).midis) % 12 + 12) % 12);
    }
    expect([...vistas].sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });
});

describe('recusar em vez de sortear o impossível (decisão 13)', () => {
  it('só teclas pretas escolhidas, com pretas desligadas, não tem nota nenhuma', () => {
    expect(ouvidoTecla.problema!({ ...ouvidoTecla.defaults, pretas: false, notasEscolhidas: ['1', '3', '6'] } as never, ctx)).toBeTruthy();
    expect(ouvidoTecla.problema!({ ...ouvidoTecla.defaults, pretas: true, notasEscolhidas: ['1', '3', '6'] } as never, ctx)).toBeNull();
  });

  it('uma nota só numa região curta não dá melodia; numa região larga dá (oitavas)', () => {
    const curta = ctxCom({ key: { tonic: 0, mode: 'maior' }, range: { lo: 60, hi: 64 } });
    expect(melodiaDeOuvido.problema!({ ...melodiaDeOuvido.defaults, notasEscolhidas: ['0'] } as never, curta)).toBeTruthy();
    expect(melodiaDeOuvido.problema!({ ...melodiaDeOuvido.defaults, notasEscolhidas: ['0'] } as never, ctx)).toBeNull();
  });
});
