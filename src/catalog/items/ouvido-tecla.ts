import { GRAUS_ESCOLHIDOS, TONALIDADE_LIVRE, TUNINGS, alturaDoPc, arr, clave, faixaDaClave, grauDoPc, grausDaTonalidade, mod, pcNameUm, pcsDosGraus, pick, quintasDaTonalidade, regiao, tonalidade, tonicaDeContexto, vozDoBraco } from '../helpers';
import type { Ctx, Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * A faixa em que a nota soa **e** o teclado que a pessoa vê. Uma constante só, de propósito: eram
 * dois números diferentes em dois lugares, e foi exatamente isso que deu errado.
 *
 * Dó2 a Si5: o dó central (60) fica no meio, com duas oitavas abaixo e uma acima — que é o que o
 * Paulo pediu ao dizer "um dó central e teclas abaixo e acima dele".
 */
const FAIXA = { lo: 48, hi: 83 };

/** Dó maior **e só as notas dela** — a lista de graus depende do material, então o atalho o leva. */
const EM_DO_DIATONICO = { key: { tonic: 0, mode: 'maior' }, material: 'diatonico' } as const;

/**
 * Uma altura da classe `pc` que **existe no braço** em vigor, casas 0–12, preferindo as que caem na
 * região pedida. Sem nenhuma na região, vale qualquer uma do braço: melhor sair da região que fazer
 * uma pergunta sem resposta possível — a mesma regra que `regiao` já segue.
 */
function alturaNoBraco(tuning: readonly number[], ctx: Ctx, pc: number): number {
  const noBraco = tuning.flatMap(t => Array.from({ length: 13 }, (_, k) => t + k))
    .filter(m => mod(m, 12) === pc);
  const { lo, hi } = ctx.params.range;
  const naRegiao = noBraco.filter(m => m >= lo && m <= hi);
  return pick(naRegiao.length ? naRegiao : noBraco);
}

/** A nota escrita de uma altura, na grafia com sustenido — a pauta precisa de letra e acidente. */
function notaEscrita(m: number) {
  const pc = mod(m, 12);
  return { letter: [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc] as 0, acc: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][pc], oct: Math.floor(m / 12) - 1 };
}

/**
 * O nome de uma classe de altura **na tonalidade em vigor**: em Ré♭ maior, a classe 1 é Ré♭, não
 * Dó♯. Sem tonalidade não há grafia preferida, e aí vale o sustenido.
 */
function nomeNaTonalidade(ctx: Ctx, pc: number): string {
  const f = quintasDaTonalidade(ctx);
  return pcNameUm(pc, ctx.naming, f !== null && f < 0);
}

/**
 * **As oitavas em que a referência de fato existe.**
 *
 * Pedido do Paulo em 13/11: *"faça com que apenas apareçam opções de oitava viáveis pra região
 * disponível. C1 por exemplo nao entra no baixo de 4 cordas."* Ele está certo, e isto é a regra da
 * casa: controle que oferece o que não acontece é promessa falsa — foi o que já tirou o "incluir
 * teclas pretas" e os atalhos repetidos.
 *
 * A conta é a união de dois alcances, porque a superfície é escolha de quem usa e pode mudar sem
 * refazer esta lista: a **região** (o registro que a pessoa pediu, que vale para teclado e pauta) e
 * o **braço do instrumento do perfil** (que é físico — um baixo de quatro cordas começa no Mi1, e
 * dó1 não existe nele).
 *
 * Sem nenhuma viável — região curtíssima —, devolve a oitava do meio da região, para o seletor não
 * ficar vazio.
 */
function oitavasViaveis(ctx: Ctx): number[] {
  const pcTonica = mod(tonalidade(ctx)?.tonic ?? 0, 12);
  const { lo, hi } = ctx.params.range;
  const braco = ctx.params.tuning;
  const noBraco = braco.flatMap(t => Array.from({ length: 13 }, (_, k) => t + k));
  const viaveis = new Set<number>();
  for (let oitava = 0; oitava <= 8; oitava++) {
    const m = (oitava + 1) * 12 + pcTonica;
    if ((m >= lo && m <= hi) || noBraco.includes(m)) viaveis.add(oitava);
  }
  if (!viaveis.size) viaveis.add(Math.floor((lo + hi) / 24));
  return [...viaveis].sort((a, b) => a - b);
}

/**
 * A oitava desta classe de altura que **cabe na faixa** e fica mais perto da pedida.
 *
 * Subir e descer por oitavas em laço não serve: quando a faixa é mais estreita que uma oitava —
 * a intersecção entre o braço de um baixo e a região pode ser de oito semitons — há classes de
 * altura que simplesmente **não cabem**, e o laço sai pelo outro lado. Era o bug: pedindo lá4 numa
 * faixa de 48 a 55, ele devolvia 45, abaixo do piso.
 *
 * Enumerar e escolher resolve: das oitavas que cabem, a mais perto da pedida; se nenhuma cabe, a
 * mais perto da faixa — melhor a âncora sair um pouco da região que não existir.
 */
function naFaixa(m: number, faixa: { lo: number; hi: number }, preferida?: { lo: number; hi: number }): number {
  const pc = mod(m, 12);
  const candidatas: number[] = [];
  for (let x = pc; x <= 127; x += 12) candidatas.push(x);
  const perto = (lista: number[], alvo: number) => lista.reduce((a, b) => (Math.abs(b - alvo) < Math.abs(a - alvo) ? b : a));
  const dentro = candidatas.filter(x => x >= faixa.lo && x <= faixa.hi);
  if (!dentro.length) return perto(candidatas, (faixa.lo + faixa.hi) / 2);
  /**
   * **A altura pedida vence, se ela cabe.**
   *
   * Isto era um bug, e o Paulo pegou: *"parece que a escolha da Oitava da referência nao esta
   * funcionando no baixo"*. Não estava — a preferência pela região passava na frente da escolha
   * dele. Num baixo, pedir a oitava 2 (dó2 = 36) dava dó3 (48), porque 48 está na região e 36 não.
   *
   * Escolha explícita não é desempate: é instrução. A `preferida` só decide entre as que cabem
   * quando a pedida não cabe.
   */
  if (dentro.includes(m)) return m;
  const melhores = preferida ? dentro.filter(x => x >= preferida.lo && x <= preferida.hi) : [];
  return perto(melhores.length ? melhores : dentro, m);
}

/**
 * A referência (fraca, rotulada, em **todas** as posições em que existe) e a nota a audiar (em
 * acento, numa posição).
 *
 * A referência em todas porque é mapa: a mesma altura vive em várias cordas, e ver isso é metade do
 * que se aprende no braço. A nota a audiar numa só porque ela é a pergunta — mostrar todas as
 * posições dela seria responder onde ela está antes de a pessoa audiar.
 */
function marcasNoBraco(tuning: readonly number[], referencia: number, alvo: number, nomeDaRef: string) {
  const marcas: { s: number; f: number; color?: string; label?: string }[] = [];
  for (const pos of todasAsCasas(tuning, referencia)) marcas.push({ ...pos, color: 'var(--accent-quiet)', label: nomeDaRef });
  const posAlvo = casaDaAltura(tuning, alvo);
  if (posAlvo) marcas.push({ ...posAlvo, color: 'var(--mu)' });
  return marcas;
}

/** Todas as casas (0 a 12) que dão exatamente esta altura. */
function todasAsCasas(tuning: readonly number[], m: number): { s: number; f: number }[] {
  const out: { s: number; f: number }[] = [];
  for (let s = 0; s < tuning.length; s++) {
    const f = m - tuning[s];
    if (f >= 0 && f <= 12) out.push({ s, f });
  }
  return out;
}

/** Uma casa do braço que dá exatamente esta altura, preferindo a corda mais grave que a alcança. */
function casaDaAltura(tuning: readonly number[], m: number): { s: number; f: number } | null {
  for (let s = 0; s < tuning.length; s++) {
    const f = m - tuning[s];
    if (f >= 0 && f <= 12) return { s, f };
  }
  // **Devolve `null` quando o braço não alcança**, em vez da casa 0 da corda mais grave: desenhar a
  // nota errada é pior que não desenhar, e foi o que o Paulo desconfiou ao ver a referência faltando.
  return null;
}

export const ouvidoTecla: CatalogItem = {
  id: 'ouvido-tecla',
  objetos: ['notas'], tarefas: ['ouvir', 'tocar'],
  primaryModule: 'perception.melodic', skillTags: ['ear.pitch_identification', 'keyboard.note_finding'],
  contentTags: ['pitch.naturals', 'pitch.accidentals'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **"Incluir teclas pretas" saiu em 13/11.** O Paulo perguntou duas vezes se ele não era
     * redundante — *"incluir teclas pretas não está redundante com cromático?"* e *"não quero que eu
     * precise selecionar 'incluir as teclas pretas' ao selecionar a tonalidade de ré maior para que
     * apareçam todos os graus"* — e era, por dois lados: tecla preta é **grau alterado**, e quem
     * escolhe graus já disse se os quer; e com "só a tonalidade" quem decide é a tonalidade, não um
     * interruptor por cima dela.
     *
     * Era o controle que obrigava a ligar um interruptor para o Fá♯ de Ré maior aparecer, e a ligar
     * outro para dó menor fazer efeito. Os dois incômodos morrem com ele.
     */
    GRAUS_ESCOLHIDOS(ctx),
    /**
     * **De onde vem a pergunta** — o eixo que o modelo de 12/11 pôs em toda linha de ouvido.
     *
     * `som`: a nota toca e você a acha. `escrito`: a nota aparece na superfície escolhida, só o
     * contexto toca, você a ouve por dentro e confere. É o "oposto" que o Paulo descreveu para cada
     * linha, e que até 12/11 morava nos itens de notação — ver `melodia-de-ouvido`, o molde.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    /**
     * O rótulo diz **"a tônica"**, sem nomear nota.
     *
     * Ele dizia "Tocar Dó de referência antes" — parte do bug de 13/11, porque a referência não é
     * dó: é a tônica em vigor, sorteada quando a tonalidade é livre. E o rótulo não pode consultar
     * a tonalidade: `settings(ctx)` é chamado com contexto mínimo em vários lugares (testes e sondas
     * passam só o `t`), e ler `params` ali quebra tudo — aprendido na primeira rodada. Quem nomeia a
     * nota é o enunciado, que tem o contexto inteiro.
     */
    { id: 'referencia', type: 'toggle', label: ctx.t('settings.referenceTonic') },
    /**
     * **Em que oitava a referência soa** (Paulo, 13/11: *"poderia ter uma configuração pra escolher
     * se a nota inicial que vai tocar é sempre um dó3 (por exemplo) ou se vai ser sorteio entre os
     * dós disponíveis. Acho que o padrão deveria ser sempre a mesma nota"*).
     *
     * Padrão `fixa`, como ele pediu: a âncora no mesmo lugar toda rodada é o que a torna âncora. Com
     * `sorteada` ela pula de oitava, e aí reconhecer a nota exige ouvir a relação em vez de guardar
     * a altura absoluta da referência.
     */
    /**
     * **Qual oitava**, e não só "fixa ou sorteada" — o Paulo em 13/11: *"ainda não consigo escolher
     * qual dos dós vai ser o ponto de referencia. o padrão deve ser o dó4 nesse caso, e quero que
     * isso seja ajustável. atualmente, so consigo escolher se vai ser sempre a mesma, nao qual."*
     *
     * Estava certo: a versão anterior só oferecia o eixo (mesma/sorteada) e escolhia a oitava mais
     * grave da faixa — daí sair sempre Dó3. Agora a escolha é a oitava, pelo número que se lê na
     * tela (`4` é o dó central, MIDI 60), com `sorteada` como a opção de quem quer variar.
     *
     * **O padrão é a oitava 2** (dó2), escolhido por ele em 13/11. Faz sentido para quem toca baixo:
     * é a oitava que o instrumento tem de verdade. Onde a superfície não alcança — no teclado, com a
     * região padrão —, a referência sobe para a oitava mais próxima que cabe, e isso é visível.
     */
    { id: 'oitavaDaReferencia', label: ctx.t('settings.referenceOctave'), type: 'single',
      quando: s => s.referencia === true, options: [
        ...oitavasViaveis(ctx).map(o => ({ id: String(o), label: String(o) })),
        { id: 'sorteada', label: ctx.t('settings.referenceAnyOctave') },
      ] },
    /**
     * **Onde se responde** (`OR-ouvido-relativo.md`, §3.1: *"superfície de resposta (padrão: o
     * instrumento do perfil)"*). O estímulo é som, então não há superfície de estímulo e onde você
     * responde fica livre — é o princípio do §1, e aqui ele é posto para funcionar.
     *
     * ⚠️ **Letras e graus não dão a oitava**, e a oitava é a conferência deste item (decisão de
     * 10/11). O Paulo escolheu mantê-los mesmo assim em 12/11 — *"vale a pena ter letras e números
     * como resposta pra praticar, agrega valor"* —, com a condição de **ficar claro na tela** que
     * ali a oitava não conta. O enunciado muda nesses dois modos, e é só nisso que a conferência
     * relaxa para classe de altura; nos outros três ela segue exata.
     */
    { id: 'onde', label: ctx.t('settings.answerWhere'), type: 'single', options: [
      { id: 'auto', label: ctx.t('settings.myInstrument') },
      { id: 'teclado', label: ctx.t('settings.instrumentPiano') },
      // Dois braços, e não um "braço" genérico: o Paulo pediu em 13/11 — *"deveria ter a opção
      // braço da guitarra também"*. O baixo tem quatro cordas e o violão seis; a afinação muda o
      // que existe no braço, e o timbre vai junto.
      { id: 'baixo', label: ctx.t('settings.onBassNeck') },
      { id: 'violao', label: ctx.t('settings.onGuitarNeck') },
      { id: 'pauta', label: ctx.t('settings.onStaff') },
      { id: 'letras', label: ctx.t('settings.byLetters') },
      { id: 'graus', label: ctx.t('settings.byDegrees') },
    ] },
  ],
  defaults: { estimulo: 'som', referencia: true, onde: 'auto', grausEscolhidos: [] },
  /**
   * Os dois atalhos são as duas habilidades distintas que este item pode treinar, e é a
   * **referência** que as separa — foi a saída para a dúvida do Paulo sobre ele ser redundante com
   * os intervalos:
   *
   * - com referência e dó maior, a pergunta é "que grau é", respondida no teclado;
   * - sem referência e sem tonalidade, é nomear a altura sem âncora nenhuma — e **nenhum outro
   *   item do catálogo treina isso**.
   */
  /**
   * **Os atalhos foram reescritos em 13/11**, e o Paulo pediu a conferência: *"confira se os atalhos
   * ainda fazem sentido. tenho a impressao que nao."* Não faziam — os três tinham sobrado da época
   * do interruptor de teclas pretas, e depois que ele saiu os três declaravam a MESMA coisa
   * (`referencia: true`), mudando só a tonalidade. Três atalhos para um exercício só.
   *
   * Os de agora cobrem os eixos que o item realmente tem: **onde se responde**, **quais graus**, e
   * **de onde vem a pergunta**. Nomeados pelo conteúdo, nunca por nível (decisão 100).
   */
  /**
   * ⚠️ **Nenhum atalho fixa a oitava da referência.** Ela é preferência de instrumento — quem toca
   * baixo quer dó2, quem toca piano quer dó4 —, e um atalho que a fixasse sobreporia o padrão do
   * item para quem clicasse nele. O Paulo relatou o sintoma: *"ele começa no 4, o que eu acho que é
   * incorreto"* — e começava, porque o atalho de entrada a declarava.
   */
  presets: [
    { id: 'tonica-e-quinta', nome: 'presets.teclaTonicaEQuinta',
      settings: { estimulo: 'som', referencia: true, onde: 'teclado', grausEscolhidos: ['0', '7'] }, params: EM_DO_DIATONICO },
    { id: 'graus-da-maior', nome: 'presets.teclaGrausDaMaior',
      settings: { estimulo: 'som', referencia: true, onde: 'teclado', grausEscolhidos: [] }, params: EM_DO_DIATONICO },
    { id: 'no-meu-instrumento', nome: 'presets.teclaNoMeuInstrumento',
      settings: { estimulo: 'som', referencia: true, onde: 'auto', grausEscolhidos: [] }, params: EM_DO_DIATONICO },
    { id: 'na-pauta', nome: 'presets.teclaNaPauta',
      settings: { estimulo: 'som', referencia: true, onde: 'pauta', grausEscolhidos: [] }, params: EM_DO_DIATONICO },
    { id: 'audiar-grau', nome: 'presets.teclaAudiarGrau',
      settings: { estimulo: 'escrito', referencia: true, onde: 'graus', grausEscolhidos: [] }, params: EM_DO_DIATONICO },
    { id: 'sem-ancora', nome: 'presets.teclaSemAncora',
      settings: { estimulo: 'som', referencia: false, onde: 'teclado', grausEscolhidos: [] }, params: TONALIDADE_LIVRE },
  ],
  presentation: { gap: 0.9 },
  /**
   * Seleção de graus que não sobra nenhuma nota: recusar e explicar (decisão 13) — `pick` de lista
   * vazia devolveria `undefined` e a pergunta sairia quebrada.
   */
  problema(s, ctx) {
    const possiveis = pcsDosGraus(ctx, arr(s.grausEscolhidos, []));
    return possiveis.length ? null : ctx.t('player.poucasNotas');
  },
  make(s, ctx): Question {
    const permitidas = pcsDosGraus(ctx, arr(s.grausEscolhidos, []));
    const p = pick(permitidas);
    const onde = s.onde === 'auto'
      ? (ctx.params.instrument === 'piano' ? 'teclado' : ctx.params.instrument === 'baixo' ? 'baixo' : 'violao')
      : String(s.onde ?? 'teclado');
    const noBraco = onde === 'baixo' || onde === 'violao';
    /** A afinação da superfície escolhida — não a do perfil, que pode ser outra. */
    const tuning = onde === 'baixo' ? TUNINGS.baixo : onde === 'violao' ? TUNINGS.violao : ctx.params.tuning;
    /**
     * **A nota só pode soar onde a resposta cabe.** É a lição que já estava escrita neste item para
     * o teclado — *"o teclado cobre a mesma faixa que pode soar"* — e que a superfície solta
     * reabriu: o som ia até Si5, e um violão nas casas 0–12 chega ao Mi4. Acima disso a pergunta
     * ficava sem resposta possível, que é o defeito de 09/11 de novo.
     *
     * Com letras ou graus não há faixa: a resposta é a classe de altura, e qualquer oitava serve.
     */
    /**
     * **O teclado desenhado é do tamanho da extensão** (Paulo, 13/11: *"se vai da nota Dó3 a Dó5,
     * acho que o teclado desenhado deveria ser desse tamanho também, pra aproveitar melhor o
     * espaço. E isso se aplica pra qualquer extensão"*).
     *
     * Então a faixa sai da REGIÃO, apertada pelo que a clave ou o teclado alcançam — e é a mesma
     * faixa que o desenho recebe, mais abaixo. Dois números que precisam concordar, num lugar só.
     */
    /**
     * Na pauta, a faixa é a que **a clave lê** — duas linhas suplementares para cada lado. Era
     * `48–79` cruzado com a região, e com a região padrão (48–72) saíam notas até cinco linhas
     * abaixo da clave de sol: o Paulo relatou, e diagnosticou a causa sozinho.
     */
    const faixa = onde === 'pauta' ? regiao(ctx, faixaDaClave(clave(ctx))) : regiao(ctx, FAIXA);
    /**
     * No braço, a nota sai do **conjunto de alturas que existem nele**, não de uma faixa.
     *
     * Faixa não serve: o braço de um baixo nas casas 0–12 alcança 28 a 55, e numa janela dessas
     * faltam classes de altura inteiras — `alturaDoPc` então caía no plano B e devolvia uma nota
     * fora do alcance (medido: soava 60 num baixo que chega a 55). Enumerar o que existe é a mesma
     * escolha que consertou os distratores de ritmo: onde o espaço é pequeno, enumere.
     */
    const m = noBraco ? alturaNoBraco(tuning, ctx, p) : alturaDoPc(ctx, p, faixa);
    /**
     * **A referência é a tônica em vigor**, não um dó cravado — e isto é a correção de um bug que a
     * pergunta do Paulo em 13/11 expôs.
     *
     * Medido antes de mexer: praticando em **Sol maior**, a referência tocava 60 (dó) e o enunciado
     * dizia "Dó". A âncora ignorava a tonalidade inteira, então "que nota é esta, depois do dó"
     * numa prática em Sol não situava nada — e com a decisão nova (centro sorteado em tonalidade
     * livre) o defeito ficaria mais visível ainda, porque o som sortearia e o texto seguiria dizendo
     * "Dó".
     *
     * `tonicaDeContexto` resolve as duas coisas: respeita a tonalidade, sorteia quando ela é livre,
     * e fica **abaixo** do que se vai ouvir, sem sair da região.
     */
    /**
     * A referência: a tônica em vigor, numa **oitava fixa** por padrão.
     *
     * `tonicaDeContexto` a põe abaixo do que se vai ouvir — útil quando a referência acompanha a
     * pergunta, mas é justamente o que fazia a âncora pular de oitava a cada rodada. Com `fixa` ela
     * vai para a oitava mais grave que caiba na faixa e **fica lá**.
     */
    const pcDaReferencia = mod(tonicaDeContexto(ctx, faixa.hi), 12);
    /**
     * A referência na **oitava escolhida**. O número da configuração é a oitava como se lê na tela
     * (dó central = 4), e a conta é a de MIDI: `(oitava + 1) * 12 + classe`.
     *
     * Se a oitava escolhida cair fora do que a superfície alcança, sobe ou desce de oitava até
     * caber — melhor a referência existir noutra oitava que não soar. É a mesma troca de
     * `caberNaFaixa`.
     */
    /**
     * A faixa em que a referência pode cair é a da **superfície**, não a do som.
     *
     * No braço isso muda tudo: um baixo nas casas 0–12 alcança 28 a 55, e a oitava padrão (dó4 = 60)
     * está fora. O Paulo desconfiou exatamente disso — *"talvez não esteja aparecendo a nota de
     * referencia por ela estar fora do alcance do braço do baixo"* — e estava certo: ela era
     * escolhida pela faixa do SOM, não pelo que o braço desenha, e aí `casaDaAltura` não achava casa
     * e a marca era omitida. Referência que não se vê não é referência.
     */
    /**
     * **No braço, o alcance dele manda; a região é preferência.**
     *
     * As duas restrições podem ser incompatíveis, e isto não é teórico: um baixo nas casas 0–12
     * alcança 28–55, a região padrão é 48–72, e a intersecção (48–55) tem oito semitons — não cabe
     * uma oitava inteira. Pedir a referência em lá♯ ali é impossível: 46 está abaixo da região, 58
     * está fora do braço.
     *
     * Escolhi o braço, porque é o que o Paulo pediu — *"tem que mostrar a nota de referência"* — e
     * porque referência que não se vê não é referência. A região diz o que se quer OUVIR; não pode
     * mandar no que se DESENHA. Entre as oitavas que o braço alcança, prefere-se a que também cai na
     * região.
     */
    /**
     * **A oitava escolhida manda, e a superfície se abre para caber nela.**
     *
     * Era aqui o defeito que o Paulo relatou duas vezes: *"eu mudo pra 2 e ele não muda"*. No
     * teclado a faixa desenhada é a região (48–72 por padrão), e dó2 (36) não está nela — então
     * escolher 1, 2 ou 3 dava **todos 48**, medido. A escolha dele era silenciosamente descartada
     * por um limite que não era dele.
     *
     * Agora a ordem se inverte: a referência sai da oitava pedida, e **o desenho cresce** para
     * incluí-la. É o que ele já havia pedido na rodada anterior — *"se vai da nota Dó3 a Dó5, o
     * teclado desenhado deveria ser desse tamanho"*.
     *
     * O braço é a exceção, e por ser físico: um violão não tem dó2: ali a referência cai na oitava
     * mais próxima que o braço alcança, e isso aparece na tela porque a marca está lá.
     */
    const faixaDaSuperficie = noBraco
      ? { lo: tuning[0], hi: tuning[tuning.length - 1] + 12 }
      : { lo: Math.min(faixa.lo, 24), hi: Math.max(faixa.hi, 96) };
    const preferida = noBraco ? faixa : undefined;
    const referencia = s.oitavaDaReferencia === 'sorteada'
      ? tonicaDeContexto(ctx, m)
      : naFaixa((Number(s.oitavaDaReferencia ?? 4) + 1) * 12 + pcDaReferencia, faixaDaSuperficie, preferida);
    /**
     * **A grafia segue a tonalidade.** O Paulo em 13/11: *"na tonalidade, diz Réb, mas no exercicio
     * diz 'primeiro um Do#'"*. `pcNameUm(..., false)` escolhe sempre o sustenido; em Ré♭ maior a
     * nota se escreve Ré♭, e o motor de teoria já sabe disso — era só perguntar.
     */
    const nomeDaReferencia = nomeNaTonalidade(ctx, mod(referencia, 12));
    // O contexto do audiar é a tônica da TONALIDADE (não o dó fixo da referência, que é outra coisa).

    /**
     * **Letras e graus não carregam oitava**, então ali a conferência é por classe de altura — e o
     * enunciado DIZ isso, porque relaxar em silêncio faria o histórico afirmar o que não aconteceu.
     * Nos outros três modos a oitava continua sendo a resposta.
     */
    const semOitava = onde === 'letras' || onde === 'graus';
    /**
     * A referência também é **apoio visível** na superfície de resposta: ela soou, é dada, e a pessoa
     * precisa ver onde está (ver `Apoio`, em `types.ts`). Sem `referencia` não há o que mostrar.
     */
    const apoio = s.referencia ? { midis: [referencia], rotulos: { [referencia]: nomeDaReferencia } } : undefined;
    /** O desenho cobre a pergunta **e** a referência: ela é marca na tela, não só som. */
    const desenho = s.referencia
      ? { lo: Math.min(faixa.lo, referencia), hi: Math.max(faixa.hi, referencia) }
      : faixa;
    const superficie =
      noBraco ? { kind: 'fretboard' as const, tuning, from: 0, to: 12, apoio }
      // A armadura da tonalidade em vigor, como em `nota-na-pauta`: sem ela, praticar em Sol maior
      // pedia ligar o sustenido à mão (o Paulo relatou isso em 12/11 e de novo em 13/11).
      : onde === 'pauta' ? { kind: 'staff' as const, clef: clave(ctx), accidentals: true, fifths: quintasDaTonalidade(ctx) ?? undefined, apoio }
      : onde === 'letras' ? { kind: 'letters' as const, accidentals: true }
      : onde === 'graus' ? { kind: 'choices' as const, options: grausDaTonalidade(ctx, permitidas) }
      : { kind: 'keyboard' as const, ...desenho, apoio };
    /**
     * **Audiar**: a nota está escrita (ou marcada), só o contexto toca, e o gabarito fica num botão.
     *
     * A superfície já era parâmetro, então ela serve de estímulo sem nada novo — e para UMA nota
     * todas as cinco servem, inclusive teclado e braço: ordem só é problema em melodia.
     */
    if (s.estimulo === 'escrito') {
      const nome = nomeNaTonalidade(ctx, mod(m, 12));
      const comOitava = `${nome}${Math.floor(m / 12) - 1}`;
      const grau = grauDoPc(ctx, mod(m, 12));
      const visual: Question['visual'] =
        /**
         * Na pauta, **o contexto aparece escrito também** (Paulo, 13/11: *"no audiar na pauta tambem
         * precisa mostrar qual é o contexto"*): duas colunas, a referência primeiro, a nota a audiar
         * depois. Ler a segunda sem ver a primeira é audiar sem saber de onde.
         */
        onde === 'pauta' ? { kind: 'staff', clef: clave(ctx), fifths: quintasDaTonalidade(ctx) ?? undefined, columns: [[notaEscrita(referencia)], [notaEscrita(m)]] }
        : onde === 'teclado' ? { kind: 'keyboard', ...desenho, marks: [referencia, m], marcasFracas: [referencia], rotulos: { [referencia]: nomeDaReferencia } }
        /**
         * **A referência aparece junto da nota**, no braço e no teclado (Paulo, 13/11: *"em audie no
         * braço, tem que mostrar a nota de referência. só a nota escrita não dá"*).
         *
         * Ela vem rotulada com o nome dela e numa cor fraca; a nota a audiar fica na cor de acento.
         * Ele desconfiou que a referência não aparecia por estar fora do alcance do braço — não era
         * isso (Dó3 cabe num baixo), era que ela nunca foi desenhada. Mas a desconfiança valia: por
         * isso `casaDaAltura` agora avisa quando não alcança, e aí a referência é omitida em vez de
         * ser desenhada na casa errada.
         */
        : noBraco ? { kind: 'fretboard', tuning, from: 0, to: 12, marks: marcasNoBraco(tuning, referencia, m, nomeDaReferencia) }
        : { kind: 'text', text: '' };
      /**
       * **O grau sozinho é ambíguo**, e o Paulo pegou isso em 13/11: *"apareceu audie o grau 6 e eu
       * audiei ele acima, mas a resposta era abaixo"*. O grau diz a classe de altura, não a oitava —
       * e o 6 existe acima e abaixo da referência.
       *
       * Então o enunciado diz a direção. Não é detalhe de texto: sem ela a pergunta tem duas
       * respostas e a autoavaliação fica sem sentido.
       */
      const acima = m >= referencia;
      const enunciado = onde === 'graus'
        ? ctx.t(acima ? 'quiz.audiateDegreeUp' : 'quiz.audiateDegreeDown', { degree: grau })
        : onde === 'letras' ? ctx.t('quiz.audiateNamed', { note: comOitava })
        : ctx.t('quiz.audiateNote');
      return {
        prompt: enunciado, visual,
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[referencia]],
          // O timbre segue a superfície aqui também: audiando no braço do baixo, o contexto e o
          // gabarito soam de baixo. Faltava, e o Paulo pegou: *"em audiar no braço, o som segue
          // sendo de piano"*.
          instrument: noBraco ? vozDoBraco(tuning) : undefined,
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[referencia]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [[m]] },
          ],
        },
        autoplay: false, reveal: `${comOitava}  ·  ${grau}`,
      };
    }

    const base = s.referencia ? ctx.t('quiz.earNoteRef', { note: nomeDaReferencia }) : ctx.t('quiz.earNote');
    return {
      // O aviso "(aqui a oitava não conta)" saiu em 13/11, a pedido dele: *"pode remover... fica
      // implícito"*. E fica: respondendo pelo nome ou pelo grau não há onde dizer a oitava.
      prompt: base, visual: { kind: 'ear' },
      // O teclado cobre **a mesma faixa que pode soar**. Era 60–71 enquanto o som sorteava em
      // 48–83: soava um ré3, não havia tecla de ré3, e o Paulo tinha de clicar uma oitava acima.
      // A resposta é por classe de altura, então clicar na oitava errada acertava — o errado era a
      // tela mentir sobre o que tinha soado.
      surface: superficie,
      /**
       * **A oitava exata**, não a classe de altura (decisão do Paulo, 10/11/2026: *"fazer com que o
       * exercício receba como resposta correta apenas a oitava específica da nota que foi tocada, e
       * não a mesma nota em outras oitavas como atualmente é"*).
       *
       * Era `pitchClass`, e isso é o que esconde o defeito que ele achou no teclado: clicar a nota
       * certa na oitava errada **acertava**, então nem o acerto denunciava que a tela mostrava uma
       * faixa e o som usava outra.
       *
       * De graça, a revelação melhora: o Player marca de verde toda tecla que valida como certa, e
       * com classe de altura ele pintava **as três oitavas**. Agora pinta uma.
       */
      expected: semOitava
        ? (onde === 'graus' ? { kind: 'option', id: grauDoPc(ctx, mod(m, 12)) } : { kind: 'pitchClass', pc: mod(m, 12) })
        : { kind: 'pitch', midi: m },
      /**
       * **O timbre segue a superfície.** O Paulo em 13/11: *"o som está como o som do piano. deveria
       * ser o som do baixo. som de piano é confuso demais e não chega nos graves"* — e estava certo
       * em dobro: as amostras de piano vão até Dó2 (MIDI 36), e um baixo chega a Mi1 (28). Abaixo do
       * fim da amostra o piano simplesmente não tinha o que tocar.
       */
      sound: { groups: s.referencia ? [[referencia], [m]] : [[m]], instrument: noBraco ? vozDoBraco(tuning) : undefined }, autoplay: true,
      // A oitava entra na revelação porque entrou na resposta: errar a oitava e não saber qual era
      // não ensina nada.
      reveal: semOitava
        ? (onde === 'graus' ? grauDoPc(ctx, mod(m, 12)) : nomeNaTonalidade(ctx, mod(m, 12)))
        : `${nomeNaTonalidade(ctx, mod(m, 12))}${Math.floor(m / 12) - 1}`,
    };
  },
};
