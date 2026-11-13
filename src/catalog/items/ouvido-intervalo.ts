import { EM_DO_MAIOR, GRAUS_ESCOLHIDOS, SEMI_TIER, TODOS_OS_INTERVALOS, TONALIDADE_LIVRE, alturaDoPc, alturaNaRegiao, arr, clave, pcsDosGraus, pick, tonicaNaRegiao, semiOptions, semitoneName, tonicaDeContexto } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem, Surface } from '../types';

/** A nota escrita de uma altura, na grafia com sustenido. */
function notaEscrita(m: number) {
  const pc = ((m % 12) + 12) % 12;
  return { letter: [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc] as 0, acc: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][pc], oct: Math.floor(m / 12) - 1 };
}

export const ouvidoIntervalo: CatalogItem = {
  id: 'ouvido-intervalo',
  objetos: ['intervalos'], tarefas: ['ouvir'],
  primaryModule: 'perception.melodic', skillTags: ['ear.interval_identification'],
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
    { id: 'resposta', label: ctx.t('settings.answerWhere'), type: 'single', options: [
      { id: 'alternativas', label: ctx.t('settings.answerOptions') },
      { id: 'notas', label: ctx.t('settings.answerTheNotes') },
    ] },
    { id: 'superficie', label: ctx.t('settings.answerSurface'), type: 'single', quando: s => s.resposta === 'notas',
      options: [
        { id: 'auto', label: ctx.t('settings.myInstrument') },
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
    GRAUS_ESCOLHIDOS(ctx)],
  defaults: { estimulo: 'som', intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe',
    resposta: 'alternativas', superficie: 'auto', notas: '2', comTonica: false, grausEscolhidos: [] },
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
  ],
  // Três notas são dois intervalos empilhados, e nomear "o intervalo" deixa de ter resposta única.
  problema: (s, ctx) => (s.notas === '3' && s.resposta !== 'notas' ? ctx.t('player.tresNotasPedemNotas') : null),
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
    const teto = Math.max(53, 67 - alto);
    /**
     * A base: a tônica, uma das notas escolhidas, ou qualquer altura da região.
     *
     * Com restrição de notas é a CLASSE que se escolhe primeiro, e a altura depois — `alturaNaRegiao`
     * sorteia altura livre e não saberia filtrar por classe.
     */
    const escolhidas = arr(s.grausEscolhidos, []);
    const base = s.comTonica
      ? tonicaNaRegiao(ctx, { lo: 52, hi: teto })
      : escolhidas.length
        ? alturaDoPc(ctx, pick(pcsDosGraus(ctx, escolhidas)), { lo: 52, hi: teto })
        : alturaNaRegiao(ctx, { lo: 52, hi: teto });
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
        visual: { kind: 'staff', clef: clave(ctx), columns: dir === 'juntas' ? [alturas.map(notaEscrita)] : groups.map(g => g.map(notaEscrita)) },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups },
          ],
        },
        autoplay: false, reveal: nome,
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
      const onde = s.superficie === 'auto' ? (ctx.params.instrument === 'piano' ? 'teclado' : 'braco') : String(s.superficie);
      const faixa = { lo: Math.min(48, ...alturas), hi: Math.max(72, ...alturas) };
      const superficie: Surface = onde === 'pauta'
        ? { kind: 'staff', clef: clave(ctx), accidentals: true, quantas: alturas.length }
        : onde === 'teclado' ? { kind: 'keyboard', ...faixa, quantas: alturas.length }
        : { kind: 'fretboard', tuning: ctx.params.tuning, from: 0, to: 12, quantas: alturas.length };
      return {
        prompt: ctx.t('quiz.earIntervalNotes'), visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
        surface: superficie,
        expected: { kind: 'contorno', midis: dir === 'juntas' ? alturas : ordenadas, ordenada: dir !== 'juntas' },
        sound: { groups }, autoplay: true, reveal: nome,
      };
    }
    return {
      prompt: ctx.t('quiz.earInterval'), visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
      surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: semitoneName(Number(i), ctx.conv) })) }, expected: { kind: 'option', id: String(d) },
      sound: { groups }, autoplay: true, reveal: nome,
    };
  },
};
