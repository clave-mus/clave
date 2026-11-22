// Os laços "me teste nisto" apontam para configuração que existe — 20/11/2026.
//
// **O defeito que isto guarda não dá erro nenhum.** O laço carrega nomes de configuração de OUTRO
// item; se um deles for renomeado, a chave desconhecida é simplesmente ignorada, o exercício abre no
// modo errado e nada reclama. Quem for renomear vai ver este teste, que é o ponto.
//
// Mede três coisas por laço: o item de destino existe, cada chave é um controle dele (menos as
// declaradas `semControle`), e a configuração **gera pergunta** em vez de cair no `problema()`.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { EXEMPLOS_DE_LACO, lacoDaRelacao } from './lacos';
import { isSeries, type Ctx } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctxCom = (params: ReturnType<typeof resolveParams>): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params,
});

describe('os laços de "me teste nisto"', () => {
  it.each(EXEMPLOS_DE_LACO.map(l => [`${l.itemId}: ${JSON.stringify(l.instancia).slice(0, 60)}`, l] as const))(
    '%s', (_, laco) => {
      const item = EXERCISES.filter(isSeries).find(e => e.id === laco.itemId);
      expect(item, `${laco.itemId} não existe no catálogo`).toBeTruthy();

      const params = resolveParams('violao', (laco.params ?? {}) as Parameters<typeof resolveParams>[1]);
      const ctx = ctxCom(params);
      const ids = new Set(item!.settings(ctx).map(s => s.id));
      const sobrando = Object.keys(laco.instancia)
        .filter(k => !ids.has(k) && !(laco.semControle ?? []).includes(k));
      expect(sobrando, `${laco.itemId}: chaves que o item não tem`).toEqual([]);

      // E a configuração inteira tem de gerar pergunta: um laço que cai na recusa é um botão que
      // leva a uma tela que diz "sem pergunta possível".
      const valores = { ...item!.defaults, ...(item!.defaultsDo?.(ctx) ?? {}), ...laco.instancia };
      expect(item!.problema?.(valores as never, ctx) ?? null, `${laco.itemId}: o laço cai no guarda`).toBeNull();
      expect(item!.make(valores as never, ctx).surface.kind).toBeTruthy();
    });

  /**
   * O laço da relação existe para levar ao **modo do par** — se ele parar de fazer isso, ele deixou
   * de ser o que o Paulo pediu, mesmo que todas as chaves continuem existindo.
   */
  it('o da relação abre o modo do par, com o campo inteiro e uma nota', () => {
    const l = lacoDaRelacao('maior', false, 0);
    expect(l.instancia.resposta).toBe('par');
    expect(l.instancia.tamanho).toBe('1');
    expect(l.instancia.graus).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  /**
   * E o modo do par **exige** mais de um acorde possível (`problema` do `ouvido-celulas`). Este é o
   * par de guardas que importa: o laço manda os sete, e o item exige pelo menos dois. Se um dos dois
   * lados mudar sozinho, o botão passa a levar a uma recusa.
   */
  it('um acorde só no laço cairia no guarda do item — é o que o teste de cima previne', () => {
    const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-celulas')!;
    const ctx = ctxCom(resolveParams('violao', {}));
    const comUm = { ...item.defaults, ...lacoDaRelacao('maior', false, 0).instancia, graus: ['1'] };
    expect(item.problema?.(comUm as never, ctx)).toBeTruthy();
  });
});
