import { CLEFS, INTERVALS, arr, tonicaDeContexto, clefBottom, ivLabel, midi, notaNaPauta, noteName, pick, pickClef, semisFor, transpose } from '../helpers';
import type { Note } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Intervalo na pauta: **ler** o que está escrito, ou **escrever** o que foi pedido.
 *
 * Metade de `que-intervalo-e-esse` mais metade de `faca-o-intervalo`, pelo eixo novo (ver
 * `nota-na-pauta.ts` para o porquê).
 *
 * ## A prova que este par deu
 *
 * Os dois itens antigos tinham **o mesmo comentário escrito duas vezes**: *"no braço a resposta é o
 * NÚMERO DE SEMITONS, não a qualidade — o desenho de uma terça menor e de uma segunda aumentada é o
 * mesmo"*. No segundo arquivo ele terminava com *"vale igual aqui"*.
 *
 * Uma regra que precisa ser repetida nos dois itens é regra **da superfície**, não do item. Era o
 * eixo pedindo para ser trocado.
 *
 * ## E aqui a grafia conta
 *
 * Na pauta a resposta é a **qualidade** do intervalo, porque enarmônicos se escrevem diferente: a
 * quinta aumentada e a sexta menor soam igual, e a quinta de Si é Fá♯, nunca Sol♭. `transpose()`
 * resolve. No instrumento é o contrário — lá a resposta é o número de semitons, e por isso o
 * vocabulário de resposta dos dois itens é outro. Separados, cada um tem o seu sem `Setting.quando`.
 */
export const intervaloNaPauta: CatalogItem = {
  id: 'intervalo-na-pauta',
  objetos: ['intervalos', 'notacao'], tarefas: ['nomear', 'ler', 'escrever'],
  primaryModule: 'theory',
  skillTags: ['theory.interval_naming', 'notation.pitch_reading', 'notation.pitch_writing'],
  contentTags: ['interval.simple', 'pitch.accidentals', 'clef.treble', 'clef.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'ler', label: ctx.t('settings.readIt') },
      { id: 'escrever', label: ctx.t('settings.writeIt') },
      { id: 'audiar', label: ctx.t('settings.audiateIt') },
    ] },
    CLEFS(ctx),
    { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: INTERVALS.map(i => ({ id: i.id, label: ivLabel(i.id, ctx), tier: i.tier })) },
    // `ambas` (P5): melódico e harmônico são complementares, e antes só dava um OU outro.
    { id: 'forma', label: ctx.t('settings.form'), type: 'single', quando: s => s.direcao === 'ler',
      options: [{ id: 'melodico', label: ctx.t('settings.melodic') }, { id: 'harmonico', label: ctx.t('settings.harmonic') }, { id: 'ambas', label: ctx.t('settings.both') }] },
  ],
  defaults: { direcao: 'ler', claves: ['sol'], intervalos: ['m2', 'M2', 'm3', 'M3', 'J4', 'J5', 'm6', 'M6', 'J8'], forma: 'melodico' },
  make(s, ctx) {
    const ids = arr(s.intervalos, ['M3']);
    const clef = pickClef(s, ctx);
    const id = pick(ids);
    const iv = INTERVALS.find(i => i.id === id) ?? INTERVALS[0];
    const b = clefBottom(clef);
    let lower: Note, upper: Note;
    do {
      lower = notaNaPauta(ctx, [b - 1, b + 9 - (iv.num - 1)], () => (Math.random() < 0.25 ? pick([1, -1]) : 0));
      upper = transpose(lower, { num: iv.num, semis: semisFor(iv.num, iv.q) });
    } while (Math.abs(upper.acc) > 1);

    if (s.direcao === 'audiar') {
      const tonica = tonicaDeContexto(ctx, midi(lower));
      return {
        prompt: ctx.t('quiz.audiateInterval'), visual: { kind: 'staff', clef, columns: [[lower], [upper]] },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [[midi(lower)], [midi(upper)]] },
          ],
        },
        autoplay: false, reveal: ivLabel(id, ctx),
      };
    }
    if (s.direcao === 'escrever') {
      return {
        prompt: ctx.t('quiz.writeInterval', { interval: ivLabel(iv.id, ctx), note: `${noteName(lower, ctx.naming)}${lower.oct}` }),
        visual: { kind: 'staff', clef, columns: [[lower]] },
        surface: { kind: 'staff', clef, accidentals: true },
        expected: { kind: 'spelled', letter: upper.letter, acc: upper.acc, oct: upper.oct },
        sound: { groups: [[midi(lower)], [midi(upper)]] },
        reveal: `${noteName(upper, ctx.naming)}${upper.oct}`,
      };
    }
    const harmonico = s.forma === 'ambas' ? Math.random() < 0.5 : s.forma === 'harmonico';
    return {
      prompt: ctx.t('quiz.whatInterval'), visual: { kind: 'staff', clef, columns: harmonico ? [[lower, upper]] : [[lower], [upper]] },
      surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: ivLabel(i, ctx) })) }, expected: { kind: 'option', id },
      sound: { groups: harmonico ? [[midi(lower), midi(upper)]] : [[midi(lower)], [midi(upper)]] },
      reveal: ivLabel(id, ctx),
    };
  },
};
