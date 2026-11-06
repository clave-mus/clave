// P5 (06/11/2026): "Que ritmo é esse?" deixa de ter níveis exclusivos. Tercinas e semicolcheias
// passam a poder aparecer juntas — o que a revisão apontou como "opção complementar que virou
// mutuamente exclusiva".
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { celulasDe } from './items/ritmo-ouvido';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { RHYTHM_PRESETS } from '../theory/rhythm';
import { NIVEL_PARA_FIGURAS, settingsFundidos } from '../state/migrate';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ritmo-ouvido')!;
const perguntar = (s: Record<string, SettingValue>) => item.make({ ...item.defaults, ...s } as never, ctx);
/** As células que uma pergunta usou, olhando todas as alternativas (os ids são `célula|célula|…`). */
const celulasUsadas = (figuras: string[], rodadas = 80) => {
  const vistas = new Set<string>();
  for (let i = 0; i < rodadas; i++) {
    const q = perguntar({ figuras });
    if (q.surface.kind !== 'choices') continue;
    for (const o of q.surface.options) o.id.split('|').forEach(c => vistas.add(c));
  }
  return vistas;
};

describe('os grupos se somam', () => {
  it('semicolcheias e tercinas juntas: as duas aparecem — antes era uma OU outra', () => {
    const vistas = celulasUsadas(['basico', 'semis', 'tercinas']);
    expect(vistas.has('16x4') || vistas.has('8-16-16') || vistas.has('16-16-8')).toBe(true);
    expect(vistas.has('3x8')).toBe(true);
  });

  it('só o que foi marcado aparece', () => {
    const vistas = celulasUsadas(['basico', 'tercinas']);
    expect(vistas.has('3x8')).toBe(true);
    expect(vistas.has('16x4')).toBe(false);
    expect(vistas.has('qr')).toBe(false);
  });

  it('a união não repete célula (contratempo está em dois grupos)', () => {
    const cells = celulasDe(['contratempo', 'sincope']);
    expect(new Set(cells).size).toBe(cells.length);
  });
});

describe('o grupo sozinho ainda faz pergunta com alternativas diferentes', () => {
  // Só `contratempo` ou só `tercinas` é UMA célula: o compasso sairia igual em todos os tempos e não
  // haveria como montar três alternativas distintas. A base entra — e é o único acréscimo do app.
  it.each(['contratempo', 'tercinas'])('%s sozinho: quatro alternativas, todas distintas', grupo => {
    for (let i = 0; i < 40; i++) {
      const q = perguntar({ figuras: [grupo] });
      if (q.surface.kind !== 'choices') throw new Error('esperava escolhas');
      expect(q.surface.options).toHaveLength(4);
      expect(new Set(q.surface.options.map(o => o.id)).size).toBe(4);
    }
  });

  it('a base entra quando a seleção só tem uma célula', () => {
    expect(celulasDe(['tercinas'])).toEqual(expect.arrayContaining(['3x8', 'q', '8-8']));
  });

  it('com duas células ou mais, nada é acrescentado', () => {
    expect(celulasDe(['pausas']).sort()).toEqual(['h', 'qr']);
  });
});

describe('os atalhos reproduzem os níveis antigos exatamente', () => {
  it.each(RHYTHM_PRESETS)('$id: as mesmas células que o nível antigo tinha', ({ id, cells }) => {
    const atalho = item.presets!.find(p => p.id === id);
    expect(atalho, `falta o atalho ${id}`).toBeDefined();
    expect(celulasDe(atalho!.settings.figuras as string[]).sort()).toEqual([...cells].sort());
  });

  it('os seis atalhos existem, e só eles', () => {
    expect(item.presets!.map(p => p.id).sort()).toEqual(RHYTHM_PRESETS.map(p => p.id).sort());
  });
});

describe('rotina salva com o nível antigo', () => {
  it('vira os grupos equivalentes, e o `nivel` some', () => {
    const r = settingsFundidos('ritmo-ouvido', { nivel: 'tercinas', outra: 1 });
    expect(r.id).toBe('ritmo-ouvido');
    expect(r.settings).toEqual({ outra: 1, figuras: ['basico', 'tercinas'] });
  });

  it('cada nível antigo migra para as mesmas células que tinha', () => {
    for (const p of RHYTHM_PRESETS) {
      const { settings } = settingsFundidos('ritmo-ouvido', { nivel: p.id });
      expect(celulasDe(settings.figuras as string[]).sort(), p.id).toEqual([...p.cells].sort());
    }
  });

  it('nível desconhecido não quebra: sai sem `nivel` e o padrão do item assume', () => {
    expect(settingsFundidos('ritmo-ouvido', { nivel: 'inventado' }).settings).toEqual({});
  });

  it('configuração já nova passa intacta', () => {
    expect(settingsFundidos('ritmo-ouvido', { figuras: ['semis'] }).settings).toEqual({ figuras: ['semis'] });
  });

  it('a tabela de migração cobre exatamente os níveis que existiam', () => {
    expect(Object.keys(NIVEL_PARA_FIGURAS).sort()).toEqual(RHYTHM_PRESETS.map(p => p.id).sort());
  });
});
