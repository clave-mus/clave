/**
 * **A nota comum**: uma nota parada, e os acordes em que ela cabe com papéis diferentes.
 *
 * Desenho do Paulo em 26/11/2026, inspirado no *ear training for crazy people* do Tim Collins:
 *
 * > *"se escolhe uma nota. por exemplo, dó. essa nota então assume diferentes papéis em diferentes
 * > acordes, e o aluno tem que solfejar os arpejos desses acordes."*
 *
 * Dó é a fundamental de Dó maior, a terça de Lá menor, a terça de Lá♭ maior, a quinta de Fá, a
 * sétima de Ré menor com sétima, a ♭9 de Si7(♭9) — e em cada caso o que se canta é outro desenho,
 * começando sempre da mesma altura. É esse o exercício: a nota não se move, o acorde se move em
 * volta dela.
 *
 * ## O que é um papel
 *
 * Uma **qualidade** e **qual grau dela a nota comum ocupa** — `('menor', 3)` é "dó é a terça de um
 * acorde menor". A fundamental sai da conta: `fundamental = notaComum − semitons do grau`, e os
 * semitons vêm de `CHORDS[qualidade].degs`, a mesma tabela que o resto do app usa. Não há tabela
 * nova aqui, e é de propósito: papel é uma leitura do acorde, não um objeto à parte.
 *
 * ## O percurso, e por que ele é parâmetro
 *
 * O que se canta é um caminho pelas notas do acorde, e o Paulo deixou dois em aberto em 26/11:
 *
 * > *"não sei o que vai soar melhor - isso que você sugeriu ou algo como começa na nota fixa, desce
 * > até a mais grave passando por todas as notas e se não tocou todas notas ainda, sobe de novo até
 * > a mais aguda. mas podemos começar com o que você sugeriu."*
 *
 * Então `ancora-e-sobe` nasce sozinho, e o tipo já é uma união: o segundo percurso vira um `case`,
 * não uma reforma.
 *
 * ## A inversão é **quem é o chão**
 *
 * Num arpejo cantado não existe acompanhamento, e aí a inversão só pode ser uma coisa: qual nota é
 * a mais grave. Com isso os oito exemplos dele viram o caso "fundamental no baixo" de uma regra só,
 * e inverter muda o desenho que se canta — que é justamente a habilidade. Com dó como terça de lá
 * menor:
 *
 * | baixo | o que se canta |
 * |---|---|
 * | fundamental | dó · lá dó mi |
 * | terça | dó mi lá |
 * | quinta | dó · mi lá dó |
 */
import { CHORDS, mod, type ChordId } from './core';

/** Um papel: a qualidade do acorde e o grau que a nota comum ocupa nele. */
export interface Papel { qualidade: ChordId; grau: number }

export type Percurso = 'ancora-e-sobe';

export interface Arpejo {
  /** A fundamental do acorde, em MIDI. Pode estar abaixo da nota comum. */
  fundamental: number;
  /** Quem fica no chão: o grau do acorde que vai ao baixo (1 = fundamental). */
  baixo: number;
  /** As alturas na ordem em que se canta, começando pela nota comum. */
  alturas: number[];
  /** As notas do acorde, graves para agudas — o que soa quando se toca o acorde inteiro. */
  acorde: number[];
}

/** Os papéis que uma qualidade oferece: um por grau dela. */
export const papeisDa = (qualidade: ChordId): Papel[] =>
  CHORDS[qualidade].degs.map(([grau]) => ({ qualidade, grau }));

/** Os semitons de um grau dentro da qualidade — `null` quando ela não tem esse grau. */
export function semisDoGrau(qualidade: ChordId, grau: number): number | null {
  return CHORDS[qualidade].degs.find(([n]) => n === grau)?.[1] ?? null;
}

/**
 * **A alteração do grau**, em semitons, contra o que ele seria numa escala maior: `-1` na ♭9 de um
 * `7(b9)`, `0` na terça de um maior, `-1` na terça de um menor.
 *
 * Serve ao texto: "dó é a **nona bemol** de um acorde dominante". A qualidade já carrega parte da
 * informação ("de um acorde menor" diz que a terça é menor), então quem chama decide quando o
 * adjetivo ajuda — ver `rotuloDoPapel`, no catálogo.
 */
const NATURAL: Record<number, number> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 9: 14, 11: 17, 13: 21 };
export function alteracaoDoGrau(qualidade: ChordId, grau: number): number | null {
  const semis = semisDoGrau(qualidade, grau);
  const natural = NATURAL[grau];
  return semis === null || natural === undefined ? null : semis - natural;
}

/**
 * **O arpejo de um papel**, a partir da nota comum.
 *
 * `baixo` é o grau que vai ao chão — 1 é a posição fundamental, e é o padrão do item. O percurso
 * `ancora-e-sobe` canta a nota comum e depois o acorde inteiro, do chão para cima.
 *
 * Tudo em MIDI, sem grafia: quem escreve os nomes é o catálogo, que sabe a tonalidade.
 */
export function arpejoDoPapel(
  notaComum: number, papel: Papel,
  /**
   * `percurso` entra na assinatura desde já, e de propósito: ele deixou o segundo caminho em aberto
   * (*"começa na nota fixa, desce até a mais grave passando por todas as notas e... sobe de novo"*),
   * e quem chama já declara qual quer. Hoje há um só, então ele não muda nada — muda quando houver
   * dois, sem que nenhum chamador precise ser reescrito.
   */
  { baixo = 1, percurso = 'ancora-e-sobe' as Percurso }: { baixo?: number; percurso?: Percurso } = {},
): Arpejo | null {
  void percurso;
  const semisDaNota = semisDoGrau(papel.qualidade, papel.grau);
  const semisDoBaixo = semisDoGrau(papel.qualidade, baixo);
  if (semisDaNota === null || semisDoBaixo === null) return null;
  const graus = CHORDS[papel.qualidade].degs;

  /**
   * **A pilha natural do acorde**, a partir de uma fundamental qualquer: cada grau nos seus
   * semitons, com as extensões já acima da oitava (a ♭9 é +13, não +1).
   *
   * Manter a extensão em cima não é detalhe de registro: dobrá-la para dentro da oitava a
   * transformaria noutro acorde. Medi isso em 26/11 — a primeira versão dobrava, e o Si7(♭9) do
   * exemplo 7 dele saía com o dó **abaixo** do resto, deixando a âncora fora do próprio arpejo.
   */
  const pilha = graus.map(([, semis]) => semis);

  /**
   * **A inversão roda a pilha**: o que estiver abaixo do baixo escolhido sobe de oitava, até o
   * baixo ser o chão. É o que "inversão" quer dizer num arpejo cantado, onde não há acompanhamento
   * — a nota mais grave é a única coisa que pode ser o baixo.
   */
  const rodada = pilha.map(semis => {
    let s = semis;
    while (s < semisDoBaixo) s += 12;
    return s;
  }).sort((a, b) => a - b);

  /**
   * **E tudo desliza por oitavas até a nota comum cair na âncora.** É o que amarra o desenho ao
   * ponto fixo do exercício: a nota não se move, o acorde se move em volta dela. Sem este passo, a
   * terça no baixo de lá menor subia o dó uma oitava e o aluno começaria a cantar noutro lugar.
   */
  const daNota = rodada.find(s => mod(s - semisDaNota, 12) === 0) as number;
  const fundamental = notaComum - daNota;
  const acorde = rodada.map(s => fundamental + s);

  // A âncora primeiro, e depois o acorde do chão para cima — sem repeti-la quando ela já é o chão,
  // que é o caso em que o desenho começa subindo.
  const alturas = acorde[0] === notaComum ? acorde : [notaComum, ...acorde];
  return { fundamental, baixo, alturas, acorde };
}

/** Os graus que podem ir ao baixo numa qualidade — a lista de inversões possíveis. */
export const inversoesDe = (qualidade: ChordId): number[] => CHORDS[qualidade].degs.map(([n]) => n);

/** A classe de altura de cada nota do arpejo, para conferir contra o acorde. */
export const classesDo = (a: Arpejo): number[] => [...new Set(a.acorde.map(m => mod(m, 12)))];
