// Contrato da FM-4 (decisões 64, 66 e 71).
//
// O que estes testes provam é mais estreito do que parece, de propósito: que a lista está COMPLETA
// e que tudo nela é VÁLIDO. Nenhum teste afirma que alguma condução é a certa — se um dia aparecer
// um, a decisão 64 foi quebrada.
import { describe, expect, it } from 'vitest';
import { AMBITOS_CORAL, conducoes, disposicoes, medir, pcsDoAcorde, situar, type Voicing } from './conducoes';
import { mod } from './core';

const C4 = 60, G3 = 55, E4 = 64, C3 = 48, B3 = 59, D4 = 62, F3 = 53, G2 = 43, C2 = 36;

describe('disposições', () => {
  it('toda disposição soa o acorde inteiro e nada além dele', () => {
    for (const [fund, id] of [[0, 'maior'], [7, '7'], [2, 'm7'], [11, 'm7b5']] as const) {
      const pcs = pcsDoAcorde(fund, id);
      for (const v of disposicoes(fund, id)) {
        expect(new Set(v.map(m => mod(m, 12))).size, `${fund}/${id}`).toBe(pcs.length);
        for (const m of v) expect(pcs, `${fund}/${id}: ${v}`).toContain(mod(m, 12));
      }
    }
  });

  it('toda disposição é crescente do baixo ao soprano — nenhuma cruza', () => {
    for (const v of disposicoes(0, '7M')) {
      expect(v[0]).toBeLessThanOrEqual(v[1]);
      expect(v[1]).toBeLessThanOrEqual(v[2]);
      expect(v[2]).toBeLessThanOrEqual(v[3]);
    }
  });

  it('toda disposição respeita os âmbitos das quatro vozes', () => {
    for (const v of disposicoes(5, 'menor')) {
      v.forEach((m, i) => {
        expect(m, `voz ${i}`).toBeGreaterThanOrEqual(AMBITOS_CORAL[i].lo);
        expect(m, `voz ${i}`).toBeLessThanOrEqual(AMBITOS_CORAL[i].hi);
      });
    }
  });

  it('posição fechada: as três vozes de cima cabem numa oitava, e o baixo fica livre', () => {
    for (const v of disposicoes(0, 'maior')) expect(v[3] - v[1]).toBeLessThanOrEqual(12);
    // e existe pelo menos uma com o baixo longe das outras três
    expect(disposicoes(0, 'maior').some(v => v[1] - v[0] > 12)).toBe(true);
  });

  it('enumera de verdade — há muito mais de uma disposição por acorde', () => {
    expect(disposicoes(0, 'maior').length).toBeGreaterThan(20);
    expect(disposicoes(0, '7M').length).toBeGreaterThan(20);
  });

  it('âmbito apertado reduz a lista, e âmbito impossível a esvazia', () => {
    const apertado = AMBITOS_CORAL.map(a => ({ lo: a.lo, hi: a.lo + 6 }));
    expect(disposicoes(0, 'maior', apertado).length).toBeLessThan(disposicoes(0, 'maior').length);
    expect(disposicoes(0, 'maior', AMBITOS_CORAL.map(() => ({ lo: 60, hi: 60 })))).toEqual([]);
  });
});

describe('medir', () => {
  const de: Voicing = [C3, G3, C4, E4];

  it('conta o movimento total em semitons', () => {
    expect(medir(de, [C3, G3, C4, E4]).movimentoTotal).toBe(0);
    expect(medir(de, [C3, G3, C4, D4]).movimentoTotal).toBe(2);
  });

  it('nota comum é voz que ficou exatamente onde estava', () => {
    expect(medir(de, [C3, G3, C4, E4]).notasComuns).toBe(4);
    expect(medir(de, [C3, G3, B3, D4]).notasComuns).toBe(2);
  });

  it('maior salto é o maior movimento de uma voz só, não a média', () => {
    expect(medir(de, [C3, G3, C4, C4 + 12]).maiorSalto).toBe(8);
  });

  it('acusa cruzamento de vozes', () => {
    expect(medir(de, [C3, G3, C4, E4]).cruzamento).toBe(false);
    expect(medir(de, [C4, G3, C4, E4]).cruzamento).toBe(true);
  });

  it('acusa saída de âmbito', () => {
    expect(medir(de, [C3, G3, C4, E4]).noAmbito).toBe(true);
    expect(medir(de, [C2, G3, C4, E4]).noAmbito).toBe(false);
  });
});

describe('conduções', () => {
  const de: Voicing = [C3, G3, C4, E4];

  it('a condução de movimento mínimo está na lista, e vem primeiro', () => {
    const lista = conducoes(de, 7, '7'); // C → G7
    expect(lista.length).toBeGreaterThan(0);
    const minimo = Math.min(...lista.map(c => c.medidas.movimentoTotal));
    expect(lista[0].medidas.movimentoTotal).toBe(minimo);
  });

  it('NENHUMA condução listada cruza vozes ou sai do âmbito', () => {
    for (const [fund, id] of [[7, '7'], [5, 'maior'], [9, 'm7'], [2, 'm7b5']] as const) {
      for (const c of conducoes(de, fund, id)) {
        expect(c.medidas.cruzamento, `${fund}/${id}: ${c.para}`).toBe(false);
        expect(c.medidas.noAmbito, `${fund}/${id}: ${c.para}`).toBe(true);
      }
    }
  });

  it('a ordenação é estável e monótona no movimento total', () => {
    const lista = conducoes(de, 7, '7');
    for (let i = 1; i < lista.length; i++) {
      expect(lista[i].medidas.movimentoTotal).toBeGreaterThanOrEqual(lista[i - 1].medidas.movimentoTotal);
    }
  });

  it('V7 → I economiza de verdade: há condução que move pouco e mantém nota comum', () => {
    const emG7: Voicing = [G2, F3, B3, D4];
    const paraC = conducoes(emG7, 0, 'maior');
    expect(paraC[0].medidas.movimentoTotal).toBeLessThanOrEqual(4);
    expect(paraC.some(c => c.medidas.notasComuns >= 1)).toBe(true);
  });

  it('a lista é exatamente as disposições do acorde — nada filtrado a mais, nada a menos', () => {
    expect(conducoes(de, 7, '7').length).toBe(disposicoes(7, '7').length);
  });
});

describe('situar: medição, nunca julgamento', () => {
  const de: Voicing = [G2, F3, B3, D4]; // G7

  it('não devolve nenhum booleano de acerto — só posições relativas', () => {
    const s = situar(de, [C3, E4 - 12, C4, C4 + 4], 0, 'maior');
    expect(Object.keys(s).sort()).toEqual(
      ['mantemMais', 'menorMovimento', 'movemMenos', 'suas', 'valida', 'validas'].sort());
    // `valida` é "é uma das enumeradas", não "está certa"
    expect(typeof s.valida).toBe('boolean');
  });

  it('a mais econômica tem zero conduções que movem menos que ela', () => {
    const melhor = conducoes(de, 0, 'maior')[0];
    const s = situar(de, melhor.para, 0, 'maior');
    expect(s.movemMenos).toBe(0);
    expect(s.suas.movimentoTotal).toBe(s.menorMovimento);
    expect(s.valida).toBe(true);
  });

  it('uma condução cara tem muitas movendo menos — e continua válida', () => {
    const lista = conducoes(de, 0, 'maior');
    const cara = lista[lista.length - 1];
    const s = situar(de, cara.para, 0, 'maior');
    expect(s.movemMenos).toBeGreaterThan(0);
    expect(s.valida).toBe(true);
  });

  it('condução que sai do âmbito ou não soa o acorde é inválida, sem ser "errada"', () => {
    expect(situar(de, [C2, F3, B3, D4], 0, 'maior').valida).toBe(false);
    expect(situar(de, [C3, C3, C3, C3], 0, 'maior').valida).toBe(false);
  });

  it('`validas` bate com o tamanho da lista enumerada', () => {
    expect(situar(de, conducoes(de, 0, 'maior')[0].para, 0, 'maior').validas).toBe(conducoes(de, 0, 'maior').length);
  });
});
