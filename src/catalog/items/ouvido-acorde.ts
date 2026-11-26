import { caberNaFaixa } from '../../theory/cadencia-harmonica';
import { voicingsDe } from '../../theory/voicings';
import { midi } from '../../theory/core';
import { ALL_CHORDS, CHORDS, EM_DO_MAIOR, VER_O_QUE_SOOU, faixaDaRevelacao, TONALIDADE_LIVRE, alturaDoPc, arr, casaDaAltura, chordName, chordTypes, noteName, clave, faixaDoBraco, faixaQueCabe, notaGrafada, pick, porComplexidade, quintasDaTonalidade, randInt, tonalidade, vozDoBraco, TIMBRE, TIMBRE_DEFAULTS, vozDaPergunta } from '../helpers';
import type { ChordId, Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ouvidoAcorde: CatalogItem = {
  id: 'ouvido-acorde',
  objetos: ['acordes'], tarefas: ['ouvir', 'audiar'],
  primaryModule: 'ouvido', skillTags: ['ear.chord_quality'],
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
    /**
     * **Como o acorde soa: pilha fechada ou voicing de piano** (decidido com o Paulo em 19/11).
     *
     * Até aqui o item montava o acorde com uma linha — `root + semitons` —, então uma dada
     * qualidade soava **sempre no mesmo empilhamento**: fechado, da fundamental para cima. Com as
     * inversões ligadas viram 3 ou 4 sons; com o motor de `theory/voicings.ts`, **10 numa tríade e
     * 21 numa tétrade**, espalhados entre duas mãos, com qualquer grau no baixo e a quinta saindo
     * quando faz sentido. Medido, não estimado.
     *
     * Fica **desligado por padrão**: este item já é usado, e trocar o som dele por baixo mudaria o
     * exercício sem ninguém pedir. Quem quiser entra pelo atalho novo.
     *
     * **Só onde a resposta é nomear a qualidade**: desenhando, as notas precisam caber na
     * superfície, e um voicing de duas mãos chega a três oitavas — não cabe em doze casas de braço.
     */
    { id: 'voicing', label: ctx.t('settings.chordVoicing'), type: 'single', quando: s => ondeCabeVoicing(s), options: [
      { id: 'fechado', label: ctx.t('settings.voicingClose') },
      { id: 'piano', label: ctx.t('settings.voicingPiano') },
    ] },
    /**
     * **Sem a fundamental**: a terça e a sétima seguram o acorde e o baixo fica implícito. Só
     * existe com voicing, e só em tétrade — medido: numa tríade o motor devolve **zero** voicings,
     * porque sem a raiz sobram duas notas. `problema()` recusa a combinação em vez de sortear o
     * impossível.
     */
    { id: 'semFundamental', label: ctx.t('settings.withoutRoot'), type: 'toggle', quando: s => comVoicing(s) },
    // Inverter é rodar a pilha fechada. Com voicing isso já está incluído — o baixo pode ser
    // qualquer grau —, e dois controles fazendo meia coisa cada é pior que um.
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle', quando: s => !comVoicing(s) },
    /**
     * **Ver as notas ao conferir** — o teclado do que soou, depois de responder. Pedido dele em
     * 26/11, junto com a Tônica: *"seria legal pôr a mesma coisa como opção em acordes de ouvido e
     * graus do campo harmônico"*.
     *
     * Aqui ela vale para os dois modos de som: com voicing de piano ela mostra o voicing, e com
     * pilha fechada mostra a pilha. É o que soou, e não o que se imagina que soou.
     */
    VER_O_QUE_SOOU(ctx),
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
        // Sem "meu instrumento": o valor inicial vem do perfil (`defaultsDo`), e o chip diz qual é.
        { id: 'braco', label: ctx.t('settings.onNeck') },
        { id: 'piano', label: ctx.t('settings.instrumentPiano') },
        { id: 'pauta', label: ctx.t('settings.onStaff') },
        /**
         * **Pelo nome**, só audiando: o enunciado diz "audie um acorde maior com sétima" e nada é
         * desenhado. É o que o item `audiar` cobrava e que se perderia ao aposentá-lo (20/11) — o
         * único jeito de estudar acorde de ouvido sem tela e sem instrumento.
         */
        { id: 'nome', label: ctx.t('settings.showName') },
      ] },
    /**
     * **O timbre** — compartilhado em `TIMBRE`, de `helpers` (19/11): o do perfil, um escolhido, ou
     * sorteado a cada pergunta. O sorteio é o que treina ouvir independente do timbre.
     */
    ...TIMBRE(ctx)],
  defaults: { verOQueSoou: true, estimulo: 'som', fundamental: 'fixa', tipos: ['maior', 'menor'], arpejo: true, duracao: 2, inversoes: false, resposta: 'alternativas', voicing: 'fechado', semFundamental: false, ...TIMBRE_DEFAULTS },
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
    // Tétrades porque é onde o motor rende mais (21 voicings contra 10 da tríade) e onde "sem a
    // fundamental" existe.
    { id: 'voicings', nome: 'presets.acordesVoicings', settings: { tipos: ['7M', '7', 'm7', 'm7b5', 'dim7'], voicing: 'piano' }, params: EM_DO_MAIOR },
  ],
  presentation: { gap: 0.45 },
  // Sem perfil de piano, o desenho é no braço — ver `INST` em helpers sobre o fim do "auto".
  defaultsDo: ctx => ({ instrumento: ctx.params.instrument === 'piano' ? 'piano' : 'braco' }),
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
    if (s.inversoes && osDois) return ctx.t('player.susAmbiguo');
    /**
     * **Sem a fundamental, só tétrade.** Tirar a raiz de uma tríade deixa duas notas, e o motor
     * devolve zero voicings — medido nas seis tríades e nos dois suspensos. A conta é por número de
     * graus, e não pela lista `TRIADS`, porque `sus2` e `sus4` também têm três notas e não estão
     * nela.
     *
     * Basta **uma** marcada para recusar: o sorteio escolhe entre as marcadas, e uma tríade no meio
     * de tétrades daria, de vez em quando, uma pergunta sem som nenhum.
     */
    if (comVoicing(s) && s.semFundamental === true && types.some(t => CHORDS[t].degs.length < 4)) {
      return ctx.t('player.voicingSemTriade');
    }
    return null;
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
    /**
     * **Desenhando no braço, o acorde tem de caber no braço.**
     *
     * A janela da fundamental era 53–64 fixa, e o acorde cresce dela: onze semitons de tétrade mais
     * até oito de inversão. Num baixo de quatro cordas (casas 0–12 vão do Mi1 ao Mi4, 28 a 55) isso
     * sai do instrumento, e aí não havia casa para clicar a resposta — defeito que a varredura de
     * 13/11 achou junto com o gêmeo em `ouvido-intervalo`.
     *
     * O desconto é a extensão do que vai soar, para a nota mais aguda caber também.
     */
    const noBracoDesenhado = (s.resposta === 'desenhar' || s.estimulo === 'escrito')
      && s.instrumento !== 'pauta'
      && s.instrumento !== 'piano';
    const extensao = Math.max(...CHORDS[type].degs.map(([, semi]) => semi)) + (s.inversoes ? 12 : 0);
    const alcance = faixaDoBraco(ctx.params.tuning, 0, 12);
    const janela = noBracoDesenhado
      ? { lo: alcance.lo, hi: Math.max(alcance.lo, Math.min(64, alcance.hi - extensao)) }
      : { lo: 53, hi: 64 };
    let root = alturaDoPc(ctx, pcDaFundamental, janela);
    const ms = CHORDS[type].degs.map(([, semi]) => root + semi);
    // Inverter é levar a nota mais grave uma oitava acima, tantas vezes quanto a inversão. Em
    // MIDI direto, como o resto do item — `buildChord` faz o mesmo sobre `Note`, e aqui não há
    // grafia para preservar.
    if (s.inversoes) {
      for (let k = randInt(0, ms.length - 1); k > 0; k--) ms.push(ms.shift()! + 12);
    }
    /**
     * **E, no braço, o acorde inteiro é empurrado para dentro dele** — por oitavas, com
     * `caberNaFaixa`, o mesmo motor que a cadência usa.
     *
     * Descontar a extensão da janela da fundamental (acima) resolve a maioria dos casos, mas não
     * todos: `alturaDoPc` cruza a janela com a região de quem usa, e quando nenhuma oitava daquela
     * classe cabe na interseção ela cai num fallback que **passa do teto**. Medido pelo guarda de
     * varredura, e só na quinta rodada, porque depende do sorteio: MIDI 57 num braço cuja última
     * casa dá 55.
     *
     * Deslocar o conjunto por oitavas não muda a pergunta — a qualidade do acorde é a mesma e as
     * classes de altura também —, e é a única operação que garante o acorde dentro do instrumento
     * sem mexer no que foi sorteado.
     */
    /**
     * **A fundamental acompanha o deslocamento** — e esquecê-la foi um defeito que eu introduzi
     * aqui mesmo, pego pelo teste `direcao-audiar` na mesma rodada.
     *
     * `root` é o que toca como **contexto** ("a tônica, para fixar o centro"). Deslocando só `ms`,
     * o contexto soava numa oitava e o acorde desenhado estava noutra: a referência que deveria
     * ancorar o ouvido apontava para fora do que se vê. Um deslocamento, nas duas coisas.
     */
    if (noBracoDesenhado) {
      /**
       * A **cópia** é obrigatória: `caberNaFaixa` devolve os mesmos arrays quando o deslocamento é
       * zero, e sem copiar o `ms.length = 0` abaixo zerava a própria fonte — o acorde saía **vazio**,
       * sem marca no braço e sem som. Peguei pelo teste `direcao-audiar`, não pela varredura: ela
       * conferia que a resposta cabe na superfície, e uma resposta vazia cabe em qualquer lugar.
       */
      const dentro = [...caberNaFaixa([ms], alcance.lo, alcance.hi)[0]];
      root += dentro[0] - ms[0];
      ms.length = 0;
      ms.push(...dentro);
    }
    /**
     * **Audiar**: o acorde aparece desenhado, a tônica toca como contexto, e o arpejo fica no botão
     * de conferência. Mesma superfície do modo "desenhar", lida em vez de clicada.
     */
    if (s.estimulo === 'escrito') {
      const noPiano = s.instrumento === 'piano';
      const noBraco = !noPiano && s.instrumento !== 'pauta';
      const tuning = ctx.params.tuning;
      const visual: Question['visual'] = s.instrumento === 'nome'
        ? { kind: 'text', text: '' }
        : s.instrumento === 'pauta'
        ? { kind: 'staff', clef: clave(ctx), fifths: quintasDaTonalidade(ctx) ?? undefined, columns: ms.map(m => [notaGrafada(ctx, m)]) }
        : noPiano ? { kind: 'keyboard', ...faixaQueCabe(ms), marks: ms }
        // **Só as notas que o braço alcança são desenhadas.** `casaDaAltura` devolvia a casa 0 da
        // corda mais grave quando não achava — um Mi2 no lugar da nota pedida, calado. O acorde
        // desenhado não era o acorde, e a pessoa audiava outra coisa.
        : { kind: 'fretboard', tuning, from: 0, to: 12, marks: ms.map(m => casaDaAltura(tuning, m)).filter((c): c is { s: number; f: number } => c !== null) };
      return {
        prompt: s.instrumento === 'nome'
          ? ctx.t('quiz.audiateChordByName', { chord: chordName(ctx.t, type) })
          : ctx.t(s.instrumento === 'pauta' ? 'quiz.audiateChord' : 'quiz.audiateChordOnInstrument'),
        visual,
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[root]],
          // O timbre segue o desenho: um acorde mostrado no braço soava de piano, que foi queixa
          // dele em 13/11 no `audiar` do braço.
          instrument: noBraco ? vozDoBraco(tuning) : undefined,
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[root]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: ms.map(m => [m]) },
          ],
        },
        autoplay: false, reveal: chordName(ctx.t, type), presentation: vozDaPergunta(s, noBraco),
      };
    }

    /**
     * Desenhando, o gabarito é **contorno não ordenada**: as notas que formam o acorde, em qualquer
     * ordem de clique e em qualquer oitava — desde que TODAS deslocadas junto (a regra do §4). Um
     * Dó maior desenhado uma oitava abaixo é um Dó maior; com uma nota solta fora, não é.
     */
    /**
     * **Um botão por nota do acorde**, no molde do `ouvido-intervalo` (18/11).
     *
     * O documento dele pede em Qualidades de acordes com as mesmas palavras: *"Interface: ter botoes
     * pra ouvir as notas separadas caso precise"*. Existia só audiando; ouvindo, havia o botão
     * grande e nada mais — e é ouvindo que repetir a terça até ela entrar resolve a pergunta.
     *
     * Não é o mesmo que arpejar: arpejo toca as notas na sequência, de uma vez. Aqui cada nota é um
     * botão, e quem decide usar é quem está ouvindo — *"quem está nomeando escolhe não usar"*.
     *
     * De baixo para cima, porque num acorde não há "primeira que soou".
     */
    const porNota = (notas: number[]) => [...notas].sort((a, b) => a - b)
      .map((m, i) => ({ id: `n${i}`, label: ctx.t('quiz.partNote', { n: i + 1 }), groups: [[m]] }));

    if (s.resposta === 'desenhar') {
      const noPiano = s.instrumento === 'piano';
      const naPauta = s.instrumento === 'pauta';
      const clef = clave(ctx);
      const tuning = ctx.params.tuning;
      const superficie = naPauta
        // `empilhar`: acorde é uma coluna, não um arpejo. Ver a nota do Player sobre a pauta
        // que acumula — até 25/11 ela enviava na primeira nota, e este modo nunca pôde acertar.
        ? { kind: 'staff' as const, clef, accidentals: true, fifths: quintasDaTonalidade(ctx) ?? undefined, quantas: ms.length, empilhar: true }
        : noPiano
          // **A faixa cabe o acorde.** Era 48–72 fixo, e o acorde não: a fundamental sai da região
          // de quem usa e as inversões somam até 19 semitons. Com a região padrão o acorde chegava
          // a MIDI 83 — onze semitons acima da última tecla desenhada —, e não havia onde clicar a
          // resposta. Erro de configuração aparecendo como erro da pessoa.
          ? { kind: 'keyboard' as const, ...faixaQueCabe(ms), quantas: ms.length }
          : { kind: 'fretboard' as const, tuning, from: 0, to: 12, quantas: ms.length };
      return {
        prompt: ctx.t('quiz.drawChord', { chord: chordName(ctx.t, type) }), visual: { kind: 'ear' },
        surface: superficie, expected: { kind: 'contorno', midis: ms, ordenada: false },
        sound: { groups: [ms], partes: porNota(ms), instrument: !naPauta && !noPiano ? vozDoBraco(tuning) : undefined },
        autoplay: true, reveal: chordName(ctx.t, type), presentation: vozDaPergunta(s, !naPauta && !noPiano),
      };
    }
    /**
     * **O acorde, como voicing de piano** quando o parâmetro pede.
     *
     * `voicingsDe` coloca as notas sozinho dentro da região das duas mãos, então o que importa de
     * `root` é a classe de altura — a janela calculada acima vale para a pilha fechada.
     *
     * A lista nunca vem vazia aqui: `problema()` já recusou tríade sem fundamental, que é o único
     * caso medido em que o motor não tem o que devolver. O `??` é o cinto de segurança do tipo, e
     * cai na pilha fechada em vez de numa pergunta muda — foi assim que um acorde vazio passou por
     * três invariantes em 15/11.
     */
    const soam = comVoicing(s)
      ? (() => {
        const vs = voicingsDe(notaGrafada(ctx, root), type, { semFundamental: s.semFundamental === true });
        return vs.length ? vs[randInt(0, vs.length - 1)].todas.map(midi) : ms;
      })()
      : ms;
    return {
      prompt: ctx.t('quiz.earChord'), visual: { kind: 'ear' },
      // As opções de resposta saem em ordem de complexidade (U7), não na ordem em que a pessoa
      // marcou os chips — senão a ordem dos botões mudaria dependendo de como ela configurou.
      surface: { kind: 'choices', compact: types.length > 6, options: chordTypes(ctx.t, porComplexidade(types)) }, expected: { kind: 'option', id: type },
      // O teclado do que soou, com a fundamental nomeada — ver `Question.revelacao`.
      ...(s.verOQueSoou !== false && soam.length
        ? (() => {
            // Pela classe: com voicing de piano a fundamental pode estar noutra oitava — ou ausente,
            // quando "sem a fundamental" está ligado, e aí nenhuma tecla leva nome.
            const fund = soam.find(m => ((m % 12) + 12) % 12 === ((root % 12) + 12) % 12);
            return { revelacao: { kind: 'keyboard' as const, ...faixaDaRevelacao(soam), notas: soam,
              ...(fund !== undefined ? { rotulos: { [fund]: noteName(notaGrafada(ctx, root), ctx.naming) } } : {}) } };
          })()
        : {}),
      // O timbre é o padrão de `SoundContent`, que **é piano** — um voicing de piano tocado com voz
      // de braço soaria como coisa nenhuma, e é o defeito que ele pegou em 13/11 no audiar.
      sound: { groups: [soam], partes: porNota(soam) }, autoplay: true, reveal: chordName(ctx.t, type), presentation: vozDaPergunta(s),
    };
  },
};

/**
 * **Onde o voicing de piano se aplica**: só com som e resposta por alternativas. Desenhando, as
 * notas têm de caber na superfície; audiando (`escrito`), o acorde é o gabarito que aparece escrito.
 */
const ondeCabeVoicing = (s: Record<string, unknown>) => s.estimulo === 'som' && s.resposta === 'alternativas';
/** O voicing está mesmo em vigor? É `ondeCabeVoicing` mais a escolha da pessoa. */
const comVoicing = (s: Record<string, unknown>) => ondeCabeVoicing(s) && s.voicing === 'piano';
