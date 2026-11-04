import { TEMAS, arr, pick, theoryQuestion } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const teoriaTonalidades: CatalogItem = {
  id: 'teoria-tonalidades',
  objetos: ['notacao'], tarefas: ['nomear'],
  primaryModule: 'theory', skillTags: ['theory.key_relations'],
  contentTags: ['key.major', 'key.minor', 'key.signatures'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [TEMAS(ctx, ['tonalidades', 'armadura', 'enarmonia'])],
  defaults: { temas: ['tonalidades', 'armadura', 'enarmonia'] },
  make(s, ctx) { return theoryQuestion(pick(arr(s.temas, ['tonalidades'])), ctx); },
};
