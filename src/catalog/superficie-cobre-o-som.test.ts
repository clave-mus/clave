// A tela não pode mentir sobre o que soou (09/11/2026).
//
// O Paulo achou isto no `ouvido-tecla`: o som sorteava em MIDI 48–83 e o teclado desenhado ia de 60
// a 71. Soava um ré3, não havia tecla de ré3, e ele clicava uma oitava acima. Como a resposta é por
// classe de altura, clicar na oitava errada ACERTAVA — então nem o acerto denunciava o problema.
//
// O teste é genérico de propósito: vale para toda superfície que mostra onde responder. Dois
// números que precisam concordar, escritos em lugares diferentes, voltam a divergir.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};

/** As combinações de configuração que valem a pena varrer, sem explodir o tempo do teste. */
function variacoes(item: ReturnType<typeof EXERCISES.filter>[number]) {
  if (!isSeries(item)) return [];
  const base = { ...item.defaults } as Record<string, SettingValue>;
  const fora: Record<string, SettingValue>[] = [base];
  for (const s of item.settings(ctx)) {
    if (s.type === 'toggle') fora.push({ ...base, [s.id]: !base[s.id] });
    if (s.type === 'single' && s.options) for (const o of s.options) fora.push({ ...base, [s.id]: o.id });
  }
  return fora;
}

const comTeclado = EXERCISES.filter(isSeries).filter(e =>
  variacoes(e).some(v => { try { return e.make(v as never, ctx).surface.kind === 'keyboard'; } catch { return false; } }));

describe('toda nota que soa cabe na superfície que a pessoa vê', () => {
  it('há item com teclado (senão o teste não afirma nada)', () => {
    expect(comTeclado.length).toBeGreaterThan(0);
  });

  it.each(comTeclado.map(e => e.id))('%s: nenhuma nota soa fora do teclado desenhado', id => {
    const item = EXERCISES.filter(isSeries).find(e => e.id === id)!;
    let conferidas = 0;
    for (const v of variacoes(item)) {
      for (let i = 0; i < 40; i++) {
        const q = item.make(v as never, ctx);
        if (q.surface.kind !== 'keyboard' || !q.sound) continue;
        const { lo, hi } = q.surface;
        for (const m of q.sound.groups.flat()) {
          expect(m, `${id}: soou ${m}, teclado é ${lo}–${hi}`).toBeGreaterThanOrEqual(lo);
          expect(m, `${id}: soou ${m}, teclado é ${lo}–${hi}`).toBeLessThanOrEqual(hi);
          conferidas++;
        }
      }
    }
    // O piso é só contra vacuidade: `ache-a-nota` toca uma nota por pergunta e confere 40, o
    // `ouvido-tecla` toca duas quando a referência está ligada. O que importa é não ser zero.
    expect(conferidas, `${id}: nada foi conferido`).toBeGreaterThan(20);
  });
});
