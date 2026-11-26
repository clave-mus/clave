import {
  ALL_CHORDS, ALTERADOS, EXTENSOES, SEVENTHS, TRIADS, arr, chordName, chordSymbol, mod, notaGrafada, noteName, pick,
  type ChordId, type Ctx, type MessageKey, type Question, type SettingValue, TIMBRE, TIMBRE_DEFAULTS,
  faixaDaRevelacao, vozDaPergunta,
} from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem } from '../types';
import { arpejoDoPapel, inversoesDe, semisDoGrau, type Papel } from '../../theory/nota-comum';
import { CHORDS, buildChord, fromMidi, midi, pcName, transpose } from '../../theory/core';

/**
 * **Os papéis, com a chave de texto escrita por extenso.**
 *
 * ⚠️ Nada de `commonTone.role_${grau}`: chave montada em tempo de execução é invisível para o teste
 * de texto órfão, que varre o código procurando cada chave de `pt`. Já me pegou duas vezes neste
 * projeto — a primeira com os nomes de corda do braço, a segunda com as famílias de modo.
 */
const PAPEIS: [number, MessageKey][] = [
  [1, 'commonTone.role_1'], [3, 'commonTone.role_3'], [5, 'commonTone.role_5'], [7, 'commonTone.role_7'],
  [9, 'commonTone.role_9'], [11, 'commonTone.role_11'], [13, 'commonTone.role_13'],
];
const rotuloDoPapel = (ctx: Ctx, grau: number): string =>
  ctx.t(PAPEIS.find(([g]) => g === grau)?.[1] ?? 'commonTone.role_1');

/**
 * **A nota comum** — uma nota parada, e os acordes em que ela cabe com papéis diferentes.
 *
 * Desenho do Paulo em 26/11/2026, do *ear training for crazy people* do Tim Collins:
 *
 * > *"se escolhe uma nota. por exemplo, dó. essa nota então assume diferentes papéis em diferentes
 * > acordes, e o aluno tem que solfejar os arpejos desses acordes."*
 *
 * ## Por que item novo
 *
 * Pelo critério do modelo de 12/11 — *o item é o objeto musical e o seu gerador* —, e o gerador não
 * existia: papel (qualidade + grau que a nota ocupa) → fundamental → arpejo a partir da âncora.
 * Nenhum item do catálogo parte de uma nota fixa para achar o acorde; a `tonica-de-ouvido` faz o
 * caminho inverso (o acorde soa, a fundamental é a resposta).
 *
 * ## E a "versão mais simples" dele é um parâmetro, não um segundo item
 *
 * Ele escreveu: *"talvez uma versão mais simples desse exercício seja uma na qual a nota fixa é
 * sempre a tônica de diferentes acordes"*. Isso é o mesmo gerador com o papel preso no grau 1 — e
 * por isso é o atalho `so-fundamental`, não um item. É a decisão 15 em estado puro.
 *
 * ## Conferência
 *
 * Autoavaliação, como toda a linha de audiar: o app não ouve. O gabarito mora nos pedaços — o
 * arpejo nota por nota e o acorde inteiro — e no teclado da revelação, que mostra onde cada nota
 * caiu e deixa tocar uma a uma.
 */
export const notaComum: CatalogItem = {
  id: 'nota-comum',
  objetos: ['acordes', 'notas'], tarefas: ['audiar'],
  primaryModule: 'ouvido', skillTags: ['ear.audiation', 'ear.chord_quality'],
  contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions'],
  kind: 'serie', requires: {}, validation: ['self_report'], mobile: true,
  /**
   * **Declara `key` porque LÊ `key`** — e só para grafar: em Ré♭ maior a nota comum se escreve Ré♭,
   * e o acorde vem grafado pela mesma regra. O guarda de 26/11 pegou isto quando eu havia declarado
   * nada: `nomeNaTonalidade` e `notaGrafada` consultam a tonalidade, e declarar menos do que se lê é
   * mentir para quem monta uma rotina.
   *
   * ⚠️ O que a tonalidade **não** faz aqui é escolher a nota comum: ela é o parâmetro central do
   * exercício e vem do painel. O ponto é a mesma nota servindo a acordes de várias tonalidades.
   */
  respeita: ['key'],
  publicacao: RASCUNHO,
  settings: ctx => [
    /**
     * **Qual é a nota parada.** Escolhida, com dó como padrão — decisão dele em 26/11.
     *
     * Fixa é o espírito do exercício (a âncora não se move), mas quem toca um instrumento
     * transpositor, ou quer sair do dó depois de um tempo, não deveria precisar de item novo.
     * Sortear a cada rodada mataria a âncora e viraria outro exercício.
     */
    { id: 'notaComum', label: ctx.t('commonTone.theNote'), type: 'single', justify: true,
      options: Array.from({ length: 12 }, (_, p) => ({ id: String(p), label: pcName(p, ctx.naming) })) },
    /**
     * **Que acordes entram** — por família, como na `tonica-de-ouvido`: 25 qualidades viram 25 chips
     * numa tela de celular, e isso é um muro.
     */
    { id: 'familias', label: ctx.t('settings.types'), type: 'multi', justify: true, options: [
      { id: 'triades', label: ctx.t('settings.triads') },
      { id: 'tetrades', label: ctx.t('settings.tetrads') },
      { id: 'extensoes', label: ctx.t('settings.extensions') },
      { id: 'alterados', label: ctx.t('settings.altered') },
    ] },
    /**
     * **Que papel a nota comum pode ocupar.** É o eixo do exercício: dó como fundamental é um
     * desenho, dó como terça é outro, dó como ♭9 é outro.
     *
     * O padrão é 1, 3 e 5 — *"que comece simples"*, e os atalhos levam o resto. Papel que a família
     * marcada não oferece simplesmente não sai no sorteio; não há erro a dar.
     */
    { id: 'papeis', label: ctx.t('commonTone.roles'), type: 'multi', justify: true,
      options: PAPEIS.map(([g, rotulo]) => ({ id: String(g), label: ctx.t(rotulo) })) },
    /**
     * **Quem fica no chão** — a inversão, que no arpejo cantado é só isso: qual nota é a mais grave
     * (decisão dele em 26/11, sobre a tabela que eu propus).
     *
     * Padrão na fundamental, para o item começar simples. Com `sorteada`, o baixo muda a cada
     * rodada e o desenho muda com ele, que é a habilidade a mais.
     */
    { id: 'inversao', label: ctx.t('settings.inversions'), type: 'single', options: [
      { id: 'fundamental', label: ctx.t('commonTone.bassRoot') },
      { id: 'sorteada', label: ctx.t('commonTone.bassAny') },
    ] },
    ...TIMBRE(ctx),
  ],
  defaults: {
    notaComum: '0', familias: ['triades'], papeis: ['1', '3', '5'], inversao: 'fundamental', ...TIMBRE_DEFAULTS,
  },
  /**
   * Os atalhos são a progressão que ele descreveu — *"que comece simples - alternando entre tônica,
   * terça e quinta de tríades diatônicas, depois mudando entre menor e maior... depois colocando
   * sétima, e assim por diante"* —, nomeados pelo conteúdo e nunca por nível (decisão 100).
   */
  presets: [
    { id: 'so-fundamental', nome: 'presets.notaComumSoFundamental',
      settings: { familias: ['triades'], papeis: ['1'], inversao: 'fundamental' } },
    { id: 'triades', nome: 'presets.notaComumTriades',
      settings: { familias: ['triades'], papeis: ['1', '3', '5'], inversao: 'fundamental' } },
    { id: 'com-setima', nome: 'presets.notaComumComSetima',
      settings: { familias: ['tetrades'], papeis: ['1', '3', '5', '7'], inversao: 'fundamental' } },
    { id: 'tensoes', nome: 'presets.notaComumTensoes',
      settings: { familias: ['extensoes', 'alterados'], papeis: ['7', '9', '11', '13'], inversao: 'fundamental' } },
    { id: 'invertidos', nome: 'presets.notaComumInvertidos',
      settings: { familias: ['triades', 'tetrades'], papeis: ['1', '3', '5', '7'], inversao: 'sorteada' } },
  ],
  presentation: { gap: 0.55 },
  /**
   * Família e papel podem não se cruzar — tríades e o papel de sétima, por exemplo. Recusar e
   * explicar é a decisão 13; sortear "o que sobrou" seria entregar uma pergunta que ninguém pediu.
   */
  problema(s, ctx) {
    if (!papeisPossiveis(s, ctx).length) return ctx.t('commonTone.noPair');
    return null;
  },
  make(s, ctx): Question {
    const possiveis = papeisPossiveis(s, ctx);
    const papel = pick(possiveis);
    const ancora = ALTURA_DA_ANCORA + Number(s.notaComum ?? 0);
    const baixo = s.inversao === 'sorteada' ? pick(inversoesDe(papel.qualidade)) : 1;
    const arpejo = arpejoDoPapel(ancora, papel, { baixo })!;

    /**
     * **O enunciado diz o papel, não a cifra** (decisão dele em 26/11): *"sim, diz o papel"*. É o
     * que o exercício treina — descobrir que acorde se forma a partir dali —, e dar a cifra antes
     * entregaria o trabalho. Ela aparece na revelação.
     *
     * A inversão entra no enunciado quando não é a fundamental, e isso **não** é entregar nada: sem
     * saber onde está o chão não há o que cantar, e a pergunta ficaria sem resposta definida.
     */
    /**
     * **A grafia sai do ACORDE, não de uma tabela de classes** — e isto foi visto na tela em 26/11,
     * no primeiro minuto de uso: o rodapé dizia `Cdim · Dó Ré♯ Fá♯`, e um diminuto se escreve
     * **Dó Mi♭ Sol♭**. `notaGrafada` resolve classe por classe e não sabe que acorde é aquele.
     *
     * O caminho certo é o que o motor já faz: a fundamental é a nota **um intervalo abaixo** da nota
     * comum (`transpose` com o número do grau e os semitons do papel, para baixo), e `buildChord`
     * grafa o resto a partir dela. Em dó como terça de um maior, a fundamental é **Lá♭** — letra lá
     * com bemol, e não sol sustenido, porque a terça de lá♭ é dó e a de sol♯ seria si♯.
     *
     * E o nome da nota comum passa a vir **do próprio acorde**: se o acorde se escreve com bemóis, a
     * âncora é Ré♭ e não Dó♯. Assim o enunciado e a cifra nunca se contradizem, que é a queixa dele
     * de 13/11 vista noutro item.
     */
    const raiz = raizLegivel(ctx, ancora, papel);
    const doAcorde = new Map(buildChord(raiz, papel.qualidade).map(n => [mod(midi(n), 12), n]));
    const grafar = (m: number) => doAcorde.get(mod(m, 12)) ?? notaGrafada(ctx, m);
    const nome = noteName(grafar(ancora), ctx.naming);
    const cifra = chordSymbol(raiz, papel.qualidade, ctx.conv);
    const prompt = baixo === 1
      ? ctx.t('commonTone.prompt', {
          note: nome, role: rotuloDoPapel(ctx, papel.grau), chord: nomeDaQualidade(ctx, papel.qualidade),
        })
      : ctx.t('commonTone.promptInverted', {
          note: nome, role: rotuloDoPapel(ctx, papel.grau), chord: nomeDaQualidade(ctx, papel.qualidade),
          bass: rotuloDoPapel(ctx, baixo),
        });
    /** O desenho por extenso, para a revelação: `Dó Lá Dó Mi`. */
    const desenho = arpejo.alturas.map(m => noteName(grafar(m), ctx.naming)).join(' ');

    return {
      prompt,
      visual: { kind: 'text', text: '' },
      surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
      sound: {
        /**
         * **Só a âncora toca sozinha**: é a altura de onde se parte, e sem ela não há como começar.
         * O arpejo e o acorde ficam nos pedaços — ouvi-los antes de tentar é escolha de quem
         * pratica, e o botão deixa isso explícito.
         */
        groups: [[ancora]],
        partes: [
          { id: 'contexto', label: ctx.t('commonTone.partAnchor'), groups: [[ancora]] },
          { id: 'resposta', label: ctx.t('commonTone.partArpeggio'), groups: arpejo.alturas.map(m => [m]) },
          { id: 'acorde', label: ctx.t('quiz.partChord'), groups: [arpejo.acorde] },
        ],
      },
      autoplay: true,
      reveal: `${cifra}  ·  ${desenho}`,
      // O teclado do que soou, com a nota comum nomeada: é ela que amarra o exercício.
      revelacao: { kind: 'keyboard', ...faixaDaRevelacao(arpejo.acorde), notas: arpejo.acorde,
        rotulos: { [ancora]: nome } },
      presentation: vozDaPergunta(s),
    };
  },
};

/**
 * **Dó4 e vizinhos**: a âncora soa na oitava central, que é onde a maioria das vozes alcança sem
 * esforço. O arpejo pode descer até uma oitava abaixo dela (uma ♭9 no baixo põe a fundamental treze
 * semitons abaixo), e isso ainda cabe na extensão de quem canta.
 */
const ALTURA_DA_ANCORA = 60;

/** As qualidades que as famílias marcadas trazem — a mesma lista da `tonica-de-ouvido`. */
function qualidades(s: Record<string, SettingValue>): ChordId[] {
  const fams = arr(s.familias as never, ['triades']);
  return [
    ...(fams.includes('triades') ? TRIADS : []),
    ...(fams.includes('tetrades') ? SEVENTHS : []),
    ...(fams.includes('extensoes') ? EXTENSOES : []),
    ...(fams.includes('alterados') ? ALTERADOS : []),
  ] as ChordId[];
}

/**
 * Os pares (qualidade, papel) que o painel permite **e que existem**: uma tríade não tem sétima, e
 * um dominante com ♭9 não tem nona natural. É o cruzamento que `problema` consulta.
 */
function papeisPossiveis(s: Record<string, SettingValue>, ctx?: Ctx): Papel[] {
  const graus = arr(s.papeis, ['1', '3', '5']).map(Number);
  const ancora = ALTURA_DA_ANCORA + Number(s.notaComum ?? 0);
  return qualidades(s).flatMap(qualidade => graus
    .filter(grau => semisDoGrau(qualidade, grau) !== null)
    .map(grau => ({ qualidade, grau }))
    .filter(papel => !ctx || Math.abs(raizLegivel(ctx, ancora, papel).acc) <= 1));
}

/**
 * **A fundamental, grafada de um jeito que se leia.**
 *
 * A conta é a de teoria — a nota um intervalo abaixo da âncora, por `transpose`, que faz a letra e o
 * acidente certos. O cuidado a mais é a escolha da grafia da **âncora**, que é livre quando não há
 * tonalidade: medido em 26/11, nas 2544 combinações de nota × qualidade × papel, **118 caem numa
 * fundamental com acidente dobrado** (`F♯♯°7`, `B♭♭7(♯9)`), e isso ninguém lê.
 *
 * Grafar a âncora pelo outro lado da enarmonia resolve todas elas sem inventar regra nenhuma: dó♯
 * como quinta de um diminuto dá `F♯♯°`, e ré♭ no lugar dá `G°`. É o mesmo acorde soando.
 *
 * ⚠️ **Dobrado nas NOTAS continua existindo, e está certo**: um diminuto com sétima se escreve
 * `Dó Mi♭ Sol♭ Si♭♭`, e "consertar" isso faria dele outro acorde. São 277 casos, e nenhum é defeito
 * — foi a decisão dele de 20/11, quando eu acusei o app de errado e o errado era eu.
 *
 * **O que sobra depois da troca de lado, o item não sorteia** (ver `papeisPossiveis`). O caso puro é
 * dó como ♯9: a grafia estrita quer a fundamental em `B♭♭`, e a saída seria chamar a âncora de
 * **Si♯** — renomear a nota que a pessoa escolheu no painel, o que é pior que não oferecer o par.
 */
function raizLegivel(ctx: Ctx, ancora: number, papel: Papel) {
  const semis = semisDoGrau(papel.qualidade, papel.grau)!;
  const daTonalidade = transpose(notaGrafada(ctx, ancora), { num: papel.grau, semis }, -1);
  if (Math.abs(daTonalidade.acc) <= 1) return daTonalidade;
  const outroLado = transpose(fromMidi(ancora, daTonalidade.acc > 0 ? 'flat' : 'sharp'), { num: papel.grau, semis }, -1);
  return Math.abs(outroLado.acc) <= Math.abs(daTonalidade.acc) ? outroLado : daTonalidade;
}

/**
 * **O nome da qualidade, em palavras** — "menor", "dominante (com sétima)".
 *
 * As treze qualidades de `ALL_CHORDS` têm nome escrito; as doze com extensão e alteração não têm, e
 * inventá-los seria cadastrar conteúdo que ninguém revisou. Para essas, o enunciado usa a **cifra**
 * ("um acorde 7(♭9)"), que é como a música as chama de verdade.
 *
 * Em minúscula porque entra no meio da frase: a tabela guarda "Menor" para quando o nome é o rótulo
 * de um botão.
 */
function nomeDaQualidade(ctx: Ctx, id: ChordId): string {
  if ((ALL_CHORDS as string[]).includes(id)) return chordName(ctx.t, id).toLocaleLowerCase(ctx.naming === 'en' ? 'en' : 'pt');
  return CHORDS[id].suffix[ctx.conv];
}

/**
 * ⚠️ **A alteração do grau não entra no enunciado**, de propósito: a qualidade já a carrega. "A nona
 * de um acorde com ♭9" seria dizer duas vezes; "a nona de um acorde 7(♭9)" é o que a música diz. Por
 * isso `alteracaoDoGrau` existe no motor e não é chamada aqui — ela serve a quem for escrever outra
 * coisa sobre o mesmo material.
 */
