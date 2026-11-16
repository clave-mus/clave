// **O gerador de voicings de teclado** (15/11/2026).
//
// Pedido do Paulo: *"ter um gerador de voicings no piano bem diverso pra dificultar... variar
// bastante! acho que ainda não temos um motor pra isso"* — e ele estava certo, não havia.
//
// O que importa travar aqui é o que o exercício precisa: **as notas são as do acorde**, **a mão
// alcança**, **nada soa onde o alto-falante de celular não reproduz** e **há variedade de verdade**.
import { describe, expect, it } from 'vitest';
import { MAO_DIREITA, MAO_ESQUERDA, voicingsDe } from './voicings';
import { ALTERADOS, CHORDS, EXTENSOES, SEVENTHS, TRIADS, midi, mod, note, type ChordId } from './core';

const TODAS: ChordId[] = [...TRIADS, ...SEVENTHS, ...EXTENSOES, ...ALTERADOS];
const DO = note(0, 0, 4);

describe('as notas são as do acorde', () => {
  it('toda nota de todo voicing é um grau daquele acorde, e nenhum grau previsto falta', () => {
    for (const id of TODAS) {
      const esperados = new Set(CHORDS[id].degs.map(([, semi]) => mod(semi, 12)));
      for (const v of voicingsDe(DO, id)) {
        const classes = new Set(v.todas.map(n => mod(midi(n), 12)));
        for (const pc of classes) expect(esperados.has(pc), `${id}: classe ${pc} não é do acorde`).toBe(true);
        // os graus que não foram omitidos têm de estar presentes
        for (const [num, semi] of CHORDS[id].degs) {
          if (v.omitidos.includes(num)) continue;
          expect(classes.has(mod(semi, 12)), `${id}: falta o grau ${num}`).toBe(true);
        }
      }
    }
  });

  /**
   * **Sem a fundamental, ela não soa** — e isto é o parâmetro difícil que o Paulo aprovou: achar uma
   * tônica que não está tocando é o que se faz tocando em grupo, com o baixista cobrindo a raiz.
   */
  it('com `semFundamental`, a classe da fundamental não aparece em nota nenhuma', () => {
    for (const id of [...SEVENTHS, ...EXTENSOES, ...ALTERADOS]) {
      const vs = voicingsDe(DO, id, { semFundamental: true });
      expect(vs.length, `${id}: nenhum voicing sem fundamental`).toBeGreaterThan(0);
      for (const v of vs) {
        expect(v.omitidos).toContain(1);
        for (const n of v.todas) expect(mod(midi(n), 12), `${id}: a fundamental soou`).not.toBe(mod(midi(DO), 12));
      }
    }
  });

  /** Tríade sem fundamental seriam duas notas — não é acorde, e o gerador recusa em vez de entregar. */
  it('tríade sem fundamental não produz voicing', () => {
    for (const id of TRIADS) expect(voicingsDe(DO, id, { semFundamental: true })).toEqual([]);
  });
});

describe('a mão alcança', () => {
  it('a esquerda fica na região dela, e a direita começa acima', () => {
    for (const id of TODAS) {
      for (const v of voicingsDe(DO, id)) {
        for (const n of v.esquerda) {
          expect(midi(n), `${id}: esquerda abaixo do piso`).toBeGreaterThanOrEqual(MAO_ESQUERDA.lo);
          expect(midi(n), `${id}: esquerda acima do teto`).toBeLessThanOrEqual(MAO_ESQUERDA.hi);
        }
        expect(midi(v.direita[0]), `${id}: as mãos se cruzam`).toBeGreaterThan(midi(v.esquerda[v.esquerda.length - 1]));
        for (const n of v.direita) expect(midi(n), `${id}: direita acima do teto`).toBeLessThanOrEqual(MAO_DIREITA.hi);
      }
    }
  });

  it('a direita abre no máximo uma nona', () => {
    for (const id of TODAS) {
      for (const v of voicingsDe(DO, id)) {
        const vao = midi(v.direita[v.direita.length - 1]) - midi(v.direita[0]);
        expect(vao, `${id}: vão de ${vao} semitons na direita`).toBeLessThanOrEqual(14);
      }
    }
  });

  it('`todas` está em ordem de altura e não repete a mesma altura', () => {
    for (const id of TODAS) {
      for (const v of voicingsDe(DO, id)) {
        const ms = v.todas.map(midi);
        expect([...ms].sort((a, b) => a - b), `${id}`).toEqual(ms);
        expect(new Set(ms).size, `${id}: altura repetida`).toBe(ms.length);
      }
    }
  });
});

describe('nada soa onde o celular não reproduz', () => {
  /**
   * Medido em 15/11, com o relato do Paulo: abaixo de 300 Hz o alto-falante de um celular não
   * reproduz nada, e um baixo em Dó2 (65 Hz) repetiria o craquelado que ele achou no `mapa-do-braco`.
   * Dó3 são 131 Hz — ainda abaixo de 300, mas o parâmetro de subir tudo existe no item, e aqui o
   * piso garante que o motor nunca proponha um Dó2.
   */
  it('a nota mais grave de qualquer voicing é Dó3 ou acima', () => {
    for (const id of TODAS) {
      for (const v of voicingsDe(DO, id)) {
        expect(midi(v.todas[0]), `${id}`).toBeGreaterThanOrEqual(48);
      }
    }
  });

  it('o teto é respeitado quando se pede um mais baixo', () => {
    for (const id of SEVENTHS) {
      for (const v of voicingsDe(DO, id, { teto: 72 })) {
        for (const n of v.todas) expect(midi(n), `${id}`).toBeLessThanOrEqual(72);
      }
    }
  });
});

describe('há variedade de verdade', () => {
  /**
   * **O número que justificou o motor.** A primeira versão rendia 2 a 4 voicings por qualidade, e o
   * Paulo pediu "variar bastante". Dois defeitos meus limitavam o espaço: a ordem das notas de cima
   * era fixa (resolvido enumerando as permutações) e a oitava do baixo nunca variava, porque
   * `alturaDoGrau` só subia até o piso e nunca descia — com a fundamental escrita em Dó4, o baixo
   * jamais chegava ao Dó3 que a mão esquerda cobre.
   *
   * Medido depois: **787** voicings por fundamental, ~9.400 com as doze. A pior qualidade (tríade
   * maior, que tem pouco a variar) dá 10.
   */
  it('cada qualidade rende pelo menos dez voicings distintos', () => {
    for (const id of TODAS) {
      expect(voicingsDe(DO, id).length, `${id}`).toBeGreaterThanOrEqual(10);
    }
  });

  it('as tétrades com extensão passam de dez, e o total passa de setecentos', () => {
    for (const id of [...EXTENSOES, ...ALTERADOS]) {
      expect(voicingsDe(DO, id).length, `${id}`).toBeGreaterThan(10);
    }
    const total = TODAS.reduce((n, id) => n + voicingsDe(DO, id).length, 0);
    expect(total).toBeGreaterThan(700);
  });

  it('dois voicings nunca têm as mesmas alturas', () => {
    for (const id of TODAS) {
      const chaves = voicingsDe(DO, id).map(v => v.todas.map(midi).join(','));
      expect(new Set(chaves).size, `${id}: voicing repetido`).toBe(chaves.length);
    }
  });

  /** Variar não é só contar: o grau que fica no baixo tem de mudar, porque é ele que esconde a tônica. */
  it('o baixo não é sempre a fundamental', () => {
    for (const id of SEVENTHS) {
      const baixos = new Set(voicingsDe(DO, id).map(v => mod(midi(v.esquerda[0]), 12)));
      expect(baixos.size, `${id}: o baixo nunca muda`).toBeGreaterThan(2);
    }
  });
});
