// O acorde no braço passa a vir do GERADOR (09/11/2026).
//
// O Paulo: "é legal que o 'que acorde é esse' no violão tenha como padrão os barre chords e que ele
// gere voicings diversos, extensões, inversões, etc. que não seja só os 'gavetões'."
//
// O motor para isso já estava no repositório e ninguém usava: `theory/digitacoes.ts`, o algoritmo
// que ele doou (`M5`), com 22 testes. Havia DOIS jeitos de achar um acorde no braço, e motor
// duplicado é proibido — as 16 formas abertas e as 10 fórmulas de pestana escritas à mão saíram.
import { describe, expect, it } from 'vitest';
import { guitarChordQuestion, TUNINGS } from './helpers';
import type { Ctx } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', {}),
};
const base = { superficie: 'braco', tipos: ['maior', 'menor', '7', 'm7', '7M'], soltas: false, casas: '0-12', pergunta: 'acorde' };
const perguntar = (over: Record<string, unknown> = {}) => guitarChordQuestion({ ...base, ...over } as never, ctx);

describe('variedade, que era o pedido', () => {
  // As tabelas à mão davam 26 formas no total. O gerador deu 60 distintas em 60 sorteios.
  it('não repete forma: dezenas de voicings distintos', () => {
    const formas = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const q = perguntar();
      if (q.visual.kind !== 'fretboard') throw new Error('esperava braço');
      formas.add(q.visual.marks.map(m => `${m.s}:${m.f}`).join(' '));
    }
    expect(formas.size).toBeGreaterThan(30);
  });

  it('sai tríade e tétrade, conforme a qualidade', () => {
    const tamanhos = new Set<number>();
    for (let i = 0; i < 60; i++) tamanhos.add(perguntar().sound!.groups[0].length);
    expect([...tamanhos].sort()).toEqual([3, 4]);
  });
});

describe('formas móveis por padrão', () => {
  // Um gavetão aberto é uma forma numa posição fixa; sem cordas soltas a forma é relativa e move
  // pelo braço. É a que transfere, e é por isso que é o padrão.
  it('sem cordas soltas, nenhuma casa é zero', () => {
    for (let i = 0; i < 80; i++) {
      const q = perguntar();
      if (q.visual.kind !== 'fretboard') throw new Error('esperava braço');
      for (const m of q.visual.marks) expect(m.f, JSON.stringify(q.visual.marks)).toBeGreaterThan(0);
    }
  });

  it('permitindo cordas soltas, elas aparecem', () => {
    let achou = false;
    for (let i = 0; i < 200 && !achou; i++) {
      const q = perguntar({ soltas: true });
      if (q.visual.kind === 'fretboard') achou = q.visual.marks.some(m => m.f === 0);
    }
    expect(achou).toBe(true);
  });
});

describe('a pergunta "qual nota está no baixo"', () => {
  // Fixar o acorde para focar no desenho MUDA a pergunta: se é sempre dó maior, "que acorde é esse"
  // tem uma resposta só. Então a pergunta vira qual grau está no baixo — reconhecer o desenho.
  it('as quatro posições aparecem: fundamental, terça, quinta e sétima', () => {
    const graus = new Set<string>();
    for (let i = 0; i < 120; i++) {
      const q = perguntar({ pergunta: 'baixo' });
      if (q.expected.kind !== 'option') throw new Error('esperava opção');
      graus.add(q.expected.id);
    }
    expect([...graus].sort()).toEqual(['1', '3', '5', '7']);
  });

  // A conta do Paulo: tríade dá três alternativas, tétrade dá quatro.
  it('tríade dá três alternativas, tétrade dá quatro', () => {
    const porTamanho = new Map<number, Set<number>>();
    for (let i = 0; i < 120; i++) {
      const q = perguntar({ pergunta: 'baixo' });
      if (q.surface.kind !== 'choices') throw new Error('esperava escolhas');
      const n = q.sound!.groups[0].length;
      (porTamanho.get(n) ?? porTamanho.set(n, new Set()).get(n)!).add(q.surface.options.length);
    }
    expect([...(porTamanho.get(3) ?? [])]).toEqual([3]);
    expect([...(porTamanho.get(4) ?? [])]).toEqual([4]);
  });

  // Com a pergunta pelo baixo a fundamental é FIXA — a da tonalidade em vigor, dó quando livre.
  // Se variasse, a pessoa estaria respondendo duas perguntas ao mesmo tempo.
  it('a fundamental é a da tonalidade, e não muda entre rodadas', () => {
    const cifras = new Set<string>();
    for (let i = 0; i < 40; i++) cifras.add(perguntar({ pergunta: 'baixo' }).prompt);
    expect(cifras.size).toBeLessThanOrEqual(5); // varia a qualidade, nunca a fundamental
    for (const p of cifras) expect(p).toContain('C');
  });
});

it('toda nota que soa está numa casa desenhada, e em corda não abafada', () => {
  for (let i = 0; i < 60; i++) {
    const q = perguntar();
    if (q.visual.kind !== 'fretboard') throw new Error('esperava braço');
    const doDesenho = q.visual.marks.map(m => TUNINGS.violao[m.s] + m.f).sort((a, b) => a - b);
    expect(q.sound!.groups[0].slice().sort((a, b) => a - b)).toEqual(doDesenho);
    for (const m of q.visual.marks) expect(q.visual.muted ?? []).not.toContain(m.s);
  }
});
