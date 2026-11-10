// A frase de "Relações entre melodia e harmonia". Os dois exemplos do Paulo viram frase inteira.
import { describe, expect, it } from 'vitest';
import { descreverRelacao } from './relacao-texto';
import { resolveParams } from './params';
import type { Ctx } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';
import { analisar, notasCromaticas, reduzir, vozear } from '../theory/nota-sobre-acorde';
import { buildScale, harmonicField, note, type ModoDoCampo } from '../theory/core';
import { intervalName, intervalShort } from '../theory/names';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const en: Ctx = { ...ctx, naming: 'en', conv: 'en', t: (k, v) => translate('en', k, v) };

const C = note(0, 0, 4);
const campo = harmonicField(C, 'maior');
const frase = (grau: number, mel = C, o: { reduzido?: boolean; ctx?: Ctx } = {}) => {
  const d = campo[grau - 1];
  const v = vozear(d.root, d.chord, mel);
  const c = o.ctx ?? ctx;
  return descreverRelacao(analisar(v.acorde, v.melodia, d.chord), { melodia: v.melodia, simbolo: d.symbol, ctx: c, reduzido: o.reduzido });
};

describe('os exemplos do Paulo, como frase', () => {
  it('Dó sobre Dó maior: é a fundamental, e nada mais é dito', () => {
    expect(frase(1)).toBe('Dó é a fundamental de C.');
  });

  it('Dó sobre Mi menor: o intervalo, e o atrito com o Si', () => {
    expect(frase(3)).toBe('Dó é a 6ª menor de Em. Fica a um semitom de Si, a quinta do acorde — pode gerar tensão.');
  });
});

describe('reduzido é o padrão, e o composto é opção', () => {
  it('Dó sobre Sol: 4ª por padrão, 11ª quando se pede o que soa', () => {
    expect(frase(5)).toContain('4ª justa');
    expect(frase(5, C, { reduzido: false })).toContain('11ª justa');
  });

  it('a redução não mexe na qualidade: Si sobre Fá continua aumentada', () => {
    expect(frase(4, note(6, 0, 4))).toContain('4ª aumentada');
    expect(frase(4, note(6, 0, 4), { reduzido: false })).toContain('11ª aumentada');
  });
});

describe('reduzir', () => {
  it('9ª vira 2ª, 11ª vira 4ª, 13ª vira 6ª', () => {
    expect(reduzir({ num: 9, semis: 14 })).toEqual({ num: 2, semis: 2 });
    expect(reduzir({ num: 11, semis: 17 })).toEqual({ num: 4, semis: 5 });
    expect(reduzir({ num: 13, semis: 21 })).toEqual({ num: 6, semis: 9 });
  });

  it('a oitava NÃO vira uníssono — ela descreve algo que o uníssono não descreveria', () => {
    expect(reduzir({ num: 8, semis: 12 })).toEqual({ num: 8, semis: 12 });
    expect(reduzir({ num: 15, semis: 24 })).toEqual({ num: 8, semis: 12 });
  });

  it('o que já cabe na oitava passa intacto', () => {
    expect(reduzir({ num: 6, semis: 8 })).toEqual({ num: 6, semis: 8 });
  });

  // Bug pego clicando na tela: Lá♭ sobre Lá menor dá oitava DIMINUTA (8ª, 11 semitons), e a versão
  // por resto virava "uníssono de 11 semitons" — a célula mostrava `1?`. Não existe 7ª entre dois Lá.
  it('a oitava diminuta continua oitava, e não vira uníssono nem sétima', () => {
    expect(reduzir({ num: 8, semis: 11 })).toEqual({ num: 8, semis: 11 });
  });

  it('nenhuma redução produz qualidade desconhecida, em nenhuma combinação dos quatro campos', () => {
    for (const modo of ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as ModoDoCampo[]) {
      for (const d of harmonicField(C, modo)) {
        for (const g of notasCromaticas(C, modo)) {
          const v = vozear(d.root, d.chord, g.nota);
          const r = analisar(v.acorde, v.melodia, d.chord);
          for (const iv of [r.intervalo, reduzir(r.intervalo)]) {
            expect(intervalShort(iv, 'pt'), `${modo} ${d.symbol} / ${g.label}`).not.toContain('?');
            expect(intervalName(iv, 'pt')).not.toContain('undefined');
          }
        }
      }
    }
  });
});

describe('"pode gerar tensão" só aparece onde há semitom', () => {
  const MODOS: ModoDoCampo[] = ['maior', 'menor', 'menor-harmonica', 'menor-melodica'];

  it('nunca é dito sem atrito, e sempre é dito com atrito', () => {
    for (const modo of MODOS) {
      for (const d of harmonicField(C, modo)) {
        for (const mel of buildScale(C, modo)) {
          const v = vozear(d.root, d.chord, mel);
          const r = analisar(v.acorde, v.melodia, d.chord);
          const f = descreverRelacao(r, { melodia: v.melodia, simbolo: d.symbol, ctx });
          expect(f.includes('pode gerar tensão'), `${modo} ${d.symbol}`).toBe(r.atritos.length > 0);
        }
      }
    }
  });

  it('nenhuma frase carrega outro juízo além desse', () => {
    const proibidas = ['bonito', 'feio', 'estável', 'instável', 'errado', 'evite', 'soa bem', 'soa mal'];
    for (const modo of MODOS) {
      for (const d of harmonicField(C, modo)) {
        for (const mel of buildScale(C, modo)) {
          const v = vozear(d.root, d.chord, mel);
          const f = descreverRelacao(analisar(v.acorde, v.melodia, d.chord), { melodia: v.melodia, simbolo: d.symbol, ctx });
          for (const p of proibidas) expect(f.toLowerCase()).not.toContain(p);
        }
      }
    }
  });

  it('toda combinação produz frase não vazia, nos quatro campos e nos dois idiomas', () => {
    for (const modo of MODOS) {
      for (const d of harmonicField(C, modo)) {
        for (const mel of buildScale(C, modo)) {
          for (const c of [ctx, en]) {
            const v = vozear(d.root, d.chord, mel);
            const f = descreverRelacao(analisar(v.acorde, v.melodia, d.chord), { melodia: v.melodia, simbolo: d.symbol, ctx: c });
            expect(f.length, `${modo} ${d.symbol}`).toBeGreaterThan(10);
            expect(f, 'nenhum campo ficou por preencher').not.toContain('{');
          }
        }
      }
    }
  });
});
