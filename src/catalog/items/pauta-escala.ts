import { ALL_SCALES, CLEFS, ROOTS, arr, buildScale, midi, noteName, optionsWith, pcPermitido, pick, pickClef, plain, scaleName, shuffle } from '../helpers';
import type { MessageKey, Note, ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const pautaEscala: CatalogItem = {
  id: 'pauta-escala',
  objetos: ['escalas', 'notacao'], tarefas: ['ler'],
  primaryModule: 'theory', skillTags: ['theory.scale_identification', 'notation.pitch_reading'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues', 'clef.treble', 'clef.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'material'],
  publicacao: LEGADO,
  settings: ctx => [CLEFS(ctx), { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) }],
  defaults: { claves: ['sol'], tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] },
  presentation: { gap: 0.32 },
  make(s, ctx) {
    const clef = pickClef(s, ctx);
    const types = arr(s.tipos, ['maior']) as ScaleId[];
    const type = pick(types);
    const tonic = { ...ROOTS[pcPermitido(ctx)], oct: clef === 'sol' ? 4 : 2 };
    const notes = [...buildScale(tonic, type), { ...tonic, oct: tonic.oct + 1 }];
    const name = (t: Note, id: ScaleId) => ctx.t('quiz.scaleOf', { note: noteName(t, ctx.naming), scale: ctx.t(`theory.scalesInline.${id}` as MessageKey) });
    const pool = [...types.map(t => name(tonic, t)), ...shuffle(ROOTS).slice(0, 4).map(r => name(r, type))];
    const correct = name(tonic, type);
    return {
      prompt: ctx.t('quiz.whatScale'), visual: { kind: 'staff', clef, columns: notes.map(n => [n]) },
      surface: { kind: 'choices', options: optionsWith(correct, [...new Set(pool)], 6).map(plain), wide: true }, expected: { kind: 'option', id: correct },
      sound: { groups: notes.map(n => [midi(n)]) }, reveal: correct,
    };
  },
};
