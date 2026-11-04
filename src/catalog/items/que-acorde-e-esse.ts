import { ALL_CHORDS, CHORDS, CLEFS, ROOTS, SUP, alturaDoPc, arr, buildChord, chordName, chordOptions, chordTypes, guitarChordQuestion, midi, mod, pcPermitido, pick, pickClef, randInt } from '../helpers';
import type { ChordId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const queAcordeEEsse: CatalogItem = {
  id: 'que-acorde-e-esse',
  objetos: ['acordes', 'notacao'], tarefas: ['nomear', 'ler'],
  primaryModule: 'theory', skillTags: ['theory.chord_identification', 'notation.pitch_reading', 'keyboard.chord_shapes', 'fretboard.chord_shapes'],
  contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions', 'chord.open_shapes', 'chord.barre_shapes', 'clef.treble', 'clef.bass', 'instrument.keyboard', 'instrument.guitar'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    SUP(ctx, ['pauta', 'teclado', 'braco'], v => (v === 'braco' ? { arp: 0.04 } : v === 'pauta' ? { arp: 0.08 } : {})),
    { ...CLEFS(ctx), quando: s => s.superficie === 'pauta' },
    { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', quando: s => s.superficie !== 'braco',
      options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle', quando: s => s.superficie === 'pauta' },
    // No braço as formas são posições reais, e não acordes montados: por isso a lista é de formas.
    { id: 'formas', label: ctx.t('settings.shapes'), type: 'single', quando: s => s.superficie === 'braco',
      options: [{ id: 'abertos', label: ctx.t('settings.openChords') }, { id: 'pestana', label: ctx.t('settings.barreChords') }, { id: 'todos', label: ctx.t('settings.all') }] },
  ],
  defaults: { superficie: 'pauta', claves: ['sol'], tipos: ['maior', 'menor', 'dim', 'aum'], inversoes: false, formas: 'abertos' },
  make(s, ctx) {
    if (s.superficie === 'braco') return guitarChordQuestion(String(s.formas ?? 'abertos'), ctx);
    const types = arr(s.tipos, ['maior']) as ChordId[];
    const type = pick(types);
    if (s.superficie === 'teclado') {
      const pcRaiz = pcPermitido(ctx);
      const base = alturaDoPc(ctx, pcRaiz, { lo: 48, hi: 72 });
      const root = { ...ROOTS[mod(pcRaiz, 12)], oct: Math.floor(base / 12) - 1 };
      const notes = buildChord(root, type).map(midi).map(m => (m > 76 ? m - 12 : m));
      const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);
      return {
        prompt: ctx.t('quiz.whatChord'), visual: { kind: 'keyboard', lo: 48, hi: 83, marks: notes },
        surface: { kind: 'choices', options }, expected, sound: { groups: [notes] }, reveal: sym,
      };
    }
    const clef = pickClef(s, ctx);
    const root = { ...ROOTS[pcPermitido(ctx)], oct: clef === 'sol' ? 4 : 2 };
    const inv = s.inversoes ? randInt(0, CHORDS[type].degs.length - 1) : 0;
    const notes = buildChord(root, type, inv);
    const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);
    return {
      prompt: ctx.t('quiz.whatChord'), visual: { kind: 'staff', clef, columns: [notes] },
      surface: { kind: 'choices', options }, expected,
      sound: { groups: [notes.map(midi)] }, reveal: ctx.t('quiz.chordReveal', { symbol: sym, name: chordName(ctx.t, type).toLowerCase() }),
    };
  },
};
