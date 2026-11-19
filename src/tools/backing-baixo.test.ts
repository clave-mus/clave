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

// ---------------------------------------------------------------------------
// Empréstimos e modulação — 19/11/2026, decidido em sete perguntas.
//
// A progressão era uma lista de graus de UM campo. Empréstimo é acorde de fora que não muda o
// centro; modulação é uma MARCA que troca o centro do ponto em diante. As duas peças resolvem na
// mesma passada, e é isso que este bloco mede.
import { resolverProgressaoParaTeste } from './Backing';

const CONV = 'pt' as const;
const DO_MAIOR = { fifths: 0, mode: 'maior' as const };

describe('os empréstimos saem da lista curada', () => {
  it('em dó maior, a grafia vem do grau de onde o empréstimo vem', () => {
    const { chords } = resolverProgressaoParaTeste(
      [{ deg: 6, emp: 'bVI' }, { deg: 7, emp: 'bVII' }, { deg: 4, emp: 'iv' }, { deg: 2, emp: 'bII' }],
      DO_MAIOR, false, CONV);
    // Lá♭, e não Sol♯ — é a razão de `grau`/`alt` existirem
    expect(chords.map(c => c.symbol)).toEqual(['A♭', 'B♭', 'Fm', 'D♭']);
    expect(chords.map(c => c.roman)).toEqual(['♭VI', '♭VII', 'iv', '♭II']);
  });

  it('em lá menor, o vii° é o sétimo grau ELEVADO', () => {
    const { chords } = resolverProgressaoParaTeste([{ deg: 7, emp: 'viio' }, { deg: 5, emp: 'V' }], { fifths: 0, mode: 'menor' }, false, CONV);
    // em lá menor o sétimo grau é sol; o empréstimo é sol♯ diminuto
    expect(chords[0].symbol).toBe('G♯°');
    expect(chords[1].symbol).toBe('E');
  });

  it('com tétrades, o empréstimo vem com a sétima da lista', () => {
    const { chords } = resolverProgressaoParaTeste([{ deg: 7, emp: 'bVII' }, { deg: 4, emp: 'iv' }], DO_MAIOR, true, CONV);
    // o ♭VII do campo maior é DOMINANTE (o backdoor), e o iv é menor com sétima
    expect(chords.map(c => c.symbol)).toEqual(['B♭7', 'Fm7']);
  });
});

describe('a modulação é uma marca', () => {
  it('não ocupa compasso, e troca o centro do ponto em diante', () => {
    const { chords, porItem, noFim } = resolverProgressaoParaTeste(
      [{ deg: 1 }, { mod: { fifths: -1, mode: 'maior' } }, { deg: 1 }, { deg: 5 }],
      DO_MAIOR, false, CONV);
    // três compassos, quatro itens
    expect(chords).toHaveLength(3);
    expect(porItem).toEqual([0, null, 1, 2]);
    // o primeiro I é dó; depois da marca, o I é FÁ e o V é dó
    expect(chords.map(c => c.symbol)).toEqual(['C', 'F', 'C']);
    // e o romano é relativo à tonalidade em vigor: o dó do fim é o V de fá, não o I
    expect(chords.map(c => c.roman)).toEqual(['I', 'I', 'V']);
    expect(noFim).toEqual({ fifths: -1, mode: 'maior' });
  });

  it('dá para modular várias vezes, e a última manda no fim', () => {
    const { chords, noFim } = resolverProgressaoParaTeste(
      [{ mod: { fifths: 2, mode: 'maior' } }, { deg: 1 }, { mod: { fifths: 0, mode: 'menor' } }, { deg: 1 }],
      DO_MAIOR, false, CONV);
    expect(chords.map(c => c.symbol)).toEqual(['D', 'Am']);
    expect(noFim.mode).toBe('menor');
  });

  it('cada compasso sabe em que tonalidade está', () => {
    const { chords } = resolverProgressaoParaTeste(
      [{ deg: 1 }, { mod: { fifths: 0, mode: 'menor' } }, { deg: 1 }], DO_MAIOR, false, CONV);
    expect(chords[0].tom).toEqual(DO_MAIOR);
    expect(chords[1].tom).toEqual({ fifths: 0, mode: 'menor' });
  });

  it('sem marca nenhuma, nada muda — a progressão de sempre', () => {
    const { chords, porItem, noFim } = resolverProgressaoParaTeste([{ deg: 1 }, { deg: 5 }, { deg: 6 }, { deg: 4 }], DO_MAIOR, false, CONV);
    expect(chords.map(c => c.symbol)).toEqual(['C', 'G', 'Am', 'F']);
    expect(porItem).toEqual([0, 1, 2, 3]);
    expect(noFim).toEqual(DO_MAIOR);
  });
});

describe('o preset que mostra as duas peças', () => {
  it('existe, modula para a relativa menor e usa o V emprestado', () => {
    const p = PRESETS.find(x => x.id === 'modula');
    expect(p, 'o preset de modulação não existe').toBeTruthy();
    const { chords, noFim } = resolverProgressaoParaTeste(p!.items, { fifths: 0, mode: p!.mode }, p!.tetrads, CONV);
    expect(noFim).toEqual({ fifths: 0, mode: 'menor' });
    // o ii–V–I de dó e, depois da marca, o iiø–V7–i de lá menor
    expect(chords.map(c => c.symbol)).toEqual(['Dm7', 'G7', 'C7M', 'C7M', 'Bm7(♭5)', 'E7', 'Am7', 'Am7']);
    // o V da menor é maior: é o empréstimo, não o v diatônico
    expect(chords[5].type).toBe('7');
  });
});
