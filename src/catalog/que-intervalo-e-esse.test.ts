// P5: melódico e harmônico deixam de ser exclusivos em `que-intervalo-e-esse`.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'intervalo-na-pauta')!;
/** Quantas colunas tem a pauta: duas notas em sequência (melódico) ou as duas juntas (harmônico). */
const colunas = (forma: string) => {
  const q = item.make({ ...item.defaults, direcao: 'ler', forma } as Record<string, SettingValue> as never, ctx);
  if (q.visual.kind !== 'staff') throw new Error('esperava pauta');
  return q.visual.columns.length;
};
const amostra = (forma: string, n = 120) => Array.from({ length: n }, () => colunas(forma));

describe('forma do intervalo', () => {
  it('melódico: sempre duas notas em sequência', () => {
    expect(new Set(amostra('melodico'))).toEqual(new Set([2]));
  });

  it('harmônico: sempre as duas juntas', () => {
    expect(new Set(amostra('harmonico'))).toEqual(new Set([1]));
  });

  it('ambas: aparecem as duas formas, e em proporção parecida', () => {
    const a = amostra('ambas', 300);
    const melodicas = a.filter(c => c === 2).length;
    expect(new Set(a)).toEqual(new Set([1, 2]));
    expect(melodicas).toBeGreaterThan(90); // ~150 esperado; folga larga para não ser frágil
    expect(melodicas).toBeLessThan(210);
  });

  it('o som acompanha o desenho: harmônico toca junto, melódico em sequência', () => {
    for (let i = 0; i < 60; i++) {
      const q = item.make({ ...item.defaults, direcao: 'ler', forma: 'ambas' } as never, ctx);
      if (q.visual.kind !== 'staff' || !q.sound) throw new Error('esperava pauta com som');
      const grupos = q.sound.groups;
      expect(grupos.length, 'cada coluna do desenho é um grupo de som').toBe(q.visual.columns.length);
    }
  });
});
