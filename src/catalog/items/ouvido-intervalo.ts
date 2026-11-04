import { SEMI_TIER, alturaNaRegiao, arr, pick, semiOptions, semitoneName } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ouvidoIntervalo: CatalogItem = {
  id: 'ouvido-intervalo',
  objetos: ['intervalos'], tarefas: ['ouvir'],
  primaryModule: 'perception.melodic', skillTags: ['ear.interval_identification'],
  contentTags: ['interval.simple'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [{ id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: semiOptions(ctx).map(o => ({ ...o, tier: SEMI_TIER[Number(o.id)] })) },
    { id: 'direcao', label: ctx.t('settings.direction'), type: 'single', options: [{ id: 'sobe', label: ctx.t('settings.up') }, { id: 'desce', label: ctx.t('settings.down') }, { id: 'juntas', label: ctx.t('settings.together') }, { id: 'misto', label: ctx.t('settings.mixed') }] }],
  defaults: { intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' },
  make(s, ctx) {
    const ids = arr(s.intervalos, ['4', '7']);
    const d = Number(pick(ids));
    const base = alturaNaRegiao(ctx, { lo: 52, hi: 67 });
    const dir = s.direcao === 'misto' ? pick(['sobe', 'desce', 'juntas']) : s.direcao;
    const groups = dir === 'juntas' ? [[base, base + d]] : dir === 'desce' ? [[base + d], [base]] : [[base], [base + d]];
    return {
      prompt: ctx.t('quiz.earInterval'), visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
      surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: semitoneName(Number(i), ctx.conv) })) }, expected: { kind: 'option', id: String(d) },
      sound: { groups }, autoplay: true, reveal: semitoneName(d, ctx.conv),
    };
  },
};
