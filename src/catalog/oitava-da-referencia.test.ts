// **Toda opção oferecida entrega o que promete** — a regra que esta configuração custou três
// rodadas para aprender.
//
// A oitava da referência em `ouvido-tecla` depende da superfície de resposta, e o Paulo relatou o
// mesmo defeito por três ângulos:
//
//   1. *"eu mudo pra 2 e ele não muda"* — a região descartava a escolha em silêncio;
//   2. *"no braço do baixo, não tem mais a opção do C2"* — a lista saía do instrumento do PERFIL;
//   3. *"tem a opção C4 e C5... ao mudar entre elas, continuar só no dó agudo do baixo"* — a lista
//      virou a união de todos os alcances, e aí sobrava o que aquela tela não entrega.
//
// Os três são a mesma doença: oferecer o que não acontece. Este teste é a vacina — ele percorre as
// superfícies, pega as opções que a TELA mostra, e exige que cada uma entregue a sua oitava.
import { describe, expect, it } from 'vitest';
import { ouvidoTecla } from './items/ouvido-tecla';
import { resolveParams } from './params';
import { TUNINGS } from '../components/music/Fretboard';
import type { Ctx, SettingOption } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctxCom = (p: Parameters<typeof resolveParams>[1] = {}): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 0, mode: 'maior' }, ...p }),
});

const seletor = (ctx: Ctx) => ouvidoTecla.settings(ctx).find(st => st.id === 'oitavaDaReferencia')!;
const naTela = (ctx: Ctx, onde: string): SettingOption[] => seletor(ctx).opcoesDe!({ onde });
const oitavaDe = (m: number) => Math.floor(m / 12) - 1;

const SUPERFICIES = ['baixo', 'violao', 'teclado', 'pauta', 'letras', 'graus'];

describe('a oitava da referência', () => {
  it.each(SUPERFICIES)('em %s, toda opção oferecida soa na oitava que ela diz', onde => {
    const ctx = ctxCom();
    for (const opcao of naTela(ctx, onde)) {
      if (opcao.id === 'sorteada') continue;
      const q = ouvidoTecla.make!({ ...ouvidoTecla.defaults, onde, referencia: true, oitavaDaReferencia: opcao.id } as never, ctx);
      const referencia = q.sound!.groups[0][0];
      expect(oitavaDe(referencia), `${onde}: a opção ${opcao.id} entregou dó${oitavaDe(referencia)}`).toBe(Number(opcao.id));
    }
  });

  it('no braço do baixo são exatamente as duas que existem nele: dó2 e dó3', () => {
    // Num baixo de quatro cordas nas casas 0–12, os dós são 36 (casa 8 da 4ª) e 48 (casa 5 da 2ª).
    const ids = naTela(ctxCom(), 'baixo').map(o => o.id);
    expect(ids).toEqual(['2', '3', 'sorteada']);
    const dos = TUNINGS.baixo.flatMap(t => Array.from({ length: 13 }, (_, f) => t + f)).filter(m => m % 12 === 0);
    expect([...new Set(dos.map(oitavaDe))].sort()).toEqual([2, 3]);
  });

  it('cada superfície oferece o seu alcance, e eles diferem', () => {
    const ctx = ctxCom();
    const porSuperficie = Object.fromEntries(SUPERFICIES.map(onde => [onde, naTela(ctx, onde).map(o => o.id).join(',')]));
    // Se todas oferecessem a mesma coisa, a conta por superfície não estaria fazendo nada.
    expect(new Set(Object.values(porSuperficie)).size, JSON.stringify(porSuperficie)).toBeGreaterThan(1);
    // E o braço do baixo é o mais estreito, por ser o instrumento mais grave e mais curto.
    expect(naTela(ctx, 'baixo').length).toBeLessThan(naTela(ctx, 'violao').length);
  });

  it('a referência aparece desenhada na oitava que soou, com o número no rótulo', () => {
    // O rótulo leva a oitava para que uma troca forçada nunca seja silenciosa.
    const ctx = ctxCom();
    const q = ouvidoTecla.make!({ ...ouvidoTecla.defaults, onde: 'baixo', referencia: true, oitavaDaReferencia: '2' } as never, ctx);
    const sf = q.surface as { apoio?: { midis: number[]; rotulos?: Record<number, string> } };
    const referencia = q.sound!.groups[0][0];
    expect(sf.apoio?.midis).toEqual([referencia]);
    expect(sf.apoio?.rotulos?.[referencia]).toBe('Dó2');
  });

  it('a lista completa (a dos testes e atalhos) contém tudo o que a tela pode oferecer', () => {
    const ctx = ctxCom();
    const completa = new Set(seletor(ctx).options!.map(o => o.id));
    for (const onde of SUPERFICIES) {
      for (const o of naTela(ctx, onde)) {
        expect(completa.has(o.id), `${onde}: ${o.id} não está na lista completa`).toBe(true);
      }
    }
  });
});
