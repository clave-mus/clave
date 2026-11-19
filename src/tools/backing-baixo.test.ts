// A linha de baixo do backing — 19/11/2026.
//
// O Paulo: *"as linhas de baixo estão sempre meio estranhas no acorde vii diminuto"*. Estavam, e a
// causa era um `7` somado cru à fundamental: num diminuto a quinta tem **6** semitons, então o
// baixo tocava uma nota que não é do acorde. A terça já saía do acorde; a quinta, não.
//
// E o samba: *"faça com que o baixo faça a quinta grave, e não a aguda, e em semicolcheias
// pontuadas, como deve ser tocado"*.
import { describe, expect, it } from 'vitest';
import { alturaDoBaixo, GROOVES, PRESETS } from './Backing';
import { CHORDS, type ChordId } from '../theory/core';

const RAIZ = 48; // dó3, uma fundamental qualquer
const graus = (id: ChordId) => CHORDS[id].degs.map(([, s]) => s);

describe('a quinta vem do acorde, não de uma soma fixa', () => {
  it('no diminuto é diminuta, no aumentado é aumentada, nos outros é justa', () => {
    expect(alturaDoBaixo('quinta', RAIZ, 'dim', 0) - RAIZ).toBe(6);
    expect(alturaDoBaixo('quinta', RAIZ, 'm7b5', 0) - RAIZ).toBe(6);
    expect(alturaDoBaixo('quinta', RAIZ, 'dim7', 0) - RAIZ).toBe(6);
    expect(alturaDoBaixo('quinta', RAIZ, 'aum', 0) - RAIZ).toBe(8);
    for (const id of ['maior', 'menor', '7', '7M', 'm7'] as ChordId[]) {
      expect(alturaDoBaixo('quinta', RAIZ, id, 0) - RAIZ, id).toBe(7);
    }
  });

  /**
   * A invariante que o relato dele pedia: **toda nota de baixo que diz um grau do acorde é nota do
   * acorde**. Vale para as 25 qualidades, e é o que impede o fá♯ sobre o Si°.
   */
  it('raiz, terça e quinta são notas do acorde — em toda qualidade que existe', () => {
    for (const id of Object.keys(CHORDS) as ChordId[]) {
      for (const grau of ['raiz', 'terca', 'quinta'] as const) {
        const semi = alturaDoBaixo(grau, RAIZ, id, 0) - RAIZ;
        expect(graus(id), `${id}/${grau}: ${semi} não é do acorde (${graus(id)})`).toContain(semi);
      }
    }
  });

  it('a quinta grave é uma oitava abaixo da quinta do acorde', () => {
    for (const id of Object.keys(CHORDS) as ChordId[]) {
      expect(alturaDoBaixo('quintaGrave', RAIZ, id, 0), id)
        .toBe(alturaDoBaixo('quinta', RAIZ, id, 0) - 12);
      // e fica ABAIXO da fundamental, que é o ponto de ser grave
      expect(alturaDoBaixo('quintaGrave', RAIZ, id, 0), id).toBeLessThan(RAIZ);
    }
  });

  it('a aproximação encosta na fundamental seguinte, por cima ou por baixo', () => {
    const vistos = new Set<number>();
    for (let i = 0; i < 60; i++) vistos.add(alturaDoBaixo('aprox', RAIZ, 'maior', 55) - 55);
    expect([...vistos].sort()).toEqual([-1, 1]);
  });
});

describe('o samba', () => {
  it('toca a quinta GRAVE, nunca a aguda', () => {
    const quintas = GROOVES.samba.bass.filter(([, g]) => g.startsWith('quinta')).map(([, g]) => g);
    expect(quintas.length).toBeGreaterThan(0);
    expect(quintas.every(g => g === 'quintaGrave'), quintas.join(',')).toBe(true);
  });

  it('em semicolcheias pontuadas: toda nota dura 1,5 passo', () => {
    expect(GROOVES.samba.bass.map(([, , d]) => d)).toEqual([1.5, 1.5, 1.5, 1.5, 1.5, 1.5]);
  });

  it('e a colocação é a antecipação de sempre', () => {
    expect(GROOVES.samba.bass.map(([s]) => s)).toEqual([0, 3, 4, 8, 11, 12]);
  });
});

describe('bossa nova e baião saíram', () => {
  it('não há levada nem progressão deles', () => {
    expect(Object.keys(GROOVES)).not.toContain('bossa');
    expect(Object.keys(GROOVES)).not.toContain('baiao');
    expect(PRESETS.map(p => p.id)).not.toContain('bossa');
    expect(PRESETS.map(p => p.id)).not.toContain('baiao');
  });

  it('e as levadas que ficaram continuam inteiras', () => {
    expect(Object.keys(GROOVES).sort()).toEqual(['balada', 'nenhum', 'rock', 'samba', 'shuffle', 'swing']);
    for (const [nome, g] of Object.entries(GROOVES)) {
      expect(g.bass.length, `${nome}: sem baixo`).toBeGreaterThan(0);
      for (const [passo, , dur] of g.bass) {
        expect(passo, `${nome}: passo fora da grade`).toBeLessThan(g.grid);
        expect(dur, `${nome}: duração não positiva`).toBeGreaterThan(0);
      }
    }
  });
});
