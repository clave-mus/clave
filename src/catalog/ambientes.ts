// Ambientes: itens de catálogo com tela própria, em vez de pergunta (decisão 17).
//
// Eles são o MESMO tipo dos exercícios — `CatalogItem` —, só que com `screen` no lugar de `make`
// e `kind: 'ambiente'`. É isso que permite um metrônomo entrar numa etapa de rotina sem nenhum
// caso especial no código, e que o braço virtual tenha uma implementação só.
//
// `tecnica` é `tarefa`, não `ambiente`: ela termina quando a pessoa se autoavalia (F6-5).
// Título e descrição ficam em tools.<id> nos textos de cada idioma.
import type { CatalogItem } from './types';

/** Ambientes não têm configuração declarada: cada tela cuida das suas (serão migradas na F1-3). */
const noSettings = () => [];

export const AMBIENTES: CatalogItem[] = [
  {
    id: 'metronomo', kind: 'ambiente', mobile: true,
    primaryModule: 'technique', skillTags: ['technique.tempo_control'], contentTags: [],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/common').then(m => ({ default: m.Metronome })),
  },
  {
    id: 'ambiente', kind: 'ambiente', mobile: false,
    primaryModule: 'perception.melodic', skillTags: ['ear.pitch_identification'], contentTags: ['key.major', 'key.minor'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Ambiente'),
  },
  {
    id: 'backing', kind: 'ambiente', mobile: false,
    primaryModule: 'perception.harmonic', skillTags: ['theory.harmonic_field'], contentTags: ['harmony.diatonic_field', 'chord.triads', 'chord.sevenths'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Backing'),
  },
  {
    id: 'leitura', kind: 'ambiente', mobile: true,
    primaryModule: 'perception.melodic', skillTags: ['notation.pitch_reading'], contentTags: ['clef.treble', 'clef.bass', 'pitch.naturals'],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Leitura'),
  },
  {
    id: 'ritmo', kind: 'ambiente', mobile: true,
    primaryModule: 'perception.rhythmic', skillTags: ['notation.rhythm_reading'], contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.rests', 'rhythm.syncopation', 'rhythm.triplets'],
    settings: noSettings, defaults: {},
    // traz a VexFlow junto; só baixa quando a tela abre
    screen: () => import('../tools/Ritmo'),
  },
  {
    id: 'tecnica', kind: 'tarefa', mobile: false,
    primaryModule: 'technique', skillTags: ['technique.fingering', 'technique.finger_independence', 'technique.tempo_control'], contentTags: [],
    settings: noSettings, defaults: {},
    screen: () => import('../tools/Tecnica'),
  },
];
