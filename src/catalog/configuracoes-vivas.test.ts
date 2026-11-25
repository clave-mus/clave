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
import { isSeries, type Ctx, type SettingValue } from './types';

const ctx: Ctx = { naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params: resolveParams('violao', {}) };
/**
 * **O mesmo contexto com perfil de baixo.**
 *
 * Há condições que dependem do PERFIL, e não só do que a pessoa escolheu: a oitava de escuta
 * (20/11) só aparece onde a superfície é um braço de **baixo**, e `braco` num perfil de violão não
 * é. Varrer só um perfil declararia inalcançável uma condição que é alcançável — o defeito que isto
 * conserta apareceu na primeira rodada, acusando o item em vez do contexto do teste.
 */
const ctxBaixo: Ctx = { ...ctx, params: resolveParams('baixo', {}) };

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

// Atalhos nomeados pelo CONTEÚDO, nunca por nível (decisão 100): "1, 2, 3" afirmaria uma progressão
// linear que nem sempre existe, e a decisão 9 proíbe.
describe('presets', () => {
  const comPresets = EXERCISES.filter(isSeries).filter(e => e.presets?.length);

  it('todo preset escreve em configurações que o item tem', () => {
    for (const ex of comPresets) {
      const ids = new Set(ex.settings(ctx).map(s => s.id));
      for (const p of ex.presets ?? []) {
        for (const k of Object.keys(p.settings)) expect(ids, `${ex.id}/${p.id}: ${k}`).toContain(k);
      }
    }
  });

  it('todo preset gera pergunta válida, e nenhum é recusado', () => {
    for (const ex of comPresets) {
      for (const p of ex.presets ?? []) {
        const s = { ...ex.defaults, ...p.settings };
        expect(ex.problema?.(s, ctx) ?? null, `${ex.id}/${p.id}`).toBeNull();
        expect(() => ex.make(s, ctx), `${ex.id}/${p.id}`).not.toThrow();
      }
    }
  });

  it('os ids são únicos dentro do item, e os nomes existem nos dois idiomas', () => {
    for (const ex of comPresets) {
      const ids = (ex.presets ?? []).map(p => p.id);
      expect(new Set(ids).size, ex.id).toBe(ids.length);
      for (const p of ex.presets ?? []) {
        for (const locale of ['pt', 'en'] as const) {
          expect(translate(locale, p.nome), `${ex.id}/${p.id} em ${locale}`).toBeTruthy();
        }
      }
    }
  });

  // Nome que classifica a pessoa ou afirma ordem é o que a decisão 9 proíbe.
  it('a exceção dos graus não abre a porta para nível', () => {
    const semGraus = (s: string) => s.replace(/\b[1-7](?:-[1-7])+\b/g, '');
    const proibido = /n[íi]vel|level|\b[1-9]\b|b[áa]sico|avan[çc]ado|iniciante|f[áa]cil|dif[íi]cil|easy|hard|beginner|advanced/i;
    // o que a exceção deixa passar
    expect(semGraus('1-4-6-7')).not.toMatch(proibido);
    expect(semGraus('Tríades 1-3-5')).not.toMatch(proibido);
    // o que ela NÃO deixa passar
    for (const nome of ['Nível 1', 'Fase 2', 'Level 3', 'Básico', 'Avançado', 'Etapa 1', '1']) {
      expect(semGraus(nome), nome).toMatch(proibido);
    }
  });

  it('nenhum nome de preset é um número ou um nível', () => {
    /**
     * **Uma sequência de graus não é um nível**, e esta exceção é estreita de propósito.
     *
     * O guarda proíbe dígito solto para barrar "nível 1" e "fase 2". Em 13/11 ele acusou
     * `1-4-6-7`, que é o conteúdo do atalho — os graus do arpejo — e justamente o que a decisão
     * 100 **manda** usar: atalho nomeado pelo conteúdo. Então os dígitos ligados por hífen (dois ou
     * mais) saem da conta antes do teste, e tudo o mais continua valendo: `1` sozinho reprova,
     * `nível 1` reprova, `fase 2` reprova. A contraprova dos três está logo abaixo.
     */
    const semGraus = (s: string) => s.replace(/\b[1-7](?:-[1-7])+\b/g, '');
    for (const ex of comPresets) {
      for (const p of ex.presets ?? []) {
        for (const locale of ['pt', 'en'] as const) {
          expect(semGraus(translate(locale, p.nome)), `${ex.id}/${p.id}`).not.toMatch(/n[íi]vel|level|\b[1-9]\b|b[áa]sico|avan[çc]ado|iniciante|f[áa]cil|dif[íi]cil|easy|hard|beginner|advanced/i);
        }
      }
    }
  });
});

// `quando?` existe para as fusões por superfície (F1-4): depois de fundir pauta, teclado e braço num
// item só, a extensão tem três unidades incomparáveis, e cada uma só vale quando a sua superfície está
// ativa. O que os testes travam é que o condicional não esconda nada por engano.
describe('quando: configuração condicional', () => {
  const itens = EXERCISES.filter(isSeries);

  it('o padrão de todo item deixa visível pelo menos uma configuração, onde há configurações', () => {
    for (const ex of itens) {
      const todas = ex.settings(ctx);
      if (!todas.length) continue;
      const visiveis = todas.filter(s => s.quando?.(ex.defaults) ?? true);
      expect(visiveis.length, `${ex.id}: o padrão esconde TODAS as configurações`).toBeGreaterThan(0);
    }
  });

  /**
   * **Condicional tem de aparecer em algum lugar — e "algum lugar" inclui o perfil.**
   *
   * A pergunta é por **id**, e não por closure: a oitava de escuta (20/11) só se oferece onde a
   * superfície é um braço de baixo, então a sua `quando` ligada a um contexto de violão é falsa
   * sempre — e isso está certo. O que seria defeito é ela não aparecer em perfil nenhum.
   *
   * Varre uma e duas escolhas únicas por vez: há condição que pede as duas coisas ao mesmo tempo
   * (responder "as notas" **e** num braço de baixo).
   */
  it('toda configuração condicional fica visível em pelo menos uma combinação alcançável', () => {
    for (const ex of itens) {
      const vistas = new Set<string>();
      const condicionais = new Set<string>();
      for (const c of [ctx, ctxBaixo]) {
        const todas = ex.settings(c);
        const padroes = { ...ex.defaults, ...(ex.defaultsDo?.(c) ?? {}) } as Record<string, SettingValue>;
        const unicas = todas.filter(s => s.type === 'single');
        /**
         * ⚠️ **Os interruptores entram na varredura.** Ela só virava escolhas únicas, e em 25/11
         * uma condição legítima ficou "inalcançável" porque dependia de um toggle — o das
         * aproximações cromáticas, que deixou de ser lista e virou botão. A pessoa alcança; a
         * varredura é que não ia lá.
         */
        const toggles = todas.filter(s => s.type === 'toggle');
        const combos: Record<string, SettingValue>[] = [padroes];
        for (const s of unicas) for (const o of s.options ?? []) combos.push({ ...padroes, [s.id]: o.id });
        for (const s of toggles) for (const v of [true, false]) combos.push({ ...padroes, [s.id]: v });
        for (const a of unicas) for (const oa of a.options ?? []) {
          for (const b of unicas) {
            if (b.id === a.id) continue;
            for (const ob of b.options ?? []) combos.push({ ...padroes, [a.id]: oa.id, [b.id]: ob.id });
          }
          for (const t of toggles) combos.push({ ...padroes, [a.id]: oa.id, [t.id]: true });
        }
        for (const s of todas) {
          if (!s.quando) continue;
          condicionais.add(s.id);
          if (combos.some(x => s.quando!(x))) vistas.add(s.id);
        }
      }
      for (const id of condicionais) {
        expect(vistas.has(id), `${ex.id}: \`${id}\` nunca aparece — condição inalcançável`).toBe(true);
      }
    }
  });
});
