// **As levadas**: a grade rítmica do acompanhamento — bateria, linha de baixo e micro-tempo.
//
// Saiu de dentro de `tools/Backing.tsx` em 19/11, na revisão que o Paulo pediu. O arquivo da tela
// tinha 770 linhas e **nove coisas exportadas que não são componente** — oito dos quatorze avisos de
// lint do projeto saíam dali, todos dizendo a mesma coisa: *isto não é tela*.
//
// E não era só arrumação: enquanto o motor morava na tela, ele não dava para ser usado por mais
// ninguém. A regra do projeto é essa — **o motor musical não conhece a tela**.
import { CHORDS, type ChordId } from './core';

/** As levadas que existem. O id é o que a tela guarda e o que a configuração salva. */
export type Style = 'rock' | 'balada' | 'samba' | 'swing' | 'shuffle' | 'valsa' | 'nenhum';
/**
 * **Quanto um acorde dura, em compassos** (decisão dele em 19/11).
 *
 * Antes todo acorde durava exatamente um compasso, e isso é o limite que mais aparece quando se
 * tenta escrever música de verdade: não havia ii–V dentro do mesmo compasso nem tônica de dois.
 */
export type Duracao = 0.5 | 1 | 2;
export const DURACOES: Duracao[] = [0.5, 1, 2];

export interface Groove {
  grid: number; tempos: number; kick: number[]; snare: number[]; hat: number[]; rim?: number[];
  bass: [number, GrauDoBaixo, number][]; comp: [number, number][];
  /**
   * **Micro-tempo**: o deslocamento de cada semicolcheia dentro do tempo, em **fração da
   * semicolcheia** — um valor por subdivisão, começando na que cai no tempo.
   *
   * Pedido dele em 19/11 para o samba: *"um atraso sutil (de uns 12 ms em 120 bpm) na segunda
   * semicolcheia e adiantamento na terceira e quarta (de uns 20 ms em 120 bpm)"*.
   *
   * **Em fração, e não em milissegundos**, e esta é a escolha que eu tomei: a 120 bpm a semicolcheia
   * tem 125 ms, então 12 ms são 9,6% dela e 20 ms são 16%. Guardando a fração, o balanço continua o
   * mesmo balanço em qualquer andamento (a 98 bpm do preset dá 14,7 e 24,5 ms); guardando os
   * milissegundos, ele encolheria proporcionalmente ao acelerar e sumiria no andamento rápido. Se
   * você quiser os milissegundos fixos, é trocar o multiplicador por um número.
   *
   * ⚠️ O deslocamento é **sempre relativo ao tempo nominal** do passo, nunca acumulado: a primeira
   * semicolcheia de cada tempo fica em zero, então o pulso não anda. É o que separa balanço de
   * relógio errado.
   */
  micro?: readonly number[];
}

/** Quanto este passo se desloca, em segundos. `sd` é a duração de um passo. */
export function desvioDoPasso(g: Pick<Groove, 'grid' | 'tempos' | 'micro'>, step: number, sd: number): number {
  if (!g.micro) return 0;
  const porTempo = g.grid / g.tempos;
  return (g.micro[step % porTempo] ?? 0) * sd;
}
/**
 * **O baixo fala por nome**, e não por semitom — e isto é o conserto do defeito que o Paulo ouviu em
 * 19/11: *"as linhas de baixo estão sempre meio estranhas no acorde vii diminuto"*.
 *
 * O número `7` queria dizer "a quinta" e era somado **cru** à fundamental: num vii diminuto a quinta
 * é **diminuta** (6 semitons), então o baixo tocava um fá♯ sobre um Si°, que não é nota do acorde.
 * A terça já saía do acorde (`degs[1]`); a quinta, não. Com nome, `quinta` pergunta ao acorde.
 *
 * `quintaGrave` é a quinta **abaixo** da fundamental — pedido dele para o samba, e é como se toca.
 */
export type GrauDoBaixo = 'raiz' | 'terca' | 'quinta' | 'quintaGrave' | 'sexta' | 'aprox';
export const GROOVES: Record<Style, Groove> = {
  rock: { grid: 16, tempos: 4, kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [[0, 'raiz', 2], [2, 'raiz', 2], [4, 'raiz', 2], [6, 'raiz', 2], [8, 'raiz', 2], [10, 'raiz', 2], [12, 'raiz', 2], [14, 'quinta', 2]], comp: [[0, 6], [6, 2], [8, 8]] },
  balada: { grid: 16, tempos: 4, kick: [0, 7, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [[0, 'raiz', 6], [6, 'raiz', 2], [8, 'quinta', 8]], comp: [[0, 16]] },
  /**
   * **O samba**, com a linha de baixo que ele ditou em 19/11 — e esta é a terceira versão dela.
   *
   * *"é pra ser um tempo em cada nota, tipo — colcheia pontuada e semicolcheia na tônica, aí
   * colcheia pontuada e semicolcheia na quinta, depois repete"*.
   *
   * Então **um tempo por nota harmônica**, e dentro do tempo a dupla característica: colcheia
   * pontuada (3 passos) + semicolcheia (1 passo), as duas na mesma nota. Tônica no primeiro tempo,
   * quinta **grave** no segundo, e repete — oito ataques no compasso.
   *
   * As duas versões anteriores eram minhas leituras das palavras dele, e ficam registradas porque o
   * erro foi meu: primeiro seis ataques herdados do código antigo, depois "semicolcheias pontuadas"
   * em todas as notas (1,5 passo), que era a frase dele lida ao pé da letra no lugar errado — a
   * pontuação é da **colcheia**, e a semicolcheia que a segue é que fecha o tempo.
   *
   * A semicolcheia cai no último passo do tempo, onde o micro-tempo a **adianta** 27 ms (a 88 bpm):
   * é ela que dá a antecipação do samba, e as duas coisas se encaixam sem ninguém combinar.
   */
  samba: { grid: 16, tempos: 4, kick: [4, 12], snare: [2, 5, 7, 10, 13, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], bass: [
    [0, 'raiz', 3], [3, 'raiz', 1],
    [4, 'quintaGrave', 3], [7, 'quintaGrave', 1],
    [8, 'raiz', 3], [11, 'raiz', 1],
    [12, 'quintaGrave', 3], [15, 'quintaGrave', 1],
  ], comp: [[2, 2], [5, 2], [7, 3], [10, 2], [13, 3]], micro: [0, 0.096, -0.16, -0.16] },
  swing: { grid: 12, tempos: 4, kick: [0, 6], snare: [], hat: [0, 3, 5, 6, 9, 11], rim: [3, 9], bass: [[0, 'raiz', 3], [3, 'terca', 3], [6, 'quinta', 3], [9, 'aprox', 3]], comp: [[0, 3], [5, 4]] },
  shuffle: { grid: 12, tempos: 4, kick: [0, 6], snare: [3, 9], hat: [0, 2, 3, 5, 6, 8, 9, 11], bass: [[0, 'raiz', 2], [2, 'raiz', 1], [3, 'terca', 2], [5, 'terca', 1], [6, 'quinta', 2], [8, 'quinta', 1], [9, 'sexta', 2], [11, 'quinta', 1]], comp: [[2, 1], [5, 1], [8, 1], [11, 1]] },
  /**
   * **Valsa**: 3 tempos, 12 passos. O baixo faz o que valsa faz — fundamental no 1 e a quinta nos
   * outros dois —, e a caixa marca 2 e 3. É a única levada ternária, e entrou para o compasso
   * ternário deixar de ser impossível; outras ternárias são conteúdo musical, e isso é escolha dele.
   */
  valsa: { grid: 12, tempos: 3, kick: [0], snare: [4, 8], hat: [0, 4, 8], bass: [[0, 'raiz', 4], [4, 'quinta', 4], [8, 'quinta', 4]], comp: [[4, 4], [8, 4]] },
  nenhum: { grid: 16, tempos: 4, kick: [], snare: [], hat: [], bass: [[0, 'raiz', 16]], comp: [[0, 16]] },
};

/**
 * A altura de um grau do baixo. **A quinta e a terça vêm do acorde**, não de uma soma fixa: é o que
 * faz o vii diminuto soar como ele é.
 */
export function alturaDoBaixo(grau: GrauDoBaixo, raiz: number, type: ChordId, proximaRaiz: number): number {
  const doAcorde = (i: number) => CHORDS[type].degs[i]?.[1] ?? [0, 4, 7][i];
  switch (grau) {
    case 'raiz': return raiz;
    case 'terca': return raiz + doAcorde(1);
    case 'quinta': return raiz + doAcorde(2);
    // Uma oitava abaixo da quinta do acorde: num diminuto são 6 semitons, e a grave fica a 6 abaixo.
    case 'quintaGrave': return raiz + doAcorde(2) - 12;
    case 'sexta': return raiz + 9;
    /**
     * **A aproximação CONDUZ**, e isto era um defeito: ela sorteava o lado (`Math.random()`), então a
     * mesma progressão aproximava por cima numa volta e por baixo na outra — a nota mais importante
     * da linha de baixo mudava de lugar a cada laço do loop.
     *
     * A regra é a de um baixista: aproxima-se **contra o movimento**. Subindo para a fundamental
     * seguinte, entra-se por baixo (um semitom abaixo dela); descendo, por cima. Quando as duas
     * fundamentais são a mesma nota, por baixo, que é o que soa como condução e não como erro.
     */
    case 'aprox': return proximaRaiz + (proximaRaiz > raiz ? -1 : proximaRaiz < raiz ? 1 : -1);
  }
}

/**
 * **A linha do tempo da progressão, em passos da grade.**
 *
 * Era um acorde por compasso (`Math.floor(i / grid) % chords.length`), e com duração isso não serve.
 * Aqui cada acorde ganha janela própria, e o relógio pergunta "que acorde está soando no passo X?".
 *
 * ⚠️ **O loop fecha em compasso inteiro.** Se a soma das durações cair no meio de um compasso (três
 * acordes de meio, por exemplo), o último estica até o fim do compasso — porque a levada é periódica
 * por compasso (`i % grid`), e um loop quebrado faria a bateria entrar fora de fase com a harmonia a
 * cada volta. Esticar é a única saída que mantém as duas em acordo.
 */
export function linhaDoTempo(chords: readonly { dur?: Duracao }[], grid: number) {
  const janelas: { inicio: number; fim: number }[] = [];
  let passo = 0;
  for (const c of chords) {
    const passos = Math.max(1, Math.round((c.dur ?? 1) * grid));
    janelas.push({ inicio: passo, fim: passo + passos });
    passo += passos;
  }
  const total = Math.max(grid, Math.ceil(passo / grid) * grid);
  // o último estica até o fim do compasso, para o loop fechar redondo
  if (janelas.length) janelas[janelas.length - 1].fim = total;
  return { janelas, total };
}
