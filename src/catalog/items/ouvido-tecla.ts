import { alturaDoPc, note, noteName, pcName, pcsPermitidas, pick } from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ouvidoTecla: CatalogItem = {
  id: 'ouvido-tecla',
  objetos: ['notas'], tarefas: ['ouvir', 'tocar'],
  primaryModule: 'perception.melodic', skillTags: ['ear.pitch_identification', 'keyboard.note_finding'],
  contentTags: ['pitch.naturals', 'pitch.accidentals'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [{ id: 'referencia', label: ctx.t('settings.reference', { note: noteName(note(0), ctx.naming) }), type: 'toggle' }, { id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle' }],
  defaults: { referencia: true, pretas: false },
  presentation: { gap: 0.9 },
  make(s, ctx): Question {
    const permitidas = pcsPermitidas(ctx).filter(x => s.pretas || ![1, 3, 6, 8, 10].includes(x));
    const p = pick(permitidas);
    const m = alturaDoPc(ctx, p, { lo: 48, hi: 83 });
    return {
      prompt: s.referencia ? ctx.t('quiz.earNoteRef', { note: noteName(note(0), ctx.naming) }) : ctx.t('quiz.earNote'), visual: { kind: 'ear' },
      surface: { kind: 'keyboard', lo: 60, hi: 71 }, expected: { kind: 'pitchClass', pc: p },
      sound: { groups: s.referencia ? [[60], [m]] : [[m]] }, autoplay: true,
      reveal: pcName(m, ctx.naming),
    };
  },
};
