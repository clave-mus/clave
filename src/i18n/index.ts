// Idiomas do app. Sem biblioteca: um objeto de textos por idioma e uma função t() tipada,
// que só aceita chaves que existem em pt.ts.
import { useCallback } from 'react';
import { useStore } from '../state/store';
import type { Naming } from '../theory/core';
import en from './en';
import pt from './pt';

export type Locale = 'pt' | 'en';
/** Nome de cada idioma escrito nele mesmo, como aparece no seletor. */
export const LOCALES: { id: Locale; name: string }[] = [
  { id: 'pt', name: 'Português' },
  { id: 'en', name: 'English' },
];

export type Plural = { one: string; other: string };
type Leaf = string | Plural;
/** A forma de pt.ts com os textos trocados por string qualquer: é o tipo que en.ts cumpre. */
export type Shape<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends Plural ? Plural : Shape<T[K]> };
type Path<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends Leaf ? `${P}${K}` : Path<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Path<typeof pt>;
export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

export const MESSAGES: Record<Locale, Shape<typeof pt>> = { pt, en };

/** Português por padrão; inglês só para quem tem o navegador explicitamente em inglês. */
export function detectLocale(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Locale {
  return languages.some(l => l.toLowerCase().startsWith('en')) ? 'en' : 'pt';
}
/** null no estado quer dizer "automático": segue o navegador. */
export function resolveLocale(choice: Locale | null): Locale {
  return choice ?? detectLocale();
}

export function translate(locale: Locale, key: MessageKey, vars: Vars = {}): string {
  let node: unknown = MESSAGES[locale];
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  if (node === undefined) return key; // só acontece com chave montada em tempo de execução (ex.: por id)
  const msg = node as Leaf;
  // Singular só para exatamente 1, nos dois idiomas. Intl.PluralRules não serve: para 'pt' ele
  // trata 0 como singular ("0 dia"), e no Brasil se diz "0 dias".
  const text = typeof msg === 'string' ? msg : Number(vars.count) === 1 ? msg.one : msg.other;
  return text.replace(/\{(\w+)\}/g, (all, name: string) => (name in vars ? String(vars[name]) : all));
}

/** Etiqueta BCP 47 para datas e números (toLocaleString) e para <html lang>. */
export function localeTag(locale: Locale) {
  return locale === 'pt' ? 'pt-BR' : 'en';
}

/** Título ou descrição de um exercício ou ferramenta, pelo id (textos em exercises.* e tools.*). */
export function itemText(t: Translate, id: string, field: 'title' | 'desc') {
  const ns = id in MESSAGES.pt.exercises ? 'exercises' : 'tools';
  return t(`${ns}.${id}.${field}` as MessageKey);
}

export function useLocale(): Locale {
  return resolveLocale(useStore(s => s.locale));
}
/** Nome das notas: o escolhido no perfil, ou o do idioma (Dó Ré Mi em português, C D E em inglês). */
export function useNaming(): Naming {
  const naming = useStore(s => s.naming);
  const locale = useLocale();
  return naming ?? locale;
}
export function useT(): Translate {
  const locale = useLocale();
  return useCallback((key: MessageKey, vars?: Vars) => translate(locale, key, vars), [locale]);
}
