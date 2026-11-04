// Ambientes: itens de catálogo com tela própria, em vez de pergunta (decisão 17).
//
// Eles são o MESMO tipo dos exercícios — `CatalogItem` —, só que com `screen` no lugar de `make`
// e `kind: 'ambiente'`. É isso que permite um metrônomo entrar numa etapa de rotina sem nenhum
// caso especial no código, e que o braço virtual tenha uma implementação só.
//
// `tecnica` é `tarefa`, não `ambiente`: ela termina quando a pessoa se autoavalia (F6-5).
// Título e descrição ficam em tools.<id> nos textos de cada idioma.
import { OBJETOS_DE_BOLSO, PENSAR } from './maos-livres';
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
    primaryModule: 'technique', skillTags: ['technique.tempo_control'],
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
    primaryModule: 'perception.melodic',
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
    primaryModule: 'theory', skillTags: ['fretboard.note_finding'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.guitar', 'instrument.bass'],
    settings: ctx => [
      { id: 'esperar', label: ctx.t('onInstrument.wait'), type: 'range', min: 3, max: 20, step: 1, format: v => `${v} s` },
      { id: 'ouvirAntes', label: ctx.t('onInstrument.hearFirst'), type: 'toggle' },
    ],
    defaults: { esperar: 8, ouvirAntes: true },
    screen: () => import('../tools/NoInstrumento'),
  },
  {
    id: 'ambiente', kind: 'ambiente',
    publicacao: LEGADO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['escalas'], tarefas: ['cantar', 'tocar'],
    primaryModule: 'perception.melodic', skillTags: ['ear.pitch_identification'], contentTags: ['key.major', 'key.minor'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Ambiente'),
  },
  {
    id: 'backing', kind: 'ambiente',
    publicacao: LEGADO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['harmonia'], tarefas: ['tocar'],
    primaryModule: 'perception.harmonic', skillTags: ['theory.harmonic_field'], contentTags: ['harmony.diatonic_field', 'chord.triads', 'chord.sevenths'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Backing'),
  },
  {
    id: 'leitura', kind: 'ambiente',
    publicacao: LEGADO, requires: {}, validation: ['none'], mobile: true,
    objetos: ['notacao'], tarefas: ['ler'],
    primaryModule: 'perception.melodic', skillTags: ['notation.pitch_reading'], contentTags: ['clef.treble', 'clef.bass', 'pitch.naturals'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Leitura'),
  },
  {
    id: 'ritmo', kind: 'ambiente',
    publicacao: LEGADO, requires: {}, validation: ['none'], mobile: true,
    objetos: ['ritmo'], tarefas: ['ler'],
    primaryModule: 'perception.rhythmic', skillTags: ['notation.rhythm_reading'], contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.rests', 'rhythm.syncopation', 'rhythm.triplets'],
    settings: noSettings, defaults: {},
    // traz a VexFlow junto; só baixa quando a tela abre
    screen: () => import('../tools/Ritmo'),
  },
  {
    id: 'tecnica', kind: 'tarefa',
    publicacao: LEGADO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['motor'], tarefas: ['tocar'],
    primaryModule: 'technique',
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
    primaryModule: 'technique', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.eighth', 'rhythm.triplets', 'rhythm.sixteenth'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
  {
    id: 'subdivisao-alternada', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['ritmo', 'motor'], tarefas: ['tocar'],
    primaryModule: 'technique', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.triplets', 'rhythm.sixteenth'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
  {
    id: 'sustentar-e-cortar', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['motor'], tarefas: ['tocar'],
    primaryModule: 'technique', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.quarter'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
  {
    id: 'legato-staccato', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['motor'], tarefas: ['tocar'],
    primaryModule: 'technique', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.quarter'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
  {
    id: 'deslocamento-ritmico', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['ritmo'], tarefas: ['tocar'],
    primaryModule: 'perception.rhythmic', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.eighth', 'rhythm.triplets', 'rhythm.sixteenth', 'rhythm.rests'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
];
