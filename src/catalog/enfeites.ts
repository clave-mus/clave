import { ALTERADOS, CHORDS, EXTENSOES, comMesmoNucleo, mod, type ChordId } from '../theory/core';
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
export function qualidadeEnfeitada(base: ChordId, familias: readonly string[], onde?: NoCampo): ChordId {
  return pick([base, ...enfeitesDe(base, familias, onde)]);
}

/**
 * **Onde o acorde está dentro da tonalidade** — é isto que separa enfeite musical de enfeite
 * aleatório, e veio do ouvido do Paulo em 19/11: *"viiø · Bm9♭5 soou mal... Imaj7 · Cmaj7♯11 soou
 * mal... será que tem uma maneira de tornar essas alterações menos aleatórias e mais musicais?"*
 */
export interface NoCampo {
  /** As classes de altura da tonalidade, relativas à tônica (0..11). */
  escala: readonly number[];
  /** Semitons da fundamental do acorde acima da tônica. */
  semi: number;
  /** É o V — o dominante que resolve na tônica? Nele, sair da tonalidade é o vocabulário. */
  dominante: boolean;
}

/**
 * Os enfeites possíveis para um acorde, dadas as famílias ligadas. Vazio é resposta legítima.
 *
 * **Com `onde`, vale a regra da tonalidade** (decidida com o Paulo em 19/11): o enfeite entra se as
 * notas que ele acrescenta forem da tonalidade — **exceto no V**, onde a nota de fora é o ponto.
 *
 * Medido no campo maior, é o que isso remove e o que mantém:
 *
 * | grau | antes | depois |
 * |---|---|---|
 * | `I7M` | 9, 13, ♯11 | 9, 13 — o ♯11 põe um fá♯ em dó maior |
 * | `iii7` | 9, 11 | 11 — a nona do iii é o mesmo fá♯ |
 * | `IV7M` | 9, 13, ♯11 | **as três** — ali o ♯11 é o si natural, o acorde lídio |
 * | `V7` | 9, 13, ♭9, ♯9, ♯11, ♭13 | **as seis** — é dominante |
 * | `viiø` | 9 | nenhum — a nona do viiø é um dó♯ |
 *
 * Repare no par `I7M`/`IV7M`: o **mesmo** ♯11 sai de um e fica no outro, sem ninguém proibir o
 * acorde. É a tonalidade decidindo, que é fato, e não uma lista de gosto.
 *
 * Sem `onde`, nada é filtrado — é o que a `tonica-de-ouvido` fazia antes de 19/11, e o que vale
 * para quem chamar a função fora de um campo harmônico.
 */
export function enfeitesDe(base: ChordId, familias: readonly string[], onde?: NoCampo): ChordId[] {
  const permitidas: ChordId[] = [
    ...(familias.includes('extensoes') ? EXTENSOES : []),
    ...(familias.includes('alterados') ? ALTERADOS : []),
  ];
  const candidatos = comMesmoNucleo(base).filter(id => permitidas.includes(id));
  if (!onde) return candidatos;
  if (onde.dominante) return candidatos;
  const naEscala = new Set(onde.escala.map(pc => mod(pc, 12)));
  const doAcorde = new Set(CHORDS[base].degs.map(([, s]) => mod(onde.semi + s, 12)));
  return candidatos.filter(id => CHORDS[id].degs
    // só as notas que o enfeite ACRESCENTA: as do acorde base já estavam lá, e uma delas fora da
    // escala (o V7 do menor, por exemplo) não é problema do enfeite.
    .map(([, s]) => mod(onde.semi + s, 12))
    .every(pc => doAcorde.has(pc) || naEscala.has(pc)));
}
