// U7 (06/11/2026): ordem de complexidade das qualidades de acorde, aprovada pelo Paulo.
import { describe, expect, it } from 'vitest';
import { ALL_CHORDS, porComplexidade } from './helpers';
import { CHORDS, type ChordId } from '../theory/core';

describe('ALL_CHORDS', () => {
  it('é a ordem aprovada: tríades comuns, tétrades, as duas mais raras por último', () => {
    expect(ALL_CHORDS).toEqual(['maior', 'menor', 'dim', 'aum', 'sus2', 'sus4', '7', '7M', 'm7', 'm7b5', 'dim7', '7M#5', 'm7M']);
  });

  it('continua com exatamente as qualidades que CHORDS declara — nenhuma sobra, nenhuma falta', () => {
    // Se alguém acrescentar uma qualidade em core.ts e esquecer de ordená-la aqui, este teste
    // falha em vez de a qualidade nova sumir em silêncio das telas que usam ALL_CHORDS.
    const deCHORDS = Object.keys(CHORDS).sort();
    expect([...ALL_CHORDS].sort()).toEqual(deCHORDS);
  });
});

describe('porComplexidade', () => {
  it('reordena qualquer seleção pela ordem aprovada, não pela ordem em que a pessoa marcou', () => {
    const marcouNestaOrdem: ChordId[] = ['m7', 'maior', 'dim7', 'menor'];
    expect(porComplexidade(marcouNestaOrdem)).toEqual(['maior', 'menor', 'm7', 'dim7']);
  });

  it('não muda o array original', () => {
    const original: ChordId[] = ['m7', 'maior'];
    porComplexidade(original);
    expect(original).toEqual(['m7', 'maior']);
  });
});
