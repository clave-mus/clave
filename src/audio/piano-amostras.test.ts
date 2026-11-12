import { describe, expect, it } from 'vitest';
import { AMOSTRAS, amostraMaisProxima, taxaDeTransposicao } from './piano-amostras';

describe('o conjunto de amostras', () => {
  it('cada amostra declarada existe em public/amostras/piano, e nada sobra lá', () => {
    // É o teste que impede o descompasso silencioso: declarar C7 sem o arquivo deixaria o motor
    // pedindo uma amostra que nunca chega — e o fallback sintetizado esconderia o erro para sempre.
    const noDisco = Object.keys(import.meta.glob('../../public/amostras/piano/*.mp3'))
      .map(caminho => caminho.split('/').pop()!).sort();
    expect(AMOSTRAS.map(a => `${a.nome}.mp3`).sort()).toEqual(noDisco);
  });

  it('os nomes batem com os MIDI (C2 = 36, três em três até C6 = 84)', () => {
    expect(AMOSTRAS[0]).toEqual({ nome: 'C2', midi: 36 });
    expect(AMOSTRAS[AMOSTRAS.length - 1]).toEqual({ nome: 'C6', midi: 84 });
    for (let n = 1; n < AMOSTRAS.length; n++) expect(AMOSTRAS[n].midi - AMOSTRAS[n - 1].midi).toBe(3);
    // O nome diz a altura: letra (com s de sustenido) + oitava, na convenção MIDI do Salamander.
    const PC = { C: 0, Ds: 3, Fs: 6, A: 9 } as Record<string, number>;
    for (const a of AMOSTRAS) {
      const [, letra, oitava] = a.nome.match(/^([A-Za-z]+)(\d)$/)!;
      expect(PC[letra] + 12 * (Number(oitava) + 1), a.nome).toBe(a.midi);
    }
  });

  it('toda altura da região útil fica a no máximo 1 semitom da amostra mais próxima', () => {
    for (let m = 35; m <= 85; m++) {
      expect(Math.abs(amostraMaisProxima(m).midi - m), `midi ${m}`).toBeLessThanOrEqual(1);
    }
  });

  it('fora da faixa amostrada, vale a ponta: abaixo de C2 transpõe para baixo, acima de C6 para cima', () => {
    expect(amostraMaisProxima(24).nome).toBe('C2');
    expect(amostraMaisProxima(90).nome).toBe('C6');
  });

  it('a taxa de transposição é 2^(Δ/12): uma oitava acima dobra, o uníssono é 1', () => {
    expect(taxaDeTransposicao(48, 36)).toBe(2);
    expect(taxaDeTransposicao(36, 36)).toBe(1);
    expect(taxaDeTransposicao(37, 36)).toBeCloseTo(1.0595, 4);
    expect(taxaDeTransposicao(35, 36)).toBeCloseTo(0.9439, 4);
  });
});
