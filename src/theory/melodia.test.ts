import { describe, expect, it } from 'vitest';
import { MAX_NOTAS, MIN_NOTAS, SALTO_PADRAO, sortearMelodia } from './melodia';

/** LCG semeado: determinístico, como no teste da corda. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 2 ** 32);
}

const DO_MAIOR = [0, 2, 4, 5, 7, 9, 11];
const TODAS = Array.from({ length: 12 }, (_, i) => i);

describe('sortearMelodia', () => {
  it('devolve exatamente a quantidade pedida, de 2 a 8', () => {
    for (let n = MIN_NOTAS; n <= MAX_NOTAS; n++) {
      for (let s = 1; s <= 5; s++) {
        const m = sortearMelodia({ pcs: DO_MAIOR, lo: 55, hi: 79, n, saltoMax: SALTO_PADRAO, rnd: lcg(s * 31) });
        expect(m, `n=${n} semente=${s}`).toHaveLength(n);
      }
    }
  });

  it('toda nota está na faixa e entre as classes permitidas', () => {
    for (let s = 1; s <= 40; s++) {
      const m = sortearMelodia({ pcs: DO_MAIOR, lo: 60, hi: 72, n: 6, saltoMax: SALTO_PADRAO, rnd: lcg(s) });
      for (const x of m) {
        expect(x).toBeGreaterThanOrEqual(60);
        expect(x).toBeLessThanOrEqual(72);
        expect(DO_MAIOR).toContain(x % 12);
      }
    }
  });

  it('respeita o salto máximo quando há candidata', () => {
    for (const saltoMax of [2, 4, 7, 12]) {
      for (let s = 1; s <= 30; s++) {
        const m = sortearMelodia({ pcs: TODAS, lo: 48, hi: 84, n: 8, saltoMax, rnd: lcg(s * 7) });
        for (let i = 1; i < m.length; i++) {
          expect(Math.abs(m[i] - m[i - 1]), `salto ${saltoMax}, semente ${s}`).toBeLessThanOrEqual(saltoMax);
        }
      }
    }
  });

  it('nunca repete a mesma altura logo em seguida', () => {
    // Duas iguais coladas soariam como uma nota longa, e a pessoa responderia duas tendo ouvido uma.
    for (let s = 1; s <= 60; s++) {
      const m = sortearMelodia({ pcs: DO_MAIOR, lo: 60, hi: 67, n: 8, saltoMax: 2, rnd: lcg(s) });
      for (let i = 1; i < m.length; i++) expect(m[i], `semente ${s}`).not.toBe(m[i - 1]);
    }
  });

  it('com salto apertado numa faixa curta, entrega a quantidade pedida afrouxando o salto', () => {
    // A quantidade é promessa da configuração; o salto é preferência. Melodia menor seria mentir.
    const m = sortearMelodia({ pcs: [0, 7], lo: 60, hi: 67, n: 5, saltoMax: 1, rnd: lcg(3) });
    expect(m).toHaveLength(5);
    for (const x of m) expect([0, 7]).toContain(x % 12);
  });

  it('a melodia varia: sementes diferentes dão melodias diferentes', () => {
    const vistas = new Set<string>();
    for (let s = 1; s <= 20; s++) {
      vistas.add(sortearMelodia({ pcs: DO_MAIOR, lo: 55, hi: 79, n: 3, saltoMax: SALTO_PADRAO, rnd: lcg(s * 101) }).join(','));
    }
    expect(vistas.size).toBeGreaterThan(15);
  });
});
