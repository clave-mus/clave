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

/**
 * **Todas as ordens dos graus** — e a razão de usar estas e não só as rotações é o espalhamento
 * entre CORDAS, que foi o pedido do Paulo em 14/11: *"está condensado entre cordas, seria bom se
 * tivesse mais espalhado"*.
 *
 * Eu havia recusado as permutações medindo a coisa errada (quantidade de desenhos). Medindo o que
 * ele queria, com vão de 5 casas no violão: as rotações dão 585 desenhos com média de **2,99**
 * cordas e só **12%** usando as quatro; as permutações dão 1290 com média **3,35** e **41%** nas
 * quatro. No baixo, 1% → 18%.
 *
 * O custo é conceitual e ele o aceitou: 3-5-1-7 não é uma inversão, é um desenho — a fundamental
 * fica no meio. O parâmetro segue chamado "graus do arpejo" por decisão dele, porque a palavra dá o
 * referencial (graus *de que*), e a imprecisão incomoda menos que a confusão de tirá-la.
 */
export function permutacoes(graus: readonly number[]): number[][] {
  if (graus.length <= 1) return [[...graus]];
  return graus.flatMap((g, i) => permutacoes([...graus.slice(0, i), ...graus.slice(i + 1)]).map(resto => [g, ...resto]));
}

/** As combinações de `quantas` graus entre os sete do campo. */
export function combinacoesDeGraus(quantas: number): number[][] {
  const out: number[][] = [];
  const rec = (inicio: number, atual: number[]) => {
    if (atual.length === quantas) { out.push([...atual]); return; }
    for (let g = inicio; g <= 7; g++) rec(g + 1, [...atual, g]);
  };
  rec(1, []);
  return out;
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
  /**
   * Quantos graus sortear a cada arpejo, em vez de usar `graus` como está.
   *
   * É o pedido central do Paulo em 14/11: *"a ideia do exercicio nao é mentalizar os arpejos, mas
   * sim usar os arpejos como motor pra pedir várias posições de notas"*. Medido, sortear a
   * combinação multiplica o material por **35** — há 35 combinações de 3 ou 4 graus entre 7 —, e é
   * de longe a maior fonte de variabilidade do item.
   */
  sorteados?: number;
  /** Uma nota por corda: espalhamento máximo, ao custo de material (ver a nota em `permutacoes`). */
  cordasDistintas?: boolean;
}

export interface ArpejoDoMapa {
  /** Grau do campo (1 a 7) sobre o qual o arpejo é construído. */
  grau: number;
  /**
   * Os graus desta rodada, **na ordem em que soam** — os escolhidos ou os sorteados, embaralhados.
   *
   * Substituiu um campo `rotacao` numérico: com as permutações entrando no lugar das rotações, "a
   * ordem" deixou de ser um índice numa lista de quatro e passou a ser a própria sequência.
   */
  graus: readonly number[];
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
/**
 * **Por que não há cache aqui.**
 *
 * Minha primeira versão guardava as digitações de cada combinação, e o Paulo cortou o caminho:
 * *"não tem porque gerar e guardar todas combinações e sortear uma. faça com que as combinações
 * sejam geradas proceduralmente"*. Ele estava certo, e a medida foi dura — o processo de teste
 * **morreu por memória**: com graus sorteados são 35 combinações × 24 ordens × 7 graus × 5 janelas,
 * quase trinta mil listas de posições guardadas para usar uma.
 *
 * Agora nada se enumera: sorteia-se uma combinação, uma ordem e uma janela, e busca-se **só** essa.
 * Se vier vazia, sorteia-se outra — amostragem com rejeição, o mesmo jeito que o resto do projeto
 * usa. O trabalho por pergunta deixou de depender do tamanho do espaço.
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
    maxVaoCasas: o.vao, contorno: 'subindo', cordasDistintas: o.cordasDistintas, limite: null,
  });
  return [...todas].filter(d => d.every(e => e.casa >= de && e.casa <= ate));
}

/** Quantos desenhos existem em cada janela — é o que deixa o item recusar o que não tem material. */
export function materialDoMapa(o: OpcoesDoMapa): { janela: readonly [number, number]; grau: number; quantos: number }[] {
  const out: { janela: readonly [number, number]; grau: number; quantos: number }[] = [];
  const combos = o.sorteados ? combinacoesDeGraus(o.sorteados) : [[...o.graus]];
  for (const janela of JANELAS) {
    for (let grau = 1; grau <= 7; grau++) {
      let quantos = 0;
      for (const graus of combos) {
        // Uma ordem por combinação: a contagem serve para saber SE há material, e permutar não
        // cria desenho onde não havia nenhum — só reposiciona os que existem.
        quantos += digitacoesNaJanela({ ...o, graus }, grau, [...graus], janela).length;
      }
      out.push({ janela, grau, quantos });
    }
  }
  return out;
}

/**
 * **O primeiro desenho que existe**, varrendo em ordem — o último recurso de quem sorteia.
 *
 * Custa até 1225 buscas (5 janelas × 7 graus × 35 combinações) e por isso só entra quando o sorteio
 * já desistiu. Mas é ele que faz `temMaterial` e `sortearArpejo` **concordarem sempre**, e essa
 * divergência foi um defeito de verdade: com `uma nota por corda` num baixo de quatro cordas
 * existem só 41 desenhos entre as 1225 combinações possíveis, então o sorteio falhava em ~13% das
 * perguntas enquanto a verificação dizia que havia material. O item prometia pergunta e entregava
 * um braço vazio — e o guarda "toda pergunta tem conteúdo" pegou.
 */
function primeiroQueExiste(o: OpcoesDoMapa): ArpejoDoMapa | null {
  const combos = o.sorteados ? combinacoesDeGraus(o.sorteados) : [[...o.graus].sort((a, b) => a - b)];
  for (const janela of JANELAS) {
    for (let grau = 1; grau <= 7; grau++) {
      for (const graus of combos) {
        const achadas = digitacoesNaJanela({ ...o, graus }, grau, graus, janela);
        if (achadas.length) return { grau, janela, graus, posicoes: achadas[0] };
      }
    }
  }
  return null;
}

/**
 * **Há desenho para esta configuração?** — o que o `problema()` do item precisa saber.
 *
 * Amostra primeiro, porque no caso normal a primeira tentativa acerta; só cai na varredura quando a
 * amostra falha, e aí a resposta é exata. É a mesma ordem que `sortearArpejo` segue, de propósito:
 * as duas respondem sobre o mesmo espaço.
 */
export function temMaterial(o: OpcoesDoMapa, rnd: () => number = Math.random): boolean {
  for (let tentativa = 0; tentativa < 24; tentativa++) {
    const graus = o.sorteados ? sortearGraus(o.sorteados, rnd) : [...o.graus];
    const janela = JANELAS[Math.floor(rnd() * JANELAS.length)];
    const grau = 1 + Math.floor(rnd() * 7);
    if (digitacoesNaJanela({ ...o, graus }, grau, graus, janela).length) return true;
  }
  return primeiroQueExiste(o) !== null;
}

/** `quantas` graus distintos entre os sete, **já numa ordem sorteada** — a permutação sai de graça. */
function sortearGraus(quantas: number, rnd: () => number): number[] {
  const todos = [1, 2, 3, 4, 5, 6, 7];
  for (let i = todos.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [todos[i], todos[j]] = [todos[j], todos[i]];
  }
  return todos.slice(0, quantas);
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
  /**
   * **Sorteia e tenta; não enumera.** Cada volta escolhe uma janela, um grau do campo, uma
   * combinação de graus (já embaralhada, o que dá a permutação de graça) e pede as digitações **só**
   * dessa escolha. Vazio? Outra volta.
   *
   * São duas passagens de tentativas: a primeira exige que o `evitar` aceite (anti-eco), e a
   * segunda aceita qualquer coisa que exista — repetir é melhor que não ter pergunta, a mesma regra
   * do resto do projeto.
   */
  let ultimo: ArpejoDoMapa | null = null;
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const janela = JANELAS[Math.floor(rnd() * JANELAS.length)];
    const grau = 1 + Math.floor(rnd() * 7);
    /**
     * **Nas últimas tentativas, a ordem crescente** — e isto alinha este sorteio com `temMaterial`.
     *
     * As duas funções divergiam, e o guarda de varredura pegou: `temMaterial` responde "há desenho"
     * testando a ordem crescente, e aqui eu embaralhava sempre. Com muitos graus (sete, que a
     * interface permite) **só** a crescente cabe numa janela — embaralhada, os saltos estouram o vão
     * —, e a chance de sortear exatamente ela entre 5040 permutações é nula. O item então prometia
     * pergunta e entregava vazio.
     *
     * Reservar o fim das tentativas para a ordem que a verificação garante fecha o buraco sem tirar
     * o embaralhamento de onde ele funciona, que é o caso normal de três ou quatro graus.
     */
    const ordenado = tentativa >= 45;
    const graus = o.sorteados
      ? (ordenado ? sortearGraus(o.sorteados, rnd).sort((x, y) => x - y) : sortearGraus(o.sorteados, rnd))
      : (ordenado ? [...o.graus].sort((x, y) => x - y) : embaralhar([...o.graus], rnd));
    const achadas = digitacoesNaJanela({ ...o, graus }, grau, graus, janela);
    if (!achadas.length) continue;
    const arpejo: ArpejoDoMapa = {
      grau, janela, graus, posicoes: achadas[Math.floor(rnd() * achadas.length)],
    };
    ultimo = arpejo;
    // Depois de metade das tentativas, deixa de recusar: o anti-eco é preferência, não exigência.
    if (tentativa > 30 || !evitar(arpejo)) return arpejo;
  }
  // O sorteio desistiu: ou não existe nada, ou existe tão pouco que 60 tentativas não acharam.
  return ultimo ?? primeiroQueExiste(o);
}

/** Embaralha no lugar e devolve — Fisher-Yates com o `rnd` injetado, para o teste ser determinístico. */
function embaralhar(xs: number[], rnd: () => number): number[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}

/** A identidade de um arpejo para efeito de repetição: a região, o grau e as posições exatas. */
export const assinaturaDoArpejo = (a: ArpejoDoMapa): string =>
  `${a.janela[0]}-${a.janela[1]}|g${a.grau}|${a.graus.join('')}|${a.posicoes.map(p => `${p.corda}.${p.casa}`).join(',')}`;
