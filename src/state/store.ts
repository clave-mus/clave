// Estado do usuário, salvo no navegador (localStorage). Sem login por enquanto:
// a forma dos dados já pensa em subir isso para um servidor depois.
import { useSyncExternalStore } from 'react';
import type { GoalId, Instrument } from '../data/modules';
import type { ModuleId } from '../catalog/taxonomy';
import type { Naming } from '../theory/core';
import type { SettingValue } from '../catalog/types';
import type { GlobalParams, StoredParams } from '../catalog/params';
import type { AgeGroup } from './age';
import { migrateSaved } from './migrate';
import { attemptLog } from './attemptLog';
import { aggregateStats, mergeStats, subtractStats } from './attempts';
import type { Locale } from '../i18n';

export type Theme = 'light' | 'dark';

export interface Profile {
  name: string;
  instrument: Instrument;
  goals: GoalId[];
  onboarded: boolean;
}
export interface Stat {
  attempts: number;
  correct: number;
  last: number;
}
/**
 * Com que configuração a prática rodou (F3-9).
 *
 * Sem isto, "em que tonalidade eu pratiquei isto?" não tem resposta — e é justamente essa pergunta
 * que torna a rotação de parâmetro utilizável (decisão 38). Vale sobretudo para os itens SEM
 * validação, que não geram tentativa nenhuma e por isso não deixariam rastro de conteúdo.
 *
 * Mesma forma do `parameters_snapshot` de uma tentativa (src/state/attempts.ts), de propósito:
 * a análise lê os dois do mesmo jeito.
 */
export interface ActivityParams {
  settings?: Record<string, SettingValue>;
  params?: Pick<GlobalParams, 'instrument' | 'tuning' | 'key' | 'range' | 'tempo' | 'material' | 'clef'>;
}

export interface Activity {
  at: number;
  id: string; // item do catálogo
  title: string;
  module: ModuleId;
  seconds: number;
  correct?: number;
  total?: number;
  /** Ausente nas atividades gravadas antes da F3-9; a tela lida com isso. */
  snapshot?: ActivityParams;
}
/** Sessão da conta (Supabase). Null = sem conta, só localStorage. */
export interface Account {
  userId: string;
  email: string | null;
}
export interface State {
  v: 1;
  profile: Profile;
  /** Idioma escolhido no perfil; null = automático, segue o navegador. */
  locale: Locale | null;
  /** Tema escolhido no perfil; null = automático, segue o sistema (F4-2). */
  theme: Theme | null;
  /** Nome das notas escolhido no perfil; null = segue o idioma. */
  naming: Naming | null;
  sound: boolean;
  /** Totais por exercício: cache para as telas, refeito a partir do registro de tentativas (rebuildStats). */
  stats: Record<string, Stat>;
  /** Totais de antes do registro de tentativas (C2), que não têm tentativas por trás. Calculado uma vez. */
  legacyStats?: Record<string, Stat>;
  history: Activity[];
  arsenal: string[];
  settings: Record<string, Record<string, SettingValue>>;
  /** Parâmetros globais escolhidos pela pessoa (ver src/catalog/params.ts). */
  params: StoredParams;
  account: Account | null;
  // Guardado para não perguntar a data de nascimento de novo; a data em si nunca fica aqui
  // (fica só no servidor, e só para quem tem conta — ver src/state/age.ts).
  ageGroup: AgeGroup | null;
}

const KEY = 'clave:v1';
export const DEFAULT_STATE: State = {
  v: 1,
  profile: {
    name: '',
    instrument: 'violao',
    goals: [],
    onboarded: false,
  },
  locale: null,
  theme: null,
  naming: null,
  sound: true,
  stats: {},
  history: [],
  arsenal: ['pauta-nota', 'ouvido-intervalo', 'braco-nota', 'quiz-teoria'],
  settings: {},
  params: {},
  account: null,
  ageGroup: null,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = migrateSaved(JSON.parse(raw)) as Partial<State>;
    return { ...DEFAULT_STATE, ...parsed, profile: { ...DEFAULT_STATE.profile, ...parsed.profile } };
  } catch {
    return DEFAULT_STATE;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

export function getState() {
  return state;
}
export function setState(fn: (s: State) => State) {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sem armazenamento: segue só em memória */
  }
  listeners.forEach(l => l());
}
export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => select(state),
  );
}
/** Refaz os totais a partir do registro de tentativas (a fonte de verdade) mais a base de antes da C2.
 *  Na primeira vez, o que estava nos totais e não veio do registro vira essa base. */
export async function rebuildStats() {
  const derived = aggregateStats(await attemptLog().all());
  setState(s => {
    const legacy = s.legacyStats ?? subtractStats(s.stats, derived);
    return { ...s, legacyStats: legacy, stats: mergeStats(legacy, derived) };
  });
}
export function resetAll() {
  setState(() => DEFAULT_STATE);
  // "apagar meu progresso" apaga também o registro de tentativas deste aparelho
  attemptLog().clear().catch(err => console.error('Não deu para apagar as tentativas', err));
}

// ---------------- ações ----------------
export function updateProfile(p: Partial<Profile>) {
  setState(s => ({ ...s, profile: { ...s.profile, ...p } }));
}
export function recordAnswer(id: string, correct: boolean) {
  setState(s => {
    const prev = s.stats[id] ?? { attempts: 0, correct: 0, last: 0 };
    return {
      ...s,
      stats: {
        ...s.stats,
        [id]: { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0), last: Date.now() },
      },
    };
  });
}
export function logActivity(a: Omit<Activity, 'at'>) {
  if (a.seconds < 5 && !a.total) return;
  setState(s => ({ ...s, history: [{ ...a, at: Date.now() }, ...s.history].slice(0, 500) }));
}
export function toggleArsenal(id: string) {
  setState(s => ({ ...s, arsenal: s.arsenal.includes(id) ? s.arsenal.filter(x => x !== id) : [...s.arsenal, id] }));
}
export function saveSettings(id: string, values: Record<string, SettingValue>) {
  setState(s => ({ ...s, settings: { ...s.settings, [id]: values } }));
}
export function setAccount(account: Account | null) {
  setState(s => ({ ...s, account }));
}
export function setLocale(locale: Locale | null) {
  setState(s => ({ ...s, locale }));
}
/** Tema claro, escuro, ou null para seguir o sistema. Escreve o atributo que src/index.css lê. */
export function setTheme(theme: Theme | null) {
  setState(s => ({ ...s, theme }));
  applyTheme(theme);
}
export function applyTheme(theme: Theme | null) {
  const el = document.documentElement;
  if (theme) el.setAttribute('data-theme', theme);
  else el.removeAttribute('data-theme');
}
/** Guarda parâmetros globais escolhidos; os timbres se juntam aos já escolhidos, o resto substitui. */
export function setParams(patch: StoredParams) {
  setState(s => ({ ...s, params: { ...s.params, ...patch, ...(patch.timbres ? { timbres: { ...s.params.timbres, ...patch.timbres } } : {}) } }));
}
export function setAgeGroup(ageGroup: AgeGroup | null) {
  setState(s => ({ ...s, ageGroup }));
}

// ---------------- derivados ----------------
export function dayKey(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
// streakDays saiu na F0-2: sequência de dias é mecânica de engajamento, e o Clave não a usa
// (decisão 11). `dayKey` fica, para a contagem de dias praticados sem punição.
export function minutesByModule(history: Activity[], sinceDays = 30) {
  const since = Date.now() - sinceDays * 864e5;
  const out: Partial<Record<ModuleId, number>> = {};
  history.filter(h => h.at >= since).forEach(h => (out[h.module] = (out[h.module] ?? 0) + h.seconds / 60));
  return out;
}
