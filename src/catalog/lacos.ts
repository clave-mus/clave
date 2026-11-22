/**
 * **Os laços entre explorar e cobrar** — "me teste nisto", de uma tela de exploração para o
 * exercício que cobra a mesma coisa.
 *
 * Dois existem, e os dois são pares que o Paulo desenhou:
 *
 * | explora | cobra |
 * |---|---|
 * | `explorar-padroes-escala` (a escada) | `reconhecer-padroes-escala`, naquele desenho |
 * | `relacoes-melodia-harmonia` (a grade) | `ouvido-celulas` no modo do par |
 *
 * ## Por que isto é um módulo, e não duas linhas dentro das telas
 *
 * O laço carrega **nomes de configuração de outro item**. Renomear `escala` no
 * `reconhecer-padroes-escala`, ou `resposta` no `ouvido-celulas`, quebraria o laço **em silêncio**:
 * a chave desconhecida é ignorada, o exercício abre no modo errado, e nada reclama. Com os laços
 * como dado, um teste varre os dois contra os itens de verdade — ver `lacos.test.ts`.
 *
 * A mecânica é a aprovada em 10/11 e não muda: a configuração viaja no `state` da navegação,
 * `lerAbertura` a lê, e o Player a usa como camada `local` — que **não vaza** para o que o item tem
 * guardado (ele só grava quando não há camada local).
 */
import { escreverPadrao, type Padrao } from '../theory/padrao-de-escala';
import type { ModoDoCampo, ScaleId } from '../theory/core';
import type { SettingValue } from './types';

export interface Laco {
  /** Para onde a navegação vai, sem a barra: `/catalogo/${itemId}`. */
  itemId: string;
  /** O que viaja como `instancia` — as configurações do item de destino. */
  instancia: Record<string, SettingValue>;
  /** Os parâmetros de prática (tonalidade, região), quando o laço tem o que dizer sobre eles. */
  params?: Record<string, unknown>;
  /**
   * Chaves que o laço manda e que o item de destino **não oferece como controle**, de propósito.
   * Hoje só `padrao`: quem escolhe o desenho é a exploração, e o exercício não tem (nem deve ter)
   * um campo para digitá-lo — está escrito na §2 do `PE-padroes-de-escala.md`.
   */
  semControle?: string[];
}

/** Da escada para o exercício, naquele desenho. */
export const lacoDosPadroes = (escala: ScaleId, padrao: Padrao): Laco => ({
  itemId: 'reconhecer-padroes-escala',
  instancia: { escala, padrao: escreverPadrao(padrao) },
  semControle: ['padrao'],
});

/**
 * Da grade do Relações para o modo do par.
 *
 * Leva **o campo inteiro** como material, que é o que a tela mostra: os sete acordes lado a lado. E
 * uma nota só, porque é disso que a grade fala — a mesma nota contra cada grau.
 */
export const lacoDaRelacao = (campo: ModoDoCampo, tetrade: boolean, tonica: number): Laco => ({
  itemId: 'ouvido-celulas',
  instancia: {
    escala: campo, tamanho: '1', graus: ['1', '2', '3', '4', '5', '6', '7'],
    tetrade, registro: 'acima', resposta: 'par', contexto: 'ii-V-I',
  },
  params: { key: { tonic: tonica, mode: campo === 'maior' ? 'maior' : 'menor' } },
});

/**
 * **Um exemplo de cada laço, para o teste varrer.** Não é duplicação da definição: são as entradas
 * que as telas de fato passam, e é com elas que o guarda confere chave por chave.
 */
export const EXEMPLOS_DE_LACO: Laco[] = [
  lacoDosPadroes('penta-maior', [0, 2, 1, 4]),
  lacoDosPadroes('maior', [0, 1, 2]),
  lacoDaRelacao('maior', false, 0),
  lacoDaRelacao('menor', true, 9),
  lacoDaRelacao('menor-harmonica', false, 2),
];
