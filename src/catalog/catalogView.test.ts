import { describe, expect, it } from 'vitest';
import { MODULE_LIST } from '../data/modules';
import { EXERCISES } from './catalog';
import { catalogByModule } from './catalogView';
import { AMBIENTES } from './index';

describe('catálogo por módulo', () => {
  // Com o modo de revisão: é o catálogo INTEIRO. Sem ele, os rascunhos não aparecem (decisão 91).
  const all = catalogByModule({ revisao: true });

  it('segue a ordem dos módulos', () => {
    expect(all.map(e => e.module)).toEqual(MODULE_LIST.map(m => m.id));
  });
  // Era "exatamente uma vez". Mudou em 09/11, quando `tambemEm` passou a deixar um item aparecer
  // em mais de uma área (ver taxonomy.ts) — mas só nas que ele DECLARA, nunca por acidente.
  it('cada exercício e ferramenta aparece uma vez por área declarada, e em nenhuma outra', () => {
    const count = (ids: string[]) => ids.reduce<Record<string, number>>((a, id) => ({ ...a, [id]: (a[id] ?? 0) + 1 }), {});
    const exercises = count(all.flatMap(e => e.exercises));
    const tools = count(all.flatMap(e => e.tools));
    expect(Object.keys(exercises).sort()).toEqual(EXERCISES.map(e => e.id).sort());
    expect(Object.keys(tools).sort()).toEqual(AMBIENTES.map(t => t.id).sort());
    for (const i of [...EXERCISES, ...AMBIENTES]) {
      const esperado = 1 + (i.tambemEm?.length ?? 0);
      expect(({ ...exercises, ...tools })[i.id], i.id).toBe(esperado);
    }
  });

  it('quem aparece em duas áreas aparece nas que declarou', () => {
    const comSegunda = [...EXERCISES, ...AMBIENTES].filter(i => i.tambemEm?.length);
    for (const i of comSegunda) {
      for (const m of [i.primaryModule, ...i.tambemEm!]) {
        const area = all.find(a => a.module === m)!;
        expect([...area.exercises, ...area.tools], `${i.id} em ${m}`).toContain(i.id);
      }
    }
  });
  it('o filtro "sem instrumento" tira exercícios e ferramentas que precisam dele', () => {
    const mobile = catalogByModule({ mobileOnly: true });
    mobile.flatMap(e => e.exercises).forEach(id => expect(EXERCISES.find(x => x.id === id)!.mobile).toBe(true));
    mobile.flatMap(e => e.tools).forEach(id => expect(AMBIENTES.find(x => x.id === id)!.mobile).toBe(true));
    expect(mobile.flatMap(e => e.tools)).not.toContain('backing'); // precisa do instrumento
  });

  // O portão está desligado até o beta (decisão 104), então o teste o LIGA de propósito: é o
  // comportamento do beta que precisa de guarda, e hoje ele não é o padrão.
  describe('o portão de publicação (decisão 91), ligado', () => {
    const visiveis = catalogByModule({ portao: true });
    const ids = (e: typeof visiveis) => e.flatMap(m => [...m.exercises, ...m.tools]);

    it('quem usa o app não vê nenhum rascunho', () => {
      const rascunhos = [...EXERCISES, ...AMBIENTES].filter(i => (i.publicacao?.estado ?? 'rascunho') === 'rascunho').map(i => i.id);
      expect(rascunhos.length).toBeGreaterThan(0);
      for (const id of rascunhos) expect(ids(visiveis), id).not.toContain(id);
    });

    it('e vê tudo o que não é rascunho — legado e publicado', () => {
      const esperados = [...EXERCISES, ...AMBIENTES].filter(i => (i.publicacao?.estado ?? 'rascunho') !== 'rascunho').map(i => i.id);
      expect(ids(visiveis).sort()).toEqual(esperados.sort());
    });

    it('o modo de revisão mostra os rascunhos, e só acrescenta: nada que era visível some', () => {
      const todos = ids(catalogByModule({ revisao: true, portao: true }));
      for (const id of ids(visiveis)) expect(todos).toContain(id);
      expect(todos.length).toBeGreaterThan(ids(visiveis).length);
    });
  });

  describe('o portão desligado (hoje)', () => {
    it('o catálogo inteiro aparece, inclusive os rascunhos', () => {
      const ids = (e: ReturnType<typeof catalogByModule>) => e.flatMap(m => [...m.exercises, ...m.tools]);
      const todos = [...EXERCISES, ...AMBIENTES].flatMap(i => Array(1 + (i.tambemEm?.length ?? 0)).fill(i.id));
      expect(ids(catalogByModule()).sort()).toEqual(todos.sort());
    });
  });
});
