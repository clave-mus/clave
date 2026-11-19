// O timbre do `ouvido-intervalo` — 19/11/2026.
//
// O Paulo: *"em intervals by ear, será que podemos adicionar mais timbres?"*. Medindo para
// responder, apareceu o fato que mudou a pergunta: o item **já** tocava com seis timbres possíveis,
// e a escolha morava só no Perfil, na casinha do "piano" — ninguém associaria aquilo a este
// exercício. Daí o seletor aqui, e o **sorteio a cada pergunta**, que é a parte que treina o ouvido:
// reconhecer um intervalo independente do timbre é o que transfere para a música de verdade.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { globalPresentation } from './params';
import { resolvePresentation } from '../audio/presentation';
import { translate, type MessageKey, type Vars } from '../i18n';

const params = resolveParams('violao', { key: { tonic: 0, mode: 'maior' }, timbres: { piano: 'orgao' } });
const ctx: Ctx = { naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params };
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-intervalo') as SeriesItem;
const base = { ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) };

/** O timbre que o Player tocaria — as mesmas quatro camadas, na mesma ordem. */
const vozDe = (extra: Record<string, unknown>) => {
  const s = { ...base, ...extra };
  const q = item.make(s as never, ctx);
  const daConfig = item.settings(ctx)
    .filter(st => st.quando?.(s as never) ?? true)
    .reduce((acc, st) => (st.present ? { ...acc, ...st.present(s[st.id] as never) } : acc), {});
  return resolvePresentation([globalPresentation(params, q.sound?.instrument), item.presentation, daConfig, q.presentation]).voice;
};

describe('o timbre', () => {
  it('por padrão é o do perfil — e era o único caminho antes de hoje', () => {
    expect(vozDe({})).toBe('orgao');
  });

  it('escolhendo um, é ele que soa, sem mexer no perfil', () => {
    for (const v of ['piano', 'limpo', 'pad', 'violao', 'baixo', 'orgao']) {
      expect(vozDe({ timbre: 'escolher', qualTimbre: v }), v).toBe(v);
    }
  });

  /**
   * Sorteado é propriedade **da pergunta**, não da configuração: muda a cada uma. É por isso que
   * `Question.presentation` passou a existir — as outras três camadas valem para a rodada inteira.
   */
  it('sorteado, o timbre muda entre perguntas e passeia pelos seis', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) vistos.add(String(vozDe({ timbre: 'sorteado' })));
    expect(vistos.size).toBeGreaterThanOrEqual(5);
  });

  it('e o sorteio vale nos quatro modos de pergunta', () => {
    for (const extra of [
      {},
      { resposta: 'notas' },
      { resposta: 'audiar', direcao: 'juntas' },
      { estimulo: 'escrito' },
    ]) {
      const q = item.make({ ...base, ...extra, timbre: 'sorteado' } as never, ctx);
      expect(q.presentation?.voice, JSON.stringify(extra)).toBeTruthy();
    }
  });

  it('sem sorteio, a pergunta não carrega camada nenhuma', () => {
    for (const timbre of ['perfil', 'escolher']) {
      expect(item.make({ ...base, timbre } as never, ctx).presentation, timbre).toBeUndefined();
    }
  });

  it('o seletor de qual timbre só aparece quando se pede para escolher', () => {
    const quando = item.settings(ctx).find(s => s.id === 'qualTimbre')!.quando!;
    expect(quando({ ...base, timbre: 'escolher' } as never)).toBe(true);
    for (const timbre of ['perfil', 'sorteado']) expect(quando({ ...base, timbre } as never), timbre).toBe(false);
  });

  it('os seis nomes existem nos dois idiomas', () => {
    for (const v of ['piano', 'limpo', 'pad', 'violao', 'baixo', 'orgao']) {
      for (const locale of ['pt', 'en'] as const) {
        expect(translate(locale, `voices.${v}` as MessageKey), `${v}/${locale}`).toBeTruthy();
      }
    }
  });
});
