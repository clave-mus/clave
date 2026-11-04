import { describe, expect, it } from 'vitest';
import { LESSONS } from '../data/content';
import { MODULE_LIST } from '../data/modules';
import { EXERCISES } from './catalog';
import { AMBIENTES } from './index';
import { CONTENT_TAGS, MODULES, OBJETOS, SKILL_TAGS, TAREFAS, type Assunto, type Classification } from './taxonomy';

// exercise_id é estável: rotinas, tentativas e configurações salvas apontam para ele. Renomear ou
// tirar um id quebra esses dados em silêncio. Para mudar esta lista, migre os dados antes.
//
// Esta lista **mudou uma vez**, nas fusões por superfície de 04/11/2026 (decisão 16): onze ids viraram
// quatro. A migração está em `state/migrate.ts` (`FUNDIDOS`) e em `routines/storage.ts`, e tem teste
// nos dois lugares — rotina, histórico e estatística de quem já usava o app atravessam.
const STABLE_IDS = [
  'que-nota-e-essa', 'ache-a-nota', 'que-intervalo-e-esse', 'que-acorde-e-esse',
  'pauta-armadura', 'pauta-escala',
  'teoria-graus', 'teoria-acordes', 'teoria-campo', 'teoria-tonalidades', 'teoria-intervalos',
  'ouvido-tecla', 'ouvido-intervalo', 'ouvido-acorde', 'ouvido-escala', 'ouvido-celulas', 'ritmo-ouvido',
];

// Aula tem assunto mas não tem tarefa — ninguém "toca" uma aula.
const assuntos: [string, Assunto][] = [
  ...EXERCISES.map(e => [`exercício ${e.id}`, e as Assunto] as [string, Assunto]),
  ...AMBIENTES.map(a => [`ambiente ${a.id}`, a as Assunto] as [string, Assunto]),
  ...LESSONS.map(l => [`aula ${l.id}`, l as Assunto] as [string, Assunto]),
];
const items: [string, Classification][] = [
  ...EXERCISES.map(e => [`exercício ${e.id}`, e] as [string, Classification]),
  ...AMBIENTES.map(a => [`ambiente ${a.id}`, a] as [string, Classification]),
];

describe('taxonomia', () => {
  it('os ids dos exercícios não mudaram', () => {
    expect(EXERCISES.map(e => e.id)).toEqual(STABLE_IDS);
  });

  it.each(items)('%s tem módulo principal e etiquetas do vocabulário controlado', (_, c) => {
    expect(Object.keys(MODULES)).toContain(c.primaryModule);
    expect(c.skillTags.length).toBeGreaterThan(0);
    expect(c.contentTags.length).toBeGreaterThan(0);
    c.skillTags.forEach(t => expect(Object.keys(SKILL_TAGS)).toContain(t));
    c.contentTags.forEach(t => expect(Object.keys(CONTENT_TAGS)).toContain(t));
    expect(new Set(c.skillTags).size).toBe(c.skillTags.length);
    expect(new Set(c.contentTags).size).toBe(c.contentTags.length);
  });

  it('toda ferramenta mora num módulo que existe, e todo módulo tem exercício ou ferramenta', () => {
    AMBIENTES.forEach(t => expect(Object.keys(MODULES)).toContain(t.primaryModule));
    const filled = new Set<string>([...EXERCISES.map(e => e.primaryModule), ...AMBIENTES.map(t => t.primaryModule)]);
    expect(Object.keys(MODULES).filter(m => !filled.has(m))).toEqual([]);
    expect(MODULE_LIST.map(m => m.id)).toEqual(Object.keys(MODULES));
  });

  it('toda etiqueta do vocabulário é usada por algum exercício ou aula', () => {
    const used = new Set<string>(assuntos.flatMap(([, c]) => [...c.skillTags, ...c.contentTags]));
    expect([...Object.keys(SKILL_TAGS), ...Object.keys(CONTENT_TAGS)].filter(t => !used.has(t))).toEqual([]);
  });

  it('cada exercício ligado a uma aula compartilha com ela pelo menos uma etiqueta', () => {
    const byId = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
    const orphans: string[] = [];
    for (const lesson of LESSONS) {
      const tags = new Set([...lesson.skillTags, ...lesson.contentTags]);
      for (const id of lesson.exercises) {
        const ex = byId[id];
        if (![...ex.skillTags, ...ex.contentTags].some(t => tags.has(t))) orphans.push(`${lesson.id} → ${id}`);
      }
    }
    expect(orphans).toEqual([]);
  });
});

// ===========================================================================
// FM-3 · objeto × tarefa
// ===========================================================================

describe('objeto e tarefa', () => {
  it.each(assuntos)('%s tem pelo menos um objeto, e todos do vocabulário', (_, c) => {
    expect(c.objetos.length).toBeGreaterThan(0);
    c.objetos.forEach(o => expect(Object.keys(OBJETOS)).toContain(o));
  });

  it.each(items)('%s tem pelo menos uma tarefa, e todas do vocabulário', (_, c) => {
    expect(c.tarefas.length).toBeGreaterThan(0);
    c.tarefas.forEach(t => expect(Object.keys(TAREFAS)).toContain(t));
  });

  it.each(assuntos)('%s não repete objeto', (_, c) => {
    expect(new Set(c.objetos).size).toBe(c.objetos.length);
  });

  it('o buraco de "Notas e o braço × Ouvir" está tapado', () => {
    // "achar no braço/teclado a nota que você ouviu" existia, mas etiquetada em Escalas e
    // Intervalos — quem entrava por "quero conhecer o braço" não a encontrava (catalogo.md)
    const naCasaNotas = [...EXERCISES, ...AMBIENTES].filter(i => i.objetos[0] === 'notas' && i.tarefas.includes('ouvir'));
    expect(naCasaNotas.length).toBeGreaterThan(0);
  });

  it('todo objeto com item tem pelo menos uma tarefa coberta', () => {
    const porObjeto = new Map<string, Set<string>>();
    for (const i of [...EXERCISES, ...AMBIENTES]) {
      for (const o of i.objetos) {
        porObjeto.set(o, new Set([...(porObjeto.get(o) ?? []), ...i.tarefas]));
      }
    }
    for (const [objeto, tarefas] of porObjeto) {
      expect(tarefas.size, `${objeto} sem tarefa`).toBeGreaterThan(0);
    }
  });

  it('a matriz de hoje, impressa, para conferir contra a curadoria', () => {
    const linhas: string[] = [];
    for (const o of Object.keys(OBJETOS)) {
      const conta = Object.keys(TAREFAS).map(t =>
        [...EXERCISES, ...AMBIENTES].filter(i => i.objetos[0] === o && i.tarefas.includes(t as never)).length,
      );
      linhas.push(`${o.padEnd(12)} ${conta.join(' ')}`);
    }
    // não é asserção de valor: é o retrato que o time compara com a matriz de curadoria
    expect(linhas).toHaveLength(Object.keys(OBJETOS).length);
  });
});
