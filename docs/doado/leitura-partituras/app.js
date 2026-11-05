"use strict";

/**
 * ==========================================================================
 * MÓDULO 1: ESTADO GLOBAL E VARIÁVEIS DE MEMÓRIA
 * ==========================================================================
 */
let lastMidi = null;
let pendingTieMidi = null;

const triadState = { degree:0 }; 
const grooveState = { pattern: null, patternLenMeasures: 1, measureInCycle: 0, cycleLength: 4, progression: [0,3,4,0] };
let seqIndex = 0, seqStep = 0, seqDir = 1;
let pedalIsRoot = true, pedalScaleIdx = 0, pedalDir = 1;

/**
 * ==========================================================================
 * MÓDULO 2: CARREGAMENTO DA APLICAÇÃO E i18n
 * ==========================================================================
 */
const DICTIONARY = {
    pt: {
        appTitle: "Prática de Leitura à Primeira Vista",
        setGeneral: "Configurações gerais", dispMode: "Modo de Exibição", dispScroll: "Rolagem Contínua", dispPage: "Leitura Estática (Páginas)",
        linesPage: "Linhas por Página", lines2: "2 Linhas", lines3: "3 Linhas", lines4: "4 Linhas",
        timeSig: "Fórmula de Compasso", tsOdd5: "5/4", tsOdd7: "7/4", tsComp68: "6/8", tsComp98: "9/8", tsComp128: "12/8", tsComp64: "6/4",
        clef: "Clave", clefBass: "Clave de Fá", clefTreble: "Clave de Sol", clefAlto: "Clave de Dó 3ªL", clefTenor: "Clave de Dó 4ªL",
        key: "Tom", pentaOnly: "Restringir à Escala Pentatônica",
        extRange: "Extensão de Notas", position: "Posição", posFree: "Livre (usar limite abaixo)",
        pos0: "Posição 0 (Soltas + Casas 1-4)", pos1: "1ª posição (Casas 1-4)", pos2: "2ª posição (Casas 2-5)", pos3: "3ª posição (Casas 3-6)", pos4: "4ª posição (Casas 4-7)", pos5: "5ª posição (Casas 5-8)", pos6: "6ª posição (Casas 6-9)", pos7: "7ª posição (Casas 7-10)", pos8: "8ª posição (Casas 8-11)", pos9: "9ª posição (Casas 9-12)", pos10: "10ª posição (Casas 10-13)", pos11: "11ª posição (Casas 11-14)", pos12: "12ª posição (Casas 12-15)",
        lowest: "Mais grave", highest: "Mais aguda", posHint: "No modo livre, as notas serão geradas dentro do limite definido acima, independentemente da posição no braço.",
        genMode: "Modo de Geração", gmRandom: "Aleatório", gmArps: "Arpejos", gmGroove: "Groove Repetitivo", gmScales: "Padrões de Escala", gmPedal: "Nota Pivô", gmHint: "Aleatório: notas sorteadas de acordo com a escala, alcance e limites de salto.",
        scalePat: "Padrão Escalar:", spThirds: "Em Terças (1-3, 2-4...)", spFourths: "Em Quartas (1-4, 2-5...)", spFifths: "Em Quintas (1-5, 2-6...)", spSixths: "Em Sextas (1-6, 2-7...)", spZigzag: "Zigue-Zague (1-2-3-4, 3-4-5-6...)", spGrp3: "Grupos de 3 (1-2-3, 2-3-4...)", spGrp4: "Grupos de 4 (1-2-3-4, 2-3-4-5...)", spArps: "Arpejos Diatônicos (1-3-5, 2-4-6...)", spHanon: "Padrão Hanon (1-3-2-4, 2-4-3-5...)",
        jumpLim: "Limite de Salto entre Notas", jumpHint: "Define a distância máxima permitida de uma nota para a próxima.",
        rhythmFigs: "Figuras Rítmicas", rhythmHint: "Ajuste o peso (chance de aparecer) de cada figura (0 a 100).",
        rfWhole: "Semibreve", rfHalf: "Mínima", rfQuarter: "Semínima", rfEighth: "Colcheia", rfSixteenth: "Semicolcheia", rfDotted: "Notas pontuadas", rfRests: "Pausas",
        tuplets: "Quiálteras", tupletHint: "Grupos irregulares condizentes com o compasso (0 a 100).",
        tpHalf: "Tercinas de Mínima", tpHemiola: "Duínas de Semínima (Hemiola)", tpQuarter: "Tercinas de Semínima", tpEighth: "Tercinas de Colcheia", tpSixteenth: "Sextinas de Semicolcheia", qpEighth: "Quintinas de Colcheia", qpSixteenth: "Quintinas de Semicolcheia", dpEighth: "Duínas de Colcheia", dpQuarter: "Duínas de Semínima", quadEighth: "Quartinas de Colcheia", compQSixteenth: "Quintinas de Semicolcheia",
        rcTitle: "Células Rítmicas Essenciais", rcHint: "Padrões fixos de 1 tempo. Aumente para treinar uma leitura específica.",
        rc1: "4 Semicolcheias", rc2: "1 Colcheia + 2 Semicolcheias", rc3: "2 Semicolcheias + 1 Colcheia", rc4: "1 Semicolcheia + 1 Colcheia + 1 Semicolcheia", rc5: "Colcheia Pontuada + Semicolcheia", rc6: "Semicolcheia + Colcheia Pontuada", rc7: "Pausa de Semicolcheia + 3 Semicolcheias", rc8: "Colcheia + Pausa de Semicolcheia + Semicolcheia",
        extra: "Extra", exTies: "Ligaduras de Valor (Síncopes)", exChrom: "Aproximação Cromática", exGhost: "Ghost Notes (X)", exStac: "Staccato",
        audioSettings: "Volume e Áudio", synthTimbre: "Timbre do Synth", waveSaw: "Onda Dente de Serra", waveSquare: "Onda Quadrada", waveSine: "Onda Senoidal", volClick: "Volume do Metrônomo", volSynth: "Volume do Sintetizador",
        bassStrings: "Cordas do Contrabaixo", bassHint: "Determina o desenho matemático das posições no braço.",
        btnStart: "Iniciar", btnStop: "Parar", btnPause: "Pausar", btnContinue: "Continuar", btnOpts: "Opções", btnCount: "Contagem", btnNoteAudio: "Som das Notas", btnClick: "Metrônomo",
        stsReady: "pronto", stsPaused: "pausado", stsCount: "contagem...", stsMeasure: "compasso",
        wel1: "Clique em", wel2: "ou pressione", space: "Espaço", wel3: "para gerar uma partitura!", welSub: 'Clique em "⚙️ Opções" para mexer nos detalhes.'
    },
    en: {
        appTitle: "Sight-Reading Practice",
        setGeneral: "General Settings", dispMode: "Display Mode", dispScroll: "Continuous Scroll", dispPage: "Static Page",
        linesPage: "Lines per Page", lines2: "2 Lines", lines3: "3 Lines", lines4: "4 Lines",
        timeSig: "Time Signature", tsOdd5: "5/4", tsOdd7: "7/4", tsComp68: "6/8", tsComp98: "9/8", tsComp128: "12/8", tsComp64: "6/4",
        clef: "Clef", clefBass: "Bass Clef", clefTreble: "Treble Clef", clefAlto: "Alto Clef", clefTenor: "Tenor Clef",
        key: "Key", pentaOnly: "Pentatonic Scale Only",
        extRange: "Note Range", position: "Position", posFree: "Free (use limits below)",
        pos0: "Position 0 (Open + Frets 1-4)", pos1: "1st Position (Frets 1-4)", pos2: "2nd Position (Frets 2-5)", pos3: "3rd Position (Frets 3-6)", pos4: "4th Position (Frets 4-7)", pos5: "5th Position (Frets 5-8)", pos6: "6th Position (Frets 6-9)", pos7: "7th Position (Frets 7-10)", pos8: "8th Position (Frets 8-11)", pos9: "9th Position (Frets 9-12)", pos10: "10th Position (Frets 10-13)", pos11: "11th Position (Frets 11-14)", pos12: "12th Position (Frets 12-15)",
        lowest: "Lowest", highest: "Highest", posHint: "In free mode, notes will be generated within the bounds above, regardless of fretboard position.",
        genMode: "Generation Mode", gmRandom: "Random", gmArps: "Arpeggios", gmGroove: "Repetitive Groove", gmScales: "Scale Patterns", gmPedal: "Pedal Point", gmHint: "Random: notes picked according to scale, range, and jump limits.",
        scalePat: "Scale Pattern:", spThirds: "In Thirds (1-3, 2-4...)", spFourths: "In Fourths (1-4, 2-5...)", spFifths: "In Fifths (1-5, 2-6...)", spSixths: "In Sixths (1-6, 2-7...)", spZigzag: "Zig-Zag (1-2-3-4, 3-4-5-6...)", spGrp3: "Groups of 3 (1-2-3, 2-3-4...)", spGrp4: "Groups of 4 (1-2-3-4, 2-3-4-5...)", spArps: "Diatonic Arps (1-3-5, 2-4-6...)", spHanon: "Hanon Pattern (1-3-2-4, 2-4-3-5...)",
        jumpLim: "Maximum Jump Interval", jumpHint: "Sets the maximum allowed distance from one note to the next.",
        rhythmFigs: "Rhythmic Figures", rhythmHint: "Adjust the weight (chance of appearing) of each figure (0 to 100).",
        rfWhole: "Whole Note", rfHalf: "Half Note", rfQuarter: "Quarter Note", rfEighth: "Eighth Note", rfSixteenth: "Sixteenth Note", rfDotted: "Dotted Notes", rfRests: "Rests",
        tuplets: "Tuplets", tupletHint: "Irregular groups matching the time signature (0 to 100).",
        tpHalf: "Half Note Triplets", tpHemiola: "Quarter Note Duplets (Hemiola)", tpQuarter: "Quarter Note Triplets", tpEighth: "Eighth Note Triplets", tpSixteenth: "16th Note Sextuplets", qpEighth: "Eighth Note Quintuplets", qpSixteenth: "16th Note Quintuplets", dpEighth: "Eighth Note Duplets", dpQuarter: "Quarter Note Duplets", quadEighth: "Eighth Note Quadruplets", compQSixteenth: "16th Note Quintuplets",
        rcTitle: "1-Beat Rhythm Cells", rcHint: "Fixed patterns (simple meters only).",
        rc1: "Four 16ths", rc2: "1 Eighth + Two 16ths", rc3: "Two 16ths + 1 Eighth", rc4: "1 16th + 1 Eighth + 1 16th", rc5: "Dotted Eighth + 1 16th", rc6: "1 16th + Dotted Eighth", rc7: "16th Rest + Three 16ths", rc8: "Eighth + 16th Rest + 16th",
        extra: "Extra", exTies: "Ties (Syncopation)", exChrom: "Chromatic Approach", exGhost: "Ghost Notes (X)", exStac: "Staccato",
        audioSettings: "Volume and Audio", synthTimbre: "Synth Timbre", waveSaw: "Sawtooth Wave", waveSquare: "Square Wave", waveSine: "Sine Wave", volClick: "Metronome Volume", volSynth: "Synth Volume",
        bassStrings: "Bass Strings", bassHint: "Determines the mathematical layout of positions on the fretboard.",
        btnStart: "Start", btnStop: "Stop", btnPause: "Pause", btnContinue: "Resume", btnOpts: "Options", btnCount: "Count-in", btnNoteAudio: "Note Sound", btnClick: "Metronome",
        stsReady: "ready", stsPaused: "paused", stsCount: "count-in...", stsMeasure: "measure",
        wel1: "Click", wel2: "or press", space: "Space", wel3: "to generate a score!", welSub: 'Click "⚙️ Options" to tweak the details.'
    },
    es: {
        appTitle: "Práctica de Lectura a Primera Vista",
        setGeneral: "Configuraciones Generales", dispMode: "Modo de Visualización", dispScroll: "Desplazamiento Continuo", dispPage: "Página Estática",
        linesPage: "Líneas por Página", lines2: "2 Líneas", lines3: "3 Líneas", lines4: "4 Líneas",
        timeSig: "Compás", tsOdd5: "5/4", tsOdd7: "7/4", tsComp68: "6/8", tsComp98: "9/8", tsComp128: "12/8", tsComp64: "6/4",
        clef: "Clave", clefBass: "Clave de Fa", clefTreble: "Clave de Sol", clefAlto: "Clave de Do en 3ª", clefTenor: "Clave de Do en 4ª",
        key: "Tonalidad", pentaOnly: "Solo Escala Pentatónica",
        extRange: "Rango de Notas", position: "Posición", posFree: "Libre (usar límites abajo)",
        pos0: "Posición 0 (Al aire + Trastes 1-4)", pos1: "1ª posición (Trastes 1-4)", pos2: "2ª posición (Trastes 2-5)", pos3: "3ª posición (Trastes 3-6)", pos4: "4ª posición (Trastes 4-7)", pos5: "5ª posición (Trastes 5-8)", pos6: "6ª posición (Trastes 6-9)", pos7: "7ª posición (Trastes 7-10)", pos8: "8ª posición (Trastes 8-11)", pos9: "9ª posición (Trastes 9-12)", pos10: "10ª posición (Trastes 10-13)", pos11: "11ª posición (Trastes 11-14)", pos12: "12ª posición (Trastes 12-15)",
        lowest: "Más grave", highest: "Más aguda", posHint: "En modo libre, las notas se generarán dentro de los límites anteriores, sin importar la posición en el mástil.",
        genMode: "Modo de Generación", gmRandom: "Aleatorio", gmArps: "Arpegios", gmGroove: "Groove Repetitivo", gmScales: "Patrones de Escala", gmPedal: "Nota Pedal", gmHint: "Aleatorio: notas elegidas según escala, rango y límites de salto.",
        scalePat: "Patrón de Escala:", spThirds: "En Terceras (1-3, 2-4...)", spFourths: "En Cuartas (1-4, 2-5...)", spFifths: "En Quintas (1-5, 2-6...)", spSixths: "En Sextas (1-6, 2-7...)", spZigzag: "Zig-Zag (1-2-3-4, 3-4-5-6...)", spGrp3: "Grupos de 3 (1-2-3, 2-3-4...)", spGrp4: "Grupos de 4 (1-2-3-4, 2-3-4-5...)", spArps: "Arpegios Diatónicos (1-3-5, 2-4-6...)", spHanon: "Patrón Hanon (1-3-2-4, 2-4-3-5...)",
        jumpLim: "Intervalo de Salto Máximo", jumpHint: "Define la distancia máxima permitida de una nota a la siguiente.",
        rhythmFigs: "Figuras Rítmicas", rhythmHint: "Ajuste el peso (probabilidad) de cada figura (0 a 100).",
        rfWhole: "Redonda", rfHalf: "Blanca", rfQuarter: "Negra", rfEighth: "Corchea", rfSixteenth: "Semicorchea", rfDotted: "Con puntillo", rfRests: "Silencios",
        tuplets: "Grupos Irregulares", tupletHint: "Grupos irregulares acorde al compás (0 a 100).",
        tpHalf: "Tresillos de Blanca", tpHemiola: "Dosillos de Negra (Hemiola)", tpQuarter: "Tresillos de Negra", tpEighth: "Tresillos de Corchea", tpSixteenth: "Seisillos de Semicorchea", qpEighth: "Quintillos de Corchea", qpSixteenth: "Quintillos de Semicorchea", dpEighth: "Dosillos de Corchea", dpQuarter: "Dosillos de Negra", quadEighth: "Cuatrillos de Corchea", compQSixteenth: "Quintillos de Semicorchea",
        rcTitle: "Células Rítmicas de 1 Tiempo", rcHint: "Patrones fijos (solo en compases simples).",
        rc1: "4 Semicorcheas", rc2: "1 Corchea + 2 Semicorcheas", rc3: "2 Semicorcheas + 1 Corchea", rc4: "1 Semi + 1 Corchea + 1 Semi", rc5: "Corchea con puntillo + Semi", rc6: "Semi + Corchea con puntillo", rc7: "Silencio Semi + 3 Semis", rc8: "Corchea + Silencio Semi + Semi",
        extra: "Extra", exTies: "Ligaduras (Síncopas)", exChrom: "Aproximación Cromática", exGhost: "Notas Fantasma (X)", exStac: "Staccato",
        audioSettings: "Volumen y Audio", synthTimbre: "Timbre del Synth", waveSaw: "Onda Diente de Sierra", waveSquare: "Onda Cuadrada", waveSine: "Onda Senoidal", volClick: "Volumen del Metrónomo", volSynth: "Volumen del Sintetizador",
        bassStrings: "Cuerdas del Bajo", bassHint: "Determina el diseño matemático de las posiciones en el mástil.",
        btnStart: "Iniciar", btnStop: "Parar", btnPause: "Pausar", btnContinue: "Continuar", btnOpts: "Opciones", btnCount: "Cuenta atrás", btnNoteAudio: "Sonido de Notas", btnClick: "Metrónomo",
        stsReady: "listo", stsPaused: "pausado", stsCount: "cuenta...", stsMeasure: "compás",
        wel1: "Haz clic en", wel2: "o presiona", space: "Espacio", wel3: "para generar la partitura!", welSub: 'Haz clic en "⚙️ Opciones" para ajustar los detalles.'
    }
};

let currentLang = 'pt';

function updateLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (DICTIONARY[lang][key]) {
            el.innerHTML = DICTIONARY[lang][key];
        }
    });
    
    const keySel = document.getElementById('keySelect');
    if (keySel) {
        Array.from(keySel.options).forEach(opt => {
            const kInfo = KEYS.find(k => k.id === opt.value);
            if (kInfo) opt.textContent = getLocalizedKeyName(kInfo);
        });
    }
    
    updatePositionDescriptions();
    updatePlayButtonUI();
    
    const stEl = document.getElementById('status');
    if (stEl) {
        if (!state.playing) stEl.textContent = DICTIONARY[currentLang].stsReady;
        else if (state.paused) stEl.textContent = DICTIONARY[currentLang].stsPaused;
    }
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.Vex && window.Vex.Flow) {
      initApp();
  } else {
      document.getElementById('welcome-screen').innerHTML =
          '<h2 style="color:var(--red)">Erro: vexflow.js não encontrado. Certifique-se de que baixou o arquivo e colocou na mesma pasta.</h2>';
  }
});

function initApp(){

const langSelect = document.getElementById('langSelect');
if(langSelect) {
    langSelect.addEventListener('change', e => updateLanguage(e.target.value));
}

/**
 * ==========================================================================
 * MÓDULO 3: CONSTANTES GLOBAIS DE ENGRAVING E TEORIA MUSICAL
 * ==========================================================================
 */
const SCALE = 1.5; 
window.LOGICAL_PX_PER_QUARTER = 95; // Disponível globalmente 
window.PX_PER_QUARTER = window.LOGICAL_PX_PER_QUARTER * SCALE;

const METERS = {
    '4/4': { numBeats: 4, beatValue: 4, isCompound: false, totalQuarters: 4.0, pulse: 1.0 },
    '3/4': { numBeats: 3, beatValue: 4, isCompound: false, totalQuarters: 3.0, pulse: 1.0 },
    '2/4': { numBeats: 2, beatValue: 4, isCompound: false, totalQuarters: 2.0, pulse: 1.0 },
    '5/4': { numBeats: 5, beatValue: 4, isCompound: false, totalQuarters: 5.0, pulse: 1.0 },
    '7/4': { numBeats: 7, beatValue: 4, isCompound: false, totalQuarters: 7.0, pulse: 1.0 },
    '6/8': { numBeats: 6, beatValue: 8, isCompound: true,  totalQuarters: 3.0, pulse: 1.5 },
    '9/8': { numBeats: 9, beatValue: 8, isCompound: true,  totalQuarters: 4.5, pulse: 1.5 },
    '12/8':{ numBeats: 12, beatValue: 8, isCompound: true,  totalQuarters: 6.0, pulse: 1.5 },
    '6/4': { numBeats: 6, beatValue: 4, isCompound: true,  totalQuarters: 6.0, pulse: 3.0 }
};

const MEASURES_PER_BLOCK = 4; 

const OPEN_STRING_MIDI = { B:23, E:28, A:33, D:38, G:43, C:48 }; 
const STRING_ORDER = ['B','E','A','D','G','C']; 
const MAX_FRET = 24;

const LETTERS = ['C','D','E','F','G','A','B']; 
const LETTER_PC = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const MAJOR_STEPS = [0,2,4,5,7,9,11]; 
const MINOR_STEPS = [0,2,3,5,7,8,10];
const MAJOR_PENTA_STEPS = [0,2,4,7,9]; 
const MINOR_PENTA_STEPS = [0,3,5,7,10];

const KEYS = [
  { id: 'C-maj', vexKey: 'C', relMajor: 'C', rootPc: 0, isMinor: false, 
    names: {pt: 'C Maior', en: 'C Major', es: 'C Mayor'} },
  { id: 'G-maj', vexKey: 'G', relMajor: 'G', rootPc: 7, isMinor: false,
    names: {pt: 'G Maior', en: 'G Major', es: 'G Mayor'} },
  { id: 'D-maj', vexKey: 'D', relMajor: 'D', rootPc: 2, isMinor: false,
    names: {pt: 'D Maior', en: 'D Major', es: 'D Mayor'} },
  { id: 'A-maj', vexKey: 'A', relMajor: 'A', rootPc: 9, isMinor: false,
    names: {pt: 'A Maior', en: 'A Major', es: 'A Mayor'} },
  { id: 'E-maj', vexKey: 'E', relMajor: 'E', rootPc: 4, isMinor: false,
    names: {pt: 'E Maior', en: 'E Major', es: 'E Mayor'} },
  { id: 'B-maj', vexKey: 'B', relMajor: 'B', rootPc: 11, isMinor: false,
    names: {pt: 'B Maior', en: 'B Major', es: 'B Mayor'} },
  { id: 'F#-maj', vexKey: 'F#', relMajor: 'F#', rootPc: 6, isMinor: false,
    names: {pt: 'F# Maior', en: 'F# Major', es: 'F# Mayor'} },
  { id: 'F-maj', vexKey: 'F', relMajor: 'F', rootPc: 5, isMinor: false,
    names: {pt: 'F Maior', en: 'F Major', es: 'F Mayor'} },
  { id: 'Bb-maj', vexKey: 'Bb', relMajor: 'Bb', rootPc: 10, isMinor: false,
    names: {pt: 'Bb Maior', en: 'Bb Major', es: 'Bb Mayor'} },
  { id: 'Eb-maj', vexKey: 'Eb', relMajor: 'Eb', rootPc: 3, isMinor: false,
    names: {pt: 'Eb Maior', en: 'Eb Major', es: 'Eb Mayor'} },
  { id: 'Ab-maj', vexKey: 'Ab', relMajor: 'Ab', rootPc: 8, isMinor: false,
    names: {pt: 'Ab Maior', en: 'Ab Major', es: 'Ab Mayor'} },
  { id: 'Db-maj', vexKey: 'Db', relMajor: 'Db', rootPc: 1, isMinor: false,
    names: {pt: 'Db Maior', en: 'Db Major', es: 'Db Mayor'} },
  { id: 'Gb-maj', vexKey: 'Gb', relMajor: 'Gb', rootPc: 6, isMinor: false,
    names: {pt: 'Gb Maior', en: 'Gb Major', es: 'Gb Mayor'} },

  { id: 'A-min', vexKey: 'Am', relMajor: 'C', rootPc: 9, isMinor: true,
    names: {pt: 'A menor', en: 'A minor', es: 'A menor'} },
  { id: 'E-min', vexKey: 'Em', relMajor: 'G', rootPc: 4, isMinor: true,
    names: {pt: 'E menor', en: 'E minor', es: 'E menor'} },
  { id: 'B-min', vexKey: 'Bm', relMajor: 'D', rootPc: 11, isMinor: true,
    names: {pt: 'B menor', en: 'B minor', es: 'B menor'} },
  { id: 'F#-min', vexKey: 'F#m', relMajor: 'A', rootPc: 6, isMinor: true,
    names: {pt: 'F# menor', en: 'F# minor', es: 'F# menor'} },
  { id: 'C#-min', vexKey: 'C#m', relMajor: 'E', rootPc: 1, isMinor: true,
    names: {pt: 'C# menor', en: 'C# minor', es: 'C# menor'} },
  { id: 'G#-min', vexKey: 'G#m', relMajor: 'B', rootPc: 8, isMinor: true,
    names: {pt: 'G# menor', en: 'G# minor', es: 'G# menor'} },
  { id: 'D#-min', vexKey: 'D#m', relMajor: 'F#', rootPc: 3, isMinor: true,
    names: {pt: 'D# menor', en: 'D# minor', es: 'D# menor'} },
  { id: 'D-min', vexKey: 'Dm', relMajor: 'F', rootPc: 2, isMinor: true,
    names: {pt: 'D menor', en: 'D minor', es: 'D menor'} },
  { id: 'G-min', vexKey: 'Gm', relMajor: 'Bb', rootPc: 7, isMinor: true,
    names: {pt: 'G menor', en: 'G minor', es: 'G menor'} },
  { id: 'C-min', vexKey: 'Cm', relMajor: 'Eb', rootPc: 0, isMinor: true,
    names: {pt: 'C menor', en: 'C minor', es: 'C menor'} },
  { id: 'F-min', vexKey: 'Fm', relMajor: 'Ab', rootPc: 5, isMinor: true,
    names: {pt: 'F menor', en: 'F minor', es: 'F menor'} },
  { id: 'Bb-min', vexKey: 'Bbm', relMajor: 'Db', rootPc: 10, isMinor: true,
    names: {pt: 'Bb menor', en: 'Bb minor', es: 'Bb menor'} },
  { id: 'Eb-min', vexKey: 'Ebm', relMajor: 'Gb', rootPc: 3, isMinor: true,
    names: {pt: 'Eb menor', en: 'Eb minor', es: 'Eb menor'} }
];

function getLocalizedKeyName(k) { return k.names[currentLang] || k.names.pt; }

function parseTonic(name){ 
    const letter = name[0]; 
    const acc = name.length > 1 ? (name[1] === '#' ? 1 : -1) : 0; 
    return { letter, pc: (LETTER_PC[letter] + acc + 12) % 12 }; 
}

function buildMajorSpelling(tonicName){
  const { letter, pc: tonicPc } = parseTonic(tonicName); 
  const i0 = LETTERS.indexOf(letter); 
  const table = new Array(12).fill(null);
  for(let d=0; d<7; d++){ 
      const letterChar = LETTERS[(i0+d)%7]; 
      const naturalPc = LETTER_PC[letterChar]; 
      const desiredPc = (tonicPc + MAJOR_STEPS[d]) % 12; 
      let acc = ((desiredPc - naturalPc + 18) % 12) - 6; 
      table[desiredPc] = { letter: letterChar, acc }; 
  }
  for(let pc=0; pc<12; pc++){ 
      if(!table[pc]){ 
          const below = table[(pc - 1 + 12) % 12]; 
          table[pc] = { letter: below.letter, acc: below.acc + 1 }; 
      } 
  }
  return table;
}

const UNIQUE_MAJORS = ['C','G','D','A','E','B','F#','F','Bb','Eb','Ab','Db','Gb'];
const SPELLINGS = {}; 
for (let tonic of UNIQUE_MAJORS) { SPELLINGS[tonic] = buildMajorSpelling(tonic); }

function accToStr(acc){ return acc===0?'':acc===1?'#':acc===2?'##':acc===-1?'b':acc===-2?'bb':''; }

function midiToVexKey(midi){
  const relMajor = state.keyInfo.relMajor; 
  const pc = ((midi % 12) + 12) % 12;
  const entry = SPELLINGS[relMajor][pc];
  let octave = Math.floor(midi / 12);
  if (pc === 0 && entry.letter === 'B') octave -= 1; 
  if (pc === 11 && entry.letter === 'C') octave += 1; 

  return { key: `${entry.letter.toLowerCase()}${accToStr(entry.acc)}/${octave}`, letter: entry.letter, acc: entry.acc };
}

function restKeyForClef(clef) {
    if (clef === 'treble') return 'b/4';
    if (clef === 'alto') return 'c/4';
    if (clef === 'tenor') return 'a/3';
    return 'd/3'; 
}

function getCenterMidiForClef(clef) {
    if (clef === 'treble') return 71; 
    if (clef === 'alto') return 60;   
    if (clef === 'tenor') return 57;  
    return 50; 
}

function diatonicPitchClasses() {
    const steps = state.keyInfo.isMinor ? MINOR_STEPS : MAJOR_STEPS;
    return steps.map(s => (state.keyInfo.rootPc + s) % 12);
}

function getChordSymbol(degree) {
    const suffixMaj = ["", "m", "m", "maj7", "7", "m", "dim"];
    const suffixMin = ["m", "dim", "maj7", "m", "m", "maj7", "7"];
    const suffix = state.keyInfo.isMinor ? suffixMin[degree] : suffixMaj[degree];
    const chordRootPc = diatonicPitchClasses()[degree]; 
    const rootSpell = SPELLINGS[state.keyInfo.relMajor][chordRootPc];
    return rootSpell.letter.toUpperCase() + accToStr(rootSpell.acc) + suffix;
}

function scalePitchClasses(){ 
    const steps = state.pentatonic ? 
        (state.keyInfo.isMinor ? MINOR_PENTA_STEPS : MAJOR_PENTA_STEPS) : 
        (state.keyInfo.isMinor ? MINOR_STEPS : MAJOR_STEPS);
    return steps.map(s => (state.keyInfo.rootPc + s) % 12); 
}
function scaleSemitones() { return state.keyInfo.isMinor ? MINOR_STEPS : MAJOR_STEPS; }

/**
 * ==========================================================================
 * MÓDULO 4: ESTADO DA APLICAÇÃO (CÉREBRO)
 * ==========================================================================
 */
const state = {
  bpm: 60, countIn: true, noteAudio: true, clickAudio: true,
  volClick: 1.0, volSynth: 0.5, instrument: 'sawtooth',
  displayMode: 'scroll', pageLines: 2,
  timeSig: '4/4',
  keyInfo: KEYS[0], clef: 'bass', pentatonic: false, 
  positionMode: 'free', lowMidi: 28, highMidi: 48, strings: new Set(['E','A','D','G']), maxIntervalSemis: 12, 
  
  rhythms: { whole: 0, half: 0, quarter: 100, eighth: 0, sixteenth: 0, dotted: 0 },
  tuplets: { tHalf: 0, dHemiola: 0, tQuarter: 0, qEighth: 0, tEighth: 0, qSixteenth: 0, tSixteenth: 0, dQuarter: 0, dEighth: 0, quadEighth: 0, compQSixteenth: 0 },
  rhythmCells: {
      c1_four16: 0, c2_8_16_16: 0, c3_16_16_8: 0, c4_16_8_16: 0, 
      c5_dot8_16: 0, c6_16_dot8: 0, c7_r16_three16: 0, c8_8_r16_16: 0, c9_tripletQE: 0,
  },
  probs: { rests: 0.05, ties: 0.0, chromatic: 0.0, ghost: 0.0, staccato: 0.0 },
  genMode: 'random', seqPattern: 'thirds',
  playing: false, paused: false, pauseTime: 0
};

/**
 * ==========================================================================
 * MÓDULO 5: CONTROLES DA INTERFACE DO USUÁRIO E ATUALIZAÇÕES VISUAIS
 * ==========================================================================
 */
function safeAddListener(id, eventType, callback) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(eventType, callback);
}

safeAddListener('openSettingsBtn', 'click', () => toggleSettings(true));
safeAddListener('closeSettingsBtn', 'click', () => toggleSettings(false));
safeAddListener('settings-overlay', 'click', () => toggleSettings(false));

function toggleSettings(show) {
  const ov = document.getElementById('settings-overlay'), p = document.getElementById('settings');
  if(ov && p) {
      if(show) { ov.classList.add('open'); p.classList.add('open'); } 
      else { ov.classList.remove('open'); p.classList.remove('open'); }
  }
}

function handleViewChange() {
    cachedPageScale = 0; 
    stopPlayback();
    clearTrack();
    ensureBuffer(0);
    resetPlayhead();
}

function updateRhythmUI() {
    const ts = state.timeSig;
    const meter = METERS[ts];
    const isComp = meter.isCompound;
    
    const rcFieldset = document.getElementById('rhythmCellsFieldset');
    if (rcFieldset) rcFieldset.style.display = isComp ? 'none' : 'block';

    const ids = ['wrap_tHalf', 'wrap_dHemiola', 'wrap_tQuarter', 'wrap_qEighth', 'wrap_tEighth', 'wrap_qSixteenth', 'wrap_tSixteenth', 'wrap_dQuarter', 'wrap_dEighth', 'wrap_quadEighth', 'wrap_compQSixteenth'];
    const els = {};
    ids.forEach(id => els[id] = document.getElementById(id));

    if (isComp) {
        ['wrap_tHalf', 'wrap_dHemiola', 'wrap_tQuarter', 'wrap_qEighth', 'wrap_tEighth', 'wrap_qSixteenth', 'wrap_tSixteenth'].forEach(id => els[id] && (els[id].style.display = 'none'));
        
        if (els.wrap_dEighth) els.wrap_dEighth.style.display = 'block';
        if (els.wrap_quadEighth) els.wrap_quadEighth.style.display = 'block';
        if (els.wrap_compQSixteenth) els.wrap_compQSixteenth.style.display = 'block';

        if (meter.totalQuarters >= 3.0) { 
            if (els.wrap_dQuarter) els.wrap_dQuarter.style.display = 'block';
        } else {
            if (els.wrap_dQuarter) els.wrap_dQuarter.style.display = 'none';
        }
    } else {
        ['wrap_dQuarter', 'wrap_dEighth', 'wrap_quadEighth', 'wrap_compQSixteenth'].forEach(id => els[id] && (els[id].style.display = 'none'));
        
        if (els.wrap_tEighth) els.wrap_tEighth.style.display = 'block';
        if (els.wrap_qSixteenth) els.wrap_qSixteenth.style.display = 'block';
        if (els.wrap_tSixteenth) els.wrap_tSixteenth.style.display = 'block';
        
        if (meter.totalQuarters >= 2.0) {
            if (els.wrap_tQuarter) els.wrap_tQuarter.style.display = 'block';
            if (els.wrap_qEighth) els.wrap_qEighth.style.display = 'block';
        } else {
            if (els.wrap_tQuarter) els.wrap_tQuarter.style.display = 'none';
            if (els.wrap_qEighth) els.wrap_qEighth.style.display = 'none';
        }

        if (meter.totalQuarters >= 3.0) {
            if (els.wrap_dHemiola) els.wrap_dHemiola.style.display = 'block';
        } else {
            if (els.wrap_dHemiola) els.wrap_dHemiola.style.display = 'none';
        }

        if (meter.totalQuarters >= 4.0) {
            if (els.wrap_tHalf) els.wrap_tHalf.style.display = 'block';
        } else {
            if (els.wrap_tHalf) els.wrap_tHalf.style.display = 'none';
        }
    }
}

safeAddListener('displayMode', 'change', e => { 
    state.displayMode = e.target.value; 
    const wrap = document.getElementById('score-wrap');
    const plRow = document.getElementById('pageLinesRow');
    if (state.displayMode === 'page') {
        wrap.classList.add('page-mode');
        wrap.classList.add(`lines-${state.pageLines}`);
        if(plRow) plRow.style.display = 'flex';
    } else {
        wrap.classList.remove('page-mode', 'lines-2', 'lines-3', 'lines-4');
        if(plRow) plRow.style.display = 'none';
    }
    handleViewChange();
});

safeAddListener('pageLinesSelect', 'change', e => {
    state.pageLines = parseInt(e.target.value, 10);
    const wrap = document.getElementById('score-wrap');
    wrap.classList.remove('lines-2', 'lines-3', 'lines-4');
    if (state.displayMode === 'page') {
        wrap.classList.add(`lines-${state.pageLines}`);
    }
    handleViewChange();
});

safeAddListener('timeSigSelect', 'change', e => {
    state.timeSig = e.target.value;
    updateRhythmUI();
    renderClefPanel();
    handleViewChange();
});

const keySelect = document.getElementById('keySelect');
if (keySelect) {
    KEYS.forEach(k => {
        let o = document.createElement('option'); o.value = k.id; o.textContent = getLocalizedKeyName(k); keySelect.appendChild(o);
    });
    keySelect.addEventListener('change', (e) => { 
        state.keyInfo = KEYS.find(k => k.id === e.target.value); 
        renderClefPanel(); 
        updatePositionDescriptions();
    });
}

const NOTE_LABELS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const lowSel = document.getElementById('lowNote'), highSel = document.getElementById('highNote');

function updateNoteRangesForClef() {
    const ranges = {
        'bass': { min: 23, max: 72 },   
        'treble': { min: 40, max: 108 }, 
        'alto': { min: 36, max: 84 },   
        'tenor': { min: 36, max: 84 }   
    };
    const range = ranges[state.clef] || ranges['bass'];
    
    if (lowSel && highSel) {
        lowSel.innerHTML = ''; highSel.innerHTML = '';
        for(let m = range.min; m <= range.max; m++) {
            const l = `${NOTE_LABELS[((m%12)+12)%12]}${Math.floor(m/12)-1}`;
            let o1 = document.createElement('option'); o1.value=m; o1.textContent=l; lowSel.appendChild(o1);
            let o2 = document.createElement('option'); o2.value=m; o2.textContent=l; highSel.appendChild(o2);
        }
        
        state.lowMidi = Math.max(range.min, Math.min(state.lowMidi, range.max));
        state.highMidi = Math.max(range.min, Math.min(state.highMidi, range.max));
        lowSel.value = state.lowMidi;
        highSel.value = state.highMidi;
    }
    
    const isBass = state.clef === 'bass';
    const fieldset = document.getElementById('stringsFieldset');
    const posMode = document.getElementById('positionMode');
    
    if (fieldset) fieldset.style.display = isBass ? 'block' : 'none';
    if (!isBass) {
        state.positionMode = 'free';
        if (posMode) { posMode.value = 'free'; posMode.disabled = true; }
    } else {
        if (posMode) posMode.disabled = false;
    }
    renderClefPanel();
}

function getNoteLabel(midi) {
    if (!state.keyInfo) return '';
    const pc = ((midi % 12) + 12) % 12;
    const spelling = SPELLINGS[state.keyInfo.relMajor][pc];
    let octave = Math.floor(midi / 12) - 1;
    if (pc === 0 && spelling.letter === 'B') octave -= 1;
    if (pc === 11 && spelling.letter === 'C') octave += 1;
    return spelling.letter + accToStr(spelling.acc) + octave;
}

function updatePositionDescriptions() {
    const select = document.getElementById('positionMode');
    if (!select) return;
    
    const activeStrings = STRING_ORDER.filter(s => state.strings.has(s));
    
    Array.from(select.options).forEach(opt => {
        if (opt.value === 'free') {
            opt.title = currentLang === 'pt' ? 'Usa os limites exatos configurados na Extensão de Notas.' : 
                        currentLang === 'es' ? 'Usa los límites exactos configurados abajo.' : 
                        'Uses the exact bounds configured below.';
            return;
        }
        
        if (activeStrings.length === 0) {
            opt.title = currentLang === 'pt' ? 'Nenhuma corda selecionada.' : 
                        currentLang === 'es' ? 'Ninguna cuerda seleccionada.' : 
                        'No string selected.';
            return;
        }
        
        const pos = parseInt(opt.value, 10);
        const pool = new Set();
        for(const s of activeStrings){
            if (pos === 0) pool.add(OPEN_STRING_MIDI[s]); 
            const startFret = pos === 0 ? 1 : pos;
            for(let fret = startFret; fret <= startFret + 3; fret++) pool.add(OPEN_STRING_MIDI[s] + fret);
        }
        
        const diatonicPcs = new Set(scalePitchClasses());
        const filteredPool = Array.from(pool).filter(m => diatonicPcs.has(((m%12)+12)%12)).sort((a,b)=>a-b);
        
        if (filteredPool.length > 0) {
            const lowest = filteredPool[0];
            const highest = filteredPool[filteredPool.length - 1];
            
            let tPref = 'Notas da tonalidade nesta posição:';
            if (currentLang === 'en') tPref = 'Key notes in this position:';
            if (currentLang === 'es') tPref = 'Notas de la tonalidad en esta posición:';
            
            opt.title = `${tPref} ${getNoteLabel(lowest)} - ${getNoteLabel(highest)}`;
        } else {
            opt.title = currentLang === 'pt' ? 'Nenhuma nota disponível.' : 
                        currentLang === 'es' ? 'Ninguna nota disponible.' : 
                        'No notes available.';
        }
    });
}

safeAddListener('clefSelect', 'change', (e) => { 
    state.clef = e.target.value; 
    updateNoteRangesForClef();
});
updateNoteRangesForClef();

if (lowSel) lowSel.addEventListener('change', () => state.lowMidi = parseInt(lowSel.value,10));
if (highSel) highSel.addEventListener('change', () => state.highMidi = parseInt(highSel.value,10));

safeAddListener('synthSoundSelect', 'change', e => {
    state.instrument = e.target.value;
});

function syncProb(id, stateKey, lblId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        state.probs[stateKey] = parseInt(el.value, 10) / 100;
        const lbl = document.getElementById(lblId);
        if (lbl) lbl.textContent = el.value + '%';
    });
}
syncProb('probRest', 'rests', 'lblProbRest');
syncProb('probTie', 'ties', 'lblProbTie');
syncProb('probChromatic', 'chromatic', 'lblProbChromatic');
syncProb('probGhost', 'ghost', 'lblProbGhost');
syncProb('probStaccato', 'staccato', 'lblProbStaccato');

function syncWeight(id, stateObj, stateKey, lblId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        stateObj[stateKey] = parseInt(el.value, 10);
        const lbl = document.getElementById(lblId);
        if (lbl) lbl.textContent = el.value;
    });
}
syncWeight('wWhole', state.rhythms, 'whole', 'lblWWhole');
syncWeight('wHalf', state.rhythms, 'half', 'lblWHalf');
syncWeight('wQuarter', state.rhythms, 'quarter', 'lblWQuarter');
syncWeight('wEighth', state.rhythms, 'eighth', 'lblWEighth');
syncWeight('wSixteenth', state.rhythms, 'sixteenth', 'lblWSixteenth');
syncWeight('wDotted', state.rhythms, 'dotted', 'lblWDotted');

syncWeight('w_tHalf', state.tuplets, 'tHalf', 'lblTHalf');
syncWeight('w_dHemiola', state.tuplets, 'dHemiola', 'lblDHemiola');
syncWeight('w_tQuarter', state.tuplets, 'tQuarter', 'lblTQuarter');
syncWeight('w_qEighth', state.tuplets, 'qEighth', 'lblQEighth');
syncWeight('w_tEighth', state.tuplets, 'tEighth', 'lblTEighth');
syncWeight('w_qSixteenth', state.tuplets, 'qSixteenth', 'lblQSixteenth');
syncWeight('w_tSixteenth', state.tuplets, 'tSixteenth', 'lblTSixteenth');
syncWeight('w_dQuarter', state.tuplets, 'dQuarter', 'lblDQuarter');
syncWeight('w_dEighth', state.tuplets, 'dEighth', 'lblDEighth');
syncWeight('w_quadEighth', state.tuplets, 'quadEighth', 'lblQuadEighth');
syncWeight('w_compQSixteenth', state.tuplets, 'compQSixteenth', 'lblCompQSixteenth');

syncWeight('w_c1', state.rhythmCells, 'c1_four16', 'lblC1');
syncWeight('w_c2', state.rhythmCells, 'c2_8_16_16', 'lblC2');
syncWeight('w_c3', state.rhythmCells, 'c3_16_16_8', 'lblC3');
syncWeight('w_c4', state.rhythmCells, 'c4_16_8_16', 'lblC4');
syncWeight('w_c5', state.rhythmCells, 'c5_dot8_16', 'lblC5');
syncWeight('w_c6', state.rhythmCells, 'c6_16_dot8', 'lblC6');
syncWeight('w_c7', state.rhythmCells, 'c7_r16_three16', 'lblC7');
syncWeight('w_c8', state.rhythmCells, 'c8_8_r16_16', 'lblC8');

function syncVolume(id, stateKey, lblId) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
        state[stateKey] = parseInt(el.value, 10) / 100;
        const lbl = document.getElementById(lblId);
        if (lbl) lbl.textContent = el.value + '%';
    });
}
syncVolume('volClick', 'volClick', 'lblVolClick');
syncVolume('volSynth', 'volSynth', 'lblVolSynth');

safeAddListener('pentaToggle', 'change', e => {
    state.pentatonic = e.target.checked;
    updatePositionDescriptions();
});

const positionModeSel = document.getElementById('positionMode'), rangeRow = document.getElementById('rangeRow');
if (positionModeSel && rangeRow) {
    positionModeSel.addEventListener('change', () => {
      state.positionMode = positionModeSel.value;
      rangeRow.style.opacity = state.positionMode === 'free' ? '1' : '.4'; rangeRow.style.pointerEvents = state.positionMode === 'free' ? 'auto' : 'none';
    });
}

safeAddListener('stringsRow', 'click', e => {
  const p = e.target.closest('.pill'); if(!p) return; const s = p.dataset.string;
  if(state.strings.has(s)){ state.strings.delete(s); p.classList.remove('active'); } else { state.strings.add(s); p.classList.add('active'); }
  updatePositionDescriptions();
});

const intervalsData = [
    { semi: 2, label: '2ª (1 tom)' }, { semi: 4, label: '3ª (Maior/menor)' }, { semi: 5, label: '4ª (Justa)' },
    { semi: 7, label: '5ª (Justa)' }, { semi: 9, label: '6ª (Maior/menor)' }, { semi: 11, label: '7ª (Maior/menor)' },
    { semi: 12, label: '8ª (Oitava)' }, { semi: 14, label: '9ª (Oitava + 2ª)' }, { semi: 16, label: '10ª (Oitava + 3ª)' },
    { semi: 17, label: '11ª (Oitava + 4ª)' }, { semi: 19, label: '12ª (Oitava + 5ª)' }, { semi: 21, label: '13ª (Oitava + 6ª)' },
    { semi: 23, label: '14ª (Oitava + 7ª)' }, { semi: 24, label: '15ª (Dupla Oitava)' }
];
const intervalSlider = document.getElementById('intervalSlider'); 
if (intervalSlider) {
    const lbl = document.getElementById('intervalLabel');
    intervalSlider.addEventListener('input', () => { 
        state.maxIntervalSemis = intervalsData[intervalSlider.value].semi; 
        if (lbl) {
            let pfix = currentLang==='pt'?'Máximo:':currentLang==='es'?'Máximo:':'Max:';
            let txt = intervalsData[intervalSlider.value].label;
            if (currentLang==='en') txt = txt.replace('Oitava','Octave').replace('Maior/menor','Major/minor').replace('Justa','Perfect');
            if (currentLang==='es') txt = txt.replace('Oitava','Octava').replace('Maior/menor','Mayor/menor').replace('Justa','Justa');
            lbl.textContent = pfix + ' ' + txt; 
        }
    });
}

let cachedPageScale = 0;
let cachedClefWidth = 0;

function getBeatsPerPage() {
    return MEASURES_PER_BLOCK * METERS[state.timeSig].totalQuarters;
}

function updatePageScale() {
    if (state.displayMode === 'page' && measures.length > 0) {
        const activeM = measures.find(m => m.wrapper.classList.contains('visible')) || measures[0];
        if (activeM && activeM.div) {
            const renderedWidth = activeM.div.getBoundingClientRect().width;
            const measurePx = METERS[state.timeSig].totalQuarters * window.LOGICAL_PX_PER_QUARTER;
            const originalSvgWidth = (measurePx * MEASURES_PER_BLOCK + 20) * SCALE;
            if (renderedWidth > 0) {
                cachedPageScale = renderedWidth / originalSvgWidth;
                const clefDiv = activeM.wrapper.querySelector('.inline-clef');
                cachedClefWidth = clefDiv ? clefDiv.getBoundingClientRect().width : 0;
            }
        }
    }
}

window.addEventListener('resize', () => { 
    cachedPageScale = 0; 
    if (state.displayMode === 'page' && (state.playing || state.paused)) {
        requestAnimationFrame(() => {
            updatePlayheadPosition(Math.max(0, getBeatFromTime(audioCtx ? audioCtx.currentTime : 0)));
        });
    }
});

function redrawTrackAfterThemeChange() {
    if (!state.playing) {
        clearTrack();
        ensureBuffer(0);
    } else {
        const oldMeasures = [...measures];
        measures = [];
        if (scoreScroll) scoreScroll.innerHTML = '';
        oldMeasures.forEach(m => {
            const wrapper = document.createElement('div');
            wrapper.className = 'block-wrapper';
            
            if (state.displayMode === 'page') {
                const bpp = getBeatsPerPage();
                const blockIndex = Math.floor(m.startBeat / bpp);
                wrapper.classList.add('row-' + (blockIndex % state.pageLines));
                if (m.startBeat < bpp * state.pageLines) {
                    wrapper.classList.add('visible');
                }
            }
            
            const fadeSecs = 4 * (60 / state.bpm); 
            wrapper.style.transition = `opacity ${fadeSecs}s ease-in-out`;
            
            const clefDiv = document.createElement('div');
            clefDiv.className = 'inline-clef';
            renderInlineClef(clefDiv);
            
            const div = document.createElement('div');
            div.className = 'measure';
            
            wrapper.appendChild(clefDiv);
            wrapper.appendChild(div);
            
            wrapper.style.left = m.leftPx + 'px';
            if (scoreScroll) scoreScroll.appendChild(wrapper);
            
            m.wrapper._blockEventsData ? renderBlockSVG(div, m.wrapper._blockEventsData) : stopPlayback();
            
            wrapper._blockEventsData = m.wrapper._blockEventsData;
            m.wrapper = wrapper;
            m.div = div;
            measures.push(m);
        });
        
        updatePageVisibility(Math.max(0, getBeatFromTime(audioCtx ? audioCtx.currentTime : 0)));
        updatePlayheadPosition(Math.max(0, getBeatFromTime(audioCtx ? audioCtx.currentTime : 0)));
    }
}

safeAddListener('themeToggle', 'click', () => {
  const btn = document.getElementById('themeToggle');
  if(document.documentElement.getAttribute('data-theme') === 'light'){ 
      document.documentElement.removeAttribute('data-theme'); if(btn) btn.textContent = '☀️'; 
  } else { 
      document.documentElement.setAttribute('data-theme', 'light'); if(btn) btn.textContent = '🌙'; 
  }
  renderClefPanel(); 
  redrawTrackAfterThemeChange();
});

safeAddListener('genMode', 'change', e => { 
  state.genMode = e.target.value; grooveState.pattern = null; grooveState.measureInCycle = 0; 
  const seq = document.getElementById('sequencesOpts');
  if (seq) seq.style.display = state.genMode === 'sequences' ? 'flex' : 'none';
});
safeAddListener('seqPattern', 'change', e => state.seqPattern = e.target.value);

/**
 * ==========================================================================
 * MÓDULO 6: MATEMÁTICA DA GERAÇÃO DE NOTAS E PADRÕES
 * ==========================================================================
 */
function computePitchPool(){
  const pool = new Set();
  
  if(state.positionMode !== 'free' && state.clef === 'bass'){
    const activeStrings = STRING_ORDER.filter(s => state.strings.has(s));
    if(activeStrings.length > 0){
        const pos = parseInt(state.positionMode, 10);
        for(const s of activeStrings){
          if (pos === 0) pool.add(OPEN_STRING_MIDI[s]); 
          const startFret = pos === 0 ? 1 : pos;
          for(let fret = startFret; fret <= startFret + 3; fret++) pool.add(OPEN_STRING_MIDI[s] + fret);
        }
    }
  } else {
    for(let m = state.lowMidi; m <= state.highMidi; m++) pool.add(m);
  }
  
  return Array.from(pool).sort((a,b)=>a-b);
}

function diatonicFilter(pool){ 
    const sPcs = new Set(scalePitchClasses()); 
    return pool.filter(m => sPcs.has(((m%12)+12)%12)); 
}

function pickNextPitch(pool, prevMidi){
  if(pool.length === 0) return null;
  const diatonic = diatonicFilter(pool);
  
  let candidates = diatonic.length ? diatonic : pool;
  if(prevMidi == null) return candidates[Math.floor(Math.random()*candidates.length)];
  
  let inRange = candidates.filter(m => Math.abs(m - prevMidi) <= state.maxIntervalSemis);
  if(inRange.length === 0) inRange = [candidates.reduce((best,m)=> Math.abs(m-prevMidi) < Math.abs(best-prevMidi) ? m : best)];
  return inRange[Math.floor(Math.random()*inRange.length)];
}

function diatonicTriad(degreeIndex, includeSeventh){
  const steps = scaleSemitones();
  const degrees = includeSeventh ? [0,2,4,6] : [0,2,4];
  return degrees.map(off => (state.keyInfo.rootPc + steps[(degreeIndex + off) % 7] + 12*Math.floor((degreeIndex + off) / 7)) % 12);
}

function nearestPitchOfClass(pool, pc, prevMidi){
  const options = pool.filter(m => ((m%12)+12)%12 === pc);
  return options.length === 0 ? null : (prevMidi == null ? options[Math.floor(options.length/2)] : options.reduce((best,m)=> Math.abs(m-prevMidi) <= Math.abs(best-prevMidi) ? m : best));
}

const seqPatterns = {
    'thirds': [0, 2], 'fourths': [0, 3], 'fifths': [0, 4], 'sixths': [0, 5],
    'zigzag': [0, 1, 2, 3, 2, 3, 4, 5], 'group3': [0, 1, 2], 'group4': [0, 1, 2, 3],
    'diatonic_arps': [0, 2, 4], 'hanon': [0, 2, 1, 3]
};

function getSequenceNote(diatonicPool) {
  if (diatonicPool.length < 5) return diatonicPool.length ? diatonicPool[0] : null; 
  const pat = seqPatterns[state.seqPattern] || seqPatterns['thirds'];
  
  if (seqStep === 0) {
    const maxOff = Math.max(...pat);
    if (seqDir === 1 && seqIndex + maxOff >= diatonicPool.length) { seqDir = -1; seqIndex--; } 
    else if (seqDir === -1 && seqIndex - maxOff < 0) { seqDir = 1; seqIndex++; }
  }
  
  let offset = pat[seqStep];
  let targetIdx = Math.max(0, Math.min(diatonicPool.length - 1, seqIndex + (offset * seqDir)));
  let midi = diatonicPool[targetIdx];
  
  seqStep++; 
  if (seqStep >= pat.length) { seqStep = 0; seqIndex += seqDir; }
  return midi;
}

function getPedalNote(pool, diatonicPool) {
  if(!diatonicPool.length) return pool.length ? pool[0] : null;
  const rootNotes = pool.filter(m => ((m%12)+12)%12 === state.keyInfo.rootPc).sort((a,b)=>a-b);
  const pedalMidi = rootNotes.length ? rootNotes[0] : pool[0];
  
  if(pedalIsRoot) { 
      pedalIsRoot = false; return pedalMidi; 
  } else {
    pedalIsRoot = true; pedalScaleIdx += pedalDir;
    if(pedalScaleIdx >= diatonicPool.length || pedalScaleIdx <= 0) { pedalDir *= -1; pedalScaleIdx += pedalDir*2; }
    pedalScaleIdx = Math.max(0, Math.min(diatonicPool.length-1, pedalScaleIdx));
    let mel = diatonicPool[pedalScaleIdx];
    if(mel === pedalMidi && diatonicPool.length > 1) { 
        pedalScaleIdx = Math.max(0, Math.min(diatonicPool.length-1, pedalScaleIdx + pedalDir)); 
        mel = diatonicPool[pedalScaleIdx]; 
    }
    return mel;
  }
}

/**
 * ==========================================================================
 * MÓDULO 7: GERADOR RÍTMICO CENTRAL E QUIÁLTERAS
 * ==========================================================================
 */

function cellNote(dur, isDotted){ return { durQuarters: dur, isDotted: !!isDotted, isRest: Math.random() < state.probs.rests }; }
function cellRest(dur){ return { durQuarters: dur, isRest: true }; }

function buildTuplet(num_notes, notes_occupied, baseDur, durQuarters) {
    const evs = [];
    const tupletId = Math.random().toString(36).substr(2, 9);
    for (let i = 0; i < num_notes; i++) {
        evs.push({
            durQuarters: durQuarters,
            tupletDef: { num_notes, notes_occupied, baseDur, id: tupletId },
            isRest: Math.random() < state.probs.rests
        });
    }
    return evs;
}

const ESSENTIAL_CELL_BUILDERS = {
  c1_four16: () => [cellNote(0.25), cellNote(0.25), cellNote(0.25), cellNote(0.25)].map(e => ({ ...e, isRest: false })),
  c2_8_16_16: () => [{ durQuarters:0.5, isRest:false }, { durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }],
  c3_16_16_8: () => [{ durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }, { durQuarters:0.5, isRest:false }],
  c4_16_8_16: () => [{ durQuarters:0.25, isRest:false }, { durQuarters:0.5, isRest:false }, { durQuarters:0.25, isRest:false }],
  c5_dot8_16: () => [{ durQuarters:0.75, isDotted:true, isRest:false }, { durQuarters:0.25, isRest:false }],
  c6_16_dot8: () => [{ durQuarters:0.25, isRest:false }, { durQuarters:0.75, isDotted:true, isRest:false }],
  c7_r16_three16: () => [cellRest(0.25), { durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }, { durQuarters:0.25, isRest:false }],
  c8_8_r16_16: () => [{ durQuarters:0.5, isRest:false }, cellRest(0.25), { durQuarters:0.25, isRest:false }]
};

function hasAnyRhythmFigureEnabled(){
  const r = state.rhythms;
  const t = state.tuplets;
  if (r.whole > 0 || r.half > 0 || r.quarter > 0 || r.eighth > 0 || r.sixteenth > 0) return true;
  if (t.tHalf > 0 || t.dHemiola > 0 || t.tQuarter > 0 || t.qEighth > 0 || t.tEighth > 0 || t.qSixteenth > 0 || t.tSixteenth > 0 || t.dQuarter > 0 || t.dEighth > 0 || t.quadEighth > 0 || t.compQSixteenth > 0) return true;
  return Object.keys(ESSENTIAL_CELL_BUILDERS).some(key => state.rhythmCells[key] > 0);
}

function generateRhythmForMeasure(){
  const meter = METERS[state.timeSig];
  const events = [];
  let currentBeat = 0;
  
  const r = state.rhythms;
  const t = state.tuplets;
  const c = state.rhythmCells;

  if (!hasAnyRhythmFigureEnabled()) return [cellRest(meter.totalQuarters)];

  while (currentBeat < meter.totalQuarters - 0.001) {
    const beatsLeft = meter.totalQuarters - currentBeat;
    const cands = [];
    
    const addSafe = (w, dur, build) => { 
        if(w > 0 && dur <= beatsLeft + 0.001) cands.push({w, dur, build}); 
    };

    const isPulse = meter.isCompound ? (currentBeat % meter.pulse < 0.001) : (currentBeat % 1.0 < 0.001);
    const isHalfPulse = meter.isCompound ? false : (currentBeat % 0.5 < 0.001);

    if (!meter.isCompound) {
        if (currentBeat % 4.0 < 0.001 && beatsLeft >= 3.99) {
            addSafe(r.whole, 4.0, () => [cellNote(4.0)]);
            addSafe(t.tHalf, 4.0, () => buildTuplet(3, 2, 'h', 4/3));
        }
        if (currentBeat % 3.0 < 0.001 && beatsLeft >= 2.99) {
            addSafe(r.dotted, 3.0, () => [cellNote(3.0, true)]);
            addSafe(t.dHemiola, 3.0, () => buildTuplet(2, 3, 'q', 1.5));
        }
        if (currentBeat % 2.0 < 0.001 && beatsLeft >= 1.99) {
            addSafe(r.half, 2.0, () => [cellNote(2.0)]);
            addSafe(t.tQuarter, 2.0, () => buildTuplet(3, 2, 'q', 2/3));
            addSafe(t.qEighth, 2.0, () => buildTuplet(5, 4, '8', 2/5));
            if (r.quarter > 0 && r.eighth > 0 && r.dotted > 0) {
                addSafe((r.quarter + r.eighth + r.dotted)/3, 2.0, () => [cellNote(1.5, true), cellNote(0.5)]);
            }
        }

        if (isPulse && beatsLeft >= 0.99) {
            addSafe(r.quarter, 1.0, () => [cellNote(1.0)]);
            addSafe(r.eighth, 1.0, () => [cellNote(0.5), cellNote(0.5)]);
            addSafe(r.sixteenth, 1.0, () => [cellNote(0.25), cellNote(0.25), cellNote(0.25), cellNote(0.25)]);
            
            if (r.eighth > 0 && r.sixteenth > 0) {
                addSafe((r.eighth + r.sixteenth)/2, 1.0, () => [cellNote(0.5), cellNote(0.25), cellNote(0.25)]);
                addSafe((r.eighth + r.sixteenth)/2, 1.0, () => [cellNote(0.25), cellNote(0.25), cellNote(0.5)]);
                if (r.dotted > 0) {
                    addSafe((r.eighth + r.sixteenth + r.dotted)/3, 1.0, () => [cellNote(0.75, true), cellNote(0.25)]);
                    addSafe((r.eighth + r.sixteenth + r.dotted)/3, 1.0, () => [cellNote(0.25), cellNote(0.75, true)]);
                }
            }
            
            addSafe(t.tEighth, 1.0, () => buildTuplet(3, 2, '8', 1/3));
            addSafe(t.qSixteenth, 1.0, () => buildTuplet(5, 4, '16', 0.2));
            addSafe(t.tSixteenth, 1.0, () => buildTuplet(6, 4, '16', 1/6));
            
            Object.keys(ESSENTIAL_CELL_BUILDERS).forEach(key => {
                addSafe(state.rhythmCells[key], 1.0, ESSENTIAL_CELL_BUILDERS[key]);
            });
        }

        if (isHalfPulse && beatsLeft >= 0.49) {
            addSafe(r.eighth, 0.5, () => [cellNote(0.5)]);
            addSafe(r.sixteenth, 0.5, () => [cellNote(0.25), cellNote(0.25)]);
        }
        
        if (beatsLeft >= 0.24) {
            addSafe(r.sixteenth, 0.25, () => [cellNote(0.25)]);
        }
    } 
    else {
        if (currentBeat % 6.0 < 0.001 && beatsLeft >= 5.99) {
            addSafe(r.dotted, 6.0, () => [cellNote(6.0, true)]);
        }
        if (currentBeat % 3.0 < 0.001 && beatsLeft >= 2.99) { 
            addSafe(r.half, 3.0, () => [cellNote(3.0, true)]); 
            addSafe(t.dQuarter, 3.0, () => buildTuplet(2, 3, 'q', 1.5));
        }
        if (isPulse && beatsLeft >= 1.49) {
            addSafe(r.quarter, 1.5, () => [cellNote(1.5, true)]); 
            addSafe(r.eighth, 1.5, () => [cellNote(0.5), cellNote(0.5), cellNote(0.5)]);
            addSafe((r.quarter + r.eighth)/2, 1.5, () => [cellNote(1.0), cellNote(0.5)]);
            addSafe((r.quarter + r.eighth)/2, 1.5, () => [cellNote(0.5), cellNote(1.0)]);
            addSafe(t.dEighth, 1.5, () => buildTuplet(2, 3, '8', 0.75));
            addSafe(t.quadEighth, 1.5, () => buildTuplet(4, 3, '8', 1.5/4));
            addSafe(t.compQSixteenth, 1.5, () => buildTuplet(5, 6, '16', 0.3));
        }
        if (beatsLeft >= 0.99) {
            addSafe(r.quarter, 1.0, () => [cellNote(1.0)]);
        }
        if (beatsLeft >= 0.49) {
            addSafe(r.eighth, 0.5, () => [cellNote(0.5)]);
        }
        if (beatsLeft >= 0.24) {
            addSafe(r.sixteenth, 0.25, () => [cellNote(0.25)]);
        }
    }

    let totalW = cands.reduce((s, cand) => s + cand.w, 0);
    if (totalW === 0) {
        let restDur = 0.25;
        if (meter.isCompound) {
            restDur = meter.pulse === 1.5 ? 0.5 : 1.0;
        }
        if (restDur > beatsLeft) restDur = beatsLeft;
        events.push(cellRest(restDur));
        currentBeat += restDur;
        continue;
    }

    let roll = Math.random() * totalW;
    let sel = cands[cands.length - 1];
    for (let cand of cands) {
        if (roll < cand.w) { sel = cand; break; }
        roll -= cand.w;
    }

    const built = sel.build();
    events.push(...built);
    currentBeat += sel.dur;
  }
  return events;
}

/**
 * ==========================================================================
 * MÓDULO 8: ORQUESTRADOR DOS COMPASSOS E FATIADOR
 * ==========================================================================
 */
function buildMeasure(isLastMeasureInBlock = false){
  const pool = computePitchPool();
  const meter = METERS[state.timeSig];
  if (pool.length === 0) return [{ durQuarters: meter.totalQuarters, isRest: true, midi: null }]; 

  const diatonicPool = diatonicFilter(pool);

  let rawRhythm;
  if(state.genMode === 'groove'){
    if(!grooveState.pattern){ 
        grooveState.patternLenMeasures = Math.random() < 0.5 ? 1 : 2; 
        grooveState.pattern = []; 
        for(let i=0;i<grooveState.patternLenMeasures;i++) grooveState.pattern.push(generateRhythmForMeasure()); 
    }
    rawRhythm = grooveState.pattern[grooveState.measureInCycle % grooveState.patternLenMeasures].map(e => ({...e}));
    if((grooveState.measureInCycle % grooveState.cycleLength) === grooveState.cycleLength - 1 && Math.random() < 0.6){
      let acc=0, cut=-1; 
      for(let i=0;i<rawRhythm.length;i++){ acc += rawRhythm[i].durQuarters; if(acc > meter.totalQuarters - 0.999){ cut=i; break; } }
      if(cut>=0) { 
          rawRhythm = rawRhythm.slice(0,cut); 
          rawRhythm.push({durQuarters:0.5, isRest:false}, {durQuarters:0.5, isRest:false}); 
      }
    }
  } else { 
      rawRhythm = generateRhythmForMeasure(); 
  }

  let mergedRhythm = [];
  for (let i = 0; i < rawRhythm.length; i++) {
      let ev = Object.assign({}, rawRhythm[i]);
      if (!ev.isRest && !ev.tupletDef) {
          while (i < rawRhythm.length - 1 && !rawRhythm[i+1].isRest && !rawRhythm[i+1].tupletDef && Math.random() < state.probs.ties) {
              ev.durQuarters += rawRhythm[i+1].durQuarters;
              i++;
          }
      }
      mergedRhythm.push(ev);
  }

  let chordTonePos = 0;
  let isFirstNote = true;
  for (let i = 0; i < mergedRhythm.length; i++) {
      let ev = mergedRhythm[i];
      if (ev.isRest) {
          ev.midi = null; continue;
      }
      
      if (isFirstNote && pendingTieMidi !== null) {
          ev.midi = pendingTieMidi;
          lastMidi = ev.midi;
          isFirstNote = false;
          continue; 
      }

      if(state.genMode === 'triads'){ 
          if (isFirstNote && chordTonePos === 0) triadState.degree = Math.floor(Math.random() * 7);
          const chordPcs = diatonicTriad(triadState.degree, Math.random() < 0.25); 
          if (isFirstNote) ev.chordSymbol = getChordSymbol(triadState.degree);
          ev.midi = nearestPitchOfClass(pool, chordPcs[chordTonePos++ % chordPcs.length], lastMidi) || pickNextPitch(pool, lastMidi); 
      }
      else if(state.genMode === 'groove'){
        triadState.degree = grooveState.progression[Math.floor(grooveState.measureInCycle / grooveState.cycleLength) % grooveState.progression.length];
        const chordPcs = diatonicTriad(triadState.degree, Math.random() < 0.25);
        if (isFirstNote) ev.chordSymbol = getChordSymbol(triadState.degree);
        ev.midi = nearestPitchOfClass(pool, chordPcs[chordTonePos++ % chordPcs.length], lastMidi) || pickNextPitch(pool, lastMidi);
      } 
      else if(state.genMode === 'sequences') { ev.midi = getSequenceNote(diatonicPool) || pickNextPitch(pool, lastMidi); }
      else if(state.genMode === 'pedal') { ev.midi = getPedalNote(pool, diatonicPool) || pickNextPitch(pool, lastMidi); }
      else { ev.midi = pickNextPitch(pool, lastMidi); } 
      
      lastMidi = ev.midi;
      isFirstNote = false;
  }

  let sliced = [];
  let currentTime = 0;
  for (let ev of mergedRhythm) {
      if (ev.isRest || ev.tupletDef) {
          sliced.push(ev);
          currentTime += ev.durQuarters;
          continue;
      }

      let rem = ev.durQuarters;
      while (rem > 0.001) {
          let end = currentTime + rem;
          let splitAt = null;
          let isWhole = Math.abs(currentTime) < 0.001 && Math.abs(rem - meter.totalQuarters) < 0.001;

          if (!isWhole) {
              let nextPulse = Math.floor(currentTime / meter.pulse) * meter.pulse + meter.pulse;
              let midMeasure = meter.totalQuarters / 2.0;

              if (meter.isCompound) {
                  if (currentTime < nextPulse - 0.001 && end > nextPulse + 0.001) {
                      splitAt = nextPulse;
                  }
              } else {
                  if (meter.totalQuarters % 2 === 0 && currentTime < midMeasure - 0.001 && end > midMeasure + 0.001) {
                      splitAt = midMeasure;
                  } else if (Math.abs(currentTime % 1) > 0.001) {
                      let isShortSyncope = Math.abs(rem - 1.0) < 0.001 && (Math.abs((currentTime % 1) - 0.5) < 0.001);
                      if (!isShortSyncope && end > nextPulse + 0.001) {
                          splitAt = nextPulse;
                      }
                  }
              }
          }

          if (splitAt !== null) {
              let cut = splitAt - currentTime;
              sliced.push({ ...ev, durQuarters: cut, tieToNext: true });
              rem -= cut;
              currentTime = splitAt;
          } else {
              sliced.push({ ...ev, durQuarters: rem });
              currentTime += rem;
              rem = 0;
          }
      }
  }

  let factored = [];
  const VALID_DURS = [4.0, 3.0, 2.0, 1.5, 1.0, 0.75, 0.5, 0.25];
  
  for (let ev of sliced) {
      if (ev.isRest || ev.tupletDef) {
          factored.push(ev);
          continue;
      }

      let rem = ev.durQuarters;
      while (rem > 0.001) {
          let chunk = 0.25;
          for (let d of VALID_DURS) {
              if (rem >= d - 0.001) { chunk = d; break; }
          }
          
          let isLastChunk = Math.abs(rem - chunk) < 0.001;
          let tieForward = isLastChunk ? (ev.tieToNext || false) : true;
          
          factored.push({ ...ev, durQuarters: chunk, tieToNext: tieForward, isDotted: (chunk === 3.0 || chunk === 1.5 || chunk === 0.75) });
          rem -= chunk;
      }
  }

  let lastEv = factored[factored.length - 1];
  if (!isLastMeasureInBlock && !lastEv.isRest && Math.random() < state.probs.ties) {
      lastEv.tieToNext = true;
  }

  for (let i = 1; i < factored.length; i++) {
      if (factored[i-1].tieToNext && !factored[i-1].isRest && !factored[i].isRest) {
          factored[i].tiedFromPrev = true;
      }
  }
  if (pendingTieMidi !== null && !factored[0].isRest) {
       factored[0].tiedFromPrev = true;
  }

  if (factored[factored.length - 1].tieToNext && !factored[factored.length - 1].isRest) {
      pendingTieMidi = factored[factored.length - 1].midi;
  } else {
      pendingTieMidi = null;
  }

  if (state.probs.chromatic > 0 && ['random', 'groove', 'pedal'].includes(state.genMode)) {
      for(let i=0; i < factored.length - 1; i++) {
          const curr = factored[i];
          const next = factored[i+1];
          if (!curr.isRest && !next.isRest && curr.durQuarters <= 0.5 && !curr.tieToNext && !curr.tiedFromPrev) {
              if (Math.random() < state.probs.chromatic) {
                  const approachDir = Math.random() < 0.5 ? 1 : -1;
                  const newMidi = next.midi + approachDir;
                  if (newMidi >= state.lowMidi && newMidi <= state.highMidi) curr.midi = newMidi;
              }
          }
      }
  }

  for(const ev of factored){ 
      if(ev.isRest || ev.tiedFromPrev || ev.tieToNext) continue; 
      const rand = Math.random();
      if(rand < state.probs.ghost) ev.isGhost = true; 
      else if(rand < state.probs.ghost + state.probs.staccato) ev.isStaccato = true; 
  }
  
  if(state.genMode === 'groove'){ 
      grooveState.measureInCycle++; 
      if(grooveState.measureInCycle % grooveState.cycleLength === 0) grooveState.pattern = null; 
  }
  return factored;
}

function buildBlock() {
    const blockEvents = [];
    for (let m = 0; m < MEASURES_PER_BLOCK; m++) {
        const isLast = (m === MEASURES_PER_BLOCK - 1);
        blockEvents.push(buildMeasure(isLast));
    }
    return blockEvents;
}

/**
 * ==========================================================================
 * MÓDULO 9: RENDERIZAÇÃO GRÁFICA VEXFLOW
 * ==========================================================================
 */
function durToVexCode(q){
  if(Math.abs(q - 4.0) < 0.001) return 'w';
  if(Math.abs(q - 3.0) < 0.001) return 'hd';
  if(Math.abs(q - 2.0) < 0.001) return 'h';
  if(Math.abs(q - 1.5) < 0.001) return 'qd';
  if(Math.abs(q - 1.0) < 0.001) return 'q';
  if(Math.abs(q - 0.75) < 0.001) return '8d';
  if(Math.abs(q - 0.5) < 0.001) return '8';
  if(Math.abs(q - 0.25) < 0.001) return '16';
  return '8'; 
}

const NOTE_MODIFIER_ORDER = (function detectAddModifierOrder(){
  try {
    const VF = Vex.Flow;
    const probeNote = new VF.StaveNote({ keys: ['c/4'], duration: 'q' });
    const probeDot = new VF.Dot();
    probeNote.addModifier(probeDot, 0); 
    return 'modifier-first';
  } catch (e) {
    return 'index-first'; 
  }
})();

function addNoteModifier(note, modifier, index){
  if (NOTE_MODIFIER_ORDER === 'modifier-first') note.addModifier(modifier, index);
  else note.addModifier(index, modifier);
}

function renderInlineClef(container) {
    const VF = Vex.Flow, renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    const logicalWidth = 160; 
    renderer.resize(logicalWidth * SCALE, 150 * SCALE);
    const ctx = renderer.getContext(); ctx.scale(SCALE, SCALE);
    ctx.setFillStyle(getComputedStyle(document.documentElement).getPropertyValue('--text-0').trim() || '#e9ecf1');
    ctx.setStrokeStyle(getComputedStyle(document.documentElement).getPropertyValue('--staff').trim() || '#8a93a3');
    const stave = new VF.Stave(0, 10, logicalWidth); 
    stave.addClef(state.clef).addKeySignature(state.keyInfo.vexKey).addTimeSignature(state.timeSig); 
    stave.setContext(ctx).draw();
}

function renderBlockSVG(container, blockEvents){
  const VF = Vex.Flow;
  const meter = METERS[state.timeSig];
  const measurePx = meter.totalQuarters * window.LOGICAL_PX_PER_QUARTER;
  const logicalWidth = measurePx * MEASURES_PER_BLOCK; 
  
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
  renderer.resize((logicalWidth + 20) * SCALE, 150 * SCALE);
  const ctx = renderer.getContext(); 
  ctx.scale(SCALE, SCALE);
  
  ctx.setFillStyle(getComputedStyle(document.documentElement).getPropertyValue('--text-0').trim() || '#e9ecf1');
  ctx.setStrokeStyle(getComputedStyle(document.documentElement).getPropertyValue('--staff').trim() || '#8a93a3');

  container._blockEventsData = blockEvents;

  const allVexNotes = [];

  blockEvents.forEach((events, measureIndex) => {
      const startX = measureIndex * measurePx;
      const stave = new VF.Stave(startX, 10, measurePx); 
      try { stave.setBegBarType(VF.Barline.type.NONE); } catch(e) {}
      stave.setContext(ctx).draw();

      const vexNotes = [], tuplets = [], beams = [];
      let currentBeat = 0, curTupletGroup = [];
      const beatGroups = {}; 

      events.forEach((ev, i) => {
        let vexKey = ev.isRest ? restKeyForClef(state.clef) : midiToVexKey(ev.midi).key;
        
        let baseDur;
        if (ev.tupletDef) {
            baseDur = ev.tupletDef.baseDur;
        } else {
            baseDur = durToVexCode(ev.durQuarters);
        }

        const durCode = baseDur + (ev.isRest ? 'r' : '');
        const noteOpts = { keys:[vexKey], duration: durCode, clef: state.clef, auto_stem: true };
        
        if(ev.isGhost && !ev.isRest) noteOpts.type = 'm';
        
        const note = new VF.StaveNote(noteOpts);
        
        if(ev.isDotted) {
            addNoteModifier(note, new VF.Dot(), 0);
        }
        if(!ev.isRest && ev.isStaccato) {
            const art = new VF.Articulation('a.');
            art.setPosition(3); 
            addNoteModifier(note, art, 0);
        }
        if(ev.chordSymbol && !ev.isRest) {
            const anno = new VF.Annotation(ev.chordSymbol);
            anno.setFont('sans-serif', 12, 'bold');
            anno.setVerticalJustification(1); 
            addNoteModifier(note, anno, 0);
        }
        
        ev._vexNote = note; 
        vexNotes.push(note);
        allVexNotes.push(ev); 
        
        if(ev.tupletDef) { 
            curTupletGroup.push(ev);
            const nextEv = events[i + 1];
            
            if (!nextEv || !nextEv.tupletDef || nextEv.tupletDef.id !== ev.tupletDef.id) {
                const notes = curTupletGroup.map(e => e._vexNote);
                tuplets.push(new VF.Tuplet(notes, { 
                    num_notes: ev.tupletDef.num_notes, 
                    notes_occupied: ev.tupletDef.notes_occupied 
                }));
                
                const realEvents = curTupletGroup.filter(e => !e.isRest);
                const allShort = curTupletGroup.every(e => ['8', '16', '32'].includes(e.tupletDef.baseDur));
                
                if (realEvents.length >= 1 && allShort) {
                    if (realEvents.length >= 2) {
                        const centerMidi = getCenterMidiForClef(state.clef);
                        let maxMidi = -100, minMidi = 200;
                        realEvents.forEach(e => {
                            if (e.midi > maxMidi) maxMidi = e.midi;
                            if (e.midi < minMidi) minMidi = e.midi;
                        });
                        const stemDir = (maxMidi + minMidi) / 2 >= centerMidi ? -1 : 1;
                        curTupletGroup.forEach(e => {
                            if (!e.isRest) e._vexNote.setStemDirection(stemDir);
                        });
                    }
                    
                    let start = 0; while(start < curTupletGroup.length && curTupletGroup[start].isRest) start++;
                    let end = curTupletGroup.length - 1; while(end >= 0 && curTupletGroup[end].isRest) end--;
                    if (end > start) {
                        const beamEvents = curTupletGroup.slice(start, end + 1);
                        beams.push(new VF.Beam(beamEvents.map(e => e._vexNote)));
                    }
                }
                
                curTupletGroup = []; 
            } 
        } 
        else if (ev.durQuarters < meter.pulse) {
            const beatIndex = Math.floor(currentBeat / meter.pulse);
            if (!beatGroups[beatIndex]) beatGroups[beatIndex] = [];
            beatGroups[beatIndex].push(ev);
        }
        currentBeat += ev.durQuarters;
      });

      Object.values(beatGroups).forEach(group => {
          let start = 0; while(start < group.length && group[start].isRest) start++;
          let end = group.length - 1; while(end >= 0 && group[end].isRest) end--;
          
          if (end > start) { 
              const beamEvents = group.slice(start, end + 1);
              const realEvents = beamEvents.filter(e => !e.isRest);
              
              if (realEvents.length >= 2) {
                  const centerMidi = getCenterMidiForClef(state.clef);
                  let maxMidi = -100, minMidi = 200;
                  realEvents.forEach(e => {
                      if (e.midi > maxMidi) maxMidi = e.midi;
                      if (e.midi < minMidi) minMidi = e.midi;
                  });
                  const stemDir = (maxMidi + minMidi) / 2 >= centerMidi ? -1 : 1;
                  beamEvents.forEach(e => e._vexNote.setStemDirection(stemDir));
                  beams.push(new VF.Beam(beamEvents.map(e => e._vexNote)));
              }
          }
      });

      const voice = new VF.Voice({ num_beats: meter.numBeats, beat_value: meter.beatValue }).setStrict(false); 
      voice.addTickables(vexNotes);
      try{ VF.Accidental.applyAccidentals([voice], state.keyInfo.vexKey); }catch(e){}
      new VF.Formatter().joinVoices([voice]).format([voice], measurePx - 30);

      voice.draw(ctx, stave);
      beams.forEach(b => b.setContext(ctx).draw()); 
      tuplets.forEach(t => t.setContext(ctx).draw());
  });

  for(let i=0; i<allVexNotes.length-1; i++){
    if(allVexNotes[i].tieToNext && !allVexNotes[i].isRest && !allVexNotes[i+1].isRest){
        new VF.StaveTie({ 
            first_note: allVexNotes[i]._vexNote, 
            last_note: allVexNotes[i+1]._vexNote, 
            first_indices:[0], last_indices:[0] 
        }).setContext(ctx).draw();
    }
  }
}

function renderClefPanel(){
  const VF = Vex.Flow, holder = document.createElement('div'), renderer = new VF.Renderer(holder, VF.Renderer.Backends.SVG);
  const logicalWidth = 160; renderer.resize(logicalWidth * SCALE, 150 * SCALE);
  const ctx = renderer.getContext(); ctx.scale(SCALE, SCALE);
  ctx.setFillStyle(getComputedStyle(document.documentElement).getPropertyValue('--text-0').trim() || '#e9ecf1');
  ctx.setStrokeStyle(getComputedStyle(document.documentElement).getPropertyValue('--staff').trim() || '#8a93a3');
  const stave = new VF.Stave(0, 10, logicalWidth); 
  stave.addClef(state.clef).addKeySignature(state.keyInfo.vexKey).addTimeSignature(state.timeSig); 
  stave.setContext(ctx).draw();
  const cp = document.getElementById('clefpanel');
  if (cp) { cp.innerHTML = ''; cp.appendChild(holder.firstChild); }
}

/**
 * ==========================================================================
 * MÓDULO 10: MOTOR DE ANIMAÇÃO E GERENCIAMENTO DA ESTEIRA
 * ==========================================================================
 */
const scoreScroll = document.getElementById('score-scroll');
const PLAYHEAD_X = 240; 
const ph = document.getElementById('playhead');

let measures = []; let cumulativeBeats = 0; let globalEventTimeline = []; 
let rafId = null; let anchorTime = 0; let anchorBeat = 0;  

function getBeatFromTime(t) { return anchorBeat + (t - anchorTime) * (state.bpm / 60); }
function getTimeFromBeat(b) { return anchorTime + (b - anchorBeat) * (60 / state.bpm); }

function resetPlayhead() {
    if (!ph) return;
    if (state.displayMode === 'scroll') {
        ph.style.transform = 'none';
        ph.style.left = PLAYHEAD_X + 'px';
        ph.style.top = '0px';
        ph.style.bottom = '0px';
        ph.style.height = '100%';
    } else {
        ph.style.transform = `translate(-999px, -999px)`;
        ph.style.left = '0px';
        ph.style.top = '0px';
        ph.style.bottom = 'auto';
        ph.style.height = (150 * SCALE) + 'px'; 
    }
}

function updateBlockTransitions() {
    const fadeSecs = 4 * (60 / state.bpm); 
    measures.forEach(m => {
        if (m.wrapper) m.wrapper.style.transition = `opacity ${fadeSecs}s ease-in-out`;
    });
}

function clearTrack(){
  if(scoreScroll) {
      scoreScroll.innerHTML = ''; 
      scoreScroll.style.transform = 'none';
  }
  measures = []; cumulativeBeats = 0; globalEventTimeline = [];
  lastMidi = null; pendingTieMidi = null; grooveState.pattern = null; grooveState.measureInCycle = 0;
  seqIndex = 0; seqStep = 0; seqDir = 1; pedalIsRoot = true; pedalScaleIdx = 0; pedalDir = 1;
  resetPlayhead();
}

function generateAndScheduleNextBlock(){
  const blockEvents = buildBlock(); 
  const meter = METERS[state.timeSig];
  const bpp = MEASURES_PER_BLOCK * meter.totalQuarters;
  
  const wrapper = document.createElement('div');
  wrapper.className = 'block-wrapper';
  
  if (state.displayMode === 'page') {
      const blockIndex = Math.floor(cumulativeBeats / bpp);
      wrapper.classList.add('row-' + (blockIndex % state.pageLines));
      
      if (cumulativeBeats < bpp * state.pageLines) {
          wrapper.classList.add('visible');
      }
  }
  
  const fadeSecs = 4 * (60 / state.bpm); 
  wrapper.style.transition = `opacity ${fadeSecs}s ease-in-out`;
  
  const clefDiv = document.createElement('div');
  clefDiv.className = 'inline-clef';
  renderInlineClef(clefDiv);
  
  const div = document.createElement('div'); 
  div.className = 'measure'; 
  
  wrapper.appendChild(clefDiv);
  wrapper.appendChild(div);
  
  const leftPx = PLAYHEAD_X + cumulativeBeats * window.PX_PER_QUARTER; 
  wrapper.style.left = leftPx + 'px'; 
  if(scoreScroll) scoreScroll.appendChild(wrapper);
  
  renderBlockSVG(div, blockEvents);
  wrapper._blockEventsData = blockEvents;

  let cursorBeat = cumulativeBeats;
  for (const events of blockEvents) {
      for(const ev of events){
        if(!ev.isRest && ev.midi != null){
          if(ev.tiedFromPrev && globalEventTimeline.length > 0) {
              globalEventTimeline[globalEventTimeline.length - 1].durBeats += ev.durQuarters;
          } else {
              globalEventTimeline.push({ beat: cursorBeat, durBeats: ev.durQuarters, midi: ev.midi, opts: { isGhost: ev.isGhost, isStaccato: ev.isStaccato }, scheduled: false });
          }
        }
        cursorBeat += ev.durQuarters;
      }
  }
  
  measures.push({ wrapper, div, leftPx, startBeat: cumulativeBeats }); 
  cumulativeBeats += meter.totalQuarters * MEASURES_PER_BLOCK; 
}

function ensureBuffer(currentBeat) { 
    const bpp = MEASURES_PER_BLOCK * METERS[state.timeSig].totalQuarters;
    const bufferBeats = state.displayMode === 'page' ? Math.max(32, state.pageLines * bpp + bpp) : 32;
    while(cumulativeBeats < currentBeat + bufferBeats) {
        generateAndScheduleNextBlock(); 
    }
}

function pruneOffscreen(activeBeat){ 
    const bpp = MEASURES_PER_BLOCK * METERS[state.timeSig].totalQuarters;
    const activeBlockIndex = Math.floor(activeBeat / bpp);
    
    while(measures.length > 0) {
        const m = measures[0];
        let shouldPrune = false;
        
        if (state.displayMode === 'scroll') {
            shouldPrune = (m.startBeat + bpp) * window.PX_PER_QUARTER < (activeBeat * window.PX_PER_QUARTER) - PLAYHEAD_X - 50;
        } else {
            const blockIndex = Math.floor(m.startBeat / bpp);
            shouldPrune = blockIndex < activeBlockIndex - state.pageLines;
        }
        
        if (shouldPrune) {
            m.wrapper.remove();
            measures.shift();
        } else {
            break;
        }
    }
}

function updatePageVisibility(activeBeat) {
    if (state.displayMode !== 'page') {
        measures.forEach(m => m.wrapper.classList.add('visible'));
        return;
    }
    
    const bpp = MEASURES_PER_BLOCK * METERS[state.timeSig].totalQuarters;
    const fadeBeats = 4; 
    const L = state.pageLines;
    
    measures.forEach(m => {
        const blockIndex = Math.floor(m.startBeat / bpp);
        
        let fadeInStartBeat;
        if (blockIndex < L) {
            fadeInStartBeat = -999;
        } else {
            fadeInStartBeat = (blockIndex - L + 1) * bpp + fadeBeats;
        }
        
        const fadeOutStartBeat = (blockIndex + 1) * bpp;
        
        if (activeBeat >= fadeInStartBeat && activeBeat < fadeOutStartBeat) {
            m.wrapper.classList.add('visible');
        } else {
            m.wrapper.classList.remove('visible');
        }
        
        const row = blockIndex % L;
        for(let i=0; i<4; i++) m.wrapper.classList.remove('row-' + i);
        m.wrapper.classList.add('row-' + row);
    });
}

function updatePlayheadPosition(activeBeat) {
    if (!ph) return;
    
    if (state.displayMode === 'page') {
        scoreScroll.style.transform = 'none';
        
        const bpp = MEASURES_PER_BLOCK * METERS[state.timeSig].totalQuarters;
        const activeBlockIndex = Math.floor(activeBeat / bpp);
        const activeMeasure = measures.find(m => Math.floor(m.startBeat / bpp) === activeBlockIndex);
        
        if (activeMeasure && activeBeat >= 0) {
            if (cachedPageScale === 0) updatePageScale();
            
            const localBeat = activeBeat - activeMeasure.startBeat;
            const progressPx = localBeat * window.PX_PER_QUARTER * cachedPageScale;
            const phX = activeMeasure.wrapper.offsetLeft + cachedClefWidth + progressPx;
            const svgHeight = 150 * SCALE * cachedPageScale;
            const phY = activeMeasure.wrapper.offsetTop + (activeMeasure.wrapper.offsetHeight - svgHeight) / 2;
            
            ph.style.transform = `translate(${phX}px, ${phY}px)`;
            ph.style.height = svgHeight + 'px';
        } else {
            ph.style.transform = `translate(-999px, -999px)`;
        }
    } else {
        scoreScroll.style.transform = `translateX(${-activeBeat * window.PX_PER_QUARTER}px)`;
    }
}

function animationLoop(){
  if(!state.playing || state.paused) return; 
  const currentBeat = getBeatFromTime(audioCtx.currentTime); 
  const activeBeat = Math.max(0, currentBeat); 
  
  updatePageVisibility(activeBeat);
  updatePlayheadPosition(activeBeat);
  ensureBuffer(activeBeat); 
  pruneOffscreen(activeBeat);
  
  const flash = document.getElementById('countin-flash');
  if(flash) {
      if(currentBeat < 0){ 
          flash.textContent = Math.floor(currentBeat) + 5; 
          flash.classList.add('show'); 
      } else { flash.classList.remove('show'); }
  }
  
  const statusEl = document.getElementById('status');
  if (statusEl) {
      let label = DICTIONARY[currentLang].stsMeasure;
      statusEl.textContent = currentBeat < 0 ? DICTIONARY[currentLang].stsCount : `${label} ${Math.floor(activeBeat/METERS[state.timeSig].totalQuarters)+1}`;
  }
  
  rafId = requestAnimationFrame(animationLoop);
}

/**
 * ==========================================================================
 * MÓDULO 11: SCHEDULER DE ÁUDIO WEB API E SÍNTESE
 * ==========================================================================
 */
let audioCtx = null, masterGain = null, scheduledNodes = [];
let audioSchedulerId = null, lastScheduledMetroBeat = -1;

function ensureAudio(){
  if(!audioCtx){ 
      audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
      masterGain = audioCtx.createGain(); masterGain.gain.value = 0.9; masterGain.connect(audioCtx.destination); 
  }
  if(audioCtx.state === 'suspended') audioCtx.resume();
}
function stopAllAudioNodes() { scheduledNodes.forEach(n => { try{ n.stop(); }catch(e){} }); scheduledNodes.length = 0; }

function playClick(time, accent){
  if(!state.clickAudio || state.volClick <= 0) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(); 
  osc.type = 'square'; osc.frequency.value = accent ? 1500 : 1000;
  gain.gain.setValueAtTime(0.0001, time); 
  gain.gain.exponentialRampToValueAtTime((accent ? 0.35 : 0.22) * state.volClick + 0.0001, time+0.002); 
  gain.gain.exponentialRampToValueAtTime(0.0001, time+0.045);
  osc.connect(gain).connect(masterGain); osc.start(time); osc.stop(time+0.05);
  scheduledNodes.push(osc); osc.onended = () => { const i = scheduledNodes.indexOf(osc); if(i>-1) scheduledNodes.splice(i,1); };
}

function playBassNote(time, midi, durationSec, opts){
  if(!state.noteAudio || state.volSynth <= 0) return;
  
  const osc = audioCtx.createOscillator();
  const filt = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  
  osc.frequency.value = 440 * Math.pow(2, (midi-69)/12);
  osc.type = state.instrument || 'sawtooth';
  
  filt.type = 'lowpass';
  filt.frequency.value = opts.isGhost ? 450 : 1200;
  filt.Q.value = 0.5;
  
  let actualDuration = (opts.isStaccato || opts.isGhost) ? Math.min(durationSec * 0.3, 0.12) : durationSec * 0.95;
  let attack = 0.01;
  let decay = 0.1;
  let peakMulti = opts.isGhost ? 0.15 : 0.4;
  let sustainLvl = peakMulti * 0.6;
  
  const peak = peakMulti * state.volSynth;
  sustainLvl = sustainLvl * state.volSynth;

  gain.gain.setValueAtTime(0.0001, time); 
  gain.gain.exponentialRampToValueAtTime(peak + 0.0001, time + attack);
  
  if (actualDuration > attack + decay) { 
      gain.gain.exponentialRampToValueAtTime(sustainLvl + 0.0001, time + attack + decay); 
      gain.gain.setValueAtTime(sustainLvl + 0.0001, time + actualDuration - 0.05); 
      gain.gain.exponentialRampToValueAtTime(0.0001, time + actualDuration); 
  } else { 
      gain.gain.exponentialRampToValueAtTime(0.0001, time + actualDuration); 
  }
  
  osc.connect(filt);
  filt.connect(gain).connect(masterGain); 
  osc.start(time); 
  osc.stop(time + actualDuration + 0.1);
  
  scheduledNodes.push(osc); 
  osc.onended = () => { const i = scheduledNodes.indexOf(osc); if(i>-1) scheduledNodes.splice(i,1); };
}

function audioTick(){
  if(!state.playing || state.paused) return;
  const now = audioCtx.currentTime, lookaheadBeat = getBeatFromTime(now + 0.2); 
  
  for(let i=0; i<globalEventTimeline.length; i++){
    const note = globalEventTimeline[i];
    if(!note.scheduled && note.beat <= lookaheadBeat){ note.scheduled = true; const pt = getTimeFromBeat(note.beat); if(pt >= now - 0.05) playBassNote(pt, note.midi, note.durBeats * (60/state.bpm), note.opts); }
  }
  
  while( lastScheduledMetroBeat + 1 <= lookaheadBeat ){ 
      lastScheduledMetroBeat++; 
      const pt = getTimeFromBeat(lastScheduledMetroBeat); 
      const isAccent = lastScheduledMetroBeat % METERS[state.timeSig].totalQuarters === 0;
      if(pt >= now - 0.05) playClick(pt, isAccent); 
  }
}

/**
 * ==========================================================================
 * MÓDULO 12: SISTEMA DE TRANSPORTE E BINDINGS FINAIS
 * ==========================================================================
 */
function updatePlayButtonUI() {
    const btn = document.getElementById('playPauseBtn');
    if(!btn) return;
    if (state.playing && !state.paused) {
        const txt = DICTIONARY[currentLang].btnPause || 'Pausar';
        btn.innerHTML = `<span class="icon">⏸</span> ${txt}`;
        btn.className = 'transport-btn btn-orange'; 
    } else {
        const txt = state.paused ? (DICTIONARY[currentLang].btnContinue || 'Continuar') : DICTIONARY[currentLang].btnStart;
        btn.innerHTML = `<span class="icon">▶</span> ${txt}`;
        btn.className = 'transport-btn btn-green'; 
    }
}

function startPlayback(){
  ensureAudio(); clearTrack(); state.playing = true; state.paused = false;
  updatePlayButtonUI(); 
  const stopB = document.getElementById('stopBtn'); if(stopB) stopB.disabled = false;
  const ws = document.getElementById('welcome-screen'); if(ws) ws.classList.add('hidden');
  
  anchorBeat = state.countIn ? -METERS[state.timeSig].totalQuarters : 0; anchorTime = audioCtx.currentTime + 0.1; lastScheduledMetroBeat = anchorBeat - 1;
  ensureBuffer(0); if(audioSchedulerId) clearInterval(audioSchedulerId); audioSchedulerId = setInterval(audioTick, 50); rafId = requestAnimationFrame(animationLoop);
}

function togglePause() {
  if (!state.playing) return;
  if (state.paused) {
    state.paused = false; anchorTime += (audioCtx.currentTime - state.pauseTime); 
    updatePlayButtonUI();
    rafId = requestAnimationFrame(animationLoop);
  } else {
    state.paused = true; state.pauseTime = audioCtx.currentTime; stopAllAudioNodes(); cancelAnimationFrame(rafId);
    const cb = getBeatFromTime(state.pauseTime); globalEventTimeline.forEach(note => { if (note.beat > cb - 0.1) note.scheduled = false; }); 
    lastScheduledMetroBeat = Math.floor(cb);
    updatePlayButtonUI(); 
    const st = document.getElementById('status'); if(st) st.textContent = DICTIONARY[currentLang].stsPaused;
  }
}

function stopPlayback(){
  state.playing = false; state.paused = false;
  updatePlayButtonUI(); 
  const stopB = document.getElementById('stopBtn'); if(stopB) stopB.disabled = true;
  const ws = document.getElementById('welcome-screen'); if(ws) ws.classList.remove('hidden');
  
  if(rafId) cancelAnimationFrame(rafId); if(audioSchedulerId) clearInterval(audioSchedulerId);
  const flash = document.getElementById('countin-flash'); if(flash) flash.classList.remove('show'); 
  const st = document.getElementById('status'); if(st) st.textContent = DICTIONARY[currentLang].stsReady;
  
  stopAllAudioNodes(); 
  clearTrack();
}

function applyBpm(newBpm){
  const nextBpm = Math.max(30, Math.min(220, parseInt(newBpm,10) || state.bpm));
  if(state.playing && !state.paused) { const now = audioCtx.currentTime; anchorBeat = getBeatFromTime(now); anchorTime = now; } 
  else if (state.paused) { anchorBeat = getBeatFromTime(state.pauseTime); anchorTime = state.pauseTime; }
  state.bpm = nextBpm; 
  const bS = document.getElementById('bpmSlider'); if(bS) bS.value = nextBpm; 
  const bR = document.getElementById('bpmReadout'); if(bR) bR.value = nextBpm;
  updateBlockTransitions();
}

safeAddListener('playPauseBtn', 'click', () => state.playing ? togglePause() : startPlayback() );
safeAddListener('stopBtn', 'click', () => { if(state.playing) stopPlayback(); });

function setupHoldButton(id, delta) {
    const btn = document.getElementById(id);
    if (!btn) return;
    let timer = null, timeout = null;
    
    const start = (e) => {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        applyBpm(state.bpm + delta);
        timeout = setTimeout(() => {
            timer = setInterval(() => applyBpm(state.bpm + delta), 80); 
        }, 300); 
    };
    
    const stop = (e) => {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        clearTimeout(timeout);
        clearInterval(timer);
    };
    
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    
    btn.addEventListener('touchstart', start, {passive: false});
    btn.addEventListener('touchend', stop, {passive: false});
    btn.addEventListener('touchcancel', stop, {passive: false});
}

setupHoldButton('bpmDec', -1);
setupHoldButton('bpmInc', 1);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { 
    e.preventDefault(); 
    if(document.activeElement) document.activeElement.blur(); 
    state.playing ? togglePause() : startPlayback(); 
  }
});

const bpmSlider = document.getElementById('bpmSlider'), bpmReadout = document.getElementById('bpmReadout');
if(bpmSlider) bpmSlider.addEventListener('input', () => applyBpm(bpmSlider.value)); 
if(bpmReadout) bpmReadout.addEventListener('change', () => applyBpm(bpmReadout.value));

function wireToggle(id, key){ 
    const b = document.getElementById(id); 
    if(!b) return;
    b.addEventListener('click', () => { state[key] = !state[key]; b.classList.toggle('on', state[key]); }); 
}
wireToggle('countInBtn','countIn'); wireToggle('noteAudioBtn','noteAudio'); wireToggle('clickAudioBtn','clickAudio');

// Inicialização Final
updateLanguage('pt');
updateRhythmUI();
resetPlayhead();
updatePositionDescriptions();

} // fim initApp()