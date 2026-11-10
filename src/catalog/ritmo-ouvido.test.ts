// P5 (06/11/2026): "Que ritmo é esse?" deixa de ter níveis exclusivos. Tercinas e semicolcheias
// passam a poder aparecer juntas — o que a revisão apontou como "opção complementar que virou
// mutuamente exclusiva".
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { celulasDe } from './items/ritmo-ouvido';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { CELLS, RHYTHM_PRESETS, type CellId } from '../theory/rhythm';
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

// Alternativas difíceis (09/11/2026). O Paulo: "faça com que alternativas com semibreve nao
// apareçam em ritmos sem semibreve e coisas afins. deixe tudo mais parecido."
//
// Antes os quatro compassos eram sorteados **independentes**, e bastava um ter uma semibreve para
// se descartar sem ouvir nada. Medido com todos os grupos ligados: só 26% das alternativas
// compartilhavam a assinatura da certa — ou seja, **três de cada quatro eram descartáveis de
// olho**. Depois: 99%.
describe('as alternativas não se descartam de olho', () => {
  const CONJUNTOS = [['basico'], ['basico', 'pausas'], ['basico', 'semis'], ['sincope'],
    ['basico', 'tercinas'], ['basico', 'pausas', 'semis', 'tercinas', 'contratempo', 'sincope']];

  /** O que se lê de relance numa alternativa: figuras usadas, ataques, e se tem pausa. */
  const assinatura = (bar: CellId[]) => {
    const figuras = new Set<string>();
    let ataques = 0, pausa = false;
    for (const c of bar) {
      for (const ev of CELLS[c].events) {
        figuras.add(String(ev.d) + (ev.dot ? '.' : ''));
        if (ev.rest) pausa = true; else ataques++;
      }
    }
    return `${[...figuras].sort().join(',')}|${ataques}|${pausa ? 'r' : '-'}`;
  };
  const barras = (q: ReturnType<typeof perguntar>) => {
    if (q.surface.kind !== 'choices' || q.expected.kind !== 'option') throw new Error('esperava escolhas');
    return { certa: q.expected.id.split('|') as CellId[], opcoes: q.surface.options.map(o => o.id.split('|') as CellId[]) };
  };

  it.each(CONJUNTOS.map(g => [g.join('+'), g] as const))('%s: a grande maioria das alternativas tem a assinatura da certa', (_, grupos) => {
    let total = 0, iguais = 0;
    for (let i = 0; i < 200; i++) {
      const { certa, opcoes } = barras(perguntar({ figuras: [...grupos] }));
      const da = assinatura(certa);
      for (const o of opcoes) { total++; if (assinatura(o) === da) iguais++; }
    }
    expect(total).toBeGreaterThan(700);
    expect(iguais / total).toBeGreaterThan(0.8);
  });

  it.each(CONJUNTOS.map(g => [g.join('+'), g] as const))('%s: sempre quatro alternativas distintas, e a certa entre elas', (_, grupos) => {
    for (let i = 0; i < 120; i++) {
      const q = perguntar({ figuras: [...grupos] });
      const { certa, opcoes } = barras(q);
      expect(opcoes).toHaveLength(4);
      expect(new Set(opcoes.map(o => o.join('|'))).size).toBe(4);
      expect(opcoes.map(o => o.join('|'))).toContain(certa.join('|'));
    }
  });

  // A regra que o `ouvido-celulas` ensinou: distrator que o gerador não poderia ter produzido
  // entrega a resposta. Aqui o risco concreto é permutar `[h, q, q]` em `[q, h, q]` — uma mínima
  // atravessando a divisão do compasso, que precisa de ligadura e que `randomBars` nunca faz.
  it.each(CONJUNTOS.map(g => [g.join('+'), g] as const))('%s: toda alternativa é um compasso que o gerador poderia ter montado', (_, grupos) => {
    for (let i = 0; i < 120; i++) {
      for (const bar of barras(perguntar({ figuras: [...grupos] })).opcoes) {
        let left = 4;
        for (const c of bar) {
          const beats = CELLS[c].beats;
          expect(beats, `${bar.join('|')}: ${c} não cabe`).toBeLessThanOrEqual(left);
          if (beats === 2) expect(left % 2, `${bar.join('|')}: mínima em tempo ímpar`).toBe(0);
          left -= beats;
        }
        expect(left, `${bar.join('|')} não soma quatro tempos`).toBe(0);
      }
    }
  });
});
