import { afterEach, describe, expect, it } from 'vitest';
import { assinatura, esquecerSorteio, pesoDaIdade, sortearSemEco } from './sorteio';
import type { Expected, Question } from './types';

afterEach(() => esquecerSorteio());

/** Gerador uniforme de mentira: respostas `option` sorteadas de um pool de ids. */
const gerador = (ids: string[], rnd: () => number) => (): Question => ({
  prompt: '', visual: { kind: 'ear' },
  surface: { kind: 'choices', options: ids.map(id => ({ id, label: id })) },
  expected: { kind: 'option', id: ids[Math.floor(rnd() * ids.length)] },
  reveal: '',
});

/** LCG semeado: o teste é determinístico, como manda o padrão de `amostrasDeCorda`. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 2 ** 32);
}

const respostas = (chave: string, ids: string[], n: number, seed = 42): string[] => {
  const rnd = lcg(seed);
  const gerar = gerador(ids, rnd);
  return Array.from({ length: n }, () => assinatura(sortearSemEco(chave, gerar, rnd).expected));
};

describe('pesoDaIdade', () => {
  it('0 na rodada seguinte, e sobe pela metade do que falta: ½, ¾, ⅞…', () => {
    expect(pesoDaIdade(1)).toBe(0);
    expect(pesoDaIdade(2)).toBe(0.5);
    expect(pesoDaIdade(3)).toBe(0.75);
    expect(pesoDaIdade(4)).toBe(0.875);
    expect(pesoDaIdade(null)).toBe(1);
  });
});

describe('sortearSemEco', () => {
  it('nunca a mesma resposta duas vezes seguidas (pool de 5, 1000 rodadas)', () => {
    const seq = respostas('a', ['1', '2', '3', '4', '5'], 1000);
    for (let n = 1; n < seq.length; n++) expect(seq[n], `rodada ${n}`).not.toBe(seq[n - 1]);
  });

  it('mas não é um shuffle perfeito: repetir dentro da janela acontece', () => {
    // Num shuffle perfeito de 5, a mesma resposta nunca sai com menos de 5 de distância. Aqui o
    // peso sobe já na segunda rodada — então distâncias 2 e 3 têm de aparecer. É a frase do Paulo:
    // "com alguma repetição para não ser um shuffle perfeito".
    const seq = respostas('b', ['1', '2', '3', '4', '5'], 1000);
    const distancias = new Set<number>();
    const ultima = new Map<string, number>();
    seq.forEach((s, n) => {
      if (ultima.has(s)) distancias.add(n - ultima.get(s)!);
      ultima.set(s, n);
    });
    expect(distancias.has(2)).toBe(true);
    expect(distancias.has(3)).toBe(true);
  });

  it('varia passando por várias: num pool de 5, todas saem com frequência parecida', () => {
    const seq = respostas('c', ['1', '2', '3', '4', '5'], 1000);
    const conta = new Map<string, number>();
    seq.forEach(s => conta.set(s, (conta.get(s) ?? 0) + 1));
    expect(conta.size).toBe(5);
    for (const n of conta.values()) expect(n).toBeGreaterThan(120); // uniforme seria 200
  });

  it('pool de UMA resposta não trava: as tentativas esgotam e a pergunta sai', () => {
    const seq = respostas('d', ['so-esta'], 10);
    expect(seq).toHaveLength(10);
    expect(new Set(seq).size).toBe(1);
  });

  it('a memória é por chave: o histórico de um item não pesa no outro', () => {
    const rnd = lcg(7);
    const gerar = gerador(['x'], rnd);
    sortearSemEco('item-1', gerar, rnd);
    // Em 'item-2' a mesma resposta é inédita: aceita de primeira, sem gastar tentativa.
    let chamadas = 0;
    const contando = () => { chamadas++; return gerar(); };
    sortearSemEco('item-2', contando, rnd);
    expect(chamadas).toBe(1);
  });
});

describe('assinatura', () => {
  it('distingue os cinco tipos de resposta, e grafia é identidade (Dó♯ ≠ Ré♭)', () => {
    const casos: Expected[] = [
      { kind: 'option', id: 'ii7' },
      { kind: 'pitchClass', pc: 1 },
      { kind: 'pitch', midi: 61 },
      { kind: 'spelled', letter: 0, acc: 1 },
      { kind: 'spelled', letter: 1, acc: -1 },
      { kind: 'chord', root: 1, quality: 'maior' },
    ];
    const sigs = casos.map(assinatura);
    expect(new Set(sigs).size).toBe(casos.length);
  });
});
