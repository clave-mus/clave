import { describe, expect, it } from 'vitest';
import { DEFAULT_PRESENTATION } from '../audio/presentation';
import { getState, setParams, setState } from '../state/store';
import { DEFAULT_PARAMS, globalPresentation, resolveParams, VOLUME_RANGE } from './params';

describe('parâmetros globais', () => {
  it('sem escolha da pessoa, valem os padrões e a afinação do instrumento', () => {
    const p = resolveParams('baixo');
    expect(p.timbres).toEqual({ piano: 'piano', violao: 'violao', baixo: 'baixo' });
    expect(p.volume).toBe(1);
    expect(p.tuning).toHaveLength(4);
    expect(resolveParams('violao').tuning).toHaveLength(6);
  });
  it('trocar o timbre de um instrumento não mexe nos outros', () => {
    const p = resolveParams('violao', { timbres: { violao: 'pad' } });
    expect(p.timbres).toEqual({ piano: 'piano', violao: 'pad', baixo: 'baixo' });
  });
  it('a camada global da apresentação usa o timbre do instrumento do som e o volume escolhido', () => {
    const p = resolveParams('violao', { timbres: { piano: 'orgao', baixo: 'violao' }, volume: 0.5 });
    expect(globalPresentation(p)).toEqual({ voice: 'orgao', volume: 0.5 * DEFAULT_PRESENTATION.volume });
    expect(globalPresentation(p, 'baixo').voice).toBe('violao');
    expect(globalPresentation(p, 'violao').voice).toBe('violao');
  });
  it('o volume padrão (100%) cabe na faixa do controle', () => {
    expect(DEFAULT_PARAMS.volume).toBeGreaterThanOrEqual(VOLUME_RANGE.min);
    expect(DEFAULT_PARAMS.volume).toBeLessThanOrEqual(VOLUME_RANGE.max);
  });
});

describe('guardar parâmetros globais', () => {
  it('os timbres escolhidos se somam e o volume substitui', () => {
    setState(s => ({ ...s, params: {} }));
    setParams({ timbres: { piano: 'orgao' } });
    setParams({ timbres: { baixo: 'pad' } });
    setParams({ volume: 0.8 });
    setParams({ volume: 1.1 });
    expect(getState().params).toEqual({ timbres: { piano: 'orgao', baixo: 'pad' }, volume: 1.1 });
  });
});
