// A decisão 87 no estado: tonalidade, região e material são de PRÁTICA, por exercício, e não moram
// no perfil. Também prova que o estado antigo — quando eles moravam — é limpo, em vez de continuar
// valendo em silêncio.
import { beforeEach, describe, expect, it } from 'vitest';
import { migrateSaved } from './migrate';
import { getState, limparPratica, setParams, setPratica, setState, DEFAULT_STATE } from './store';
import { resolveCamadas, camadaDoPerfil, resolveParams, valoresDe } from '../catalog/params';
import { pcsPermitidas, regiao, soDiatonico, tonalidade } from '../catalog/contexto-musical';
import { translate, type MessageKey } from '../i18n';
import type { Ctx } from '../catalog/types';

beforeEach(() => { setState(() => ({ ...DEFAULT_STATE })); });

describe('prática por exercício', () => {
  it('cada exercício guarda a sua — Fá maior num não vira Fá maior em todos', () => {
    setPratica('ouvido-escala', { key: { tonic: 5, mode: 'maior' } });
    setPratica('pauta-nota', { key: { tonic: 7, mode: 'menor' } });
    expect(getState().pratica['ouvido-escala'].key).toEqual({ tonic: 5, mode: 'maior' });
    expect(getState().pratica['pauta-nota'].key).toEqual({ tonic: 7, mode: 'menor' });
    expect(getState().pratica['quiz-teoria']).toBeUndefined();
  });

  it('mexer num parâmetro não apaga os outros do mesmo exercício', () => {
    setPratica('x', { key: { tonic: 2, mode: 'maior' } });
    setPratica('x', { material: 'diatonico' });
    expect(getState().pratica.x).toEqual({ key: { tonic: 2, mode: 'maior' }, material: 'diatonico' });
  });

  it('limpar devolve o exercício ao que ele faz sem ninguém ter mexido', () => {
    setPratica('x', { key: { tonic: 2, mode: 'maior' } });
    limparPratica('x');
    expect(getState().pratica.x).toBeUndefined();
  });

  it('limpar um exercício não toca nos outros', () => {
    setPratica('a', { range: { lo: 36, hi: 60 } });
    setPratica('b', { range: { lo: 60, hi: 84 } });
    limparPratica('a');
    expect(getState().pratica.b).toEqual({ range: { lo: 60, hi: 84 } });
  });

  it('o perfil guarda só o que é da pessoa, e mexer nele não cria prática', () => {
    setParams({ volume: 0.8, timbres: { baixo: 'pad' } });
    expect(getState().params).toEqual({ volume: 0.8, timbres: { baixo: 'pad' } });
    expect(getState().pratica).toEqual({});
  });
});

describe('a prática chega ao item pela cascata, por cima do perfil', () => {
  const ctxCom = (pratica: Parameters<typeof resolveParams>[1]): Ctx => ({
    naming: 'pt', conv: 'pt', t: (k: MessageKey) => translate('pt', k),
    params: valoresDe(resolveCamadas([camadaDoPerfil('baixo', {}), { origin: 'agora', values: pratica ?? {} }])),
  });

  it('Fá maior + "só a tonalidade" dá exatamente Dó Ré Mi Fá Sol Lá Si♭ — Si natural fica de fora', () => {
    const ctx = ctxCom({ key: { tonic: 5, mode: 'maior' }, material: 'diatonico' });
    expect(tonalidade(ctx)).toEqual({ tonic: 5, mode: 'maior' });
    expect(soDiatonico(ctx)).toBe(true);
    expect(pcsPermitidas(ctx).sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 7, 9, 10]);
  });

  it('a região chega como piso e teto', () => {
    expect(regiao(ctxCom({ range: { lo: 36, hi: 60 } }))).toEqual({ lo: 36, hi: 60 });
  });

  it('sem nada escolhido, tonalidade é livre e material é cromático — "livre" é o padrão', () => {
    const ctx = ctxCom({});
    expect(tonalidade(ctx)).toBeNull();
    expect(pcsPermitidas(ctx)).toHaveLength(12);
  });

  it('a prática vence o que estiver por baixo, e a origem diz que veio de "agora"', () => {
    const r = resolveCamadas([
      { origin: 'rotina', values: { key: { tonic: 0, mode: 'maior' } } },
      { origin: 'agora', values: { key: { tonic: 7, mode: 'maior' } } },
    ]);
    expect(r.key.value?.tonic).toBe(7);
    expect(r.key.origin).toBe('agora');
  });
});

describe('estado antigo: o que saiu do perfil é limpo, não fica valendo em silêncio', () => {
  const antigo = {
    v: 1,
    params: {
      key: { tonic: 5, mode: 'maior' }, range: { lo: 36, hi: 60 }, material: 'diatonico', clef: 'fa', tempo: 90,
      volume: 0.8, tuning: [28, 33, 38, 43], timbres: { baixo: 'pad' },
    },
    arsenal: ['pauta-nota', 'quiz-teoria'],
  };

  it('tira tonalidade, região, material, clave e tempo de `params`', () => {
    const p = migrateSaved(antigo).params as Record<string, unknown>;
    for (const k of ['key', 'range', 'material', 'clef', 'tempo']) expect(p, k).not.toHaveProperty(k);
  });

  it('e mantém o que é da pessoa', () => {
    expect(migrateSaved(antigo).params).toEqual({ volume: 0.8, tuning: [28, 33, 38, 43], timbres: { baixo: 'pad' } });
  });

  // Se a tonalidade antiga continuasse em `params`, `resolveParams` a espalharia na camada do perfil
  // e ela valeria em todo exercício — vinda de uma camada que a decisão 87 aboliu.
  it('depois da migração, a tonalidade antiga não chega mais a nenhum item', () => {
    const p = migrateSaved(antigo).params as Parameters<typeof resolveParams>[1];
    expect(resolveParams('baixo', p).key).toBeNull();
    expect(resolveParams('baixo', p).material).toBe('cromatico');
  });

  it('o arsenal sai (decisão 88)', () => {
    expect(migrateSaved(antigo)).not.toHaveProperty('arsenal');
  });

  it('estado sem `params` não quebra', () => {
    expect(() => migrateSaved({ v: 1 })).not.toThrow();
  });
});
