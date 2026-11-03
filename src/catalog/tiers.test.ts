// F2-2 · a dica de dificuldade por opção.
//
// O `tier` existe por um motivo só: a variação automática PRÉ-MARCAR o que costuma ser o próximo
// passo (decisão 9). Ele nunca ordena, nunca bloqueia e nunca esconde — e, mais importante, ele
// está AUSENTE onde não há ordem defensável. Forçar progressão linear onde a ordem é variável é
// erro pedagógico, e é o que estes testes vigiam.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { resolveParams } from './params';
import type { Ctx, Setting, SettingOption } from './types';

const ctx: Ctx = {
  naming: 'pt',
  conv: 'pt',
  t: ((k: string) => k) as never,
  params: resolveParams('violao'),
};

const todasAsConfigs = (): { ex: string; s: Setting }[] =>
  EXERCISES.flatMap(e => e.settings(ctx).map(s => ({ ex: e.id, s })));

const todasAsOpcoes = (): { ex: string; setting: string; o: SettingOption }[] =>
  todasAsConfigs().flatMap(({ ex, s }) => (s.options ?? []).map(o => ({ ex, setting: s.id, o })));

describe('dica de dificuldade', () => {
  it('todo tier declarado é 1, 2 ou 3', () => {
    for (const { o } of todasAsOpcoes()) {
      if (o.tier !== undefined) expect([1, 2, 3]).toContain(o.tier);
    }
  });

  it('a maioria das opções NÃO tem tier — ausente quer dizer "sem opinião"', () => {
    const opcoes = todasAsOpcoes();
    const semTier = opcoes.filter(({ o }) => o.tier === undefined);
    expect(semTier.length).toBeGreaterThan(opcoes.length / 2);
  });

  it('onde não existe ordem defensável, o tier fica ausente', () => {
    // não existe "clave de sol mais fácil que clave de fá", nem instrumento mais fácil
    const semOrdem = ['claves', 'instrumento', 'onde', 'direcao', 'forma'];
    for (const { setting, o, ex } of todasAsOpcoes()) {
      if (semOrdem.includes(setting)) {
        expect(o.tier, `${ex}.${setting}.${o.id} não deveria ter tier`).toBeUndefined();
      }
    }
  });

  it('onde existe ordem defensável, o tier está lá e cobre a lista inteira', () => {
    // meia dica é pior que nenhuma: se a lista tem ordem, toda opção dela precisa de tier
    const comOrdem = ['intervalos', 'max', 'extensao', 'casas'];
    const porConfig = new Map<string, SettingOption[]>();
    for (const { ex, setting, o } of todasAsOpcoes()) {
      if (!comOrdem.includes(setting)) continue;
      const chave = `${ex}.${setting}`;
      porConfig.set(chave, [...(porConfig.get(chave) ?? []), o]);
    }
    expect(porConfig.size).toBeGreaterThan(3);
    for (const [chave, opcoes] of porConfig) {
      const comTier = opcoes.filter(o => o.tier !== undefined).length;
      expect(comTier, `${chave}: ${comTier} de ${opcoes.length} com tier`).toBe(opcoes.length);
    }
  });

  it('uma lista com tier sempre tem mais de um nível — senão a dica não diz nada', () => {
    const porConfig = new Map<string, Set<number>>();
    for (const { ex, setting, o } of todasAsOpcoes()) {
      if (o.tier === undefined) continue;
      const chave = `${ex}.${setting}`;
      porConfig.set(chave, (porConfig.get(chave) ?? new Set()).add(o.tier));
    }
    for (const [chave, niveis] of porConfig) {
      expect(niveis.size, `${chave} tem um nível só`).toBeGreaterThan(1);
    }
  });

  it('a ordem declarada das opções não é a ordem do tier — a lista não se reordena sozinha', () => {
    // vigia o "nunca ordena": se alguém passar a ordenar por tier na declaração, isto acusa, e a
    // pessoa perde a ordem musical (oitava, quinta, quarta…) que é a que ela reconhece
    const ivs = todasAsConfigs().find(c => c.s.id === 'intervalos' && c.ex === 'pauta-intervalo');
    expect(ivs).toBeDefined();
    const ids = (ivs!.s.options ?? []).map(o => o.id);
    expect(ids[0]).toBe('J8'); // oitava primeiro, por ser a mais reconhecível
    expect(ids).toContain('d5');
  });
});
