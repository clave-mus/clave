import { ALL_CHORDS, CHORDS, CLEFS, ROOTS, arr, buildChord, chordName, chordOptions, chordTypes, midi, pcPermitido, pick, pickClef, randInt } from '../helpers';
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
  // `range` saiu em 12/11 com o `audiar`: era `tonicaDeContexto` que o lia, e ela foi para a
  // linha de ouvido. `contexto-declarado` mede as chamadas reais e cobrou na hora.
  respeita: ['key', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **O seletor de direção saiu em 12/11.** Ele tinha dois valores, e o segundo era `audiar`, que
     * foi para a linha de ouvido (`ouvido-acorde`, estímulo `escrito`). Sobrou um valor só, e
     * seletor de um valor é interface morta — o teste `configuracoes-vivas` cobrou isso na hora.
     */
    CLEFS(ctx),
    { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', justify: true, options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle' },
  ],
  defaults: { claves: ['sol'], tipos: ['maior', 'menor', 'dim', 'aum'], inversoes: false },
  presentation: { arp: 0.08 },
  make(s, ctx) {
    const types = arr(s.tipos, ['maior']) as ChordId[];
    const type = pick(types);
    const clef = pickClef(s, ctx);
    const root = { ...ROOTS[pcPermitido(ctx)], oct: clef === 'sol' ? 4 : 2 };
    const inv = s.inversoes ? randInt(0, CHORDS[type].degs.length - 1) : 0;
    const notes = buildChord(root, type, inv);
    const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);

    return {
      prompt: ctx.t('quiz.whatChord'), visual: { kind: 'staff', clef, columns: [notes] },
      surface: { kind: 'choices', options }, expected,
      sound: { groups: [notes.map(midi)] },
      reveal: ctx.t('quiz.chordReveal', { symbol: sym, name: chordName(ctx.t, type).toLowerCase() }),
    };
  },
};
