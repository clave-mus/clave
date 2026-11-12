import { ALL_CHORDS, CHORDS, CLEFS, ROOTS, arr, buildChord, chordName, chordOptions, chordTypes, midi, pcPermitido, pick, pickClef, randInt, tonicaDeContexto } from '../helpers';
import type { ChordId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Acorde na pauta: **ler** a cifra do que está escrito, ou **audiar** o acorde escrito.
 *
 * Metade de `que-acorde-e-esse`, pelo eixo que a reorganização de 09–10/11/2026 fixou: o estímulo
 * define o item, e aqui o estímulo é notação. O porquê está em `nota-na-pauta.ts`.
 *
 * ## Falta o oposto, e ele tem nome
 *
 * O Paulo notou: *"qual acorde é esse (não tem oposto, mas poderia ter — desenhe o acorde ou algo
 * assim)"*. **Desenhar não entrou aqui**, e não por esquecimento: `Response` só sabe de cifra
 * digitada (`{ kind: 'chord', text }`), e colocar notas numa pauta precisa de três coisas novas —
 * uma superfície que acumula notas, uma resposta que as carrega, e uma conferência que diga se
 * aquelas notas formam aquele acorde. É peça própria, do tamanho da superfície `sequence`, e está na
 * ordem do `OR-ouvido-relativo.md`.
 */
export const acordeNaPauta: CatalogItem = {
  id: 'acorde-na-pauta',
  objetos: ['acordes', 'notacao'], tarefas: ['nomear', 'ler'],
  primaryModule: 'theory',
  skillTags: ['theory.chord_identification', 'notation.pitch_reading'],
  contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions', 'clef.treble', 'clef.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic', 'self_report'], mobile: true,
  // `range` entra porque `tonicaDeContexto` (direção `audiar`) lê o piso da região para não botar
  // o contexto fora dela. O teste `contexto-declarado` pegou a omissão.
  respeita: ['key', 'material', 'range'],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'ler', label: ctx.t('settings.readIt') },
      { id: 'audiar', label: ctx.t('settings.audiateIt') },
    ] },
    CLEFS(ctx),
    { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', justify: true, options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle' },
  ],
  defaults: { direcao: 'ler', claves: ['sol'], tipos: ['maior', 'menor', 'dim', 'aum'], inversoes: false },
  presentation: { arp: 0.08 },
  make(s, ctx) {
    const types = arr(s.tipos, ['maior']) as ChordId[];
    const type = pick(types);
    const clef = pickClef(s, ctx);
    const root = { ...ROOTS[pcPermitido(ctx)], oct: clef === 'sol' ? 4 : 2 };
    const inv = s.inversoes ? randInt(0, CHORDS[type].degs.length - 1) : 0;
    const notes = buildChord(root, type, inv);
    const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);

    if (s.direcao === 'audiar') {
      const tonica = tonicaDeContexto(ctx, Math.min(...notes.map(midi)));
      return {
        prompt: ctx.t('quiz.audiateChord'), visual: { kind: 'staff', clef, columns: [notes] },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            // O arpejo primeiro, depois o bloco: audiar um acorde é audiar as notas e depois a soma.
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [...notes.map(n => [midi(n)]), notes.map(midi)] },
          ],
        },
        autoplay: false, reveal: sym,
      };
    }
    return {
      prompt: ctx.t('quiz.whatChord'), visual: { kind: 'staff', clef, columns: [notes] },
      surface: { kind: 'choices', options }, expected,
      sound: { groups: [notes.map(midi)] },
      reveal: ctx.t('quiz.chordReveal', { symbol: sym, name: chordName(ctx.t, type).toLowerCase() }),
    };
  },
};
