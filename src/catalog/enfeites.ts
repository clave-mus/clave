import { ALTERADOS, EXTENSOES, comMesmoNucleo, type ChordId } from '../theory/core';
import { pick } from './helpers';

/**
 * **Enfeitar o acorde de um grau**: pendurar extensão ou alteração **sem trocar o acorde**.
 *
 * Nasceu dentro da `tonica-de-ouvido` em 15/11 e mudou de casa em 19/11, quando o Paulo pediu o
 * mesmo no `ouvido-campo`: *"adicionar inversões e extensões/voicings diatônicas (ou não
 * diatônicos, como #9 em dominante e afins) pros acordes"*. Motor duplicado é proibido aqui, e esta
 * função é motor.
 *
 * **Quem decide o que combina com o quê é `comMesmoNucleo`**, não uma tabela de gosto: ela devolve
 * as qualidades cujo núcleo (os graus até a sétima) é idêntico ao do acorde base. Daí sai de graça
 * a regra que o Paulo enunciou — `♯9`, `♭9` e `♭13` só grudam em dominante, porque só o dominante
 * tem o núcleo delas.
 *
 * A base **continua no sorteio**: pedir extensões não quer dizer que todo acorde venha enfeitado,
 * senão o exercício troca uma roupa fixa por outra.
 */
export function qualidadeEnfeitada(base: ChordId, familias: readonly string[]): ChordId {
  return pick([base, ...enfeitesDe(base, familias)]);
}

/** Os enfeites possíveis para um acorde, dadas as famílias ligadas. Vazio é resposta legítima. */
export function enfeitesDe(base: ChordId, familias: readonly string[]): ChordId[] {
  const permitidas: ChordId[] = [
    ...(familias.includes('extensoes') ? EXTENSOES : []),
    ...(familias.includes('alterados') ? ALTERADOS : []),
  ];
  return comMesmoNucleo(base).filter(id => permitidas.includes(id));
}
