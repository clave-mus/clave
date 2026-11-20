import { EM_DO_MAIOR, GRAUS_ESCOLHIDOS, TIMBRE, TIMBRE_DEFAULTS, vozDaPergunta, SEMI_TIER, TODOS_OS_INTERVALOS, TONALIDADE_LIVRE, alturaDoPc, alturaNaRegiao, arr, clave, mod, faixaDoBraco, superficieDoPerfil, faixaQueCabe, notaGrafada, pcsDosGraus, pick, quintasDaTonalidade, tonicaNaRegiao, semiOptions, semitoneName, tonicaDeContexto, vozDoBraco } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem, Surface } from '../types';

export const ouvidoIntervalo: CatalogItem = {
  id: 'ouvido-intervalo',
  objetos: ['intervalos'], tarefas: ['ouvir', 'audiar'],
  primaryModule: 'ouvido', skillTags: ['ear.interval_identification'],
  contentTags: ['interval.simple'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **De onde vem a pergunta** (modelo de 12/11). `escrito` é o oposto desta linha: *"ler duas
     * notas, audiar o intervalo e ouvir a resposta como conferência"*.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: semiOptions(ctx).map(o => ({ ...o, tier: SEMI_TIER[Number(o.id)] })) },
    { id: 'direcao', label: ctx.t('settings.direction'), type: 'single', options: [{ id: 'sobe', label: ctx.t('settings.up') }, { id: 'desce', label: ctx.t('settings.down') }, { id: 'juntas', label: ctx.t('settings.together') }, { id: 'misto', label: ctx.t('settings.mixed') }] },
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
      { id: 'audiar', label: ctx.t('settings.answerAudiateNotes') },
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
    GRAUS_ESCOLHIDOS(ctx)],
  defaults: { estimulo: 'som', intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe',
    resposta: 'alternativas', notas: '2', comTonica: false, grausEscolhidos: [],
    ...TIMBRE_DEFAULTS },
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
    { id: 'harmonicos', nome: 'presets.intervalosHarmonicos', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'juntas' }, params: EM_DO_MAIOR },
    { id: 'descendo', nome: 'presets.intervalosDescendo', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'desce' }, params: EM_DO_MAIOR },
    { id: 'livre', nome: 'presets.intervalosLivre', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'misto' }, params: TONALIDADE_LIVRE },
    // Harmônico é condição, não gosto: audiar notas que já soaram separadas não é exercício nenhum.
    { id: 'audiar-notas', nome: 'presets.intervalosAudiar', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'juntas', resposta: 'audiar' }, params: EM_DO_MAIOR },
  ],
  problema(s, ctx) {
    /**
     * **Audiar as notas pede intervalo harmônico.** Em melódico elas já soaram uma de cada vez, e
     * não sobra nada para audiar — o exercício seria ouvir e repetir. Recusar e explicar é a
     * decisão 13; forçar a direção em silêncio seria mudar o parâmetro dela pelas costas.
     */
    /**
     * O estímulo `escrito` **ignora** "onde responder" (ele volta antes, no `make`), então a
     * exigência de harmônico não vale ali: com a pauta na tela, audiar um intervalo que sobe é o
     * exercício mais antigo do item. Sem este `estimulo`, trocar para "ler e audiar" com o atalho
     * novo em vigor e mexer na direção dava "sem pergunta possível" numa configuração que funciona.
     */
    if (s.estimulo !== 'escrito' && s.resposta === 'audiar' && s.direcao !== 'juntas') return ctx.t('player.audiarPedeJuntas');
    // Três notas são dois intervalos empilhados, e nomear "o intervalo" deixa de ter resposta
    // única. Apontar as notas e audiá-las continuam valendo: ali não se nomeia nada.
    if (s.notas === '3' && s.resposta === 'alternativas') return ctx.t('player.tresNotasPedemNotas');
    return null;
  },
  make(s, ctx) {
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
    const dir = s.direcao === 'misto' ? pick(['sobe', 'desce', 'juntas']) : s.direcao;
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
      return {
        prompt: ctx.t('quiz.audiateInterval'),
        visual: { kind: 'staff', clef: clave(ctx), fifths: quintasDaTonalidade(ctx) ?? undefined,
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
    };
  },
};
