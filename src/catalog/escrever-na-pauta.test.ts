// Escrever acorde e escala na pauta — 25/11/2026.
//
// A lacuna que a medição do catálogo mostrou: nota e intervalo tinham as duas direções na pauta
// (ler e escrever), acorde e escala só liam — enquanto do lado do instrumento as quatro famílias
// já escreviam. Isto trava o que a simetria promete.
//
// E trava uma coisa que falha calada: a pauta tem de ter onde pôr cada nota que a resposta pede.
// Um acorde escrito com a fundamental alta demais, ou uma escala que fecha na oitava acima do que
// a clave alcança, deixa a pessoa sem onde clicar.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 0, mode: 'maior' } }),
};
const item = (id: string) => EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
const base = (e: SeriesItem) => ({ ...e.defaults, ...(e.defaultsDo?.(ctx) ?? {}) });

describe('as quatro famílias escrevem na pauta', () => {
  it.each(['nota-na-pauta', 'intervalo-na-pauta', 'acorde-na-pauta', 'pauta-escala'])(
    '%s oferece a direção de escrever', id => {
      const d = item(id).settings(ctx).find(s => s.id === 'direcao');
      expect(d, `${id} não tem eixo de direção`).toBeTruthy();
      expect((d!.options ?? []).map(o => o.id)).toContain('escrever');
    });
});

describe('o acorde escrito', () => {
  const e = item('acorde-na-pauta');

  it('pede tantas notas quantas o acorde tem, e confere por contorno', () => {
    for (let i = 0; i < 60; i++) {
      const q = e.make({ ...base(e), direcao: 'escrever' } as never, ctx);
      expect(q.surface.kind).toBe('staff');
      if (q.expected.kind !== 'contorno') throw new Error('esperava contorno');
      expect('quantas' in q.surface && q.surface.quantas).toBe(q.expected.midis.length);
      // a cifra é o enunciado, e ela não some da revelação
      expect(q.prompt).toMatch(/[A-G]/);
      expect(q.reveal).toBeTruthy();
      // e o acorde não toca sozinho: ler a cifra é o exercício
      expect(q.autoplay).toBe(false);
    }
  });

  /** Invertido, a cifra leva o baixo — e o baixo da cifra é a nota mais grave do gabarito. */
  it('com inversão, a nota depois da barra é a mais grave', () => {
    const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    let viu = false;
    for (let i = 0; i < 200; i++) {
      const q = e.make({ ...base(e), direcao: 'escrever', inversoes: true } as never, ctx);
      const barra = q.prompt.match(/\/([A-G])([♯♭]*)/);
      if (!barra || q.expected.kind !== 'contorno') continue;
      viu = true;
      const acc = [...barra[2]].reduce((n, c) => n + (c === '♯' ? 1 : -1), 0);
      expect(((Math.min(...q.expected.midis) % 12) + 12) % 12).toBe((((PC[barra[1]] + acc) % 12) + 12) % 12);
    }
    expect(viu, 'com inversões ligadas, nenhuma cifra com baixo saiu').toBe(true);
  });
});

describe('a escala escrita', () => {
  const e = item('pauta-escala');

  it('fecha na oitava por padrão, e sem ela são sete', () => {
    const comOitava = e.make({ ...base(e), direcao: 'escrever' } as never, ctx);
    const sem = e.make({ ...base(e), direcao: 'escrever', oitava: false } as never, ctx);
    if (comOitava.expected.kind !== 'contorno' || sem.expected.kind !== 'contorno') throw new Error('esperava contorno');
    expect(comOitava.expected.midis).toHaveLength(8);
    expect(sem.expected.midis).toHaveLength(7);
    // e a oitava é mesmo a tônica doze acima da primeira
    const ms = [...comOitava.expected.midis].sort((a, b) => a - b);
    expect(ms[7] - ms[0]).toBe(12);
  });

  it('a superfície pede exatamente as notas do gabarito', () => {
    for (let i = 0; i < 60; i++) {
      const q = e.make({ ...base(e), direcao: 'escrever', tipos: ['maior', 'menor', 'dorico', 'blues', 'penta-maior'] } as never, ctx);
      if (q.expected.kind !== 'contorno') continue;
      expect('quantas' in q.surface && q.surface.quantas).toBe(q.expected.midis.length);
    }
  });
});
