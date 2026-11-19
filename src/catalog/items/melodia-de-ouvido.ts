import { CADENCIAS, acordeNoTeto, caberNaFaixa, cadenciaHarmonica } from '../../theory/cadencia-harmonica';
import { grauDaFundamental } from '../../theory/campo-harmonico';
import { MAX_NOTAS, MIN_NOTAS, SALTO_PADRAO, sortearMelodia } from '../../theory/melodia';
import { GRAUS_ESCOLHIDOS, arr, casasDaAltura, clave, faixaDoBraco, grausDaTonalidade, mod, nomeNaTonalidade, notaGrafada, pcsDosGraus, plain, superficieDoPerfil, quintasDaTonalidade, regiao, tonicaNaRegiao, vozDoBraco, TIMBRE, TIMBRE_DEFAULTS, vozDaPergunta } from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem, Question, Surface } from '../types';

/**
 * **Melodia de ouvido** — a linha §3.2 do `OR-ouvido-relativo.md`, e o molde do modelo novo.
 *
 * ## O modelo que este item estreia (decisão do Paulo, 12/11/2026)
 *
 * Ele perguntou onde entraria *"ler uma sequência de graus — 1543 — e conseguir audiá-la, ouvindo
 * apenas um contexto"*, e a pergunta não tinha resposta: o `audiar` estava pendurado em seis itens
 * de **notação**, e nenhum deles é melodia. Daí a troca de modelo:
 *
 * > **O item é o objeto musical e o seu gerador. Direção (ouvir / audiar) e superfície são
 * > parâmetros.**
 *
 * O argumento que decidiu é o gerador: nota solta não tem, melodia tem (quantas notas, quais, em
 * que extensão, com que salto). Se o audiar morasse num `melodia-na-pauta`, aquele item precisaria
 * do mesmo gerador — e motor duplicado é proibido. Quem tem o gerador tem as duas direções.
 *
 * ## As duas direções
 *
 * | | estímulo | resposta |
 * |---|---|---|
 * | `ouvir` | contexto e a melodia tocada | as notas, **na ordem**, na superfície escolhida |
 * | `audiar` | contexto tocado e a melodia **escrita** | autoavaliação, com o gabarito num botão |
 *
 * A conferência de `ouvir` é o **contorno** (§4): o conjunto pode estar deslocado por oitavas, desde
 * que todas as notas juntas — é o que separa "ouviu o desenho" de "acertou a altura absoluta".
 */
/**
 * Dó maior **e só as notas dela**. Os atalhos de entrada precisam do material junto: com a
 * tonalidade sozinha o material segue cromático (é o padrão), e "três notas em dó maior" entregava
 * `1-♭6-♭7-7` — melodia cromática com salto de quinta não é entrada de nada. O rascunho do Paulo
 * pede exatamente estes três recortes: notas de dó maior, de dó menor, ou todas.
 */
const EM_DO_DIATONICO = { key: { tonic: 0, mode: 'maior' }, material: 'diatonico' } as const;

export const melodiaDeOuvido: CatalogItem = {
  id: 'melodia-de-ouvido',
  objetos: ['melodia', 'notas'], tarefas: ['ouvir', 'audiar'],
  primaryModule: 'perception.melodic', skillTags: ['ear.scale_degrees', 'ear.audiation'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'key.major', 'key.minor'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: RASCUNHO,
  settings: ctx => [
    GRAUS_ESCOLHIDOS(ctx),
    /**
     * **De onde vem a pergunta**: do som, ou do que está escrito.
     *
     * O id é `estimulo` e não `direcao` de propósito. `direcao` já quer dizer **direção melódica**
     * (sobe, desce, juntas) em `ouvido-intervalo`, `ouvido-escala` e nos padrões — e aquele é o
     * sentido musical certo da palavra. O eixo novo é outro: muda por onde o enunciado chega, que é
     * exatamente o que o modelo de 12/11 chama de estímulo.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    { id: 'notas', label: ctx.t('settings.howManyNotes'), type: 'range', min: MIN_NOTAS, max: MAX_NOTAS, step: 1,
      format: v => String(v) },
    /**
     * A superfície vale para as DUAS direções, e é o mesmo parâmetro: ouvindo, é onde se responde;
     * audiando, é onde a melodia aparece escrita. Foi o que o rascunho dele descreveu desde o começo.
     *
     * **Audiando, teclado e braço também servem** — desde 13/11, quando o Paulo pediu a animação:
     * *"faça com que rode uma animação mostrando quais teclas ou casas foram tocadas e em qual
     * ordem. Deixe ela lenta, com quase um segundo por nota."*
     *
     * Era o que faltava. Três notas num braço são três pontos acesos e nada diz qual é a primeira;
     * a alternativa era numerar as marcas, e ele escolheu mostrar a ordem **no tempo**. Com
     * `prefers-reduced-motion` a animação não roda e as marcas aparecem numeradas, porque a ordem
     * é informação do exercício e não enfeite.
     */
    { id: 'superficie', label: ctx.t('settings.answerWhere'), type: 'single', options: [
      { id: 'teclado', label: ctx.t('settings.instrumentPiano') },
      { id: 'braco', label: ctx.t('settings.onNeck') },
      { id: 'pauta', label: ctx.t('settings.onStaff') },
      { id: 'graus', label: ctx.t('settings.byDegrees') },
    ] },
    { id: 'salto', label: ctx.t('settings.maxLeap'), type: 'range', min: 1, max: 12, step: 1,
      format: v => ctx.t('settings.semitones', { n: String(v) }) },
    { id: 'contexto', label: ctx.t('settings.patternContext'), type: 'single', options: [
      { id: 'ii-V-I', label: ctx.t('settings.contextIIVI') },
      { id: 'I-IV-V-I', label: ctx.t('settings.contextIIVVI') },
      { id: 'nota', label: ctx.t('settings.contextTonic') },
    ] },
    { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.3, max: 2, step: 0.1,
      format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) },
    /**
     * **O timbre** — compartilhado em `TIMBRE`, de `helpers` (19/11): o do perfil, um escolhido, ou
     * sorteado a cada pergunta. O sorteio é o que treina ouvir independente do timbre.
     */
    ...TIMBRE(ctx),
  ],
  defaults: { estimulo: 'som', notas: 3, grausEscolhidos: [], salto: SALTO_PADRAO, contexto: 'ii-V-I', duracao: 0.9, ...TIMBRE_DEFAULTS },
  // Fora dos defaults estáticos de propósito — ver `superficieDoPerfil` em helpers.
  defaultsDo: ctx => ({ superficie: superficieDoPerfil(ctx) }),
  presets: [
    { id: 'tres', nome: 'presets.melodiaTres', settings: { estimulo: 'som', notas: 3, salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'graus', nome: 'presets.melodiaGraus', settings: { estimulo: 'som', notas: 3, superficie: 'graus', salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'cinco', nome: 'presets.melodiaCinco', settings: { estimulo: 'som', notas: 5, salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'audiar-graus', nome: 'presets.melodiaAudiarGraus', settings: { estimulo: 'escrito', notas: 4, superficie: 'graus', salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'audiar-pauta', nome: 'presets.melodiaAudiarPauta', settings: { estimulo: 'escrito', notas: 3, superficie: 'pauta', salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
  ],
  presentation: { gap: 0.55 },
  /**
   * **Uma classe de altura só não dá melodia.** O gerador não repete a mesma altura logo em seguida
   * (duas iguais coladas soariam como uma nota longa), então com uma nota escolhida e a região curta
   * não há segunda nota para ir. Recusar e explicar, não sortear o impossível (decisão 13).
   */
  problema(s, ctx) {
    const pcs = pcsDosGraus(ctx, arr(s.grausEscolhidos, []));
    const { lo, hi } = regiao(ctx);
    const quantasAlturas = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).filter(m => pcs.includes(mod(m, 12))).length;
    return quantasAlturas < 2 ? ctx.t('player.poucasNotas') : null;
  },
  make(s, ctx): Question {
    const n = Math.round(Number(s.notas ?? 3));
    /**
     * **Onde**, antes do sorteio — e é por isso que ele subiu para cá.
     *
     * A expressão estava escrita duas vezes, uma em cada ramo, e nas duas **depois** de a melodia
     * existir. Com isso o braço recebia uma melodia sorteada na região global: num baixo de quatro
     * cordas, uma nota podia simplesmente não ter casa, e então só havia escolher entre desenhar a
     * casa errada (era o que acontecia) ou não desenhar a nota. Sabendo a superfície antes, a
     * melodia nasce no alcance dela.
     */
    const onde = String(s.superficie ?? superficieDoPerfil(ctx));
    const noBraco = onde === 'braco';
    const tuning = ctx.params.tuning;
    const { lo, hi } = regiao(ctx);
    /**
     * No braço, a melodia se sorteia na **interseção** da região com o que o braço alcança. Se a
     * interseção não der duas alturas, vale o braço inteiro: tocar fora do instrumento é pior que
     * sair da região escolhida, e quem recusa configuração impossível é o `problema()`.
     */
    const alcance = faixaDoBraco(tuning, 0, 12);
    const faixa = noBraco
      ? (Math.min(hi, alcance.hi) - Math.max(lo, alcance.lo) >= 2
        ? { lo: Math.max(lo, alcance.lo), hi: Math.min(hi, alcance.hi) }
        : alcance)
      : { lo, hi };
    const melodia = sortearMelodia({ pcs: pcsDosGraus(ctx, arr(s.grausEscolhidos, [])), lo: faixa.lo, hi: faixa.hi, n, saltoMax: Math.round(Number(s.salto ?? SALTO_PADRAO)) });
    const tonica = tonicaNaRegiao(ctx, { lo: 55, hi: 64 });
    const cadencia = CADENCIAS.find(c => c === s.contexto);
    // O contexto cabe na MESMA faixa da melodia: nada soa fora do que a superfície desenha.
    const contexto: number[][] = caberNaFaixa(cadencia
      ? cadenciaHarmonica(cadencia, tonica, ctx.params.key?.mode === 'menor' ? 'menor-harmonica' : 'maior', true)
      : [acordeNoTeto(tonica, [0])], lo, hi);

    const audiando = s.estimulo === 'escrito';
    // Audiando, a melodia não toca: só o contexto. Ver `partes`, que é onde o gabarito mora.
    const grupos = audiando ? [...contexto] : [...contexto, [], ...melodia.map(m => [m])];
    const partes = [
      { id: 'contexto', label: ctx.t('quiz.partContext'), groups: contexto },
      ...(audiando
        ? [{ id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: melodia.map(m => [m]) }]
        : melodia.map((m, i) => ({ id: `n${i}`, label: ctx.t('quiz.partNote', { n: i + 1 }), groups: [[m]] }))),
    ];
    const grau = (m: number) => grauDaFundamental(m - tonica);
    const emGraus = melodia.map(grau).join('-');
    const comNomes = melodia.map(m => nomeNaTonalidade(ctx, mod(m, 12))).join('-');

    // Audiando, a superfície MOSTRA a melodia e a resposta é autoavaliação.
    if (audiando) {
      /**
       * Nos instrumentos a melodia é **animada**, nota por nota — é o que faz a ordem existir ali.
       * Na pauta e nos graus ela aparece de uma vez: a leitura da esquerda para a direita já é a
       * ordem, e animar seria enfeite.
       */
      const visual: Question['visual'] =
        onde === 'graus' ? { kind: 'text', text: '' }
        : onde === 'pauta' ? { kind: 'staff', clef: clave(ctx), fifths: quintasDaTonalidade(ctx) ?? undefined, columns: melodia.map(m => [notaGrafada(ctx, m)]) }
        : onde === 'teclado' ? { kind: 'keyboard', lo: Math.min(lo, ...melodia), hi: Math.max(hi, ...melodia), marks: melodia, animar: true }
        /**
         * No braço, **a primeira casa de cada nota**, e a melodia já foi sorteada no alcance dele —
         * então a animação tem uma marca por nota, na ordem. Antes, a nota que o braço não
         * alcançasse virava a casa 0 da corda mais grave: a animação mostrava outra melodia.
         *
         * Uma posição por nota, e não todas (como na referência do `ouvido-tecla`): aqui o que se
         * lê é a ORDEM, e três marcas simultâneas por nota desmanchariam a linha.
         */
        : { kind: 'fretboard', tuning, from: 0, to: 12, animar: true,
            marks: melodia.flatMap(m => casasDaAltura(tuning, m).slice(0, 1)) };
      return {
        prompt: onde === 'graus' ? ctx.t('quiz.audiateDegrees', { degrees: emGraus }) : ctx.t('quiz.audiateMelody'),
        visual,
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        // O gabarito soa no instrumento que está desenhado, não de piano.
        sound: { groups: grupos, partes, instrument: noBraco ? vozDoBraco(tuning) : undefined }, autoplay: false,
        reveal: `${emGraus}  ·  ${comNomes}`, presentation: vozDaPergunta(s, noBraco),
      };
    }

    /**
     * **A nota de partida, marcada no braço** (pedido dele em 19/11: *"melody by ear — no braço,
     * tem que aparecer uma nota de partida"*).
     *
     * O braço não tem onde se agarrar: a conferência aceita a melodia deslocada em **oitavas
     * inteiras** (§4), mas não deslocada em qualquer intervalo — então quem ouviu os intervalos
     * certos e começou meio tom fora erra tudo. Em ditado musical a primeira nota é dada; aqui ela
     * passa a ser dada também, e o resto continua sendo de ouvido.
     *
     * **`apoio` já existia no motor** e é o mesmo mecanismo da referência do `ouvido-tecla`: a
     * marca aparece em **todas** as posições onde aquela altura existe no braço — pedido dele em
     * 13/11, e a razão é do instrumento (ver o comentário no `Player`). O rótulo leva o nome, como
     * lá: marca sem nome é ponto misterioso.
     *
     * A nota de partida continua entre as `n` que se responde — é âncora, não desconto.
     */
    const partida = { midis: [melodia[0]], rotulos: { [melodia[0]]: nomeNaTonalidade(ctx, mod(melodia[0], 12)) } };

    /**
     * Respondendo por **graus**, a superfície é a `sequence` que já existe (a mesma do
     * `ouvido-celulas`): escolher entre todos os graus, em ordem. Nas outras três, é a superfície
     * do instrumento ou da pauta **acumulando** `n` alturas, e a conferência é o contorno.
     */
    const superficie: Surface = onde === 'graus'
      ? { kind: 'sequence', options: grausDaTonalidade(ctx).map(g => plain(g.id)), comprimento: n, separador: '-' }
      : onde === 'pauta' ? { kind: 'staff', clef: clave(ctx), accidentals: true, fifths: quintasDaTonalidade(ctx) ?? undefined, quantas: n }
      // O teclado cobre **o que soou**, não só a região: `caberNaFaixa` pode empurrar o contexto
      // acima do teto quando ele não cabe inteiro, e a tela não pode mentir sobre o que soou (o
      // teste `superficie-cobre-o-som` guarda isso desde 09/11).
      : onde === 'teclado' ? { kind: 'keyboard', lo: Math.min(lo, ...grupos.flat()), hi: Math.max(hi, ...grupos.flat()), quantas: n }
      : { kind: 'fretboard', tuning, from: 0, to: 12, quantas: n, apoio: partida };

    return {
      prompt: ctx.t('quiz.earMelody'),
      visual: { kind: 'ear', hint: ctx.t('quiz.earMelodyHint') },
      surface: superficie,
      expected: onde === 'graus' ? { kind: 'option', id: emGraus } : { kind: 'contorno', midis: melodia },
      sound: { groups: grupos, partes, instrument: noBraco ? vozDoBraco(tuning) : undefined }, autoplay: true,
      reveal: `${emGraus}  ·  ${comNomes}`, presentation: vozDaPergunta(s, noBraco),
    };
  },
};

// `casaDaAltura` e `notaEscrita` moravam aqui, e o comentário de uma delas dizia "a mesma conta dos
// outros itens" — o código admitindo a duplicação. As duas foram para `helpers.ts` em 13/11, uma vez
// só: `casasDaAltura` (que não inventa casa quando o braço não alcança) e `notaGrafada` (que grafa
// pela tonalidade). Ver a nota em `contexto-musical.ts`, onde está a história das cinco cópias.
