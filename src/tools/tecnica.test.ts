// As 24 permutações da T1 (decisão 81).
//
// Elas são GERADAS, e não escritas à mão, porque escrever 24 permutações à mão é como se esquece
// uma — e o exercício inteiro depende de serem as 24.
import { describe, expect, it } from 'vitest';
import { PERMUTACOES } from './Tecnica';

describe('permutações de dedos (T1)', () => {
  it('são 24, que é 4!', () => {
    expect(PERMUTACOES).toHaveLength(24);
  });

  it('todas distintas', () => {
    expect(new Set(PERMUTACOES).size).toBe(24);
  });

  it('cada uma usa os quatro dedos, uma vez cada', () => {
    for (const p of PERMUTACOES) {
      expect([...p].sort().join(''), p).toBe('1234');
    }
  });

  it('inclui as duas que a pessoa tocaria sozinha, e as que ela não tocaria', () => {
    // é o critério da decisão 81: o app escolhe o que você não escolheria
    expect(PERMUTACOES).toContain('1234');
    expect(PERMUTACOES).toContain('4321');
    expect(PERMUTACOES).toContain('2413');
    expect(PERMUTACOES).toContain('3142');
  });

  it('vêm em ordem lexicográfica, para o avanço manual ser previsível', () => {
    expect(PERMUTACOES).toEqual([...PERMUTACOES].sort());
    expect(PERMUTACOES[0]).toBe('1234');
    expect(PERMUTACOES[23]).toBe('4321');
  });
});
