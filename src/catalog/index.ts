// O catálogo inteiro: exercícios e ambientes são o mesmo tipo de item (decisão 17).
//
// Quem precisa de "todos os itens" importa daqui. As listas separadas continuam exportadas porque
// o Player só roda os que têm `make`, e as telas de ambiente são carregadas sob demanda.
import { EXERCISES } from './catalog';
import { AMBIENTES } from './ambientes';
import type { CatalogItem } from './types';

export const ITEMS: CatalogItem[] = [...EXERCISES, ...AMBIENTES];
export const itemById: Record<string, CatalogItem | undefined> = Object.fromEntries(ITEMS.map(i => [i.id, i]));

export { EXERCISES, AMBIENTES };
export type { CatalogItem };
