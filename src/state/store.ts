// Estado do usuário, salvo no navegador (localStorage). Com conta, src/sync/ o mantém igual ao da
// conta (B2); sem conta, tudo fica só aqui.
import { useSyncExternalStore } from 'react';
import type { GoalId, Instrument } from '../data/modules';
import type { ModuleId } from '../exercises/taxonomy';
import type { Naming } from '../theory/core';
import type { SettingValue } from '../exercises/types';
import type { StoredParams } from '../exercises/params';
import type { AgeGroup } from './age';
import { migrateSaved } from './migrate';
import { attemptLog } from './attemptLog';
import { aggregateStats, mergeStats, subtractStats, type Totals } from './attempts';
import { resetBefore, stampChanges, withMeta, type SyncMeta } from './syncMeta';
import type { Locale } from '../i18n';

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
export interface Activity {
  at: number;
  id: string; // exercício ou ferramenta
  title: string;
  module: ModuleId;
  seconds: number;
  correct?: number;
  total?: number;
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
  /** Parâmetros globais escolhidos pela pessoa (ver src/exercises/params.ts). */
  params: StoredParams;
  account: Account | null;
  // Guardado para não perguntar a data de nascimento de novo; a data em si nunca fica aqui
  // (fica só no servidor, e só para quem tem conta — ver src/state/age.ts).
  ageGroup: AgeGroup | null;
  /** Sincronização com a conta (ver src/state/syncMeta.ts). Criado ao carregar. */
  sync?: SyncMeta;
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
    if (!raw) return withMeta(DEFAULT_STATE, DEFAULT_STATE);
    const parsed = migrateSaved(JSON.parse(raw)) as Partial<State>;
    return withMeta({ ...DEFAULT_STATE, ...parsed, profile: { ...DEFAULT_STATE.profile, ...parsed.profile } }, DEFAULT_STATE);
  } catch {
    return withMeta(DEFAULT_STATE, DEFAULT_STATE);
  }
}

let state: State = load();
const listeners = new Set<() => void>();
const changeListeners = new Set<(fromSync: boolean) => void>();

export function getState() {
  return state;
}
/** Muda o estado. Edição local carimba os documentos que mudaram; `fromSync` é para o que vem da
 *  conta, que já chega com o carimbo de lá. */
export function setState(fn: (s: State) => State, opts: { fromSync?: boolean } = {}) {
  const prev = state;
  state = opts.fromSync ? fn(prev) : stampChanges(prev, fn(prev), Date.now());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sem armazenamento: segue só em memória */
  }
  listeners.forEach(l => l());
  changeListeners.forEach(l => l(!!opts.fromSync));
}
/** Avisa a cada mudança de estado, dizendo se ela veio da sincronização. */
export function onStateChange(fn: (fromSync: boolean) => void): () => void {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
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
  setState(s => withStats(s, derived));
}
/** Totais = base de antes da C2 deste aparelho + a dos outros aparelhos da conta + tentativas. */
export function withStats(s: State, derived: Record<string, Totals>): State {
  const legacy = s.legacyStats ?? subtractStats(s.stats, derived);
  const others = Object.values(s.sync?.otherLegacy ?? {}).reduce(mergeStats, {});
  return { ...s, legacyStats: legacy, stats: mergeStats(mergeStats(legacy, others), derived) };
}
/** Apaga o progresso deste aparelho: tudo o que foi feito até `at` some (ver resetBefore), inclusive
 *  o registro de tentativas. Sessão e faixa etária ficam. Com conta, use resetProgress (src/sync),
 *  que apaga também da conta e avisa os outros aparelhos. */
export async function resetAll(at = Date.now()) {
  setState(s => resetBefore(s, at, DEFAULT_STATE), { fromSync: true });
  await attemptLog().removeBefore(at);
  await rebuildStats();
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
/** Dias seguidos com alguma atividade, contando até hoje (ou ontem). */
export function streakDays(history: Activity[]) {
  const days = new Set(history.map(h => dayKey(h.at)));
  let n = 0;
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export function minutesByModule(history: Activity[], sinceDays = 30) {
  const since = Date.now() - sinceDays * 864e5;
  const out: Partial<Record<ModuleId, number>> = {};
  history.filter(h => h.at >= since).forEach(h => (out[h.module] = (out[h.module] ?? 0) + h.seconds / 60));
  return out;
}
