import { SUP, alturaDeTeclado, casaPermitida, fretRange, midi, mod, notaNaPauta, noteName, pcName, pcOptions, pickClef, porSuperficie, randAcc, regiao, stepRange, teclasPermitidas, tuningOf, vozDoBraco } from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

// A fusão por superfície desta família: pauta, teclado e braço. Ver `helpers.ts` para o porquê.
//
// **Na pauta a resposta é a GRAFIA** (Dó♯ ≠ Ré♭, porque a pauta distingue); no teclado e no braço é a
// ALTURA, porque ali a tecla é a mesma. É a diferença que três telas separadas escondiam.
export const queNotaEEssa: CatalogItem = {
  id: 'que-nota-e-essa',
  objetos: ['notas', 'notacao'], tarefas: ['nomear', 'ler'],
  primaryModule: 'theory', skillTags: ['notation.pitch_reading', 'keyboard.note_naming', 'fretboard.note_naming'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'clef.treble', 'clef.bass', 'staff.ledger_lines', 'instrument.keyboard', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [SUP(ctx, ['pauta', 'teclado', 'braco']), ...porSuperficie(ctx)],
  defaults: { superficie: 'pauta', claves: ['sol'], extensao: 'pauta', acidentes: false, pretas: true, oitavas: '2', instrumento: 'auto', casas: '0-5' },
  make(s, ctx): Question {
    if (s.superficie === 'teclado') {
      const { lo, hi } = regiao(ctx, { lo: 48, hi: s.oitavas === '1' ? 59 : 71 });
      const m = alturaDeTeclado(ctx, s, lo, hi);
      return {
        prompt: ctx.t('quiz.whatNote'), visual: { kind: 'keyboard', lo, hi, marks: [m] },
        surface: { kind: 'choices', options: teclasPermitidas(ctx, s) }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
        sound: { groups: [[m]] }, reveal: pcName(m, ctx.naming),
      };
    }
    if (s.superficie === 'braco') {
      const tuning = tuningOf(s, ctx);
      const [from, to] = fretRange(s);
      const { str, f, m } = casaPermitida(tuning, from, to, ctx);
      return {
        prompt: ctx.t('quiz.whatNote'), visual: { kind: 'fretboard', tuning, from, to, marks: [{ s: str, f }] },
        surface: { kind: 'choices', options: pcOptions(ctx.naming) }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
        sound: { groups: [[m]], instrument: vozDoBraco(tuning) }, reveal: pcName(m, ctx.naming),
      };
    }
    // Pauta: a resposta é a GRAFIA, e é aqui que a fusão ganha sentido — Dó♯ e Ré♭ são a mesma
    // tecla e notas escritas diferentes.
    const clef = pickClef(s, ctx);
    const n = notaNaPauta(ctx, stepRange(clef, s.extensao), () => randAcc(s.acidentes));
    return {
      prompt: ctx.t('quiz.whatNote'), visual: { kind: 'staff', clef, columns: [[n]] },
      surface: { kind: 'letters', accidentals: !!s.acidentes }, expected: { kind: 'spelled', letter: n.letter, acc: n.acc },
      sound: { groups: [[midi(n)]] },
      reveal: noteName(n, ctx.naming) + n.oct,
    };
  },
};
