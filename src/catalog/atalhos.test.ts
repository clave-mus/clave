// Os atalhos governam pouco — 16/11/2026.
//
// O Paulo clicou em "tétrades" no `mapa-do-braco` e perdeu o som do alto-falante, a abertura da mão
// e a tonalidade: *"ao clicar no atalho de tétrades, isso só mude os graus — e não os outros
// parâmetros"*. Este arquivo guarda a regra que saiu daí, e os dois defeitos opostos que ela
// precisa evitar ao mesmo tempo (ver `atalhos.ts`).
import { describe, expect, it } from 'vitest';
import { chavesDisputadas, settingsDoAtalho } from './atalhos';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem, type SettingValue } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', {}),
};
const comAtalhos = EXERCISES.filter(isSeries).filter(e => e.presets?.length);
const baseDe = (e: SeriesItem) => ({ ...e.defaults, ...(e.defaultsDo?.(ctx) ?? {}) });
const mapa = EXERCISES.filter(isSeries).find(e => e.id === 'mapa-do-braco') as SeriesItem;
const atalhoDo = (e: SeriesItem, id: string) => e.presets!.find(p => p.id === id)!;

describe('mapa-do-braco: o caso que o Paulo relatou', () => {
  it('os atalhos disputam só os graus', () => {
    const { settings, params } = chavesDisputadas(mapa);
    expect([...settings].sort()).toEqual(['graus', 'modoDosGraus']);
    // Os quatro pedem dó maior, então a tonalidade não é assunto deles — só da entrada do item.
    expect(params).toBe(false);
  });

  it('clicar em tétrades muda os graus e preserva o resto', () => {
    // o que a pessoa escolheu antes de clicar
    const dela: Record<string, SettingValue> = {
      ...baseDe(mapa), modoDosGraus: 'sorteados3',
      somAudivel: true, abertura: '3', instrumento: 'baixo',
      regiao: 'fixa', casaDe: 7, casaAte: 12, cordasDistintas: true, ouvirArpejo: true,
      campo: 'menor-harmonica',
    };
    const depois = settingsDoAtalho(mapa, atalhoDo(mapa, 'tetrades'), dela, baseDe(mapa));
    expect(depois.modoDosGraus).toBe('escolhidos');
    expect(depois.graus).toEqual(['1', '3', '5', '7']);
    for (const k of ['somAudivel', 'abertura', 'instrumento', 'regiao', 'casaDe', 'casaAte', 'cordasDistintas', 'ouvirArpejo', 'campo']) {
      expect(depois[k], k).toEqual(dela[k]);
    }
  });
});

describe('a regra geral', () => {
  it('há itens com atalho (senão este arquivo não afirma nada)', () => {
    expect(comAtalhos.length).toBeGreaterThanOrEqual(10);
  });

  /**
   * **O defeito oposto**: configuração que só *um* atalho menciona tem de voltar ao padrão nos
   * outros, senão ela fica ligada depois de clicar no atalho que não a quer. É o que a conta por
   * discordância garante, e é por isso que ela resolve cada atalho contra os padrões.
   */
  it.each(comAtalhos.map(e => e.id))('%s: nenhum atalho herda configuração do atalho anterior', id => {
    const e = comAtalhos.find(x => x.id === id)!;
    const base = baseDe(e);
    for (const a of e.presets!) {
      const depoisDeA = settingsDoAtalho(e, a, base, base);
      for (const b of e.presets!) {
        // clicar em B depois de A dá o mesmo que clicar em B direto: A não deixa resíduo
        expect(settingsDoAtalho(e, b, depoisDeA, base), `${id}: ${a.id} → ${b.id}`)
          .toEqual(settingsDoAtalho(e, b, base, base));
      }
    }
  });

  it.each(comAtalhos.map(e => e.id))('%s: o atalho entrega o que promete', id => {
    const e = comAtalhos.find(x => x.id === id)!;
    const base = baseDe(e);
    for (const a of e.presets!) {
      const depois = settingsDoAtalho(e, a, base, base);
      // tudo o que o atalho declara e que algum outro disputa está em vigor depois do clique
      for (const k of chavesDisputadas(e).settings) {
        if (k in a.settings) expect(depois[k], `${id}/${a.id}: ${k}`).toEqual(a.settings[k]);
      }
    }
  });

  /**
   * Com um atalho só não há discordância, e a regra deixaria o clique sem efeito nenhum — pior que
   * o defeito que ela consertou. Ali ele volta a governar o que menciona.
   */
  it('item com um atalho só: ele governa o que menciona', () => {
    const um = { ...mapa, presets: [atalhoDo(mapa, 'triades')] } as SeriesItem;
    expect(chavesDisputadas(um)).toEqual({ settings: ['modoDosGraus', 'graus', 'campo'], params: true });
    const depois = settingsDoAtalho(um, um.presets![0], { ...baseDe(mapa), graus: ['2'], somAudivel: true }, baseDe(mapa));
    expect(depois.graus).toEqual(['1', '3', '5']);
    expect(depois.somAudivel).toBe(true);
  });

  /**
   * Onde os atalhos **pedem tonalidades diferentes**, clicar continua trocando a tonalidade — é o
   * caso de `ouvido-campo`, em que um atalho é dó maior e outro lá menor: ali a tonalidade É o
   * conteúdo do atalho.
   */
  it('a tonalidade só muda onde os atalhos discordam dela', () => {
    expect(chavesDisputadas(EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-campo')!).params).toBe(true);
    expect(chavesDisputadas(EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-celulas')!).params).toBe(false);
  });
});
