import { EM_DO_MAIOR, ESCUTA_ACIMA, ESCUTA_DEFAULTS, GRAUS_ESCOLHIDOS, TIMBRE, TIMBRE_DEFAULTS, emBracoDeBaixo, vozDaPergunta, SEMI_TIER, TODOS_OS_INTERVALOS, TONALIDADE_LIVRE, alturaDoPc, alturaNaRegiao, arr, clave, mod, faixaDoBraco, superficieDoPerfil, faixaQueCabe, notaGrafada, noteName, pcsDosGraus, pick, quintasDaTonalidade, tonicaNaRegiao, semiOptions, semitoneName, tonicaDeContexto, vozDoBraco } from '../helpers';
import { LEGADO, RASCUNHO } from '../publicacao';
import type { CatalogItem, Ctx, Question, Setting, SettingValue, Surface } from '../types';

/**
 * **As configurações das duas linhas de intervalo**, numa lista só.
 *
 * O item se dividiu em dois em 20/11 — decisão dele, contra a minha recomendação: *"requer outra
 * habilidade: ouvir duas notas juntas e entender que intervalo é aquele"*. O **gerador é o mesmo**,
 * e por isso `make` e `problema` são literalmente a mesma função nos dois itens (o harmônico sai de
 * um espalhamento do melódico, mais abaixo). Motor duplicado é proibido, e aqui não há nenhum.
 *
 * O que difere são **dois controles**:
 *
 * - **direção** só existe no melódico, e com duas opções. `juntas` virou o outro item, e `misto`
 *   **morreu** (decisão dele em 20/11): ele sorteava entre melódico e harmônico, e depois da
 *   divisão não cabe em nenhum dos dois — um item que às vezes é o outro desfaz a divisão;
 * - **audiar as notas separadas** só existe no harmônico, e sempre existiu só ali: em melódico as
 *   notas já soaram uma de cada vez, e não sobra nada para audiar. Era o `problema()` que recusava
 *   a combinação; agora ela nem se oferece.
 */
const settingsDeIntervalo = (ctx: Ctx, harmonico: boolean): Setting[] => [
  /**
   * **De onde vem a pergunta** (modelo de 12/11). `escrito` é o oposto desta linha: *"ler duas
   * notas, audiar o intervalo e ouvir a resposta como conferência"*.
   */
  { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
    { id: 'som', label: ctx.t('settings.hearIt') },
    { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
  ] },
  /**
   * **Como o intervalo aparece quando se audia**: na pauta (o de sempre) ou **pelo nome**.
   *
   * Pelo nome é o que o item `audiar` fazia e que se perderia na aposentadoria dele (20/11): o
   * enunciado diz "audie uma terça maior acima de Dó4", nada é desenhado, e o gabarito fica no
   * botão. É a única forma de cobrar intervalo **sem notação e sem instrumento** — com o fone no
   * ônibus, que é onde ele estuda.
   */
  { id: 'mostraAudiando', label: ctx.t('settings.audiateShow'), type: 'single', quando: s => s.estimulo === 'escrito', options: [
    { id: 'pauta', label: ctx.t('settings.showStaff') },
    { id: 'nome', label: ctx.t('settings.showName') },
  ] },
  { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: semiOptions(ctx).map(o => ({ ...o, tier: SEMI_TIER[Number(o.id)] })) },
  // Duas opções, e só no melódico: `juntas` é o outro item, e `misto` morreu com a divisão.
  ...(harmonico ? [] : [{ id: 'direcao', label: ctx.t('settings.direction'), type: 'single' as const, options: [
    { id: 'sobe', label: ctx.t('settings.up') }, { id: 'desce', label: ctx.t('settings.down') },
  ] }]),
  /**
   * **Onde se responde** — o §3.3 do `OR-ouvido-relativo.md`, nas palavras do Paulo: *"Resposta:
   * indicar as notas que tocaram. Pode ser feito na pauta, no piano, no violão, no baixo ou em
   * botões."*
   *
   * `alternativas` nomeia o intervalo, e **continua sendo o padrão**: ele pediu os dois modos
   * (*"ou também como alternativas em alguns casos"*), e nomear é a habilidade que o item já
   * treinava. `notas` é a outra — apontar quais notas soaram, com conferência por contorno.
   */
  /**
   * `audiar` é o terceiro, decidido com o Paulo em 18/11: *"ouvir um intervalo harmônico e audiar
   * as notas separadas"*. As duas notas soam juntas, a pessoa canta cada uma, e os botões de nota
   * são a conferência — o mesmo par audiar/conferir do estímulo `escrito`, com autoavaliação.
   */
  { id: 'resposta', label: ctx.t('settings.answerWhere'), type: 'single', options: [
    { id: 'alternativas', label: ctx.t('settings.answerOptions') },
    { id: 'notas', label: ctx.t('settings.answerTheNotes') },
    ...(harmonico ? [{ id: 'audiar', label: ctx.t('settings.answerAudiateNotes') }] : []),
  ] },
  { id: 'superficie', label: ctx.t('settings.answerSurface'), type: 'single', quando: s => s.resposta === 'notas',
    options: [
      { id: 'teclado', label: ctx.t('settings.instrumentPiano') },
      { id: 'braco', label: ctx.t('settings.onNeck') },
      { id: 'pauta', label: ctx.t('settings.onStaff') },
    ] },
  /**
   * **Quantas notas**: duas, ou três (o máximo que ele pôs no rascunho). Com três, o que soa são
   * dois intervalos empilhados — e aí **nomear não serve**: "qual intervalo?" tem duas respostas.
   * Por isso três notas só existe com a resposta `notas`, e `problema()` recusa a combinação em
   * vez de sortear o impossível (decisão 13).
   */
  { id: 'notas', label: ctx.t('settings.howManyNotes'), type: 'single',
    options: [{ id: '2', label: '2' }, { id: '3', label: '3' }] },
  /**
   * **A nota central sempre participa** (primeiro item da lista dele para esta linha).
   *
   * "Central" aqui é o centro tonal — a tônica da tonalidade em vigor —, não o dó central do
   * teclado: o exercício todo gira em torno de fixar um centro antes de perguntar, e um intervalo
   * que parte dele é outra habilidade (ouvir o grau) que ouvir um intervalo solto no ar.
   */
  { id: 'comTonica', label: ctx.t('settings.fromTonic'), type: 'toggle' },
  /**
   * **O timbre** — declarado em `TIMBRE`, de `helpers`, e usado por todo item de ouvido desde
   * 19/11. Nasceu aqui, da pergunta dele; a nota de por que o sorteio é a parte que treina está lá.
   */
  ...TIMBRE(ctx),
  // A oitava de escuta: só aparece respondendo num braço de baixo, que é onde o problema existe.
  ...ESCUTA_ACIMA(ctx, s => s.resposta === 'notas' && emBracoDeBaixo(ctx, s.superficie ?? superficieDoPerfil(ctx))),
  GRAUS_ESCOLHIDOS(ctx),
];

/**
 * **A pergunta das duas linhas**, numa função só — `harmonico` é o que as separa.
 *
 * O gerador é o mesmo: o mesmo sorteio de intervalos, a mesma janela que faz o empilhamento caber
 * no braço, a mesma base, os mesmos botões por nota. A divisão de 20/11 é de **catálogo**, não de
 * motor, e esta função é onde isso fica visível.
 */
function fazPergunta(s: Record<string, SettingValue>, ctx: Ctx, harmonico: boolean): Question {
  const ids = arr(s.intervalos, ['4', '7']);
  const quantas = s.notas === '3' ? 3 : 2;
  /**
   * Os intervalos saem **antes** da base, porque é o empilhamento que decide onde a base cabe:
   * com duas terças sobre um lá4 o topo passaria do teto da janela, e aí a nota mais aguda sairia
   * da região — a mesma armadilha que `caberNaFaixa` resolve na cadência.
   */
  const degraus = Array.from({ length: quantas - 1 }, () => Number(pick(ids)));
  const alto = degraus.reduce((a, b) => a + b, 0);
  /**
   * **Respondendo no braço, o intervalo tem de caber no braço** — e aqui ele não cabia.
   *
   * A faixa de sorteio era 52–67 fixa, escrita pensando no violão. Num baixo de quatro cordas o
   * braço vai do Mi1 (28) ao Mi4 (55) nas casas 0–12: uma base em 52 com uma oitava acima pede
   * MIDI 64, **nove semitons acima da última casa**, e a pessoa não tinha onde clicar a resposta.
   * Medido pela varredura de 13/11, que achou o mesmo em `ouvido-acorde`.
   *
   * No braço, então, a faixa é a do braço; nas outras superfícies, a de sempre. O teto desconta a
   * altura do intervalo para a nota de cima também caber — é a mesma precaução que o comentário
   * acima já tomava contra sair da região.
   */
  const ondeResponder = s.resposta === 'notas'
    ? String(s.superficie ?? superficieDoPerfil(ctx))
    : null;
  const vaiNoBraco = ondeResponder !== null && ondeResponder !== 'pauta' && ondeResponder !== 'teclado';
  const alcance = faixaDoBraco(ctx.params.tuning, 0, 12);
  const piso = vaiNoBraco ? alcance.lo : 52;
  const teto = vaiNoBraco
    ? Math.max(piso, Math.min(alcance.hi - alto, 67 - alto))
    : Math.max(53, 67 - alto);
  /**
   * A base: a tônica, uma das notas escolhidas, ou qualquer altura da região.
   *
   * Com restrição de notas é a CLASSE que se escolhe primeiro, e a altura depois — `alturaNaRegiao`
   * sorteia altura livre e não saberia filtrar por classe.
   */
  const escolhidas = arr(s.grausEscolhidos, []);
  const naJanela = { lo: piso, hi: teto };
  /**
   * **No braço, a base sai de uma lista de alturas que cabem** — e não de `alturaDoPc`.
   *
   * Esta é a segunda metade do conserto, e ela só apareceu porque o guarda ganhou uma base com
   * todo `multi` cheio. Com os doze graus marcados e a janela do braço do baixo, que pode ficar
   * com quatro semitons, **oito das doze classes não têm representante na janela** — e aí
   * `alturaDoPc` cai no fallback dela ("a mais próxima do piso"), que sobe **acima do teto**.
   * Medido: pedia MIDI 57 num braço cuja última casa dá 55.
   *
   * Escolher a classe depois de saber quais cabem inverte a ordem e não tem como estourar: a
   * lista é de alturas reais do braço, filtradas pelo que a pessoa escolheu.
   */
  const base = vaiNoBraco
    ? (() => {
      const pcs = s.comTonica
        ? [mod(ctx.params.key?.tonic ?? 0, 12)]
        : pcsDosGraus(ctx, escolhidas.length ? escolhidas : undefined);
      const cabem: number[] = [];
      for (let m = piso; m <= teto; m++) {
        if (pcs.includes(mod(m, 12)) && ctx.params.tuning.some(t => m - t >= 0 && m - t <= 12)) cabem.push(m);
      }
      // Nenhuma classe escolhida cabe: qualquer altura do braço na janela, para o item ter
      // pergunta. Quem recusa configuração impossível é o `problema()`, não o sorteio.
      if (cabem.length) return pick(cabem);
      for (let m = piso; m <= teto; m++) if (ctx.params.tuning.some(t => m - t >= 0 && m - t <= 12)) cabem.push(m);
      return cabem.length ? pick(cabem) : piso;
    })()
    : s.comTonica
      ? tonicaNaRegiao(ctx, naJanela)
      : escolhidas.length
        ? alturaDoPc(ctx, pick(pcsDosGraus(ctx, escolhidas)), naJanela)
        : alturaNaRegiao(ctx, naJanela);
  // As alturas, de baixo para cima: a base e cada degrau somado ao anterior.
  const alturas = degraus.reduce((acc, passo) => [...acc, acc[acc.length - 1] + passo], [base]);
  const d = degraus[0];
  /**
   * **A direção vem do ITEM, não da configuração, quando é harmônico.** No melódico ela é escolha,
   * e tem duas opções. `misto` morreu com a divisão (decisão dele em 20/11): um item que às vezes é
   * o outro desfaz a divisão, e com dois itens ele deixou de ter onde morar.
   */
  const dir = harmonico ? 'juntas' : (s.direcao === 'desce' ? 'desce' : 'sobe');
  /** Como as alturas soam: juntas num grupo, ou uma por grupo na ordem da direção. */
  const ordenadas = dir === 'desce' ? [...alturas].reverse() : alturas;
  const groups = dir === 'juntas' ? [alturas] : ordenadas.map(m => [m]);
  /** O nome do que soou: um intervalo, ou os dois empilhados. */
  const nome = degraus.map(x => semitoneName(x, ctx.conv)).join(' + ');
  /**
   * **O timbre sorteado é da PERGUNTA**, não das configurações: ele muda a cada pergunta, e é por
   * isso que `Question.presentation` existe. Nos outros dois modos ninguém mexe na camada — o
   * perfil (ou o timbre escolhido, que é `present` de configuração) continua mandando.
   *
   * Respondendo no braço, a voz do braço é preservada: ali o timbre diz de que instrumento é a
   * pergunta, e sortear apagaria isso.
   */
  const presentation = vozDaPergunta(s, vaiNoBraco);
  /**
   * **Um botão por nota** — e este item era o único de ouvido sem pedaço de som nenhum. O
   * `ouvido-celulas`, o `reconhecer-padroes-escala` e o `melodia-de-ouvido` já tinham "Nota 1",
   * "Nota 2"; aqui havia só o botão grande. O Paulo pediu em 18/11, e um botão por nota (em vez
   * de um que toca as duas em sequência) é o que deixa repetir a nota de baixo até ela entrar.
   *
   * **A numeração segue o que se ouviu**: em melódico, "Nota 1" é a primeira que soou — descendo,
   * portanto, a mais aguda. Em harmônico não há primeira, e aí é de baixo para cima.
   *
   * Nomear um intervalo harmônico fica mais fácil com isto à mão, e é escolha dele que os botões
   * apareçam nos três modos: *"quem está nomeando escolhe não usar"*.
   */
  const ouvidas = dir === 'juntas' ? alturas : ordenadas;
  const porNota = (ms: number[], gabarito = false) => ms.map((m, i) => ({
    id: `n${i}`, label: ctx.t('quiz.partNote', { n: i + 1 }), groups: [[m]], gabarito,
  }));
  /**
   * **Audiar**: as duas notas aparecem na pauta, o contexto toca, e o intervalo fica no botão de
   * conferência — na forma que a configuração pede (juntas ou em sequência).
   *
   * A pauta é a superfície do estímulo aqui, e não há seletor: as duas notas de um intervalo
   * harmônico soam juntas, e marcar duas posições num braço sem dizer qual é qual não ajuda. O
   * §3.3 lista mais superfícies, e elas vêm com a peça que também muda a RESPOSTA.
   */
  if (s.estimulo === 'escrito') {
    const tonica = tonicaDeContexto(ctx, base);
    const peloNome = s.mostraAudiando === 'nome';
    return {
      prompt: peloNome
        ? ctx.t('quiz.audiateIntervalByName', { interval: nome, note: noteName(notaGrafada(ctx, base), ctx.naming) })
        : ctx.t('quiz.audiateInterval'),
      visual: peloNome
        ? { kind: 'text', text: '' }
        : { kind: 'staff', clef: clave(ctx), fifths: quintasDaTonalidade(ctx) ?? undefined,
          columns: dir === 'juntas' ? [alturas.map(m => notaGrafada(ctx, m))] : groups.map(g => g.map(m => notaGrafada(ctx, m))) },
      surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
      sound: {
        groups: [[tonica]],
        partes: [
          { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
          { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups },
        ],
      },
      autoplay: false, reveal: nome, presentation,
    };
  }

  /**
   * **Audiar as notas**: o intervalo soa junto, a pessoa canta cada nota, e os botões de nota são
   * a conferência. O julgamento é autoavaliação, e só aparece depois de ouvir — por isso os
   * pedaços vão marcados como `gabarito`.
   *
   * O estímulo `escrito` ganha de propósito quando os dois estão ligados: ali já se audia o
   * intervalo inteiro a partir da pauta, e é o modo mais antigo.
   *
   * `problema()` garante que a direção é "juntas"; o `hint` segue as configurações de qualquer
   * jeito, para não anunciar "notas juntas" se alguém chamar `make` com uma combinação recusada.
   */
  if (s.resposta === 'audiar') {
    return {
      prompt: ctx.t('quiz.audiateIntervalNotes'),
      visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
      surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
      sound: { groups, partes: porNota(ouvidas, true) },
      autoplay: true, reveal: nome, presentation,
    };
  }

  /**
   * Respondendo **as notas**: a superfície acumula tantas alturas quantas soaram, e a conferência
   * é o contorno (§4).
   *
   * `ordenada` segue a direção, e isso importa: num intervalo **harmônico** as notas soam juntas e
   * a ordem dos cliques não é resposta nenhuma; num **melódico** a ordem é metade do que se ouviu
   * — responder sol–dó onde soou dó–sol é outra coisa.
   */
  if (s.resposta === 'notas') {
    const onde = String(s.superficie ?? superficieDoPerfil(ctx));
    const noBraco = onde !== 'pauta' && onde !== 'teclado';
    const tuning = ctx.params.tuning;
    const superficie: Surface = onde === 'pauta'
      ? { kind: 'staff', clef: clave(ctx), accidentals: true, fifths: quintasDaTonalidade(ctx) ?? undefined, quantas: alturas.length }
      : onde === 'teclado' ? { kind: 'keyboard', ...faixaQueCabe(alturas), quantas: alturas.length }
      : { kind: 'fretboard', tuning, from: 0, to: 12, quantas: alturas.length };
    return {
      prompt: ctx.t('quiz.earIntervalNotes'), visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
      surface: superficie,
      expected: { kind: 'contorno', midis: dir === 'juntas' ? alturas : ordenadas, ordenada: dir !== 'juntas' },
      // Respondendo no braço, o som é do braço: era piano, como ele relatou no `audiar` em 13/11.
      sound: { groups, instrument: noBraco ? vozDoBraco(tuning) : undefined, partes: porNota(ouvidas) }, autoplay: true, reveal: nome, presentation,
    };
  }
  return {
    prompt: ctx.t('quiz.earInterval'), visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
    surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: semitoneName(Number(i), ctx.conv) })) }, expected: { kind: 'option', id: String(d) },
    sound: { groups, partes: porNota(ouvidas) }, autoplay: true, reveal: nome, presentation,
  };}

/**
 * **O que este item recusa**, nas duas linhas — e `harmonico` muda uma das duas recusas.
 *
 * Decisão 13: configuração sem pergunta possível se **recusa e explica**, nunca se conserta pelas
 * costas de quem configurou.
 */
function recusa(s: Record<string, SettingValue>, ctx: Ctx, harmonico: boolean): string | null {
  /**
   * **Audiar as notas pedia intervalo harmônico, e agora o item já é.** Em melódico as notas soam
   * uma de cada vez e não sobra nada para audiar — o exercício seria ouvir e repetir. Até 20/11
   * isso era uma recusa aqui; depois da divisão, o modo só se oferece no item harmônico, e o que
   * era guarda virou estrutura. A recusa fica para quem chamar `make` à mão com a combinação velha.
   */
  if (!harmonico && s.estimulo !== 'escrito' && s.resposta === 'audiar') return ctx.t('player.audiarPedeJuntas');
  // Três notas são dois intervalos empilhados, e nomear "o intervalo" deixa de ter resposta
  // única. Apontar as notas e audiá-las continuam valendo: ali não se nomeia nada.
  if (s.notas === '3' && s.resposta === 'alternativas') return ctx.t('player.tresNotasPedemNotas');
  return null;
}

export const ouvidoIntervalo: CatalogItem = {
  id: 'ouvido-intervalo',
  objetos: ['intervalos'], tarefas: ['ouvir', 'audiar'],
  primaryModule: 'ouvido', skillTags: ['ear.interval_identification'],
  contentTags: ['interval.simple'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => settingsDeIntervalo(ctx, false),

  defaults: { estimulo: 'som', intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe',
    resposta: 'alternativas', notas: '2', comTonica: false, grausEscolhidos: [], mostraAudiando: 'pauta',
    ...TIMBRE_DEFAULTS, ...ESCUTA_DEFAULTS },
  // Fora dos defaults estáticos de propósito — ver `superficieDoPerfil` em helpers.
  defaultsDo: ctx => ({ superficie: superficieDoPerfil(ctx) }),
  /**
   * O Paulo quis os doze intervalos e dó maior como entrada, e **melódicos e harmônicos como
   * etapas distintas** na rotina dele — daí os dois primeiros atalhos serem o mesmo conteúdo em
   * direções diferentes, e não um atalho com "misto".
   *
   * O terceiro existe para dar o caminho de volta: ver `TONALIDADE_LIVRE` em `helpers`.
   */
  presets: [
    { id: 'melodicos', nome: 'presets.intervalosMelodicos', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'sobe' }, params: EM_DO_MAIOR },
    { id: 'descendo', nome: 'presets.intervalosDescendo', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'desce' }, params: EM_DO_MAIOR },
    // `livre` é sobre a TONALIDADE ser livre, não a direção — e por isso ele sobrevive à morte do
    // `misto` sem perder o que era: ver `TONALIDADE_LIVRE` em `helpers`.
    { id: 'livre', nome: 'presets.intervalosLivre', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'sobe' }, params: TONALIDADE_LIVRE },
  ],
  problema: (s, ctx) => recusa(s, ctx, false),
  make: (s, ctx) => fazPergunta(s, ctx, false),
};

/**
 * **Intervalo harmônico** — item próprio desde 20/11, por decisão dele e contra a minha
 * recomendação. Vale registrar o meu argumento e por que ele não venceu: eu disse que o teste da
 * decisão 15 é se o **gerador** é outro, e aqui ele é o mesmo. Ele respondeu que o teste errado era
 * o meu — *"requer outra habilidade: ouvir duas notas juntas e entender que intervalo é aquele"* —,
 * e habilidade é critério de catálogo tanto quanto motor.
 *
 * Então: um item, **zero motor novo**. `make`, `problema`, `respeita` e `defaultsDo` vêm do
 * espalhamento e são as mesmas funções, pelo mesmo endereço de memória. O que muda são a direção
 * (fixa em `juntas`, e sem controle para mexer nela), a resposta por audiar — que só faz sentido
 * aqui — e os atalhos.
 *
 * **Nasce `rascunho`** (decisão 91). O conteúdo não é novo (era o modo `juntas` do melódico), mas o
 * **item** é, e a regra não abre exceção para conteúdo herdado: `legado` é só para o que já existia
 * como item. Com o portão desligado (decisão 104) isso não esconde nada de ninguém.
 */
export const ouvidoIntervaloHarmonico: CatalogItem = {
  ...ouvidoIntervalo,
  id: 'ouvido-intervalo-harmonico',
  publicacao: RASCUNHO,
  settings: ctx => settingsDeIntervalo(ctx, true),
  make: (s, ctx) => fazPergunta(s, ctx, true),
  problema: (s, ctx) => recusa(s, ctx, true),
  /**
   * **`direcao` sai dos padrões deste item**, e não é detalhe de arrumação: um padrão sem controle
   * correspondente é chave solta, e há um teste que o acusa. Aqui ele estaria mentindo de um jeito
   * pior — anunciaria como escolha da pessoa uma coisa que é a identidade do item.
   */
  defaults: Object.fromEntries(Object.entries(ouvidoIntervalo.defaults).filter(([k]) => k !== 'direcao')),
  presets: [
    // Nenhum atalho declara `direcao`: ela não é configuração deste item. Declará-la aqui seria
    // escrever numa chave que a tela não tem — e há teste que acusa.
    { id: 'harmonicos', nome: 'presets.intervalosHarmonicos', settings: { intervalos: TODOS_OS_INTERVALOS }, params: EM_DO_MAIOR },
    // Audiar as notas separadas: o pedido dele de 18/11, e ele só existe aqui.
    { id: 'audiar-notas', nome: 'presets.intervalosAudiar', settings: { intervalos: TODOS_OS_INTERVALOS, resposta: 'audiar' }, params: EM_DO_MAIOR },
    { id: 'livre', nome: 'presets.intervalosLivre', settings: { intervalos: TODOS_OS_INTERVALOS }, params: TONALIDADE_LIVRE },
  ],
};
