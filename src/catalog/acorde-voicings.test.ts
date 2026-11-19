// O `ouvido-acorde` ganha os voicings de piano — 19/11/2026.
//
// O Paulo pediu isto em 15/11, quando o motor nasceu para a `tonica-de-ouvido`: *"com esse novo
// motor, podemos pensar em expandir o acordes de ouvido também, pra abranger esses voicings"*. Era
// a razão de `theory/voicings.ts` nascer compartilhado.
//
// O que este arquivo mede: que o som **mudou de fato** (a pilha fechada é um som só por qualidade),
// que ele continua sendo o acorde certo, e que as três fronteiras decididas com ele valem — só no
// modo de nomear, sem a fundamental só em tétrade, e as inversões saem da tela.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { translate, type MessageKey, type Vars } from '../i18n';
import { CHORDS, mod } from '../theory/core';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { key: { tonic: 0, mode: 'maior' } }),
};
const item = EXERCISES.filter(isSeries).find(e => e.id === 'ouvido-acorde') as SeriesItem;
const base = { ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) };
const pergunta = (extra: Record<string, unknown>) => item.make({ ...base, ...extra } as never, ctx);
const recusa = (extra: Record<string, unknown>) => item.problema?.({ ...base, ...extra } as never, ctx) ?? null;
const PIANO = { voicing: 'piano', tipos: ['7M'] };
const soaram = (q: ReturnType<typeof pergunta>) => q.sound!.groups[0];

describe('o som muda, e continua sendo o acorde', () => {
  it('a pilha fechada é UM som por qualidade; o voicing, muitos', () => {
    const sons = (extra: Record<string, unknown>) => {
      const vistos = new Set<string>();
      for (let i = 0; i < 300; i++) vistos.add(soaram(pergunta({ tipos: ['7M'], ...extra })).join(','));
      return vistos.size;
    };
    // fechado e sem inversão: sempre o mesmo empilhamento sobre a mesma fundamental
    expect(sons({ voicing: 'fechado' })).toBe(1);
    // invertendo, as quatro rotações da mesma pilha
    expect(sons({ voicing: 'fechado', inversoes: true })).toBe(4);
    // medido no motor: 21 voicings para uma tétrade
    expect(sons(PIANO)).toBeGreaterThanOrEqual(15);
  });

  it('as notas são as do acorde, nem mais nem menos', () => {
    for (const tipo of ['maior', 'menor', 'dim', 'aum', 'sus4', '7', 'm7', 'dim7'] as const) {
      for (let i = 0; i < 40; i++) {
        const q = pergunta({ voicing: 'piano', tipos: [tipo] });
        const ms = soaram(q);
        expect(ms.length, tipo).toBeGreaterThan(0);
        /**
         * A referência é a **fundamental do acorde**, que aqui é o dó da tonalidade (a configuração
         * padrão é fundamental fixa) — e **não a nota mais grave**, que foi o meu erro ao escrever
         * este teste: num voicing o baixo pode ser a terça, e aí as classes relativas ao baixo não
         * são os graus do acorde. O teste acusou um acorde maior como {0, 8, 3}, que é exatamente
         * um dó maior com o mi embaixo.
         */
        const esperadas = new Set(CHORDS[tipo].degs.map(([, semi]) => mod(semi, 12)));
        const classes = new Set(ms.map(m => mod(m, 12)));
        expect([...classes].every(c => esperadas.has(c)), `${tipo}: ${[...classes]} fora de ${[...esperadas]}`).toBe(true);
        // nenhum grau some, a não ser a quinta que o motor tira quando há extensão
        expect(esperadas.size - classes.size, `${tipo}: faltou grau`).toBeLessThanOrEqual(1);
      }
    }
  });

  /**
   * O baixo deixar de ser sempre a fundamental é metade do ponto: é o que impede decorar o formato
   * do som em vez de ouvir a qualidade.
   */
  it('o baixo passeia pelos graus do acorde', () => {
    const baixos = new Set<number>();
    for (let i = 0; i < 200; i++) baixos.add(mod(soaram(pergunta(PIANO))[0], 12));
    expect(baixos.size).toBeGreaterThanOrEqual(3);
  });

  it('e o acorde nunca sai mudo', () => {
    for (const tipos of [['maior'], ['sus2'], ['7M', '7', 'm7', 'm7b5', 'dim7'], ['m7M'], ['aum']]) {
      for (let i = 0; i < 60; i++) {
        expect(soaram(pergunta({ voicing: 'piano', tipos })).length, tipos.join('+')).toBeGreaterThan(0);
      }
    }
  });
});

describe('as três fronteiras', () => {
  it('só no modo de nomear: desenhando e audiando, a pilha continua fechada', () => {
    const fechadoDe = (extra: Record<string, unknown>) => soaram(pergunta({ tipos: ['7M'], voicing: 'fechado', ...extra })).join(',');
    for (const extra of [{ resposta: 'desenhar', instrumento: 'piano' }, { estimulo: 'escrito', instrumento: 'pauta' }]) {
      const comVoicing = soaram(pergunta({ tipos: ['7M'], voicing: 'piano', ...extra })).join(',');
      expect(comVoicing, JSON.stringify(extra)).toBe(fechadoDe(extra));
    }
  });

  it('sem a fundamental, só tétrade — e a recusa explica', () => {
    const texto = translate('pt', 'player.voicingSemTriade');
    for (const tipos of [['maior'], ['sus2'], ['sus4'], ['aum'], ['7M', 'maior']]) {
      expect(recusa({ voicing: 'piano', semFundamental: true, tipos }), tipos.join('+')).toBe(texto);
    }
    expect(recusa({ voicing: 'piano', semFundamental: true, tipos: ['7M', 'm7'] })).toBeNull();
    // e sem voicing a opção nem existe: não há o que recusar
    expect(recusa({ voicing: 'fechado', semFundamental: true, tipos: ['maior'] })).toBeNull();
  });

  it('sem a fundamental, a raiz some mesmo do som', () => {
    for (let i = 0; i < 60; i++) {
      const q = pergunta({ voicing: 'piano', semFundamental: true, tipos: ['m7'] });
      const ms = soaram(q);
      expect(ms.length).toBe(3);
    }
  });

  it('as inversões somem da tela com o voicing ligado, e o voicing some onde não se aplica', () => {
    const visivel = (id: string, s: Record<string, unknown>) =>
      item.settings(ctx).find(x => x.id === id)!.quando?.({ ...base, ...s } as never) ?? true;
    expect(visivel('inversoes', { voicing: 'piano' })).toBe(false);
    expect(visivel('inversoes', { voicing: 'fechado' })).toBe(true);
    // desenhando, o voicing não se aplica — e aí as inversões voltam a valer
    expect(visivel('voicing', { resposta: 'desenhar' })).toBe(false);
    expect(visivel('inversoes', { resposta: 'desenhar', voicing: 'piano' })).toBe(true);
    expect(visivel('semFundamental', { voicing: 'fechado' })).toBe(false);
    expect(visivel('semFundamental', { voicing: 'piano' })).toBe(true);
  });
});

describe('o atalho novo', () => {
  it('pede tétrades e voicing, e não cai no guarda', () => {
    const atalho = item.presets!.find(p => p.id === 'voicings')!;
    expect(atalho.settings).toMatchObject({ voicing: 'piano' });
    expect(recusa(atalho.settings)).toBeNull();
    const q = item.make({ ...base, ...atalho.settings } as never, ctx);
    expect(soaram(q).length).toBeGreaterThanOrEqual(4);
  });
});
