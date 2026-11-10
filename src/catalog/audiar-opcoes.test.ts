// Audiação mais customizável (10/11/2026). O Paulo: "no audiar, quero que seja possivel escolher
// quantos graus serao gerados... e que o pedal note possa ser sempre o mesmo... tudo precisa ser
// mais customizavel."
//
// O item nasceu com os pools escritos no código, de propósito — "personalização tem limite"
// (revisão de 04/11, §1.3), com o Paulo ajustando depois de ver. Ele viu, e revisou a decisão.
import { describe, expect, it } from 'vitest';
import { ESCALAS_GRAUS, gerarEstimulo } from './items/audiar';
import type { Ctx } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { mod } from '../theory/core';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
/** Quantas notas a pessoa tem de audiar — os graus da célula são um grupo cada. */
const quantas = (e: ReturnType<typeof gerarEstimulo>) => e.alvo.length;

describe('quantos graus são gerados', () => {
  it.each([2, 3, 4, 5, 6])('tamanho %s gera esse tanto de notas', tamanho => {
    for (let i = 0; i < 40; i++) {
      expect(quantas(gerarEstimulo(['graus'], ctx, { tamanho })), String(tamanho)).toBe(tamanho);
    }
  });

  it('o tamanho é preso entre 2 e 6, e não quebra com valor absurdo', () => {
    expect(quantas(gerarEstimulo(['graus'], ctx, { tamanho: 0 }))).toBe(2);
    expect(quantas(gerarEstimulo(['graus'], ctx, { tamanho: 99 }))).toBe(6);
  });

  it('sem pedir nada, segue em quatro — o que era fixo no código', () => {
    for (let i = 0; i < 20; i++) expect(quantas(gerarEstimulo(['graus'], ctx))).toBe(4);
  });
});

describe('de que escalas os graus saem', () => {
  // Eram duas, escritas no código. Agora são sete, e quem escolhe é quem usa.
  it('a lista tem mais que as duas de antes, e inclui as duas', () => {
    expect(ESCALAS_GRAUS.length).toBeGreaterThan(2);
    expect(ESCALAS_GRAUS).toContain('maior');
    expect(ESCALAS_GRAUS).toContain('menor');
  });

  // A prova de que a escolha manda: pedindo só a pentatônica menor, nenhum grau pode ser a segunda
  // nem a sexta — elas não existem nela.
  it('pedindo só a pentatônica menor, só saem graus dela', () => {
    const dela = new Set(['1', '♭3', '4', '5', '♭7', '8']);
    for (let i = 0; i < 60; i++) {
      const e = gerarEstimulo(['graus'], ctx, { escalas: ['penta-menor'], tamanho: 4 });
      for (const g of e.reveal.split(' ')) expect(dela.has(g), `${e.reveal}: ${g}`).toBe(true);
    }
  });

  it('escala que não existe é ignorada, e cai nas de sempre em vez de quebrar', () => {
    for (let i = 0; i < 20; i++) {
      expect(quantas(gerarEstimulo(['graus'], ctx, { escalas: ['inventada'], tamanho: 3 }))).toBe(3);
    }
  });
});

describe('o pedal sempre o mesmo', () => {
  // Sem tônica pedida, cada rodada sorteia a sua: é o comportamento de antes, bom para
  // relatividade e ruim para quem quer internalizar um centro só.
  it('sem fixar, a referência passeia ao longo das rodadas', () => {
    const vistas = new Set<number>();
    for (let i = 0; i < 120; i++) vistas.add(gerarEstimulo(['graus'], ctx).referencia[0]);
    expect(vistas.size).toBeGreaterThan(1);
  });

  it('fixando, a referência é exatamente a pedida, em todo estímulo', () => {
    for (const tipo of [['graus'], ['referencia'], ['graus', 'referencia']]) {
      for (let i = 0; i < 40; i++) {
        expect(gerarEstimulo(tipo, ctx, { tonica: 57 }).referencia[0], tipo.join('+')).toBe(57);
      }
    }
  });

  // E o conteúdo continua variando: fixar o pedal não congela o exercício.
  it('com o pedal fixo, o que se audia ainda muda', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 60; i++) vistos.add(gerarEstimulo(['graus'], ctx, { tonica: 57, tamanho: 4 }).reveal);
    expect(vistos.size).toBeGreaterThan(5);
  });

  it('a tônica fixa é a nota que soa, não uma classe de altura solta', () => {
    const e = gerarEstimulo(['graus'], ctx, { tonica: 60 });
    expect(mod(e.referencia[0], 12)).toBe(0);
    expect(e.referencia[0]).toBe(60);
  });
});
