// Dois atalhos do mesmo item não podem ser indistinguíveis — 20/11/2026.
//
// **O defeito que isto guarda já aconteceu.** Quando os atalhos passaram a governar só as chaves em
// que discordam (`chavesDisputadas`), apareceu um par que discordava apenas numa chave que os dois
// deixavam no padrão: clicar num acendia os dois chips, e a tela passava a mentir sobre o que estava
// em vigor.
//
// Escrito depois de dez atalhos novos entrarem de uma vez (o modo quiz da relação melodia-harmonia),
// que é exatamente quando esse par passa despercebido.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx } from './types';
import { chavesDisputadas } from './atalhos';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
const ctx: Ctx = { naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params: resolveParams('violao', {}) };
describe('atalhos', () => {
  /**
   * Dois atalhos são indistinguíveis quando concordam em **todas** as chaves disputadas e nos
   * parâmetros de prática. Repare que não basta compararem as `settings` escritas: o que vale é o
   * valor RESOLVIDO contra os padrões, porque é assim que a tela decide qual chip acende.
   */
  it('nenhum par de atalhos do mesmo item é indistinguível', () => {
    const iguais: string[] = [];
    for (const ex of EXERCISES.filter(isSeries)) {
      const ps = ex.presets ?? [];
      const chaves = chavesDisputadas(ex).settings;
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const base = { ...ex.defaults, ...(ex.defaultsDo?.(ctx) ?? {}) } as Record<string, unknown>;
        const v = (p: typeof ps[number]) => chaves.map(k => JSON.stringify((p.settings as Record<string, unknown>)?.[k] ?? base[k])).join('|');
        const mesmoParams = JSON.stringify(ps[i].params ?? {}) === JSON.stringify(ps[j].params ?? {});
        if (v(ps[i]) === v(ps[j]) && mesmoParams) iguais.push(`${ex.id}: ${ps[i].id} = ${ps[j].id}`);
      }
    }
    expect(iguais).toEqual([]);
  });
});
