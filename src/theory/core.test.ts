import { describe, expect, it } from 'vitest';
import {
  buildChord, buildScale, chordSymbol, fromMidi, harmonicField, intervalBetween, keyAccidentals,
  majorTonic, midi, note, noteName, quality, relativeMinor, transpose, keyName, mod } from './core';

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

describe('campo harmônico das menores alteradas (pedido do Paulo)', () => {
  const la = note(5, 0, 4); // Lá
  const simbolos = (m: Parameters<typeof harmonicField>[1], tetrades = false) =>
    harmonicField(la, m, tetrades, 'en').map(d => d.symbol);
  const romanos = (m: Parameters<typeof harmonicField>[1], tetrades = false) =>
    harmonicField(la, m, tetrades, 'en').map(d => d.roman);

  // Lá menor harmônica: A B C D E F G#. Conferido grau a grau.
  it('menor harmônica em Lá: Am B° C+ Dm E F G#°', () => {
    expect(simbolos('menor-harmonica')).toEqual(['Am', 'Bdim', 'C+', 'Dm', 'E', 'F', 'G♯dim']);
  });

  it('e o V é MAIOR — é a razão de existir da menor harmônica', () => {
    expect(harmonicField(la, 'menor-harmonica')[4].chord).toBe('maior');
    expect(harmonicField(la, 'menor')[4].chord).toBe('menor');
  });

  // Lá menor melódica: A B C D E F# G#
  it('menor melódica em Lá: Am Bm C+ D E F#° G#°', () => {
    expect(simbolos('menor-melodica')).toEqual(['Am', 'Bm', 'C+', 'D', 'E', 'F♯dim', 'G♯dim']);
  });

  it('o IV é maior na melódica e menor na harmônica — é a 6ª elevada', () => {
    expect(harmonicField(la, 'menor-melodica')[3].chord).toBe('maior');
    expect(harmonicField(la, 'menor-harmonica')[3].chord).toBe('menor');
  });

  it('as tétrades usam os dois acordes novos: m(maj7) no i e maj7♯5 no ♭III', () => {
    expect(harmonicField(la, 'menor-harmonica', true).map(d => d.chord)).toEqual(['m7M', 'm7b5', '7M#5', 'm7', '7', '7M', 'dim7']);
    expect(harmonicField(la, 'menor-melodica', true).map(d => d.chord)).toEqual(['m7M', 'm7', '7M#5', '7', '7', 'm7b5', 'm7b5']);
  });

  it('os graus romanos marcam o que é menor e o que é bemol', () => {
    expect(romanos('menor-harmonica')).toEqual(['i', 'ii°', '♭III+', 'iv', 'V', '♭VI', 'vii°']);
    expect(romanos('menor-melodica')).toEqual(['i', 'ii', '♭III+', 'IV', 'V', 'vi°', 'vii°']);
  });

  it('maior e menor natural continuam como estavam', () => {
    expect(simbolos('maior')).toEqual(['A', 'Bm', 'C♯m', 'D', 'E', 'F♯m', 'G♯dim']);
    expect(simbolos('menor')).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']);
  });

  it('todo campo tem sete graus, em todo modo e nas duas formas', () => {
    for (const m of ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as const) {
      for (const t of [false, true]) expect(harmonicField(la, m, t), `${m}/${t}`).toHaveLength(7);
    }
  });

  it('as notas de cada acorde pertencem à escala do modo', () => {
    for (const m of ['menor-harmonica', 'menor-melodica'] as const) {
      const daEscala = new Set(buildScale(la, m).map(n => mod(midi(n), 12)));
      for (const d of harmonicField(la, m, true)) {
        for (const n of buildChord(d.root, d.chord)) {
          expect(daEscala.has(mod(midi(n), 12)), `${m}: ${d.symbol} tem nota fora da escala`).toBe(true);
        }
      }
    }
  });
});

describe('sus2', () => {
  it('é fundamental, segunda e quinta', () => {
    expect(buildChord(note(0, 0, 4), 'sus2').map(n => mod(midi(n), 12))).toEqual([0, 2, 7]);
  });

  it('difere de sus4 na nota do meio', () => {
    const c = note(0, 0, 4);
    expect(buildChord(c, 'sus4').map(n => mod(midi(n), 12))).toEqual([0, 5, 7]);
  });
});
