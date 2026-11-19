// A nota de partida no braço — 19/11/2026.
//
// O Paulo, no celular: *"melody by ear — no braço, tem que aparecer uma nota de partida"*.
//
// O porquê é de conferência, não de conforto: o contorno aceita a melodia deslocada em **oitavas
// inteiras** (§4), e não em qualquer intervalo. Quem ouviu os intervalos certos e começou meio tom
// fora erra tudo — e no braço não há de onde se agarrar. Em ditado a primeira nota é dada.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctxDe = (instrument: 'violao' | 'baixo') => ({
  naming: 'pt' as const, conv: 'pt' as const, t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams(instrument, { key: { tonic: 0, mode: 'maior' } }),
}) as Ctx;
const item = EXERCISES.filter(isSeries).find(e => e.id === 'melodia-de-ouvido') as SeriesItem;
const noBraco = (ctx: Ctx, extra: Record<string, unknown> = {}) =>
  item.make({ ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}), superficie: 'braco', ...extra } as never, ctx);

describe('a nota de partida', () => {
  it.each(['violao', 'baixo'] as const)('%s: o braço mostra a primeira nota da melodia, com o nome', inst => {
    const ctx = ctxDe(inst);
    for (let i = 0; i < 40; i++) {
      const q = noBraco(ctx);
      const sf = q.surface as { kind: string; apoio?: { midis: number[]; rotulos?: Record<number, string> } };
      expect(sf.kind).toBe('fretboard');
      expect(sf.apoio?.midis, 'sem nota de partida').toHaveLength(1);
      // é a PRIMEIRA da melodia, não a tônica nem a mais grave — e o gabarito é quem diz qual é
      expect(sf.apoio!.midis[0]).toBe((q.expected as { midis: number[] }).midis[0]);
      // e ela está entre as alturas que soaram
      expect(q.sound!.groups.flat()).toContain(sf.apoio!.midis[0]);
      // e leva nome, para não ser um ponto misterioso
      expect(sf.apoio!.rotulos?.[sf.apoio!.midis[0]], 'sem rótulo').toBeTruthy();
    }
  });

  it('a partida é a nota que a conferência espera primeiro', () => {
    const ctx = ctxDe('violao');
    for (let i = 0; i < 40; i++) {
      const q = noBraco(ctx);
      const sf = q.surface as { apoio?: { midis: number[] } };
      expect(q.expected.kind).toBe('contorno');
      const esperadas = (q.expected as { midis: number[] }).midis;
      expect(sf.apoio!.midis[0]).toBe(esperadas[0]);
    }
  });

  it('e ela cabe no braço: existe casa para a marca', () => {
    for (const inst of ['violao', 'baixo'] as const) {
      const ctx = ctxDe(inst);
      for (let i = 0; i < 40; i++) {
        const q = noBraco(ctx);
        const sf = q.surface as { tuning: readonly number[]; from: number; to: number; apoio?: { midis: number[] } };
        const m = sf.apoio!.midis[0];
        const cabe = sf.tuning.some(t => m - t >= sf.from && m - t <= sf.to);
        expect(cabe, `${inst}: a partida ${m} não tem casa em ${sf.tuning}`).toBe(true);
      }
    }
  });

  /**
   * **Ela é âncora, não desconto**: continua entre as `n` alturas que se responde. Dar a primeira e
   * pedir as outras seria outro exercício — e o `quantas` é o que o Player usa para saber quando a
   * resposta está cheia.
   */
  it('não muda quantas notas se responde', () => {
    const ctx = ctxDe('violao');
    for (const notas of [2, 3, 4]) {
      const q = noBraco(ctx, { notas });
      expect((q.surface as { quantas?: number }).quantas, String(notas)).toBe(notas);
      expect((q.expected as { midis: number[] }).midis).toHaveLength(notas);
    }
  });

  it('o rótulo usa a grafia da tonalidade', () => {
    // em fá maior aparece Si♭, nunca Lá♯ — é a regra do projeto, e o apoio não a contorna
    const ctx = { ...ctxDe('violao'), params: resolveParams('violao', { key: { tonic: 5, mode: 'maior' } }) } as Ctx;
    for (let i = 0; i < 60; i++) {
      const sf = noBraco(ctx).surface as { apoio?: { rotulos?: Record<number, string> } };
      const nome = Object.values(sf.apoio!.rotulos!)[0];
      expect(nome, nome).not.toContain('♯');
    }
  });

  it('nas outras superfícies nada mudou — a partida é do braço', () => {
    const ctx = ctxDe('violao');
    for (const superficie of ['pauta', 'teclado', 'graus']) {
      const sf = item.make({ ...item.defaults, superficie } as never, ctx).surface as { apoio?: unknown };
      expect(sf.apoio, superficie).toBeUndefined();
    }
  });
});
