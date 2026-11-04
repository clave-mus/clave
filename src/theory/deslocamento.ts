// Deslocamento de padrão rítmico (T8, decisão 83). Função pura, sem interface nenhuma.
//
// O padrão cabe em UM TEMPO, e essa restrição é o que faz o módulo inteiro ser simples: quando o
// padrão preenche o ciclo exatamente, *deslocar* (andar para a direita mantendo a forma) e *rodar*
// (tratar como ciclo, o que cai fora do fim volta pelo começo) são **a mesma operação** — nada cai
// fora, porque o fim é o começo.
//
// A consequência prática é que o território é **finito e pequeno**: 15 padrões na grade de
// semicolcheia, contra os quais um teste consegue conferir tudo por enumeração exaustiva.
//
// A exigência de correção que este módulo existe para garantir: **padrão simétrico tem MENOS modos
// do que o ciclo tem posições.** `x . x .` rodado duas vezes volta a ser ele mesmo, logo tem 2
// modos e não 4 — e um app que oferecesse quatro faria a mesma pergunta duas vezes. É o erro das
// duas melódicas (decisão 70) na menor escala em que ele pode existir.

/** Subdivisões em um tempo: colcheias, tercinas ou semicolcheias. */
export type Grade = 2 | 3 | 4;
export const GRADES: readonly Grade[] = [2, 3, 4];

/** Um padrão: as posições de ataque dentro do tempo, crescentes, em `[0, grade)`. */
export type Padrao = readonly number[];

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** O padrão é válido nesta grade? Posições distintas, ordenadas e dentro do ciclo. */
export function valido(p: Padrao, grade: Grade): boolean {
  return p.every((v, i) => Number.isInteger(v) && v >= 0 && v < grade && (i === 0 || v > p[i - 1]));
}

/**
 * O padrão rodado `k` posições para a direita, dentro do ciclo.
 *
 * É o deslocamento **e** a rotação — ver o cabeçalho. Sai sempre ordenado, para dois padrões iguais
 * terem sempre a mesma representação.
 */
export function rodar(p: Padrao, grade: Grade, k: number): Padrao {
  return p.map(v => mod(v + k, grade)).sort((a, b) => a - b);
}

const igual = (a: Padrao, b: Padrao) => a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Os modos distintos do padrão: as rotações que de fato produzem padrões diferentes.
 *
 * **Pode devolver menos que `grade`**, e é exatamente isso que o módulo existe para acertar. Vem na
 * ordem do deslocamento (0, 1, 2…), parando antes de repetir — então o primeiro é sempre o padrão
 * como foi dado.
 */
export function modosDistintos(p: Padrao, grade: Grade): Padrao[] {
  const out: Padrao[] = [];
  for (let k = 0; k < grade; k++) {
    const r = rodar(p, grade, k);
    if (out.some(x => igual(x, r))) break;
    out.push(r);
  }
  return out;
}

/** Quantos modos distintos o padrão tem. Divide `grade` sempre — é o período da simetria. */
export const quantosModos = (p: Padrao, grade: Grade) => modosDistintos(p, grade).length;

/** A forma canônica da família: a rotação lexicograficamente menor. */
export function canonica(p: Padrao, grade: Grade): Padrao {
  const todas = modosDistintos(p, grade);
  return todas.reduce((menor, x) => (menorQue(x, menor) ? x : menor), todas[0]);
}

function menorQue(a: Padrao, b: Padrao): boolean {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] < b[i];
  return a.length < b.length;
}

/** Os dois padrões são o mesmo em modos diferentes? */
export const mesmaFamilia = (a: Padrao, b: Padrao, grade: Grade) => igual(canonica(a, grade), canonica(b, grade));

/** Todos os padrões tocáveis da grade — isto é, todos menos o silêncio. */
export function tocaveis(grade: Grade): Padrao[] {
  const out: Padrao[] = [];
  for (let mask = 1; mask < 1 << grade; mask++) {
    const p: number[] = [];
    for (let i = 0; i < grade; i++) if (mask & (1 << i)) p.push(i);
    out.push(p);
  }
  return out;
}

/**
 * Uma família por representante canônico, ordenadas por quantidade de ataques.
 *
 * São **2 na grade de colcheia, 3 na de tercina e 5 na de semicolcheia** — e não há uma sexta. É a
 * tabela da decisão 83, e o teste a confere contando.
 */
export function familias(grade: Grade): Padrao[] {
  const vistas: Padrao[] = [];
  for (const p of tocaveis(grade)) {
    const c = canonica(p, grade);
    if (!vistas.some(x => igual(x, c))) vistas.push(c);
  }
  return vistas.sort((a, b) => a.length - b.length || (menorQue(a, b) ? -1 : 1));
}

/** O padrão desenhado com `x` e `.`, que é como ele aparece na tela e nos testes. */
export const desenho = (p: Padrao, grade: Grade) =>
  Array.from({ length: grade }, (_, i) => (p.includes(i) ? 'x' : '.')).join(' ');
