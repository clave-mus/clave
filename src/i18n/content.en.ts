import type ptContent from './content.pt';
import type { Shape } from './index';

const enContent: Shape<typeof ptContent> = {
  modules: {
    theory: { name: 'Theory', short: 'Notation, scales, chords and the map of your instrument' },
    technique: { name: 'Technique', short: 'Motor control and steadiness' },
    'perception.melodic': { name: 'Melodic perception', short: 'Pitches, intervals and scales' },
    'perception.harmonic': { name: 'Harmonic perception', short: 'Chords and sonorities' },
    'perception.rhythmic': { name: 'Rhythmic perception', short: 'Pulse, note values and cells' },
  },
  instruments: {
    piano: 'Piano / keyboard',
    violao: 'Guitar',
    baixo: 'Bass',
  },
  // The nine doors (decisions 20, 79 and 80). Not literal translations: what matters is each line
  // doing in English what it does in Portuguese — describing the content, never labelling the reader.
  portas: {
    'notas-no-instrumento': { nome: 'Master the notes on your instrument', apoio: 'Know where every note is, without hunting for it.' },
    ouvido: { nome: 'Improve your ear', apoio: 'Recognise what you hear — intervals, chords, scales, degrees.' },
    harmonia: { nome: 'Follow and understand harmony', apoio: 'Diatonic chords, chord symbols and voice leading: what holds the music up.' },
    teoria: { nome: 'Learn music theory', apoio: 'The names and the reasons behind what you already play.' },
    leitura: { nome: 'Learn to read sheet music', apoio: 'From the written note to the sound, without stalling.' },
    ritmo: { nome: 'Rhythm and internal pulse', apoio: 'Subdivision, rhythm reading, and playing in time.' },
    tecnica: { nome: 'Improve technique and precision', apoio: 'Coordination, finger independence, and control of your sound.' },
    improviso: { nome: 'Improvise and solo', apoio: 'What prepares improvisation: scales, arpeggios, target notes, and vocabulary.' },
    comecar: { nome: "I don't know where to start", apoio: 'Three questions and a suggested routine. You can change all of it later.' },
  },
  goals: {
    improvisar: 'Improvise fluently',
    harmonia: 'Write beautiful progressions',
    'tirar-de-ouvido': 'Learn songs by ear',
    'ler-partitura': 'Read sheet music',
    agilidade: 'Build agility',
    jazz: 'Play jazz',
    repertorio: 'Learn songs',
  },
};

export default enContent;
