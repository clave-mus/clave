import { describe, expect, it } from 'vitest';
import { detectLocale, MESSAGES, translate, type Locale } from './index';
import enContent from './content.en';
import ptContent from './content.pt';

/** Todas as folhas de um objeto de textos, como pares "chave.pontuada" → texto. */
function leaves(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

describe('traduções', () => {
  const pt = new Map(leaves(MESSAGES.pt));
  const others = (Object.keys(MESSAGES) as Locale[]).filter(l => l !== 'pt');

  it.each(others)('%s tem exatamente as mesmas chaves que pt', locale => {
    const keys = leaves(MESSAGES[locale]).map(([k]) => k).sort();
    expect(keys).toEqual([...pt.keys()].sort());
  });

  it.each(Object.keys(MESSAGES) as Locale[])('%s não tem texto vazio', locale => {
    const empty = leaves(MESSAGES[locale]).filter(([, v]) => !v.trim()).map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it.each(others)('%s usa os mesmos {valores} que pt em cada texto', locale => {
    const diff = leaves(MESSAGES[locale])
      .filter(([k, v]) => placeholders(v).join() !== placeholders(pt.get(k) ?? '').join())
      .map(([k]) => k);
    expect(diff).toEqual([]);
  });
});

describe('conteúdo traduzido', () => {
  it('inglês tem as mesmas chaves e o mesmo número de passos em cada lista', () => {
    expect(leaves(enContent).map(([k]) => k).sort()).toEqual(leaves(ptContent).map(([k]) => k).sort());
  });
  it('nenhum texto vazio', () => {
    expect([...leaves(ptContent), ...leaves(enContent)].filter(([, v]) => !v.trim()).map(([k]) => k)).toEqual([]);
  });
  it('inglês sem letras acentuadas do português, fora nomes próprios de gêneros', () => {
    const proper = /Forró|Baião|baião/g;
    expect(leaves(enContent).filter(([, v]) => /[ãõçáéíóúâêô]/i.test(v.replace(proper, ''))).map(([k]) => k)).toEqual([]);
  });
});

describe('translate', () => {
  it('insere valores', () => {
    expect(translate('pt', 'profile.languageAuto', { language: 'Português' })).toBe('Automático (Português)');
  });
  it('escolhe a forma pela quantidade', () => {
    expect(translate('pt', 'home.questions', { count: 1 })).toBe('1 pergunta');
    expect(translate('pt', 'home.questions', { count: 0 })).toBe('0 perguntas'); // no Brasil, zero é plural
    expect(translate('en', 'home.questions', { count: 1 })).toBe('1 question');
    expect(translate('en', 'home.questions', { count: 2 })).toBe('2 questions');
  });
});

describe('detecção do idioma', () => {
  it('reconhece português de qualquer região', () => {
    expect(detectLocale(['pt-BR'])).toBe('pt');
    expect(detectLocale(['fr-FR', 'pt-PT'])).toBe('pt');
  });
  it('reconhece inglês explícito', () => {
    expect(detectLocale(['es-AR', 'en-US'])).toBe('en');
  });
  it('cai em português quando não detecta nada', () => {
    expect(detectLocale([])).toBe('pt');
    expect(detectLocale(['es-AR', 'fr-FR'])).toBe('pt');
  });
});
