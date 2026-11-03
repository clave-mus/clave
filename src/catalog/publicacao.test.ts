// O portão de publicação (decisão 91). Duas coisas o fazem valer: o PADRÃO ser o estado mais
// restritivo, e o que está escrito nos documentos bater com o que está no código.
import { describe, expect, it } from 'vitest';
import { EXERCISES, AMBIENTES } from './index';
import { ehDataIso, estadoDe, LEGADO, RASCUNHO, visivel } from './publicacao';
import { ROUTINES } from '../tools/tecnica-rotinas';
// o documento, lido como texto pelo próprio bundler (não há acesso a `node:fs` nos tipos do app)
import doc from '../../docs/revisao-pendente.md?raw';

describe('a regra', () => {
  it('omitir a declaração é o mesmo que rascunho — o padrão é o estado MAIS restritivo', () => {
    expect(estadoDe(undefined)).toBe('rascunho');
    expect(visivel(undefined, false)).toBe(false);
  });

  it('rascunho só aparece no modo de revisão', () => {
    expect(visivel(RASCUNHO, false)).toBe(false);
    expect(visivel(RASCUNHO, true)).toBe(true);
  });

  it('legado e publicado aparecem sempre', () => {
    for (const p of [LEGADO, { estado: 'publicado' as const, revisadoEm: '2026-11-03', por: 'Paulo' }]) {
      expect(visivel(p, false)).toBe(true);
      expect(visivel(p, true)).toBe(true);
    }
  });

  it('o modo de revisão nunca esconde nada', () => {
    for (const p of [undefined, RASCUNHO, LEGADO]) expect(visivel(p, true)).toBe(true);
  });
});

describe('ehDataIso', () => {
  it('aceita AAAA-MM-DD válido e recusa o resto', () => {
    expect(ehDataIso('2026-11-03')).toBe(true);
    for (const x of ['03/11/2026', '2026-13-45', '2026-1-3', '', 'ontem', '2026-11-03T10:00']) expect(ehDataIso(x), x).toBe(false);
  });
});

describe('o que está declarado', () => {
  const itens = [...EXERCISES, ...AMBIENTES];

  it('todo item declara a sua publicação explicitamente — nenhum depende do padrão', () => {
    for (const i of itens) expect(i.publicacao, `${i.id} não declara \`publicacao\``).toBeDefined();
  });

  // `publicado` afirma que o Paulo revisou. Sem data e nome, a afirmação não se sustenta.
  it('todo item publicado tem a data da revisão (AAAA-MM-DD) e quem a fez', () => {
    for (const i of itens) {
      if (i.publicacao?.estado !== 'publicado') continue;
      expect(ehDataIso(i.publicacao.revisadoEm), `${i.id}: data`).toBe(true);
      expect(i.publicacao.por.trim(), `${i.id}: quem revisou`).not.toBe('');
    }
  });

  it('os cinco itens da tarefa com metrônomo são rascunho — construídos, não publicados', () => {
    for (const id of ['acento-deslocado', 'subdivisao-alternada', 'sustentar-e-cortar', 'legato-staccato', 'deslocamento-ritmico']) {
      expect(estadoDe(itens.find(i => i.id === id)?.publicacao), id).toBe('rascunho');
    }
  });

  it('as três rotinas novas da Técnica são rascunho; as antigas, legado', () => {
    const estado = (id: string) => estadoDe(ROUTINES.find(r => r.id === id)?.publicacao);
    for (const id of ['permutacoes', 'cordas', 'troca']) expect(estado(id), id).toBe('rascunho');
    for (const id of ['tqo', 'aranha', 'cinco']) expect(estado(id), id).toBe('legado');
  });

  it('toda rotina da Técnica declara a sua publicação', () => {
    for (const r of ROUTINES) expect(r.publicacao, r.id).toBeDefined();
  });
});

// O documento é o que os colegas (e as IAs deles) leem. Se ele deixar de listar um rascunho, alguém
// vai achar que o item está pronto — então o teste não deixa o documento envelhecer.
describe('docs/revisao-pendente.md lista todo rascunho', () => {
  it('cada item em rascunho aparece pelo id', () => {
    const rascunhos = [...EXERCISES, ...AMBIENTES].filter(i => estadoDe(i.publicacao) === 'rascunho').map(i => i.id);
    for (const id of rascunhos) expect(doc, `${id} está em rascunho mas não está no documento`).toContain(`\`${id}\``);
  });

  it('cada rotina da Técnica em rascunho aparece pelo id', () => {
    for (const r of ROUTINES.filter(x => estadoDe(x.publicacao) === 'rascunho')) {
      expect(doc, `${r.id} está em rascunho mas não está no documento`).toContain(`\`${r.id}\``);
    }
  });
});
