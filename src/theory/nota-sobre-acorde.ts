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
import { buildChord, buildScale, CHORDS, intervalBetween, midi, mod, type ChordId, type ModoDoCampo, type Note } from './core';

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

/** Uma das doze notas que a melodia pode ser, já grafada e nomeada por grau. */
export interface GrauCromatico {
  /** Como se chama: `1`, `♭2`, `2`, `♭3`… */
  label: string;
  nota: Note;
  /** A nota pertence ao campo escolhido, ou é de fora dele? */
  noCampo: boolean;
}

/** Os cinco graus que não estão na escala maior, nomeados como ela os nomeia. */
const ALTERADOS = [2, 3, 5, 6, 7];

/**
 * As doze notas que a melodia pode ser sobre um campo, **grafadas certo**.
 *
 * O Paulo pediu notas de fora da escala (07/11/2026), e o exemplo dele — *"uma 6♭ na escala
 * maior"* — é justamente o caso em que a grafia erra fácil: em Dó, ♭6 é **Lá♭**, nunca Sol♯.
 *
 * **Os graus se nomeiam sempre contra a escala MAIOR da tônica**, qualquer que seja o campo
 * escolhido. É como se fala — em Lá menor, o Dó continua sendo "♭3" e o Dó♯ é "3" —, e resolve a
 * grafia sozinho: cada nota de fora é um grau da maior **rebaixado**, então a letra vem do grau e
 * o acidente vem da alteração. Nada de tabela por classe de altura, que é onde Lá♭ vira Sol♯.
 *
 * ⚠️ O trítono sai como **♭5**, e não ♯4 — para os cinco alterados ficarem todos em bemol, que é
 * como a fileira aparece nos métodos. Os dois nomes são defensáveis; este é escolha, não dedução.
 */
export function notasCromaticas(tonic: Note, modo: ModoDoCampo): GrauCromatico[] {
  const maior = buildScale(tonic, 'maior');
  const doCampo = new Set(buildScale(tonic, modo).map(n => mod(midi(n) - midi(tonic), 12)));

  const todas: GrauCromatico[] = maior.map((nota, i) => ({ label: String(i + 1), nota, noCampo: false }));
  for (const g of ALTERADOS) {
    const base = maior[g - 1];
    todas.push({ label: `♭${g}`, nota: { ...base, acc: base.acc - 1 }, noCampo: false });
  }
  return todas
    .map(x => ({ ...x, noCampo: doCampo.has(mod(midi(x.nota) - midi(tonic), 12)) }))
    .sort((a, b) => mod(midi(a.nota) - midi(tonic), 12) - mod(midi(b.nota) - midi(tonic), 12));
}

/**
 * O intervalo trazido para dentro da oitava: a 11ª vira 4ª, a 9ª vira 2ª.
 *
 * Existe porque o número composto é **artefato do nosso voicing**, não da relação. O mesmo Dó sai
 * como 6ª sobre Mi menor e como 11ª sobre Sol só porque a melodia foi parar mais longe num caso
 * que no outro — e isso atrapalha justamente a comparação que o exercício quer. O Paulo pediu os
 * dois, com o reduzido por padrão.
 *
 * A oitava justa **não** vira uníssono: "uníssono" não descreveria uma nota que soa uma oitava
 * acima da fundamental.
 */
export function reduzir(iv: { num: number; semis: number }): { num: number; semis: number } {
  // Tira oitavas inteiras das DUAS medidas ao mesmo tempo, e para na oitava — nunca abaixo dela.
  //
  // A primeira versão usava resto (`% 7` e `% 12`) e quebrava na **oitava diminuta**: Lá até Lá♭
  // é 8ª com 11 semitons, e o resto a transformava em "uníssono de 11 semitons", que não existe —
  // a tela mostrou `1?`. Oitava alterada continua sendo oitava: não há 7ª entre duas notas Lá.
  let { num, semis } = iv;
  while (num > 8) { num -= 7; semis -= 12; }
  return { num, semis };
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
 * A melodia numa oitava que fica acima de **todos** os acordes dados.
 *
 * `vozear` põe a nota acima de UM acorde, e com isso ela sobe e desce de oitava conforme o acorde
 * muda. Numa tela em que *"a nota fica parada e o acorde troca por baixo"* (o desenho do Paulo),
 * isso se ouve como a melodia pulando — o contrário do exercício. Aqui a oitava é escolhida uma
 * vez, contra o campo inteiro, e a nota não se mexe mais.
 */
export function melodiaAcimaDe(acordes: readonly (readonly Note[])[], melodia: Note, base: Note): Note {
  const topo = Math.max(...acordes.flat().map(midi));
  let m: Note = { ...melodia, oct: base.oct };
  while (midi(m) <= topo) m = { ...m, oct: m.oct + 1 };
  return m;
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

/**
 * Acomoda acorde e melodia em oitavas para que a melodia seja a voz de cima (ou de baixo).
 *
 * **Mexe primeiro no acorde, e só na melodia se precisar** — e a ordem é o ponto. A primeira
 * tentativa subia a melodia acima do acorde inteiro, e eu medi: MIDI 100, 2637 Hz no pior caso.
 * Estridente, e incantável, num exercício cuja dica é "cante a nota".
 *
 * Então:
 *
 * 1. desce o acorde o mínimo para ficar **inteiro abaixo** da melodia. Se o acorde continuar
 *    dentro da região, pronto — a melodia nem se move, e fica onde a região a pôs;
 * 2. se descer tirasse o acorde da região, o acorde fica e **a melodia sobe o mínimo para não ser
 *    mais grave que a fundamental do acorde**. Uma oitava resolve, e o pior caso vai a 1319 Hz, não
 *    a 2637.
 *
 * O passo 2 existe porque sem ele a guarda da região devolvia o acorde para cima da melodia e
 * recriava justamente o que o Paulo reclamou. Medido: era 51% dos casos, e a versão só com o passo
 * 1 ainda deixava uma fração — que eu primeiro li como zero por arredondar a porcentagem.
 *
 * Os deslocamentos são **um só para o acorde inteiro** e **um só para a melodia inteira**: um
 * acorde é um bloco, e mover vozes soltas mudaria a inversão; uma célula é um contorno, e mover
 * notas soltas quebraria o desenho que a pessoa tenta identificar.
 *
 * `limites` são o piso e o teto **da região em vigor**, nunca um número escrito aqui — tentei com
 * um chão absoluto e o teste de região pegou: o acorde saía por baixo do piso configurado.
 */
export function acomodarMelodiaEAcorde(
  acorde: readonly number[],
  melodia: readonly number[],
  melodiaFica: 'acima' | 'abaixo',
  limites: { lo: number; hi: number },
): { acorde: number[]; melodia: number[] } {
  const desloca = (ns: readonly number[], d: number) => ns.map(n => n + d);
  if (melodiaFica === 'acima') {
    let d = 0;
    while (Math.max(...acorde) + d >= Math.min(...melodia)) d -= 12;
    if (Math.min(...acorde) + d >= limites.lo) return { acorde: desloca(acorde, d), melodia: [...melodia] };
    let m = 0;
    while (Math.min(...melodia) + m < Math.min(...acorde)) m += 12;
    return { acorde: [...acorde], melodia: desloca(melodia, m) };
  }
  let d = 0;
  while (Math.min(...acorde) + d <= Math.max(...melodia)) d += 12;
  if (Math.max(...acorde) + d <= limites.hi) return { acorde: desloca(acorde, d), melodia: [...melodia] };
  let m = 0;
  while (Math.max(...melodia) + m > Math.max(...acorde)) m -= 12;
  // E a melodia também não sai da região: descer por baixo do piso seria trocar um defeito por
  // outro. Quando não há oitava livre, aceita-se a sobreposição parcial.
  while (Math.min(...melodia) + m < limites.lo) m += 12;
  return { acorde: [...acorde], melodia: desloca(melodia, m) };
}
