// Um resumo legível da configuração de um item — "Direção: Descendo · Escalas: Maior, Menor".
//
// Existe para a lista de rotinas: duas etapas com o mesmo título e configurações diferentes
// ficariam indistinguíveis, e a configuração salva é justamente o ponto de salvar na rotina.
//
// **Só mostra o que difere do padrão do item.** O padrão é o que a pessoa já espera encontrar; repeti-lo
// em toda linha esconderia o que ela mudou.
import { itemText } from '../i18n';
import { keyName } from '../theory/core';
import type { ParametrosDePratica } from './params';
import { regiaoDe } from './regioes';
import type { CatalogItem, Ctx, Setting, SettingValue } from './types';

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function valorLegivel(s: Setting, v: SettingValue): string | null {
  switch (s.type) {
    case 'toggle': return v ? s.label : null;
    case 'single': return s.options?.find(o => o.id === v)?.label ?? String(v);
    case 'multi': {
      const ids = Array.isArray(v) ? v : [];
      return ids.map(id => s.options?.find(o => o.id === id)?.label ?? String(id)).join(', ');
    }
    case 'range': return typeof v === 'number' ? (s.format ? s.format(v) : String(v)) : String(v);
  }
}

/** As configurações que mudaram em relação ao padrão, como texto. Vazio quando nada mudou. */
export function resumoDaConfiguracao(item: CatalogItem, settings: Record<string, unknown>, ctx: Ctx): string {
  const partes: string[] = [];
  for (const s of item.settings(ctx)) {
    const v = settings[s.id] as SettingValue | undefined;
    if (v === undefined || igual(v, item.defaults[s.id])) continue;
    const texto = valorLegivel(s, v);
    if (texto) partes.push(s.type === 'toggle' ? texto : `${s.label}: ${texto}`);
  }
  return partes.join(' · ');
}

/**
 * Tonalidade, região e material que a pessoa escolheu, como texto: "Fá maior · Média · Só a tonalidade".
 *
 * Sem isto, duas etapas do mesmo exercício em tonalidades diferentes ficariam idênticas na lista —
 * e a tonalidade é justamente o que a rotação percorre. Só escreve o que foi ESCOLHIDO: "livre" é o
 * padrão e não precisa de legenda.
 */
export function resumoDaPratica(p: ParametrosDePratica | undefined, ctx: Pick<Ctx, 't' | 'naming'>): string {
  if (!p) return '';
  const partes: string[] = [];
  if (p.key) partes.push(ctx.t(p.key.mode === 'maior' ? 'theory.keyMajor' : 'theory.keyMinor', { note: keyName(p.key.tonic, ctx.naming) }));
  const regiao = p.range ? regiaoDe(p.range) : null;
  if (regiao) partes.push(ctx.t(`practice.region_${regiao}`));
  if (p.material === 'diatonico') partes.push(ctx.t('practice.materialDiatonic'));
  return partes.join(' · ');
}

/**
 * O que uma etapa mostra numa lista — e o que ela **não** pode mostrar.
 *
 * Com rodízio, a linha diz **o que varia** ("3 variantes", "3 itens"), nunca um valor que mudaria a cada
 * execução. Mostrar a tonalidade da primeira instância mentiria em duas de três execuções, e foi o que o
 * Praticar fazia antes do editor existir.
 */
export function resumoDaEtapa(
  instancias: readonly { itemId: string; settings: Record<string, unknown>; params?: ParametrosDePratica }[],
  itemPorId: (id: string) => CatalogItem | undefined,
  ctx: Ctx,
): { titulo: string; detalhe: string; variantes: number } {
  const [primeira] = instancias;
  const item = primeira ? itemPorId(primeira.itemId) : undefined;
  const titulo = item ? itemText(ctx.t, item.id, 'title') : (primeira?.itemId ?? '');
  if (instancias.length <= 1) {
    return {
      titulo,
      detalhe: item ? [resumoDaPratica(primeira.params, ctx), resumoDaConfiguracao(item, primeira.settings, ctx)].filter(Boolean).join(' · ') : '',
      variantes: 1,
    };
  }
  const umItemSo = new Set(instancias.map(i => i.itemId)).size === 1;
  return {
    titulo,
    detalhe: ctx.t(umItemSo ? 'editor.variantsOf' : 'editor.itemsOf', { n: instancias.length }),
    variantes: instancias.length,
  };
}
