// Junta a estrutura do conteúdo (src/data, src/state) com os textos do idioma (src/i18n/content.*.ts).
// As telas usam useContent() e recebem módulos já traduzidos.
import { useLocale, type Locale } from '../i18n';
import enContent from '../i18n/content.en';
import ptContent from '../i18n/content.pt';
import type { ModuleId } from '../catalog/taxonomy';
import { INSTRUMENTS, MODULE_LIST, type ModuleBase } from './modules';
import { PORTAS } from '../catalog/portas';

/** Módulo de habilidade já com nome e resumo no idioma. */
export interface Module extends ModuleBase {
  name: string;
  short: string;
}

export const CONTENT_TEXT = { pt: ptContent, en: enContent };

function build(locale: Locale) {
  const tx = CONTENT_TEXT[locale];
  const modules: Module[] = MODULE_LIST.map(m => ({ ...m, ...tx.modules[m.id] }));
  return {
    MODULES: modules,
    moduleById: Object.fromEntries(modules.map(m => [m.id, m])) as Record<ModuleId, Module>,
    INSTRUMENTS: INSTRUMENTS.map(i => ({ ...i, name: tx.instruments[i.id] })),
    // As nove entradas por objetivo, já no idioma. `apoio` é a linha da decisão 79, e ela importa:
    // é onde o texto descreve o conteúdo em vez de rotular quem usa.
    PORTAS: PORTAS.map(p => ({ ...p, name: tx.portas[p.id].nome, apoio: tx.portas[p.id].apoio })),
  };
}
export type Content = ReturnType<typeof build>;

const cache: Partial<Record<Locale, Content>> = {};
/** Conteúdo no idioma pedido (montado uma vez por idioma). */
export function contentFor(locale: Locale): Content {
  return (cache[locale] ??= build(locale));
}
export function useContent(): Content {
  return contentFor(useLocale());
}
