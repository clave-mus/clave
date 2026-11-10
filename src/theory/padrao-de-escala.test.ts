// Padrões de escala (09/11/2026): o motor de `PE-padroes-de-escala.md`.
//
// A propriedade que mais importa aqui é a **unicidade do rótulo** dentro de um padrão: o exercício
// usa o rótulo da posição como `id` de alternativa, e dois rótulos iguais fariam duas alternativas
// serem a mesma resposta. Está travada por varredura, não por exemplo.
import { describe, expect, it } from 'vitest';
import { ALL_SCALE_IDS, scaleDegs, type ScaleId } from './core';
import {
  acordeDoCampo, escalaDoCampo, escreverPadrao, lerPadrao, MAX_NOTAS, MIN_NOTAS,
  posicoesDoPadrao, quantasPosicoes, rotulo, sortearPadrao, type Padrao,
} from './padrao-de-escala';

const TAMANHOS = [3, 4, 5, 6];

describe('o campo harmônico da escala', () => {
  // Se esta deixar de valer, `acordeDoCampo` passa a empilhar terças em escala de cinco ou seis
  // notas, e o que sai não é acorde.
  it('a escala do campo tem sempre sete notas, nas treze', () => {
    for (const id of ALL_SCALE_IDS) {
      expect(scaleDegs(escalaDoCampo(id)).length, id).toBe(7);
    }
  });

  it('escala de sete notas é o campo dela mesma', () => {
    for (const id of ALL_SCALE_IDS.filter(x => scaleDegs(x).length === 7)) {
      expect(escalaDoCampo(id), id).toBe(id);
    }
  });

  it('as três que têm pai são as duas pentatônicas e a blues', () => {
    const comPai = ALL_SCALE_IDS.filter(id => escalaDoCampo(id) !== id).sort();
    expect(comPai).toEqual(['blues', 'penta-maior', 'penta-menor']);
  });

  it('pentatônica maior usa o campo da maior: I é tríade maior, vii é diminuta', () => {
    expect(acordeDoCampo('penta-maior', 1)).toEqual([0, 4, 7]);
    expect(acordeDoCampo('penta-maior', 4)).toEqual([5, 9, 12]);   // Fá Lá Dó
    expect(acordeDoCampo('penta-maior', 7)).toEqual([11, 14, 17]); // Si Ré Fá
  });

  it('pentatônica menor e blues usam o campo da menor', () => {
    expect(acordeDoCampo('penta-menor', 1)).toEqual([0, 3, 7]);
    expect(acordeDoCampo('blues', 1)).toEqual([0, 3, 7]);
    expect(acordeDoCampo('penta-menor', 5)).toEqual(acordeDoCampo('menor', 5));
  });

  // É o ganho musical da decisão do Paulo, e não só de código: o campo traz notas que a escala do
  // desenho não tem, e é daí que vem o atrito.
  it('o campo da pentatônica maior traz Fá e Si, que a pentatônica não tem', () => {
    const naEscala = new Set(scaleDegs('penta-maior').map(([, s]) => s));
    expect(naEscala.has(5)).toBe(false);
    expect(naEscala.has(11)).toBe(false);
    const noCampo = new Set<number>();
    for (let g = 1; g <= 7; g++) for (const s of acordeDoCampo('penta-maior', g)) noCampo.add(s % 12);
    expect(noCampo.has(5)).toBe(true);
    expect(noCampo.has(11)).toBe(true);
  });

  it('tétrade acrescenta a sétima do campo', () => {
    expect(acordeDoCampo('penta-maior', 1, true)).toEqual([0, 4, 7, 11]);
    expect(acordeDoCampo('penta-maior', 2, true)).toEqual([2, 5, 9, 12]);
  });

  it('o lócrio empilha nele mesmo: a tônica é diminuta', () => {
    expect(acordeDoCampo('locrio', 1)).toEqual([0, 3, 6]);
  });
});

describe('as posições do padrão', () => {
  it('há uma posição por grau da escala', () => {
    for (const id of ALL_SCALE_IDS) {
      expect(posicoesDoPadrao(id, [0, 1, 2]).length, id).toBe(quantasPosicoes(id));
    }
  });

  it('[0,1,2] na maior é 1-2-3 começando no grau 1, e 2-3-4 começando no grau 2', () => {
    const p = posicoesDoPadrao('maior', [0, 1, 2]);
    expect(rotulo(p[0])).toBe('1-2-3');
    expect(p[0].semis).toEqual([0, 2, 4]);
    expect(rotulo(p[1])).toBe('2-3-4');
    expect(p[1].semis).toEqual([2, 4, 5]);
  });

  it('[0,2,1,4] na maior é o exemplo do documento: 1-3-2-5 e 2-4-3-6', () => {
    const p = posicoesDoPadrao('maior', [0, 2, 1, 4]);
    expect(rotulo(p[0])).toBe('1-3-2-5');
    expect(rotulo(p[1])).toBe('2-4-3-6');
  });

  it('passar do topo sobe de oitava e repete o rótulo do grau', () => {
    const p = posicoesDoPadrao('maior', [0, 2, 4])[5]; // começa no grau 6
    expect(p.graus).toEqual(['6', '1', '3']);
    expect(p.semis).toEqual([9, 12, 16]);
  });

  // Decisão do Paulo: o padrão pode descer. Descer abaixo da posição inicial é descer de oitava, e
  // o grau continua o mesmo — que é exatamente o certo em música.
  it('deslocamento negativo desce de oitava sem quebrar o grau', () => {
    const p = posicoesDoPadrao('maior', [0, -1, 1])[0];
    expect(p.graus).toEqual(['1', '7', '2']);
    expect(p.semis).toEqual([0, -1, 2]);
  });

  it('a blues distingue os seus dois quintos graus', () => {
    const graus = posicoesDoPadrao('blues', [0, 1, 2]).map(p => p.graus[0]);
    expect(graus).toEqual(['1', '♭3', '4', '♭5', '5', '♭7']);
  });

  it('repetir grau é permitido e sai repetido', () => {
    expect(rotulo(posicoesDoPadrao('maior', [0, 0, 2])[0])).toBe('1-1-3');
  });
});

// A varredura: é ela que sustenta usar o rótulo como id de alternativa.
describe('varredura das treze escalas', () => {
  it('o rótulo de cada posição é único dentro do padrão', () => {
    for (const id of ALL_SCALE_IDS) {
      for (const n of TAMANHOS) {
        for (let i = 0; i < 20; i++) {
          const padrao = sortearPadrao(n);
          const rotulos = posicoesDoPadrao(id, padrao).map(rotulo);
          expect(new Set(rotulos).size, `${id} ${escreverPadrao(padrao)}`).toBe(rotulos.length);
        }
      }
    }
  });

  it('nenhum grau vazio e nenhum semitom inválido', () => {
    for (const id of ALL_SCALE_IDS) {
      for (const n of TAMANHOS) {
        for (const padrao of [sortearPadrao(n), Array.from({ length: n }, (_, i) => i)]) {
          for (const p of posicoesDoPadrao(id, padrao as Padrao)) {
            expect(p.graus, id).toHaveLength(n);
            expect(p.semis, id).toHaveLength(n);
            for (const g of p.graus) expect(g, id).toMatch(/^[♭♯]*[1-7]$/);
            for (const s of p.semis) expect(Number.isFinite(s), id).toBe(true);
          }
        }
      }
    }
  });
});

describe('sortear um padrão', () => {
  it('começa em zero, tem o tamanho pedido e amplitude de 1 a 5', () => {
    for (const n of TAMANHOS) {
      for (let i = 0; i < 300; i++) {
        const p = sortearPadrao(n);
        expect(p).toHaveLength(n);
        expect(p[0]).toBe(0);
        const amplitude = Math.max(...p) - Math.min(...p);
        expect(amplitude).toBeGreaterThanOrEqual(1);
        expect(amplitude).toBeLessThanOrEqual(5);
      }
    }
  });

  it('nunca sai parado, e os passos nunca saltam mais de duas posições', () => {
    for (let i = 0; i < 500; i++) {
      const p = sortearPadrao(5);
      expect(new Set(p).size).toBeGreaterThan(1);
      for (let k = 1; k < p.length; k++) expect(Math.abs(p[k] - p[k - 1])).toBeLessThanOrEqual(2);
    }
  });

  it('o tamanho é preso entre o mínimo e o máximo', () => {
    expect(sortearPadrao(1)).toHaveLength(MIN_NOTAS);
    expect(sortearPadrao(99)).toHaveLength(MAX_NOTAS);
  });

  it('desce às vezes: ao longo de muitos sorteios aparece passo negativo', () => {
    let desceu = false;
    for (let i = 0; i < 200 && !desceu; i++) {
      const p = sortearPadrao(5);
      desceu = p.some((v, k) => k > 0 && v < p[k - 1]);
    }
    expect(desceu).toBe(true);
  });
});

describe('ler e escrever o padrão (a viagem da exploração para o exercício)', () => {
  it('vai e volta', () => {
    for (const n of TAMANHOS) {
      const p = sortearPadrao(n);
      expect(lerPadrao(escreverPadrao(p))).toEqual(p);
    }
  });

  it('aceita negativo e espaço em volta', () => {
    expect(lerPadrao('0, -1, 2')).toEqual([0, -1, 2]);
  });

  it('recusa o que não é padrão', () => {
    expect(lerPadrao(undefined)).toBeNull();
    expect(lerPadrao('')).toBeNull();
    expect(lerPadrao(['0', '1'])).toBeNull();
    expect(lerPadrao('0,1')).toBeNull();            // curto demais
    expect(lerPadrao('0,1,2,3,4,5,6')).toBeNull();  // longo demais
    expect(lerPadrao('1,2,3')).toBeNull();          // não começa na origem
    expect(lerPadrao('0,x,2')).toBeNull();
    expect(lerPadrao('0,1.5,2')).toBeNull();
    expect(lerPadrao('0,99,2')).toBeNull();
  });
});

// Vale para qualquer escala: o exercício sorteia a tônica, então o rótulo é a única pista.
it('o rótulo não depende da tonalidade — o motor nem sabe qual é', () => {
  const a = posicoesDoPadrao('penta-maior' as ScaleId, [0, 1, 2]).map(rotulo);
  const b = posicoesDoPadrao('penta-maior' as ScaleId, [0, 1, 2]).map(rotulo);
  expect(a).toEqual(b);
});
