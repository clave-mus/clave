// Cadências de contexto (10/11/2026). Escolhidas pelo Paulo: `ii-V-I` e `I-IV-V-I`.
//
// O que elas resolvem: uma nota dá a altura e **não dá o modo** (dó serve a dó maior e a lá menor);
// uma tríade dá o modo e não dá a função. A cadência dá as duas.
import { describe, expect, it } from 'vitest';
import { CADENCIAS, cadenciaHarmonica, fechaNaTonica } from './cadencia-harmonica';
import { mod } from './core';

/** As classes de altura de um acorde, normalizadas pela tônica da tonalidade. */
const graus = (acorde: number[], tonica: number) => [...new Set(acorde.map(m => mod(m - tonica, 12)))].sort((a, b) => a - b);

describe('as duas cadências que o Paulo escolheu', () => {
  it('são duas, e são estas', () => {
    expect([...CADENCIAS].sort()).toEqual(['I-IV-V-I', 'ii-V-I']);
  });

  it('ii-V-I tem três acordes e I-IV-V-I tem quatro', () => {
    expect(cadenciaHarmonica('ii-V-I', 60)).toHaveLength(3);
    expect(cadenciaHarmonica('I-IV-V-I', 60)).toHaveLength(4);
  });

  // O que define a cadência é a função dos graus, e isso tem de valer em qualquer tonalidade.
  it('em dó maior, ii-V-I é Dm, G e C', () => {
    const [ii, V, I] = cadenciaHarmonica('ii-V-I', 60);
    expect(graus(ii, 60)).toEqual([2, 5, 9]);  // Ré Fá Lá
    expect(graus(V, 60)).toEqual([2, 7, 11]);  // Sol Si Ré
    expect(graus(I, 60)).toEqual([0, 4, 7]);   // Dó Mi Sol
  });

  it('I-IV-V-I fecha no mesmo acorde com que abre', () => {
    const c = cadenciaHarmonica('I-IV-V-I', 60);
    expect(graus(c[0], 60)).toEqual(graus(c[3], 60));
  });

  it('as duas fecham na tônica — é o que faz uma cadência fechar', () => {
    for (const id of CADENCIAS) {
      expect(fechaNaTonica(id), id).toBe(true);
      const c = cadenciaHarmonica(id, 60);
      expect(graus(c[c.length - 1], 60), id).toEqual([0, 4, 7]);
    }
  });

  it('funciona em qualquer tonalidade: os graus relativos não mudam', () => {
    for (const tonica of [48, 55, 61, 67, 72]) {
      for (const id of CADENCIAS) {
        const emDo = cadenciaHarmonica(id, 60).map(a => graus(a, 60));
        expect(cadenciaHarmonica(id, tonica).map(a => graus(a, tonica)), `${id} em ${tonica}`).toEqual(emDo);
      }
    }
  });
});

describe('o registro: progressão, não escada', () => {
  /**
   * Sem o teto, empilhar terças no grau V ou VII joga o acorde quase duas oitavas acima da tônica, e
   * a cadência soa como acordes subindo em vez de uma progressão no mesmo lugar.
   */
  it('nenhum acorde passa de uma décima terceira acima da tônica', () => {
    for (const tonica of [48, 57, 60, 67]) {
      for (const id of CADENCIAS) {
        for (const acorde of cadenciaHarmonica(id, tonica, 'maior', true)) {
          expect(Math.max(...acorde), `${id} em ${tonica}`).toBeLessThanOrEqual(tonica + 16);
        }
      }
    }
  });

  it('e nenhum desce mais de uma oitava abaixo da tônica', () => {
    for (const id of CADENCIAS) {
      for (const acorde of cadenciaHarmonica(id, 60, 'maior', true)) {
        expect(Math.min(...acorde), id).toBeGreaterThanOrEqual(60 - 12);
      }
    }
  });
});

describe('modo e tétrade', () => {
  it('no campo menor, o grau I é tríade menor', () => {
    const c = cadenciaHarmonica('I-IV-V-I', 60, 'menor');
    expect(graus(c[0], 60)).toEqual([0, 3, 7]);
  });

  it('com tétrade, cada acorde tem quatro classes de altura', () => {
    for (const acorde of cadenciaHarmonica('ii-V-I', 60, 'maior', true)) {
      expect(graus(acorde, 60)).toHaveLength(4);
    }
  });

  // A prova de que o ii-V-I com tétrade é o de jazz: ii meio-diminuto? não — em MAIOR o ii7 é menor
  // com sétima menor, e o V é dominante. É o que distingue a cadência de jazz da clássica.
  it('em maior com tétrade, o ii é m7 e o V é dominante', () => {
    const [ii, V] = cadenciaHarmonica('ii-V-I', 60, 'maior', true);
    expect(graus(ii, 60)).toEqual([0, 2, 5, 9]);   // Ré Fá Lá Dó = Dm7
    expect(graus(V, 60)).toEqual([2, 5, 7, 11]);   // Sol Si Ré Fá = G7
  });
});
