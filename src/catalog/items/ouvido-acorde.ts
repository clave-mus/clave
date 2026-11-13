import { ALL_CHORDS, CHORDS, EM_DO_MAIOR, TONALIDADE_LIVRE, alturaDoPc, arr, chordName, chordTypes, clave, pick, porComplexidade, randInt, tonalidade } from '../helpers';
import type { ChordId, Ctx, Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/** A nota escrita de uma altura, na grafia com sustenido. */
function notaEscrita(m: number) {
  const pc = ((m % 12) + 12) % 12;
  return { letter: [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc] as 0, acc: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][pc], oct: Math.floor(m / 12) - 1 };
}
/** Uma casa que dá esta altura, da corda mais grave que a alcança. */
function casaDaAltura(ctx: Ctx, m: number) {
  for (let s = 0; s < ctx.params.tuning.length; s++) {
    const f = m - ctx.params.tuning[s];
    if (f >= 0 && f <= 12) return { s, f };
  }
  return { s: 0, f: 0 };
}

export const ouvidoAcorde: CatalogItem = {
  id: 'ouvido-acorde',
  objetos: ['acordes'], tarefas: ['ouvir'],
  primaryModule: 'perception.harmonic', skillTags: ['ear.chord_quality'],
  contentTags: ['chord.triads', 'chord.sevenths'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **De onde vem a pergunta** (modelo de 12/11). `escrito` é o oposto desta linha, nas palavras
     * dele: *"ler um acorde na pauta, piano ou violão e audiar o arpejo. ouvir a tônica pra ter
     * contexto. ouvir o gabarito como conferência."* A superfície do desenho (`instrumento`) serve
     * de estímulo sem nada novo — num acorde a ordem não importa, então as três servem.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', justify: true, options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true, present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
    { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.5, max: 4, step: 0.1, format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) },
    // Inversão aqui **não é a pergunta, é a dificuldade** (desenhado com o Paulo em 09/11). Um
    // acorde invertido continua sendo maior; o que muda é que a fundamental sai do baixo, e sem
    // ela o ouvido perde a muleta. Reconhecer a cor independente do baixo é a habilidade real.
    //
    // "Qual inversão" como PERGUNTA é outro exercício, o do campo harmônico: lá a inversão
    // distingue um I de um V com a terça no baixo, e aqui distinguiria nada.
    /**
     * **A fundamental é sempre a mesma?** (rascunho dele: *"se a tônica do acorde é sempre a mesma
     * (padrão: sim, dó)"*.)
     *
     * Era implícito: `tonicaNaRegiao` devolve a tônica da tonalidade quando há uma, e sorteia
     * quando ela é livre — então a resposta dependia de um parâmetro de PRÁTICA, não de uma escolha
     * sobre o exercício. Agora é explícito, e os dois convivem: com `sorteada` a fundamental muda a
     * cada rodada mesmo em dó maior.
     *
     * ⚠️ **Fundamental fixa muda a pergunta** (§3.4, aprendido no acorde do braço em 10/11): com
     * ela, "que acorde é" tem uma resposta só — a qualidade. Isso é desejado aqui, porque a
     * pergunta DESTE item é a qualidade; prender a fundamental tira a variação de altura e deixa só
     * a cor. Com `sorteada`, some a muleta de ouvir tudo sobre a mesma nota.
     */
    { id: 'fundamental', label: ctx.t('settings.chordRoot'), type: 'single', options: [
      { id: 'fixa', label: ctx.t('settings.rootFixed') },
      { id: 'sorteada', label: ctx.t('settings.rootRandom') },
    ] },
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
    { id: 'instrumento', label: ctx.t('settings.instrument'), type: 'single', quando: s => s.resposta === 'desenhar' || s.estimulo === 'escrito',
      options: [
        { id: 'auto', label: ctx.t('settings.myInstrument') },
        { id: 'piano', label: ctx.t('settings.instrumentPiano') },
        { id: 'pauta', label: ctx.t('settings.onStaff') },
      ] }],
  defaults: { estimulo: 'som', fundamental: 'fixa', tipos: ['maior', 'menor'], arpejo: true, duracao: 2, inversoes: false, resposta: 'alternativas', instrumento: 'auto' },
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
    /**
     * A fundamental: a tônica em vigor (fixa), ou uma classe de altura sorteada a cada rodada.
     *
     * **Fixa cai em dó quando a tonalidade é livre**, que é o que o rascunho pede ("padrão: sim,
     * dó"). `tonicaNaRegiao` não serve aqui: sem tonalidade ela SORTEIA a altura, e medindo saiu
     * doze fundamentais diferentes com a opção chamada "sempre a mesma" — uma opção que não fazia
     * o que o nome dela diz.
     */
    // Pela função de contexto, não por `ctx.params` direto: é a regra do projeto, e a sonda de
    // `contexto-declarado` mede as chamadas — ler direto faz o item declarar o que não se vê.
    const pcDaFundamental = s.fundamental === 'sorteada' ? randInt(0, 11) : tonalidade(ctx)?.tonic ?? 0;
    const root = alturaDoPc(ctx, pcDaFundamental, { lo: 53, hi: 64 });
    const ms = CHORDS[type].degs.map(([, semi]) => root + semi);
    // Inverter é levar a nota mais grave uma oitava acima, tantas vezes quanto a inversão. Em
    // MIDI direto, como o resto do item — `buildChord` faz o mesmo sobre `Note`, e aqui não há
    // grafia para preservar.
    if (s.inversoes) {
      for (let k = randInt(0, ms.length - 1); k > 0; k--) ms.push(ms.shift()! + 12);
    }
    /**
     * **Audiar**: o acorde aparece desenhado, a tônica toca como contexto, e o arpejo fica no botão
     * de conferência. Mesma superfície do modo "desenhar", lida em vez de clicada.
     */
    if (s.estimulo === 'escrito') {
      const noPiano = s.instrumento === 'piano' || (s.instrumento === 'auto' && ctx.params.instrument === 'piano');
      const visual: Question['visual'] = s.instrumento === 'pauta'
        ? { kind: 'staff', clef: clave(ctx), columns: ms.map(m => [notaEscrita(m)]) }
        : noPiano ? { kind: 'keyboard', lo: Math.min(48, ...ms), hi: Math.max(72, ...ms), marks: ms }
        : { kind: 'fretboard', tuning: ctx.params.tuning, from: 0, to: 12, marks: ms.map(m => casaDaAltura(ctx, m)) };
      return {
        prompt: ctx.t(s.instrumento === 'pauta' ? 'quiz.audiateChord' : 'quiz.audiateChordOnInstrument'), visual,
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[root]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[root]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: ms.map(m => [m]) },
          ],
        },
        autoplay: false, reveal: chordName(ctx.t, type),
      };
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
