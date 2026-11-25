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

// ---------------------------------------------------------------------------
// A condução de vozes da cadência — 19/11/2026.
//
// Medido antes: cada acorde era empilhado da fundamental e calculado sozinho, e o ii–V–I em dó saía
// `[Ré4 Fá4 Lá4] → [Sol4 Si4 Ré5] → [Dó4 Mi4 Sol4]` — **3,17 semitons** de movimento médio por voz,
// com o V subindo uma oitava inteira e voltando. É a primeira coisa que soa em quatro itens.
import { conduzirCadencia, alvoConduzido, acordeNoTeto } from './cadencia-harmonica';
import { acordeDoCampo } from './padrao-de-escala';

const movimentoMedio = (acordes: number[][]) => {
  let soma = 0, n = 0;
  for (let i = 1; i < acordes.length; i++) {
    for (const m of acordes[i]) { soma += Math.min(...acordes[i - 1].map(a => Math.abs(a - m))); n++; }
  }
  return n ? soma / n : 0;
};
const classes = (ms: number[]) => [...new Set(ms.map(m => ((m % 12) + 12) % 12))].sort((a, b) => a - b);

describe('a cadência conduz as vozes', () => {
  const casos = [
    ['ii-V-I', 'maior', false], ['ii-V-I', 'maior', true],
    ['I-IV-V-I', 'maior', false], ['I-IV-V-I', 'maior', true],
    ['ii-V-I', 'menor', true], ['I-IV-V-I', 'menor-harmonica', true],
  ] as const;

  it.each(casos.map(c => c.join('/')))('%s: move menos de 1,5 semitom por voz', caso => {
    const [id, escala, tetrade] = caso.split('/');
    const c = cadenciaHarmonica(id as never, 60, escala as never, tetrade === 'true');
    expect(movimentoMedio(c), `${caso}: ${JSON.stringify(c)}`).toBeLessThan(1.5);
  });

  /**
   * **A harmonia não muda** — conduzir é escolher a oitava de cada nota, nunca trocar nota. Se esta
   * invariante quebrar, a cadência passa a tocar outro acorde, e é o tipo de erro que ninguém ouve
   * como erro: soa bem e ensina errado.
   */
  it.each(casos.map(c => c.join('/')))('%s: cada acorde continua sendo o mesmo acorde', caso => {
    const [id, escala, tetrade] = caso.split('/');
    const antes = (id === 'ii-V-I' ? [2, 5, 1] : [1, 4, 5, 1])
      .map(grau => acordeDoCampo(escala as never, grau, tetrade === 'true').map(s => 60 + s));
    const depois = cadenciaHarmonica(id as never, 60, escala as never, tetrade === 'true');
    expect(depois.map(classes)).toEqual(antes.map(classes));
  });

  /**
   * ⚠️ **O contexto fecha na tônica, em posição fundamental** — e este guarda existia antes
   * (`direcao-audiar.test.ts`) e me pegou: a primeira versão devolvia o I em primeira inversão
   * (`[Mi4 Sol4 Dó5]`), que conduz lindamente e **não fecha nada**. É o acorde final que estabelece
   * o centro; um músico também chega com a fundamental no baixo.
   */
  it.each([0, 2, 5, 7, 9, 11])('em qualquer tonalidade (tônica %i), o último acorde tem a fundamental no baixo', pc => {
    for (const id of CADENCIAS) {
      for (const tetrade of [false, true]) {
        const c = cadenciaHarmonica(id, 60 + pc, 'maior', tetrade);
        const ultimo = c[c.length - 1];
        expect(((Math.min(...ultimo) % 12) + 12) % 12, `${id}/${tetrade}`).toBe((60 + pc) % 12);
      }
    }
  });

  it('e tudo continua no registro da cadência', () => {
    for (const id of CADENCIAS) {
      const c = cadenciaHarmonica(id, 60, 'maior', true);
      for (const acorde of c) {
        expect(Math.min(...acorde)).toBeGreaterThanOrEqual(48);
        expect(Math.max(...acorde)).toBeLessThanOrEqual(76);
      }
    }
  });

  it('a condução é determinística: a mesma cadência soa igual todas as vezes', () => {
    const a = cadenciaHarmonica('ii-V-I', 60, 'maior', true);
    const b = cadenciaHarmonica('ii-V-I', 60, 'maior', true);
    expect(a).toEqual(b);
  });

  it('conduzirCadencia não mexe no primeiro acorde — ele é a referência de registro', () => {
    const acordes = [[60, 64, 67], [62, 65, 69], [60, 64, 67]];
    expect(conduzirCadencia(acordes, 60)[0]).toEqual([60, 64, 67]);
  });
});

describe('o alvo continua a condução', () => {
  it('fica perto do último acorde do contexto, sem mudar de acorde', () => {
    const contexto = cadenciaHarmonica('ii-V-I', 60, 'maior', true);
    const semis = acordeDoCampo('maior', 6, true); // o vi, um alvo qualquer
    const alvo = alvoConduzido(60, semis, contexto[contexto.length - 1]);
    expect(classes(alvo)).toEqual(classes(semis.map(s => 60 + s)));
    // move pouco em relação ao fecho do contexto
    expect(movimentoMedio([contexto[contexto.length - 1], alvo])).toBeLessThan(2);
  });

  it('sem contexto, é o acorde no teto de sempre', () => {
    const semis = acordeDoCampo('maior', 5, true);
    expect(alvoConduzido(60, semis, null)).toEqual(acordeNoTeto(60, semis));
  });
});
