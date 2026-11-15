// **O gerador do "Mapa do braço"** — arpejos do campo harmônico em posições de mão, para nomear
// nota por nota (desenhado com o Paulo em 13/11/2026).
//
// Puro e sem tela, como todo `theory/`: recebe tonalidade, graus e braço, devolve posições. Quem
// sabe de `ctx`, de sorteio com contexto e de interface é `catalog/items/mapa-do-braco.ts`.
//
// ## O que este arquivo acrescenta ao motor de digitações
//
// Quase nada de música: `digitacoes.ts` já encontra as digitações de um arpejo com vão de mão
// limitado, e foi ele que tornou a ideia viável sem motor novo. O que falta é **como escolher** uma
// delas, e é aí que mora o exercício:
//
// 1. **a região vem antes da digitação.** Medido em 13/11: sorteando uniformemente entre as 51
//    digitações do I grau de dó maior, **26 começam na casa 0** — corda solta não conta no vão da
//    mão, então passa o filtro mesmo com a mão longe. Uniforme na lista viciaria o exercício em
//    cordas soltas, e o Paulo pediu o contrário: *"cuidado pra nao fazer com que o arpejo de do
//    maior comece sempre só na 3a casa da corda lá"*. Sorteando a região primeiro, o exercício
//    passeia pelo braço por construção;
// 2. **as rotações dos graus são as inversões.** 1-3-5-7 começando na terça é 3-5-7-1: mesma
//    harmonia, desenho diferente, e é isso que ensina a reconhecê-la a partir de qualquer nota.
//    Medido, as quatro rotações multiplicam o material por **4,5**: de 129 para **585** desenhos no
//    violão e de 28 para **127** no baixo. Permutação arbitrária (3-5-1-7) ficou fora de propósito:
//    também sobe, mas põe a fundamental no meio e soa como arpejo embaralhado, não como inversão.
import { getModo, tonsPorGraus, buscarDigitacoes, type Encaixe, type FamiliaBase } from './digitacoes';
import type { Note } from './core';

/**
 * As cinco regiões do braço, sobrepostas de duas em duas casas.
 *
 * Sobrepostas de propósito: com janelas justapostas (0–4, 5–9, 10–12) um desenho que cruza a 5ª
 * casa não existiria em nenhuma, e são justamente esses que ensinam a emendar as posições.
 *
 * Medido com as quatro rotações: **nenhuma das 35 combinações de janela e grau fica vazia**, nos
 * dois instrumentos e nas três receitas de graus. No violão, 88 a 131 desenhos por janela; no
 * baixo, 23 a 30. O pior caso é uma combinação com 2 desenhos (baixo, 1-4-6-7), e ali o anti-eco
 * vai repetir de vez em quando — repetir é melhor que não ter pergunta.
 */
export const JANELAS: readonly (readonly [number, number])[] = [[0, 4], [2, 6], [4, 8], [6, 10], [8, 12]];

/** As rotações de uma lista de graus: cada uma é uma inversão do arpejo ascendente. */
export function rotacoes(graus: readonly number[]): number[][] {
  return graus.map((_, i) => [...graus.slice(i), ...graus.slice(0, i)]);
}

export interface OpcoesDoMapa {
  /** A tônica do CAMPO, não do arpejo: o grau é escolhido dentro dela. */
  tonica: Note;
  familia: FamiliaBase;
  /** Os graus do arpejo, na ordem base (1-3-5-7 é a tétrade). */
  graus: readonly number[];
  tuning: readonly number[];
  /** Vão máximo da mão em casas; corda solta não gasta dedo e não conta. */
  vao: number;
  maxCasa?: number;
}

export interface ArpejoDoMapa {
  /** Grau do campo (1 a 7) sobre o qual o arpejo é construído. */
  grau: number;
  /** Qual rotação dos graus saiu — 0 é a ordem base. */
  rotacao: number;
  janela: readonly [number, number];
  /** As posições na ordem de execução, subindo. */
  posicoes: Encaixe[];
}

/**
 * As digitações de um grau e uma rotação **dentro de uma janela**.
 *
 * `casa === 0` só passa quando a janela começa em 0, e isto é uma escolha de desenho, não de
 * técnica: o `maxVaoCasas` do motor ignora corda solta porque ela não gasta dedo — correto para a
 * mão —, mas aqui o arpejo é uma **figura na tela**, e uma nota na casa 0 com as outras na 10ª não
 * é a "posição próxima" que o exercício mostra. O custo disso está medido na constante abaixo.
 */
export function digitacoesNaJanela(
  o: OpcoesDoMapa, grau: number, ordem: readonly number[], janela: readonly [number, number],
): Encaixe[][] {
  const [de, ate] = janela;
  /**
   * **O modo é o campo inteiro, e o grau entra só em `tonsPorGraus`.**
   *
   * Eu errei isto na primeira versão, e a documentação do motor avisa em letras maiúsculas:
   * *"`tonica` é a tônica DO MODO resultante"*. Chamando `getModo(dó, 'maior', 4)` eu pedia **dó
   * lídio**, não o 4º grau de dó maior — e aí o arpejo saía com Fá♯, nota que dó maior não tem.
   * Rotacionar o modo E pedir o grau compõe duas rotações e sai do campo.
   *
   * Aqui o modo é o campo (grau 1, a própria escala), e `grauFundamental` escolhe sobre qual nota
   * dele o arpejo se constrói — que é exatamente o que o exemplo da função descreve.
   */
  const modo = getModo(o.tonica, o.familia, 1);
  const tons = tonsPorGraus(modo, grau, ordem);
  const todas = buscarDigitacoes(tons, {
    tipo: 'arpejo', tuning: o.tuning, maxCasa: Math.min(ate, o.maxCasa ?? 12),
    maxVaoCasas: o.vao, contorno: 'subindo', limite: null,
  });
  return [...todas].filter(d => d.every(e => e.casa >= de && e.casa <= ate));
}

/** Quantos desenhos existem em cada janela — é o que deixa o item recusar o que não tem material. */
export function materialDoMapa(o: OpcoesDoMapa): { janela: readonly [number, number]; grau: number; quantos: number }[] {
  const out: { janela: readonly [number, number]; grau: number; quantos: number }[] = [];
  for (const janela of JANELAS) {
    for (let grau = 1; grau <= 7; grau++) {
      let quantos = 0;
      for (const ordem of rotacoes(o.graus)) quantos += digitacoesNaJanela(o, grau, ordem, janela).length;
      out.push({ janela, grau, quantos });
    }
  }
  return out;
}

/**
 * Sorteia um arpejo: **região → grau → rotação → digitação**, nessa ordem.
 *
 * A ordem é o ponto do arquivo. Sorteando a digitação direto de uma lista grande, a distribuição
 * sai enviesada para onde há mais combinações (as cordas soltas e o fim do braço); sorteando a
 * região primeiro, cada pedaço do braço tem a mesma chance e o passeio é garantido.
 *
 * `evitar` recebe assinaturas recentes e **são tentativas, não garantias**: quando a configuração
 * tem pouco material — dois desenhos num grau do baixo —, repetir é melhor que não ter pergunta.
 * Devolve `null` só quando nada existe em janela nenhuma, e aí quem recusa é o `problema()` do item.
 */
export function sortearArpejo(
  o: OpcoesDoMapa,
  rnd: () => number = Math.random,
  evitar: (a: ArpejoDoMapa) => boolean = () => false,
): ArpejoDoMapa | null {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const comMaterial = JANELAS.filter(j => {
    for (let g = 1; g <= 7; g++) for (const ordem of rotacoes(o.graus)) if (digitacoesNaJanela(o, g, ordem, j).length) return true;
    return false;
  });
  if (!comMaterial.length) return null;
  let ultimo: ArpejoDoMapa | null = null;
  for (let tentativa = 0; tentativa < 12; tentativa++) {
    const janela = pick(comMaterial);
    const graus = [1, 2, 3, 4, 5, 6, 7].filter(g => rotacoes(o.graus).some(ordem => digitacoesNaJanela(o, g, ordem, janela).length));
    if (!graus.length) continue;
    const grau = pick(graus);
    const ordens = rotacoes(o.graus).map((ordem, i) => ({ ordem, i })).filter(({ ordem }) => digitacoesNaJanela(o, grau, ordem, janela).length);
    if (!ordens.length) continue;
    const { ordem, i } = pick(ordens);
    const posicoes = pick(digitacoesNaJanela(o, grau, ordem, janela));
    const arpejo: ArpejoDoMapa = { grau, rotacao: i, janela, posicoes };
    ultimo = arpejo;
    if (!evitar(arpejo)) return arpejo;
  }
  return ultimo;
}

/** A identidade de um arpejo para efeito de repetição: a região, o grau e as posições exatas. */
export const assinaturaDoArpejo = (a: ArpejoDoMapa): string =>
  `${a.janela[0]}-${a.janela[1]}|g${a.grau}|${a.posicoes.map(p => `${p.corda}.${p.casa}`).join(',')}`;
