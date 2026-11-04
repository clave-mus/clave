// As variantes de um item: as configurações concretas que ele pode assumir e que **mudam o que ele
// faz**, não só o que ele mostra.
//
// Existe por causa das fusões por superfície (decisão 16). Antes delas, "um item" e "uma pergunta"
// eram a mesma coisa, e os testes do catálogo podiam percorrer `EXERCISES` direto. Depois delas,
// `que-nota-e-essa` na pauta cobra GRAFIA e no braço cobra ALTURA — e um teste que só olhasse os
// padrões do item mediria um terço dele.
//
// Hoje a única dimensão que gera variante é a superfície. Se outra aparecer (e ela aparecerá), é aqui
// que entra — e todos os testes que percorrem variantes passam a cobrir a nova de graça.
import type { CatalogItem, Ctx, SettingValue } from './types';

export interface Variante {
  id: string;
  /** Como o teste a nomeia: `que-nota-e-essa` ou `que-nota-e-essa/braco`. */
  rotulo: string;
  settings: Record<string, SettingValue>;
  /** A superfície, quando o item tem mais de uma. */
  superficie?: string;
}

/** O seletor de superfície de um item, se ele tiver um. */
export function superficiesDe(item: CatalogItem, ctx: Ctx): string[] {
  const s = item.settings?.(ctx)?.find(x => x.id === 'superficie');
  return s?.options?.map(o => o.id) ?? [];
}

/** As variantes de um item. Item de uma superfície (ou de nenhuma) devolve **uma**. */
export function variantesDe(item: CatalogItem, ctx: Ctx): Variante[] {
  const sups = superficiesDe(item, ctx);
  if (sups.length < 2) return [{ id: item.id, rotulo: item.id, settings: { ...item.defaults } }];
  return sups.map(superficie => ({
    id: item.id,
    rotulo: `${item.id}/${superficie}`,
    superficie,
    settings: { ...item.defaults, superficie },
  }));
}

/** As variantes de uma lista de itens, achatadas. */
export const variantesDos = (itens: readonly CatalogItem[], ctx: Ctx): Variante[] =>
  itens.flatMap(i => variantesDe(i, ctx));
