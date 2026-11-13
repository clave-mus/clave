import { describe, expect, it } from 'vitest';
import { itemText, translate, type Locale, type MessageKey, type Vars } from '../i18n';
import { EXERCISES } from './catalog';
import { isSeries } from './types';
import { globalPresentation, resolveParams } from './params';
import { DEFAULT_PRESENTATION, resolvePresentation } from '../audio/presentation';
import { optionResponse, validate } from './validate';
import { AMBIENTES } from './index';
import type { Ctx } from './types';

const ctxFor = (locale: Locale): Ctx => ({
  naming: locale, conv: locale, t: (key: MessageKey, vars?: Vars) => translate(locale, key, vars), params: resolveParams('violao'),
});
// Letras acentuadas do português que não aparecem num texto em inglês.
const PT_CHARS = /[ãõçáéíóúâêô]/i;

describe('catálogo de exercícios', () => {
  for (const ex of EXERCISES.filter(isSeries)) {
    it(`${ex.id} gera perguntas válidas`, () => {
      for (const locale of ['pt', 'en'] as const) {
        const ctx = ctxFor(locale);
        for (let i = 0; i < 300; i++) {
          const q = ex.make(ex.defaults, ctx);
          expect(q.prompt).toBeTruthy();
          expect(q.reveal).toBeTruthy();
          const sf = q.surface, e = q.expected;
          if (sf.kind === 'choices') {
            const ids = sf.options.map(o => o.id);
            expect(new Set(ids).size).toBe(ids.length);
            expect(ids.length).toBeGreaterThan(1);
            // pela conferência musical, exatamente uma opção está certa (nenhuma equivalente a outra)
            expect(sf.options.filter(o => validate(e, optionResponse(o))).length).toBe(1);
          }
          // a superfície consegue produzir uma resposta que a conferência entende
          if (sf.kind === 'keyboard' || sf.kind === 'fretboard') expect(['pitch', 'pitchClass']).toContain(e.kind);
          if (sf.kind === 'sequence') expect(e.kind).toBe('option');
          if (sf.kind === 'autoavaliacao') expect(e.kind).toBe('option');
          if (sf.kind === 'letters' || sf.kind === 'staff') expect(['spelled', 'pitchClass']).toContain(e.kind);
          if (e.kind === 'spelled') expect(Math.abs(e.acc)).toBeLessThanOrEqual(1);
        }
      }
    });

    it(`${ex.id}: toda pergunta tem resposta certa que a superfície consegue dar`, () => {
      const ctx = ctxFor('pt');
      for (let i = 0; i < 200; i++) {
        const q = ex.make(ex.defaults, ctx);
        const sf = q.surface, e = q.expected;
        let can = false;
        if (sf.kind === 'choices') can = sf.options.some(o => validate(e, optionResponse(o)));
        // Autoavaliação não tem resposta a conferir: quem julga é a pessoa. O que o teste exige é
        // que o esperado seja a opção que a superfície de fato oferece ("consegui").
        else if (sf.kind === 'autoavaliacao') can = e.kind === 'option' && e.id === 'facil';
        // `sequence` monta a resposta com `comprimento` escolhas em ordem, entre as opções. Dá
        // para dar a certa se, e só se, cada pedaço dela estiver na paleta — e se o tamanho
        // combinar. Sem isto, uma paleta incompleta deixaria a pergunta sem resposta possível e
        // ninguém veria: a tela desenharia as casas e nenhuma combinação acertaria.
        else if (sf.kind === 'sequence') {
          const sep = sf.separador ?? ' ';
          const pedacos = e.kind === 'option' ? e.id.split(sep) : [];
          const paleta = new Set(sf.options.map(o => o.id));
          can = pedacos.length === sf.comprimento && pedacos.every(x => paleta.has(x));
        }
        else if (sf.kind === 'keyboard') can = Array.from({ length: sf.hi - sf.lo + 1 }, (_, k) => sf.lo + k).some(m => validate(e, { kind: 'pitch', midi: m }));
        else if (sf.kind === 'fretboard') {
          const strings = sf.onlyString !== undefined ? [sf.onlyString] : sf.tuning.map((_, k) => k);
          can = strings.some(st => Array.from({ length: sf.to - sf.from + 1 }, (_, k) => sf.from + k).some(f => validate(e, { kind: 'pitch', midi: sf.tuning[st] + f })));
        } else if (sf.kind === 'letters') can = [0, 1, 2, 3, 4, 5, 6].some(l => [-1, 0, 1].some(acc => validate(e, { kind: 'spelled', letter: l, acc })));
        else can = e.kind === 'spelled' && e.oct !== undefined; // pauta: a pessoa escolhe a linha, então a oitava vem na pergunta
        expect(can, `${ex.id}: ${q.prompt}`).toBe(true);
        if (q.sound) expect(q.sound.groups.some(g => g.length) || (q.sound.drums?.length ?? 0) > 0).toBe(true);
      }
    });

    it(`${ex.id} não deixa português escapar no inglês`, () => {
      const ctx = ctxFor('en');
      const texts = [itemText(ctx.t, ex.id, 'title'), itemText(ctx.t, ex.id, 'desc')];
      ex.settings(ctx).forEach(s => texts.push(s.label, ...(s.options ?? []).map(o => o.label)));
      for (let i = 0; i < 100; i++) {
        const q = ex.make(ex.defaults, ctx);
        const comRotulo = q.surface.kind === 'choices' || q.surface.kind === 'sequence' ? q.surface.options.map(o => o.label) : [];
        texts.push(q.prompt, q.reveal, ...comRotulo);
        if (q.visual.kind === 'ear' && q.visual.hint) texts.push(q.visual.hint);
      }
      expect(texts.filter(x => PT_CHARS.test(x))).toEqual([]);
    });
  }

  // O que o formato antigo embutia no som de cada exercício (gap, arp, timbre, andamento) tem que
  // continuar saindo igual depois da migração, só que agora pela apresentação.
  describe('o som sai como antes da migração', () => {
    const final = (id: string, over: Record<string, unknown> = {}, instrument: 'violao' | 'baixo' = 'violao') => {
      const ex = EXERCISES.filter(isSeries).find(e => e.id === id)!;
      const params = resolveParams(instrument);
      const ctx = { ...ctxFor('pt'), params };
      const values = { ...ex.defaults, ...over } as Record<string, never>;
      const q = ex.make(values, ctx);
      const fromSettings = ex.settings(ctx).reduce((acc, st) => (st.present && values[st.id] !== undefined ? { ...acc, ...st.present(values[st.id]) } : acc), {});
      return resolvePresentation([globalPresentation(params, q.sound?.instrument), ex.presentation, fromSettings]);
    };
    const base = { gap: 0.75, arp: 0, voice: 'piano', bpm: 84 };
    it.each([
      // `nota-na-pauta` soa no piano; `nota-no-instrumento` soa no INSTRUMENTO, e por padrão no do
      // perfil — é a diferença que a reorganização de 09/11/2026 trouxe, e é o esperado.
      ['nota-na-pauta', {}, { ...base }],
      ['nota-no-instrumento', {}, { ...base, voice: 'violao' }],
      ['nota-no-instrumento', { instrumento: 'piano' }, { ...base }],
      ['intervalo-na-pauta', {}, { ...base }],
      // o arpejo acompanha a SUPERFÍCIE: na pauta quase em bloco, no violão dedilhado, no teclado em bloco
      // Depois da reorganização, o arpejo acompanha o ITEM: a pauta arpeja quase em bloco e vem do
      // `presentation` do item; o braço dedilha e vem do gerador; o piano é em bloco.
      ['acorde-na-pauta', {}, { ...base, arp: 0.08 }],
      ['acorde-no-instrumento', { instrumento: 'piano' }, { ...base }],
      ['pauta-escala', {}, { ...base, gap: 0.32 }],
      ['ouvido-tecla', {}, { ...base, gap: 0.9 }],
      ['ouvido-intervalo', {}, { ...base }],
      ['ouvido-escala', {}, { ...base, gap: 0.3 }],
      ['ouvido-celulas', {}, { ...base, gap: 0.55 }],
      ['ouvido-acorde', {}, { ...base, gap: 0.45, chord: 'arpeggio-block' }],
      ['ouvido-acorde', { arpejo: false }, { ...base, gap: 0.45, chord: 'block' }],
      ['ritmo-ouvido', {}, { ...base, bpm: 84 }],
    ] as const)('%s %j', (id, over, expected) => {
      expect(final(id, over)).toMatchObject(expected);
    });
    it('no braço, o timbre vem do instrumento da pessoa (violão ou baixo)', () => {
      // `que-acorde-e-esse` fica fora: as formas de acorde no braço são de VIOLÃO, posições
      // reais, e não existem num baixo de quatro cordas.
      // Os de instrumento já nascem no braço: o instrumento é configuração, e `auto` é o do perfil.
      for (const id of ['nota-no-instrumento', 'intervalo-no-instrumento']) {
        expect(final(id, {}, 'violao').voice, id).toBe('violao');
        expect(final(id, {}, 'baixo').voice, id).toBe('baixo');
      }
    });
  });

  it('os parâmetros globais de som (volume e timbre) chegam a todo exercício com áudio, sem editar o catálogo', () => {
    // nenhum exercício pode sobrescrever o volume nem o timbre global; o timbre vem do instrumento do som
    const params = { ...resolveParams('baixo', { timbres: { piano: 'orgao', violao: 'pad', baixo: 'violao' } }), volume: 0.5 };
    const ctx = { ...ctxFor('pt'), params };
    for (const ex of EXERCISES.filter(isSeries)) {
      for (let i = 0; i < 20; i++) {
        const q = ex.make(ex.defaults, ctx);
        if (!q.sound) continue;
        const settingsLayer = ex.settings(ctx).reduce((acc, st) => (st.present ? { ...acc, ...st.present(ex.defaults[st.id]) } : acc), {});
        const pres = resolvePresentation([globalPresentation(params, q.sound.instrument), ex.presentation, settingsLayer]);
        expect(pres.volume, ex.id).toBe(0.5 * DEFAULT_PRESENTATION.volume);
        expect(pres.voice, ex.id).toBe(params.timbres[q.sound.instrument ?? 'piano']);
      }
    }
  });

  it('todo exercício e toda ferramenta têm título e descrição nos textos', () => {
    const t = ctxFor('pt').t;
    for (const { id } of [...EXERCISES, ...AMBIENTES]) {
      expect(itemText(t, id, 'title')).not.toMatch(/^(exercises|tools)\./);
      expect(itemText(t, id, 'desc')).not.toMatch(/^(exercises|tools)\./);
    }
  });
});

/**
 * `pauta-escala`: a tônica não pode entregar a resposta.
 *
 * Paulo, 12/11: *"é muito fácil saber a resposta só vendo qual é a nota inicial, pois as
 * alternativas têm isso no nome"*. Estava certo — e com um tipo só marcado (o padrão) a resposta era
 * a única alternativa com a tônica certa.
 */
describe('pauta-escala: a nota inicial não entrega a escala', () => {
  const item = EXERCISES.find(e => e.id === 'pauta-escala')!;

  // A primeira palavra do rótulo é a tônica ("Dó maior (jônio)" → "Dó").
  const tonicaDo = (label: string) => label.split(' ')[0];

  it.each([['um tipo só', ['maior']], ['dois tipos', ['maior', 'dorico']], ['todos', undefined]])(
    'com %s, todas as alternativas têm a mesma tônica', (_, tipos) => {
      const ctx = ctxFor('pt');
      const s = { ...item.defaults, ...(tipos ? { tipos } : {}) };
      for (let i = 0; i < 80; i++) {
        const q = item.make!(s, ctx);
        const opcoes = (q.surface as { kind: 'choices'; options: { label: string }[] }).options;
        const tonicas = new Set(opcoes.map(o => tonicaDo(o.label)));
        expect(tonicas.size, `rodada ${i}: ${[...tonicas].join(', ')}`).toBe(1);
        // E há de fato escolha a fazer: pelo menos quatro alternativas distintas.
        expect(new Set(opcoes.map(o => o.label)).size).toBeGreaterThanOrEqual(4);
      }
    },
  );
});
