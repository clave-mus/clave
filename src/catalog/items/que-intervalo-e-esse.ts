import { CLEFS, INST, INTERVALS, SUP, arr, clefBottom, ivLabel, midi, notaNaPauta, paresNoBraco, pick, pickClef, semiOptions, semisDoIntervalo, semisFor, semitoneName, transpose, tuningOf, vozDoBraco } from '../helpers';
import type { Note } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const queIntervaloEEsse: CatalogItem = {
  id: 'que-intervalo-e-esse',
  objetos: ['intervalos', 'notas', 'notacao'], tarefas: ['nomear', 'ler'],
  primaryModule: 'theory', skillTags: ['theory.interval_naming', 'notation.pitch_reading', 'fretboard.interval_shapes'],
  contentTags: ['interval.simple', 'pitch.accidentals', 'clef.treble', 'clef.bass', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    SUP(ctx, ['pauta', 'braco']),
    { ...CLEFS(ctx), quando: s => s.superficie !== 'braco' },
    { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: INTERVALS.map(i => ({ id: i.id, label: ivLabel(i.id, ctx), tier: i.tier })) },
    { id: 'forma', label: ctx.t('settings.form'), type: 'single', quando: s => s.superficie !== 'braco',
      options: [{ id: 'melodico', label: ctx.t('settings.melodic') }, { id: 'harmonico', label: ctx.t('settings.harmonic') }] },
    { ...INST(ctx), quando: s => s.superficie === 'braco' },
  ],
  defaults: { superficie: 'pauta', claves: ['sol'], intervalos: ['m2', 'M2', 'm3', 'M3', 'J4', 'J5', 'm6', 'M6', 'J8'], forma: 'melodico', instrumento: 'auto' },
  make(s, ctx) {
    const ids = arr(s.intervalos, ['M3']);
    if (s.superficie === 'braco') {
      // No braço a resposta é o NÚMERO DE SEMITONS, não a qualidade: o desenho de uma terça menor
      // e de uma segunda aumentada é o mesmo, e cobrar a qualidade seria cobrar o que não está ali.
      //
      // E é aqui que a fusão conserta um exercício de graça: `braco-intervalo` era o único item de
      // intervalo **sem seletor de intervalos**, e o par saía de um passeio aleatório com
      // distribuição descontrolada. Agora o seletor filtra os pares enumerados.
      const tuning = tuningOf(s, ctx);
      const querSemis = new Set(ids.map(semisDoIntervalo));
      const pares = paresNoBraco(tuning).filter(x => querSemis.has(x.d));
      const par = pares.length ? pick(pares) : pick(paresNoBraco(tuning));
      const lo = tuning[par.s1] + par.f1;
      return {
        prompt: ctx.t('quiz.whatInterval'), visual: { kind: 'fretboard', tuning, from: 0, to: 9, marks: [{ s: par.s1, f: par.f1, label: '1' }, { s: par.s2, f: par.f2, color: 'var(--ve)' }] },
        surface: { kind: 'choices', options: semiOptions(ctx) }, expected: { kind: 'option', id: String(par.d) },
        sound: { groups: [[lo], [lo + par.d]], instrument: vozDoBraco(tuning) }, reveal: semitoneName(par.d, ctx.conv),
      };
    }
    const clef = pickClef(s, ctx);
    const id = pick(ids);
    const iv = INTERVALS.find(i => i.id === id)!;
    const b = clefBottom(clef);
    let lower: Note, upper: Note;
    do {
      lower = notaNaPauta(ctx, [b - 1, b + 9 - (iv.num - 1)], () => (Math.random() < 0.25 ? pick([1, -1]) : 0));
      upper = transpose(lower, { num: iv.num, semis: semisFor(iv.num, iv.q) });
    } while (Math.abs(upper.acc) > 1);
    const columns = s.forma === 'harmonico' ? [[lower, upper]] : [[lower], [upper]];
    return {
      prompt: ctx.t('quiz.whatInterval'), visual: { kind: 'staff', clef, columns },
      surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: ivLabel(i, ctx) })) }, expected: { kind: 'option', id },
      sound: { groups: s.forma === 'harmonico' ? [[midi(lower), midi(upper)]] : [[midi(lower)], [midi(upper)]] },
      reveal: ivLabel(id, ctx),
    };
  },
};
