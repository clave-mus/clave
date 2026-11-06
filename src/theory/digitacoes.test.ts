// Porta os 21 testes de docs/doado/test_gerador_arpejos_baixo.py (M5, 06/11/2026).
//
// Duas adaptações deliberadas, nenhuma de comportamento:
// - os nomes das receitas de acorde são os `ChordId` que o app já usa (CHORDS, em theory/core.ts),
//   não os nomes em português do script Python — são a mesma lista de dez, só o rótulo muda;
// - a grafia vem de `noteName()`/`transpose()`, não de uma tabela própria do port.
import { describe, expect, it } from 'vitest';
import { note, noteName, type ChordId } from './core';
import {
  acordesDiatonicos, buscarDigitacoes, descreverTons, digitacoesDaReceita, digitacoesDoModo,
  getModo, tonsPorGraus, tonsPorReceita, type FamiliaBase,
} from './digitacoes';

const C = note(0);
const D = note(1);
const letras = (notas: ReturnType<typeof tonsPorGraus>) => notas.map(t => noteName(t.nota, 'en'));

describe('modos', () => {
  it('as quatro famílias, nas sete rotações: sete graus, primeiro é 0, crescente, sem repetir', () => {
    const familias: FamiliaBase[] = ['maior', 'menor', 'menor-harmonica', 'menor-melodica-jazz'];
    for (const familia of familias) {
      for (let grau = 1; grau <= 7; grau++) {
        const modo = getModo(C, familia, grau);
        const semis = modo.degs.map(([, s]) => s);
        expect(semis, `${familia} grau ${grau}`).toHaveLength(7);
        expect(semis[0], `${familia} grau ${grau}`).toBe(0);
        expect(semis.every((s, i) => i === 0 || s > semis[i - 1]), `${familia} grau ${grau}`).toBe(true);
        expect(new Set(semis).size, `${familia} grau ${grau}`).toBe(7);
      }
    }
  });

  it('C dórico (maior, grau 2)', () => {
    expect(letras(tonsPorGraus(getModo(C, 'maior', 2), 1, [1, 2, 3, 4, 5, 6, 7]))).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A', 'B♭']);
  });

  it('C menor harmônica', () => {
    expect(letras(tonsPorGraus(getModo(C, 'menor-harmonica', 1), 1, [1, 2, 3, 4, 5, 6, 7]))).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B']);
  });

  it('C menor melódica (jazz)', () => {
    expect(letras(tonsPorGraus(getModo(C, 'menor-melodica-jazz', 1), 1, [1, 2, 3, 4, 5, 6, 7]))).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A', 'B']);
  });

  it('modo inválido recusa', () => {
    expect(() => getModo(C, 'nao-existe' as FamiliaBase, 1)).toThrow(RangeError);
    expect(() => getModo(C, 'maior', 8)).toThrow(RangeError);
  });
});

describe('construção do acorde', () => {
  it('dórico, graus 1-3-5-6', () => {
    const tons = tonsPorGraus(getModo(C, 'maior', 2), 1, [1, 3, 5, 6]);
    expect(descreverTons(tons)).toBe('1:C – 3:E♭ – 5:G – 6:A');
    expect(tons.map(t => t.pc)).toEqual([0, 3, 7, 9]);
  });

  it('não-terciano, graus 1-2-4-7', () => {
    const tons = tonsPorGraus(getModo(C, 'maior', 2), 1, [1, 2, 4, 7]);
    expect(descreverTons(tons)).toBe('1:C – 2:D – 4:F – 7:B♭');
  });

  it('as dez receitas cromáticas que o app já tem', () => {
    const esperado: Record<ChordId, number[]> = {
      maior: [0, 4, 7], menor: [0, 3, 7], dim: [0, 3, 6], aum: [0, 4, 8],
      '7M': [0, 4, 7, 11], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], m7b5: [0, 3, 6, 10],
      dim7: [0, 3, 6, 9], m7M: [0, 3, 7, 11],
      // fora do escopo desta tarefa (não existiam na lista doada); aqui só pra satisfazer o tipo
      sus2: [], sus4: [], '7M#5': [],
    };
    for (const id of ['maior', 'menor', 'dim', 'aum', '7M', '7', 'm7', 'm7b5', 'dim7', 'm7M'] as ChordId[]) {
      expect(tonsPorReceita(C, id).map(t => t.pc), id).toEqual(esperado[id]);
    }
  });

  it('dim7 grafa Bbb, não A', () => {
    expect(letras(tonsPorReceita(C, 'dim7'))).toEqual(['C', 'E♭', 'G♭', 'B♭♭']);
  });

  it('os acordes diatônicos preservam a grafia enarmônica do modo', () => {
    const modo = getModo(C, 'menor-harmonica', 1);
    const campo = acordesDiatonicos(modo, [1, 3, 5, 7]);
    expect(campo.map(c => noteName(c.tons[0].nota, 'en'))).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B']);
    expect(descreverTons(campo[2].tons)).toBe('1:E♭ – 3:G – 5:B – 7:D');
  });

  it('graus inválidos recusam', () => {
    const modo = getModo(C, 'maior', 1);
    expect(() => tonsPorGraus(modo, 1.5, [1, 3, 5])).toThrow(RangeError);
    expect(() => tonsPorGraus(modo, 1, [1, 0, 5])).toThrow(RangeError);
  });
});

describe('busca de digitações', () => {
  const tons = tonsPorReceita(C, 'maior');

  it('acorde usa cordas distintas por padrão', () => {
    const formas = [...buscarDigitacoes(tons, { maxCasa: 7, maxVaoCasas: 4, limite: 100 })];
    expect(formas.length).toBeGreaterThan(0);
    for (const forma of formas) {
      expect(forma).toHaveLength(3);
      expect(new Set(forma.map(e => e.corda)).size).toBe(3);
      forma.forEach((e, i) => expect(e.pc).toBe(tons[i].pc));
    }
  });

  it('arpejo subindo', () => {
    const formas = [...buscarDigitacoes(tons, { tipo: 'arpejo', contorno: 'subindo', maxCasa: 12, maxVaoCasas: 5, limite: 100 })];
    expect(formas.length).toBeGreaterThan(0);
    for (const forma of formas) {
      for (let i = 0; i < forma.length - 1; i++) expect(forma[i].midi).toBeLessThan(forma[i + 1].midi);
    }
  });

  it('arpejo descendo inverte a ordem dos tons', () => {
    const formas = [...buscarDigitacoes(tons, { tipo: 'arpejo', contorno: 'descendo', maxCasa: 12, maxVaoCasas: 5, limite: 100 })];
    expect(formas.length).toBeGreaterThan(0);
    const invertidos = [...tons].reverse();
    for (const forma of formas) {
      for (let i = 0; i < forma.length - 1; i++) expect(forma[i].midi).toBeGreaterThan(forma[i + 1].midi);
      forma.forEach((e, i) => expect(e.pc).toBe(invertidos[i].pc));
    }
  });

  it('respeita o vão de casas — corda solta não conta', () => {
    const formas = [...buscarDigitacoes(tons, { maxCasa: 12, maxVaoCasas: 3, limite: 200 })];
    for (const forma of formas) {
      const casas = forma.map(e => e.casa).filter(c => c > 0);
      if (casas.length > 1) expect(Math.max(...casas) - Math.min(...casas)).toBeLessThanOrEqual(3);
    }
  });

  it('respeita o limite', () => {
    const formas = [...buscarDigitacoes(tons, { tipo: 'arpejo', maxCasa: 24, maxVaoCasas: null, limite: 7 })];
    expect(formas).toHaveLength(7);
  });

  it('respeita o vão máximo em MIDI', () => {
    const formas = [...buscarDigitacoes(tons, { maxCasa: 12, maxVaoCasas: null, maxVaoMidi: 12, limite: 500 })];
    for (const forma of formas) {
      const midis = forma.map(e => e.midi);
      expect(Math.max(...midis) - Math.min(...midis)).toBeLessThanOrEqual(12);
    }
  });

  it('afinação de cinco cordas, customizada', () => {
    const cincoCordas = [23, 28, 33, 38, 43]; // B E A D G
    const formas = [...buscarDigitacoes(tons, { tuning: cincoCordas, maxCasa: 7, maxVaoCasas: 4, limite: 100 })];
    expect(formas.length).toBeGreaterThan(0);
    for (const forma of formas) expect(new Set(forma.map(e => e.corda)).size).toBe(3);
  });

  it('mais notas no acorde que cordas na afinação não devolve voicing nenhum', () => {
    const modo = getModo(C, 'maior', 1);
    const seteTons = tonsPorGraus(modo, 1, [1, 2, 3, 4, 5]);
    expect([...buscarDigitacoes(seteTons, {})]).toEqual([]);
  });

  it('o atalho por modo', () => {
    const modo = getModo(C, 'menor-harmonica', 1);
    const resultados = [...digitacoesDoModo(modo, [1, 3, 5, 7], { maxCasa: 12, maxVaoCasas: 4, limitePorAcorde: 2 })];
    expect(resultados.length).toBeGreaterThan(0);
    expect(new Set(resultados.map(r => noteName(r.tons[0].nota, 'en')))).toEqual(new Set(['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B']));
    for (const r of resultados) expect(r.fingering).toHaveLength(4);
  });

  it('o atalho por receita', () => {
    const resultados = [...digitacoesDaReceita(D, 'm7b5', { maxCasa: 12, maxVaoCasas: 4, limite: 1 })];
    expect(resultados).toHaveLength(1);
    expect(resultados[0].map(e => e.pc)).toEqual([2, 5, 8, 0]);
  });

  it('parâmetros de busca inválidos recusam', () => {
    for (const opcoes of [{ maxCasa: -1 }, { maxVaoCasas: -1 }, { maxVaoMidi: -1 }, { limite: -1 }]) {
      expect(() => [...buscarDigitacoes(tons, opcoes)], JSON.stringify(opcoes)).toThrow(RangeError);
    }
  });
});
