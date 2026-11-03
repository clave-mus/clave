import { describe, expect, it } from 'vitest';
import { LESSONS } from '../data/content';
import { MODULE_LIST } from '../data/modules';
import { EXERCISES } from './catalog';
import { catalogByModule } from './catalogView';
import { AMBIENTES } from './index';

describe('catálogo por módulo', () => {
  const all = catalogByModule();

  it('segue a ordem dos módulos', () => {
    expect(all.map(e => e.module)).toEqual(MODULE_LIST.map(m => m.id));
  });
  it('cada exercício, ferramenta e aula aparece exatamente uma vez', () => {
    const count = (ids: string[]) => ids.reduce<Record<string, number>>((a, id) => ({ ...a, [id]: (a[id] ?? 0) + 1 }), {});
    const exercises = count(all.flatMap(e => e.exercises));
    const tools = count(all.flatMap(e => e.tools));
    const lessons = count(all.flatMap(e => e.lessons));
    expect(Object.keys(exercises).sort()).toEqual(EXERCISES.map(e => e.id).sort());
    expect(Object.keys(tools).sort()).toEqual(AMBIENTES.map(t => t.id).sort());
    expect(Object.keys(lessons).sort()).toEqual(LESSONS.map(l => l.id).sort());
    [exercises, tools, lessons].forEach(c => Object.values(c).forEach(n => expect(n).toBe(1)));
  });
  it('as aulas ficam no módulo do que ensinam, junto dos exercícios dele', () => {
    const theory = all.find(e => e.module === 'theory')!;
    expect(theory.lessons).toContain('escala-maior');
    expect(theory.exercises).toContain('quiz-teoria');
    expect(all.find(e => e.module === 'perception.rhythmic')!.lessons).toContain('leitura-ritmica');
  });
  it('o filtro "sem instrumento" tira exercícios e ferramentas que precisam dele, mas não as aulas', () => {
    const mobile = catalogByModule({ mobileOnly: true });
    mobile.flatMap(e => e.exercises).forEach(id => expect(EXERCISES.find(x => x.id === id)!.mobile).toBe(true));
    mobile.flatMap(e => e.tools).forEach(id => expect(AMBIENTES.find(x => x.id === id)!.mobile).toBe(true));
    expect(mobile.flatMap(e => e.tools)).not.toContain('backing'); // precisa do instrumento
    expect(mobile.flatMap(e => e.lessons).sort()).toEqual(all.flatMap(e => e.lessons).sort());
  });
});
