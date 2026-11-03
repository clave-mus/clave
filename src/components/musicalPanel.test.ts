// A costura entre o painel do Perfil e a cascata (F2-3, decisão 57).
//
// O motor já tem o seu contrato em contexto-musical.test.ts. O que falta provar é que **o que o
// painel grava é exatamente o que os itens leem** — a decisão 57 nasceu de a cascata ter zero
// leitores, e um painel que gravasse em outra chave reproduziria o mesmo problema pelo outro lado.
import { describe, expect, it } from 'vitest';
import { resolveParams, type StoredParams } from '../catalog/params';
import { pcsPermitidas, regiao, soDiatonico, tonalidade, clave } from '../catalog/contexto-musical';
import { translate, type MessageKey } from '../i18n';
import type { Ctx } from '../catalog/types';

/** Exatamente o que o MusicalPanel escreve com `setParams`. */
const DO_PAINEL: StoredParams = {
  key: { tonic: 5, mode: 'maior' },          // Fá maior
  range: { lo: 48, hi: 72 },                 // região média
  material: 'diatonico',                     // só a tonalidade
  clef: 'fa',                                // clave de fá
};

const ctxCom = (stored: StoredParams): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey) => translate('pt', k), params: resolveParams('baixo', stored),
});

describe('o painel grava o que a cascata lê', () => {
  const ctx = ctxCom(DO_PAINEL);

  it('a tonalidade chega inteira', () => {
    expect(tonalidade(ctx)).toEqual({ tonic: 5, mode: 'maior' });
  });

  it('a região chega como piso e teto', () => {
    expect(regiao(ctx)).toEqual({ lo: 48, hi: 72 });
  });

  it('a clave chega, e a do item ainda vence quando ele declara uma', () => {
    expect(clave(ctx)).toBe('fa');
    expect(clave(ctx, 'sol')).toBe('sol');
  });

  it('material + tonalidade restringem às sete notas de Fá maior — com Si♭, nunca Lá♯', () => {
    expect(soDiatonico(ctx)).toBe(true);
    const pcs = pcsPermitidas(ctx).sort((a, b) => a - b);
    expect(pcs).toEqual([0, 2, 4, 5, 7, 9, 10]); // Dó Ré Mi Fá Sol Lá Si♭
    expect(pcs).not.toContain(11); // Si natural não está em Fá maior
  });
});

describe('os padrões do painel são os padrões da cascata', () => {
  it('sem nada gravado, tonalidade é livre e material é cromático', () => {
    const ctx = ctxCom({});
    expect(tonalidade(ctx)).toBeNull();
    expect(soDiatonico(ctx)).toBe(false);
    expect(pcsPermitidas(ctx)).toHaveLength(12);
  });

  it('"Voltar ao padrão" devolve exatamente o estado de quem nunca mexeu', () => {
    const voltou = ctxCom({ key: null, range: { lo: 48, hi: 72 }, material: 'cromatico', clef: 'sol' });
    const nunca = ctxCom({});
    for (const k of ['key', 'range', 'material', 'clef'] as const) {
      expect(voltou.params[k], k).toEqual(nunca.params[k]);
    }
  });

  it('material diatônico sem tonalidade não restringe nada — por isso o painel avisa', () => {
    const ctx = ctxCom({ material: 'diatonico' });
    expect(soDiatonico(ctx)).toBe(false);
    expect(pcsPermitidas(ctx)).toHaveLength(12);
  });
});
