// Registro de tentativas (C2): cada resposta vira um registro imutável com o que foi testado
// (exercício, módulo, etiquetas), o que foi perguntado, os parâmetros em vigor, a resposta
// estruturada, o resultado e o tipo de validação. É o que a análise da Fase 2 vai ler; por isso grava
// tudo desde já (decisão 9) e NÃO mostra nem recomenda nada. Os contadores de store.ts viram cache.
//
// Regras:
// - a análise usa skill_tags, content_tags e validation_type, nunca o nome do exercício;
// - error_code só quando a evidência permite classificar; na dúvida, 'unclassified';
// - um registro gravado nunca muda; a confiança declarada é um registro à parte (AttemptFeedback).
import type { Presentation } from '../audio/presentation';
import type { Expected, Question, Response, SettingValue } from '../catalog/types';
import type { GlobalParams, ParametroDePratica } from '../catalog/params';
import { paramsRegistraveis, type ParamsRegistrados } from '../catalog/registro';
import { TAXONOMY_VERSION, type ContentTag, type ModuleId, type SkillTag } from '../catalog/taxonomy';
import { parseChordSymbol } from '../catalog/validate';
import { mod } from '../theory/core';

/** Versão do formato do registro; sobe quando um campo muda de sentido. */
export const ATTEMPT_SCHEMA = 1;

export type Outcome = 'correct' | 'partial' | 'incorrect' | 'self_assessed' | 'unscored';
export type ValidationType = 'deterministic' | 'self_report' | 'none';
/** O que a conferência consegue afirmar sobre o erro, sem adivinhar. */
export type ErrorCode =
  | 'enharmonic_spelling' // a altura certa escrita com outra letra (Ré♭ no lugar de Dó♯)
  | 'octave' // a nota certa na oitava errada
  | 'semitone' // errou por um semitom
  | 'chord_quality' // fundamental certa, qualidade errada
  | 'chord_root' // qualidade certa, fundamental errada
  | 'unclassified';

export interface Attempt {
  schema: number;
  id: string;
  /** Quando a resposta foi dada (ms desde 1970). */
  at: number;
  /** Sessão de prática: um exercício aberto, ou a sessão guiada inteira. */
  session_id: string;
  exercise_id: string;
  primary_module: ModuleId;
  skill_tags: SkillTag[];
  content_tags: ContentTag[];
  taxonomy_version: number;
  /** Idioma em que a pergunta foi feita. */
  locale: string;
  /** O que foi perguntado, de forma estruturada (sem o texto, que depende do idioma). */
  question: {
    surface: Question['surface']['kind'];
    expected: Expected;
    /** Ids das opções oferecidas, na ordem em que apareceram (para analisar distratores). */
    options?: string[];
    /** Notas tocadas (MIDI), em grupos, e ataques de ritmo. */
    notes?: number[][];
    drums?: number[];
  };
  parameters_snapshot: {
    settings: Record<string, SettingValue>;
    params: ParamsRegistrados;
    /** Como o som foi apresentado (sem o volume), quando houve som. */
    presentation?: Omit<Presentation, 'volume'>;
  };
  response: Response;
  outcome: Outcome;
  validation_type: ValidationType;
  /** Só em respostas erradas; null quando certa. */
  error_code: ErrorCode | null;
  /** Do momento em que dava para responder (pergunta na tela, ou fim do primeiro som nos de ouvido) até a resposta. */
  response_time_ms: number;
  /** Pistas usadas. Ainda não há recurso de pista: sempre 0. */
  hints: number;
  /** Quantas vezes a pessoa ouviu de novo antes de responder. */
  repetitions: number;
}

/** Confiança declarada ao fim de uma série de tentativas (pergunta ocasional, opcional). */
export interface AttemptFeedback {
  schema: number;
  id: string;
  at: number;
  session_id: string;
  attempt_ids: string[];
  confidence: 'guess' | 'unsure' | 'sure';
}

/** Id no formato uuid v4: é o tipo da chave no Supabase (attempts.id). */
export const newId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // navegadores sem randomUUID: mesmo formato, com Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// ---------------- classificação do erro ----------------
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const pcOf = (letter: number, acc: number) => mod(NATURAL[mod(letter, 7)] + acc, 12);
const semitoneApart = (a: number, b: number) => mod(a - b, 12) === 1 || mod(b - a, 12) === 1;

/** Classifica um erro só quando a evidência permite; senão 'unclassified'. Não chama para acertos. */
export function classifyError(expected: Expected, r: Response): ErrorCode {
  // alturas
  if (expected.kind === 'spelled' && r.kind === 'spelled') {
    const pe = pcOf(expected.letter, expected.acc), pr = pcOf(r.letter, r.acc);
    const sameSpelling = mod(r.letter, 7) === mod(expected.letter, 7) && r.acc === expected.acc;
    if (sameSpelling && expected.oct !== undefined && r.oct !== undefined && r.oct !== expected.oct) return 'octave';
    if (pe === pr && !sameSpelling) return 'enharmonic_spelling';
    if (semitoneApart(pe, pr)) return 'semitone';
    return 'unclassified';
  }
  if (expected.kind === 'pitch' && r.kind === 'pitch') {
    if (r.midi !== expected.midi && mod(r.midi, 12) === mod(expected.midi, 12)) return 'octave';
    if (Math.abs(r.midi - expected.midi) === 1) return 'semitone';
    return 'unclassified';
  }
  if (expected.kind === 'pitchClass') {
    const pr = r.kind === 'pitch' ? mod(r.midi, 12) : r.kind === 'pitchClass' ? r.pc : r.kind === 'spelled' ? pcOf(r.letter, r.acc) : null;
    return pr !== null && semitoneApart(pr, expected.pc) ? 'semitone' : 'unclassified';
  }
  // acordes
  if (expected.kind === 'chord' && r.kind === 'chord') {
    const c = parseChordSymbol(r.text);
    if (!c) return 'unclassified';
    if (c.root === expected.root && c.quality !== expected.quality) return 'chord_quality';
    if (c.root !== expected.root && c.quality === expected.quality) return 'chord_root';
  }
  return 'unclassified';
}

// ---------------- montar o registro ----------------
export interface AttemptInput {
  exercise: { id: string; primaryModule: ModuleId; skillTags: SkillTag[]; contentTags: ContentTag[] };
  question: Question;
  response: Response;
  correct: boolean;
  sessionId: string;
  locale: string;
  settings: Record<string, SettingValue>;
  params: GlobalParams;
  /** Quais parâmetros de prática o item respeita — só esses vão para o registro. */
  respeita?: readonly ParametroDePratica[];
  presentation?: Presentation;
  responseTimeMs: number;
  repetitions: number;
  at?: number;
}

export function buildAttempt(i: AttemptInput): Attempt {
  const { question: q, params: p } = i;
  // a apresentação só importa quando houve som; o volume fica de fora (não muda o que foi testado)
  let presentation: Omit<Presentation, 'volume'> | undefined;
  if (i.presentation && q.sound) {
    const { volume: _volume, ...rest } = i.presentation;
    void _volume;
    presentation = rest;
  }
  return {
    schema: ATTEMPT_SCHEMA,
    id: newId(),
    at: i.at ?? Date.now(),
    session_id: i.sessionId,
    exercise_id: i.exercise.id,
    primary_module: i.exercise.primaryModule,
    skill_tags: [...i.exercise.skillTags],
    content_tags: [...i.exercise.contentTags],
    taxonomy_version: TAXONOMY_VERSION,
    locale: i.locale,
    question: {
      surface: q.surface.kind,
      expected: q.expected,
      ...(q.surface.kind === 'choices' ? { options: q.surface.options.map(o => o.id) } : {}),
      ...(q.sound?.groups.length ? { notes: q.sound.groups } : {}),
      ...(q.sound?.drums ? { drums: q.sound.drums } : {}),
    },
    parameters_snapshot: {
      settings: { ...i.settings },
      params: paramsRegistraveis(p, i.respeita),
      ...(presentation ? { presentation } : {}),
    },
    response: i.response,
    // todo o catálogo atual confere automaticamente; autoavaliação e "sem nota" chegam com os
    // exercícios de instrumento
    outcome: i.correct ? 'correct' : 'incorrect',
    validation_type: 'deterministic',
    error_code: i.correct ? null : classifyError(q.expected, i.response),
    response_time_ms: Math.max(0, Math.round(i.responseTimeMs)),
    hints: 0,
    repetitions: Math.max(0, i.repetitions),
  };
}

// ---------------- consulta ----------------
export interface AttemptFilter {
  skill?: SkillTag;
  content?: ContentTag;
  module?: ModuleId;
  validation?: ValidationType;
  outcome?: Outcome;
  since?: number;
}

/** Tentativas que batem com o filtro. Usa só as etiquetas gravadas, nunca o nome do exercício. */
export function queryAttempts(list: Attempt[], f: AttemptFilter = {}): Attempt[] {
  return list.filter(a =>
    (!f.skill || a.skill_tags.includes(f.skill)) &&
    (!f.content || a.content_tags.includes(f.content)) &&
    (!f.module || a.primary_module === f.module) &&
    (!f.validation || a.validation_type === f.validation) &&
    (!f.outcome || a.outcome === f.outcome) &&
    (!f.since || a.at >= f.since));
}

export interface Coverage {
  attempts: number;
  byValidation: Partial<Record<ValidationType, number>>;
  byOutcome: Partial<Record<Outcome, number>>;
}

/** Quais habilidades e conteúdos foram testados, quantas vezes e com que tipo de validação.
 *  É contagem do que aconteceu, não diagnóstico: nada aqui diz se a pessoa sabe ou não. */
export function coverage(list: Attempt[]): { skills: Partial<Record<SkillTag, Coverage>>; contents: Partial<Record<ContentTag, Coverage>> } {
  const skills: Partial<Record<SkillTag, Coverage>> = {};
  const contents: Partial<Record<ContentTag, Coverage>> = {};
  const add = <K extends string>(map: Partial<Record<K, Coverage>>, key: K, a: Attempt) => {
    const c = (map[key] ??= { attempts: 0, byValidation: {}, byOutcome: {} });
    c.attempts++;
    c.byValidation[a.validation_type] = (c.byValidation[a.validation_type] ?? 0) + 1;
    c.byOutcome[a.outcome] = (c.byOutcome[a.outcome] ?? 0) + 1;
  };
  for (const a of list) {
    a.skill_tags.forEach(t => add(skills, t, a));
    a.content_tags.forEach(t => add(contents, t, a));
  }
  return { skills, contents };
}

// ---------------- confiança declarada ----------------
/** A pergunta de confiança só pode aparecer ao fechar uma série deste tamanho... */
export const CONFIDENCE_SERIES = 10;
/** ...e mesmo assim só às vezes, para nunca virar rotina (uma em cada três séries). */
export const CONFIDENCE_CHANCE = 1 / 3;

/** Ao fechar uma série de respostas, decide se pergunta a confiança. Nunca a cada tentativa. */
export function shouldAskConfidence(answersInSeries: number, random: () => number = Math.random): boolean {
  return answersInSeries >= CONFIDENCE_SERIES && random() < CONFIDENCE_CHANCE;
}

export function buildFeedback(sessionId: string, attemptIds: string[], confidence: AttemptFeedback['confidence'], at = Date.now()): AttemptFeedback {
  return { schema: ATTEMPT_SCHEMA, id: newId(), at, session_id: sessionId, attempt_ids: [...attemptIds], confidence };
}

// ---------------- contadores derivados ----------------
/** Totais por exercício, como as telas usam (acertos, tentativas, última vez). */
export interface Totals {
  attempts: number;
  correct: number;
  last: number;
}

/** Totais a partir das tentativas. Só entram as conferidas automaticamente: autoavaliação não é acerto. */
export function aggregateStats(list: Attempt[]): Record<string, Totals> {
  const out: Record<string, Totals> = {};
  for (const a of list) {
    if (a.validation_type !== 'deterministic') continue;
    const s = (out[a.exercise_id] ??= { attempts: 0, correct: 0, last: 0 });
    s.attempts++;
    if (a.outcome === 'correct') s.correct++;
    s.last = Math.max(s.last, a.at);
  }
  return out;
}

export function mergeStats(a: Record<string, Totals>, b: Record<string, Totals>): Record<string, Totals> {
  const out: Record<string, Totals> = { ...a };
  for (const [id, s] of Object.entries(b)) {
    const p = out[id];
    out[id] = p ? { attempts: p.attempts + s.attempts, correct: p.correct + s.correct, last: Math.max(p.last, s.last) } : { ...s };
  }
  return out;
}

/** O que sobra de `total` tirando `part` (nunca negativo). Serve para separar a base anterior à C2. */
export function subtractStats(total: Record<string, Totals>, part: Record<string, Totals>): Record<string, Totals> {
  const out: Record<string, Totals> = {};
  for (const [id, s] of Object.entries(total)) {
    const p = part[id];
    const attempts = Math.max(0, s.attempts - (p?.attempts ?? 0));
    const correct = Math.min(attempts, Math.max(0, s.correct - (p?.correct ?? 0)));
    if (attempts > 0) out[id] = { attempts, correct, last: s.last };
  }
  return out;
}
