import { ALL_CHORDS, CHORDS, arr, chordName, chordTypes, pick, tonicaNaRegiao } from '../helpers';
import type { ChordId, Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ouvidoAcorde: CatalogItem = {
  id: 'ouvido-acorde',
  objetos: ['acordes'], tarefas: ['ouvir'],
  primaryModule: 'perception.harmonic', skillTags: ['ear.chord_quality'],
  contentTags: ['chord.triads', 'chord.sevenths'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: LEGADO,
  settings: ctx => [{ id: 'tipos', label: ctx.t('settings.types'), type: 'multi', options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true, present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
    { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.5, max: 4, step: 0.1, format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) }],
  defaults: { tipos: ['maior', 'menor'], arpejo: true, duracao: 2 },
  presets: [
    { id: 'maior-menor', nome: 'presets.maiorMenor', settings: { tipos: ['maior', 'menor'] } },
    { id: 'triades', nome: 'presets.triades', settings: { tipos: ['maior', 'menor', 'aum', 'dim'] } },
    { id: 'tetrades', nome: 'presets.tetrades', settings: { tipos: ['7M', '7', 'm7', 'm7b5', 'dim7'] } },
    { id: 'suspensos', nome: 'presets.suspensos', settings: { tipos: ['maior', 'menor', 'sus2', 'sus4'] } },
    { id: 'tudo', nome: 'presets.tudo', settings: { tipos: ALL_CHORDS } },
  ],
  presentation: { gap: 0.45 },
  make(s, ctx): Question {
    const types = arr(s.tipos, ['maior', 'menor']) as ChordId[];
    const type = pick(types);
    const root = tonicaNaRegiao(ctx, { lo: 53, hi: 64 });
    const ms = CHORDS[type].degs.map(([, semi]) => root + semi);
    return {
      prompt: ctx.t('quiz.earChord'), visual: { kind: 'ear' },
      surface: { kind: 'choices', options: chordTypes(ctx.t, types) }, expected: { kind: 'option', id: type },
      sound: { groups: [ms] }, autoplay: true, reveal: chordName(ctx.t, type),
    };
  },
};
