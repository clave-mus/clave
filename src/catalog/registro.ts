// O que vai para o REGISTRO (histórico e tentativas).
//
// Módulo folha, de propósito: só importa TIPOS de `params.ts`. `params.ts` importa o store em tempo
// de execução, e o store importa `attempts`, que usa esta função — trazê-la de `params.ts` fechava um
// ciclo de imports e derrubava a inicialização (`TUNINGS` ainda indefinido).
import type { GlobalParams, ParametroDePratica, ParametrosDePratica } from './params';

/**
 * O que vai para o REGISTRO (histórico e tentativas): `instrument` e `tuning`, que valem sempre, mais
 * só os parâmetros de prática que o item de fato respeita.
 *
 * Gravar o valor resolvido de todos faria o histórico afirmar "região: Média" para um exercício de
 * armadura, que não tem região — o padrão passando por escolha. É o mesmo defeito do `tempo` global,
 * que o Progresso mostrava como "80 bpm" até em exercício de ouvido (decisão 87).
 */
export type ParamsRegistrados = Pick<GlobalParams, 'instrument' | 'tuning'> & ParametrosDePratica;

export function paramsRegistraveis(p: GlobalParams, respeita: readonly ParametroDePratica[] = []): ParamsRegistrados {
  const out: ParamsRegistrados = { instrument: p.instrument, tuning: p.tuning };
  for (const k of respeita) (out as Record<string, unknown>)[k] = p[k];
  return out;
}
