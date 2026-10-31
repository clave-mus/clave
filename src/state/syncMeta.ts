// Metadados e regras da sincronização (B2), em funções puras — o motor (src/sync/engine.ts) só
// orquestra. Ver docs/sincronizacao.md.
//
// Duas famílias de dado:
// - documentos "o mais recente vence": perfil, preferências, parâmetros, paleta, configurações de
//   cada exercício e a base de totais de antes da C2 de cada aparelho. Cada um tem o carimbo da
//   última edição feita NESTE aparelho (meta.updated), posto automaticamente por stampChanges;
// - registros que somam: tentativas, confiança e histórico. Entram uma vez só pela chave, de onde
//   vierem, e nunca são apagados por conflito (só por "apagar meu progresso", ver resetBefore).
import type { Activity, Stat, State } from './store';
import { newId } from './attempts';

/** Posição de leitura no servidor: hora em que a linha entrou lá (texto exato devolvido pelo
 *  Postgres, com microssegundos) e id, para desempatar linhas que entraram juntas. */
export interface Cursor {
  at: string;
  id: string;
}

export interface SyncMeta {
  /** Identifica este navegador; nomeia a base de totais de antes da C2 ('legacy:<id>'). */
  deviceId: string;
  /** Conta com que os dados deste aparelho foram sincronizados; null = ainda de ninguém. */
  owner: string | null;
  /** Carimbo (ms) da última edição local de cada documento. Sem carimbo = nunca editado aqui:
   *  perde para qualquer versão do servidor. 0 = editado antes de a B2 existir. */
  updated: Record<string, number>;
  /** Maior `at` já enviado de cada registro (o envio relê uma margem antes disso). */
  pushed: { attempts: number; feedback: number; history: number };
  /** Até onde já leu do servidor. */
  pulled: { attempts: Cursor | null; feedback: Cursor | null; history: Cursor | null };
  /** Último "apagar meu progresso" aplicado aqui (ms). Tudo de antes disso não volta. */
  resetAt: number;
  /** Base de totais de antes da C2 vinda dos outros aparelhos da conta, por aparelho. */
  otherLegacy: Record<string, Record<string, Stat>>;
}

export const HISTORY_CAP = 500;
const SETTINGS = 'settings:';
const LEGACY = 'legacy:';
export const RESET_KEY = 'reset';

export const legacyKey = (deviceId: string) => LEGACY + deviceId;
export const isLegacyKey = (key: string) => key.startsWith(LEGACY);
export const legacyDevice = (key: string) => key.slice(LEGACY.length);

function freshMeta(deviceId = newId()): SyncMeta {
  return {
    deviceId,
    owner: null,
    updated: {},
    pushed: { attempts: 0, feedback: 0, history: 0 },
    pulled: { attempts: null, feedback: null, history: null },
    resetAt: 0,
    otherLegacy: {},
  };
}

/** Os documentos "o mais recente vence" do estado, pela chave usada no servidor. */
export function docsOf(s: State): Record<string, unknown> {
  const out: Record<string, unknown> = {
    profile: s.profile,
    prefs: { locale: s.locale, naming: s.naming, sound: s.sound },
    params: s.params,
    palette: s.arsenal,
  };
  for (const [id, v] of Object.entries(s.settings)) out[SETTINGS + id] = v;
  if (s.legacyStats && s.sync) out[legacyKey(s.sync.deviceId)] = s.legacyStats;
  return out;
}

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Põe um documento vindo do servidor no estado. Chave desconhecida (de uma versão mais nova do
 *  app) é ignorada, não apagada. */
export function applyDoc(s: State, key: string, value: unknown, defaults: State): State {
  if (key === 'profile') return { ...s, profile: { ...defaults.profile, ...(value as Partial<State['profile']>) } };
  if (key === 'prefs') {
    const p = value as Partial<Pick<State, 'locale' | 'naming' | 'sound'>>;
    return { ...s, locale: p.locale ?? null, naming: p.naming ?? null, sound: p.sound ?? defaults.sound };
  }
  if (key === 'params') return { ...s, params: value as State['params'] };
  if (key === 'palette') return { ...s, arsenal: value as string[] };
  if (key.startsWith(SETTINGS)) return { ...s, settings: { ...s.settings, [key.slice(SETTINGS.length)]: value as State['settings'][string] } };
  if (s.sync && key === legacyKey(s.sync.deviceId)) return { ...s, legacyStats: value as Record<string, Stat> };
  return s;
}

/** Volta um documento ao valor padrão (usado por "apagar meu progresso"). */
function resetDoc(s: State, key: string, defaults: State): State {
  if (key.startsWith(SETTINGS)) {
    const settings = { ...s.settings };
    delete settings[key.slice(SETTINGS.length)];
    return { ...s, settings };
  }
  if (isLegacyKey(key)) return s;
  return applyDoc(s, key, docsOf(defaults)[key], defaults);
}

/** Depois de uma edição local, carimba os documentos que mudaram. Edições que vêm da
 *  sincronização não passam por aqui (já chegam com o carimbo do servidor). */
export function stampChanges(prev: State, next: State, now: number): State {
  if (!next.sync) return next;
  const before = docsOf(prev);
  let updated: Record<string, number> | null = null;
  for (const [key, value] of Object.entries(docsOf(next))) {
    if (same(before[key], value)) continue;
    (updated ??= { ...next.sync.updated })[key] = now;
  }
  return updated ? { ...next, sync: { ...next.sync, updated } } : next;
}

/** Metadados para um estado que ainda não tinha (primeira vez com a B2, ou aparelho novo). O que já
 *  foi mudado em relação ao padrão ganha carimbo 0: existe e vai para a conta, mas perde para
 *  qualquer edição feita depois em outro aparelho. */
export function initialMeta(s: State, defaults: State): SyncMeta {
  const meta = freshMeta();
  const base = docsOf(defaults);
  for (const [key, value] of Object.entries(docsOf({ ...s, sync: meta }))) {
    if (!same(base[key], value)) meta.updated[key] = 0;
  }
  return meta;
}

export type Decision = 'push' | 'pull' | 'none';

/** Quem fica com um documento. Empate de carimbo com valores diferentes: o servidor decide, para
 *  que todos os aparelhos acabem iguais. */
export function decide(localAt: number | undefined, remoteAt: number | undefined, localValue: unknown, remoteValue: unknown): Decision {
  if (remoteAt === undefined) return localAt !== undefined && localValue !== undefined ? 'push' : 'none';
  if (localAt === undefined || remoteAt > localAt) return same(localValue, remoteValue) ? 'none' : 'pull';
  if (localAt > remoteAt) return 'push';
  return same(localValue, remoteValue) ? 'none' : 'pull';
}

export const historyKey = (h: Pick<Activity, 'at' | 'id'>) => `${h.at}|${h.id}`;

/** Junta o histórico local com o que veio do servidor: sem repetir, do mais novo para o mais
 *  antigo, nos HISTORY_CAP mais recentes (o servidor guarda tudo). */
export function mergeHistory(local: Activity[], incoming: Activity[], cap = HISTORY_CAP): Activity[] {
  const seen = new Map<string, Activity>();
  for (const h of [...local, ...incoming]) if (!seen.has(historyKey(h))) seen.set(historyKey(h), h);
  return [...seen.values()].sort((a, b) => b.at - a.at).slice(0, cap);
}

/** Aplica "apagar meu progresso" feito no instante `at`: some tudo o que é de antes — histórico,
 *  bases de antes da C2, documentos editados até ali (voltam ao padrão). O que foi feito depois
 *  (num aparelho que estava offline, por exemplo) fica. As tentativas saem à parte, no registro. */
export function resetBefore(s: State, at: number, defaults: State): State {
  const meta = s.sync ?? freshMeta();
  let next: State = { ...s, history: s.history.filter(h => h.at > at), legacyStats: {}, stats: {} };
  const updated: Record<string, number> = {};
  const keys = new Set([...Object.keys(docsOf(s)), ...Object.keys(docsOf(defaults))]);
  for (const key of keys) {
    const t = meta.updated[key];
    if (t !== undefined && t > at) updated[key] = t;
    else next = resetDoc(next, key, defaults);
  }
  return { ...next, sync: { ...meta, updated, resetAt: Math.max(meta.resetAt, at), otherLegacy: {} } };
}

/** Estado de um aparelho que deixa de ter os dados de uma conta: tudo volta ao padrão (o progresso
 *  está na conta), mas o aparelho continua o mesmo. A sessão em curso, se houver, fica. */
export function wipeLocal(s: State, defaults: State): State {
  return { ...defaults, account: s.account, sync: freshMeta(s.sync?.deviceId) };
}

/** Desliga os dados deste aparelho da conta (conta apagada): ficam aqui, sem dono, e entram por
 *  inteiro numa conta nova. */
export function detachFromAccount(s: State): State {
  const meta = s.sync ?? freshMeta();
  return { ...s, ageGroup: null, sync: { ...freshMeta(meta.deviceId), updated: meta.updated } };
}

/** Garante os metadados (estado salvo antes da B2). */
export function withMeta(s: State, defaults: State): State {
  return s.sync ? s : { ...s, sync: initialMeta(s, defaults) };
}
