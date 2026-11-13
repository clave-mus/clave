import { ALL_CHORDS, CHORDS, EM_DO_MAIOR, TONALIDADE_LIVRE, arr, chordName, chordTypes, clave, pick, porComplexidade, randInt, tonicaNaRegiao } from '../helpers';
import type { ChordId, Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ouvidoAcorde: CatalogItem = {
  id: 'ouvido-acorde',
  objetos: ['acordes'], tarefas: ['ouvir'],
  primaryModule: 'perception.harmonic', skillTags: ['ear.chord_quality'],
  contentTags: ['chord.triads', 'chord.sevenths'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: LEGADO,
  settings: ctx => [{ id: 'tipos', label: ctx.t('settings.types'), type: 'multi', justify: true, options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true, present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
    { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.5, max: 4, step: 0.1, format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) },
    // Inversão aqui **não é a pergunta, é a dificuldade** (desenhado com o Paulo em 09/11). Um
    // acorde invertido continua sendo maior; o que muda é que a fundamental sai do baixo, e sem
    // ela o ouvido perde a muleta. Reconhecer a cor independente do baixo é a habilidade real.
    //
    // "Qual inversão" como PERGUNTA é outro exercício, o do campo harmônico: lá a inversão
    // distingue um I de um V com a terça no baixo, e aqui distinguiria nada.
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle' },
    /**
     * **Onde se responde** (`OR-ouvido-relativo.md`, §3.4: *"dois modos: alternativas com a
     * descrição, ou desenhar o acorde na pauta, no piano ou no violão"*).
     *
     * Desenhar é outra habilidade: nas alternativas você reconhece a cor e aponta o nome; desenhando
     * você tem de saber **quais notas** formam aquela cor. É o mesmo estímulo com resposta mais
     * exigente — e é por isso que a superfície é parâmetro e não item novo (decisão 15).
     *
     * `instrumento` é a superfície do desenho, e o padrão é o do perfil: o item passa a responder no
     * instrumento de quem usa, que é o pedido do §3.1.
     */
    { id: 'resposta', label: ctx.t('settings.answerWhere'), type: 'single', options: [
      { id: 'alternativas', label: ctx.t('settings.answerOptions') },
      { id: 'desenhar', label: ctx.t('settings.answerDraw') },
    ] },
    { id: 'instrumento', label: ctx.t('settings.instrument'), type: 'single', quando: s => s.resposta === 'desenhar',
      options: [
        { id: 'auto', label: ctx.t('settings.myInstrument') },
        { id: 'piano', label: ctx.t('settings.instrumentPiano') },
        { id: 'pauta', label: ctx.t('settings.onStaff') },
      ] }],
  defaults: { tipos: ['maior', 'menor'], arpejo: true, duracao: 2, inversoes: false, resposta: 'alternativas', instrumento: 'auto' },
  /**
   * "Todas as qualidades por padrão" (Paulo, 09/11) — então `tudo` virou o PRIMEIRO, porque o
   * primeiro atalho é a entrada do item.
   *
   * Com dó maior fixo, toda qualidade soa sobre dó. Isso é de propósito e ele concordou: o item
   * pergunta **qualidade**, e prender a fundamental tira a variação de altura e deixa só a cor.
   * Reconhecer o GRAU dentro de um campo é outro exercício, e é o novo.
   */
  presets: [
    { id: 'tudo', nome: 'presets.tudo', settings: { tipos: ALL_CHORDS }, params: EM_DO_MAIOR },
    { id: 'maior-menor', nome: 'presets.maiorMenor', settings: { tipos: ['maior', 'menor'] }, params: EM_DO_MAIOR },
    { id: 'triades', nome: 'presets.triades', settings: { tipos: ['maior', 'menor', 'aum', 'dim'] }, params: EM_DO_MAIOR },
    { id: 'tetrades', nome: 'presets.tetrades', settings: { tipos: ['7M', '7', 'm7', 'm7b5', 'dim7'] }, params: EM_DO_MAIOR },
    { id: 'suspensos', nome: 'presets.suspensos', settings: { tipos: ['maior', 'menor', 'sus2', 'sus4'] }, params: EM_DO_MAIOR },
    { id: 'livre', nome: 'presets.acordesLivre', settings: { tipos: ALL_CHORDS }, params: TONALIDADE_LIVRE },
  ],
  presentation: { gap: 0.45 },
  /**
   * `sus2` e `sus4` são **o mesmo conjunto de notas** — {0, 2, 7}. Dósus2 tem Dó, Ré e Sol;
   * Solsus4 tem Sol, Dó e Ré. Em posição fundamental o baixo os separa, mas a segunda inversão de
   * Dósus2 **é** Solsus4 na fundamental, nota por nota.
   *
   * Então com inversões ligadas e os dois marcados a pergunta tem duas respostas certas, e recusar
   * é o que a decisão 13 manda: item ambíguo não pode produzir "erro do usuário". Mesmo caso das
   * duas menores melódicas em `ouvido-escala`.
   *
   * Conferi por cálculo que é a **única** colisão entre as treze qualidades, a menos de
   * transposição — há teste que varre todas e falha se aparecer outra.
   */
  problema(s, ctx) {
    const types = arr(s.tipos, []) as ChordId[];
    const osDois = types.includes('sus2') && types.includes('sus4');
    return s.inversoes && osDois ? ctx.t('player.susAmbiguo') : null;
  },
  make(s, ctx): Question {
    const types = arr(s.tipos, ['maior', 'menor']) as ChordId[];
    const type = pick(types);
    const root = tonicaNaRegiao(ctx, { lo: 53, hi: 64 });
    const ms = CHORDS[type].degs.map(([, semi]) => root + semi);
    // Inverter é levar a nota mais grave uma oitava acima, tantas vezes quanto a inversão. Em
    // MIDI direto, como o resto do item — `buildChord` faz o mesmo sobre `Note`, e aqui não há
    // grafia para preservar.
    if (s.inversoes) {
      for (let k = randInt(0, ms.length - 1); k > 0; k--) ms.push(ms.shift()! + 12);
    }
    /**
     * Desenhando, o gabarito é **contorno não ordenada**: as notas que formam o acorde, em qualquer
     * ordem de clique e em qualquer oitava — desde que TODAS deslocadas junto (a regra do §4). Um
     * Dó maior desenhado uma oitava abaixo é um Dó maior; com uma nota solta fora, não é.
     */
    if (s.resposta === 'desenhar') {
      const noPiano = s.instrumento === 'piano' || (s.instrumento === 'auto' && ctx.params.instrument === 'piano');
      const naPauta = s.instrumento === 'pauta';
      const clef = clave(ctx);
      const superficie = naPauta
        ? { kind: 'staff' as const, clef, accidentals: true, quantas: ms.length }
        : noPiano
          ? { kind: 'keyboard' as const, lo: 48, hi: 72, quantas: ms.length }
          : { kind: 'fretboard' as const, tuning: ctx.params.tuning, from: 0, to: 12, quantas: ms.length };
      return {
        prompt: ctx.t('quiz.drawChord', { chord: chordName(ctx.t, type) }), visual: { kind: 'ear' },
        surface: superficie, expected: { kind: 'contorno', midis: ms, ordenada: false },
        sound: { groups: [ms] }, autoplay: true, reveal: chordName(ctx.t, type),
      };
    }
    return {
      prompt: ctx.t('quiz.earChord'), visual: { kind: 'ear' },
      // As opções de resposta saem em ordem de complexidade (U7), não na ordem em que a pessoa
      // marcou os chips — senão a ordem dos botões mudaria dependendo de como ela configurou.
      surface: { kind: 'choices', compact: types.length > 6, options: chordTypes(ctx.t, porComplexidade(types)) }, expected: { kind: 'option', id: type },
      sound: { groups: [ms] }, autoplay: true, reveal: chordName(ctx.t, type),
    };
  },
};
