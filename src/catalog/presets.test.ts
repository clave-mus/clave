// Os atalhos (presets) — 09/11/2026.
//
// O Paulo quer presets em TODOS os exercícios, e que sejam parte importante da interface. Então
// este arquivo guarda as invariantes genéricas, e não só as do `ouvido-celulas`: um atalho que
// escreve numa configuração que não existe é um atalho morto, e ninguém percebe olhando a tela.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { MESSAGES, translate, type Locale, type MessageKey, type Vars } from '../i18n';
import { mod } from '../theory/core';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const comPresets = EXERCISES.filter(isSeries).filter(e => e.presets?.length);

/**
 * `translate` devolve **a própria chave** quando ela não existe — é o que acontece com chave
 * montada em tempo de execução, e é o caso de `ritmo-ouvido`, que monta `theory.rhythmPresets.<id>`.
 * Então o teste compara o texto com a chave: igual significa que a tradução não existe.
 */
const traduzido = (locale: Locale, k: MessageKey) => translate(locale, k) !== k;

describe('todo atalho é aplicável', () => {
  it('há itens com atalho (senão este arquivo não afirma nada)', () => {
    expect(comPresets.length).toBeGreaterThanOrEqual(3);
  });

  it.each(comPresets.map(e => e.id))('%s: toda configuração do atalho existe no item', id => {
    const item = EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
    const declaradas = new Map(item.settings(ctx).map(s => [s.id, s]));
    for (const p of item.presets!) {
      for (const [chave, valor] of Object.entries(p.settings)) {
        const s = declaradas.get(chave);
        expect(s, `${id}/${p.id}: configuração "${chave}" não existe`).toBeTruthy();
        if (!s?.options) continue;
        const validos = s.options.map(o => o.id);
        for (const v of Array.isArray(valor) ? valor : [valor]) {
          if (typeof v !== 'string') continue;
          expect(validos, `${id}/${p.id}: "${chave}" = "${v}" não é opção`).toContain(v);
        }
      }
    }
  });

  it.each(comPresets.map(e => e.id))('%s: todo atalho tem nome traduzido nos dois idiomas', id => {
    const item = EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
    for (const p of item.presets!) {
      // Nos DOIS idiomas: há teste que pega chave faltando em `en`, mas não uma chave que exista
      // só porque alguém a montou e ninguém traduziu.
      for (const locale of Object.keys(MESSAGES) as Locale[]) {
        expect(traduzido(locale, p.nome), `${id}/${p.id}/${locale}: falta ${p.nome}`).toBe(true);
      }
    }
  });

  it.each(comPresets.map(e => e.id))('%s: os ids dos atalhos são distintos', id => {
    const item = EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
    const ids = item.presets!.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // O primeiro atalho é a ENTRADA do item (`Player`): quem abre sem nada salvo cai nele. Um
  // atalho aplicado sozinho tem de gerar pergunta válida, senão o item abre quebrado.
  it.each(comPresets.map(e => e.id))('%s: o primeiro atalho sozinho gera pergunta válida', id => {
    const item = EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
    const p = item.presets![0];
    const c: Ctx = { ...ctx, params: resolveParams('baixo', p.params ?? {}) };
    for (let i = 0; i < 20; i++) {
      const q = item.make({ ...item.defaults, ...p.settings } as never, c);
      expect(q.prompt, id).toBeTruthy();
      if (q.surface.kind === 'choices') {
        expect(q.surface.options.length, id).toBeGreaterThanOrEqual(2);
        expect(new Set(q.surface.options.map(o => o.id)).size, id).toBe(q.surface.options.length);
      }
    }
  });
});

describe('ouvido-celulas: os sete atalhos do Paulo', () => {
  const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-celulas') as SeriesItem;

  it('o primeiro é o mais simples: uma nota, escala maior', () => {
    expect(item.presets![0].settings).toMatchObject({ escala: 'maior', tamanho: '1' });
  });

  it('todos pedem dó maior, que foi o padrão que o Paulo escolheu', () => {
    for (const p of item.presets!) {
      expect(p.params?.key, p.id).toEqual({ tonic: 0, mode: 'maior' });
    }
  });

  // A prova de que `params` no atalho não é decoração: com dó maior em vigor, a tônica sorteada
  // é SEMPRE um dó. Sem ele (`key: null`) ela passeia pelas doze.
  it('com o atalho em vigor, a tônica é sempre dó', () => {
    const c: Ctx = { ...ctx, params: resolveParams('baixo', item.presets![0].params) };
    for (let i = 0; i < 40; i++) {
      const q = item.make({ ...item.defaults, ...item.presets![0].settings } as never, c);
      expect(mod(q.sound!.groups[0][0], 12)).toBe(0);
    }
  });

  it('sem tonalidade escolhida, a tônica não fica presa em dó', () => {
    const vistas = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const q = item.make({ ...item.defaults } as never, ctx);
      vistas.add(mod(q.sound!.groups[0][0], 12));
    }
    expect(vistas.size).toBeGreaterThan(3);
  });

  it('"sobre o V" usa o grau 5, e "acorde sorteado" os sete', () => {
    const porId = Object.fromEntries(item.presets!.map(p => [p.id, p]));
    expect(porId['sobre-o-v'].settings.graus).toEqual(['5']);
    expect(porId['acorde-sorteado'].settings.graus).toHaveLength(7);
  });
});
