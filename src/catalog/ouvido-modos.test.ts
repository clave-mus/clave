// Os modos das menores no ouvido — 26/11/2026.
//
// Ele pediu os modos da menor harmônica e da melódica, e viu o problema junto: *"talvez fique
// muita coisa para selecionar cada escala de uma só vez"*. Medido, ele tinha razão — cadastrar os
// modos como escalas levaria a lista de 13 para 25 chips, em 25 lugares do app.
//
// A rota escolhida troca a lista em vez de aumentá-la: `material: 'modos'` sorteia por família ×
// grau. O que este arquivo trava é o que falha calado nessa rota — alternativa que não distingue,
// tônica que entrega a resposta, e a convenção de nome que ele fixou em 25/11.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 0, mode: 'maior' } }),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-escala') as SeriesItem;
const base = { ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) };
const pergunta = (extra: Record<string, unknown> = {}) =>
  item.make({ ...base, material: 'modos', ...extra } as never, ctx);

describe('a rota dos modos', () => {
  it('a lista de escalas some, e família e grau aparecem', () => {
    const comModos = { ...base, material: 'modos' } as never;
    const visiveis = item.settings(ctx).filter(s => s.quando?.(comModos) ?? true).map(s => s.id);
    expect(visiveis).toContain('familia');
    expect(visiveis).toContain('graus');
    expect(visiveis, 'a lista de 13 escalas continuou na tela').not.toContain('tipos');
    // e o contrário: escolhendo escalas, família e grau somem
    const comEscalas = { ...base, material: 'escalas' } as never;
    const outras = item.settings(ctx).filter(s => s.quando?.(comEscalas) ?? true).map(s => s.id);
    expect(outras).toContain('tipos');
    expect(outras).not.toContain('familia');
  });

  it('as alternativas são os pares marcados, e a certa está entre elas', () => {
    for (let i = 0; i < 60; i++) {
      const q = pergunta({ familia: ['menor-melodica-jazz'], graus: ['1', '2', '3', '4', '5', '6', '7'] });
      if (q.surface.kind !== 'choices') continue;
      expect(q.surface.options).toHaveLength(7);
      expect(q.surface.options.map(o => o.id)).toContain((q.expected as { id: string }).id);
      // todas da mesma família: é o recorte que a pessoa pediu
      for (const o of q.surface.options) expect(o.id.startsWith('menor-melodica-jazz:')).toBe(true);
    }
  });

  /** Duas famílias marcadas dão 14 alternativas — e nenhuma repetida. */
  it('com duas famílias, as alternativas somam e não se repetem', () => {
    const q = pergunta({ familia: ['menor-harmonica', 'menor-melodica-jazz'], graus: ['1', '2', '3', '4', '5', '6', '7'] });
    if (q.surface.kind !== 'choices') throw new Error('esperava alternativas');
    expect(q.surface.options).toHaveLength(14);
    expect(new Set(q.surface.options.map(o => o.id)).size).toBe(14);
  });

  /**
   * **O som é o modo, subindo e fechando na oitava** — e não as sete notas soltas. Era o defeito
   * que ele ouviu no exercício de digitação em 25/11, e aqui ele não pode nascer de novo.
   */
  it('o som sobe sempre e fecha na oitava', () => {
    for (let i = 0; i < 40; i++) {
      const ms = (pergunta().sound?.groups ?? []).flat();
      expect(ms).toHaveLength(8);
      for (let k = 1; k < ms.length; k++) expect(ms[k]).toBeGreaterThan(ms[k - 1]);
      expect(ms[7] - ms[0]).toBe(12);
    }
  });

  it('a revelação traz o nome tradicional quando ele existe', () => {
    let viu = false;
    for (let i = 0; i < 120; i++) {
      const q = pergunta({ familia: ['menor-melodica-jazz'], graus: ['4'] });
      expect(q.reveal).toContain('4º');
      expect(q.reveal, 'o 4º da melódica é o lídio dominante').toContain('lídio dominante');
      viu = true;
    }
    expect(viu).toBe(true);
  });

  it('e fica só no grau quando o modo não tem nome corrente', () => {
    const q = pergunta({ familia: ['menor-harmonica'], graus: ['3'] });
    expect(q.reveal).toContain('3º');
    expect(q.reveal).not.toContain('·');
  });
});
