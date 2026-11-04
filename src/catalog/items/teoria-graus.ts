import { TEMAS, arr, pick, theoryQuestion } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const teoriaGraus: CatalogItem = {
  id: 'teoria-graus',
  objetos: ['escalas'], tarefas: ['nomear'],
  primaryModule: 'theory', skillTags: ['theory.scale_degrees', 'theory.modes'],
  contentTags: ['scale.major', 'scale.modes'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [TEMAS(ctx, ['graus', 'modos'])],
  defaults: { temas: ['graus', 'modos'] },
  make(s, ctx) { return theoryQuestion(pick(arr(s.temas, ['graus'])), ctx); },
};
