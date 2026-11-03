import type { ComponentType } from 'react';
import type { Instrument } from '../data/modules';
import type { ChordId, Clef, Convention, Naming, Note } from '../theory/core';
import type { Translate } from '../i18n';
import type { Presentation } from '../audio/presentation';
import type { Classification } from './taxonomy';
import type { GlobalParams } from './params';
import type { CellId } from '../theory/rhythm';
import type { FretMark } from '../components/music/Fretboard';

// Uma pergunta separa quatro coisas (C1):
// - conteúdo musical: o que se pergunta (visual, sound);
// - apresentação: como soa (timbre, volume, intervalo, arpejo) — resolvida na hora de tocar, ver
//   src/audio/presentation.ts; a pergunta não decide isso;
// - superfície: onde a pessoa responde (surface), que devolve uma Response estruturada;
// - validação: o que está certo (expected), conferido por src/catalog/validate.ts com
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

/** Uma opção de uma configuração de lista. */
export interface SettingOption {
  id: string;
  label: string;
  /**
   * Dica de dificuldade relativa, só para a variação automática PRÉ-MARCAR o que costuma ser o
   * próximo passo (F2-2, decisão 9). `1` costuma vir primeiro.
   *
   * **Nunca ordena, nunca bloqueia, nunca esconde.** Ausente quer dizer "sem opinião", e é o caso
   * da maioria: não existe "clave de sol mais fácil que clave de fá". Forçar uma ordem onde ela
   * não existe é erro pedagógico — por isso o app abre o menu inteiro e só sugere.
   */
  tier?: 1 | 2 | 3;
}

export interface Setting {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'toggle' | 'range';
  options?: SettingOption[];
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

/**
 * Tipo de término da etapa (decisão 5). É propriedade do item, não configuração — e determina
 * o executor **e** o que aquela etapa consegue afirmar:
 *
 * - `serie`    termina em N perguntas (ou no tempo) → produz EVIDÊNCIA validada
 * - `ambiente` termina quando a pessoa para          → produz ATIVIDADE, sem nota
 * - `tarefa`   termina na autoavaliação da pessoa    → produz AUTOAVALIAÇÃO, nunca acerto
 */
export type Termination = 'serie' | 'ambiente' | 'tarefa';

/**
 * O que a tela de um item do tipo `ambiente` ou `tarefa` recebe. Tudo opcional: cada tela usa o
 * que lhe serve e ignora o resto. Quando a F1-3 levar as configurações das telas para o catálogo,
 * isto encolhe para um objeto de parâmetros resolvidos.
 */
export interface ScreenProps {
  /** Tempo sugerido da etapa, quando o item roda dentro de uma rotina. */
  goalMinutes?: number;
  /** Versão reduzida, para caber dentro de outra tela. */
  compact?: boolean;
  onRunning?: (running: boolean) => void;
  presetId?: string;
}

// Título e descrição ficam nos textos de cada idioma (exercises.<id> e tools.<id> em src/i18n;
// ver itemText). O id é estável: rotinas, tentativas e configurações salvas apontam para ele,
// então nunca muda (taxonomy.test.ts trava a lista). Etiquetas: ver src/catalog/taxonomy.ts.
//
// Exercício e ferramenta são O MESMO TIPO (decisão 17): registro unificado, tela separada quando
// precisa. Assim o braço virtual não tem duas implementações, e uma ferramenta entra numa etapa
// de rotina sem nenhum caso especial no código.
export interface CatalogItem extends Classification {
  id: string;
  kind: Termination;
  /** Dá para fazer sem o instrumento (no ônibus, por exemplo). Vira `requires` na F1-3. */
  mobile: boolean;
  settings: (ctx: Ctx) => Setting[];
  defaults: Record<string, SettingValue>;
  /** Apresentação própria do item (ex.: intervalo maior entre notas), por cima da global. */
  presentation?: Partial<Presentation>;
  /** Só em `kind: 'serie'`: sorteia a pergunta. Quem renderiza e corrige é o Player. */
  make?: (s: Record<string, SettingValue>, ctx: Ctx) => Question;
  /** Só em `ambiente` e `tarefa`: tela própria, carregada sob demanda. */
  screen?: () => Promise<{ default: ComponentType<ScreenProps> }>;
}

/** Um item que o Player sabe rodar: tem `make`. */
export type SeriesItem = CatalogItem & { make: NonNullable<CatalogItem['make']> };
export const isSeries = (i: CatalogItem): i is SeriesItem => typeof i.make === 'function';
