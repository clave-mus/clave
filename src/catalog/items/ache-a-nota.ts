import { PRETAS, SUP, alturaDoPc, casaPermitida, fretRange, midi, mod, nomeDaCorda, notaNaPauta, noteName, pcName, pcsPermitidas, pick, pickClef, porSuperficie, randAcc, spellPc, stepRange, tuningOf, vozDoBraco } from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const acheANota: CatalogItem = {
  id: 'ache-a-nota',
  objetos: ['notas', 'notacao'], tarefas: ['tocar', 'escrever'],
  primaryModule: 'theory', skillTags: ['notation.pitch_writing', 'keyboard.note_finding', 'fretboard.note_finding'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'clef.treble', 'clef.bass', 'staff.ledger_lines', 'instrument.keyboard', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [SUP(ctx, ['pauta', 'teclado', 'braco']), ...porSuperficie(ctx, { semOitavas: true })],
  defaults: { superficie: 'pauta', claves: ['sol'], extensao: 'pauta', acidentes: false, pretas: true, instrumento: 'auto', casas: '0-12' },
  make(s, ctx): Question {
    if (s.superficie === 'teclado') {
      const p = pick(pcsPermitidas(ctx).filter(x => s.pretas || !PRETAS.includes(x)));
      const soa = alturaDoPc(ctx, p, { lo: 48, hi: 71 });
      const n = spellPc(p);
      return {
        prompt: ctx.t('quiz.tapNote', { note: noteName(n, ctx.naming) }), visual: { kind: 'text', text: '' },
        surface: { kind: 'keyboard', lo: 48, hi: 71 }, expected: { kind: 'pitchClass', pc: p },
        sound: { groups: [[soa]] }, reveal: noteName(n, ctx.naming),
      };
    }
    if (s.superficie === 'braco') {
      const tuning = tuningOf(s, ctx);
      const [from, to] = fretRange(s);
      const { str, f, m } = casaPermitida(tuning, from, to, ctx);
      return {
        prompt: ctx.t('quiz.tapOnString', { note: pcName(m, ctx.naming, false), string: nomeDaCorda(tuning, str, ctx) }), visual: { kind: 'text', text: '' },
        surface: { kind: 'fretboard', tuning, from, to, onlyString: str }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
        sound: { groups: [[m]], instrument: vozDoBraco(tuning) }, reveal: ctx.t('quiz.atFret', { note: pcName(m, ctx.naming), fret: f }),
      };
    }
    const clef = pickClef(s, ctx);
    const n = notaNaPauta(ctx, stepRange(clef, s.extensao), () => randAcc(s.acidentes));
    return {
      prompt: ctx.t('quiz.writeNote', { note: `${noteName(n, ctx.naming)}${n.oct}` }), visual: { kind: 'text', text: '' },
      surface: { kind: 'staff', clef, accidentals: !!s.acidentes }, expected: { kind: 'spelled', letter: n.letter, acc: n.acc, oct: n.oct },
      sound: { groups: [[midi(n)]] },
      reveal: `${noteName(n, ctx.naming)}${n.oct}`,
    };
  },
};
