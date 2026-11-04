import {
  ACHAR, PRETAS, SUP, alturaDoPc, casaPermitida, fretRange, intervaloPedido, midi, mod, nomeDaCorda,
  notaNaPauta, noteName, pcName, pcsPermitidas, pick, pickClef, porSuperficie, randAcc, spellPc,
  stepRange, transpose, tuningOf, vozDoBraco,
} from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

// Dois modos sobre o mesmo motor (decisão 15):
//
//   nota       "toque o Fá"             — reconhecer o nome e achar onde ele está
//   intervalo  "toque a terça de Fá"    — PRODUZIR o intervalo, que é outra coisa
//
// O segundo é o que a `F6-4` pede ("a partir de uma nota, localizar a terça, a quinta, a sexta") e é
// a metade que faltava: `que-intervalo-e-esse` pede para **identificar** um intervalo dado; aqui a
// pessoa tem de **construí-lo**. Identificar e construir são habilidades diferentes, e a segunda é a
// que serve para tocar.
//
// E não é item novo: é um parâmetro, e por isso herda as três superfícies de graça.
export const acheANota: CatalogItem = {
  id: 'ache-a-nota',
  objetos: ['notas', 'notacao', 'intervalos'], tarefas: ['tocar', 'escrever'],
  primaryModule: 'theory',
  skillTags: ['notation.pitch_writing', 'keyboard.note_finding', 'fretboard.note_finding', 'theory.interval_naming'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'interval.simple', 'clef.treble', 'clef.bass', 'staff.ledger_lines', 'instrument.keyboard', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [SUP(ctx, ['pauta', 'teclado', 'braco']), ...ACHAR(ctx), ...porSuperficie(ctx, { semOitavas: true })],
  defaults: {
    superficie: 'pauta', pedido: 'nota', intervalos: ['M3', 'J5', 'M6'],
    claves: ['sol'], extensao: 'pauta', acidentes: false, pretas: true, instrumento: 'auto', casas: '0-12',
  },
  make(s, ctx): Question {
    // No modo intervalo, a nota de partida aparece e a resposta é OUTRA nota — então a pergunta é
    // montada a partir do mesmo sorteio, só com o alvo transposto.
    const pedeIntervalo = s.pedido === 'intervalo';

    if (s.superficie === 'teclado') {
      const p = pick(pcsPermitidas(ctx).filter(x => s.pretas || !PRETAS.includes(x)));
      const n = spellPc(p);
      const iv = pedeIntervalo ? intervaloPedido(s, ctx) : null;
      const alvo = iv ? mod(p + iv.semis, 12) : p;
      const soa = alturaDoPc(ctx, alvo, { lo: 48, hi: 71 });
      return {
        prompt: iv
          ? ctx.t('quiz.tapInterval', { interval: iv.rotulo, note: noteName(n, ctx.naming) })
          : ctx.t('quiz.tapNote', { note: noteName(n, ctx.naming) }),
        visual: { kind: 'text', text: '' },
        surface: { kind: 'keyboard', lo: 48, hi: 71 }, expected: { kind: 'pitchClass', pc: alvo },
        sound: { groups: [[soa]] }, reveal: noteName(spellPc(alvo), ctx.naming),
      };
    }

    if (s.superficie === 'braco') {
      const tuning = tuningOf(s, ctx);
      const [from, to] = fretRange(s);
      const { str, f, m } = casaPermitida(tuning, from, to, ctx);
      const iv = pedeIntervalo ? intervaloPedido(s, ctx) : null;
      if (iv) {
        // A nota de partida fica MARCADA no braço, e a pessoa toca o alvo em qualquer corda: é o que
        // faz o exercício ser sobre o desenho do intervalo e não sobre decorar uma casa.
        const alvo = mod(m + iv.semis, 12);
        return {
          prompt: ctx.t('quiz.tapIntervalFrom', { interval: iv.rotulo }),
          visual: { kind: 'fretboard', tuning, from, to, marks: [{ s: str, f, label: '1' }] },
          surface: { kind: 'fretboard', tuning, from, to }, expected: { kind: 'pitchClass', pc: alvo },
          sound: { groups: [[m], [m + iv.semis]], instrument: vozDoBraco(tuning) },
          reveal: pcName(alvo, ctx.naming),
        };
      }
      return {
        prompt: ctx.t('quiz.tapOnString', { note: pcName(m, ctx.naming, false), string: nomeDaCorda(tuning, str, ctx) }), visual: { kind: 'text', text: '' },
        surface: { kind: 'fretboard', tuning, from, to, onlyString: str }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
        sound: { groups: [[m]], instrument: vozDoBraco(tuning) }, reveal: ctx.t('quiz.atFret', { note: pcName(m, ctx.naming), fret: f }),
      };
    }

    const clef = pickClef(s, ctx);
    const n = notaNaPauta(ctx, stepRange(clef, s.extensao), () => randAcc(s.acidentes));
    if (pedeIntervalo) {
      // Na pauta a resposta é a GRAFIA, então o alvo é a nota transposta pelo intervalo escrito —
      // e aí uma segunda aumentada e uma terça menor deixam de ser a mesma resposta, que é o ponto
      // de pedir intervalo na pauta em vez de no braço.
      const iv = intervaloPedido(s, ctx);
      const alvo = transpose(n, { num: iv.num, semis: iv.semis });
      return {
        prompt: ctx.t('quiz.writeInterval', { interval: iv.rotulo, note: `${noteName(n, ctx.naming)}${n.oct}` }),
        visual: { kind: 'staff', clef, columns: [[n]] },
        surface: { kind: 'staff', clef, accidentals: true },
        expected: { kind: 'spelled', letter: alvo.letter, acc: alvo.acc, oct: alvo.oct },
        sound: { groups: [[midi(n)], [midi(alvo)]] },
        reveal: `${noteName(alvo, ctx.naming)}${alvo.oct}`,
      };
    }
    return {
      prompt: ctx.t('quiz.writeNote', { note: `${noteName(n, ctx.naming)}${n.oct}` }), visual: { kind: 'text', text: '' },
      surface: { kind: 'staff', clef, accidentals: !!s.acidentes }, expected: { kind: 'spelled', letter: n.letter, acc: n.acc, oct: n.oct },
      sound: { groups: [[midi(n)]] },
      reveal: `${noteName(n, ctx.naming)}${n.oct}`,
    };
  },
};
