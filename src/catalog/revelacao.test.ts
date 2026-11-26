// **A revelação visual** — o teclado do que soou, depois de responder (26/11).
//
// Pedido dele para a Tônica e, no mesmo dia, para os dois irmãos: *"seria legal pôr a mesma coisa
// como opção em acordes de ouvido e graus do campo harmônico"*.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('piano', { key: { tonic: 0, mode: 'maior' } }),
};
const OS_TRES = ['tonica-de-ouvido', 'ouvido-acorde', 'ouvido-campo'];
const item = (id: string) => EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
const perguntas = (id: string, extra: Record<string, unknown> = {}, n = 60) => {
  const it = item(id);
  const base = { ...it.defaults, ...(it.defaultsDo?.(ctx) ?? {}), ...extra };
  return Array.from({ length: n }, () => it.make(base as never, ctx));
};

describe('os três declaram o teclado do que soou', () => {
  it.each(OS_TRES)('%s: as teclas marcadas são exatamente o que soou', id => {
    for (const q of perguntas(id)) {
      const r = q.revelacao;
      expect(r, `${id}: sem revelação com o padrão ligado`).toBeTruthy();
      if (r?.kind !== 'keyboard') throw new Error('revelação que não é teclado');
      /**
       * **Tocável é só o que soou** — decisão dele, contra a minha sugestão de deixar o teclado
       * inteiro tocável: *"só é tocável as notas do acorde, que são justamente as que usuário se
       * confunde"*. O Player toca `notas` e ignora o resto, então é esta lista que precisa bater.
       */
      const soaram = (q.sound?.groups ?? []).flat();
      for (const m of r.notas) expect(soaram, `${id}: tecla que não soou`).toContain(m);
      expect(r.notas.length).toBeGreaterThan(1);
    }
  });

  /** A faixa é a do acorde com **uma terça de folga** para cada lado (decisão dele). */
  it.each(OS_TRES)('%s: a faixa abraça as notas com uma terça de folga', id => {
    for (const q of perguntas(id)) {
      const r = q.revelacao;
      if (r?.kind !== 'keyboard') throw new Error('revelação que não é teclado');
      expect(r.lo).toBe(Math.min(...r.notas) - 4);
      expect(r.hi).toBe(Math.max(...r.notas) + 4);
    }
  });

  /** O rótulo é o nome da fundamental, **grafado pela tonalidade** — quem grafa é o item. */
  it.each(OS_TRES)('%s: a tecla nomeada é da classe da fundamental', id => {
    for (const q of perguntas(id)) {
      const r = q.revelacao;
      if (r?.kind !== 'keyboard' || !r.rotulos) continue;
      for (const [m, nome] of Object.entries(r.rotulos)) {
        expect(r.notas, `${id}: nome numa tecla que não soou`).toContain(Number(m));
        expect(nome.length, `${id}: rótulo vazio`).toBeGreaterThan(0);
      }
    }
  });

  it.each(OS_TRES)('%s: desligado, não há revelação', id => {
    for (const q of perguntas(id, { verOQueSoou: false }, 10)) expect(q.revelacao).toBeUndefined();
  });
});

/**
 * ⚠️ **O Player não avança sozinho quando há revelação.** Medido na tela em 26/11: a Tônica
 * autoavalia sempre como acerto, o avanço vem 850 ms depois, e o teclado piscava e sumia — que é
 * justamente o caso que ele pediu (*"mesmo quando marca 'consegui com facilidade'"*).
 *
 * A regra mora no Player; o que este teste guarda é a condição que a dispara.
 */
describe('a revelação sobrevive ao acerto', () => {
  it('a Tônica de ouvido, que autoavalia, declara revelação em toda pergunta', () => {
    for (const q of perguntas('tonica-de-ouvido', {}, 30)) {
      expect(q.surface.kind).toBe('autoavaliacao');
      expect(q.revelacao).toBeTruthy();
    }
  });
});
