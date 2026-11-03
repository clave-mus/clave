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
import { resolveParams, type ParametroDePratica } from './params';
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
 * Itens de pauta leem a região, mas a altura é ditada pela CLAVE, para a nota caber nas linhas —
 * então oferecer "região" ali é prometer o que a leitura não aceita (ver contexto-musical.test.ts).
 */
const REGIAO_NAO_SE_OFERECE = ['pauta-nota', 'pauta-construir', 'pauta-intervalo', 'pauta-acorde', 'pauta-escala'];

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
    expect(nenhum).toEqual(expect.arrayContaining(['pauta-armadura', 'quiz-teoria', 'acorde-visual', 'ritmo-ouvido']));
  });
});
