// Aproximações cromáticas na melodia — 25/11/2026.
//
// Pedido dele: *"podemos adicionar aproximações cromáticas (tanto entre notas, como entre o 4 e o
// 5, como se aproximando de uma nota, como fazendo um ♭2-1)"*. Os três casos são o mesmo
// mecanismo — uma nota a meio tom de uma nota da escala, imediatamente antes dela.
//
// O que este arquivo trava são as duas promessas que o gerador faz: a **quantidade de notas** não
// muda (cromática substitui, não acrescenta), e **resolvendo** quer dizer resolvendo mesmo.
import { describe, expect, it } from 'vitest';
import { sortearMelodia } from './melodia';

const DO_MAIOR = [0, 2, 4, 5, 7, 9, 11];
const base = { pcs: DO_MAIOR, lo: 55, hi: 79, saltoMax: 7 };
const naEscala = (m: number) => DO_MAIOR.includes(((m % 12) + 12) % 12);

describe('quantas notas, e quantas de fora', () => {
  it.each([[3, 1], [5, 2], [8, 3], [2, 1]])('%i notas com %i cromáticas continuam %i notas', (n, cromaticas) => {
    for (let i = 0; i < 200; i++) {
      const m = sortearMelodia({ ...base, n, cromaticas });
      expect(m).toHaveLength(n);
    }
  });

  it('sem pedir, nenhuma nota sai da escala', () => {
    for (let i = 0; i < 300; i++) {
      for (const m of sortearMelodia({ ...base, n: 6 })) expect(naEscala(m)).toBe(true);
    }
  });

  it('pedindo, aparecem notas de fora — e nunca mais que o pedido', () => {
    let viCromatica = false;
    for (let i = 0; i < 300; i++) {
      const m = sortearMelodia({ ...base, n: 5, cromaticas: 2 });
      const fora = m.filter(x => !naEscala(x));
      expect(fora.length).toBeLessThanOrEqual(2);
      if (fora.length) viCromatica = true;
    }
    expect(viCromatica, 'pediu cromática e nunca veio nenhuma').toBe(true);
  });
});

describe('resolvendo quer dizer resolvendo', () => {
  /**
   * A regra que faz a nota ser **aproximação** e não nota errada: toda nota de fora da escala é
   * seguida por uma nota a um semitom. Sem isto, "aproximação cromática" seria só "nota alterada".
   */
  it('toda nota de fora é seguida pelo alvo, a meio tom', () => {
    for (let i = 0; i < 500; i++) {
      const m = sortearMelodia({ ...base, n: 6, cromaticas: 2 });
      m.forEach((x, k) => {
        if (naEscala(x)) return;
        expect(m[k + 1], `cromática na última posição: ${m.join(' ')}`).toBeDefined();
        expect(Math.abs(m[k + 1] - x), `não resolve: ${m.join(' ')}`).toBe(1);
      });
    }
  });

  it('a primeira nota nunca é de fora — a melodia diz onde está antes de sair', () => {
    for (let i = 0; i < 300; i++) {
      expect(naEscala(sortearMelodia({ ...base, n: 5, cromaticas: 2 })[0])).toBe(true);
    }
  });

  it('não saem duas cromáticas coladas: isso é cromatismo, não aproximação', () => {
    for (let i = 0; i < 400; i++) {
      const m = sortearMelodia({ ...base, n: 7, cromaticas: 3 });
      for (let k = 1; k < m.length; k++) {
        expect(naEscala(m[k]) || naEscala(m[k - 1]), `duas coladas: ${m.join(' ')}`).toBe(true);
      }
    }
  });

  it('soltas, a nota de fora pode não resolver — e é esse o outro exercício', () => {
    let viSemResolver = false;
    for (let i = 0; i < 400; i++) {
      const m = sortearMelodia({ ...base, n: 6, cromaticas: 2, cromaticasSoltas: true });
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
      for (const m of sortearMelodia({ ...base, lo: 60, hi: 72, n: 6, cromaticas: 2 })) {
        expect(m).toBeGreaterThanOrEqual(60);
        expect(m).toBeLessThanOrEqual(72);
      }
    }
  });
});
