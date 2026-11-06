// Audiação (X3, 06/11/2026): o gerador de rodadas. A declaração do item de catálogo mora em
// `ambientes.ts`, como todo `kind: 'tarefa'`/`'ambiente'` — aqui fica só a música, porque ela serve
// a DOIS lugares: a tela própria (`tools/Audiar.tsx`, revela por clique) e o mãos-livres
// (`tools/MaosLivres.tsx`, revela por tempo — ver `maos-livres.ts`). Mesma geração, muda só quem
// decide quando a revelação acontece.
//
// Dois estímulos, como PARÂMETRO do mesmo item (decisão 15), não dois itens: `referencia`
// (intervalo, escala ou arpejo a partir de uma nota) e `graus` (uma sequência de graus dada, para
// audiar a melodia que ela faz). As outras duas variantes do plano original — ler melodia e ver
// padrão no braço — ficam de fora: dependem do gerador de partitura (X6) e do gerador de formas
// (M5), que ainda não existem.
import {
  CHORDS, celulaDeGraus, chordName, pick, scaleDegreeLabels, scaleDegs, scaleName,
  scaleSound, semitoneName, tonicaNaRegiao, type ChordId, type ScaleId,
} from '../helpers';
import type { Ctx } from '../types';

export type EstimuloId = 'referencia' | 'graus';

/** O que uma rodada de audiação precisa: o que dizer, o que soa antes, e o que soa na revelação. */
export interface Estimulo {
  tipo: EstimuloId;
  /** O texto que diz o que audiar — aparece ANTES da revelação, de propósito: a pessoa sabe o alvo
   *  (um intervalo nomeado, uma escala, os graus); o que falta é o som, não o nome. */
  enunciado: string;
  /** Toca ao começar a rodada. */
  referencia: number[];
  /** Toca só na revelação, em sequência (cada posição é um grupo; grupo de 1 nota = nota solta). */
  alvo: number[][];
  /** A resposta por extenso — mesmo texto que o mãos-livres fala (F6-1). */
  reveal: string;
}

// Pools razoáveis para um primeiro rascunho — não expostos como configuração fina (personalização
// tem limite, revisão de 04/11, §1.3). O Paulo ajusta vendo, antes de publicar (decisão 51).
const INTERVALOS = [3, 4, 5, 7, 8, 9, 10, 12];
const ESCALAS: ScaleId[] = ['maior', 'menor', 'dorico', 'mixolidio', 'menor-harmonica'];
const ACORDES: ChordId[] = ['maior', 'menor', '7M', '7', 'm7'];
const ESCALAS_GRAUS: ScaleId[] = ['maior', 'menor'];

function estimuloReferencia(ctx: Ctx): Estimulo {
  const tonic = tonicaNaRegiao(ctx, { lo: 55, hi: 64 });
  const familia = pick(['intervalo', 'escala', 'arpejo'] as const);
  if (familia === 'intervalo') {
    const d = pick(INTERVALOS);
    const nome = semitoneName(d, ctx.conv);
    return {
      tipo: 'referencia', enunciado: ctx.t('audiar.askInterval', { interval: nome }),
      referencia: [tonic], alvo: [[tonic], [tonic + d]], reveal: nome,
    };
  }
  if (familia === 'escala') {
    const id = pick(ESCALAS);
    const nome = scaleName(ctx.t, id);
    const ms = scaleSound(tonic, id, 'sobe');
    return {
      tipo: 'referencia', enunciado: ctx.t('audiar.askScale', { scale: nome }),
      referencia: [tonic], alvo: ms.map(m => [m]), reveal: nome,
    };
  }
  const id = pick(ACORDES);
  const nome = chordName(ctx.t, id);
  const ms = CHORDS[id].degs.map(([, semi]) => tonic + semi);
  return {
    tipo: 'referencia', enunciado: ctx.t('audiar.askChord', { chord: nome }),
    referencia: [tonic], alvo: ms.map(m => [m]), reveal: nome,
  };
}

function estimuloGraus(ctx: Ctx): Estimulo {
  const id = pick(ESCALAS_GRAUS);
  const tonic = tonicaNaRegiao(ctx, { lo: 55, hi: 64 });
  const degs = scaleDegreeLabels(id);
  const semis = [...scaleDegs(id).map(([, semi]) => semi), 12];
  const top = semis.length - 1;
  const c = celulaDeGraus(top, 4);
  const key = c.map(i => degs[i]).join(' ');
  return {
    tipo: 'graus', enunciado: ctx.t('audiar.askDegrees', { degrees: key }),
    referencia: [tonic], alvo: c.map(i => [tonic + semis[i]]), reveal: key,
  };
}

/** Sorteia uma rodada, dentre os estímulos escolhidos. Usado pela tela (clique revela) e pelo
 *  mãos-livres (revela por tempo) — é a mesma geração, só muda quem decide quando revelar. */
export function gerarEstimulo(estimulos: readonly string[], ctx: Ctx): Estimulo {
  const validos = estimulos.filter((e): e is EstimuloId => e === 'referencia' || e === 'graus');
  const tipo = pick(validos.length ? validos : (['referencia'] as EstimuloId[]));
  return tipo === 'graus' ? estimuloGraus(ctx) : estimuloReferencia(ctx);
}
