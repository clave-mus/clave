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
    ritmo: { nome: 'Improve rhythm and groove', apoio: 'Subdivision, rhythm reading, and playing in time.' },
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
  lessons: {
    'ler-partitura': {
      title: 'How to read sheet music',
      why: 'Sheet music is the most precise way to store and share music. Reading well opens up the written repertoire and speeds up learning any piece.',
      how: 'Separate notes and rhythm. Five minutes of "Name that note" a day and a reading generator with just a few notes make a big difference in two weeks.',
      steps: [
        'The staff has 5 lines and 4 spaces. Higher notes sit higher up.',
        'The treble clef marks G on the 2nd line. From there, lines and spaces go in order: E, F, G, A, B, C, D, E, F.',
        'The bass clef marks F on the 4th line and is used for low sounds (bass, the piano’s left hand).',
        'Ledger lines extend the staff up and down. Middle C sits on the first ledger line below the treble clef.',
        'Start with 3 notes in the reading generator and only add more once you read without stopping.',
      ],
    },
    'leitura-ritmica': {
      title: 'Rhythm reading',
      why: 'A wrong rhythm ruins the right note. Reading rhythm apart from pitch frees your brain to understand note values and the pulse.',
      how: 'Tap on your leg along with the rhythm generator, in a loop. Start with two note values, then bring in a new cell and alternate it with quarter notes.',
      steps: [
        'A quarter note lasts one beat. A half note, two. A whole note, four.',
        'Two eighth notes split the beat in two; four sixteenth notes, in four.',
        'Rests are silences with the same length as the notes.',
        'An offbeat is playing on the second half of the beat, after an eighth rest.',
        'Count out loud: "1 and 2 and 3 and 4 and". For sixteenths: "1 e and a".',
      ],
    },
    'mapear-braco': {
      title: 'Map the fretboard',
      why: 'Fluency means knowing exactly which note you are playing at any moment. That isn’t always obvious on the fretboard; it has to be trained.',
      how: 'Lock in one region (frets 0 to 5) until you get it without thinking. Then move to the next (5 to 9). Always say the note name as you play.',
      steps: [
        'The open strings of the guitar are E, A, D, G, B, E. On bass, E, A, D, G.',
        'Each fret goes up a half step. At the 12th fret the notes repeat an octave higher.',
        'Between E and F, and between B and C, there is only a half step. Between the other neighboring notes, a whole step.',
        'Intervals always have the same shape on the fretboard (except when they cross the B string on guitar). Learn the shapes.',
      ],
    },
    'escala-maior': {
      title: 'The major scale',
      why: 'Almost all Western harmony is explained from the major scale: modes, chords and the harmonic field all come from it.',
      how: 'Pick one key a week. Sing the scale slowly, saying the name and degree of each note, and only then play it.',
      steps: [
        'The major scale follows the formula whole, whole, half, whole, whole, whole, half.',
        'Degrees are numbered 1 to 7. The 1st is the tonic.',
        'Each major key has its own key signature: G major has F♯; F major has B♭.',
        'Every major key has a relative minor, which starts on the 6th degree and uses the same notes.',
      ],
    },
    'modos-gregos': {
      title: 'Church modes',
      why: 'The modes are the major scale starting from another degree. Each one has its own color and fits a specific chord.',
      how: 'Play each mode over a tonic drone (the Sing and play tool) and listen for the note that sets it apart.',
      steps: [
        'Ionian (1st), Dorian (2nd), Phrygian (3rd), Lydian (4th), Mixolydian (5th), Aeolian (6th) and Locrian (7th).',
        'Dorian is minor with a major 6th. Phrygian is minor with a minor 2nd.',
        'Lydian is major with an augmented 4th. Mixolydian is major with a minor 7th.',
        'In the backing track, Clave suggests which mode to use over each chord.',
      ],
    },
    acordes: {
      title: 'Arpeggios and chord construction',
      why: 'Knowing the notes of each chord is what lets you improvise "through the changes" and write progressions with intent.',
      how: 'For each degree of the key of the week, play the chord’s arpeggio in every position up to the 5th fret.',
      steps: [
        'Triads stack thirds: 1, 3, 5. Major has a major third; minor, a minor third.',
        'Diminished has a minor third and a diminished fifth. Augmented, a major third and an augmented fifth.',
        'Seventh chords add the 7th: maj7, 7 (dominant), m7, m7♭5.',
        'The major harmonic field in seventh chords is: Imaj7, ii m7, iii m7, IVmaj7, V7, vi m7, vii m7♭5.',
      ],
    },
    'harmonia-funcional': {
      title: 'Functional harmony',
      why: 'Understanding function (tonic, subdominant, dominant) explains why progressions work and opens the way to reharmonization.',
      how: 'Analyze the degrees in the songs you play. Use the backing track to test substitutions.',
      steps: [
        'Tonic: I, iii, vi. Subdominant: IV, ii. Dominant: V, vii.',
        'The relative minor uses the same notes as the major and has the same key signature.',
        'Secondary dominants lead to other degrees: VI7 leads to ii.',
        'The tritone substitute swaps V7 for the dominant chord a half step above the tonic (♭II7).',
      ],
    },
    ouvido: {
      title: 'Ear training',
      why: 'Recognizing intervals, chords and scales by ear is what lets you figure out songs, improvise and talk with other musicians.',
      how: 'Ten minutes a day, ideally without an instrument (it works on the bus). Start with a few intervals and keep adding.',
      steps: [
        'Link intervals to songs you know (the perfect 4th opens many hymns).',
        'Sing what you hear before answering. Singing is the shortcut between your ear and your instrument.',
        'Pentatonic cells train short phrases, like the ones you use when improvising.',
      ],
    },
    tecnica: {
      title: 'Technique with a metronome',
      why: 'Precision comes before speed. Simple exercises with a metronome keep your hands relaxed and your time steady.',
      how: 'Five minutes of warm-up before any session with the instrument. Add 4 bpm only after it comes out clean three times.',
      steps: [
        'Use correct fingering: one finger per fret on guitar and bass.',
        'Root, fifth and octave across strings trains the picking hand and the fretboard map at the same time.',
        'The "spider" (1-2-3-4) works on finger independence.',
        'Always sing what you play: knowing the notes is part of technique.',
      ],
    },
  },
  roadmaps: {
    geral: {
      title: 'Fundamentals', sub: 'the general path',
      notes: {
        'ler-partitura': 'Notes on the staff', 'leitura-ritmica': 'Note values and pulse', 'mapear-braco': 'Frets 0 to 5', 'escala-maior': 'One key a week',
        ouvido: 'Basic intervals', acordes: 'Triads and seventh chords', 'modos-gregos': 'Colors of the modes', 'harmonia-funcional': 'Function and reharmonization',
      },
    },
    jazz: {
      title: 'Jazz', sub: 'sevenths and improvisation',
      notes: { acordes: 'Seventh chords in every key', 'modos-gregos': 'Dorian and Mixolydian', 'harmonia-funcional': 'ii–V–I and tritone subs', ouvido: 'Pentatonic cells' },
    },
    erudito: {
      title: 'Classical', sub: 'reading and repertoire',
      notes: { 'ler-partitura': 'Both clefs', 'leitura-ritmica': 'Sixteenths and dotted notes', 'escala-maior': 'Key signatures up to 4 accidentals', tecnica: 'Scales with a metronome' },
    },
  },
  genres: {
    samba: {
      name: 'Samba', sub: 'partido-alto', desc: 'Pandeiro, tamborim and cavaquinho grooves.',
      sides: { a: 'Side A · pandeiro', b: 'Side B · harmony' },
      tracks: { levada: 'The basic groove', toques: 'Thumb, fingertips and slap', partido: 'Partido-alto', teleco: 'Teleco-teco', progressao: 'I – VI7 – ii – V7', secundarios: 'Secondary dominants' },
    },
    jazz: {
      name: 'Jazz', sub: 'sevenths and improvisation', desc: 'Walking bass, seventh chords and blues scales.',
      sides: { a: 'Side A · harmony', b: 'Side B · improvisation' },
      tracks: { tetrades: 'Seventh chords of the major field', iivi: 'The ii–V–I', sub5: 'Tritone sub', blues: '12-bar blues', celulas: 'Pentatonic cells' },
    },
    rock: {
      name: 'Rock', sub: 'power chords', desc: 'Riffs, alternate picking and palm muting.',
      sides: { a: 'Side A · picking hand' },
      tracks: { palhetada: 'Alternate picking', power: 'Power chords on the fretboard', pop: 'Pop rock: I–V–vi–IV' },
    },
    classico: {
      name: 'Classical', sub: 'reading and posture', desc: 'Sheet music, bowing and intonation.',
      sides: { a: 'Side A · reading' },
      tracks: { ode: 'Ode to Joy', armaduras: 'Key signatures', escalas: 'Major scales' },
    },
    hiphop: {
      name: 'Hip-hop', sub: 'flow in time', desc: 'Beat, rhyme and breath.',
      sides: { a: 'Side A · time' },
      tracks: { semis: 'Sixteenths on the pulse', ritmo: 'Which rhythm is this?' },
    },
    forro: {
      name: 'Forró', sub: 'baião and xote', desc: 'Accordion, zabumba and triangle.',
      sides: { a: 'Side A · baião' },
      tracks: { mixolidio: 'The Mixolydian of baião', levada: 'Baião groove' },
    },
  },
};

export default enContent;
