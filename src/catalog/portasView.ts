// As portas cruzadas com o catálogo: quais itens de cada uma a pessoa pode ver agora.
//
// Mora separado de `portas.ts` porque aquele arquivo **não pode importar o catálogo** — o estado
// guardado depende dele, e o catálogo alcança o estado. Ver o comentário lá.
import { AMBIENTES, EXERCISES } from './index';
import { PORTAS, type Porta } from './portas';
import { visivel } from './publicacao';

const TODOS = [...EXERCISES, ...AMBIENTES];
const porId = Object.fromEntries(TODOS.map(i => [i.id, i]));

/** Os itens de uma porta que a pessoa pode ver agora (o portão da decisão 91). */
export const itensDaPorta = (p: Porta, revisao: boolean): string[] =>
  p.itens.filter(id => porId[id] && visivel(porId[id]!.publicacao, revisao));

/**
 * As portas a mostrar.
 *
 * **Nenhuma porta é escondida por ter poucos itens** — a decisão 20 admitiu a técnica sabendo que ela
 * enche depois. Some só a porta que ficaria **vazia**, porque porta sem nada atrás é promessa falsa.
 */
export const portasVisiveis = (revisao: boolean): Porta[] =>
  PORTAS.filter(p => p.diagnostico || itensDaPorta(p, revisao).length > 0);
