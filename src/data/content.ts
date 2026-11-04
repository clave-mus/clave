// Conteúdo de estudo. Cada aula segue a mesma receita:
// por que importa, como encaixar nos estudos, um tutorial curto e os exercícios/ferramentas.
// Aqui fica a estrutura (ids, ligações, links); os textos estão em src/i18n/content.*.ts e chegam
// às telas já no idioma da pessoa (useContent, em src/data/localized.ts).
import type { Assunto } from '../catalog/taxonomy';

// Uma aula também tem módulo principal e etiquetas, para ligar aula e exercício pelo que ensinam
// e não pelo nome.
export interface LessonBase extends Assunto {
  id: string;
  exercises: string[];
  tools: string[];
  premium?: boolean;
}
export interface Lesson extends LessonBase {
  title: string;
  why: string;
  how: string;
  steps: string[];
}

export const LESSONS: LessonBase[] = [
  {
    id: 'ler-partitura',
    objetos: ['notacao'],
    primaryModule: 'theory', skillTags: ['notation.pitch_reading', 'notation.pitch_writing', 'notation.key_signature'],
    contentTags: ['clef.treble', 'clef.bass', 'staff.ledger_lines', 'pitch.naturals', 'key.signatures'],
    exercises: ['que-nota-e-essa', 'ache-a-nota', 'pauta-armadura'], tools: ['leitura'],
  },
  {
    id: 'leitura-ritmica',
    objetos: ['ritmo', 'notacao'],
    primaryModule: 'perception.rhythmic', skillTags: ['notation.rhythm_reading', 'ear.rhythm_recognition'],
    contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.rests'],
    exercises: ['ritmo-ouvido'], tools: ['ritmo', 'leitura', 'metronomo'],
  },
  {
    id: 'mapear-braco',
    objetos: ['notas'],
    primaryModule: 'theory', skillTags: ['fretboard.note_naming', 'fretboard.note_finding', 'fretboard.interval_shapes'],
    contentTags: ['pitch.naturals', 'pitch.accidentals', 'interval.simple', 'instrument.guitar', 'instrument.bass'],
    exercises: ['que-nota-e-essa', 'ache-a-nota', 'que-intervalo-e-esse', 'que-acorde-e-esse'], tools: [],
  },
  {
    id: 'escala-maior',
    objetos: ['escalas'],
    primaryModule: 'theory', skillTags: ['theory.scale_degrees', 'theory.key_relations', 'notation.key_signature'],
    contentTags: ['scale.major', 'key.major', 'key.minor', 'key.signatures'],
    exercises: ['pauta-escala', 'quiz-teoria', 'ouvido-escala'], tools: [],
  },
  {
    id: 'modos-gregos',
    objetos: ['escalas'],
    primaryModule: 'theory', skillTags: ['theory.modes'],
    contentTags: ['scale.modes'],
    exercises: ['quiz-teoria', 'ouvido-escala'], tools: ['backing', 'ambiente'],
  },
  {
    id: 'acordes',
    objetos: ['acordes'],
    primaryModule: 'theory', skillTags: ['theory.chord_construction', 'theory.harmonic_field'],
    contentTags: ['chord.triads', 'chord.sevenths', 'harmony.diatonic_field'],
    exercises: ['que-acorde-e-esse', 'ouvido-acorde'], tools: ['backing'],
  },
  {
    id: 'harmonia-funcional',
    objetos: ['harmonia'],
    primaryModule: 'theory', skillTags: ['theory.harmonic_field', 'theory.reharmonization', 'theory.key_relations'],
    contentTags: ['harmony.diatonic_field', 'harmony.tritone_sub', 'key.minor'],
    exercises: ['quiz-teoria'], tools: ['backing'],
    premium: true,
  },
  {
    id: 'ouvido',
    objetos: ['intervalos', 'escalas'],
    primaryModule: 'perception.melodic', skillTags: ['ear.interval_identification', 'ear.pitch_identification', 'ear.chord_quality', 'ear.scale_quality', 'ear.scale_degrees'],
    contentTags: ['interval.simple', 'chord.triads', 'scale.pentatonic'],
    exercises: ['ouvido-intervalo', 'ouvido-acorde', 'ouvido-escala', 'ouvido-tecla', 'ouvido-celulas'], tools: ['ambiente'],
  },
  {
    id: 'tecnica',
    objetos: ['motor'],
    primaryModule: 'technique', skillTags: ['technique.fingering', 'technique.finger_independence', 'technique.string_crossing', 'technique.tempo_control'],
    contentTags: ['instrument.guitar', 'instrument.bass'],
    exercises: [], tools: ['tecnica', 'metronomo'],
  },
];

export interface RoadmapBase {
  id: string;
  premium: boolean;
  lessons: string[];
}
export interface Roadmap extends Omit<RoadmapBase, 'lessons'> {
  title: string;
  sub: string;
  steps: { lesson: string; note: string }[];
}
export const ROADMAPS: RoadmapBase[] = [
  { id: 'geral', premium: false, lessons: ['ler-partitura', 'leitura-ritmica', 'mapear-braco', 'escala-maior', 'ouvido', 'acordes', 'modos-gregos', 'harmonia-funcional'] },
  { id: 'jazz', premium: true, lessons: ['acordes', 'modos-gregos', 'harmonia-funcional', 'ouvido'] },
  { id: 'erudito', premium: true, lessons: ['ler-partitura', 'leitura-ritmica', 'escala-maior', 'tecnica'] },
];

export interface GenreBase {
  id: string;
  cat: string;
  color: string;
  sides: { side: string; tracks: { id: string; min: number; to?: string }[] }[];
}
export interface Genre extends GenreBase {
  name: string;
  sub: string;
  desc: string;
  sides: { side: string; tracks: { id: string; title: string; min: number; to?: string }[] }[];
}
export const GENRES: GenreBase[] = [
  {
    id: 'samba', cat: 'CLV 1503', color: 'var(--mu)',
    sides: [
      { side: 'a', tracks: [{ id: 'levada', min: 6, to: '/ferramentas/leitura' }, { id: 'toques', min: 9 }, { id: 'partido', min: 10 }, { id: 'teleco', min: 8 }] },
      { side: 'b', tracks: [{ id: 'progressao', min: 8, to: '/ferramentas/backing?p=samba' }, { id: 'secundarios', min: 10, to: '/estudar/harmonia-funcional' }] },
    ],
  },
  {
    id: 'jazz', cat: 'CLV 1501', color: 'var(--mu)',
    sides: [
      { side: 'a', tracks: [{ id: 'tetrades', min: 8, to: '/estudar/acordes' }, { id: 'iivi', min: 10, to: '/ferramentas/backing?p=ii-v-i' }, { id: 'sub5', min: 7, to: '/treinar/quiz-teoria' }] },
      { side: 'b', tracks: [{ id: 'blues', min: 12, to: '/ferramentas/backing?p=blues' }, { id: 'celulas', min: 8, to: '/treinar/ouvido-celulas' }] },
    ],
  },
  {
    id: 'rock', cat: 'CLV 1502', color: 'var(--ve)',
    sides: [{ side: 'a', tracks: [{ id: 'palhetada', min: 6, to: '/ferramentas/tecnica' }, { id: 'power', min: 8, to: '/treinar/que-intervalo-e-esse' }, { id: 'pop', min: 8, to: '/ferramentas/backing?p=pop' }] }],
  },
  {
    id: 'classico', cat: 'CLV 1504', color: 'var(--co)',
    sides: [{ side: 'a', tracks: [{ id: 'ode', min: 8, to: '/ferramentas/leitura' }, { id: 'armaduras', min: 6, to: '/treinar/pauta-armadura' }, { id: 'escalas', min: 8, to: '/treinar/pauta-escala' }] }],
  },
  {
    id: 'hiphop', cat: 'CLV 1505', color: 'var(--cream)',
    sides: [{ side: 'a', tracks: [{ id: 'semis', min: 6, to: '/ferramentas/leitura' }, { id: 'ritmo', min: 6, to: '/treinar/ritmo-ouvido' }] }],
  },
  {
    id: 'forro', cat: 'CLV 1506', color: 'var(--ve)',
    sides: [{ side: 'a', tracks: [{ id: 'mixolidio', min: 8, to: '/estudar/modos-gregos' }, { id: 'levada', min: 6, to: '/ferramentas/backing?p=baiao' }] }],
  },
];
