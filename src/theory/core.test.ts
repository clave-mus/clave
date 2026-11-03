import { describe, expect, it } from 'vitest';
import {
  buildChord, buildScale, chordSymbol, fromMidi, harmonicField, intervalBetween, keyAccidentals,
  majorTonic, midi, note, noteName, quality, relativeMinor, transpose, keyName } from './core';

const names = (ns: { letter: number; acc: number }[]) => ns.map(n => noteName(n as never, 'en')).join(' ');

describe('notas', () => {
  it('converte para MIDI', () => {
    expect(midi(note(0, 0, 4))).toBe(60);
    expect(midi(note(5, 0, 4))).toBe(69);
    expect(midi(note(6, 1, 3))).toBe(60); // Si♯3 = Dó4
  });
  it('nomeia em português e inglês', () => {
    expect(noteName(note(3, 1), 'pt')).toBe('Fá♯');
    expect(noteName(note(6, -1), 'en')).toBe('B♭');
  });
  it('converte MIDI em nota', () => {
    expect(names([fromMidi(61, 'sharp'), fromMidi(61, 'flat')])).toBe('C♯ D♭');
  });
});

describe('intervalos', () => {
  it('reconhece qualidade', () => {
    expect(quality(intervalBetween(note(0), note(2)))).toBe('M'); // Dó-Mi
    expect(quality(intervalBetween(note(2), note(0, 0, 5)))).toBe('m'); // Mi-Dó: 6ª menor
    expect(quality(intervalBetween(note(3), note(6)))).toBe('A'); // Fá-Si: trítono como 4ª aum
  });
  it('transpõe com grafia correta', () => {
    expect(noteName(transpose(note(2), { num: 3, semis: 4 }), 'en')).toBe('G♯'); // terça maior de Mi
    expect(noteName(transpose(note(3), { num: 4, semis: 5 }), 'en')).toBe('B♭');
    expect(noteName(transpose(note(0, 0, 5), { num: 3, semis: 3 }, -1), 'en')).toBe('A');
  });
});

describe('escalas e acordes', () => {
  it('monta escalas', () => {
    expect(names(buildScale(note(1), 'maior'))).toBe('D E F♯ G A B C♯');
    expect(names(buildScale(note(6), 'dorico'))).toBe('B C♯ D E F♯ G♯ A');
    expect(names(buildScale(note(5), 'blues'))).toBe('A C D E♭ E G');
  });
  it('monta acordes e cifras', () => {
    expect(names(buildChord(note(2), 'menor'))).toBe('E G B');
    expect(names(buildChord(note(6), 'm7b5'))).toBe('B D F A');
    expect(chordSymbol(note(5), 'm7')).toBe('Am7');
  });
  it('escreve a cifra na convenção de cada idioma', () => {
    expect(chordSymbol(note(0), '7M', 'pt')).toBe('C7M');
    expect(chordSymbol(note(0), '7M', 'en')).toBe('Cmaj7');
    expect(chordSymbol(note(6), 'm7b5', 'pt')).toBe('Bm7(♭5)');
    expect(chordSymbol(note(6), 'm7b5', 'en')).toBe('Bm7♭5');
    expect(chordSymbol(note(6), 'dim', 'pt')).toBe('B°');
    expect(chordSymbol(note(6), 'dim', 'en')).toBe('Bdim');
    expect(names(buildChord(note(0), 'maior', 1))).toBe('E G C');
  });
});

describe('tonalidades', () => {
  it('acha tônicas e relativas', () => {
    expect(noteName(majorTonic(3), 'en')).toBe('A');
    expect(noteName(majorTonic(-4), 'en')).toBe('A♭');
    expect(noteName(relativeMinor(-1), 'en')).toBe('D');
    expect(keyAccidentals(2)).toEqual({ 3: 1, 0: 1 });
  });
  it('monta o campo harmônico', () => {
    const f = harmonicField(note(4), 'maior', true);
    expect(f.map(d => d.symbol).join(' ')).toBe('G7M Am7 Bm7 C7M D7 Em7 F♯m7(♭5)');
    expect(harmonicField(note(5), 'menor').map(d => d.roman).join(' ')).toBe('i ii° ♭III iv v ♭VI ♭VII');
    const en = harmonicField(note(4), 'maior', true, 'en');
    expect(en.map(d => d.symbol).join(' ')).toBe('Gmaj7 Am7 Bm7 Cmaj7 D7 Em7 F♯m7♭5');
    expect(en[0].roman).toBe('Imaj7');
  });
});

describe('keyName: a grafia convencional da tonalidade', () => {
  // Lá♯ maior não é uma tonalidade; Si♭ maior é. É a mesma regra que faz Fá maior ter Si♭.
  it('as tonalidades com bemol se escrevem com bemol', () => {
    expect(keyName(1, 'en')).toBe('D♭');
    expect(keyName(3, 'en')).toBe('E♭');
    expect(keyName(8, 'en')).toBe('A♭');
    expect(keyName(10, 'en')).toBe('B♭');
  });

  it('as com sustenido se escrevem com sustenido', () => {
    expect(keyName(6, 'en')).toBe('F♯');
    expect(keyName(11, 'en')).toBe('B');
  });

  it('as naturais não ganham acidente', () => {
    for (const [pc, nome] of [[0, 'C'], [2, 'D'], [4, 'E'], [5, 'F'], [7, 'G'], [9, 'A']] as const) {
      expect(keyName(pc, 'en')).toBe(nome);
    }
  });

  it('nunca devolve as duas grafias juntas, ao contrário de pcName', () => {
    for (let pc = 0; pc < 12; pc++) expect(keyName(pc, 'en')).not.toContain('/');
  });

  it('respeita o idioma dos nomes de nota', () => {
    expect(keyName(10, 'pt')).toBe('Si♭');
    expect(keyName(5, 'pt')).toBe('Fá');
  });
});
