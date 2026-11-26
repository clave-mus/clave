// Aproximações cromáticas na melodia — 25/11/2026.
//
// Pedido dele: *"podemos adicionar aproximações cromáticas (tanto entre notas, como entre o 4 e o
// 5, como se aproximando de uma nota, como fazendo um ♭2-1)"*. Os três casos são o mesmo
// mecanismo — uma nota a meio tom de uma nota da escala, imediatamente antes dela.
//
// O que este arquivo trava são as duas promessas que o gerador faz: a **quantidade de notas** não
// muda (cromática substitui, não acrescenta), e **resolvendo** quer dizer resolvendo mesmo.
//
// **Em 25/11 a cota virou chance**, por correção dele: cota fixa faz toda melodia ter exatamente
// N cromáticas, e aí o ouvido aprende a contá-las. Os testes de quantidade viraram testes de
// frequência — e é a mesma promessa, medida em muitas melodias em vez de uma.
import { describe, expect, it } from 'vitest';
import { sortearMelodia } from './melodia';

const DO_MAIOR = [0, 2, 4, 5, 7, 9, 11];
const base = { pcs: DO_MAIOR, lo: 55, hi: 79, saltoMax: 7 };
const naEscala = (m: number) => DO_MAIOR.includes(((m % 12) + 12) % 12);

describe('quantas notas, e quantas de fora', () => {
  it.each([3, 5, 8, 2])('%i notas continuam %i notas, com cromáticas ligadas', n => {
    for (let i = 0; i < 200; i++) {
      expect(sortearMelodia({ ...base, n, chanceCromatica: 0.25 })).toHaveLength(n);
    }
  });

  it('sem pedir, nenhuma nota sai da escala', () => {
    for (let i = 0; i < 300; i++) {
      for (const m of sortearMelodia({ ...base, n: 6 })) expect(naEscala(m)).toBe(true);
    }
  });

  /**
   * **Chance, não cota**: numa amostra grande aparecem melodias com cromática e melodias sem — e é
   * essa variação que obriga a ouvir em vez de contar. A frequência fica perto do que ele pediu
   * (uma nota em cada quatro ou cinco), com folga para o sorteio.
   */
  it('umas melodias têm cromática e outras não, e a conta fica na faixa pedida', () => {
    let comCromatica = 0, semNenhuma = 0, notas = 0, fora = 0;
    for (let i = 0; i < 400; i++) {
      const m = sortearMelodia({ ...base, n: 5, chanceCromatica: 0.25 });
      const f = m.filter(x => !naEscala(x)).length;
      notas += m.length; fora += f;
      if (f) comCromatica += 1; else semNenhuma += 1;
    }
    expect(comCromatica, 'nunca veio cromática').toBeGreaterThan(40);
    expect(semNenhuma, 'toda melodia veio com cromática — virou cota de novo').toBeGreaterThan(40);
    const proporcao = fora / notas;
    expect(proporcao, `proporção ${proporcao.toFixed(2)}`).toBeGreaterThan(0.04);
    expect(proporcao, `proporção ${proporcao.toFixed(2)}`).toBeLessThan(0.4);
  });
});

describe('resolvendo quer dizer resolvendo', () => {
  /**
   * A regra que faz a nota ser **aproximação** e não nota errada: toda nota de fora da escala é
   * seguida por uma nota a um semitom. Sem isto, "aproximação cromática" seria só "nota alterada".
   */
  it('toda nota de fora é seguida pelo alvo, a meio tom', () => {
    for (let i = 0; i < 500; i++) {
      const m = sortearMelodia({ ...base, n: 6, chanceCromatica: 0.25 });
      m.forEach((x, k) => {
        if (naEscala(x)) return;
        expect(m[k + 1], `cromática na última posição: ${m.join(' ')}`).toBeDefined();
        expect(Math.abs(m[k + 1] - x), `não resolve: ${m.join(' ')}`).toBe(1);
      });
    }
  });

  it('a primeira nota nunca é de fora — a melodia diz onde está antes de sair', () => {
    for (let i = 0; i < 300; i++) {
      expect(naEscala(sortearMelodia({ ...base, n: 5, chanceCromatica: 0.25 })[0])).toBe(true);
    }
  });

  it('não saem duas cromáticas coladas: isso é cromatismo, não aproximação', () => {
    for (let i = 0; i < 400; i++) {
      const m = sortearMelodia({ ...base, n: 7, chanceCromatica: 0.25 });
      for (let k = 1; k < m.length; k++) {
        expect(naEscala(m[k]) || naEscala(m[k - 1]), `duas coladas: ${m.join(' ')}`).toBe(true);
      }
    }
  });

  it('soltas, a nota de fora pode não resolver — e é esse o outro exercício', () => {
    let viSemResolver = false;
    for (let i = 0; i < 400; i++) {
      const m = sortearMelodia({ ...base, n: 6, chanceCromatica: 0.25, cromaticasSoltas: true });
      m.forEach((x, k) => {
        if (naEscala(x)) return;
        if (m[k + 1] === undefined || Math.abs(m[k + 1] - x) !== 1) viSemResolver = true;
      });
    }
    expect(viSemResolver).toBe(true);
  });
});

describe('tudo continua dentro da faixa', () => {
  it('nenhuma nota passa do piso nem do teto', () => {
    for (let i = 0; i < 400; i++) {
      for (const m of sortearMelodia({ ...base, lo: 60, hi: 72, n: 6, chanceCromatica: 0.25 })) {
        expect(m).toBeGreaterThanOrEqual(60);
        expect(m).toBeLessThanOrEqual(72);
      }
    }
  });
});
