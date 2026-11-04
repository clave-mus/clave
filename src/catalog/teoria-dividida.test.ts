import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
// A decisão 53: `quiz-teoria` era o único item com QUATRO objetos. O ponto da divisão é que cada um
// dos quatro passe a ter **um só** — e que nenhum outro item volte a acumular.
describe('a divisão do quiz de teoria (decisão 53)', () => {
  it('cada um dos quatro itens de teoria tem um objeto só', () => {
    for (const id of ['teoria-graus', 'teoria-acordes', 'teoria-campo', 'teoria-tonalidades']) {
      expect(EXERCISES.find(e => e.id === id)?.objetos, id).toHaveLength(1);
    }
  });

  it('os quatro objetos são diferentes entre si — era isso que estava empacotado num item', () => {
    const objs = ['teoria-graus', 'teoria-acordes', 'teoria-campo', 'teoria-tonalidades']
      .map(id => EXERCISES.find(e => e.id === id)!.objetos![0]);
    expect(new Set(objs).size).toBe(4);
    expect([...objs].sort()).toEqual(['acordes', 'escalas', 'harmonia', 'notacao']);
  });

  it('e nenhum item do catálogo acumula mais de três objetos', () => {
    for (const e of EXERCISES) expect((e.objetos ?? []).length, e.id).toBeLessThanOrEqual(3);
  });
});
