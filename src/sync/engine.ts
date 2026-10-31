// Uma rodada de sincronização entre este aparelho e a conta (B2). Ver docs/sincronizacao.md.
// O agendamento (quando rodar) está em index.ts; aqui só o "o quê", na ordem:
//   0. dono: dados de outra conta saem antes de qualquer coisa;
//   1. base de antes da C2 calculada antes de entrar qualquer tentativa de fora;
//   2. documentos — primeiro o "apagar meu progresso", depois o mais recente vence;
//   3. histórico, tentativas e confiança: envia o que é daqui, puxa o que entrou no servidor;
//   4. faixa etária (só existe no servidor, no perfil de cadastro);
//   5. refaz os totais se algo mudou.
import type { AttemptLog } from '../state/attemptLog';
import type { State } from '../state/store';
import {
  RESET_KEY, applyDoc, decide, docsOf, isLegacyKey, legacyDevice, legacyKey, mergeHistory, resetBefore, wipeLocal, withMeta,
  type Cursor, type SyncMeta,
} from '../state/syncMeta';
import type { Page, RemoteDoc, SyncRemote } from './remote';

export interface LocalSide {
  get(): State;
  /** Muda o estado sem carimbar como edição local (o que vem daqui já tem carimbo). */
  apply(fn: (s: State) => State): void;
  log: AttemptLog;
  /** Refaz os totais a partir do registro de tentativas (rebuildStats). */
  rebuild(): Promise<void>;
  defaults: State;
}

/** Reenvia os últimos minutos: cobre relógio que voltou e tentativa gravada durante o envio. O
 *  servidor ignora o que já tem, então reenviar não duplica. */
export const PUSH_MARGIN = 10 * 60_000;
/** Relê o último minuto: cobre linha que entrou no servidor com hora um pouco anterior à última lida. */
export const PULL_MARGIN = 60_000;
export const PAGE = 500;

export interface SyncResult {
  pushed: number;
  pulled: number;
}

const meta = (local: LocalSide): SyncMeta => local.get().sync!;
const setMeta = (local: LocalSide, fn: (m: SyncMeta) => SyncMeta) => local.apply(s => ({ ...s, sync: fn(s.sync!) }));

function rewind(c: Cursor | null): Cursor | null {
  if (!c) return null;
  const t = Date.parse(c.at);
  return Number.isNaN(t) ? c : { at: new Date(t - PULL_MARGIN).toISOString(), id: '' };
}

/** Lê do servidor, página por página, tudo o que entrou depois do cursor. */
async function pullAll<T>(fetch: (after: Cursor | null, limit: number) => Promise<Page<T>>, from: Cursor | null, onPage: (rows: T[], last: Cursor) => Promise<void> | void): Promise<number> {
  let after = rewind(from);
  let total = 0;
  for (;;) {
    const page = await fetch(after, PAGE);
    if (page.last) {
      await onPage(page.rows, page.last);
      after = page.last;
      total += page.rows.length;
    }
    if (page.rows.length < PAGE) return total;
  }
}

export async function syncOnce(local: LocalSide, remote: SyncRemote, userId: string): Promise<SyncResult> {
  let pushed = 0, pulled = 0, statsDirty = false;
  if (!local.get().sync) local.apply(s => withMeta(s, local.defaults));

  // 0. dono
  const owner = meta(local).owner;
  if (owner && owner !== userId) {
    local.apply(s => wipeLocal(s, local.defaults));
    await local.log.clear();
    statsDirty = true;
  }
  if (meta(local).owner !== userId) setMeta(local, m => ({ ...m, owner: userId }));

  // 1. base de antes da C2
  if (local.get().legacyStats === undefined) await local.rebuild();

  // 2. documentos
  const remoteDocs = new Map((await remote.pullDocs()).map(d => [d.key, d]));
  const reset = remoteDocs.get(RESET_KEY);
  if (reset && reset.updatedAt > meta(local).resetAt) {
    local.apply(s => resetBefore(s, reset.updatedAt, local.defaults));
    await local.log.removeBefore(reset.updatedAt);
    statsDirty = true;
  }
  const { resetAt, deviceId } = meta(local);
  const own = legacyKey(deviceId);
  const docs = docsOf(local.get());
  const toPush: RemoteDoc[] = [];
  const toPull: RemoteDoc[] = [];
  const others: SyncMeta['otherLegacy'] = {};
  for (const key of new Set([...Object.keys(docs), ...remoteDocs.keys()])) {
    if (key === RESET_KEY) continue;
    // documento que sobrou de antes de um "apagar meu progresso" não vale (resetAt 0 = nunca houve;
    // aí vale até o carimbo 0, dos dados de antes da B2)
    const r = remoteDocs.get(key);
    const remoteDoc = r && (resetAt === 0 || r.updatedAt > resetAt) ? r : undefined;
    if (isLegacyKey(key) && key !== own) {
      if (remoteDoc) others[legacyDevice(key)] = remoteDoc.value as SyncMeta['otherLegacy'][string];
      continue;
    }
    const localAt = meta(local).updated[key];
    const d = decide(localAt, remoteDoc?.updatedAt, docs[key], remoteDoc?.value);
    if (d === 'push') toPush.push({ key, value: docs[key], updatedAt: localAt! });
    if (d === 'pull') toPull.push(remoteDoc!);
  }
  if (JSON.stringify(others) !== JSON.stringify(meta(local).otherLegacy)) {
    setMeta(local, m => ({ ...m, otherLegacy: others }));
    statsDirty = true;
  }
  if (toPull.length) {
    local.apply(s => {
      let next = s;
      for (const d of toPull) next = applyDoc(next, d.key, d.value, local.defaults);
      const updated = { ...next.sync!.updated };
      for (const d of toPull) updated[d.key] = d.updatedAt;
      return { ...next, sync: { ...next.sync!, updated } };
    });
    pulled += toPull.length;
  }
  if (toPush.length) {
    await remote.pushDocs(toPush);
    pushed += toPush.length;
  }

  // 3a. histórico
  {
    const since = Math.max(meta(local).pushed.history - PUSH_MARGIN, resetAt);
    const out = local.get().history.filter(h => h.at > since);
    if (out.length) {
      await remote.pushHistory(out);
      const max = Math.max(...out.map(h => h.at));
      setMeta(local, m => ({ ...m, pushed: { ...m.pushed, history: Math.max(m.pushed.history, max) } }));
      pushed += out.length;
    }
    pulled += await pullAll((after, n) => remote.pullHistory(after, n), meta(local).pulled.history, (rows, last) => {
      const fresh = rows.filter(h => h.at > meta(local).resetAt);
      local.apply(s => ({ ...s, history: mergeHistory(s.history, fresh), sync: { ...s.sync!, pulled: { ...s.sync!.pulled, history: last } } }));
    });
  }

  // 3b. tentativas e confiança
  {
    const since = (cursor: number) => Math.max(cursor - PUSH_MARGIN, resetAt);
    const { attempts: pa, feedback: pf } = meta(local).pushed;
    const outA = (await local.log.all()).filter(a => a.at > since(pa));
    const outF = (await local.log.feedback()).filter(f => f.at > since(pf));
    if (outA.length) await remote.pushAttempts(outA);
    if (outF.length) await remote.pushFeedback(outF);
    if (outA.length || outF.length) {
      const maxA = Math.max(pa, ...outA.map(a => a.at));
      const maxF = Math.max(pf, ...outF.map(f => f.at));
      setMeta(local, m => ({ ...m, pushed: { ...m.pushed, attempts: maxA, feedback: maxF } }));
      pushed += outA.length + outF.length;
    }
    const a = await pullAll((after, n) => remote.pullAttempts(after, n), meta(local).pulled.attempts, async (rows, last) => {
      await local.log.putMany(rows.filter(r => r.at > meta(local).resetAt), []);
      setMeta(local, m => ({ ...m, pulled: { ...m.pulled, attempts: last } }));
    });
    const f = await pullAll((after, n) => remote.pullFeedback(after, n), meta(local).pulled.feedback, async (rows, last) => {
      await local.log.putMany([], rows.filter(r => r.at > meta(local).resetAt));
      setMeta(local, m => ({ ...m, pulled: { ...m.pulled, feedback: last } }));
    });
    pulled += a + f;
    if (a) statsDirty = true;
  }

  // 4. faixa etária
  if (local.get().ageGroup === null) {
    const group = await remote.ageGroup();
    if (group) local.apply(s => ({ ...s, ageGroup: group }));
  }

  // 5. totais
  if (statsDirty) await local.rebuild();
  return { pushed, pulled };
}
