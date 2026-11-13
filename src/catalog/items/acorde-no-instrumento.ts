import { ALL_CHORDS, INST, ROOTS, alturaDoPc, arr, buildChord, chordOptions, chordTypes, guitarChordQuestion, midi, mod, pcPermitido, pick, tonicaDeContexto } from '../helpers';
import { FRETS } from '../helpers';
import type { ChordId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Acorde no instrumento: **identificar** o desenho, ou **audiar** o desenho.
 *
 * Metade de `que-acorde-e-esse` — as superfícies de teclado e braço. O porquê do eixo está em
 * `nota-na-pauta.ts`.
 *
 * ## O instrumento é configuração, com uma exceção
 *
 * Decisão do Paulo (09/11): o padrão é o instrumento do perfil, **ou o piano se o instrumento for
 * baixo**. Acorde de quatro notas num baixo de quatro cordas é exercício de outra coisa, e as formas
 * de violão que `theory/digitacoes.ts` gera não existem num baixo.
 *
 * ## No braço, o desenho vem do gerador
 *
 * Em 10/11 as 16 formas abertas e as 10 fórmulas de pestana escritas à mão saíram: o gerador produz
 * qualquer voicing, com extensão e inversão — 60 formas distintas em 60 sorteios, contra 26 à mão no
 * total. Ver `guitarChordQuestion`.
 */
export const acordeNoInstrumento: CatalogItem = {
  id: 'acorde-no-instrumento',
  objetos: ['acordes'], tarefas: ['nomear', 'tocar'],
  primaryModule: 'theory',
  skillTags: ['theory.chord_identification', 'keyboard.chord_shapes', 'fretboard.chord_shapes'],
  contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions', 'chord.open_shapes', 'chord.barre_shapes', 'instrument.keyboard', 'instrument.guitar'],
  kind: 'serie', requires: {}, validation: ['deterministic', 'self_report'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'identificar', label: ctx.t('settings.nameIt') },
      { id: 'audiar', label: ctx.t('settings.audiateIt') },
    ] },
    // Piano entra junto, e o baixo não: ver o comentário do item.
    { ...INST(ctx), options: [
      { id: 'auto', label: ctx.t('settings.myInstrument') },
      { id: 'violao', label: ctx.t('settings.guitar') },
      { id: 'piano', label: ctx.t('settings.instrumentPiano') },
    ] },
    { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', justify: true, options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'pergunta', label: ctx.t('settings.whatToAsk'), type: 'single', quando: s => s.instrumento !== 'piano',
      options: [{ id: 'acorde', label: ctx.t('settings.askChord') }, { id: 'baixo', label: ctx.t('settings.askBass') }] },
    { id: 'soltas', label: ctx.t('settings.openStrings'), type: 'toggle', quando: s => s.instrumento !== 'piano' },
    { ...FRETS(ctx), quando: s => s.instrumento !== 'piano' },
    // Pedido do Paulo em 12/11. É o MESMO toggle de `ouvido-acorde`, e vale a pena ser o mesmo:
    // arpejar antes é como se ouve um acorde desenhado, nota por nota, para depois ouvi-lo junto.
    { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true,
      present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
  ],
  defaults: {
    direcao: 'identificar', instrumento: 'auto', tipos: ['maior', 'menor', 'dim', 'aum'],
    pergunta: 'acorde', soltas: false, casas: '0-12', arpejo: false,
  },
  make(s, ctx) {
    /** `auto` com baixo cai no piano: as formas de violão não existem num baixo de quatro cordas. */
    const noPiano = s.instrumento === 'piano' || (s.instrumento === 'auto' && ctx.params.instrument === 'baixo');

    if (!noPiano) {
      // Chave por chave, nunca `{...s}`: há teste que proíbe espalhar, e com razão — espalhando não
      // há como saber quais configurações o item de fato lê, e o guarda de "toda configuração
      // oferecida muda alguma coisa" deixa de funcionar.
      const q = guitarChordQuestion({
        superficie: 'braco', tipos: s.tipos, pergunta: s.pergunta, soltas: s.soltas, casas: s.casas,
      }, ctx);
      if (s.direcao !== 'audiar') return q;
      const notas = q.sound!.groups[0];
      const tonica = tonicaDeContexto(ctx, Math.min(...notas));
      return {
        ...q, prompt: ctx.t('quiz.audiateChordOnInstrument'),
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]], instrument: q.sound!.instrument,
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [...notas.map(m => [m]), notas] },
          ],
        },
        autoplay: false,
      };
    }

    const types = arr(s.tipos, ['maior']) as ChordId[];
    const type = pick(types);
    const pcRaiz = pcPermitido(ctx);
    const base = alturaDoPc(ctx, pcRaiz, { lo: 48, hi: 72 });
    const root = { ...ROOTS[mod(pcRaiz, 12)], oct: Math.floor(base / 12) - 1 };
    const notes = buildChord(root, type).map(midi).map(m => (m > 76 ? m - 12 : m));
    const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);

    if (s.direcao === 'audiar') {
      const tonica = tonicaDeContexto(ctx, Math.min(...notes));
      return {
        prompt: ctx.t('quiz.audiateChordOnInstrument'), visual: { kind: 'keyboard', lo: 48, hi: 83, marks: notes },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [...notes.map(m => [m]), notes] },
          ],
        },
        autoplay: false, reveal: sym,
      };
    }
    return {
      prompt: ctx.t('quiz.whatChord'), visual: { kind: 'keyboard', lo: 48, hi: 83, marks: notes },
      surface: { kind: 'choices', options }, expected, sound: { groups: [notes] }, reveal: sym,
    };
  },
};
