import { assinaturaDoArpejo, sortearArpejo, temMaterial, type ArpejoDoMapa } from '../../theory/mapa-do-braco';
import { caberNaFaixa } from '../../theory/cadencia-harmonica';
import { getModo, notasDoModo } from '../../theory/digitacoes';
import { PISO_AUDIVEL, arr, bracoDoPerfil, midi, mod, noteName, spellPc, tonalidade, tuningOf, vozDoBraco, type Ctx, type Note, type Question } from '../helpers';
import type { CatalogItem, PosicaoDoMapa } from '../types';
import { randInt } from '../../theory/core';

/**
 * **Mapa do braço** — nomear as notas de um arpejo do campo harmônico, posição por posição.
 *
 * Desenhado com o Paulo em 13/11/2026, com foco em celular na horizontal. Nas palavras dele: *"se
 * sorteia uma combinação de graus (como 1467) e se sorteia uma digitação para esses graus... essas
 * quatro notas aparecem no braço em posições próximas, todas cinzas menos uma, que está colorida.
 * o usuário tem que clicar no botão com o nome da nota da posição colorida."*
 *
 * ## Por que é item novo, e não um modo do `nota-no-instrumento`
 *
 * A decisão 15 obriga a perguntar isso antes de cada tela nova, e aqui a resposta é o **gerador**:
 * `nota-no-instrumento` sorteia uma nota e pergunta o nome dela — não tem gerador, tem sorteio. Este
 * tem um objeto musical com estrutura (um arpejo do campo numa posição de mão) e um gerador de
 * verdade, que mora em `theory/mapa-do-braco.ts`. É o modelo que o Paulo fixou em 12/11: *o item é o
 * objeto musical e o seu gerador*.
 *
 * ## O que o exercício treina, e o que isso impôs ao desenho
 *
 * O objetivo dele é **internalizar onde as notas estão**, não decorar um desenho. Três consequências
 * diretas, todas decididas na conversa:
 *
 * - o **enunciado não diz os graus em jogo**: sabendo "1-4-6-7" dá para contar graus a partir da
 *   fundamental em vez de reconhecer a posição, e contar é a muleta que o exercício quer tirar;
 * - as **quatro inversões** entram no sorteio, porque reconhecer a mesma harmonia a partir de
 *   qualquer nota é metade do mapa;
 * - a **região do braço é sorteada antes da digitação** — ver a nota longa em `theory/`: sortear
 *   digitação uniformemente vicia em corda solta, e o Paulo pediu explicitamente que o arpejo de dó
 *   maior não comece sempre no mesmo lugar.
 *
 * ## O solfejo
 *
 * O enunciado pede para cantar o nome junto, e **o app não confere**. É lembrete, nunca requisito:
 * `requires` fica vazio de propósito, porque declarar `voz` esconderia o exercício exatamente onde
 * ele mais serve (o Paulo estuda no ônibus), e o CLAUDE.md proíbe exercício que dependa de captar
 * som. Quem não pode cantar perde o lembrete, não o exercício.
 */
/**
 * Até a **17ª casa**, e não a 20ª ou a 24ª (decisão dele em 14/11).
 *
 * Os inlays de 15 e 17 já existiam no desenho do braço, e medi material de sobra lá — 633 a 948
 * desenhos no violão, 100 a 180 no baixo. Acima da 17 o desenho passa de 1100 px de largura e, num
 * violão de corpo solto, as casas finais quase não se tocam: oferecer seria oferecer o que não se usa.
 */
const CASA_MAX = 17;

export const mapaDoBraco: CatalogItem = {
  id: 'mapa-do-braco',
  objetos: ['notas'], tarefas: ['nomear'],
  primaryModule: 'instrumento', skillTags: ['fretboard.note_naming', 'fretboard.chord_shapes'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'chord.triads', 'chord.sevenths'],
  kind: 'serie',
  // Vazio de propósito: é tudo na tela, sem instrumento em mãos e sem cantar. Ver a nota do solfejo.
  requires: {},
  validation: ['deterministic'], mobile: true,
  respeita: ['key'],
  publicacao: { estado: 'publicado', revisadoEm: '2026-11-19', por: 'Paulo' },
  settings: ctx => [
    /**
     * Os graus do arpejo, na ordem base. **Fixos durante a rodada** (decisão do Paulo): o desenho
     * que a mão decora é *aquele* desenho, e trocar a receita a cada arpejo viraria leitura de
     * posições avulsas. O que muda entre arpejos é o grau do campo e a posição.
     */
    /**
     * **Como os graus do arpejo são escolhidos** — e `sorteados` é o padrão desde 14/11.
     *
     * O Paulo: *"a ideia do exercicio nao é mentalizar os arpejos, mas sim usar os arpejos como
     * motor pra pedir várias posições de notas"*. Com uma combinação fixa, o item tem ~584 desenhos
     * no violão; sorteando a combinação, **20.454** — há 35 combinações de quatro graus entre sete,
     * e é de longe a maior fonte de variabilidade do exercício.
     *
     * Escolher à mão continua existindo para quem quiser treinar um desenho específico.
     */
    { id: 'modoDosGraus', label: ctx.t('settings.arpeggioDegrees'), type: 'single', options: [
      { id: 'sorteados3', label: ctx.t('settings.degreesRandom', { n: '3' }) },
      { id: 'sorteados4', label: ctx.t('settings.degreesRandom', { n: '4' }) },
      { id: 'escolhidos', label: ctx.t('settings.degreesChosen') },
    ] },
    { id: 'graus', label: ctx.t('settings.whichDegrees'), type: 'multi', justify: true,
      quando: s => s.modoDosGraus === 'escolhidos',
      options: [1, 2, 3, 4, 5, 6, 7].map(g => ({ id: String(g), label: String(g) })) },
    { id: 'campo', label: ctx.t('settings.field'), type: 'single', options: [
      { id: 'maior', label: ctx.t('settings.fieldMajor') },
      { id: 'menor', label: ctx.t('settings.fieldMinor') },
      { id: 'menor-harmonica', label: ctx.t('settings.fieldHarmonicMinor') },
      // O motor sempre teve as quatro famílias; eu só havia oferecido três, sem razão nenhuma.
      { id: 'menor-melodica-jazz', label: ctx.t('settings.fieldMelodicMinor') },
    ] },
    /**
     * A abertura da mão em casas — é o que separa "arpejo numa posição" de "notas espalhadas".
     *
     * Padrão por instrumento, e a razão é geométrica, não de alcance: o baixo tem **4 cordas em vez
     * de 6**, então as mesmas notas precisam se espalhar mais na horizontal. (A escala mais longa do
     * baixo faz a mão cobrir *menos* casas, não mais — eu errei isso na conversa e o registro fica
     * aqui para não se repetir.)
     */
    { id: 'abertura', label: ctx.t('settings.handSpan'), type: 'single',
      // A região fixa pode apertar a mão — e aí a tela diz qual abertura está em vigor.
      aviso: s => { const a = avisoDaAbertura(s); return a ? ctx.t('settings.mapaAberturaApertada', { n: String(a.emVigor) }) : null; },
      options: [
      { id: '3', label: ctx.t('settings.handSpanFrets', { n: '3' }) },
      { id: '4', label: ctx.t('settings.handSpanFrets', { n: '4' }) },
      { id: '5', label: ctx.t('settings.handSpanFrets', { n: '5' }) },
      { id: '6', label: ctx.t('settings.handSpanFrets', { n: '6' }) },
    ] },
    /**
     * **A região do braço**: passear pelas cinco janelas, ou fixar uma posição.
     *
     * Pedido dele em 14/11. Fixando, o exercício deixa de passear de propósito — vira o treino de
     * *uma* posição, que é outra coisa e é o ponto do parâmetro.
     */
    { id: 'regiao', label: ctx.t('settings.neckRegion'), type: 'single', options: [
      { id: 'livre', label: ctx.t('settings.neckRegionFree') },
      { id: 'fixa', label: ctx.t('settings.neckRegionFixed') },
    ] },
    { id: 'casaDe', label: ctx.t('settings.fromFret'), type: 'range', min: 0, max: CASA_MAX - 2, step: 1,
      quando: s => s.regiao === 'fixa', format: v => String(v) },
    { id: 'casaAte', label: ctx.t('settings.toFret'), type: 'range', min: 2, max: CASA_MAX, step: 1,
      quando: s => s.regiao === 'fixa', format: v => String(v) },
    // Sem piano: o exercício é a geometria de um braço. `auto` cai no violão para perfil de teclado.
    { id: 'instrumento', label: ctx.t('settings.instrument'), type: 'single', options: [
      { id: 'violao', label: ctx.t('settings.guitar') },
      { id: 'baixo', label: ctx.t('settings.bass') },
    ] },
    /**
     * **Uma nota por corda**: espalhamento máximo pelo braço, desligado por padrão.
     *
     * Medido com vão 5 no violão: as permutações já levam a média de 2,99 para 3,35 cordas por
     * desenho, e isto leva a 4,00 — ao custo de material (1290 desenhos caem para 528; no baixo,
     * 228 para 41). É a dose extra para quando se quer forçar o braço todo.
     */
    { id: 'cordasDistintas', label: ctx.t('settings.oneNotePerString'), type: 'toggle' },
    /**
     * **Soar na faixa que um alto-falante de celular reproduz** (Paulo, 15/11, sem fone: *"o som
     * está meio bugado... está dando umas craqueladas"*).
     *
     * Medido: num Mi1, **0%** da energia passa de 300 Hz, que é onde esses alto-falantes começam —
     * o cone se move sem produzir som, e o craquelado é esse esforço. Mi4 (330 Hz) dá 100%.
     *
     * Sobe o arpejo **inteiro** por oitavas, preservando o contorno: o desenho melódico continua o
     * mesmo, uma oitava acima. E o braço não muda — a casa é a casa.
     *
     * **Ligado por padrão no baixo**, onde todas as notas do braço caem abaixo dos 300 Hz; no
     * violão, desligado, porque a metade de cima do braço já soa bem e com fone o grave está certo.
     */
    { id: 'somAudivel', label: ctx.t('settings.phoneSpeakerRange'), type: 'toggle' },
    /** Ouvir o arpejo inteiro ao fechar. Começa **desligado**, a pedido dele. */
    { id: 'ouvirArpejo', label: ctx.t('settings.hearArpeggioAtEnd'), type: 'toggle' },
  ],
  defaults: { modoDosGraus: 'sorteados4', graus: ['1', '3', '5', '7'], campo: 'maior', regiao: 'livre', casaDe: 5, casaAte: 10, cordasDistintas: false, somAudivel: false, ouvirArpejo: false },
  /**
   * **Os dois valores iniciais que dependem do perfil**, e nenhum deles é uma opção na lista.
   *
   * O Paulo apontou os dois em 14/11: *"abertura da mão 'Do instrumento' não deveria ser uma opção.
   * faça com que tenha apenas as opções com numeros de casas, e que por padrao comece onde deve
   * começar"* — e o mesmo para o instrumento. Um chip que diz "do instrumento" obriga a pessoa a
   * lembrar qual é; um chip que diz "5 casas" informa.
   *
   * A abertura padrão é 5 no baixo porque ele tem **4 cordas em vez de 6**, e as mesmas notas
   * precisam se espalhar mais na horizontal — geometria, não alcance da mão.
   */
  defaultsDo: ctx => ({
    instrumento: bracoDoPerfil(ctx),
    // Ligado no baixo: lá o braço inteiro fica abaixo dos 300 Hz. Ver `PISO_AUDIVEL`.
    somAudivel: bracoDoPerfil(ctx) === 'baixo',
    // 5 no violão e 6 no baixo (era 4 e 5): com graus sorteados as notas se espalham mais, e a
    // abertura menor apertava — "está tudo muito condensado", 14/11.
    abertura: bracoDoPerfil(ctx) === 'baixo' ? '6' : '5',
  }),
  /** Atalhos nomeados pelo conteúdo (decisão 100); o primeiro é a entrada do item. */
  presets: [
    { id: 'sorteio4', nome: 'presets.mapaSorteio4', settings: { modoDosGraus: 'sorteados4', campo: 'maior' }, params: { key: { tonic: 0, mode: 'maior' } } },
    { id: 'sorteio3', nome: 'presets.mapaSorteio3', settings: { modoDosGraus: 'sorteados3', campo: 'maior' }, params: { key: { tonic: 0, mode: 'maior' } } },
    { id: 'triades', nome: 'presets.mapaTriades', settings: { modoDosGraus: 'escolhidos', graus: ['1', '3', '5'], campo: 'maior' }, params: { key: { tonic: 0, mode: 'maior' } } },
    { id: 'tetrades', nome: 'presets.mapaTetrades', settings: { modoDosGraus: 'escolhidos', graus: ['1', '3', '5', '7'], campo: 'maior' }, params: { key: { tonic: 0, mode: 'maior' } } },
  ],
  /**
   * **O arpejo do fim tem de caber na pausa do Player.**
   *
   * O Player avança sozinho 850 ms depois do acerto (`next` no acerto, o mesmo ritmo de todo item
   * do app — foi o que dispensou inventar uma pausa própria para este). Com o `gap` padrão de
   * 0,75 s por nota, um arpejo de quatro levaria 3 s e soaria por cima da pergunta seguinte.
   *
   * Com 0,18, quatro notas dão 0,72 s e cabem com 130 ms de folga. Nada corta o som de fato — a
   * próxima pergunta não toca nada (`autoplay: false`), então o pior caso seria ouvir o fim do
   * arpejo com a tela já trocada, e a conta evita isso até cinco notas.
   */
  presentation: { gap: 0.18, dur: 0.9 },
  problema(s, ctx) {
    const sorteados = quantosSorteados(s);
    const graus = arr(s.graus, []).map(Number).filter(g => g >= 1 && g <= 7);
    if (!sorteados && graus.length < 2) return ctx.t('player.mapaPoucosGraus');
    const o = opcoesDoMapa(s, ctx, graus);
    return temMaterial(o) ? null : ctx.t('player.mapaSemDesenho');
  },
  /**
   * A identidade da pergunta é a **posição**, não a resposta — ver `CatalogItem.assinatura`. Duas
   * perguntas com as mesmas quatro notas em cantos diferentes do braço são perguntas diferentes, e
   * é essa diferença que o exercício treina.
   */
  assinatura: q => (q.surface.kind === 'mapa'
    ? q.surface.posicoes.map(p => `${p.corda}.${p.casa}`).join(',')
    : String(q.expected.kind)),
  make(s, ctx): Question {
    const graus = arr(s.graus, ['1', '3', '5', '7']).map(Number).filter(g => g >= 1 && g <= 7).sort((a, b) => a - b);
    const o = opcoesDoMapa(s, ctx, graus.length >= 2 ? graus : [1, 3, 5, 7]);
    const arpejo = sortearArpejo(o);
    // `problema()` já garantiu que existe; o fallback é só para o tipo.
    const reais = (arpejo?.posicoes ?? []).map(e => ({ corda: e.corda, casa: e.casa, midi: e.midi, pc: e.pc }));
    /**
     * **As alturas que soam**, deslocadas por oitavas quando o parâmetro pede.
     *
     * `caberNaFaixa` é o motor que já faz isto na cadência — deslocar um conjunto por oitavas até
     * caber numa faixa — e reusá-lo mantém o **contorno**: o arpejo sobe inteiro, com o mesmo
     * desenho melódico. Achatar cada nota na mesma oitava seria mais simples e embaralharia o
     * arpejo, que é justamente o que o exercício mostra.
     */
    const soam = s.somAudivel === true && reais.length
      /**
       * O teto é **duas oitavas** acima do piso, e não três: com três, arpejos largos do violão
       * chegavam a 2637 Hz (Mi7), agudo sem necessidade. Um arpejo de quatro notas cabe em 19
       * semitons, então 24 bastam — medido, nenhum estoura.
       */
      ? caberNaFaixa([reais.map(p => p.midi)], PISO_AUDIVEL, PISO_AUDIVEL + 24)[0]
      : reais.map(p => p.midi);
    const posicoes: PosicaoDoMapa[] = reais.map((p, i) => ({ ...p, soa: soam[i] ?? p.midi }));
    const tuning = o.tuning;
    /**
     * Os sete botões são as notas **do campo**, com a grafia da tonalidade, em ordem de escala e
     * **em posição fixa** — a mão aprende onde cada botão fica, e isso deixa de custar atenção. Em
     * dó menor harmônica o 7º é Si natural, e é esse que entra: o botão segue o campo, não a escala
     * natural.
     */
    const opcoes = notasDoCampo(o).map(n => ({
      id: String(mod(midi(n), 12)), label: noteName(n, ctx.naming), value: { kind: 'pitchClass' as const, pc: mod(midi(n), 12) },
    }));
    return {
      prompt: ctx.t('quiz.mapaPrompt'),
      visual: { kind: 'text', text: '' },
      surface: {
        kind: 'mapa', tuning, from: 0,
        // O braço vai até o FIM da região, não até a 12: é isso que deixa uma região 7–15 existir
        // sem recortar o braço, que era a preocupação dele.
        to: Math.max(12, o.janelaFixa?.[1] ?? 12),
        foco: o.janelaFixa,
        posicoes, opcoes, ouvirNoFim: s.ouvirArpejo === true,
        // O campo em vigor, para a tela de foco poder dizer de que graus se trata.
        rotulo: ctx.t('settings.fieldOf', { campo: nomeDoCampo(ctx, s), tonica: noteName(o.tonica, ctx.naming) }),
      },
      /**
       * O gabarito é o **contorno ordenado** das alturas: as classes saem das posições, e a ordem é
       * a do arpejo. O Player confere posição por posição conforme a pessoa responde.
       */
      expected: { kind: 'contorno', midis: posicoes.map(p => p.midi), ordenada: true },
      // O que soa é `soa`, não `midi`: no celular sem fone o grave real não sai do alto-falante.
      sound: { groups: posicoes.map(p => [p.soa]), instrument: vozDoBraco(tuning) },
      autoplay: false,
      reveal: posicoes.map(p => noteName(notasDoCampo(o).find(n => mod(midi(n), 12) === mod(p.pc, 12)) ?? spellPc(p.pc), ctx.naming)).join(' · '),
    };
  },
};

/**
 * **As sete notas do campo, uma letra de cada** — e isto era um defeito que o Paulo pegou em 14/11:
 * *"na menor harmônica de dó, tem Ré e Ré# e Sol e Sol# — deveria ser mib e lab"*.
 *
 * A primeira versão montava os botões de classes de altura em semitons e pedia o nome a
 * `nomeNaTonalidade`, que escolhe sustenido ou bemol pela **armadura**. Com tonalidade livre não há
 * armadura, então tudo saía com sustenido: a classe 3 virava Ré♯ e a 8, Sol♯ — e os botões ficavam
 * com *Ré, Ré♯, Sol, Sol♯*, duas vezes a mesma letra e nenhum Mi nem Lá. Uma escala não faz isso:
 * ela tem uma letra de cada, e em dó menor harmônica são Dó Ré Mi♭ Fá Sol Lá♭ Si.
 *
 * O conserto é não calcular grafia nenhuma: `notasDoModo` já devolve as notas **grafadas
 * diatonicamente** pelo motor, que é o que o CLAUDE.md manda usar em vez de contornar.
 */
function notasDoCampo(o: ReturnType<typeof opcoesDoMapa>): Note[] {
  return notasDoModo(getModo(o.tonica, o.familia, 1));
}

/**
 * A tônica do campo: a da tonalidade em vigor, ou **uma sorteada e mantida**.
 *
 * Tonalidade livre não serve aqui — campo harmônico precisa de centro —, e decidimos sortear em vez
 * de recusar: pôr uma parede na frente de quem só abriu o exercício é pior. Ela é estável dentro da
 * rodada porque `ctx.params` não muda entre perguntas; trocar o campo no meio desmancharia o que o
 * exercício constrói.
 */
function tonalidadeDoCampo(ctx: Ctx): number {
  const k = tonalidade(ctx);
  return k ? mod(k.tonic, 12) : SORTEADA.get(ctx.params.instrument) ?? estrearTonica(ctx);
}
/** Uma tônica por instrumento, sorteada na primeira pergunta e guardada enquanto a aba viver. */
const SORTEADA = new Map<string, number>();
function estrearTonica(ctx: Ctx): number {
  const p = randInt(0, 11);
  SORTEADA.set(ctx.params.instrument, p);
  return p;
}

/** Traduz as configurações do item para as opções do gerador. */
function opcoesDoMapa(s: Record<string, unknown>, ctx: Ctx, graus: number[]) {
  /**
   * **Cada chave lida pelo nome**, nunca `{...s}`: o guarda `configuracoes-vivas` proíbe espalhar,
   * e com razão — espalhando, ele não consegue ver qual configuração ninguém lê, e configuração
   * morta na tela é o que ele existe para pegar. Ele me pegou na primeira rodada.
   */
  const tuning = tuningOf({ instrumento: s.instrumento === 'piano' ? 'violao' : s.instrumento } as never, ctx);
  const janelaFixa = regiaoFixa(s);
  /**
   * **A abertura não passa da região**, e o Paulo avisou disto ao pedir a região: *"tem que cuidar
   * aí com a abertura da mão — ela não pode ser maior que a região estipulada"*.
   *
   * Aperta em silêncio no motor e **com aviso na tela** (ver `avisoDaAbertura`): o chip continua
   * mostrando a escolha dela, e uma linha diz a abertura em vigor quando ela foi reduzida. Mudança
   * silenciosa de parâmetro é o defeito que ele já me apontou duas vezes.
   */
  const pedida = Number(s.abertura ?? 4) || 4;
  const abertura = janelaFixa ? Math.min(pedida, janelaFixa[1] - janelaFixa[0]) : pedida;
  /**
   * **A tônica do motor e a dos botões são a mesma, e isto era um defeito.**
   *
   * Eu pegava o pc da tônica por um caminho (`tonalidadeDoCampo`, que sorteia quando a tonalidade é
   * livre) e a NOTA por outro (`notaDaTonalidade`, que em tonalidade livre devolve dó) — então o
   * braço mostrava o campo de dó e os botões, o campo sorteado. Pergunta sem resposta possível, e
   * quem pegou foi o guarda "toda pergunta tem resposta certa que a superfície consegue dar".
   *
   * Agora a nota se constrói **do mesmo pc**: `spellPc` dá a grafia canônica daquela classe.
   */
  const pcTonica = tonalidadeDoCampo(ctx);
  return {
    tonica: spellPc(pcTonica, 4),
    familia: (String(s.campo ?? 'maior') as 'maior' | 'menor' | 'menor-harmonica' | 'menor-melodica-jazz'),
    graus, tuning, vao: abertura,
    maxCasa: janelaFixa ? janelaFixa[1] : 12,
    janelaFixa,
    sorteados: quantosSorteados(s),
    cordasDistintas: s.cordasDistintas === true,
  };
}

/** A região fixa, normalizada: as pontas em ordem e com pelo menos duas casas de largura. */
function regiaoFixa(s: Record<string, unknown>): readonly [number, number] | undefined {
  if (s.regiao !== 'fixa') return undefined;
  const a = Math.max(0, Math.min(CASA_MAX, Math.round(Number(s.casaDe ?? 5))));
  const b = Math.max(0, Math.min(CASA_MAX, Math.round(Number(s.casaAte ?? 10))));
  const de = Math.min(a, b);
  const ate = Math.max(a, b);
  // Duas casas é o mínimo para haver desenho; as pontas invertidas se ordenam em vez de recusar.
  return [de, Math.max(ate, de + 2)];
}

/** A abertura em vigor e a pedida — a tela avisa quando a região apertou a mão. */
export function avisoDaAbertura(s: Record<string, unknown>): { pedida: number; emVigor: number } | null {
  const janela = regiaoFixa(s);
  if (!janela) return null;
  const pedida = Number(s.abertura ?? 4) || 4;
  const emVigor = Math.min(pedida, janela[1] - janela[0]);
  return emVigor < pedida ? { pedida, emVigor } : null;
}

/** O nome do campo para a tela: "maior", "menor harmônica"... */
function nomeDoCampo(ctx: Ctx, s: Record<string, unknown>): string {
  const id = String(s.campo ?? 'maior');
  return ctx.t(id === 'menor' ? 'settings.fieldMinor'
    : id === 'menor-harmonica' ? 'settings.fieldHarmonicMinor'
    : id === 'menor-melodica-jazz' ? 'settings.fieldMelodicMinor'
    : 'settings.fieldMajor').toLowerCase();
}

/** Quantos graus sortear, ou `undefined` quando a pessoa os escolheu à mão. */
function quantosSorteados(s: Record<string, unknown>): number | undefined {
  const modo = String(s.modoDosGraus ?? 'sorteados4');
  return modo === 'sorteados3' ? 3 : modo === 'sorteados4' ? 4 : undefined;
}

export type { ArpejoDoMapa };
export { assinaturaDoArpejo };
