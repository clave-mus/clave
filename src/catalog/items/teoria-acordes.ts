import { TEMAS, arr, pick, theoryQuestion } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const teoriaAcordes: CatalogItem = {
  id: 'teoria-acordes',
  objetos: ['acordes'], tarefas: ['nomear'],
  primaryModule: 'theory', skillTags: ['theory.chord_construction'],
  contentTags: ['chord.triads', 'chord.sevenths'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  // Um tópico só: nada a configurar, e por isso `defaults` fica vazio — chave em `defaults` sem
  // configuração correspondente é chave solta, e há teste contra isso.
  settings: ctx => [TEMAS(ctx, ['acordes', 'inversoes'])],
  defaults: { temas: ['acordes', 'inversoes'] },
  make(s, ctx) { return theoryQuestion(pick(arr(s.temas, ['acordes'])), ctx); },
};
