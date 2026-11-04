import { CLEFS, majorTonic, noteName, optionsWith, pickClef, randInt, relativeMinor } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const pautaArmadura: CatalogItem = {
  id: 'pauta-armadura',
  objetos: ['notacao'], tarefas: ['nomear'],
  primaryModule: 'theory', skillTags: ['notation.key_signature', 'theory.key_relations'],
  contentTags: ['key.major', 'key.minor', 'key.signatures', 'clef.treble', 'clef.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [CLEFS(ctx), { id: 'modo', label: ctx.t('settings.keyMode'), type: 'single', options: [{ id: 'maior', label: ctx.t('settings.major') }, { id: 'menor', label: ctx.t('settings.minor') }, { id: 'ambos', label: ctx.t('settings.both') }] },
    { id: 'max', label: ctx.t('settings.maxAccidentals'), type: 'single', options: [{ id: '2', label: '2', tier: 1 }, { id: '4', label: '4', tier: 2 }, { id: '7', label: '7', tier: 3 }] }],
  defaults: { claves: ['sol'], modo: 'maior', max: '4' },
  make(s, ctx) {
    const max = Number(s.max ?? 4);
    const minor = s.modo === 'menor' || (s.modo === 'ambos' && Math.random() < 0.5);
    const label = (f: number) => (minor ? ctx.t('theory.keyMinor', { note: noteName(relativeMinor(f), ctx.naming) }) : ctx.t('theory.keyMajor', { note: noteName(majorTonic(f), ctx.naming) }));
    const f = randInt(-max, max);
    const pool = Array.from({ length: 2 * max + 1 }, (_, i) => i - max);
    const opts = optionsWith(f, pool, Math.min(6, pool.length));
    return {
      prompt: ctx.t(minor ? 'quiz.whichKeyMinor' : 'quiz.whichKeyMajor'), visual: { kind: 'staff', clef: pickClef(s, ctx), fifths: f, columns: [] },
      surface: { kind: 'choices', options: opts.map(o => ({ id: String(o), label: label(o) })) }, expected: { kind: 'option', id: String(f) },
      reveal: label(f),
    };
  },
};
