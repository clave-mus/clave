import { describe, expect, it } from 'vitest';
import { LESSONS } from '../data/content';
import { MODULE_LIST } from '../data/modules';
import { EXERCISES } from './catalog';
import { AMBIENTES } from './index';
import { CONTENT_TAGS, MODULES, SKILL_TAGS, type Classification } from './taxonomy';

// exercise_id é estável: rotinas, tentativas e configurações salvas apontam para ele. Renomear ou
// tirar um id quebra esses dados em silêncio. Para mudar esta lista, migre os dados antes.
const STABLE_IDS = [
  'pauta-nota', 'pauta-construir', 'pauta-armadura', 'pauta-intervalo', 'pauta-acorde', 'pauta-escala', 'quiz-teoria',
  'teclado-nota', 'teclado-tecla', 'teclado-acorde', 'braco-nota', 'braco-ache', 'braco-intervalo', 'acorde-visual',
  'ouvido-tecla', 'ouvido-intervalo', 'ouvido-acorde', 'ouvido-escala', 'ouvido-celulas', 'ritmo-ouvido',
];

const items: [string, Classification][] = [
  ...EXERCISES.map(e => [`exercício ${e.id}`, e] as [string, Classification]),
  ...LESSONS.map(l => [`aula ${l.id}`, l] as [string, Classification]),
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
    const used = new Set<string>(items.flatMap(([, c]) => [...c.skillTags, ...c.contentTags]));
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
