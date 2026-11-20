// **Voicings de teclado**: como as notas de um acorde se distribuem entre as duas mãos.
//
// Pedido do Paulo em 15/11, para o `tonica-de-ouvido`: *"ter um gerador de voicings no piano bem
// diverso pra dificultar. ter acordes alterados também e tal. variar bastante! acho que ainda não
// temos um motor pra isso."* Ele estava certo — havia `buildChord` (posição fundamental e inversão
// por rotação) e um `vozear` que acomoda um acorde sob uma melodia, e nada que distribuísse as notas
// como um pianista faz.
//
// Nasce **compartilhado** de propósito: ele pediu que o `ouvido-acorde` também passe a usá-lo
// (*"com esse novo motor, podemos pensar em expandir o acordes de ouvido também"*), e motor
// duplicado é proibido neste projeto.
//
// ## O que é um voicing aqui
//
// Duas mãos. A esquerda toca uma ou duas notas na região grave; a direita, de duas a quatro acima
// dela. As decisões que vieram da conversa:
//
// - **a fundamental pode ser omitida**, por parâmetro e desligado por padrão. Num voicing de jazz a
//   terça e a sétima definem o acorde e o baixista toca a raiz — e para o exercício isso é o degrau
//   difícil: achar uma tônica que não está soando é o que se faz tocando em grupo;
// - **a esquerda começa no Dó3** (131 Hz) e a direita vai ao Dó6. Não é escolha estética: medimos em
//   15/11 que abaixo de 300 Hz o alto-falante de um celular não reproduz nada, e um baixo em Dó2
//   repetiria o craquelado que o Paulo acabou de relatar;
// - **a quinta é a primeira a sair** quando o acorde tem extensão e as mãos não dão conta. É o que
//   um pianista faz: a quinta é a nota menos informativa de uma tétrade com nona.
import { CHORDS, midi, mod, type ChordId, type Note } from './core';

/** A região de cada mão, em MIDI. Ver a nota sobre os 300 Hz. */
export const MAO_ESQUERDA = { lo: 48, hi: 64 } as const;
export const MAO_DIREITA = { lo: 55, hi: 84 } as const;

export interface OpcoesDeVoicing {
  /** Omitir a fundamental: a terça e a sétima seguram o acorde, e o baixo fica implícito. */
  semFundamental?: boolean;
  /** Quantas notas no total. Sem isto, o tamanho sai da qualidade. */
  quantas?: number;
  /** Teto da mão direita, para subir tudo quando o alto-falante é pequeno. */
  teto?: number;
  /** Piso da mão esquerda. Ver a nota sobre os 300 Hz do alto-falante de celular. */
  piso?: number;
}

export interface Voicing {
  /** As notas da mão esquerda, de baixo para cima. */
  esquerda: Note[];
  /** As notas da mão direita, de baixo para cima. */
  direita: Note[];
  /** Todas, em ordem de altura — o que soa. */
  todas: Note[];
  /** Quais graus do acorde ficaram de fora (5 quando a quinta sai, 1 sem fundamental). */
  omitidos: number[];
}

/**
 * **Os eixos da variação**, e eles são quatro — a primeira versão tinha dois e rendia 2 a 4 voicings
 * por qualidade, longe do *"variar bastante"* que o Paulo pediu.
 *
 * 1. **qual grau vai ao baixo** (a fundamental, a terça, a quinta ou a sétima);
 * 2. **em que oitava** esse baixo cai, dentro da região da mão esquerda;
 * 3. **quais notas sobram** — a quinta sai quando o acorde tem extensão, como um pianista faz;
 * 4. **em que ordem** as de cima se empilham: é este eixo que faltava, e é o que mais multiplica.
 *    Qualquer ordem é um voicing legítimo, porque cada nota pode estar em qualquer oitava; o que
 *    decide é caber na mão.
 *
 * As restrições são de mão, não de gosto: a esquerda abre até uma oitava, a direita até uma nona, e
 * a direita começa acima da esquerda. Nada aqui diz que um voicing é bonito — o projeto não põe
 * juízo onde pode pôr fato.
 */
const VAO_ESQUERDA = 12;
const VAO_DIREITA = 14;

/** As permutações de uma lista pequena — as ordens em que as notas de cima podem se empilhar. */
function ordens(xs: readonly number[]): number[][] {
  if (xs.length <= 1) return [[...xs]];
  return xs.flatMap((x, i) => ordens([...xs.slice(0, i), ...xs.slice(i + 1)]).map(r => [x, ...r]));
}

/**
 * A altura de um grau do acorde, na oitava **mais baixa** que ainda fica em `piso` ou acima.
 *
 * Desce e sobe, e descer é o conserto: eu só subia, então com a fundamental escrita em Dó4 o baixo
 * nunca alcançava o Dó3 que a mão esquerda cobre — e o eixo da oitava do baixo, que o comentário
 * promete, não existia na prática. As tríades ficavam com quatro voicings porque o espaço estava
 * fechado por este detalhe.
 */
function alturaDoGrau(fundamental: Note, id: ChordId, grau: number, piso: number): Note | null {
  const deg = CHORDS[id].degs.find(([num]) => num === grau);
  if (!deg) return null;
  let m = midi(fundamental) + deg[1];
  while (m - 12 >= piso) m -= 12;
  while (m < piso) m += 12;
  return notaDeAltura(m);
}

/** A grafia de uma altura — sustenido, a convenção interna; quem grafa pela tonalidade é o item. */
function notaDeAltura(m: number): Note {
  const pc = mod(m, 12);
  return {
    letter: [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc] as Note['letter'],
    acc: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][pc],
    oct: Math.floor(m / 12) - 1,
  };
}

/**
 * **Todos os voicings de um acorde**, para o sorteio escolher um.
 *
 * Enumera porque o espaço é pequeno — dezenas por qualidade, não milhares — e porque enumerar deixa
 * o teste contar. No `mapa-do-braco` foi o contrário: ali havia trinta mil combinações e o Paulo
 * mandou gerar proceduralmente, com razão. A diferença é o tamanho, e vale medir antes de decidir.
 */
export function voicingsDe(fundamental: Note, id: ChordId, o: OpcoesDeVoicing = {}): Voicing[] {
  const teto = o.teto ?? MAO_DIREITA.hi;
  const piso = o.piso ?? MAO_ESQUERDA.lo;
  const graus = CHORDS[id].degs.map(([num]) => num);
  const temExtensao = graus.some(n => n > 7);
  const out: Voicing[] = [];
  const vistos = new Set<string>();

  const candidatosAoBaixo = (o.semFundamental ? graus.filter(n => n !== 1) : graus).filter(n => n <= 7);
  for (const grauNoBaixo of candidatosAoBaixo) {
    for (const semQuinta of temExtensao && graus.includes(5) ? [false, true] : [false]) {
      const omitidos = [...(o.semFundamental ? [1] : []), ...(semQuinta ? [5] : [])];
      const deCima = graus.filter(n => n !== grauNoBaixo && !omitidos.includes(n));
      if (deCima.length < 2 || deCima.length > 4) continue;
      /**
       * **O eixo da oitava do baixo** — que o comentário acima prometia e o código não cumpria.
       *
       * Eu pegava só a oitava mais baixa que cabe, e por isso as tríades rendiam quatro voicings:
       * com três notas, trocar o baixo e a ordem esgota rápido. Variando a oitava do baixo dentro da
       * mão esquerda, o mesmo grau no baixo dá dois pontos de partida diferentes, e o que vem acima
       * se reorganiza a partir dali.
       */
      const baixos: Note[] = [];
      for (let m = midi(alturaDoGrau(fundamental, id, grauNoBaixo, piso) ?? fundamental); m <= MAO_ESQUERDA.hi; m += 12) {
        baixos.push(notaDeAltura(m));
      }
      for (const baixo of baixos) {
      for (const ordem of ordens(deCima)) {
        const v = empilhar(fundamental, id, baixo, ordem, omitidos, teto);
        if (!v) continue;
        // Duas ordens diferentes podem dar as mesmas alturas; o que vale é o som.
        const chave = v.todas.map(midi).join(',');
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        out.push(v);
      }
      }
    }
  }
  return out;
}

/**
 * Empilha as notas de cima na ordem dada, cada uma acima da anterior, e recusa o que a mão não
 * alcança. É aqui que a ordem se transforma em alturas: pedir a quinta antes da terça põe a quinta
 * embaixo e empurra a terça para a oitava seguinte, o que é um voicing diferente e legítimo.
 */
function empilhar(
  fundamental: Note, id: ChordId, baixo: Note, ordem: readonly number[], omitidos: number[], teto: number,
): Voicing | null {
  const direita: Note[] = [];
  let piso = Math.max(midi(baixo) + 3, MAO_DIREITA.lo);
  for (const grau of ordem) {
    const n = alturaDoGrau(fundamental, id, grau, piso);
    if (!n || midi(n) > teto) return null;
    direita.push(n);
    piso = midi(n) + 1;
  }
  if (midi(direita[direita.length - 1]) - midi(direita[0]) > VAO_DIREITA) return null;
  if (midi(direita[0]) - midi(baixo) > VAO_ESQUERDA + VAO_DIREITA) return null;
  const todas = [baixo, ...direita].sort((a, b) => midi(a) - midi(b));
  return { esquerda: [baixo], direita, todas, omitidos };
}

// ---------------------------------------------------------------------------
// **Condução de vozes**: escolher, entre os voicings de um acorde, o que move menos.
//
// Veio de `tools/Backing.tsx` em 19/11, quando o motor saiu de dentro da tela — e sair foi o que o
// tornou reusável: a cadência de contexto dos itens de ouvido usa a mesma peça desde então.
/**
 * **O voicing do acompanhamento, com condução de vozes** — e isto é o conserto do defeito mais audível
 * da ferramenta, achado medindo em 19/11.
 *
 * O que havia: `55 + mod(pc + semi - 55, 12)`, que **colapsa o acorde numa oitava só**. Medido, o que
 * saía: dó maior em segunda inversão (G3 C4 E4), o Cmaj7 com o si colado no dó (G3 B3 C4 E4) e o Am7
 * com o sol colado no lá (G3 A3 C4 E4) — aglomerado na região grave, que é onde isso mais encardi. E
 * nenhuma relação com o acorde anterior: cada um era calculado sozinho.
 *
 * O que entra: `theory/voicings.ts`, o motor que a Tônica de ouvido usa — duas mãos, qualquer grau no
 * baixo, a quinta saindo quando o acorde tem extensão. De todos os voicings do acorde, escolhe-se o
 * que **move menos** em relação ao que soou antes: é o que faz um acompanhamento soar tocado em vez
 * de digitado.
 *
 * O primeiro acorde não tem anterior, e aí a referência é o **centro** (dó4 e redor): sem isso a
 * progressão podia começar no canto do teclado e descer a vida toda.
 */
/** O centro de referência quando não há acorde anterior: a região do dó central. */
const CENTRO = [55, 60, 64, 67];
/** A distância entre dois acordes: cada nota do novo até a mais próxima do antigo, somada. */
export function distanciaEntreAcordes(novo: readonly number[], antigo: readonly number[]): number {
  const dele = (m: number) => Math.min(...antigo.map(a => Math.abs(a - m)));
  return novo.reduce((soma, m) => soma + dele(m), 0) / novo.length;
}
/**
 * **Quanto este voicing encardi embaixo** — e esta peça nasceu de medir a anterior.
 *
 * Mover pouco, sozinho, escolhe o voicing mais **compacto**: medindo com só esse critério, o Cmaj7
 * saía `G3 B3 C4 E4` (si colado no dó) e o Am7 `E3 G3 A3 C4` (sol colado no lá) — exatamente o
 * aglomerado que eu havia criticado na função antiga. Um pianista não põe segunda na região grave.
 *
 * A regra é de prática, e por isso é fato e não gosto: **abaixo do dó central, nada menor que uma
 * terça menor** entre vozes vizinhas. Cada infração custa, e quanto mais grave, mais custa.
 */
export function custoDeEncardimento(ms: readonly number[]): number {
  let custo = 0;
  for (let i = 1; i < ms.length; i++) {
    const intervalo = ms[i] - ms[i - 1];
    if (ms[i - 1] < 60 && intervalo < 3) custo += (3 - intervalo) * (ms[i - 1] < 52 ? 3 : 2);
  }
  return custo;
}
export function voicingConduzido(root: Note, type: ChordId, anterior: readonly number[] | null, teto = 84): number[] {
  /**
   * O teto é **dó6** e não sol6: num acompanhamento o acorde não pode brigar com a melodia de quem
   * está tocando por cima, e o motor sozinho chega a alturas que invadem essa faixa.
   */
  const opcoes = voicingsDe(root, type, { teto });
  if (!opcoes.length) return CHORDS[type].degs.map(([, semi]) => 55 + mod(midi(root) + semi - 55, 12)).sort((a, b) => a - b);
  const alvo = anterior ?? CENTRO;
  let melhor = opcoes[0];
  let menor = Infinity;
  for (const v of opcoes) {
    const ms = v.todas.map(midi);
    // o critério é mover pouco; o desempate é a nota mais aguda ficar perto da de antes
    const d = distanciaEntreAcordes(ms, alvo) + custoDeEncardimento(ms) + Math.abs(Math.max(...ms) - Math.max(...alvo)) / 24;
    if (d < menor) { menor = d; melhor = v; }
  }
  return melhor.todas.map(midi).sort((a, b) => a - b);
}

/**
 * **Conduzir um acorde qualquer**, dado em alturas MIDI de partida (a fundamental e os graus já
 * somados), para perto do acorde anterior.
 *
 * Irmã de `voicingConduzido`, e existe porque nem todo acorde do app tem `ChordId`: a cadência de
 * contexto vem de `acordeDoCampo`, que devolve **semitons sobre a tônica** — pentatônica inclusive,
 * onde não há qualidade nomeada. Esta aqui trabalha com o conjunto de classes e nada mais.
 *
 * Como funciona: cada nota pode subir ou descer oitavas dentro da faixa; de todas as combinações,
 * vale a que **move menos** em relação ao acorde anterior, sem encardir embaixo e sem abrir mais que
 * `vao`. Sem acorde anterior, a referência é o centro — o mesmo critério do acompanhamento.
 *
 * `baixo` prende a nota mais grave a uma classe de altura, para o acorde ficar em posição
 * fundamental quando isso importa.
 */
export function conduzirAcorde(
  base: readonly number[], anterior: readonly number[] | null,
  { lo = 48, hi = 84, vao = 16, baixo }: { lo?: number; hi?: number; vao?: number; baixo?: number } = {},
): number[] {
  const porNota = base.map(m => {
    const oitavas: number[] = [];
    for (let x = lo + mod(m - lo, 12); x <= hi; x += 12) oitavas.push(x);
    return oitavas.length ? oitavas : [m];
  });
  let melhor: number[] | null = null;
  let menor = Infinity;
  const combinar = (i: number, atual: number[]) => {
    if (i === porNota.length) {
      const ms = [...atual].sort((a, b) => a - b);
      if (ms[ms.length - 1] - ms[0] > vao) return;
      // `baixo` prende a nota mais grave a uma classe: é o que mantém o acorde em posição
      // fundamental quando ele precisa fechar alguma coisa. Ver `conduzirCadencia`.
      if (baixo !== undefined && mod(ms[0], 12) !== mod(baixo, 12)) return;
      const d = distanciaEntreAcordes(ms, anterior ?? CENTRO) + custoDeEncardimento(ms);
      if (d < menor) { menor = d; melhor = ms; }
      return;
    }
    for (const x of porNota[i]) combinar(i + 1, [...atual, x]);
  };
  combinar(0, []);
  return melhor ?? [...base].sort((a, b) => a - b);
}
