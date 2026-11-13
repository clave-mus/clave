/**
 * Sorteio anti-repetição, genérico (`OR-ouvido-relativo.md`, §3.1). A regra é do Paulo: *"nunca a
 * mesma nota duas vezes seguidas, e variar passando por várias, mas com alguma repetição para não
 * ser um shuffle perfeito"*.
 *
 * ## Por que no Player, e não em cada item
 *
 * Toda pergunta nasce num ponto só — o `make` do Player. Em vez de reescrever o sorteio de cada
 * item (cada um sorteia de um jeito: tipo, nota, posição…), o Player faz **amostragem com
 * rejeição sobre a RESPOSTA**: o item gera uniforme como sempre, e a pergunta é aceita com
 * probabilidade igual ao peso da resposta — 0 se ela acabou de sair, subindo a cada rodada. O
 * resultado é exatamente a distribuição com peso que o §3.1 pede, e nenhum item sabe que existe.
 *
 * ## O peso
 *
 * idade 1 (saiu na rodada passada) → 0 · idade 2 → ½ · idade 3 → ¾ · idade 4 → ⅞ … nunca vista → 1.
 * O zero na idade 1 é a regra "nunca duas vezes seguidas"; a subida rápida é o "com alguma
 * repetição" — um shuffle perfeito daria peso 0 até a lista inteira passar.
 *
 * Com o pool minúsculo (duas opções) ou único, as tentativas se esgotam e a última vale: recusar
 * seria pior que repetir — pergunta sempre sai.
 */
import type { Expected, Question } from './types';

/** A identidade da resposta, para efeito de repetição — duas grafias diferentes são respostas diferentes. */
export function assinatura(e: Expected): string {
  switch (e.kind) {
    case 'option': return `o:${e.id}`;
    case 'pitchClass': return `pc:${e.pc}`;
    case 'pitch': return `p:${e.midi}`;
    case 'spelled': return `s:${e.letter}.${e.acc}.${e.oct ?? ''}`;
    case 'chord': return `c:${e.root}.${e.quality}`;
    // Contorno: a assinatura é o conjunto de alturas, com a ordem quando ela importa.
    case 'contorno': return `k:${(e.ordenada === false ? [...e.midis].sort((a, b) => a - b) : e.midis).join(',')}`;
  }
}

/** O peso de sair de novo, pela idade (1 = rodada passada). `null` é nunca vista. */
export const pesoDaIdade = (idade: number | null): number => (idade === null ? 1 : 1 - 2 ** (1 - idade));

/** Quantas rodadas a memória alcança. Além disso o peso já passa de 0,98 — não vale a conta. */
const MEMORIA = 6;
const TENTATIVAS = 8;

// Por item, as assinaturas recentes — a mais nova no fim. Vive no módulo de propósito: sobrevive
// ao Player desmontar (trocar de etapa numa rotina e voltar) e morre com a aba, que é o alcance
// certo para "saiu há pouco".
const HISTORICO = new Map<string, string[]>();

/** Só para teste: esquecer um item (ou tudo). */
export function esquecerSorteio(chave?: string) {
  if (chave === undefined) HISTORICO.clear(); else HISTORICO.delete(chave);
}

/**
 * Gera uma pergunta evitando resposta recém-saída. `rnd` é injetável para o teste ser
 * determinístico, como em `amostrasDeCorda`.
 */
export function sortearSemEco(chave: string, gerar: () => Question, rnd: () => number = Math.random): Question {
  const recentes = HISTORICO.get(chave) ?? [];
  let q = gerar();
  for (let t = 1; t < TENTATIVAS; t++) {
    const pos = recentes.lastIndexOf(assinatura(q.expected));
    const idade = pos === -1 ? null : recentes.length - pos;
    if (rnd() < pesoDaIdade(idade)) break;
    q = gerar();
  }
  HISTORICO.set(chave, [...recentes, assinatura(q.expected)].slice(-MEMORIA));
  return q;
}
