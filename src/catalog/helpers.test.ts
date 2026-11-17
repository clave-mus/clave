// U7 (06/11/2026): ordem de complexidade das qualidades de acorde, aprovada pelo Paulo.
import { describe, expect, it } from 'vitest';
import { ALL_CHORDS, porComplexidade } from './helpers';
import { ALTERADOS, CHORDS, EXTENSOES, type ChordId } from '../theory/core';

describe('ALL_CHORDS', () => {
  it('é a ordem aprovada: tríades comuns, tétrades, as duas mais raras por último', () => {
    expect(ALL_CHORDS).toEqual(['maior', 'menor', 'dim', 'aum', 'sus2', 'sus4', '7', '7M', 'm7', 'm7b5', 'dim7', '7M#5', 'm7M']);
  });

  /**
   * **Nenhuma qualidade fica inacessível** — a intenção original deste guarda, agora que há mais de
   * uma lista.
   *
   * Até 15/11 `ALL_CHORDS` era a lista única, e a conferência era de igualdade. Com as extensões e
   * alterações, há três: as treze de sempre (que os itens existentes usam, e que **não** mudam),
   * mais `EXTENSOES` e `ALTERADOS`, pedidas por quem as quiser.
   *
   * O que o teste protege é o mesmo: uma qualidade declarada em `core.ts` e esquecida de todas as
   * listas sumiria em silêncio das telas. Então a soma das três tem de cobrir `CHORDS`, sem
   * repetição entre elas.
   */
  it('as listas cobrem todas as qualidades de CHORDS, sem sobra e sem repetição', () => {
    const todas = [...ALL_CHORDS, ...EXTENSOES, ...ALTERADOS];
    expect(todas.length, 'alguma qualidade está em duas listas').toBe(new Set(todas).size);
    expect([...todas].sort()).toEqual(Object.keys(CHORDS).sort());
  });

  it('as treze de sempre continuam em ALL_CHORDS, intocadas', () => {
    // As novas ficam FORA de propósito: os itens que já existem não mudam de conteúdo por isto.
    expect(ALL_CHORDS).toHaveLength(13);
    for (const id of [...EXTENSOES, ...ALTERADOS]) expect(ALL_CHORDS).not.toContain(id);
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
