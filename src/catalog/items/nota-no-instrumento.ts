import {
  FRETS, INST, PRETAS, tonicaDeContexto, alturaDeTeclado, alturaDoPc, casaPermitida, fretRange, mod, pcNameUm,
  pcOptions, pcsPermitidas, pick, regiao, teclasPermitidas, tuningOf, vozDoBraco,
} from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Nota no instrumento: **identificar** o que está marcado, ou **achar** o que foi pedido.
 *
 * ## O que este item absorveu (reorganização de 09/11/2026)
 *
 * As metades de teclado e braço de `que-nota-e-essa` e de `ache-a-nota`. O porquê do eixo novo está
 * em `nota-na-pauta.ts`; aqui vale registrar o que o Paulo disse que fechou a decisão:
 *
 * > "você não percebe que são a mesma coisa?"
 *
 * Ele estava certo. "Que nota é essa, marcada no braço" e "ache o Ré♯ no braço" são a mesma
 * pergunta virada, com a mesma validação (altura, não grafia) e a mesma unidade de extensão
 * (faixas de casa). O que as separava era só a direção.
 *
 * ## O instrumento é configuração, com o do perfil por padrão
 *
 * Decisão dele: *"nos de instrumento, o padrão vira o instrumento padrão do usuário. Mas ele sempre
 * pode mudar isso dentro do instrumento e salvar isso como um preset nas suas próprias rotinas."*
 *
 * É isso que impede este item de virar três ("nota no piano", "nota no violão", "nota no baixo") — e
 * é o que permite uma rotina pedir piano numa etapa e violão na seguinte.
 */
export const notaNoInstrumento: CatalogItem = {
  id: 'nota-no-instrumento',
  objetos: ['notas'], tarefas: ['nomear', 'tocar'],
  primaryModule: 'theory',
  skillTags: ['keyboard.note_naming', 'keyboard.note_finding', 'fretboard.note_naming', 'fretboard.note_finding'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.keyboard', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'identificar', label: ctx.t('settings.nameIt') },
      { id: 'achar', label: ctx.t('settings.findIt') },
      { id: 'audiar', label: ctx.t('settings.audiateIt') },
    ] },
    // `auto` é o instrumento do perfil. Mudar aqui e salvar na rotina é o caminho que o Paulo pediu.
    // `INST` já traz "o meu (do perfil)", violão e baixo; aqui o piano entra junto, porque neste
    // item ele é um instrumento como os outros e não uma superfície à parte.
    { ...INST(ctx), options: [...(INST(ctx).options ?? []), { id: 'piano', label: ctx.t('settings.instrumentPiano') }] },
    { ...FRETS(ctx), quando: s => s.instrumento !== 'piano' },
    { id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle', quando: s => s.instrumento === 'piano' },
    { id: 'oitavas', label: ctx.t('settings.octaves'), type: 'single', quando: s => s.instrumento === 'piano',
      options: [{ id: '1', label: '1' }, { id: '2', label: '2' }] },
  ],
  defaults: { direcao: 'identificar', instrumento: 'auto', casas: '0-5', pretas: true, oitavas: '2' },
  make(s, ctx): Question {
    if (s.instrumento === 'piano') {
      const { lo, hi } = regiao(ctx, { lo: 48, hi: s.oitavas === '1' ? 59 : 71 });
      if (s.direcao === 'achar') {
        const p = pick(pcsPermitidas(ctx).filter(x => s.pretas || !PRETAS.includes(x)));
        const soa = alturaDoPc(ctx, p, { lo, hi });
        return {
          prompt: ctx.t('quiz.tapNote', { note: pcNameUm(p, ctx.naming, Math.random() < 0.5) }),
          visual: { kind: 'text', text: '' },
          surface: { kind: 'keyboard', lo, hi }, expected: { kind: 'pitchClass', pc: p },
          sound: { groups: [[soa]] }, reveal: pcNameUm(p, ctx.naming, false),
        };
      }
      const m = alturaDeTeclado(ctx, s, lo, hi);
      return {
        prompt: ctx.t('quiz.whatNote'), visual: { kind: 'keyboard', lo, hi, marks: [m] },
        surface: { kind: 'choices', options: teclasPermitidas(ctx, s) }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
        sound: { groups: [[m]] }, reveal: pcNameUm(mod(m, 12), ctx.naming, false),
      };
    }

    const tuning = tuningOf(s, ctx);
    const [from, to] = fretRange(s);
    const { str, f, m } = casaPermitida(tuning, from, to, ctx);
    if (s.direcao === 'audiar') {
      // A posição aparece marcada, o contexto toca, e o gabarito espera o botão.
      const tonica = tonicaDeContexto(ctx, m);
      return {
        prompt: ctx.t('quiz.audiateOnNeck'),
        visual: { kind: 'fretboard', tuning, from, to, marks: [{ s: str, f }] },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]], instrument: vozDoBraco(tuning),
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [[m]] },
          ],
        },
        autoplay: false, reveal: ctx.t('quiz.atFret', { note: pcNameUm(mod(m, 12), ctx.naming, false), fret: f }),
      };
    }
    if (s.direcao === 'achar') {
      // Uma grafia só, sorteada, e a mesma no enunciado e no gabarito — ver `pcNameUm`.
      const bemol = Math.random() < 0.5;
      const nome = pcNameUm(mod(m, 12), ctx.naming, bemol);
      return {
        prompt: ctx.t('quiz.tapNoteOnNeck', { note: nome }), visual: { kind: 'text', text: '' },
        surface: { kind: 'fretboard', tuning, from, to }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
        sound: { groups: [[m]], instrument: vozDoBraco(tuning) },
        reveal: ctx.t('quiz.atFret', { note: nome, fret: f }),
      };
    }
    return {
      prompt: ctx.t('quiz.whatNote'), visual: { kind: 'fretboard', tuning, from, to, marks: [{ s: str, f }] },
      surface: { kind: 'choices', options: pcOptions(ctx.naming) }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
      sound: { groups: [[m]], instrument: vozDoBraco(tuning) }, reveal: pcNameUm(mod(m, 12), ctx.naming, false),
    };
  },
};
