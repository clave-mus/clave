// Enumerador de rearmonizações (FM-5, decisões 69, 71 e 78). Função pura, sem interface nenhuma.
//
// É o terceiro enumerador do projeto, e tem a forma dos outros dois: **enumerar o que é válido,
// medir por critérios nomeados, nunca eleger.**
//
// **Por que não é uma lista de acordes.** Enumerar os acordes que contêm uma nota da melodia é
// interseção de conjuntos — trivial, e entrega quarenta acordes sem hierarquia, porque
// *"interessante" não é computável*. O laboratório oferece **transformações pelo nome**, cada uma
// com nome de teoria, e é isso que faz usá-lo ser estudar em vez de só ouvir resultados bonitos.
//
// É também o que as ferramentas existentes não fazem: o *Reharmonist* do Band-in-a-Box gera a
// progressão inteira por gênero, e o *Hookpad* sugere a partir de um banco de músicas. **Todas fazem
// por você. Nenhuma ensina.**
//
// **Sem correção nenhuma** (decisão 69). O item termina por `tarefa`: a pessoa aplica, o app toca,
// ela mantém ou desfaz. O custo aceito é que um item sem resposta não gera evidência de progresso.
import { CHORDS, mod, type ChordId } from './core';

/** Um acorde na progressão: fundamental como classe de altura, e a qualidade. */
export interface Acorde { fundamental: number; qualidade: ChordId }

/** O que a transformação precisa saber para decidir se cabe e o que fazer. */
export interface ContextoHarmonico {
  /** O acorde a transformar. */
  acorde: Acorde;
  /** O que vem depois, quando há — vários casos dependem disso. */
  proximo?: Acorde;
  /** A tônica da tonalidade, como classe de altura. */
  tonica: number;
  /** Maior ou menor. */
  modo: 'maior' | 'menor';
  /** As notas da melodia sobre este acorde, como classes de altura. */
  melodia?: readonly number[];
}

/**
 * Uma transformação nomeada. `aplicar` devolve **a sequência que substitui o acorde** — uma lista,
 * porque algumas inserem acordes em vez de trocar (interpolar o II devolve dois).
 */
export interface Transformacao {
  id: TransformacaoId;
  aplicavel(ctx: ContextoHarmonico): boolean;
  aplicar(ctx: ContextoHarmonico): Acorde[];
}

export type TransformacaoId =
  | 'qualidade' | 'diatonica' | 'interpolar-ii' | 'dominante-secundario'
  | 'subv7' | 'diminuto-passagem' | 'emprestimo-modal';

const DOMINANTES: ChordId[] = ['7'];
const ehDominante = (a: Acorde) => DOMINANTES.includes(a.qualidade);
const ac = (fundamental: number, qualidade: ChordId): Acorde => ({ fundamental: mod(fundamental, 12), qualidade });

/** Os graus da escala maior/menor natural, em semitons a partir da tônica. */
const GRAUS: Record<'maior' | 'menor', number[]> = { maior: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10] };

/** O grau do acorde dentro da tonalidade (1 a 7), ou `null` se ele for cromático. */
export function grauNaTonalidade(a: Acorde, tonica: number, modo: 'maior' | 'menor'): number | null {
  const i = GRAUS[modo].indexOf(mod(a.fundamental - tonica, 12));
  return i < 0 ? null : i + 1;
}

/** O campo harmônico em tétrades, como classes de altura. */
function campo(tonica: number, modo: 'maior' | 'menor'): Acorde[] {
  const tipos: ChordId[] = modo === 'maior'
    ? ['7M', 'm7', 'm7', '7M', '7', 'm7', 'm7b5']
    : ['m7', 'm7b5', '7M', 'm7', 'm7', '7M', '7'];
  return GRAUS[modo].map((semi, i) => ac(tonica + semi, tipos[i]));
}

/** As classes de altura do acorde. */
export const pcsDe = (a: Acorde) => CHORDS[a.qualidade].degs.map(([, s]) => mod(a.fundamental + s, 12));

// ---------------- as sete (decisão 78) ----------------

/** Alternativas de qualidade sobre a mesma fundamental, na ordem em que se costuma aprender. */
const QUALIDADES: ChordId[] = ['maior', '7M', '7', 'menor', 'm7', 'sus4', 'm7b5', 'dim7'];

export const TRANSFORMACOES: readonly Transformacao[] = [
  {
    // 1. A mais branda, e a primeira que se aprende: mesma fundamental, outra qualidade.
    id: 'qualidade',
    aplicavel: () => true,
    aplicar: ({ acorde, melodia }) => QUALIDADES
      .filter(q => q !== acorde.qualidade)
      .map(q => ac(acorde.fundamental, q))
      .filter(a => cabeAMelodia(a, melodia)),
  },
  {
    // 2. Troca por outro acorde do campo **com a mesma função**: I↔iii↔vi, IV↔ii, V↔vii.
    //
    // O critério é a FUNÇÃO, e não a contagem de notas comuns — eu escrevi "divide duas notas" na
    // primeira versão e um teste pegou: C7M e F7M dividem Dó e Mi, mas F é subdominante e não
    // substitui a tônica. A contagem também não é estável entre tríade e tétrade (duas notas basta
    // para a tríade, três para a tétrade), o que sozinho já mostra que ela não era o critério.
    id: 'diatonica',
    aplicavel: ctx => grauNaTonalidade(ctx.acorde, ctx.tonica, ctx.modo) !== null,
    aplicar: ctx => {
      const grau = grauNaTonalidade(ctx.acorde, ctx.tonica, ctx.modo) as number;
      return campo(ctx.tonica, ctx.modo)
        .filter((_, i) => i + 1 !== grau && FUNCAO[i + 1] === FUNCAO[grau])
        .filter(a => cabeAMelodia(a, ctx.melodia));
    },
  },
  {
    // 3. Transforma qualquer dominante num ii–V: G7 vira Dm7 G7.
    id: 'interpolar-ii',
    aplicavel: ctx => ehDominante(ctx.acorde),
    aplicar: ctx => [ac(ctx.acorde.fundamental + 7, 'm7'), ctx.acorde],
  },
  {
    // 4. Antes de um acorde, põe o dominante DELE. Antes de Dm7, A7.
    id: 'dominante-secundario',
    aplicavel: ctx => !!ctx.proximo && !ehDominante(ctx.acorde),
    aplicar: ctx => [ctx.acorde, ac((ctx.proximo as Acorde).fundamental + 7, '7')],
  },
  {
    // 5. A que mais ensina. G7 e D♭7 compartilham o MESMO trítono — em G7 são Si e Fá; em D♭7 são
    // Fá e Dó♭ (o mesmo Si). O que muda é o baixo: em vez de cair uma quinta, desce meio tom.
    id: 'subv7',
    aplicavel: ctx => ehDominante(ctx.acorde),
    aplicar: ctx => [ac(ctx.acorde.fundamental + 6, '7')],
  },
  {
    // 6. Liga dois acordes a um tom de distância: C → C♯dim7 → Dm.
    id: 'diminuto-passagem',
    aplicavel: ctx => !!ctx.proximo && mod((ctx.proximo as Acorde).fundamental - ctx.acorde.fundamental, 12) === 2,
    aplicar: ctx => [ctx.acorde, ac(ctx.acorde.fundamental + 1, 'dim7')],
  },
  {
    // 7. Pega um acorde do modo paralelo: em Dó maior, Fm no lugar de F, ou A♭ (♭VI).
    id: 'emprestimo-modal',
    aplicavel: ctx => grauNaTonalidade(ctx.acorde, ctx.tonica, ctx.modo) !== null,
    aplicar: ctx => {
      const paralelo = ctx.modo === 'maior' ? 'menor' : 'maior';
      const grau = grauNaTonalidade(ctx.acorde, ctx.tonica, ctx.modo) as number;
      const doParalelo = campo(ctx.tonica, paralelo)[grau - 1];
      // Em maior, as duas mais usadas depois do grau paralelo: ♭VI e ♭VII.
      const candidatos = [doParalelo, ...(ctx.modo === 'maior' ? [ac(ctx.tonica + 8, '7M'), ac(ctx.tonica + 10, '7')] : [])];
      return dedup(candidatos
        .filter(a => !(a.fundamental === ctx.acorde.fundamental && a.qualidade === ctx.acorde.qualidade))
        .filter(a => cabeAMelodia(a, ctx.melodia)));
    },
  },
];

/** Quantas classes de altura dois acordes compartilham. */
export const comuns = (a: Acorde, b: Acorde) => pcsDe(a).filter(p => pcsDe(b).includes(p)).length;

/**
 * A melodia cabe neste acorde?
 *
 * **A única invariante que o laboratório precisa garantir**, e é o que o torna utilizável: toda nota
 * da melodia tem que pertencer ao acorde resultante, como nota do acorde ou como tensão natural.
 * Um acorde que briga com a melodia não é rearmonização, é erro.
 */
export function cabeAMelodia(a: Acorde, melodia?: readonly number[]): boolean {
  if (!melodia?.length) return true;
  const pcs = pcsDe(a);
  // tensões: 9ª, 11ª e 13ª contadas a partir da fundamental
  const tensoes = [2, 5, 9].map(s => mod(a.fundamental + s, 12));
  return melodia.every(n => pcs.includes(mod(n, 12)) || tensoes.includes(mod(n, 12)));
}

const dedup = (xs: Acorde[]) => xs.filter((a, i) => xs.findIndex(b => b.fundamental === a.fundamental && b.qualidade === a.qualidade) === i);

/** Uma opção que o laboratório oferece: a transformação e o que ela produz. */
export interface Opcao { id: TransformacaoId; resultado: Acorde[]; medidas: MedidasHarmonicas }

/** O que se mede de um acorde contra a melodia e a tonalidade. Nenhuma opinião. */
export interface MedidasHarmonicas {
  /** Que grau do acorde a nota da melodia faz: 1, 3, 5, 7, 9, 11 ou 13. **O eixo útil, e é exato.** */
  grauDaMelodia: number | null;
  /** O acorde está fora da tonalidade? */
  cromatico: boolean;
  /** Tônica, subdominante ou dominante dentro da tonalidade; `null` quando cromático. */
  funcao: 'tonica' | 'subdominante' | 'dominante' | null;
  /** Movimento do baixo em relação ao acorde anterior, em semitons com sinal (−6 a +5). */
  movimentoDoBaixo: number;
}

const FUNCAO: Record<number, MedidasHarmonicas['funcao']> = {
  1: 'tonica', 3: 'tonica', 6: 'tonica', 2: 'subdominante', 4: 'subdominante', 5: 'dominante', 7: 'dominante',
};

export function medirHarmonia(a: Acorde, ctx: ContextoHarmonico, anterior?: Acorde): MedidasHarmonicas {
  const grau = grauNaTonalidade(a, ctx.tonica, ctx.modo);
  const nota = ctx.melodia?.[0];
  const intervalo = nota === undefined ? null : mod(nota - a.fundamental, 12);
  const dist = anterior ? mod(a.fundamental - anterior.fundamental, 12) : 0;
  return {
    grauDaMelodia: intervalo === null ? null : GRAU_POR_SEMITOM[intervalo] ?? null,
    cromatico: grau === null,
    funcao: grau === null ? null : FUNCAO[grau] ?? null,
    movimentoDoBaixo: dist > 6 ? dist - 12 : dist,
  };
}

/** Que grau o intervalo acima da fundamental representa. Enarmonias caem no nome mais comum. */
const GRAU_POR_SEMITOM: Record<number, number> = {
  0: 1, 2: 9, 3: 3, 4: 3, 5: 11, 6: 11, 7: 5, 9: 13, 10: 7, 11: 7,
};

/**
 * Todas as opções que o laboratório oferece para este acorde.
 *
 * **Não vêm ranqueadas por qualidade** — vêm na ordem pedagógica da decisão 78, que é a ordem em que
 * as transformações se aprendem. A pessoa escolhe; o app toca.
 */
export function opcoes(ctx: ContextoHarmonico): Opcao[] {
  const out: Opcao[] = [];
  for (const t of TRANSFORMACOES) {
    if (!t.aplicavel(ctx)) continue;
    const r = t.aplicar(ctx);
    if (!r.length) continue;
    // `qualidade` e `diatonica` devolvem várias alternativas; as outras, uma sequência só
    const sequencias = t.id === 'qualidade' || t.id === 'diatonica' || t.id === 'emprestimo-modal'
      ? r.map(a => [a])
      : [r];
    for (const seq of sequencias) {
      // A invariante da decisão 69, na forma ESTRITA: **todo** acorde da sequência tem que acomodar
      // a melodia.
      //
      // É estrita de propósito, e o motivo é uma limitação honesta do modelo: `interpolar-ii`,
      // `dominante-secundario` e `diminuto-passagem` SUBDIVIDEM o espaço do acorde, e `melodia` não
      // diz em que ponto do compasso cada nota cai. Sem isso não dá para saber qual acorde soa sob
      // qual nota — então exigir de todos é o único critério que nunca produz choque.
      //
      // Custa opções: um ii interpolado é descartado quando não acomoda a nota que soava sobre o V.
      // A versão consciente de ritmo é questão aberta (ver FM-5), e é decisão de produto.
      if (!seq.every(a => cabeAMelodia(a, ctx.melodia))) continue;
      out.push({ id: t.id, resultado: seq, medidas: medirHarmonia(seq[seq.length - 1], ctx, ctx.acorde) });
    }
  }
  return out;
}
