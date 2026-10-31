// Quando sincronizar (B2). Com conta: ao entrar, ao abrir/voltar para o app, quando a internet volta,
// alguns segundos depois de cada mudança local e a cada 5 minutos com o app aberto. Uma rodada por
// vez; o que chega durante uma rodada dispara outra logo depois. Sem conta, nada daqui roda.
import { useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import { attemptLog, onAttemptSaved } from '../state/attemptLog';
import { DEFAULT_STATE, getState, onStateChange, rebuildStats, resetAll, setState } from '../state/store';
import { RESET_KEY, detachFromAccount, wipeLocal } from '../state/syncMeta';
import { syncOnce, type LocalSide } from './engine';
import { supabaseRemote, type SyncRemote } from './remote';

export type SyncState = 'off' | 'syncing' | 'ok' | 'offline' | 'error';
export interface SyncStatus {
  state: SyncState;
  /** Fim da última rodada que deu certo (ms). */
  at: number | null;
}

const DEBOUNCE = 4000;
const PERIOD = 5 * 60_000;

const storeSide: LocalSide = {
  get: getState,
  apply: fn => setState(fn, { fromSync: true }),
  get log() { return attemptLog(); },
  rebuild: rebuildStats,
  defaults: DEFAULT_STATE,
};

let active: { userId: string; remote: SyncRemote } | null = null;
let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let status: SyncStatus = { state: 'off', at: null };
const statusListeners = new Set<() => void>();

function setStatus(s: SyncStatus) {
  status = s;
  statusListeners.forEach(l => l());
}
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(l => { statusListeners.add(l); return () => statusListeners.delete(l); }, () => status);
}

const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/** Roda uma rodada agora (ou espera a que está rodando e roda mais uma). Rejeita se a última falhar. */
export function syncNow(): Promise<void> {
  if (!active) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    let failure: unknown = null;
    do {
      again = false;
      const current = active;
      if (!current) break;
      setStatus({ ...status, state: 'syncing' });
      try {
        await syncOnce(storeSide, current.remote, current.userId);
        failure = null;
        setStatus({ state: 'ok', at: Date.now() });
      } catch (err) {
        failure = err;
        setStatus({ ...status, state: offline() ? 'offline' : 'error' });
      }
    } while (again && active);
    if (failure) throw failure;
  })().finally(() => { running = null; });
  return running;
}

const background = () => { syncNow().catch(err => console.warn('Sincronização adiada:', err)); };
function schedule() {
  if (!active) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; background(); }, DEBOUNCE);
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  onStateChange(fromSync => { if (!fromSync) schedule(); });
  onAttemptSaved(schedule);
  if (typeof window !== 'undefined') {
    window.addEventListener('online', background);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') background(); });
    setInterval(() => { if (document.visibilityState === 'visible') background(); }, PERIOD);
  }
}

/** Liga a sincronização para esta conta (chamado ao entrar ou ao abrir o app já logado). */
export function startSync(userId: string) {
  if (!supabase || active?.userId === userId) return;
  active = { userId, remote: supabaseRemote(supabase, userId) };
  wire();
  background();
}

export function stopSync() {
  active = null;
  if (timer) clearTimeout(timer);
  timer = null;
  setStatus({ state: 'off', at: null });
}

/** Antes de sair: tudo precisa estar na conta, porque o aparelho é limpo em seguida. Rejeita se não
 *  der para salvar (sem internet, por exemplo) — aí não sai. */
export async function flushBeforeSignOut() {
  await syncNow();
}

/** Depois de sair: o progresso está na conta e sai deste aparelho. */
export async function clearAfterSignOut() {
  stopSync();
  setState(s => ({ ...wipeLocal(s, DEFAULT_STATE), account: null }), { fromSync: true });
  await attemptLog().clear();
  await rebuildStats();
}

/** Conta apagada: os dados deste aparelho ficam aqui, sem dono. */
export function detachAfterDelete() {
  stopSync();
  setState(detachFromAccount, { fromSync: true });
}

/** "Apagar meu progresso". Com conta, apaga na conta primeiro (precisa de internet) e deixa o aviso
 *  para os outros aparelhos apagarem o que tiverem de antes deste instante. */
export async function resetProgress() {
  const at = Date.now();
  if (active) {
    await active.remote.deleteProgress();
    await active.remote.pushDocs([{ key: RESET_KEY, value: { at }, updatedAt: at }]);
  }
  await resetAll(at);
}
