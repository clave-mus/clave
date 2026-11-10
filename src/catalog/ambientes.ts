// Ambientes: itens de catálogo com tela própria, em vez de pergunta (decisão 17).
//
// Eles são o MESMO tipo dos exercícios — `CatalogItem` —, só que com `screen` no lugar de `make`
// e `kind: 'ambiente'`. É isso que permite um metrônomo entrar numa etapa de rotina sem nenhum
// caso especial no código, e que o braço virtual tenha uma implementação só.
//
// `tecnica` é `tarefa`, não `ambiente`: ela termina quando a pessoa se autoavalia (F6-5).
// Título e descrição ficam em tools.<id> nos textos de cada idioma.
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
      { id: 'mostrar', label: ctx.t('onInstrument.showFor'), type: 'range', min: 2, max: 15, step: 1, format: v => `${v} s` },
      { id: 'ouvirAntes', label: ctx.t('onInstrument.hearFirst'), type: 'toggle' },
      { id: 'mostrarBraco', label: ctx.t('onInstrument.showFretboard'), type: 'toggle' },
    ],
    defaults: { esperar: 8, mostrar: 4, ouvirAntes: true, mostrarBraco: true },
    screen: () => import('../tools/NoInstrumento'),
  },
  {
    // X3 (06/11/2026). **Tarefa**, não série: igual ao `no-instrumento`, o app não ouve — mostra o
    // alvo, espera o clique que revela, e confere com autoavaliação. A diferença daqui é que a
    // autoavaliação é POR RODADA, não só ao fim da etapa (pedido do Paulo, para ver como fica) —
    // `tools/Audiar.tsx` respeita `state.audiarAutoavaliar` para isso ser desligável.
    //
    // A geração mora em `items/audiar.ts`, porque o mãos-livres (F6-1) a usa também, sem tela.
    id: 'audiar', kind: 'tarefa',
    publicacao: RASCUNHO, requires: {}, validation: ['self_report'], mobile: true,
    // Faltava declarar (achado em 09/11 pelo teste de `doTime`, ao pôr a audiação na rotina em dó
    // maior): `items/audiar.ts` chama `tonicaNaRegiao`, que lê tonalidade E região. O item sempre
    // respeitou as duas; só não avisava — e por isso o painel de prática não as oferecia aqui.
    respeita: ['key', 'range'],
    objetos: ['intervalos', 'escalas', 'acordes'], tarefas: ['audiar'],
    primaryModule: 'perception.melodic', skillTags: ['ear.audiation'],
    contentTags: ['interval.simple', 'scale.major', 'scale.minor', 'scale.modes', 'chord.triads', 'chord.sevenths'],
    settings: ctx => [
      {
        id: 'estimulos', label: ctx.t('audiar.stimuli'), type: 'multi',
        options: [
          { id: 'referencia', label: ctx.t('audiar.stimulusReference') },
          { id: 'graus', label: ctx.t('audiar.stimulusDegrees') },
        ],
      },
      { id: 'drone', label: ctx.t('audiar.drone'), type: 'toggle' },
    ],
    defaults: { estimulos: ['referencia', 'graus'], drone: false },
    screen: () => import('../tools/Audiar'),
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
    primaryModule: 'perception.harmonic', tambemEm: ['perception.melodic'],
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
    id: 'deslocamento-ritmico', kind: 'tarefa',
    publicacao: RASCUNHO, requires: { instrumento: true }, validation: ['self_report'], mobile: false,
    objetos: ['ritmo'], tarefas: ['tocar'],
    primaryModule: 'perception.rhythmic', skillTags: ['technique.tempo_control'],
    contentTags: ['rhythm.eighth', 'rhythm.triplets', 'rhythm.sixteenth', 'rhythm.rests'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Cadencia'),
  },
];
