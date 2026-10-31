import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, type Activity, type State } from './store';
import { decide, docsOf, initialMeta, mergeHistory, resetBefore, stampChanges, withMeta } from './syncMeta';

const base = (): State => withMeta(DEFAULT_STATE, DEFAULT_STATE);
const act = (at: number, id = 'x'): Activity => ({ at, id, title: id, module: 'theory', seconds: 10 });

describe('carimbo das edições locais', () => {
  it('carimba só o documento que mudou', () => {
    const s = base();
    const next = stampChanges(s, { ...s, sound: false }, 100);
    expect(next.sync!.updated).toEqual({ prefs: 100 });
  });
  it('objeto novo com o mesmo conteúdo não conta como edição', () => {
    const s = base();
    expect(stampChanges(s, { ...s, profile: { ...s.profile } }, 100).sync!.updated).toEqual({});
  });
  it('configuração de cada exercício é um documento à parte', () => {
    const s = base();
    const next = stampChanges(s, { ...s, settings: { 'pauta-nota': { clave: 'fa' } } }, 7);
    expect(next.sync!.updated).toEqual({ 'settings:pauta-nota': 7 });
  });
  it('histórico e totais não são documentos: somam, não carimbam', () => {
    const s = base();
    const next = stampChanges(s, { ...s, history: [act(1)], stats: { x: { attempts: 1, correct: 1, last: 1 } } }, 9);
    expect(next.sync!.updated).toEqual({});
  });
});

describe('estado salvo antes da B2', () => {
  it('o que difere do padrão ganha carimbo 0; o resto fica sem carimbo', () => {
    const meta = initialMeta({ ...DEFAULT_STATE, profile: { ...DEFAULT_STATE.profile, name: 'Ana' } }, DEFAULT_STATE);
    expect(meta.updated).toEqual({ profile: 0 });
    expect(meta.owner).toBeNull();
  });
  it('a base de antes da C2 vira documento deste aparelho', () => {
    const s = withMeta({ ...DEFAULT_STATE, legacyStats: { x: { attempts: 2, correct: 1, last: 1 } } }, DEFAULT_STATE);
    expect(Object.keys(docsOf(s))).toContain(`legacy:${s.sync!.deviceId}`);
  });
});

describe('quem fica com um documento', () => {
  it.each([
    [undefined, undefined, 'a', undefined, 'none'],
    [5, undefined, 'a', undefined, 'push'],
    [undefined, 5, 'a', 'b', 'pull'],
    [3, 5, 'a', 'b', 'pull'],
    [5, 3, 'a', 'b', 'push'],
    [5, 5, 'a', 'a', 'none'],
    [5, 5, 'a', 'b', 'pull'],
    [3, 5, 'a', 'a', 'none'],
  ] as const)('local %s, servidor %s → %s', (localAt, remoteAt, lv, rv, expected) => {
    expect(decide(localAt, remoteAt, lv, rv)).toBe(expected);
  });
});

describe('histórico que soma', () => {
  it('junta sem repetir, do mais novo ao mais antigo', () => {
    expect(mergeHistory([act(3), act(1)], [act(2), act(3)]).map(h => h.at)).toEqual([3, 2, 1]);
  });
  it('mesma hora em exercícios diferentes são duas atividades', () => {
    expect(mergeHistory([act(1, 'a')], [act(1, 'b')])).toHaveLength(2);
  });
  it('guarda no aparelho só as mais recentes', () => {
    expect(mergeHistory(Array.from({ length: 10 }, (_, i) => act(i)), [], 4).map(h => h.at)).toEqual([9, 8, 7, 6]);
  });
});

describe('apagar meu progresso num instante', () => {
  it('volta ao padrão o que foi editado até ali e guarda o que veio depois', () => {
    let s = base();
    s = stampChanges(s, { ...s, profile: { ...s.profile, name: 'Ana' } }, 10);
    s = stampChanges(s, { ...s, sound: false }, 30);
    s = { ...s, history: [act(40), act(5)] };
    const r = resetBefore(s, 20, DEFAULT_STATE);
    expect(r.profile.name).toBe('');
    expect(r.sound).toBe(false);
    expect(r.history.map(h => h.at)).toEqual([40]);
    expect(r.sync!.updated).toEqual({ prefs: 30 });
    expect(r.sync!.resetAt).toBe(20);
  });
  it('mantém a sessão', () => {
    const s = { ...base(), account: { userId: 'u', email: null } };
    expect(resetBefore(s, 1, DEFAULT_STATE).account).toEqual({ userId: 'u', email: null });
  });
});
