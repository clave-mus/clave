import { TEMAS, arr, pick, theoryQuestion } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const teoriaCampo: CatalogItem = {
  id: 'teoria-campo',
  objetos: ['harmonia'], tarefas: ['nomear'],
  primaryModule: 'theory', skillTags: ['theory.harmonic_field', 'theory.reharmonization'],
  contentTags: ['harmony.diatonic_field', 'harmony.tritone_sub'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [TEMAS(ctx, ['campo', 'sub5'])],
  defaults: { temas: ['campo'] },
  make(s, ctx) { return theoryQuestion(pick(arr(s.temas, ['campo'])), ctx); },
};
