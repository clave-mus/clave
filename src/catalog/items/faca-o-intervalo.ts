import {
  CLEFS, INST, INTERVALS, SUP, clefBottom, ivLabel, midi, mod, notaNaPauta, noteName, paresNoBraco,
  pcName, pick, pickClef, randInt, semisFor, semitoneName, transpose, tuningOf, vozDoBraco,
} from '../helpers';
import type { Note } from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem } from '../types';

// Faça o intervalo (X9, 06/11/2026): o par de `que-intervalo-e-esse`. Lá a pessoa IDENTIFICA um
// intervalo dado; aqui ela CONSTRÓI um a partir de uma nota — é outra habilidade, e é a que serve
// para tocar. Nasceu dentro de `ache-a-nota` (o modo "a partir de uma nota, toque a terça") e saiu
// de lá quebrado no braço (B4): braço vazio, som estranho, e a revelação mostrava todas as posições
// da classe de altura sem dizer qual nota era.
//
// **Sem seletor de intervalos** — "personalização tem limite" (revisão de 04/11, §1.3): escolher
// entre os dois pares de um exercício tão direto não muda o que se pratica, só acrescenta um
// controle a menos usado.
export const facaOIntervalo: CatalogItem = {
  id: 'faca-o-intervalo',
  objetos: ['intervalos'], tarefas: ['tocar', 'escrever'],
  primaryModule: 'theory', skillTags: ['theory.interval_naming', 'notation.pitch_writing', 'fretboard.interval_shapes'],
  contentTags: ['interval.simple', 'pitch.accidentals', 'clef.treble', 'clef.bass', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'material', 'range'],
  publicacao: RASCUNHO,
  settings: ctx => [
    SUP(ctx, ['pauta', 'braco']),
    { ...CLEFS(ctx), quando: s => s.superficie !== 'braco' },
    { ...INST(ctx), quando: s => s.superficie === 'braco' },
  ],
  defaults: { superficie: 'pauta', claves: ['sol'], instrumento: 'auto' },
  make(s, ctx) {
    if (s.superficie === 'braco') {
      // Mesma régua do par: no braço a resposta é o NÚMERO DE SEMITONS, não a qualidade — o desenho
      // de uma terça menor e de uma segunda aumentada é o mesmo, e cobrar a diferença seria cobrar o
      // que não está ali (comentário de `que-intervalo-e-esse.ts`, vale igual aqui).
      const tuning = tuningOf(s, ctx);
      const d = randInt(1, 12);
      const pares = paresNoBraco(tuning).filter(x => x.d === d);
      const par = pares.length ? pick(pares) : pick(paresNoBraco(tuning));
      const lo = tuning[par.s1] + par.f1;
      const alvoPc = mod(lo + par.d, 12);
      return {
        prompt: ctx.t('quiz.tapIntervalFrom', { interval: semitoneName(par.d, ctx.conv) }),
        visual: { kind: 'fretboard', tuning, from: 0, to: 9, marks: [{ s: par.s1, f: par.f1, label: '1' }] },
        surface: { kind: 'fretboard', tuning, from: 0, to: 9 }, expected: { kind: 'pitchClass', pc: alvoPc },
        sound: { groups: [[lo]], instrument: vozDoBraco(tuning) },
        reveal: pcName(alvoPc, ctx.naming),
      };
    }

    // Na pauta a resposta é a GRAFIA, e é aqui que enarmônicos contam: a quinta aumentada e a sexta
    // menor soam igual, mas a quinta de Si é Fá♯ (não Sol♭) — `transpose()` resolve isso.
    const clef = pickClef(s, ctx);
    const iv = pick(INTERVALS);
    const b = clefBottom(clef);
    let n: Note, alvo: Note;
    do {
      n = notaNaPauta(ctx, [b - 1, b + 9 - (iv.num - 1)], () => (Math.random() < 0.25 ? pick([1, -1]) : 0));
      alvo = transpose(n, { num: iv.num, semis: semisFor(iv.num, iv.q) });
    } while (Math.abs(alvo.acc) > 1);
    return {
      prompt: ctx.t('quiz.writeInterval', { interval: ivLabel(iv.id, ctx), note: `${noteName(n, ctx.naming)}${n.oct}` }),
      visual: { kind: 'staff', clef, columns: [[n]] },
      surface: { kind: 'staff', clef, accidentals: true },
      expected: { kind: 'spelled', letter: alvo.letter, acc: alvo.acc, oct: alvo.oct },
      sound: { groups: [[midi(n)], [midi(alvo)]] },
      reveal: `${noteName(alvo, ctx.naming)}${alvo.oct}`,
    };
  },
};
