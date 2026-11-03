// Taxonomia do catálogo: módulos (onde o exercício mora no app) e etiquetas (o que ele testa).
// Decisão 6 em docs/decisoes.md: um exercício tem UMA localização principal e VÁRIAS etiquetas.
//
// - Módulo é navegação: serve para achar o exercício. Não é o modelo de habilidade.
// - skill_tags dizem que habilidade a tarefa exige (nomear, localizar, reconhecer de ouvido…).
// - content_tags dizem com que material ela trabalha (claves, intervalos, acordes, figuras…).
//
// As listas são CONTROLADAS: nada de texto livre. As tentativas gravam TAXONOMY_VERSION junto
// com as etiquetas (C2), então mudar o significado de uma etiqueta, renomear ou remover pede
// subir a versão. Acrescentar etiqueta nova também sobe a versão, para a análise saber a partir
// de quando ela existe. As descrições abaixo são a definição de cada etiqueta, para o time; o app
// não as mostra.

export const TAXONOMY_VERSION = 1;

export const MODULES = {
  theory: 'Teoria: notação e símbolos, escalas, acordes, harmonia e o mapa das notas no instrumento.',
  technique: 'Técnica: controle motor, coordenação, digitação, articulação e regularidade.',
  'perception.melodic': 'Percepção melódica: alturas, intervalos, graus e escalas ouvidos em sequência.',
  'perception.harmonic': 'Percepção harmônica: acordes e sonoridades ouvidos juntos.',
  'perception.rhythmic': 'Percepção rítmica: pulso, figuras e células, ouvidos ou lidos para tocar.',
} as const;
export type ModuleId = keyof typeof MODULES;
// "Rotinas" não está aqui de propósito: é organização da prática, não módulo de habilidade.

export const SKILL_TAGS = {
  // notação
  'notation.pitch_reading': 'Dar o nome de uma nota escrita na pauta.',
  'notation.pitch_writing': 'Escrever na pauta uma nota dada pelo nome.',
  'notation.key_signature': 'Dizer a tonalidade a partir da armadura.',
  'notation.rhythm_reading': 'Associar uma escrita rítmica ao que ela soa.',
  // teoria
  'theory.interval_naming': 'Nomear um intervalo visto (na pauta ou no instrumento) pela qualidade e número.',
  'theory.chord_identification': 'Reconhecer um acorde visto e dar a cifra.',
  'theory.chord_construction': 'Saber quais notas formam um acorde a partir da cifra.',
  'theory.scale_identification': 'Reconhecer uma escala escrita e dar o nome.',
  'theory.scale_degrees': 'Relacionar nota e grau dentro de uma tonalidade.',
  'theory.modes': 'Saber a estrutura dos modos e o que distingue um do outro.',
  'theory.harmonic_field': 'Saber o acorde de cada grau do campo harmônico.',
  'theory.key_relations': 'Relações entre tonalidades: relativa menor, quantidade de acidentes.',
  'theory.reharmonization': 'Substituições de acordes (ex.: sub5).',
  // mapa do instrumento: saber onde as notas estão (conhecimento, não controle motor)
  'fretboard.note_naming': 'Dar o nome da nota de uma casa marcada no braço.',
  'fretboard.note_finding': 'Achar no braço a casa de uma nota dada.',
  'fretboard.interval_shapes': 'Reconhecer o intervalo pelo desenho entre duas casas.',
  'fretboard.chord_shapes': 'Reconhecer um acorde pelo desenho no braço.',
  'keyboard.note_naming': 'Dar o nome de uma tecla marcada.',
  'keyboard.note_finding': 'Achar no teclado a tecla de uma nota dada.',
  'keyboard.chord_shapes': 'Reconhecer um acorde pelas teclas marcadas.',
  // técnica: só controle motor (decisão 6)
  'technique.fingering': 'Digitação certa (um dedo por casa, dedilhado do piano).',
  'technique.finger_independence': 'Independência e coordenação dos dedos.',
  'technique.string_crossing': 'Troca de cordas com a mão que toca.',
  'technique.tempo_control': 'Regularidade no andamento, com metrônomo.',
  // ouvido
  'ear.pitch_identification': 'Identificar uma altura ouvida, com ou sem referência.',
  'ear.interval_identification': 'Identificar um intervalo ouvido.',
  'ear.chord_quality': 'Identificar a qualidade de um acorde ouvido (maior, menor, diminuto…).',
  'ear.scale_quality': 'Identificar uma escala ou modo ouvido.',
  'ear.scale_degrees': 'Identificar os graus de notas ouvidas em relação a uma tônica.',
  'ear.rhythm_recognition': 'Reconhecer um ritmo ouvido.',
} as const;
export type SkillTag = keyof typeof SKILL_TAGS;

export const CONTENT_TAGS = {
  // alturas e pauta
  'pitch.naturals': 'Notas naturais.',
  'pitch.accidentals': 'Notas com sustenido ou bemol.',
  'clef.treble': 'Clave de sol.',
  'clef.bass': 'Clave de fá.',
  'staff.ledger_lines': 'Linhas suplementares.',
  // tonalidades
  'key.major': 'Tonalidades maiores.',
  'key.minor': 'Tonalidades menores.',
  'key.signatures': 'Armaduras de clave.',
  // intervalos
  'interval.simple': 'Intervalos simples, da 2ª à oitava.',
  // acordes
  'chord.triads': 'Tríades (maior, menor, diminuta, aumentada, suspensa).',
  'chord.sevenths': 'Tétrades (7M, 7, m7, m7(♭5), °7).',
  'chord.inversions': 'Acordes invertidos.',
  'chord.open_shapes': 'Formas de acorde com cordas soltas.',
  'chord.barre_shapes': 'Formas de acorde com pestana.',
  // escalas
  'scale.major': 'Escala maior.',
  'scale.minor': 'Escalas menores (natural, harmônica, melódica).',
  'scale.modes': 'Modos gregos.',
  'scale.pentatonic': 'Pentatônicas maior e menor.',
  'scale.blues': 'Escala blues.',
  // harmonia
  'harmony.diatonic_field': 'Campo harmônico diatônico.',
  'harmony.tritone_sub': 'Substituto trítono (sub5).',
  // ritmo
  'rhythm.quarter': 'Semínimas e mínimas.',
  'rhythm.eighth': 'Colcheias e contratempo.',
  'rhythm.sixteenth': 'Semicolcheias.',
  'rhythm.rests': 'Pausas.',
  'rhythm.syncopation': 'Síncopes e figuras pontuadas.',
  'rhythm.triplets': 'Tercinas.',
  // instrumento
  'instrument.guitar': 'Violão e guitarra.',
  'instrument.bass': 'Baixo.',
  'instrument.keyboard': 'Piano e teclado.',
} as const;
export type ContentTag = keyof typeof CONTENT_TAGS;

/** Onde um exercício ou aula mora e o que ele testa. */
export interface Classification {
  primaryModule: ModuleId;
  /** Habilidades que a tarefa exige, da principal para as secundárias. */
  skillTags: SkillTag[];
  /** Material que o exercício PODE cobrir em alguma configuração. O que cada tentativa usou de
   *  fato fica no parameters_snapshot dela (C2). */
  contentTags: ContentTag[];
}
