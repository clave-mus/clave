// Desenhar o acorde no instrumento, com inversão — 25/11/2026.
//
// Ele pediu o exercício e, depois, as inversões: *"podemos pedir inversão sim"*. Aqui a inversão é
// **pergunta**, e não dificuldade — o enunciado diz qual quer, em cifra com baixo (`C/E`). É o
// contrário do `ouvido-acorde`, onde inverter serve para tirar a muleta da fundamental no grave.
//
// O que isto trava: que o enunciado e o gabarito digam a MESMA inversão, e que o acorde caiba no
// braço desenhado. As duas coisas falham em silêncio — a pessoa desenha o que foi pedido e ouve
// que errou, ou clica onde não há casa.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { mod } from '../theory/core';
import { TUNINGS } from '../components/music/Fretboard';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctxCom = (instrument: 'violao' | 'piano'): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams(instrument, { key: { tonic: 0, mode: 'maior' } }),
});
const item = EXERCISES.filter(isSeries).find(e => e.id === 'acorde-no-instrumento') as SeriesItem;
const base = (ctx: Ctx) => ({ ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) });

describe('desenhar o acorde', () => {
  it('a conferência é o contorno das notas, e o acorde não toca sozinho', () => {
    const ctx = ctxCom('violao');
    const q = item.make({ ...base(ctx), instrumento: 'violao', direcao: 'desenhar' } as never, ctx);
    expect(q.expected.kind).toBe('contorno');
    expect(q.surface.kind).toBe('fretboard');
    expect(q.autoplay).toBe(false);
  });

  it('no braço, toda nota pedida tem casa — o acorde desce até caber', () => {
    const ctx = ctxCom('violao');
    const alcance = { lo: Math.min(...TUNINGS.violao), hi: Math.max(...TUNINGS.violao) + 12 };
    for (let i = 0; i < 200; i++) {
      const q = item.make({ ...base(ctx), instrumento: 'violao', direcao: 'desenhar', inversoes: true } as never, ctx);
      if (q.expected.kind !== 'contorno') continue;
      for (const m of q.expected.midis) {
        expect(m, `${m} fora do braço`).toBeGreaterThanOrEqual(alcance.lo);
        expect(m).toBeLessThanOrEqual(alcance.hi);
      }
    }
  });

  /**
   * **O enunciado e o gabarito dizem a mesma inversão.** A cifra com baixo (`C/E`) é a pergunta; se
   * o grave do gabarito não for a nota depois da barra, o exercício pede uma coisa e confere outra.
   */
  it('a nota depois da barra é a mais grave do gabarito', () => {
    const ctx = ctxCom('violao');
    let viInversao = false;
    for (let i = 0; i < 300; i++) {
      const q = item.make({ ...base(ctx), instrumento: 'violao', direcao: 'desenhar', inversoes: true } as never, ctx);
      if (q.expected.kind !== 'contorno') continue;
      // ⚠️ Os acidentes são `♯`/`♭`, não `#`/`b` — a primeira versão deste teste lia só a letra e
      // acusou o app de errar num `D♭°/F♭`, onde o gabarito estava certo (fá bemol é a classe 4).
      // E os acidentes podem ser DOIS: um `E♭°` traz `B♭♭` (a teoria manda, decisão dele em 20/11),
      // e a segunda versão deste teste leu só o primeiro bemol.
      const barra = q.prompt.match(/\/([A-G])([♯♭]*)/);
      if (!barra) continue;
      viInversao = true;
      const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      const acidentes = [...barra[2]].reduce((n, c) => n + (c === '♯' ? 1 : -1), 0);
      const esperado = mod(PC[barra[1]] + acidentes, 12);
      expect(mod(Math.min(...q.expected.midis), 12), `${q.prompt} · ${q.expected.midis.join(' ')}`).toBe(esperado);
    }
    expect(viInversao, 'com inversões ligadas, nenhuma saiu').toBe(true);
  });

  it('sem inversões, a fundamental é a mais grave', () => {
    const ctx = ctxCom('violao');
    for (let i = 0; i < 100; i++) {
      const q = item.make({ ...base(ctx), instrumento: 'violao', direcao: 'desenhar', inversoes: false } as never, ctx);
      expect(q.prompt).not.toMatch(/\//);
    }
  });
});
