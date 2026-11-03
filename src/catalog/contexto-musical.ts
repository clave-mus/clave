// O contexto musical que os itens leem da cascata (F2-3, decisão 57).
//
// Antes disto, `key`, `range`, `material`, `tempo` e `clef` estavam declarados em
// `GlobalParams` e **nenhum exercício os lia** — o catálogo sorteava tudo em faixas escritas no
// código. A consequência era que a rotação de tonalidade (decisão 38) não faria nada: a rotina
// avançaria de Dó para Sol e os exercícios continuariam sorteando a tônica no aleatório.
//
// A regra de ouro de todas as funções daqui: **respeitar o parâmetro quando ele está definido e
// sortear livremente quando não está.** `key: null` quer dizer "livre", é o padrão, e quem não
// escolheu tonalidade quer variedade — não Dó maior em tudo.
//
// E é por isso que elas moram num arquivo só: acrescentar um parâmetro musical novo se faz aqui,
// e passa a valer para todo item sem editar o catálogo. É o critério de pronto da F2-1.
import { buildScale, fromStep, midi, mod, note, pick, randInt, type Clef, type Note } from '../theory/core';
import type { GlobalParams } from './params';
import type { Ctx } from './types';

/** A tonalidade em vigor, ou `null` quando é livre. */
export const tonalidade = (ctx: Ctx) => ctx.params.key;

/**
 * Só as notas da tonalidade importam, ou qualquer nota serve?
 *
 * **O que `material` governa, e o que ele não governa.** Ele restringe a **escolha livre de nota**
 * — quando o exercício ia sortear qualquer altura, passa a sortear só as da tonalidade. Ele
 * **não** mexe no conteúdo musical declarado: se a pergunta é "que escala é esta?" e a resposta é
 * menor harmônica, as notas dela saem da tonalidade **por definição**, e isso está certo.
 *
 * Em uma frase: material filtra o que o app sorteia, não o que o app pergunta.
 */
export const soDiatonico = (ctx: Ctx) => ctx.params.material === 'diatonico' && ctx.params.key !== null;

/**
 * As classes de altura permitidas agora.
 *
 * Com `material: 'diatonico'` e uma tonalidade definida, são as sete da escala. Caso contrário, as
 * doze — que é o padrão, e tem que continuar sendo.
 */
export function pcsPermitidas(ctx: Ctx): number[] {
  const k = ctx.params.key;
  if (!soDiatonico(ctx) || !k) return Array.from({ length: 12 }, (_, i) => i);
  const tonica = note(0, 0, 4);
  const escala = buildScale({ ...tonica, letter: 0 }, k.mode === 'menor' ? 'menor' : 'maior');
  return escala.map(n => mod(midi(n) + k.tonic, 12));
}

/** Uma classe de altura que o material permite. */
export function pcPermitido(ctx: Ctx): number {
  return pick(pcsPermitidas(ctx));
}

/** A classe de altura é permitida pelo material em vigor? */
export function pcPermitida(ctx: Ctx, p: number): boolean {
  return pcsPermitidas(ctx).includes(mod(p, 12));
}

/**
 * A região em MIDI, interseccionada com o que o item pede.
 *
 * O item continua podendo ter a sua própria faixa — um exercício de leitura em clave de fá não
 * deve pular para a região aguda só porque a pessoa configurou assim. O que a região global faz é
 * **apertar**, nunca alargar.
 */
export function regiao(ctx: Ctx, doItem?: { lo: number; hi: number }): { lo: number; hi: number } {
  const g = ctx.params.range;
  if (!doItem) return g;
  const lo = Math.max(g.lo, doItem.lo);
  const hi = Math.min(g.hi, doItem.hi);
  // só quando a intersecção é vazia a do item vence — melhor sair da região do que não ter o que
  // tocar. Intersecção estreita é legítima: uma nota cabe em qualquer faixa.
  return hi > lo ? { lo, hi } : doItem;
}

/** Uma altura MIDI dentro da região, respeitando o material. */
export function alturaNaRegiao(ctx: Ctx, doItem?: { lo: number; hi: number }): number {
  const { lo, hi } = regiao(ctx, doItem);
  const permitidas = pcsPermitidas(ctx);
  const candidatas: number[] = [];
  for (let m = lo; m <= hi; m++) if (permitidas.includes(mod(m, 12))) candidatas.push(m);
  return candidatas.length ? pick(candidatas) : randInt(lo, hi);
}

/**
 * A tônica a usar: a da tonalidade quando há uma, sorteada na região quando não há.
 *
 * Devolve uma **altura MIDI**, já dentro da região — é o que os exercícios de ouvido precisam para
 * parar de usar faixas escritas no código.
 */
export function tonicaNaRegiao(ctx: Ctx, doItem?: { lo: number; hi: number }): number {
  const { lo, hi } = regiao(ctx, doItem);
  const k = ctx.params.key;
  if (!k) return randInt(lo, hi);
  // a oitava mais grave da tonalidade que cabe na região
  const base = lo + mod(k.tonic - lo, 12);
  const oitavas: number[] = [];
  for (let m = base; m <= hi; m += 12) oitavas.push(m);
  return oitavas.length ? pick(oitavas) : base;
}

/**
 * Uma nota escrita na pauta que cabe na região e no material.
 *
 * Os itens de pauta geram por **degrau da pauta**, não por MIDI — e por isso eram os que mais
 * facilmente ignoravam a região. Esta função faz a ponte: enumera os degraus da faixa pedida,
 * descarta os que caem fora da região em MIDI ou fora do material, e sorteia entre os que sobram.
 */
export function notaNaPauta(ctx: Ctx, passos: [number, number], acidente: () => number): Note {
  const { lo, hi } = ctx.params.range;
  const permitidas = pcsPermitidas(ctx);
  const candidatas: Note[] = [];
  for (let st = passos[0]; st <= passos[1]; st++) {
    for (const acc of [0, 1, -1]) {
      const n = fromStep(st, acc);
      const m = midi(n);
      if (m >= lo && m <= hi && permitidas.includes(mod(m, 12))) candidatas.push(n);
    }
  }
  if (!candidatas.length) return fromStep(randInt(passos[0], passos[1]), acidente());
  // o acidente pedido pelo item ainda manda: sem acidentes ligados, só naturais
  const acc = acidente();
  const doAcidente = candidatas.filter(n => n.acc === acc);
  return pick(doAcidente.length ? doAcidente : candidatas.filter(n => n.acc === 0).length ? candidatas.filter(n => n.acc === 0) : candidatas);
}

/**
 * A altura de uma **classe de altura dada**, dentro da região.
 *
 * Existe porque encaixar a classe na oitava de uma altura sorteada (`m - m%12 + pc`) **pode cair
 * abaixo do piso** — foi um bug real, pego pelo teste de piso da F2-3. Aqui a oitava é escolhida
 * entre as que cabem.
 */
export function alturaDoPc(ctx: Ctx, pcAlvo: number, doItem?: { lo: number; hi: number }): number {
  const { lo, hi } = regiao(ctx, doItem);
  const candidatas: number[] = [];
  for (let m = lo; m <= hi; m++) if (mod(m, 12) === mod(pcAlvo, 12)) candidatas.push(m);
  if (candidatas.length) return pick(candidatas);
  // nenhuma oitava cabe: a mais próxima do piso, sem descer abaixo dele
  return lo + mod(pcAlvo - lo, 12);
}

/** A clave de leitura: a do item quando ele escolheu, a global quando não. */
export function clave(ctx: Ctx, doItem?: Clef): Clef {
  return doItem ?? ctx.params.clef;
}

/** O andamento em vigor. */
export const andamento = (ctx: Ctx) => ctx.params.tempo;

/**
 * Uma nota escrita, grafada segundo a tonalidade quando há uma.
 *
 * É o que impede Lá♯ de aparecer em Fá maior — o motor de teoria já sabe grafar, mas só se alguém
 * disser qual é a tonalidade.
 */
export function notaGrafada(ctx: Ctx, m: number): Note {
  const k = ctx.params.key;
  const prefereBemol = k ? [1, 3, 5, 8, 10].includes(mod(k.tonic, 12)) : false;
  const letras = prefereBemol ? [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6] : [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const acidentes = prefereBemol ? [0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1, 0] : [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  const i = mod(m, 12);
  return { letter: letras[i] as Note['letter'], acc: acidentes[i], oct: Math.floor(m / 12) - 1 };
}

/** O que gravar no snapshot de uma tentativa ou atividade. */
export function snapshotMusical(p: GlobalParams) {
  return {
    instrument: p.instrument, tuning: p.tuning, key: p.key, range: p.range,
    tempo: p.tempo, material: p.material, clef: p.clef,
  };
}
