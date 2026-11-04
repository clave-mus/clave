import { describe, expect, it } from 'vitest';
import { indiceDaCorda, permutacoesDe } from './tecnica';

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





import { andamentoNaVolta, CORDAS_DO_GRUPO, gruposDeCordas, indicesDoGrupo, PASSO_DA_SUBIDA, TETO_PADRAO, VOLTAS_POR_PASSO } from './tecnica';

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

describe('grupos de quatro cordas (T2)', () => {
  it('o baixo de quatro tem um grupo; a de cinco, dois; a guitarra de seis, três', () => {
    expect([4, 5, 6].map(gruposDeCordas)).toEqual([1, 2, 3]);
  });

  it('um grupo tem sempre quatro cordas vizinhas, da mais grave para a mais aguda', () => {
    expect(CORDAS_DO_GRUPO).toBe(4);
    expect(indicesDoGrupo(0, 6)).toEqual([0, 1, 2, 3]);
    expect(indicesDoGrupo(1, 6)).toEqual([1, 2, 3, 4]);
    expect(indicesDoGrupo(2, 6)).toEqual([2, 3, 4, 5]);
  });

  it('o grupo é preso ao que existe — nunca aponta para fora do braço', () => {
    expect(indicesDoGrupo(9, 6)).toEqual([2, 3, 4, 5]);
    expect(indicesDoGrupo(-3, 6)).toEqual([0, 1, 2, 3]);
    expect(indicesDoGrupo(1, 4)).toEqual([0, 1, 2, 3]);
  });

  it('todos os grupos cobrem todas as cordas, e nenhum sai delas', () => {
    for (const n of [4, 5, 6]) {
      const usadas = new Set<number>();
      for (let g = 0; g < gruposDeCordas(n); g++) for (const s of indicesDoGrupo(g, n)) { expect(s).toBeLessThan(n); usadas.add(s); }
      expect(usadas.size).toBe(n);
    }
  });
});
