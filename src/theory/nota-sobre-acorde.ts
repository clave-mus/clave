// Como uma nota da melodia se relaciona com o acorde embaixo dela.
//
// O motor da ideia do Paulo (07/11/2026): fixar uma nota da escala e ouvir cada acorde do campo
// harmônico por baixo dela, percebendo onde ela é nota do acorde e onde ela atrita.
//
// **Este arquivo só apura FATOS**, e isso é decisão dele: *"vale gerar o fato. Não precisamos pôr
// juízo."* Então aqui não se diz que algo soa bem, feio, estável ou tenso — diz-se qual grau a nota
// é, qual intervalo ela forma com a fundamental, e quais notas do acorde ficam a um semitom dela.
// A única palavra avaliativa que o produto usa — *"pode gerar tensão"* — é escolha dele, vale **só**
// onde há semitom, e mora na camada de texto, não aqui.
//
// A frase se monta em `src/i18n/`, como todo texto. Aqui não há string.
import { buildChord, CHORDS, intervalBetween, midi, mod, type ChordId, type Note } from './core';

/**
 * Uma nota do acorde a um semitom da melodia — a origem matemática do atrito, e o único critério
 * que o Paulo aceitou para o app dizer "pode gerar tensão".
 *
 * **Mede a distância REAL entre as alturas, não entre as classes de altura.** A diferença importa:
 * Si e Dó são sempre "um semitom" como classe, mas Si3 contra Dó5 é uma sétima maior esticada, que
 * não atrita como Si4 contra Dó5. Como o voicing é nosso (a melodia vai sempre acima do acorde),
 * dá para medir o que de fato soa.
 */
export interface Atrito {
  /** Grau do acorde (1, 3, 5, 7) da nota que atrita. */
  grau: number;
  nota: Note;
  /** Distância real em semitons: 1 (segunda menor) ou 13 (nona menor). */
  semitons: number;
}

export interface RelacaoNotaAcorde {
  /** O grau do acorde que a melodia é (1, 3, 5, 7), ou `null` quando ela não pertence a ele. */
  grauDoAcorde: number | null;
  /** O intervalo da fundamental do acorde até a melodia, como soa (pode passar da oitava). */
  intervalo: { num: number; semis: number };
  /** As notas do acorde a um semitom da melodia. Vazio quando não há nenhuma. */
  atritos: Atrito[];
}

/**
 * Monta o acorde em posição fundamental e põe a melodia **acima da nota mais aguda dele**.
 *
 * As duas coisas são do desenho, não arbitrárias: em posição fundamental o grau continua audível, e
 * com a melodia por cima ela se ouve como melodia em vez de se fundir numa voz do acorde. Era o
 * sentido de *"com a nota em cima"*.
 */
export function vozear(root: Note, chord: ChordId, melodia: Note): { acorde: Note[]; melodia: Note } {
  const acorde = buildChord(root, chord);
  const topo = Math.max(...acorde.map(midi));
  let m: Note = { ...melodia, oct: root.oct };
  while (midi(m) <= topo) m = { ...m, oct: m.oct + 1 };
  return { acorde, melodia: m };
}

/**
 * Os fatos da relação entre a melodia e o acorde, já vozeados.
 *
 * Pertencer ao acorde é conferido por **classe de altura**, não por grafia: é um exercício de
 * ouvido, e Sol♯ e Lá♭ são a mesma tecla. O nome do intervalo, esse sim, usa a grafia — é o que faz
 * uma segunda aumentada não virar terça menor.
 */
export function analisar(acorde: readonly Note[], melodia: Note, chord: ChordId): RelacaoNotaAcorde {
  const graus = CHORDS[chord].degs.map(([num]) => num);
  const pcMel = mod(midi(melodia), 12);

  let grauDoAcorde: number | null = null;
  const atritos: Atrito[] = [];
  acorde.forEach((nota, i) => {
    if (mod(midi(nota), 12) === pcMel) grauDoAcorde ??= graus[i];
    const d = Math.abs(midi(melodia) - midi(nota));
    if (d === 1 || d === 13) atritos.push({ grau: graus[i], nota, semitons: d });
  });

  return { grauDoAcorde, intervalo: intervalBetween(acorde[0], melodia), atritos };
}
