import { ALL_CHORDS, CHORDS, CLEFS, arr, buildChord, chordName, chordOptions, chordTypes, midi, notaGrafada, noteName, pcPermitido, pick, pickClef, quintasDaTonalidade, randInt } from '../helpers';
import type { ChordId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Acorde na pauta: **ler** a cifra do que está escrito, ou **escrever** o acorde que a cifra pede.
 *
 * Metade de `que-acorde-e-esse`, pelo eixo que a reorganização de 09–10/11/2026 fixou: o estímulo
 * define o item, e aqui o estímulo é notação. O porquê está em `nota-na-pauta.ts`.
 *
 * ## O oposto entrou em 25/11, e o que o bloqueava já não existia
 *
 * O Paulo tinha notado: *"qual acorde é esse (não tem oposto, mas poderia ter — desenhe o acorde ou
 * algo assim)"*. Este comentário dizia que faltavam **três peças** — uma superfície que acumula
 * notas, uma resposta que as carrega, e uma conferência que diga se aquelas notas formam aquele
 * acorde. As três existem desde a linha de ouvido: `Surface.quantas` na pauta, `Response.pitches` e
 * o `contorno`. O bloqueio tinha envelhecido, e ninguém tinha voltado para conferir.
 *
 * Ele pediu em 25/11, ao ver a assimetria medida: nota e intervalo escrevem na pauta, acorde e
 * escala só liam.
 *
 * ## A conferência é por ALTURA, não por grafia
 *
 * Escrevendo UMA nota (`nota-na-pauta`), a conferência é a grafia — Dó♯ ≠ Ré♭, porque a pauta
 * distingue. Escrevendo um acorde, ela é o contorno, como no `ouvido-acorde` desenhando: a pessoa
 * põe três ou quatro notas, e exigir a grafia de cada uma transformaria um erro de enarmonia em
 * acorde errado. É a mesma escolha que já valia ali, e fica registrada aqui por ser diferente da
 * do vizinho de uma nota só.
 */
export const acordeNaPauta: CatalogItem = {
  id: 'acorde-na-pauta',
  objetos: ['acordes', 'notacao'], tarefas: ['nomear', 'ler'],
  primaryModule: 'leitura',
  skillTags: ['theory.chord_identification', 'notation.pitch_reading'],
  contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions', 'clef.treble', 'clef.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic', 'self_report'], mobile: true,
  // `range` saiu em 12/11 com o `audiar`: era `tonicaDeContexto` que o lia, e ela foi para a
  // linha de ouvido. `contexto-declarado` mede as chamadas reais e cobrou na hora.
  respeita: ['key', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **O seletor de direção voltou em 25/11**, com um segundo valor que não é o antigo: o `audiar`
     * saiu em 12/11 para a linha de ouvido e não volta. Agora o par é ler e **escrever**.
     */
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'ler', label: ctx.t('settings.readIt') },
      { id: 'escrever', label: ctx.t('chordOnStaff.writeIt') },
    ] },
    CLEFS(ctx),
    { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', justify: true, options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle' },
  ],
  defaults: { claves: ['sol'], tipos: ['maior', 'menor', 'dim', 'aum'], inversoes: false, direcao: 'ler' },
  /**
   * Os dois atalhos são as duas direções: nenhum item da pauta tinha atalho, e a direção nova sem
   * atalho ficaria escondida atrás de dois cliques no painel.
   */
  presets: [
    { id: 'ler-a-cifra', nome: 'presets.acordePautaLer', settings: { direcao: 'ler', tipos: ['maior', 'menor', 'dim', 'aum'], inversoes: false } },
    { id: 'escrever-na-pauta', nome: 'presets.acordePautaEscrever', settings: { direcao: 'escrever', tipos: ['maior', 'menor', '7', '7M', 'm7'], inversoes: false } },
    { id: 'escrever-invertido', nome: 'presets.acordePautaInvertido', settings: { direcao: 'escrever', tipos: ['maior', 'menor'], inversoes: true } },
  ],
  presentation: { arp: 0.08 },
  make(s, ctx) {
    const types = arr(s.tipos, ['maior']) as ChordId[];
    const type = pick(types);
    const clef = pickClef(s, ctx);
    // A fundamental **grafada pela tonalidade** (em Ré♭ maior, Sol♭ e não Fá♯): era `ROOTS[pc]`,
    // lista fixa que ignora a armadura desenhada ao lado. As notas do acorde seguem saindo de
    // `buildChord`, com a grafia da teoria — um Si aumentado tem Fá♯♯, e isso está certo.
    const oct = clef === 'sol' ? 4 : 2;
    const root = notaGrafada(ctx, (oct + 1) * 12 + pcPermitido(ctx));
    const inv = s.inversoes ? randInt(0, CHORDS[type].degs.length - 1) : 0;
    const notes = buildChord(root, type, inv);
    const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);

    /**
     * **Escrever**: a cifra é o enunciado, e a pauta é onde se responde. Invertido, a cifra leva o
     * baixo (`C/E`) — a mesma forma do `acorde-no-instrumento`, e pelo mesmo motivo: é assim que
     * ela aparece numa grade.
     */
    if (s.direcao === 'escrever') {
      const cifra = inv ? `${sym}/${noteName(notes[0], 'en')}` : sym;
      return {
        prompt: ctx.t('chordOnStaff.writePrompt', { chord: cifra }),
        visual: { kind: 'text', text: '' },
        surface: { kind: 'staff', clef, accidentals: true, fifths: quintasDaTonalidade(ctx) ?? undefined, quantas: notes.length, empilhar: true },
        expected: { kind: 'contorno', midis: notes.map(midi), ordenada: false },
        // Ouvir é escolha: o acorde não toca sozinho, ou ler a cifra vira ditado.
        sound: { groups: [notes.map(midi)] }, autoplay: false,
        reveal: cifra,
      };
    }

    return {
      prompt: ctx.t('quiz.whatChord'), visual: { kind: 'staff', clef, fifths: quintasDaTonalidade(ctx) ?? undefined, columns: [notes] },
      surface: { kind: 'choices', options }, expected,
      sound: { groups: [notes.map(midi)] },
      reveal: ctx.t('quiz.chordReveal', { symbol: sym, name: chordName(ctx.t, type).toLowerCase() }),
    };
  },
};
