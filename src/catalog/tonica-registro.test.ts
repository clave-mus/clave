// O registro do acorde em "tônica de ouvido" — 26/11/2026.
//
// Ele relatou ouvindo: *"às vezes o acorde soa agudo e estridente demais"*. Medido antes de mexer,
// o teto do que soava tinha mediana 72, p90 79 e chegava a **84** — um dó6 de piano amostrado.
// A causa: `voicingsDe` usa o alcance das duas mãos (48–84) quando ninguém diz outra coisa, e este
// item não dizia, embora tivesse o eixo certo à mão — a faixa da voz de quem vai cantar.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', { key: { tonic: 0, mode: 'maior' } }),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'tonica-de-ouvido') as SeriesItem;
const base = { ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) };
const tetos = (extra: Record<string, unknown>, n = 300) => {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const ms = (item.make({ ...base, ...extra } as never, ctx).sound?.groups ?? []).flat();
    expect(ms.length, 'acorde vazio: o teto apertou demais').toBeGreaterThan(1);
    out.push(Math.max(...ms));
  }
  return out;
};

describe('o acorde fica perto da voz', () => {
  /** Uma quinta acima do topo da faixa — espaço para quatro vozes, sem o registro que grita. */
  it.each([['grave', 66], ['media', 78]])('faixa %s: nada passa de %i', (faixa, teto) => {
    for (const m of tetos({ faixaDaVoz: faixa })) expect(m).toBeLessThanOrEqual(teto);
  });

  /**
   * **Na voz aguda o acorde pode subir**, e isso não é defeito: quem declara cantar ali está
   * pedindo esse registro. O teto volta a ser o da mão direita.
   */
  it('faixa aguda ainda alcança o alto do teclado', () => {
    expect(Math.max(...tetos({ faixaDaVoz: 'aguda' }))).toBeGreaterThan(78);
  });

  /**
   * ⚠️ `somAudivel` manda onde está ligado: ali o problema é outro — o alto-falante do celular não
   * reproduz o grave —, e subir tudo é a decisão dele de 15/11.
   */
  it('o modo de alto-falante de celular continua subindo o acorde', () => {
    const comum = tetos({ faixaDaVoz: 'media' }, 120);
    const noCelular = tetos({ faixaDaVoz: 'media', somAudivel: true }, 120);
    expect(Math.max(...noCelular)).toBeGreaterThan(Math.max(...comum));
  });
});
