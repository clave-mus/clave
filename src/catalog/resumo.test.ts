import { describe, expect, it } from 'vitest';
import { translate, type Locale, type MessageKey, type Vars } from '../i18n';
import { EXERCISES } from './catalog';
import { resolveParams } from './params';
import { resumoDaConfiguracao, resumoDaEtapa, resumoDaPratica } from './resumo';
import type { Ctx } from './types';

const ctx = (locale: Locale = 'pt'): Ctx => ({
  naming: locale, conv: locale, t: (k: MessageKey, v?: Vars) => translate(locale, k, v), params: resolveParams('violao'),
});
const item = (id: string) => EXERCISES.find(e => e.id === id)!;

describe('resumoDaConfiguracao', () => {
  it('sem mudança em relação ao padrão, não escreve nada', () => {
    const ex = item('ouvido-escala');
    expect(resumoDaConfiguracao(ex, { ...ex.defaults }, ctx())).toBe('');
    expect(resumoDaConfiguracao(ex, {}, ctx())).toBe('');
  });

  it('mostra só o que mudou, com o rótulo e o valor que a pessoa vê', () => {
    const ex = item('ouvido-escala');
    expect(resumoDaConfiguracao(ex, { ...ex.defaults, direcao: 'desce' }, ctx('pt'))).toBe('Direção: Descendo');
    expect(resumoDaConfiguracao(ex, { ...ex.defaults, direcao: 'desce' }, ctx('en'))).toBe('Direction: Descending');
  });

  it('lista de opções vira lista de rótulos', () => {
    const ex = item('ouvido-escala');
    const r = resumoDaConfiguracao(ex, { ...ex.defaults, tipos: ['dorico', 'lidio'] }, ctx('pt'));
    expect(r).toBe('Escalas: Dórico, Lídio');
  });

  it('o que mudou vem separado por ponto médio', () => {
    const ex = item('ouvido-escala');
    const r = resumoDaConfiguracao(ex, { tipos: ['maior'], direcao: 'ambos' }, ctx('pt'));
    expect(r).toContain(' · ');
    expect(r).toContain('Escalas: Maior (jônio)');
    expect(r).toContain('Direção: Subindo e descendo');
  });

  it('configuração com o mesmo conteúdo do padrão não conta como mudança, mesmo sendo outro array', () => {
    const ex = item('ouvido-escala');
    expect(resumoDaConfiguracao(ex, { tipos: [...(ex.defaults.tipos as string[])] }, ctx())).toBe('');
  });

  it('toggle ligado mostra só o rótulo', () => {
    const ex = item('que-nota-e-essa');
    const rotulo = ex.settings(ctx('pt')).find(s => s.id === 'acidentes')!.label;
    expect(resumoDaConfiguracao(ex, { ...ex.defaults, acidentes: true }, ctx('pt'))).toBe(rotulo);
  });

  it('chave desconhecida é ignorada, não quebra', () => {
    const ex = item('ouvido-escala');
    expect(resumoDaConfiguracao(ex, { inexistente: 1 }, ctx())).toBe('');
  });
});

describe('resumoDaPratica', () => {
  const c = (locale: Locale = 'pt') => ({ t: ctx(locale).t, naming: locale });

  it('escreve a tonalidade, a região e o material que foram ESCOLHIDOS', () => {
    expect(resumoDaPratica({ key: { tonic: 5, mode: 'maior' }, range: { lo: 48, hi: 72 }, material: 'diatonico' }, c('pt')))
      .toBe('Fá maior · Média · Só a tonalidade');
  });

  it('grafa a tonalidade pela convenção: Si♭ maior, nunca Lá♯ maior', () => {
    expect(resumoDaPratica({ key: { tonic: 10, mode: 'maior' } }, c('pt'))).toBe('Si♭ maior');
    expect(resumoDaPratica({ key: { tonic: 10, mode: 'menor' } }, c('en'))).toContain('B♭');
  });

  // "Livre" é o padrão e não precisa de legenda: só escreve o que foi escolhido.
  it('livre, cromático e sem escolha não escrevem nada', () => {
    expect(resumoDaPratica({}, c())).toBe('');
    expect(resumoDaPratica(undefined, c())).toBe('');
    expect(resumoDaPratica({ key: null, material: 'cromatico' }, c())).toBe('');
  });

  it('uma região fora da lista nomeada não inventa nome', () => {
    expect(resumoDaPratica({ range: { lo: 50, hi: 55 } }, c())).toBe('');
  });

  it('duas etapas em tonalidades diferentes ficam distinguíveis — é o motivo de existir', () => {
    expect(resumoDaPratica({ key: { tonic: 0, mode: 'maior' } }, c())).not.toBe(resumoDaPratica({ key: { tonic: 7, mode: 'maior' } }, c()));
  });
});

describe('resumoDaEtapa', () => {
  const porId = (id: string) => EXERCISES.find(e => e.id === id);
  const inst = (itemId: string, params?: Record<string, unknown>) => ({ itemId, settings: {}, ...(params ? { params } : {}) });

  it('com uma instância, mostra a tonalidade e a configuração dela', () => {
    const r = resumoDaEtapa([inst('ouvido-escala', { key: { tonic: 5, mode: 'maior' } })], porId, ctx('pt'));
    expect(r.titulo).toBe('Escalas de ouvido');
    expect(r.detalhe).toBe('Fá maior');
    expect(r.variantes).toBe(1);
  });

  // A mentira que isto evita: mostrar "Fá maior" numa etapa que rodizia entre Fá, Sol e Dó estaria
  // errado em duas de três execuções. Era o que o Praticar fazia antes do editor.
  it('com rodízio, NÃO mostra a tonalidade de nenhuma variante — diz quantas são', () => {
    const r = resumoDaEtapa([
      inst('ouvido-escala', { key: { tonic: 5, mode: 'maior' } }),
      inst('ouvido-escala', { key: { tonic: 7, mode: 'maior' } }),
      inst('ouvido-escala', { key: { tonic: 0, mode: 'maior' } }),
    ], porId, ctx('pt'));
    expect(r.detalhe).toBe('3 variantes');
    expect(r.detalhe).not.toContain('Fá');
    expect(r.variantes).toBe(3);
  });

  it('distingue variantes do mesmo item de itens diferentes', () => {
    const mesmas = resumoDaEtapa([inst('ouvido-escala'), inst('ouvido-escala')], porId, ctx('pt'));
    const outros = resumoDaEtapa([inst('ouvido-escala'), inst('ouvido-intervalo')], porId, ctx('pt'));
    expect(mesmas.detalhe).toBe('2 variantes');
    expect(outros.detalhe).toBe('2 itens');
  });

  it('nos dois idiomas', () => {
    expect(resumoDaEtapa([inst('ouvido-escala'), inst('ouvido-escala')], porId, ctx('en')).detalhe).toBe('2 variants');
  });

  it('item que sumiu do catálogo não quebra', () => {
    expect(() => resumoDaEtapa([inst('fantasma')], porId, ctx())).not.toThrow();
    expect(resumoDaEtapa([inst('fantasma')], porId, ctx()).titulo).toBe('fantasma');
  });
});
