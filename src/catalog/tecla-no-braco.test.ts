// **O braço de "Qual nota tocou?"** — a rodada de 26/11, do relato dele: *"versão braço do baixo,
// poderia ter um modo foco também... e poder restringir pra uma região menor do braço. atualmente
// está ruim de usar no celular, tem que dar um zoom pra conseguir clicar certo na nota."*
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { TUNINGS, casasDaAltura } from './helpers';

const ctx = (instrument: 'baixo' | 'violao' = 'baixo'): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams(instrument, { key: { tonic: 0, mode: 'maior' } }),
});
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-tecla') as SeriesItem;
const perguntas = (s: Record<string, unknown>, c = ctx(), n = 120) => {
  const base = { ...item.defaults, ...(item.defaultsDo?.(c) ?? {}) };
  return Array.from({ length: n }, () => item.make({ ...base, ...s } as never, c));
};

describe('a janela de casas vale para tudo', () => {
  // ⚠️ O braço **desenha** 5 a 9, e a nota cai de 6 a 9: a casa inicial de uma janela que não começa
  // no zero aparece sem receber toque (convenção de `casaPermitida`, repetida pelo `Fretboard`).
  // Medido na tela em 26/11 — com a casa 5 valendo, a nota podia cair onde não há onde clicar.
  it.each([['0-5', 0, 5, 0], ['5-9', 5, 9, 6], ['0-12', 0, 12, 0]])('%s: a nota sorteada existe nela', (casas, de, ate, tocavel) => {
    for (const q of perguntas({ onde: 'baixo', casas })) {
      const sf = q.surface;
      expect(sf.kind).toBe('fretboard');
      if (sf.kind !== 'fretboard') return;
      // O desenho é a janela pedida...
      expect([sf.from, sf.to]).toEqual([de, ate]);
      // ...e a nota que soou tem casa dentro dela. Sem isto o braço curto faria perguntas de fora.
      const m = q.expected.kind === 'pitch' ? q.expected.midi : null;
      expect(m, 'a resposta deixou de ser uma altura').not.toBeNull();
      expect(casasDaAltura(TUNINGS.baixo, m!, tocavel as number, ate).length, `${m} fora das casas ${casas}`).toBeGreaterThan(0);
    }
  });

  /**
   * ⚠️ **Sem a chave, vale o braço todo** — o padrão declarado em `defaults`, e não o de `fretRange`,
   * que cai em 0–5. O teste da oitava da referência pegou a diferença no dia em que a janela entrou:
   * ele chama o seletor com `{ onde }` e mais nada.
   */
  it('sem casas escolhidas, o braço é inteiro', () => {
    const sf = perguntas({ onde: 'baixo', casas: undefined }, ctx(), 1)[0].surface;
    if (sf.kind !== 'fretboard') throw new Error('a superfície deixou de ser braço');
    expect([sf.from, sf.to]).toEqual([0, 12]);
  });

  /**
   * **A referência também cai dentro da janela** — ela é marca na tela, e o item já aprendeu isso em
   * 13/11: *"referência que não se vê não é referência"*.
   */
  it('a referência tem casa na janela', () => {
    for (const q of perguntas({ onde: 'baixo', casas: '0-5', referencia: true })) {
      const sf = q.surface;
      if (sf.kind !== 'fretboard' || !sf.apoio) throw new Error('sem apoio desenhado');
      for (const m of sf.apoio.midis) expect(casasDaAltura(TUNINGS.baixo, m, 0, 5).length).toBeGreaterThan(0);
    }
  });
});

describe('janela que não dá pergunta', () => {
  /**
   * Visto na tela em 26/11: "tônica e quinta" com as casas 5–9 de um baixo deixa **só o dó2** —
   * o exercício perguntava a mesma nota para sempre. Degenerado, não impossível; a decisão 13 manda
   * explicar do mesmo jeito.
   */
  it('com uma nota só, o item recusa e explica', () => {
    const c = ctx();
    const s = { ...item.defaults, onde: 'baixo', casas: '5-9', grausEscolhidos: ['0', '7'] };
    expect(item.problema?.(s as never, c)).toBe(c.t('player.poucasNotas'));
    // Com o braço todo as duas notas existem, e a pergunta volta a ser pergunta.
    expect(item.problema?.({ ...s, casas: '0-12' } as never, c)).toBeNull();
  });
});

describe('o braço é para o dedo', () => {
  it('declara alto e foco nos dois braços', () => {
    for (const onde of ['baixo', 'violao'] as const) {
      const sf = perguntas({ onde }, ctx(onde), 1)[0].surface;
      if (sf.kind !== 'fretboard') throw new Error('a superfície deixou de ser braço');
      expect(sf.alto, `${onde}: cordas com espaçamento de dedo`).toBe(true);
      expect(sf.foco, `${onde}: a moldura sai no celular deitado`).toBe(true);
    }
  });

  /** ⚠️ Onde o braço é só o enunciado (audiar), nada disso vale: ali não se toca na tela. */
  it('audiando, o braço do enunciado não vira superfície', () => {
    const q = perguntas({ onde: 'baixo', estimulo: 'escrito', casas: '5-9' }, ctx(), 1)[0];
    expect(q.surface.kind).toBe('autoavaliacao');
    if (q.visual.kind !== 'fretboard') throw new Error('o enunciado deixou de desenhar o braço');
    expect([q.visual.from, q.visual.to]).toEqual([5, 9]);
    // E as marcas do enunciado respeitam a janela: marca fora dela seria desenhada no vazio.
    for (const marca of q.visual.marks) expect(marca.f).toBeGreaterThanOrEqual(5);
  });
});
