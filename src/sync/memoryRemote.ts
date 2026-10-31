// Servidor em memória com o mesmo comportamento do Supabase que a sincronização depende, para os
// testes (engine.test.ts). Imita supabase/migrations/*: push_state só grava o mais novo; histórico,
// tentativas e confiança ignoram chave repetida; synced_at é a hora da GRAVAÇÃO e é a mesma para
// todas as linhas de uma gravação em lote (como now() no Postgres).
import type { AgeGroup } from '../state/age';
import type { Attempt, AttemptFeedback } from '../state/attempts';
import type { Activity } from '../state/store';
import type { Cursor } from '../state/syncMeta';
import { historyKey } from '../state/syncMeta';
import type { Page, RemoteDoc, SyncRemote } from './remote';

interface Stamped<T> { row: T; synced_at: string; id: string }

export interface MemoryRemote extends SyncRemote {
  docs: Map<string, RemoteDoc>;
  history: Stamped<Activity>[];
  attempts: Stamped<Attempt>[];
  feedback: Stamped<AttemptFeedback>[];
  setAgeGroup(g: AgeGroup | null): void;
  /** Quantas gravações de cada tipo chegaram (para conferir que nada é reenviado à toa). */
  writes: { docs: number; history: number; attempts: number; feedback: number };
}

export function memoryRemote(start = Date.parse('2026-10-31T12:00:00Z')): MemoryRemote {
  let clock = start;
  let seq = 0;
  let age: AgeGroup | null = null;
  const now = () => new Date((clock += 1000)).toISOString();
  const rowId = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
  const docs = new Map<string, RemoteDoc>();
  const history: Stamped<Activity>[] = [];
  const attempts: Stamped<Attempt>[] = [];
  const feedback: Stamped<AttemptFeedback>[] = [];
  const writes = { docs: 0, history: 0, attempts: 0, feedback: 0 };

  function insert<T>(table: Stamped<T>[], rows: T[], key: (r: T) => string, id: (r: T) => string) {
    const at = now(); // uma gravação, uma hora — como now() num mesmo comando
    const seen = new Set(table.map(t => key(t.row)));
    for (const r of rows) {
      if (seen.has(key(r))) continue;
      seen.add(key(r));
      table.push({ row: structuredClone(r), synced_at: at, id: id(r) });
    }
  }
  function page<T>(table: Stamped<T>[], after: Cursor | null, limit: number): Page<T> {
    const gt = (t: Stamped<T>) => !after || t.synced_at > after.at || (t.synced_at === after.at && t.id > after.id);
    const rows = table
      .filter(gt)
      .sort((a, b) => (a.synced_at === b.synced_at ? (a.id < b.id ? -1 : 1) : a.synced_at < b.synced_at ? -1 : 1))
      .slice(0, limit);
    const tail = rows[rows.length - 1];
    return { rows: rows.map(t => structuredClone(t.row)), last: tail ? { at: tail.synced_at, id: tail.id } : null };
  }

  return {
    docs, history, attempts, feedback, writes,
    setAgeGroup(g) { age = g; },
    async pullDocs() { return [...docs.values()].map(d => structuredClone(d)); },
    async pushDocs(list) {
      writes.docs += list.length;
      for (const d of list) {
        const cur = docs.get(d.key);
        if (!cur || cur.updatedAt < d.updatedAt) docs.set(d.key, structuredClone(d));
      }
    },
    async pushHistory(rows) { writes.history += rows.length; insert(history, rows, historyKey, rowId); },
    async pushAttempts(rows) { writes.attempts += rows.length; insert(attempts, rows, a => a.id, a => a.id); },
    async pushFeedback(rows) { writes.feedback += rows.length; insert(feedback, rows, f => f.id, f => f.id); },
    async pullHistory(after, limit) { return page(history, after, limit); },
    async pullAttempts(after, limit) { return page(attempts, after, limit); },
    async pullFeedback(after, limit) { return page(feedback, after, limit); },
    async deleteProgress() {
      history.length = 0;
      attempts.length = 0;
      feedback.length = 0;
      docs.clear();
    },
    async ageGroup() { return age; },
  };
}
