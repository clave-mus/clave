// Extensões, alterações e voicings no `ouvido-campo` — 19/11/2026.
//
// O Paulo: *"quero que no exercício de adivinhar acorde do campo harmônico, tenha a opção de
// adicionar inversões e extensões/voicings diatônicas (ou não diatônicos, como #9 em dominante e
// afins) pros acordes"*. Inversões já existiam; o resto é desta data.
//
// A invariante que mais importa aqui é musical: **a alteração só cai onde ela existe**. Ninguém a
// escreveu como regra — ela sai de `comMesmoNucleo`, e este arquivo a mede.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { enfeitesDe } from './enfeites';
import { CHORDS, type ChordId } from '../theory/core';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 0, mode: 'maior' } }),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-campo') as SeriesItem;
const base = { ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) };
const faz = (extra: Record<string, unknown>) => item.make({ ...base, ...extra } as never, ctx);
const cifras = (extra: Record<string, unknown>, n = 300) => {
  const vistas = new Set<string>();
  for (let i = 0; i < n; i++) vistas.add(faz(extra).reveal);
  return [...vistas];
};

describe('o acorde do grau vem vestido', () => {
  it('desligado, o V é sempre um V7 seco', () => {
    expect(cifras({ graus: ['5'] })).toEqual(['V7']);
  });

  it('com extensões, só as diatônicas; com alterações, o vocabulário alterado', () => {
    const ext = cifras({ graus: ['5'], enfeites: 'extensoes' }).sort();
    expect(ext).toContain('V7 · G7');
    expect(ext.some(c => c.includes('(9)'))).toBe(true);
    expect(ext.some(c => c.includes('♯9') || c.includes('♭9')), ext.join(' ')).toBe(false);
    const alt = cifras({ graus: ['5'], enfeites: 'alterados' }).sort();
    for (const esperada of ['♭9', '♯9', '♯11', '♭13']) {
      expect(alt.some(c => c.includes(esperada)), `${esperada} em ${alt.join(' ')}`).toBe(true);
    }
  });

  /**
   * **A regra musical que ninguém escreveu**: as alterações são todas de dominante, então o motor
   * não tem como pendurá-las num ii ou num IV — o núcleo delas não bate. É o `comMesmoNucleo`
   * fazendo o trabalho, e é isto que impede um `Dm7(♯9)` de aparecer no campo.
   */
  it('alteração só em dominante — e isso vale para os sete graus', () => {
    for (let grau = 1; grau <= 7; grau++) {
      for (const c of cifras({ graus: [String(grau)], enfeites: 'alterados' }, 200)) {
        if (!/♯9|♭9|♭13/.test(c)) continue;
        expect(c, `grau ${grau} recebeu alteração sem ser dominante: ${c}`).toMatch(/V7|VII7|II7|III7|VI7|IV7|I7/);
        // a cifra de dominante não tem "m" antes do 7 nem "7M"
        expect(c.includes('m7') || c.includes('7M'), c).toBe(false);
      }
    }
  });

  it('a lista de enfeites de cada qualidade é a que o núcleo permite', () => {
    const famTodas = ['extensoes', 'alterados'];
    // o dominante é quem recebe as alterações
    expect(enfeitesDe('7', famTodas).length).toBeGreaterThanOrEqual(6);
    // o menor com sétima recebe só extensões diatônicas
    expect(enfeitesDe('m7', famTodas).every(id => !/b9|#9|b13/.test(id))).toBe(true);
    // tríade não recebe nada: é por isso que o seletor some sem tétrades
    for (const t of ['maior', 'menor', 'dim', 'aum'] as ChordId[]) expect(enfeitesDe(t, famTodas), t).toEqual([]);
  });

  it('sem tétrades, o seletor some e nada é vestido', () => {
    const quando = item.settings(ctx).find(s => s.id === 'enfeites')!.quando!;
    expect(quando({ ...base, tetrades: false } as never)).toBe(false);
    expect(quando({ ...base, tetrades: true } as never)).toBe(true);
    expect(cifras({ tetrades: false, enfeites: 'alterados', graus: ['5'] })).toEqual(['V']);
  });
});

describe('o que o enfeite NÃO muda', () => {
  it('o gabarito e os botões continuam sendo o grau', () => {
    for (let i = 0; i < 50; i++) {
      const q = faz({ enfeites: 'alterados', graus: ['5'] });
      expect(q.expected).toEqual({ kind: 'option', id: 'V7' });
      expect((q.surface as { options: { id: string }[] }).options.map(o => o.id)).toEqual(['V7']);
    }
  });

  /**
   * A cadência firma o centro **antes** da pergunta; vesti-la embaralharia a referência. O alvo
   * pode ter cinco notas (um 7♯9 tem), o contexto nunca passa de quatro.
   */
  it('o contexto fica seco', () => {
    for (let i = 0; i < 60; i++) {
      const g = faz({ enfeites: 'alterados' }).sound!.groups;
      for (const acorde of g.slice(0, -1)) expect(acorde.length).toBeLessThanOrEqual(4);
    }
  });
});

describe('o voicing de piano', () => {
  const sons = (extra: Record<string, unknown>) => {
    const vistos = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const g = faz(extra).sound!.groups;
      vistos.add(g[g.length - 1].join(','));
    }
    return vistos.size;
  };

  it('multiplica o som do mesmo acorde', () => {
    expect(sons({ graus: ['5'], voicing: 'fechado' })).toBe(1);
    expect(sons({ graus: ['5'], voicing: 'piano' })).toBeGreaterThanOrEqual(15);
  });

  it('e nenhum acorde sai mudo, em nenhuma combinação', () => {
    for (const enfeites of ['nenhum', 'extensoes', 'alterados']) {
      for (const voicing of ['fechado', 'piano']) {
        for (let i = 0; i < 60; i++) {
          const g = faz({ enfeites, voicing }).sound!.groups;
          expect(g[g.length - 1].length, `${enfeites}/${voicing}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('as inversões somem da tela com ele ligado, e ele some audiando', () => {
    const quando = (id: string, s: Record<string, unknown>) =>
      item.settings(ctx).find(x => x.id === id)!.quando?.({ ...base, ...s } as never) ?? true;
    expect(quando('inversoes', { voicing: 'piano' })).toBe(false);
    expect(quando('inversoes', { voicing: 'fechado' })).toBe(true);
    expect(quando('voicing', { estimulo: 'escrito' })).toBe(false);
    // audiando, as inversões voltam a valer, porque o voicing não se aplica
    expect(quando('inversoes', { estimulo: 'escrito', voicing: 'piano' })).toBe(true);
  });
});

describe('audiando', () => {
  /**
   * Pedir "audie o V7" e tocar um V7(♯9) de gabarito seria pedir uma coisa e conferir outra — por
   * isso o enunciado nomeia o acorde vestido.
   */
  it('o enunciado diz a cifra que se vai audiar', () => {
    for (let i = 0; i < 40; i++) {
      const q = faz({ estimulo: 'escrito', enfeites: 'alterados', graus: ['5'] });
      expect(q.prompt).toContain(q.reveal);
    }
  });
});

describe('o atalho dos dominantes alterados', () => {
  it('existe, não cai no guarda, e produz alteração', () => {
    const atalho = item.presets!.find(p => p.id === 'maior-alterados')!;
    expect(atalho.settings).toMatchObject({ enfeites: 'alterados', tetrades: true });
    expect(item.problema?.({ ...base, ...atalho.settings } as never, ctx) ?? null).toBeNull();
    const vistas = new Set<string>();
    for (let i = 0; i < 400; i++) vistas.add(item.make({ ...base, ...atalho.settings } as never, ctx).reveal);
    expect([...vistas].some(c => /♯9|♭9|♭13/.test(c)), [...vistas].join(' ')).toBe(true);
  });
});

// O núcleo é o que define a identidade: se um dia alguém puser um enfeite com núcleo diferente na
// lista, o acorde do grau deixa de ser aquele grau — e aí o gabarito mente.
describe('o enfeite não troca o acorde', () => {
  it('todo enfeite tem o mesmo núcleo da base', () => {
    const nucleo = (id: ChordId) => CHORDS[id].degs.filter(([n]) => n <= 7).map(([n, s]) => `${n}:${s}`).join(',');
    for (const base2 of ['7', '7M', 'm7', 'm7b5'] as ChordId[]) {
      for (const e of enfeitesDe(base2, ['extensoes', 'alterados'])) {
        expect(nucleo(e), `${e} não tem o núcleo de ${base2}`).toBe(nucleo(base2));
      }
    }
  });
});
