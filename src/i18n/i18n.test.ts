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

/**
 * **Chave de texto que ninguém usa.**
 *
 * Elas se acumulam sem ninguém ver: um controle sai da tela e o texto dele fica, traduzido nos dois
 * idiomas, parecendo que existe. Em 13/11 havia 28 — do seletor de superfície que morreu na
 * reorganização de 09/11, das direções `audiar` que mudaram de item em 12/11, do controle de
 * material que saiu quando a tonalidade passou a mandar, de telas que nem existem mais.
 *
 * ## ⚠️ O cuidado que este teste exige
 *
 * **Nem toda chave é escrita por extenso no código.** Várias são montadas por template —
 * `home.why${motivo}`, `practice.region_${id}`, `settings.rhythmGroup_${g}` — e para essas o teste
 * é cego. A lista `DINAMICOS` é o que o mantém honesto, e cada prefixo nela foi conferido um por um.
 *
 * **Escrevendo este teste eu apaguei uma chave viva**: `home.whyVoz`, montada por template a partir
 * de `porQueNaoCabe`, que devolve `'voz'`. Nenhum item exige voz hoje, então nem o teste de
 * contexto a pegou. É a prova do risco: aqui o falso positivo custa uma tradução perdida em
 * produção, e o falso negativo custa uma linha a mais num arquivo de textos. Preferir o falso
 * negativo é de propósito.
 */
describe('nenhum texto sobra sem uso', () => {
  /** Prefixos de chave montados em tempo de execução — conferidos um a um em 13/11. */
  const DINAMICOS = [
    'scales', 'scalesInline', 'chords', 'intervals', 'notes', 'degrees', 'modes', 'voices', 'instruments',
    'region_', 'ctx', 'obj_', 'sub_', 'nextSub_', 'figura', 'cell',
    'why', 'field_', 'short_', 'mode_', 'rhythmGroup_',
  ];

  it('toda chave de `pt` aparece em algum arquivo de código', () => {
    // `import.meta.glob` é como o projeto lê arquivos em teste (ver `publicacao.test.ts`): o
    // ambiente não tem os tipos do Node, e `?raw` traz o conteúdo já como texto.
    const fontes = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    /**
     * O glob é relativo a ESTE arquivo, então os do próprio `i18n/` vêm como `./pt.ts` e os outros
     * como `../catalog/…`. Excluir pelo prefixo `./` é o que separa os dois — filtrar por "contém
     * i18n" não pegava nada, e o teste passaria achando toda chave dentro do próprio dicionário.
     */
    const codigo = Object.entries(fontes)
      .filter(([caminho]) => !caminho.startsWith('./'))
      .map(([, texto]) => texto)
      .join('\n');
    const pt = fontes['./pt.ts'];

    const orfas: string[] = [];
    let grupo: string | null = null;
    for (const linha of pt.split('\n')) {
      const g = linha.match(/^ {2}(\w+): \{$/);
      if (g) { grupo = g[1]; continue; }
      if (/^ {2}\},?$/.test(linha)) { grupo = null; continue; }
      const k = linha.match(/^ {4}'?([\w.-]+)'?: '/);
      if (!k || !grupo) continue;
      const chave = k[1];
      if (DINAMICOS.some(d => chave.startsWith(d) || grupo!.startsWith(d))) continue;
      if (!codigo.includes(`${grupo}.${chave}`) && !codigo.includes(`'${chave}'`) && !codigo.includes(`.${chave}`)) {
        orfas.push(`${grupo}.${chave}`);
      }
    }
    expect(orfas, `texto sem uso: ${orfas.join(', ')}`).toEqual([]);
  });
});
