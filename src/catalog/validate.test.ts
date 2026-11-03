import { describe, expect, it } from 'vitest';
import { parseChordSymbol, validate } from './validate';

describe('cifras equivalentes', () => {
  it('lê a mesma cifra nas duas convenções e em grafias comuns', () => {
    const c7M = { root: 0, quality: '7M' };
    for (const s of ['C7M', 'Cmaj7', 'CM7', 'CΔ', 'C 7M', 'c7M', 'Cmaj 7', 'CMAJ7']) expect(parseChordSymbol(s)).toEqual(c7M);
    const half = { root: 11, quality: 'm7b5' };
    for (const s of ['Bm7(♭5)', 'Bm7(b5)', 'Bm7♭5', 'Bø']) expect(parseChordSymbol(s)).toEqual(half);
    for (const s of ['B°', 'Bdim', 'Bo']) expect(parseChordSymbol(s)).toEqual({ root: 11, quality: 'dim' });
    for (const s of ['C(♯5)', 'C+', 'Caug']) expect(parseChordSymbol(s)).toEqual({ root: 0, quality: 'aum' });
  });
  it('não confunde M (maior) com m (menor)', () => {
    expect(parseChordSymbol('CM7')?.quality).toBe('7M');
    expect(parseChordSymbol('Cm7')?.quality).toBe('m7');
    expect(parseChordSymbol('CM')?.quality).toBe('maior');
    expect(parseChordSymbol('Cm')?.quality).toBe('menor');
  });
  it('enarmonia na fundamental conta igual', () => {
    expect(parseChordSymbol('C#m')).toEqual(parseChordSymbol('D♭m'));
    expect(parseChordSymbol('F♯7')).toEqual({ root: 6, quality: '7' });
  });
  it('recusa o que não é cifra', () => {
    for (const s of ['', 'H7', 'C7x', 'Cmaj9', '7']) expect(parseChordSymbol(s)).toBeNull();
  });
  it('valida pela fundamental e qualidade', () => {
    const expected = { kind: 'chord', root: 0, quality: '7M' } as const;
    expect(validate(expected, { kind: 'chord', text: 'Cmaj7' })).toBe(true);
    expect(validate(expected, { kind: 'chord', text: 'C7' })).toBe(false);
    expect(validate(expected, { kind: 'chord', text: 'B#7M' })).toBe(true); // Si♯ = Dó
  });
});

describe('alturas', () => {
  it('classe de altura aceita qualquer oitava e qualquer grafia', () => {
    const e = { kind: 'pitchClass', pc: 1 } as const;
    expect(validate(e, { kind: 'pitch', midi: 61 })).toBe(true);
    expect(validate(e, { kind: 'pitch', midi: 49 })).toBe(true);
    expect(validate(e, { kind: 'spelled', letter: 0, acc: 1 })).toBe(true); // Dó♯
    expect(validate(e, { kind: 'spelled', letter: 1, acc: -1 })).toBe(true); // Ré♭
    expect(validate(e, { kind: 'pitch', midi: 62 })).toBe(false);
  });
  it('opção de nome de nota responde uma classe de altura', () => {
    const e = { kind: 'pitchClass', pc: 6 } as const;
    expect(validate(e, { kind: 'pitchClass', pc: 6 })).toBe(true);
    expect(validate(e, { kind: 'pitchClass', pc: 7 })).toBe(false);
    expect(validate({ kind: 'pitch', midi: 66 }, { kind: 'pitchClass', pc: 6 })).toBe(false); // sem oitava, não é altura exata
  });
  it('posições diferentes do braço com a mesma altura contam igual', () => {
    const e = { kind: 'pitch', midi: 64 } as const; // Mi4
    const tuning = [40, 45, 50, 55, 59, 64];
    const positions = [[5, 0], [4, 5], [3, 9], [2, 14]].map(([s, f]) => tuning[s] + f);
    positions.forEach(m => expect(validate(e, { kind: 'pitch', midi: m })).toBe(true));
    expect(validate(e, { kind: 'pitch', midi: 52 })).toBe(false); // Mi3, oitava abaixo
  });
  it('altura exata aceita a nota escrita em outra grafia, na mesma oitava', () => {
    const e = { kind: 'pitch', midi: 61 } as const;
    expect(validate(e, { kind: 'spelled', letter: 1, acc: -1, oct: 4 })).toBe(true);
    expect(validate(e, { kind: 'spelled', letter: 1, acc: -1 })).toBe(false); // sem oitava, não dá para saber
  });
  it('grafia exata separa as enarmonias', () => {
    const e = { kind: 'spelled', letter: 0, acc: 1 } as const; // Dó♯
    expect(validate(e, { kind: 'spelled', letter: 0, acc: 1 })).toBe(true);
    expect(validate(e, { kind: 'spelled', letter: 1, acc: -1 })).toBe(false); // Ré♭
    expect(validate(e, { kind: 'pitch', midi: 61 })).toBe(false); // tocar não diz como se escreve
  });
  it('grafia com oitava confere a oitava', () => {
    const e = { kind: 'spelled', letter: 4, acc: 0, oct: 4 } as const;
    expect(validate(e, { kind: 'spelled', letter: 4, acc: 0, oct: 4 })).toBe(true);
    expect(validate(e, { kind: 'spelled', letter: 4, acc: 0, oct: 5 })).toBe(false);
  });
});

describe('opções', () => {
  it('confere pelo id', () => {
    expect(validate({ kind: 'option', id: 'maior' }, { kind: 'option', id: 'maior' })).toBe(true);
    expect(validate({ kind: 'option', id: 'maior' }, { kind: 'option', id: 'menor' })).toBe(false);
  });
});
