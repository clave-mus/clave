// `respeita` é medido, não opinado (decisão 87).
//
// O que `respeita` promete à tela: "este item muda quando você mexe na tonalidade / região /
// material". Se a lista mentir para mais, a tela oferece um controle que não faz nada; se mentir
// para menos, o item responde a um parâmetro que a pessoa não tem como mexer.
//
// Por isso este teste não confia na lista: instrumenta as funções de `contexto-musical`, roda o
// `make` de cada item sob TODAS as configurações, e compara o que foi de fato chamado.
import { describe, expect, it, vi } from 'vitest';

const chamadas = new Set<string>();
vi.mock('./contexto-musical', async orig => {
  const m = await orig<typeof import('./contexto-musical')>();
  const wrapped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m)) {
    wrapped[k] = typeof v === 'function'
      ? (...a: unknown[]) => { chamadas.add(k); return (v as (...x: unknown[]) => unknown)(...a); }
      : v;
  }
  return wrapped;
});

import { translate, type MessageKey, type Vars } from '../i18n';
import { EXERCISES } from './catalog';
import { PARAMETROS_DE_PRATICA, resolveParams, type ParametroDePratica } from './params';
import { isSeries, type Ctx } from './types';

/**
 * De qual parâmetro cada função de `contexto-musical` depende. Inclui a dependência INDIRETA:
 * `alturaNaRegiao` chama `pcsPermitidas` por dentro, então depende de tonalidade e material mesmo
 * que o item só a chame.
 */
const DEPENDE: Record<string, ParametroDePratica[]> = {
  tonalidade: ['key'],
  soDiatonico: ['key', 'material'],
  pcsPermitidas: ['key', 'material'],
  pcPermitido: ['key', 'material'],
  pcPermitida: ['key', 'material'],
  regiao: ['range'],
  alturaNaRegiao: ['range', 'key', 'material'],
  tonicaNaRegiao: ['range', 'key'],
  notaNaPauta: ['range', 'key', 'material'],
  alturaDoPc: ['range'],
  notaGrafada: ['key'],
};

/**
 * Itens que **leem** a região e não a **oferecem**.
 *
 * Na pauta a altura é ditada pela CLAVE, para a nota caber nas linhas; no braço a região é a faixa de
 * CASAS, que é outra unidade. Oferecer "região" nesses é prometer o que nenhuma das duas superfícies
 * aceita (ver contexto-musical.test.ts).
 *
 * `que-intervalo-e-esse` é o caso puro: as suas duas superfícies são pauta e braço, e nenhuma honra
 * uma faixa em MIDI. Já `que-nota-e-essa`, `ache-a-nota` e `que-acorde-e-esse` **têm** a superfície do
 * teclado, onde a região faz sentido de verdade — e por isso declaram `range`.
 */
const REGIAO_NAO_SE_OFERECE = ['pauta-escala', 'que-intervalo-e-esse'];

/**
 * `ctx.params` espionado: acusa quem lê `key`, `range` ou `material` **direto**, sem passar pelas
 * funções de `contexto-musical`.
 *
 * Existe porque um bug passou exatamente por aqui: `casaPermitida` lia `ctx.params.range` direto, e a
 * sonda — que só olhava as chamadas às funções de contexto — não viu. O resultado era que três
 * exercícios de braço repetiam a mesma pergunta para sempre, porque a região em MIDI deixava uma única
 * casa no braço do baixo.
 */
const lidosDireto = new Set<string>();
function ctxEspiao(pratica: Parameters<typeof resolveParams>[1] = { key: { tonic: 5, mode: 'maior' }, material: 'diatonico' }): Ctx {
  const reais = resolveParams('violao', pratica);
  const params = new Proxy(reais, {
    get(alvo, k) {
      if (typeof k === 'string' && (PARAMETROS_DE_PRATICA as readonly string[]).includes(k)) lidosDireto.add(k);
      return alvo[k as keyof typeof alvo];
    },
  });
  return { naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params };
}

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 5, mode: 'maior' }, material: 'diatonico' }),
};

function medido(id: string): Set<ParametroDePratica> {
  const ex = EXERCISES.filter(isSeries).find(e => e.id === id)!;
  chamadas.clear();
  const variantes: Record<string, unknown>[] = [{ ...ex.defaults }];
  for (const s of ex.settings(ctx)) {
    for (const o of s.options ?? []) variantes.push({ ...ex.defaults, [s.id]: s.type === 'multi' ? [o.id] : o.id });
    if (s.type === 'toggle') variantes.push({ ...ex.defaults, [s.id]: true }, { ...ex.defaults, [s.id]: false });
  }
  for (const v of variantes) {
    for (let i = 0; i < 25; i++) {
      try { ex.make(v as never, ctx); } catch { /* configuração recusada: é um caminho legítimo */ }
    }
  }
  const out = new Set<ParametroDePratica>();
  for (const fn of chamadas) for (const p of DEPENDE[fn] ?? []) out.add(p);
  if (REGIAO_NAO_SE_OFERECE.includes(id)) out.delete('range');
  return out;
}

describe('respeita: o que o item declara é o que ele de fato lê', () => {
  const itens = EXERCISES.filter(isSeries);

  it.each(itens.map(e => e.id))('%s', id => {
    const ex = itens.find(e => e.id === id)!;
    expect(ex.respeita, `${id} não declara \`respeita\``).toBeDefined();
    expect([...(ex.respeita ?? [])].sort()).toEqual([...medido(id)].sort());
  });

  it('toda função de contexto-musical que um item chama é conhecida — uma nova exige decidir de quê ela depende', () => {
    const todas = new Set<string>();
    for (const ex of itens) { medido(ex.id); chamadas.forEach(c => todas.add(c)); }
    for (const fn of todas) expect(Object.keys(DEPENDE), `função nova: ${fn}`).toContain(fn);
  });

  it('há itens que não respeitam nada — e é legítimo (armadura, teoria, ritmo)', () => {
    const nenhum = itens.filter(e => (e.respeita ?? []).length === 0).map(e => e.id);
    expect(nenhum).toEqual(expect.arrayContaining(['pauta-armadura', 'teoria-graus', 'teoria-campo', 'ritmo-ouvido']));
  });
});

// O furo que deixou passar o bug das três telas de braço: `respeita` era conferido contra as CHAMADAS
// às funções de contexto, e quem lia `ctx.params.range` direto escapava.
describe('ninguém lê `ctx.params` por fora do que declara', () => {
  const itens = EXERCISES.filter(isSeries);

  it.each(itens.map(e => e.id))('%s', id => {
    const ex = itens.find(e => e.id === id)!;
    lidosDireto.clear();
    const espiao = ctxEspiao();
    const variantes: Record<string, unknown>[] = [{ ...ex.defaults }];
    for (const s of ex.settings(espiao)) {
      for (const o of s.options ?? []) variantes.push({ ...ex.defaults, [s.id]: s.type === 'multi' ? [o.id] : o.id });
    }
    lidosDireto.clear();
    for (const v of variantes) {
      for (let i = 0; i < 10; i++) { try { ex.make(v as never, espiao); } catch { /* configuração recusada */ } }
    }
    // Os itens de pauta LEEM a região (via `notaNaPauta`, que descarta degraus fora dela) mas não a
    // OFERECEM: a altura é ditada pela clave, para a nota caber nas linhas. Conferido que eles ficam
    // estáveis em qualquer região — 7 e 9 perguntas distintas no grave, no agudo e em tudo —, porque o
    // fallback de `notaNaPauta` entra quando a intersecção esvazia.
    const declarados = new Set<string>([...(ex.respeita ?? []), ...(REGIAO_NAO_SE_OFERECE.includes(id) ? ['range'] : [])]);
    const naoDeclarados = [...lidosDireto].filter(k => !declarados.has(k));
    expect(naoDeclarados, `${id} lê ${naoDeclarados.join(', ')} direto de ctx.params sem declarar em \`respeita\``).toEqual([]);
  });
});
