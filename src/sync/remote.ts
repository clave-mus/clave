// O lado do servidor da sincronização. O motor (engine.ts) só fala com esta interface, para dar para
// testar a sincronização inteira contra um servidor em memória (ver engine.test.ts).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgeGroup } from '../state/age';
import type { Attempt, AttemptFeedback } from '../state/attempts';
import type { Activity } from '../state/store';
import type { Cursor } from '../state/syncMeta';

export interface RemoteDoc {
  key: string;
  value: unknown;
  /** Carimbo da edição (ms), vindo do aparelho que editou. */
  updatedAt: number;
}

export interface Page<T> {
  rows: T[];
  /** Posição da última linha da página; null se veio vazia. */
  last: Cursor | null;
}

export interface SyncRemote {
  pullDocs(): Promise<RemoteDoc[]>;
  /** Grava só os documentos mais novos que os do servidor (a decisão final é lá, não aqui). */
  pushDocs(docs: RemoteDoc[]): Promise<void>;
  /** Registros que somam: um id (ou chave) que já existe é ignorado. */
  pushHistory(rows: Activity[]): Promise<void>;
  pushAttempts(rows: Attempt[]): Promise<void>;
  pushFeedback(rows: AttemptFeedback[]): Promise<void>;
  /** O que entrou no servidor depois de `after`, na ordem em que entrou, até `limit` linhas. */
  pullHistory(after: Cursor | null, limit: number): Promise<Page<Activity>>;
  pullAttempts(after: Cursor | null, limit: number): Promise<Page<Attempt>>;
  pullFeedback(after: Cursor | null, limit: number): Promise<Page<AttemptFeedback>>;
  /** Apaga da conta todo o progresso e os documentos (fica só o perfil de cadastro). */
  deleteProgress(): Promise<void>;
  ageGroup(): Promise<AgeGroup | null>;
}

const iso = (ms: number) => new Date(ms).toISOString();
const CHUNK = 500;
const chunks = <T,>(list: T[]) => Array.from({ length: Math.ceil(list.length / CHUNK) }, (_, i) => list.slice(i * CHUNK, (i + 1) * CHUNK));
const MIN_UUID = '00000000-0000-0000-0000-000000000000';

function check<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

type Row = Record<string, unknown> & { synced_at: string; id: string };

export function supabaseRemote(client: SupabaseClient, userId: string): SyncRemote {
  /** Uma página em ordem de chegada: (synced_at, id) maior que o cursor. */
  async function page(table: string, after: Cursor | null, limit: number): Promise<{ rows: Row[]; last: Cursor | null }> {
    let q = client.from(table).select('*').eq('user_id', userId).order('synced_at').order('id').limit(limit);
    if (after) {
      const id = after.id || MIN_UUID;
      q = q.or(`synced_at.gt."${after.at}",and(synced_at.eq."${after.at}",id.gt.${id})`);
    }
    const rows = check(await q) as Row[];
    const tail = rows[rows.length - 1];
    return { rows, last: tail ? { at: tail.synced_at, id: tail.id } : null };
  }
  const strip = ({ user_id: _u, synced_at: _s, ...rest }: Row) => { void _u; void _s; return rest; };

  return {
    async pullDocs() {
      const rows = check(await client.from('user_state').select('key,value,updated_at').eq('user_id', userId)) as { key: string; value: unknown; updated_at: string }[];
      return rows.map(r => ({ key: r.key, value: r.value, updatedAt: Date.parse(r.updated_at) }));
    },
    async pushDocs(docs) {
      for (const part of chunks(docs)) {
        check(await client.rpc('push_state', { docs: part.map(d => ({ key: d.key, value: d.value, updated_at: iso(d.updatedAt) })) }));
      }
    },
    async pushHistory(rows) {
      for (const part of chunks(rows)) {
        check(await client.from('history').upsert(part.map(h => ({
          user_id: userId, at: iso(h.at), exercise_id: h.id, title: h.title, module: h.module,
          seconds: Math.round(h.seconds), correct: h.correct ?? null, total: h.total ?? null,
        })), { onConflict: 'user_id,at,exercise_id', ignoreDuplicates: true }));
      }
    },
    async pushAttempts(rows) {
      for (const part of chunks(rows)) {
        check(await client.from('attempts').upsert(part.map(a => ({ ...a, at: iso(a.at), user_id: userId })), { onConflict: 'id', ignoreDuplicates: true }));
      }
    },
    async pushFeedback(rows) {
      for (const part of chunks(rows)) {
        check(await client.from('attempt_feedback').upsert(part.map(f => ({ ...f, at: iso(f.at), user_id: userId })), { onConflict: 'id', ignoreDuplicates: true }));
      }
    },
    async pullHistory(after, limit) {
      const { rows, last } = await page('history', after, limit);
      return {
        last,
        rows: rows.map(r => {
          const h: Activity = { at: Date.parse(r.at as string), id: r.exercise_id as string, title: r.title as string, module: r.module as Activity['module'], seconds: r.seconds as number };
          if (r.correct !== null) h.correct = r.correct as number;
          if (r.total !== null) h.total = r.total as number;
          return h;
        }),
      };
    },
    async pullAttempts(after, limit) {
      const { rows, last } = await page('attempts', after, limit);
      return { last, rows: rows.map(r => ({ ...strip(r), at: Date.parse(r.at as string) }) as Attempt) };
    },
    async pullFeedback(after, limit) {
      const { rows, last } = await page('attempt_feedback', after, limit);
      return { last, rows: rows.map(r => ({ ...strip(r), at: Date.parse(r.at as string) }) as AttemptFeedback) };
    },
    async deleteProgress() {
      for (const table of ['attempts', 'attempt_feedback', 'history', 'user_state']) {
        check(await client.from(table).delete().eq('user_id', userId));
      }
    },
    async ageGroup() {
      const row = check(await client.from('profiles').select('age_group').eq('user_id', userId).maybeSingle()) as { age_group: AgeGroup | null } | null;
      return row?.age_group ?? null;
    },
  };
}
