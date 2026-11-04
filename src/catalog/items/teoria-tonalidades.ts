import { theoryQuestion } from '../helpers';
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
  settings: () => [], defaults: {},
  make(_s, ctx) { return theoryQuestion('tonalidades', ctx); },
};
