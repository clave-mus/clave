import type { Instrument } from '../data/modules';
import type { ChordId, Clef, Convention, Naming, Note } from '../theory/core';
import type { Translate } from '../i18n';
import type { Presentation } from '../audio/presentation';
import type { Classification, ModuleId } from './taxonomy';
import type { GlobalParams } from './params';
import type { CellId } from '../theory/rhythm';
import type { FretMark } from '../components/music/Fretboard';

// Uma pergunta separa quatro coisas (C1):
// - conteúdo musical: o que se pergunta (visual, sound);
// - apresentação: como soa (timbre, volume, intervalo, arpejo) — resolvida na hora de tocar, ver
//   src/audio/presentation.ts; a pergunta não decide isso;
// - superfície: onde a pessoa responde (surface), que devolve uma Response estruturada;
// - validação: o que está certo (expected), conferido por src/exercises/validate.ts com
//   equivalência musical (enarmonias, cifras equivalentes, posições com a mesma altura).

export type Visual =
  | { kind: 'staff'; clef: Clef; fifths?: number; columns: Note[][] }
  | { kind: 'keyboard'; lo: number; hi: number; marks: number[] }
  | { kind: 'fretboard'; tuning: readonly number[]; from: number; to: number; marks: FretMark[]; muted?: number[] }
  | { kind: 'ear'; hint?: string }
  | { kind: 'text'; text: string };

/** Resposta estruturada, como a superfície a entrega. É o que a C2 grava em cada tentativa. */
export type Response =
  | { kind: 'option'; id: string }
  /** Uma classe de altura escolhida (opções de nome de nota), sem oitava nem grafia. */
  | { kind: 'pitchClass'; pc: number }
  /** Uma altura tocada (teclado, braço). */
  | { kind: 'pitch'; midi: number }
  /** Uma nota escrita (letras, pauta); oct só quando a superfície define a oitava. */
  | { kind: 'spelled'; letter: number; acc: number; oct?: number }
  /** Uma cifra digitada, em qualquer convenção. */
  | { kind: 'chord'; text: string };

/** O que está certo, em termos musicais. */
export type Expected =
  | { kind: 'option'; id: string }
  /** Classe de altura: qualquer oitava, qualquer grafia (Dó♯ = Ré♭). */
  | { kind: 'pitchClass'; pc: number }
  /** Altura exata, em qualquer grafia ou posição do braço. */
  | { kind: 'pitch'; midi: number }
  /** Grafia exata: letra e acidente (e oitava, se dada). Aqui Dó♯ ≠ Ré♭. */
  | { kind: 'spelled'; letter: number; acc: number; oct?: number }
  /** Acorde: classe de altura da fundamental e qualidade. */
  | { kind: 'chord'; root: number; quality: ChordId };

export interface ChoiceOption {
  id: string;
  label: string;
  rhythm?: CellId[][];
  /** O que a opção significa, quando a conferência é musical (ex.: a cifra); sem isso, vale o id. */
  value?: Response;
}

/** Onde a pessoa responde. */
export type Surface =
  | { kind: 'choices'; options: ChoiceOption[]; wide?: boolean }
  | { kind: 'letters'; accidentals: boolean }
  | { kind: 'keyboard'; lo: number; hi: number }
  | { kind: 'fretboard'; tuning: readonly number[]; from: number; to: number; onlyString?: number }
  | { kind: 'staff'; clef: Clef; accidentals: boolean };

/** Conteúdo sonoro: só as notas. Como elas soam fica com a apresentação. */
export interface SoundContent {
  groups: number[][]; // grupos de alturas MIDI, em sequência; as notas de um grupo são simultâneas
  drums?: number[]; // ataques, em tempos (para ritmo)
  /** De que instrumento é o som, para usar o timbre escolhido para ele. Sem isso, piano. */
  instrument?: Instrument;
}

export interface Question {
  prompt: string;
  visual: Visual;
  surface: Surface;
  expected: Expected;
  sound?: SoundContent; // tocado ao mostrar (ouvido) ou ao responder (visual)
  autoplay?: boolean;
  reveal: string; // a resposta certa, por extenso
}

export type SettingValue = string | string[] | boolean | number;
export interface Setting {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'toggle' | 'range';
  options?: { id: string; label: string }[];
  /** Para 'range': limites, passo e como mostrar o valor (ex.: v => `${v} s`). */
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  /** Se a configuração muda só como o som é tocado, diz o que ela muda na apresentação. */
  present?: (v: SettingValue) => Partial<Presentation>;
}
/** O que um exercício precisa saber para montar a pergunta no idioma e no contexto da pessoa. */
export interface Ctx {
  naming: Naming;
  conv: Convention;
  t: Translate;
  /** Parâmetros globais: instrumento, afinação, tonalidade, região, andamento… (ver params.ts). */
  params: GlobalParams;
}

export type GroupId = 'pauta' | 'teclado' | 'braco' | 'ouvido' | 'teoria' | 'ritmo';

// Título e descrição ficam nos textos de cada idioma (exercises.<id> em src/i18n; ver itemText).
// O id é o exercise_id estável: rotinas, tentativas e configurações salvas apontam para ele, então
// nunca muda (taxonomy.test.ts trava a lista). Módulo e etiquetas: ver src/exercises/taxonomy.ts.
export interface ExerciseDef extends Classification {
  id: string;
  group: GroupId;
  /** Dá para fazer sem o instrumento (no ônibus, por exemplo). */
  mobile: boolean;
  settings: (ctx: Ctx) => Setting[];
  defaults: Record<string, SettingValue>;
  /** Apresentação própria do exercício (ex.: intervalo maior entre notas), por cima da global. */
  presentation?: Partial<Presentation>;
  make: (s: Record<string, SettingValue>, ctx: Ctx) => Question;
}

export interface ToolDef {
  id: string;
  /** Onde a ferramenta mora no catálogo. */
  primaryModule: ModuleId;
  mobile: boolean;
  path: string;
}
