// "Todas as posições da nota no braço" (pedido do Paulo em 10/11: *"clicar em todas posicoes da
// nota no braço"*).
//
// Esperou dois dias por uma razão boa: precisava da superfície que ACUMULA respostas, e ela nasceu
// em 12/11 (`Surface.quantas`). Construí-la antes teria sido motor órfão — o projeto já teve dois.
import { describe, expect, it } from 'vitest';
import { notaNoInstrumento } from './items/nota-no-instrumento';
import { validate } from './validate';
import { resolveParams } from './params';
import { TUNINGS } from '../components/music/Fretboard';
import type { Ctx, SettingValue } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', { range: { lo: 40, hi: 88 } }),
};
const perguntar = (s: Record<string, SettingValue>) =>
  notaNoInstrumento.make!({ ...notaNoInstrumento.defaults, direcao: 'achar', instrumento: 'violao', casas: '0-12', todasAsPosicoes: true, ...s } as never, ctx);

/** Todas as alturas que existem no braço, nas casas dadas. */
const noBraco = (tuning: readonly number[], de: number, ate: number) =>
  tuning.flatMap(t => Array.from({ length: ate - de + 1 }, (_, k) => t + de + k));

describe('todas as posições', () => {
  it('a conta bate com o braço: nem uma posição a mais, nem a menos', () => {
    for (let i = 0; i < 80; i++) {
      const q = perguntar({});
      const midis = (q.expected as { midis: number[] }).midis;
      const pc = ((midis[0] % 12) + 12) % 12;
      const esperadas = noBraco(TUNINGS.violao, 0, 12).filter(m => ((m % 12) + 12) % 12 === pc);
      expect(midis.length, `classe ${pc}`).toBe(esperadas.length);
      expect('quantas' in q.surface && q.surface.quantas, 'a superfície pede exatamente essas').toBe(esperadas.length);
      // e todas são a MESMA nota
      expect(new Set(midis.map(m => ((m % 12) + 12) % 12)).size).toBe(1);
    }
  });

  it('respeita as cordas que a pessoa incluiu — não oferece o que ela excluiu', () => {
    // A 1ª e a 2ª corda são os ÚLTIMOS índices da afinação (ela vai da grave para a aguda).
    const q = perguntar({ cordas: ['1', '2'] });
    const midis = (q.expected as { midis: number[] }).midis;
    const permitidas = new Set([4, 5].flatMap(st => Array.from({ length: 13 }, (_, k) => TUNINGS.violao[st] + k)));
    for (const m of midis) expect(permitidas.has(m), `${m} veio de corda excluída`).toBe(true);
  });

  it('a ordem em que se varre o braço não é resposta', () => {
    const q = perguntar({});
    const midis = (q.expected as { midis: number[] }).midis;
    expect(validate(q.expected, { kind: 'pitches', midis: [...midis].reverse() })).toBe(true);
    expect(validate(q.expected, { kind: 'pitches', midis })).toBe(true);
    // Mas faltar uma, ou trazer uma que não é daquela nota, não passa.
    expect(validate(q.expected, { kind: 'pitches', midis: midis.slice(0, -1) })).toBe(false);
    expect(validate(q.expected, { kind: 'pitches', midis: [...midis.slice(0, -1), midis[0] + 1] })).toBe(false);
  });

  it('é parâmetro, não padrão: sem ligar, continua sendo uma posição só', () => {
    const q = notaNoInstrumento.make!({ ...notaNoInstrumento.defaults, direcao: 'achar', instrumento: 'violao' } as never, ctx);
    expect('quantas' in q.surface ? q.surface.quantas : undefined).toBeUndefined();
    expect(q.expected.kind).toBe('pitchClass');
  });

  it('não aparece no piano nem com a pergunta por altura exata', () => {
    // No teclado "todas" é outra pergunta (qual oitava), que a direção `altura` já faz.
    const opcoes = notaNoInstrumento.settings(ctx).find(st => st.id === 'todasAsPosicoes')!;
    expect(opcoes.quando!({ instrumento: 'piano', direcao: 'achar', pergunta: 'nota' })).toBe(false);
    expect(opcoes.quando!({ instrumento: 'violao', direcao: 'achar', pergunta: 'altura' })).toBe(false);
    expect(opcoes.quando!({ instrumento: 'violao', direcao: 'achar', pergunta: 'nota' })).toBe(true);
  });
});
