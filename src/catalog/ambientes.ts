// Ambientes: itens de catálogo com tela própria, em vez de pergunta (decisão 17).
//
// Eles são o MESMO tipo dos exercícios — `CatalogItem` —, só que com `screen` no lugar de `make`
// e `kind: 'ambiente'`. É isso que permite um metrônomo entrar numa etapa de rotina sem nenhum
// caso especial no código, e que o braço virtual tenha uma implementação só.
//
// `tecnica` é `tarefa`, não `ambiente`: ela termina quando a pessoa se autoavalia (F6-5).
// Título e descrição ficam em tools.<id> nos textos de cada idioma.
import { FRETS } from './helpers';
import { OBJETOS_DE_BOLSO, PENSAR } from './maos-livres';
import { PRESETS } from '../theory/rhythm-gen';
import { LEGADO, RASCUNHO } from './publicacao';
import type { MessageKey } from '../i18n';
import type { CatalogItem } from './types';

/** Ambientes não têm configuração declarada: cada tela cuida das suas (serão migradas na F1-3). */
const noSettings = () => [];

export const AMBIENTES: CatalogItem[] = [
  {
    id: 'metronomo', kind: 'ambiente',
    publicacao: LEGADO, requires: {}, validation: ['none'], mobile: true,
    objetos: ['ritmo'], tarefas: ['tocar'],
    primaryModule: 'tecnica', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.triplets'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/common').then(m => ({ default: m.Metronome })),
  },
  {
    // F6-1. **O único item do contexto "De bolso"**: nada de olhos, nada de mãos.
    //
    // `semTela` é declarado, e não deduzido, porque a dedução não funciona para item com tela própria:
    // `requisitosDe` assume o caso conservador (usa olhos, mãos e áudio) justamente para não oferecer
    // o que a pessoa não consegue fazer. Aqui a suposição conservadora estaria errada, e só o item
    // sabe disso. Há teste exigindo que ele seja o único a declarar isto sem motivo escrito.
    id: 'maos-livres', kind: 'ambiente', semTela: true,
    publicacao: RASCUNHO, requires: {}, validation: ['none'], mobile: true,
    objetos: ['intervalos', 'acordes', 'escalas', 'notas'], tarefas: ['ouvir'],
    primaryModule: 'ouvido',
    skillTags: ['ear.interval_identification', 'ear.chord_quality', 'ear.scale_quality', 'ear.pitch_identification'],
    contentTags: ['interval.simple', 'chord.triads', 'chord.sevenths', 'scale.major', 'scale.minor', 'scale.modes'],
    // **Tem configuração declarada**, ao contrário dos outros ambientes, e por um motivo concreto: a
    // rotina "De bolso" é quatro variações deste item. Sem declarar, a configuração viveria só no
    // estado da tela e duas etapas do mesmo ciclo seriam idênticas.
    settings: ctx => [
      { id: 'objetos', label: ctx.t('handsfree.objetos'), type: 'multi',
        options: OBJETOS_DE_BOLSO.map(id => ({ id, label: ctx.t(`handsfree.obj_${id}` as MessageKey) })) },
      { id: 'pensar', label: ctx.t('handsfree.pensar'), type: 'range',
        min: PENSAR.min, max: PENSAR.max, step: 1, format: v => `${v} s` },
      { id: 'anuncio', label: ctx.t('handsfree.anuncio'), type: 'single', options: [
        { id: 'voz', label: ctx.t('handsfree.anuncioVoz') },
        { id: 'repetir', label: ctx.t('handsfree.anuncioRepetir') },
        { id: 'ambos', label: ctx.t('handsfree.anuncioAmbos') },
      ] },
    ],
    // O padrão é **um objeto só**: começar por intervalos é o que faz sentido para quem abre a
    // ferramenta sozinha, e de quebra nenhuma etapa da rotina "De bolso" coincide com o padrão — se
    // coincidisse, a linha dela ficaria em branco na lista (o resumo só mostra o que difere).
    defaults: { objetos: ['intervalos'], pensar: PENSAR.padrao, anuncio: 'voz' },
    screen: () => import('../tools/MaosLivres'),
  },
  {
    // F6-4. **Tarefa**, não série: o app não ouve, então não há resposta a conferir — ele mostra o
    // alvo, espera, revela onde era, e termina na autoavaliação (decisões 5 e 37).
    //
    // Fecha o buraco que a rotina "Mapear o braço com o instrumento" expôs: todos os exercícios de
    // braço acontecem na TELA, e nenhum pedia para tocar no instrumento de verdade.
    id: 'no-instrumento', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['notas'], tarefas: ['tocar'],
    primaryModule: 'instrumento', skillTags: ['fretboard.note_finding'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.guitar', 'instrument.bass'],
    settings: ctx => [
      /**
       * **O alvo: uma nota ou um grau** (decisão dele em 20/11, escolhendo este item como casa do
       * exercício que ele descreveu em *Mapear o braço · Graus no braço*).
       *
       * Com `grau`, a tela mostra `♭3` e a pessoa toca aquele grau da tonalidade em vigor em todas
       * as posições da região. É o mesmo exercício do item — mostrar um alvo, tocar no braço de
       * verdade, se autoavaliar —, trocando o que se mostra: nome de nota exige saber onde ela
       * está, grau exige saber onde ela está **e** o que ela é na tonalidade.
       */
      { id: 'alvo', label: ctx.t('onInstrument.target'), type: 'single', options: [
        { id: 'nota', label: ctx.t('onInstrument.targetNote') },
        { id: 'grau', label: ctx.t('onInstrument.targetDegree') },
      ] },
      /**
       * **O compasso ou o cronômetro.** O desenho dele pede metrônomo lento e *"X compassos em cada
       * grau"*; o item nasceu com segundos. Os dois ficam, porque medem coisas diferentes: segundos
       * é "tempo para achar", compasso é "tocar dentro do tempo".
       *
       * Com metrônomo, a revelação dura **um compasso** — a 60 bpm são os mesmos 4 s do padrão
       * antigo, e assim nada no ciclo sai do pulso.
       */
      { id: 'ritmo', label: ctx.t('onInstrument.pacing'), type: 'single', options: [
        { id: 'segundos', label: ctx.t('onInstrument.pacingSeconds') },
        { id: 'metronomo', label: ctx.t('onInstrument.pacingMetronome') },
      ] },
      { id: 'bpm', label: ctx.t('common.tempo'), type: 'range', min: 40, max: 120, step: 2,
        format: v => `♩ = ${v}`, quando: s => s.ritmo === 'metronomo' },
      { id: 'compassos', label: ctx.t('onInstrument.barsEach'), type: 'single',
        quando: s => s.ritmo === 'metronomo',
        options: ['1', '2', '4'].map(n => ({ id: n, label: n })) },
      { id: 'esperar', label: ctx.t('onInstrument.wait'), type: 'range', min: 3, max: 20, step: 1,
        format: v => `${v} s`, quando: s => s.ritmo !== 'metronomo' },
      { id: 'mostrar', label: ctx.t('onInstrument.showFor'), type: 'range', min: 2, max: 15, step: 1,
        format: v => `${v} s`, quando: s => s.ritmo !== 'metronomo' },
      // A região do braço, com as mesmas opções dos itens de braço. **Até a 5ª casa por padrão**,
      // como ele escreveu — e é diferente do padrão dos outros itens (braço inteiro), porque aqui a
      // tarefa é tocar o grau em TODAS as posições da região: o braço inteiro seria maratona.
      { ...FRETS(ctx) },
      { id: 'ouvirAntes', label: ctx.t('onInstrument.hearFirst'), type: 'toggle' },
      { id: 'mostrarBraco', label: ctx.t('onInstrument.showFretboard'), type: 'toggle' },
    ],
    defaults: { alvo: 'nota', ritmo: 'segundos', bpm: 60, compassos: '2', casas: '0-5',
      esperar: 8, mostrar: 4, ouvirAntes: true, mostrarBraco: true },
    screen: () => import('../tools/NoInstrumento'),
  },
  {
    // MH (07/11/2026). **Tarefa**, não série: não há resposta a conferir — a pessoa explora como
    // uma nota soa sobre cada acorde do campo, e com o som da melodia desligado ela CANTA, que o
    // app também não ouve. Nos dois casos quem sabe como foi é ela (decisão 5).
    //
    // O motor é `theory/nota-sobre-acorde.ts` e a frase é `catalog/relacao-texto.ts`.
    id: 'relacoes-melodia-harmonia', kind: 'tarefa',
    publicacao: RASCUNHO, requires: {}, validation: ['self_report'], mobile: true,
    objetos: ['harmonia', 'melodia'], tarefas: ['ouvir'],
    // Nas DUAS percepções, a pedido do Paulo: a nota é melódica, o acorde embaixo é harmônico, e
    // o exercício é exatamente o encontro dos dois. `primaryModule` segue sendo a harmônica, que é
    // a que conta no histórico.
    primaryModule: 'ouvido',
    skillTags: ['ear.scale_degrees', 'theory.harmonic_field'],
    contentTags: ['harmony.diatonic_field', 'chord.triads', 'chord.sevenths', 'scale.major', 'scale.minor'],
    settings: ctx => [
      { id: 'campo', label: ctx.t('melodyHarmony.field'), type: 'single', options: [
        { id: 'maior', label: ctx.t('melodyHarmony.field_maior') },
        { id: 'menor', label: ctx.t('melodyHarmony.field_menor') },
        { id: 'menor-harmonica', label: ctx.t('melodyHarmony.field_menor-harmonica') },
        { id: 'menor-melodica', label: ctx.t('melodyHarmony.field_menor-melodica') },
      ] },
      // Padrão restrito à escala; abrir para as doze é escolha de quem usa (decisão do Paulo).
      { id: 'cromatico', label: ctx.t('melodyHarmony.chromatic'), type: 'toggle' },
      { id: 'soarMelodia', label: ctx.t('melodyHarmony.soundMelody'), type: 'toggle' },
      { id: 'tetrade', label: ctx.t('melodyHarmony.tetrad'), type: 'toggle' },
    ],
    defaults: { campo: 'maior', cromatico: false, soarMelodia: true, tetrade: false },
    screen: () => import('../tools/RelacoesMelodiaHarmonia'),
  },
  {
    /**
     * **Explorar padrões pela escala** — a metade de exploração do par de
     * `docs/tarefas/PE-padroes-de-escala.md`. O exercício (`reconhecer-padroes-escala`) saiu
     * primeiro, em 10/11, porque cabia no Player; esta é a peça com tela própria, e ela faz o que
     * ele descreveu: *"o aluno arpeja o padrão começando no 1, depois no 2, e assim por diante,
     * conferindo após solfejar. Ele faz isso até ficar confortável. Isso por si só já é um grande
     * exercício"*.
     *
     * `tarefa` e não `serie`: termina quando a pessoa declara que ficou confortável, não quando o
     * app conta N perguntas. E `settings` vazio de propósito — quem escolhe o padrão é a tela, e o
     * laço com o exercício passa pelo `state` da navegação, não por configuração guardada.
     */
    id: 'explorar-padroes-escala', kind: 'tarefa',
    publicacao: RASCUNHO, requires: {}, validation: ['self_report'], mobile: true,
    objetos: ['escalas', 'melodia'], tarefas: ['cantar', 'tocar'],
    primaryModule: 'ouvido', skillTags: ['ear.scale_degrees'],
    contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/PadroesDeEscala'),
  },
  {
    /**
     * **Backing e drone são um ambiente só** (decisão dele em 20/11). O que soa se escolhe por
     * partes — drone, bateria, baixo, progressão — e o item herdou as declarações do `ambiente`:
     * cantar entrou nas tarefas, e escalas nos objetos, porque é o que se faz contra um drone.
     * `requires` fica como estava: os dois pediam instrumento, então a fusão não mexe nisso.
     */
    id: 'backing', kind: 'ambiente',
    publicacao: LEGADO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['harmonia', 'escalas'], tarefas: ['tocar', 'cantar'],
    primaryModule: 'ouvido', skillTags: ['theory.harmonic_field'], contentTags: ['harmony.diatonic_field', 'chord.triads', 'chord.sevenths'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Backing'),
  },
  {
    /**
     * **Tarefa, e não ambiente** (decisão dele em 20/11, a Q10 da reorganização).
     *
     * O critério do projeto é **como termina e que prova gera**: ambiente termina quando a pessoa
     * para e registra tempo; tarefa termina quando ela declara *consegui / com ajuda / preciso
     * repetir*. Ler uma partitura gerada e tocá-la junto é isto — *"tu lê aquilo e batuca junto...
     * é um exercício de certa forma"*. Eram ambiente porque ninguém tinha posto um veredito neles,
     * não porque ler não fosse exercício.
     */
    id: 'leitura', kind: 'tarefa',
    publicacao: LEGADO, requires: {}, validation: ['none'], mobile: true,
    objetos: ['notacao'], tarefas: ['ler'],
    primaryModule: 'leitura', skillTags: ['notation.pitch_reading'], contentTags: ['clef.treble', 'clef.bass', 'pitch.naturals'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Leitura'),
  },
  {
    id: 'ritmo', kind: 'tarefa',
    publicacao: LEGADO, requires: {}, validation: ['none'], mobile: true,
    objetos: ['ritmo'], tarefas: ['ler'],
    primaryModule: 'leitura', skillTags: ['notation.rhythm_reading'], contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.rests', 'rhythm.syncopation', 'rhythm.triplets'],
    /**
     * **O atalho é o que a rotina consegue pedir.** Até 10/11/2026 este item declarava
     * `noSettings`, e toda a configuração dele morava dentro da tela. Isso tornava impossível a
     * rotina do Paulo de quatro etapas de leitura rítmica variando os recursos: as quatro etapas
     * abririam a mesma tela no mesmo estado, e ele teria de trocar à mão em cada uma — o que
     * desmancha a rotina.
     *
     * Só o atalho é declarado, não as dezenas de chaves de `RhythmSettings`: a rotina escolhe um
     * recorte nomeado, e o ajuste fino segue sendo da tela.
     */
    settings: ctx => [{
      id: 'preset', label: ctx.t('rhythm.presets'), type: 'single',
      options: PRESETS.map(p => ({ id: p.id, label: ctx.t(`rhythm.presetNames.${p.id}` as MessageKey) })),
    }],
    defaults: { preset: 'seminimas' },
    // traz a VexFlow junto; só baixa quando a tela abre
    screen: () => import('../tools/Ritmo'),
  },
  {
    id: 'tecnica', kind: 'tarefa',
    publicacao: LEGADO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['motor'], tarefas: ['tocar'],
    primaryModule: 'tecnica',
    skillTags: ['technique.fingering', 'technique.finger_independence', 'technique.string_crossing', 'technique.tempo_control'],
    contentTags: ['instrument.guitar', 'instrument.bass'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Tecnica'),
  },

  // ---------------------------------------------------------------------------------------------
  // A "tarefa com metrônomo" (decisão 15): UMA tela, cinco famílias. O que muda de uma para outra
  // está em tools/cadencia-familias.ts — os controles e o plano. Todas terminam quando a pessoa se
  // autoavalia (`tarefa`): o app não ouve, só marca o momento de cada coisa.
  //
  // Declaradas, NÃO publicadas (decisão 51): a revisão musical é passo do Paulo.
  // ---------------------------------------------------------------------------------------------
  {
    id: 'acento-deslocado', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['ritmo', 'motor'], tarefas: ['tocar'],
    primaryModule: 'tecnica', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.eighth', 'rhythm.triplets', 'rhythm.sixteenth'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
  {
    id: 'subdivisao-alternada', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['ritmo', 'motor'], tarefas: ['tocar'],
    primaryModule: 'tecnica', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.triplets', 'rhythm.sixteenth'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
  {
    id: 'deslocamento-ritmico', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['ritmo'], tarefas: ['tocar'],
    primaryModule: 'tecnica', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.eighth', 'rhythm.triplets', 'rhythm.sixteenth', 'rhythm.rests'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
];
