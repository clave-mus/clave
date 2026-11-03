// Toda configuração oferecida à pessoa tem que MUDAR alguma coisa.
//
// Uma configuração pode agir de duas formas legítimas: o `make` a lê (muda a pergunta), ou ela
// declara `present` (muda como o som é tocado). Se não faz nenhuma das duas, é um controle que a
// tela mostra e que não faz nada — o mesmo defeito de "material diatônico sem tonalidade", e da
// cascata sem leitor (decisão 57), só que no nível da configuração.
//
// Mede lendo as chaves por um Proxy, sob todas as opções de todas as configurações. Hoje não há
// nenhuma morta; este teste existe para continuar assim quando outras pessoas acrescentarem itens.
import { describe, expect, it } from 'vitest';
import { translate, type MessageKey, type Vars } from '../i18n';
import { EXERCISES } from './catalog';
import { resolveParams } from './params';
import { isSeries, type Ctx } from './types';

const ctx: Ctx = { naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params: resolveParams('violao', {}) };

function leituras(id: string): Set<string> {
  const ex = EXERCISES.filter(isSeries).find(e => e.id === id)!;
  const lidas = new Set<string>();
  const variantes: Record<string, unknown>[] = [{ ...ex.defaults }];
  for (const s of ex.settings(ctx)) {
    for (const o of s.options ?? []) variantes.push({ ...ex.defaults, [s.id]: s.type === 'multi' ? [o.id] : o.id });
    if (s.type === 'toggle') variantes.push({ ...ex.defaults, [s.id]: true }, { ...ex.defaults, [s.id]: false });
  }
  for (const v of variantes) {
    const proxy = new Proxy(v, {
      get: (t, k) => { if (typeof k === 'string') lidas.add(k); return t[k as string]; },
      // espalhar `{...s}` leria TODAS as chaves e esconderia as mortas: se alguém o fizer, o teste acusa
      ownKeys: () => { throw new Error(`${id}: make() espalha as configurações (\`{...s}\`); leia cada chave pelo nome`); },
    });
    for (let i = 0; i < 15; i++) {
      try { ex.make(proxy as never, ctx); } catch (e) { if (String(e).includes('espalha')) throw e; /* configuração recusada */ }
    }
  }
  return lidas;
}

describe('toda configuração oferecida muda alguma coisa', () => {
  const itens = EXERCISES.filter(isSeries);

  it.each(itens.map(e => e.id))('%s', id => {
    const ex = itens.find(e => e.id === id)!;
    const lidas = leituras(id);
    const mortas = ex.settings(ctx).filter(s => !s.present && !lidas.has(s.id)).map(s => s.id);
    expect(mortas, `${id}: configurações que a tela oferece e nada lê`).toEqual([]);
  });

  it('o que o `defaults` declara existe como configuração — sem chave solta', () => {
    for (const ex of itens) {
      const ids = new Set(ex.settings(ctx).map(s => s.id));
      const soltas = Object.keys(ex.defaults).filter(k => !ids.has(k));
      expect(soltas, `${ex.id}: defaults sem configuração correspondente`).toEqual([]);
    }
  });
});

// `soPresentation` diz que a configuração muda SÓ como o som é tocado. O Player confia nisso para não
// sortear pergunta nova quando ela muda — então, se uma marcada assim for lida pelo `make`, mexer nela
// deixaria de atualizar a pergunta e o app mentiria em silêncio.
//
// Não dá para inferir de `present`: o seletor de instrumento de `acorde-visual` tem `present` e TAMBÉM é
// lido pelo `make`. Por isso é declarado — e por isso precisa de teste.
describe('soPresentation: o que diz não mudar a pergunta, de fato não muda', () => {
  const itens = EXERCISES.filter(isSeries);

  it('nenhuma configuração marcada `soPresentation` é lida pelo `make`', () => {
    for (const ex of itens) {
      const soSom = ex.settings(ctx).filter(s => s.soPresentation).map(s => s.id);
      if (!soSom.length) continue;
      const lidas = leituras(ex.id);
      for (const id of soSom) expect(lidas.has(id), `${ex.id}: \`${id}\` é \`soPresentation\` mas o make a lê`).toBe(false);
    }
  });

  it('toda configuração `soPresentation` declara `present` — senão ela não muda nada', () => {
    for (const ex of itens) {
      for (const s of ex.settings(ctx).filter(x => x.soPresentation)) {
        expect(s.present, `${ex.id}: ${s.id}`).toBeDefined();
      }
    }
  });

  it('e há pelo menos uma no catálogo, senão este teste não prova nada', () => {
    expect(itens.flatMap(e => e.settings(ctx)).filter(s => s.soPresentation).length).toBeGreaterThan(0);
  });
});
