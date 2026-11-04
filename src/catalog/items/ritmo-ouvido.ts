import { CELLS, RHYTHM_PRESETS, randomBars, shuffle } from '../helpers';
import type { CellId, MessageKey } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ritmoOuvido: CatalogItem = {
  id: 'ritmo-ouvido',
  objetos: ['ritmo'], tarefas: ['ouvir'],
  primaryModule: 'perception.rhythmic', skillTags: ['ear.rhythm_recognition', 'notation.rhythm_reading'],
  contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.rests', 'rhythm.syncopation', 'rhythm.triplets'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [{ id: 'nivel', label: ctx.t('settings.rhythmValues'), type: 'single', options: RHYTHM_PRESETS.map(p => ({ id: p.id, label: ctx.t(`theory.rhythmPresets.${p.id}` as MessageKey) })) }],
  defaults: { nivel: 'duas' },
  presentation: { bpm: 84 },
  make(s, ctx) {
    const cells = (RHYTHM_PRESETS.find(p => p.id === s.nivel) ?? RHYTHM_PRESETS[0]).cells;
    const bar = randomBars(cells, 1);
    const key = (b: CellId[][]) => b[0].join('|');
    const others = new Map<string, CellId[][]>();
    for (let tries = 0; others.size < 3 && tries < 60; tries++) { const o = randomBars(cells, 1); if (key(o) !== key(bar)) others.set(key(o), o); }
    const opts = shuffle([{ id: key(bar), label: '', rhythm: bar }, ...[...others].map(([k, b]) => ({ id: k, label: '', rhythm: b }))]);
    const onsets: number[] = [];
    let t = 0;
    bar[0].forEach(c => CELLS[c].events.forEach(ev => { if (!ev.rest) onsets.push(t); t += ev.d; }));
    return {
      prompt: ctx.t('quiz.rhythm'), visual: { kind: 'ear', hint: ctx.t('quiz.rhythmHint') },
      surface: { kind: 'choices', options: opts, wide: true }, expected: { kind: 'option', id: key(bar) },
      sound: { groups: [], drums: onsets }, autoplay: true, reveal: ctx.t('quiz.rhythmReveal'),
    };
  },
};
