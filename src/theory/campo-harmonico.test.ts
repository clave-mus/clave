import { describe, expect, it } from 'vitest';
import { grauDaFundamental, materialDoCampo, opcoesDeEmprestimo, type CampoDoExercicio } from './campo-harmonico';
import { mod } from './core';

const CASOS: [CampoDoExercicio, boolean][] = [
  ['maior', false], ['maior', true], ['menor', false], ['menor', true],
];

describe('materialDoCampo', () => {
  it('maior tem 7 graus + 6 empréstimos; menor tem 7 + 5', () => {
    for (const tetrade of [false, true]) {
      expect(materialDoCampo('maior', tetrade)).toHaveLength(13);
      expect(materialDoCampo('menor', tetrade)).toHaveLength(12);
    }
  });

  it.each(CASOS)('%s (tétrades: %s): nenhum par divide o mesmo conjunto de classes de altura', (campo, tetrade) => {
    // É ISTO que garante pergunta sem ambiguidade com inversões ligadas: invertido, o que resta de
    // um acorde é o conjunto de classes de altura — se dois candidatos dividissem o mesmo, a mesma
    // sonoridade teria duas respostas certas, o caso sus2/sus4 de `ouvido-acorde`.
    const material = materialDoCampo(campo, tetrade);
    for (let a = 0; a < material.length; a++) {
      for (let b = a + 1; b < material.length; b++) {
        const pcsA = new Set(material[a].semis.map(s => mod(s, 12)));
        const pcsB = new Set(material[b].semis.map(s => mod(s, 12)));
        const iguais = pcsA.size === pcsB.size && [...pcsA].every(p => pcsB.has(p));
        expect(iguais, `${material[a].roman} e ${material[b].roman} têm as mesmas classes`).toBe(false);
      }
    }
  });

  it.each(CASOS)('%s (tétrades: %s): os rótulos romanos são únicos', (campo, tetrade) => {
    const romanos = materialDoCampo(campo, tetrade).map(a => a.roman);
    expect(new Set(romanos).size).toBe(romanos.length);
  });

  it.each(CASOS)('%s (tétrades: %s): vem em ordem de fundamental', (campo, tetrade) => {
    const semis = materialDoCampo(campo, tetrade).map(a => a.semi);
    expect([...semis].sort((x, y) => x - y)).toEqual(semis);
  });

  it('os ids são estáveis — são o que configuração e histórico guardam', () => {
    expect(materialDoCampo('maior', true).map(a => a.id)).toEqual(
      ['g1', 'bII', 'g2', 'iio', 'bIII', 'g3', 'g4', 'iv', 'g5', 'bVI', 'g6', 'bVII', 'g7']);
    expect(materialDoCampo('menor', true).map(a => a.id)).toEqual(
      ['g1', 'bII', 'g2', 'ii', 'g3', 'g4', 'IV', 'g5', 'V', 'g6', 'g7', 'viio']);
  });

  it('os graus diatônicos do maior, nota a nota (tétrades em dó: ii7 = ré-fá-lá-dó)', () => {
    const porId = Object.fromEntries(materialDoCampo('maior', true).map(a => [a.id, a]));
    expect(porId.g1.semis).toEqual([0, 4, 7, 11]);
    expect(porId.g2.semis).toEqual([2, 5, 9, 12]);
    expect(porId.g5.semis).toEqual([7, 11, 14, 17]);
    expect(porId.g7.semis).toEqual([11, 14, 17, 21]);
    expect(porId.g1.roman).toBe('I7M');
    expect(porId.g2.roman).toBe('ii7');
    expect(porId.g7.roman).toBe('viiø');
  });

  it('os empréstimos do maior, nota a nota: o grupo do menor paralelo + o napolitano', () => {
    const porId = Object.fromEntries(materialDoCampo('maior', true).map(a => [a.id, a]));
    expect(porId.iv.semis).toEqual([5, 8, 12, 15]);     // fá–lá♭–dó–mi♭
    expect(porId.bVI.semis).toEqual([8, 12, 15, 19]);   // lá♭–dó–mi♭–sol
    expect(porId.bVII.semis).toEqual([10, 14, 17, 20]); // si♭–ré–fá–lá♭: DOMINANTE, o backdoor
    expect(porId.bIII.semis).toEqual([3, 7, 10, 14]);   // mi♭–sol–si♭–ré
    expect(porId.iio.semis).toEqual([2, 5, 8, 12]);     // ré–fá–lá♭–dó
    expect(porId.bII.semis).toEqual([1, 5, 8, 12]);     // ré♭–fá–lá♭–dó
    expect(porId.iio.roman).toBe('iiø');
    expect(porId.bVII.roman).toBe('♭VII7');
    expect(porId.bVI.roman).toBe('♭VI7M');
  });

  it('os empréstimos do menor, nota a nota: V e vii° da harmônica, IV e ii do dórico, ♭II', () => {
    const porId = Object.fromEntries(materialDoCampo('menor', true).map(a => [a.id, a]));
    expect(porId.V.semis).toEqual([7, 11, 14, 17]);     // mi–sol♯–si–ré (em lá)
    expect(porId.viio.semis).toEqual([11, 14, 17, 20]); // a sensível, diminuto cheio
    expect(porId.IV.semis).toEqual([5, 9, 12, 15]);     // IV7 dominante — o som dórico
    expect(porId.ii.semis).toEqual([2, 5, 9, 12]);
    expect(porId.V.roman).toBe('V7');
    expect(porId.viio.roman).toBe('vii°7');
    // E, contra os diatônicos: no menor natural o v é menor e o grau 2 é meio-diminuto.
    expect(porId.g5.roman).toBe('v7');
    expect(porId.g2.roman).toBe('iiø');
  });

  it('a convenção muda a cauda: ♭VI7M em pt é ♭VImaj7 em en', () => {
    const en = Object.fromEntries(materialDoCampo('maior', true, 'en').map(a => [a.id, a]));
    expect(en.bVI.roman).toBe('♭VImaj7');
    expect(en.g1.roman).toBe('Imaj7');
  });
});

describe('grauDaFundamental', () => {
  it('iv e IV são os dois o grau 4; os bemóis levam o ♭', () => {
    expect(grauDaFundamental(5)).toBe('4');
    expect(grauDaFundamental(8)).toBe('♭6');
    expect(grauDaFundamental(10)).toBe('♭7');
    expect(grauDaFundamental(1)).toBe('♭2');
  });
});

describe('opcoesDeEmprestimo', () => {
  it('o chip leva a identidade sem a cauda de sétima: iiø, vii°, ♭VI', () => {
    expect(opcoesDeEmprestimo('maior').map(o => o.label)).toEqual(['♭II', 'iiø', '♭III', 'iv', '♭VI', '♭VII']);
    expect(opcoesDeEmprestimo('menor').map(o => o.label)).toEqual(['♭II', 'ii', 'IV', 'V', 'vii°']);
  });
});
