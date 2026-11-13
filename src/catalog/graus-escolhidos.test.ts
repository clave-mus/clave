// Restringir aos **graus** que a pessoa escolhe.
//
// Nasceu como "só estas notas" (pelo nome) em 13/11, e no mesmo dia o Paulo pediu a troca: *"ao
// inves de definir quais notas vao tocar pelo nome, seria melhor definir pelo grau. E que isso tenha
// relação direta com o material cromático ou só a tonalidade — quando tu limita so pra tonalidade,
// mudam as opcoes selecionadas."*
//
// A conta mora em `pcsDosGraus`, e não em cada item, porque são três linhas pedindo a mesma coisa.
import { describe, expect, it } from 'vitest';
import { ouvidoTecla } from './items/ouvido-tecla';
import { melodiaDeOuvido } from './items/melodia-de-ouvido';
import { ouvidoIntervalo } from './items/ouvido-intervalo';
import { pcsDosGraus } from './contexto-musical';
import { resolveParams } from './params';
import type { Ctx } from './types';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctxCom = (p: Parameters<typeof resolveParams>[1] = {}): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('violao', p),
});
const ctx = ctxCom({ key: { tonic: 0, mode: 'maior' }, range: { lo: 55, hi: 79 } });
/** Os graus 1, 3 e 5 — em dó maior, as notas dó, mi e sol. Os ids são semitons da tônica. */
const UM_TRES_CINCO = ['0', '4', '7'];

describe('pcsDosGraus', () => {
  it('vazio é sem restrição: vale o material', () => {
    expect(pcsDosGraus(ctx, [])).toEqual(pcsDosGraus(ctx, undefined));
    expect(pcsDosGraus(ctx, []).length).toBe(12);
  });

  it('cruza com o material, e escolher não abre o que a tonalidade fechou', () => {
    // Em dó maior diatônico, escolher ré♭ (1) não o traz de volta: ele não está na tonalidade.
    const diatonico = ctxCom({ key: { tonic: 0, mode: 'maior' }, material: 'diatonico' });
    expect(pcsDosGraus(diatonico, ['0', '1', '4'])).toEqual([0, 4]);
  });

  it('cruzamento vazio cai no material em vez de ficar sem nota', () => {
    // Quem recusa configuração impossível é o `problema()` do item, que sabe de quantas precisa.
    const diatonico = ctxCom({ key: { tonic: 0, mode: 'maior' }, material: 'diatonico' });
    expect(pcsDosGraus(diatonico, ['1', '6'])).toEqual(pcsDosGraus(diatonico, []));
  });
});

describe('as três linhas respeitam a escolha', () => {
  it('ouvido-tecla sorteia só entre os graus escolhidos', () => {
    const vistas = new Set<number>();
    for (let i = 0; i < 120; i++) {
      const q = ouvidoTecla.make!({ ...ouvidoTecla.defaults, onde: 'teclado', grausEscolhidos: UM_TRES_CINCO } as never, ctx);
      vistas.add(((q.expected as { midi: number }).midi % 12 + 12) % 12);
    }
    expect([...vistas].sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });

  it('melodia-de-ouvido usa só os graus escolhidos, em toda a melodia', () => {
    for (let i = 0; i < 60; i++) {
      const q = melodiaDeOuvido.make!({ ...melodiaDeOuvido.defaults, grausEscolhidos: UM_TRES_CINCO } as never, ctx);
      for (const m of (q.expected as { midis: number[] }).midis) expect([0, 4, 7]).toContain(((m % 12) + 12) % 12);
    }
  });

  it('ouvido-intervalo parte de um dos graus escolhidos', () => {
    const vistas = new Set<number>();
    for (let i = 0; i < 80; i++) {
      const q = ouvidoIntervalo.make!({ ...ouvidoIntervalo.defaults, resposta: 'notas', direcao: 'juntas', grausEscolhidos: UM_TRES_CINCO } as never, ctx);
      vistas.add((Math.min(...(q.expected as { midis: number[] }).midis) % 12 + 12) % 12);
    }
    expect([...vistas].sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });
});

describe('recusar em vez de sortear o impossível (decisão 13)', () => {
  /**
   * **"Incluir teclas pretas" deixou de existir em 13/11**, e este teste mudou de assunto com ele.
   *
   * Ele dizia: "só teclas pretas escolhidas, com as pretas desligadas, não tem nota nenhuma". Era
   * verdade — e era o sintoma: dois controles decidindo a mesma coisa. Com graus, o interruptor
   * virou redundante, porque grau alterado é um grau que a pessoa escolhe ou não.
   *
   * O que sobra para travar é a recusa de verdade: seleção que não deixa nota nenhuma.
   */
  it('seleção que o material não permite cai no material, sem deixar o item sem nota', () => {
    const diatonico = ctxCom({ key: { tonic: 0, mode: 'maior' }, material: 'diatonico', range: { lo: 55, hi: 79 } });
    // Em dó maior diatônico, pedir só ♭2 e ♭5 não deixa nada — vale o material inteiro, em vez de
    // o exercício ficar sem pergunta.
    expect(pcsDosGraus(diatonico, ['1', '6'])).toEqual(pcsDosGraus(diatonico, []));
    expect(ouvidoTecla.problema!({ ...ouvidoTecla.defaults, grausEscolhidos: ['1', '6'] } as never, diatonico)).toBeNull();
  });

  it('uma nota só numa região curta não dá melodia; numa região larga dá (oitavas)', () => {
    const curta = ctxCom({ key: { tonic: 0, mode: 'maior' }, range: { lo: 60, hi: 64 } });
    expect(melodiaDeOuvido.problema!({ ...melodiaDeOuvido.defaults, grausEscolhidos: ['0'] } as never, curta)).toBeTruthy();
    expect(melodiaDeOuvido.problema!({ ...melodiaDeOuvido.defaults, grausEscolhidos: ['0'] } as never, ctx)).toBeNull();
  });
});
