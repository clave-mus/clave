// Mãos livres (F6-1): a pergunta soa, dá tempo de pensar, e a resposta é dita.
//
// **É o único item do contexto "De bolso"** — o que dá para fazer sem olhar e sem as mãos, até
// dirigindo. E é o que a rotina de bolso precisa para ser o que o nome diz.
//
// **Não é motor novo, e isso é o ponto.** Ele reaproveita os exercícios de ouvido que já existem:
// `make()` devolve o som **e a resposta por extenso** (`reveal`), que é exatamente o par de que um
// ciclo sem tela precisa. Acrescentar um objeto aqui é acrescentar uma fonte à lista abaixo.
//
// A pessoa **nunca responde nada**: produz atividade, não evidência (`validation: ['none']`), e isso
// é esperado, não um defeito.
import type { Ctx, Question, SettingValue } from './types';

/** Um objeto que o ciclo sabe tocar, e de qual exercício ele vem. */
export interface Fonte {
  /** O id do objeto, como a pessoa escolhe. */
  id: string;
  /** O exercício de ouvido que gera a pergunta. */
  itemId: string;
  /** A configuração com que ele é chamado. */
  settings: Record<string, SettingValue>;
}

/**
 * As fontes, uma por objeto.
 *
 * `modos` e `escalas` saem do **mesmo** exercício com configurações diferentes — é a decisão 15 em
 * miniatura: dois objetos, um motor. E é por isso que acrescentar "tétrades" ou "graus de uma
 * progressão" aqui não custa tela nenhuma.
 */
export const FONTES: readonly Fonte[] = [
  { id: 'intervalos', itemId: 'ouvido-intervalo', settings: { intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' } },
  { id: 'acordes', itemId: 'ouvido-acorde', settings: { tipos: ['maior', 'menor', '7M', '7', 'm7'], arpejo: true, duracao: 2 } },
  { id: 'escalas', itemId: 'ouvido-escala', settings: { tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'sobe' } },
  { id: 'modos', itemId: 'ouvido-escala', settings: { tipos: ['dorico', 'frigio', 'lidio', 'mixolidio', 'locrio'], direcao: 'sobe' } },
  { id: 'graus', itemId: 'ouvido-celulas', settings: { escala: 'maior', tamanho: '3' } },
  { id: 'notas', itemId: 'ouvido-tecla', settings: { referencia: true, pretas: false } },
];

export const OBJETOS_DE_BOLSO = FONTES.map(f => f.id);

/** Quanto tempo a pessoa tem para pensar, em segundos. Ajustável porque ninguém pensa no mesmo ritmo. */
export const PENSAR = { min: 2, max: 20, padrao: 6 };

/** Como a resposta chega. */
export type Anuncio = 'voz' | 'repetir' | 'ambos';

export interface Passo {
  fonte: string;
  itemId: string;
  pergunta: Question;
  /** A resposta por extenso, para ser dita. É o `reveal` do próprio exercício. */
  resposta: string;
}

/**
 * Um passo do ciclo: sorteia uma fonte entre as escolhidas e gera a pergunta.
 *
 * `fazer` é injetado porque este módulo **não importa o catálogo** — quem chama passa o `make` do
 * item. Sem isso haveria um ciclo de import, e o teste precisaria do catálogo inteiro para rodar.
 */
export function proximoPasso(
  escolhidos: readonly string[],
  fazer: (itemId: string, settings: Record<string, SettingValue>) => Question,
  ctx: Pick<Ctx, 't'>,
  random = Math.random,
): Passo | null {
  void ctx;
  const fontes = FONTES.filter(f => escolhidos.includes(f.id));
  if (fontes.length === 0) return null;
  const f = fontes[Math.floor(random() * fontes.length) % fontes.length];
  const pergunta = fazer(f.itemId, f.settings);
  return { fonte: f.id, itemId: f.itemId, pergunta, resposta: pergunta.reveal };
}

/**
 * Quanto dura um passo, em segundos: o som, o tempo de pensar, e o anúncio.
 *
 * Serve ao ciclo e ao teste. Não é precisão de relógio de áudio — é a conta que diz se uma sessão de
 * 10 minutos entrega 30 perguntas ou 8, que é o que a pessoa sente.
 */
export const duracaoDoPasso = (segundosDoSom: number, pensar: number, anuncio: Anuncio) =>
  segundosDoSom + pensar + (anuncio === 'repetir' ? segundosDoSom : anuncio === 'ambos' ? segundosDoSom + 2 : 2);
