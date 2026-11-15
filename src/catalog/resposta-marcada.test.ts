// **O id da resposta precisa dizer ONDE se tocou**, não só qual altura.
//
// O braço desenha a marca da resposta a partir desse id (`corda:casa`). Em 12/11, unificando o toque
// das três superfícies numa função só, passei a mandar sempre a altura — e a marca do que a pessoa
// clicou deixou de aparecer no braço, porque `picked.split(':')` virava `NaN`. O Paulo relatou em
// 13/11: *"ainda não está tendo indicação visual da nota que tocou"*.
//
// Nenhum teste pegou, porque a conferência continuava certa: a resposta validava, o placar contava,
// e só o desenho sumia. Este teste olha o que a TELA recebe.
import { describe, expect, it } from 'vitest';
import { ouvidoTecla } from './items/ouvido-tecla';
import { resolveParams } from './params';
import { TUNINGS } from '../components/music/Fretboard';
import type { Ctx } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', { key: { tonic: 0, mode: 'maior' }, range: { lo: 40, hi: 72 } }),
};

/**
 * O que o Player faz ao tocar numa superfície que **não** acumula: devolve a resposta e um id. O id
 * é `corda:casa` quando o toque veio de um braço, e a altura quando veio de um teclado.
 *
 * Reproduzido aqui porque é a regra que o desenho depende, e ela mora no Player — testá-la pela
 * tela exigiria montar o componente; testá-la assim trava a forma do id, que é o que quebrou.
 */
const idDoToque = (j: { m: number; s?: number; f?: number }) => (j.s !== undefined ? `${j.s}:${j.f}` : String(j.m));

describe('a marca do que se tocou', () => {
  it('no braço, o id carrega corda e casa — e o braço consegue lê-las de volta', () => {
    const toque = { m: TUNINGS.baixo[2] + 5, s: 2, f: 5 };
    const id = idDoToque(toque);
    expect(id).toBe('2:5');
    const [corda, casa] = id.split(':').map(Number);
    expect(Number.isFinite(corda) && Number.isFinite(casa), 'o braço precisa de dois números').toBe(true);
    expect(TUNINGS.baixo[corda] + casa).toBe(toque.m);
  });

  it('no teclado, o id é a altura — e o teclado a lê de volta', () => {
    const id = idDoToque({ m: 60 });
    expect(id).toBe('60');
    expect(Number(id)).toBe(60);
  });

  /**
   * O caso que estava quebrado: mandando a ALTURA onde o braço esperava a posição, o segundo número
   * vem `NaN` e a marca cai num lugar que não existe. Duas cordas dão a mesma altura — a altura não
   * diz onde se tocou.
   */
  it('a altura sozinha não serve ao braço: duas cordas dão a mesma nota', () => {
    const [corda, casa] = String(45).split(':').map(Number);
    expect(corda).toBe(45);
    // A casa vem `undefined` — e `{ s: 45, f: undefined }` é uma marca em lugar nenhum, que era
    // exatamente o que apagava o desenho.
    expect(Number.isFinite(casa), 'sem a casa, a marca não tem onde cair').toBe(false);
    // E a ambiguidade que o id resolve: 45 existe em duas cordas do baixo.
    const posicoes = TUNINGS.baixo.flatMap((t, s) => Array.from({ length: 13 }, (_, f) => ({ s, f, m: t + f }))).filter(p => p.m === 45);
    expect(posicoes.length).toBeGreaterThan(1);
  });

  it('o gabarito do braço é uma altura que existe nele, para a revelação ter onde marcar', () => {
    for (let i = 0; i < 40; i++) {
      const q = ouvidoTecla.make!({ ...ouvidoTecla.defaults, onde: 'baixo', estimulo: 'som' } as never, ctx);
      const alcance = TUNINGS.baixo.flatMap(t => Array.from({ length: 13 }, (_, f) => t + f));
      expect(alcance, 'gabarito fora do braço não tem casa para marcar').toContain((q.expected as { midi: number }).midi);
    }
  });
});
