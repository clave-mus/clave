// Os grupos por propósito (decisão 95). O que importa travar: a lista aponta para itens que existem, e
// o botão não aparece onde não há o que oferecer.
import { describe, expect, it } from 'vitest';
import { companheirosDe, GRUPOS, gruposDoItem, idsFantasma } from './grupos';
import { ITEMS } from './index';
import { estadoDe, visivel } from './publicacao';
import pt from '../i18n/pt';
import en from '../i18n/en';

const sempre = () => true;

describe('a lista', () => {
  it('todo item declarado existe no catálogo', () => {
    expect(idsFantasma()).toEqual([]);
  });

  it('nenhum grupo tem menos de dois itens — com um só não há rodízio', () => {
    for (const g of GRUPOS) expect(g.itens.length, g.id).toBeGreaterThanOrEqual(2);
  });

  it('nenhum grupo repete um item', () => {
    for (const g of GRUPOS) expect(new Set(g.itens).size, g.id).toBe(g.itens.length);
  });

  it('os ids dos grupos são únicos', () => {
    expect(new Set(GRUPOS.map(g => g.id)).size).toBe(GRUPOS.length);
  });

  it('todo grupo tem nome nos dois idiomas', () => {
    for (const g of GRUPOS) {
      const id = g.id as keyof typeof pt.grupos;
      expect(pt.grupos[id], `${g.id} em pt`).toBeTruthy();
      expect(en.grupos[id], `${g.id} em en`).toBeTruthy();
    }
  });
});

describe('as decisões do Paulo sobre o conteúdo', () => {
  const itensDe = (id: string) => GRUPOS.find(g => g.id === id)!.itens;

  it('`pauta-construir` entra em "Leitura na pauta", mesmo sendo escrever e não ler', () => {
    expect(itensDe('leitura-pauta')).toContain('pauta-construir');
  });

  it('`ouvido-tecla` fica FORA de "Ouvido" — responde no teclado, e ali o propósito é outro', () => {
    expect(itensDe('ouvido')).not.toContain('ouvido-tecla');
  });
});

describe('um item em vários grupos', () => {
  // É o que resolve "um exercício serve a vários propósitos": não é preciso eleger o principal.
  it('o modelo permite, e `gruposDoItem` devolve todos', () => {
    const emVarios = ITEMS.filter(i => gruposDoItem(i.id).length > 1);
    // hoje não há nenhum, e está certo — o teste existe para o dia em que houver
    for (const i of emVarios) expect(gruposDoItem(i.id).length).toBeGreaterThan(1);
    expect(() => gruposDoItem('qualquer-um')).not.toThrow();
  });

  it('item fora de todo grupo devolve lista vazia, e isso é o caso comum', () => {
    expect(gruposDoItem('quiz-teoria')).toEqual([]);
    expect(companheirosDe('quiz-teoria', sempre)).toEqual([]);
  });
});

describe('companheirosDe', () => {
  it('devolve os outros do grupo, sem incluir ele mesmo', () => {
    const c = companheirosDe('pauta-nota', sempre);
    expect(c).not.toContain('pauta-nota');
    expect(c.sort()).toEqual(['pauta-acorde', 'pauta-construir', 'pauta-escala', 'pauta-intervalo']);
  });

  it('não repete, mesmo que dois grupos compartilhem um item', () => {
    for (const i of ITEMS) {
      const c = companheirosDe(i.id, sempre);
      expect(new Set(c).size, i.id).toBe(c.length);
    }
  });

  // A condição que o Paulo pediu: o botão só aparece onde há o que oferecer.
  it('o que a pessoa não pode ver não é oferecido', () => {
    const podeVer = (id: string) => visivel(ITEMS.find(x => x.id === id)?.publicacao, false);
    // "Ritmo com metrônomo" é inteiro rascunho: fora do modo de revisão, ninguém tem companheiro
    for (const id of ['acento-deslocado', 'subdivisao-alternada', 'deslocamento-ritmico']) {
      expect(companheirosDe(id, podeVer), id).toEqual([]);
    }
    // e com o modo de revisão ligado, aparecem
    expect(companheirosDe('acento-deslocado', sempre).length).toBe(2);
  });

  it('"Aquecimento de mão" hoje só oferece `tecnica`, porque os outros dois são rascunho', () => {
    const podeVer = (id: string) => visivel(ITEMS.find(x => x.id === id)?.publicacao, false);
    expect(companheirosDe('tecnica', podeVer)).toEqual([]);
    expect(companheirosDe('sustentar-e-cortar', podeVer)).toEqual(['tecnica']);
  });

  it('todo companheiro é um item do catálogo', () => {
    for (const i of ITEMS) {
      for (const id of companheirosDe(i.id, sempre)) expect(ITEMS.some(x => x.id === id), id).toBe(true);
    }
  });
});

describe('o que está em rascunho nos grupos', () => {
  // Não é defeito: é o portão da decisão 91 funcionando. Fica medido para ninguém se assustar.
  it('dois grupos estão quase vazios até o Paulo publicar os itens da tarefa com metrônomo', () => {
    const rascunhos = GRUPOS.flatMap(g => g.itens).filter(id => estadoDe(ITEMS.find(i => i.id === id)?.publicacao) === 'rascunho');
    expect(rascunhos.sort()).toEqual([
      'acento-deslocado', 'deslocamento-ritmico', 'legato-staccato', 'subdivisao-alternada', 'sustentar-e-cortar',
    ]);
  });
});
