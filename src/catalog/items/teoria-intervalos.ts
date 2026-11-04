import { TEMAS, arr, pick, theoryQuestion } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

// O quinto item de teoria em texto (04/11/2026).
//
// Existe porque **intervalo em silêncio não tinha onde morar**: `que-intervalo-e-esse` precisa da
// pauta ou do braço na tela, e `ouvido-intervalo` precisa de som. Este é o único que cobra intervalo
// com o fone em casa e o celular guardado no bolso do lado errado.
//
// Objeto próprio (`intervalos`), para cair na porta de teoria sem se misturar com escalas.
export const teoriaIntervalos: CatalogItem = {
  id: 'teoria-intervalos',
  objetos: ['intervalos'], tarefas: ['nomear'],
  primaryModule: 'theory', skillTags: ['theory.interval_naming'],
  contentTags: ['interval.simple'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [TEMAS(ctx, ['intervalo-nomeado'])],
  defaults: { temas: ['intervalo-nomeado'] },
  make(s, ctx) { return theoryQuestion(pick(arr(s.temas, ['intervalo-nomeado'])), ctx); },
};
