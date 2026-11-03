import { describe, expect, it } from 'vitest';
import { casasDaTroca, codificarTroca, decodificarTroca, indiceDaCorda, permutacoesDe, trocasDePosicao } from './tecnica';

describe('permutacoesDe', () => {
  it.each([[1, 1], [2, 2], [3, 6], [4, 24], [5, 120], [6, 720]])('%i corda(s): %i ordenações (n!)', (n, esperado) => {
    expect(permutacoesDe(n)).toHaveLength(esperado);
  });

  it('todas distintas, e cada uma usa cada número exatamente uma vez', () => {
    for (const n of [3, 4, 5]) {
      const todas = permutacoesDe(n);
      expect(new Set(todas).size).toBe(todas.length);
      const alvo = Array.from({ length: n }, (_, i) => i + 1).join('');
      for (const p of todas) expect([...p].sort().join(''), p).toBe(alvo);
    }
  });

  it('em ordem lexicográfica, para o avanço manual ser previsível', () => {
    const p = permutacoesDe(4);
    expect(p).toEqual([...p].sort());
    expect(p[0]).toBe('1234');
    expect(p[p.length - 1]).toBe('4321');
  });

  it('inclui as que a pessoa tocaria sozinha e as que não tocaria', () => {
    const p = permutacoesDe(4);
    for (const x of ['1234', '4321', '2413', '3142']) expect(p).toContain(x);
  });

  it('recusa n fora de 1..6 em vez de gerar uma lista impossível de percorrer', () => {
    for (const n of [0, 7, -1, 2.5, NaN]) expect(() => permutacoesDe(n), String(n)).toThrow(RangeError);
  });
});

describe('indiceDaCorda: a corda 1 é a mais AGUDA', () => {
  it('no baixo de quatro, 1 é a Sol (índice 3) e 4 é a Mi (índice 0)', () => {
    expect(indiceDaCorda(1, 4)).toBe(3);
    expect(indiceDaCorda(4, 4)).toBe(0);
  });

  it('cobre todos os índices, sem repetir, para qualquer quantidade de cordas', () => {
    for (const n of [4, 5, 6]) {
      const indices = Array.from({ length: n }, (_, i) => indiceDaCorda(i + 1, n)).sort((a, b) => a - b);
      expect(indices).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });
});

describe('trocasDePosicao', () => {
  const todas = trocasDePosicao();

  // 22 pares de posição (6 + 8 + 8: da posição 3 não dá para voltar 3 nem 4 casas) × 4 dedos.
  it('são 88', () => {
    expect(todas).toHaveLength(88);
  });

  it('todas distintas', () => {
    expect(new Set(todas.map(codificarTroca)).size).toBe(88);
  });

  it('os quatro dedos aparecem, em igual número — nenhum é favorecido', () => {
    for (const dedo of [1, 2, 3, 4]) expect(todas.filter(t => t.dedo === dedo)).toHaveLength(22);
  });

  it('desliza de 1 a 4 casas, nos dois sentidos, e nunca para o mesmo lugar', () => {
    for (const t of todas) {
      const d = Math.abs(t.para - t.de);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(4);
    }
    expect(todas.some(t => t.para > t.de)).toBe(true);
    expect(todas.some(t => t.para < t.de)).toBe(true);
  });

  it('nenhuma troca cai numa casa menor que 1 — não existe casa 0 pisada nem negativa', () => {
    for (const t of todas) {
      const { de, para } = casasDaTroca(t);
      expect(de, codificarTroca(t)).toBeGreaterThanOrEqual(1);
      expect(para, codificarTroca(t)).toBeGreaterThanOrEqual(1);
    }
  });

  it('a regra de um dedo por casa: o dedo f mora em posição + f − 1', () => {
    expect(casasDaTroca({ de: 5, para: 8, dedo: 1 })).toEqual({ de: 5, para: 8 });
    expect(casasDaTroca({ de: 5, para: 8, dedo: 4 })).toEqual({ de: 8, para: 11 });
  });
});

describe('codificar e decodificar uma troca', () => {
  it('ida e volta devolve a mesma troca, para todas as 88', () => {
    for (const t of trocasDePosicao()) expect(decodificarTroca(codificarTroca(t))).toEqual(t);
  });

  it('texto que não é uma troca vira null, sem lançar', () => {
    for (const lixo of ['', 'x', '5-8', '5-8-5', '5-8-0', '5--8-1', '5-8-1-2', '5-8-a']) expect(decodificarTroca(lixo), lixo).toBeNull();
  });
});

import { andamentoNaVolta, PASSO_DA_SUBIDA, TETO_PADRAO, VOLTAS_POR_PASSO } from './tecnica';

describe('andamentoNaVolta', () => {
  const liga = (teto = 100) => ({ ativa: true, teto });

  it('sobe 4 bpm a cada 2 voltas — e não a cada volta', () => {
    expect(PASSO_DA_SUBIDA).toBe(4);
    expect(VOLTAS_POR_PASSO).toBe(2);
    const bpm = (v: number) => andamentoNaVolta(70, v, liga());
    expect([0, 1, 2, 3, 4, 5, 6].map(bpm)).toEqual([70, 70, 74, 74, 78, 78, 82]);
  });

  it('desligada, nunca muda o andamento, por mais voltas que passem', () => {
    for (const v of [0, 1, 2, 50, 1000]) expect(andamentoNaVolta(70, v, { ativa: false, teto: 100 }), String(v)).toBe(70);
  });

  it('PARA no teto — e não passa dele, por mais voltas que passem', () => {
    for (const v of [14, 15, 16, 100, 100000]) expect(andamentoNaVolta(70, v, liga(100)), String(v)).toBeLessThanOrEqual(100);
    expect(andamentoNaVolta(70, 100000, liga(100))).toBe(100);
  });

  it('o teto vale mesmo quando não é múltiplo do passo', () => {
    expect(andamentoNaVolta(70, 100000, liga(75))).toBe(75);
  });

  it('nunca baixa o que a pessoa escolheu: base acima do teto fica como está', () => {
    expect(andamentoNaVolta(120, 0, liga(100))).toBe(120);
    expect(andamentoNaVolta(120, 10, liga(100))).toBe(120);
  });

  it('nunca desce: o andamento é monótono em voltas', () => {
    let anterior = 0;
    for (let v = 0; v < 60; v++) {
      const a = andamentoNaVolta(70, v, liga());
      expect(a).toBeGreaterThanOrEqual(anterior);
      anterior = a;
    }
  });

  it('é calculado da base, sem estado: perguntar duas vezes dá a mesma resposta', () => {
    expect(andamentoNaVolta(70, 7, liga())).toBe(andamentoNaVolta(70, 7, liga()));
  });

  it('o teto padrão é um número que deixa espaço para subir a partir do padrão da tela (70)', () => {
    expect(TETO_PADRAO).toBeGreaterThan(70);
    expect(TETO_PADRAO).toBeLessThanOrEqual(200);
  });

  it('voltas negativas ou zero não mexem em nada', () => {
    expect(andamentoNaVolta(70, -3, liga())).toBe(70);
  });
});
