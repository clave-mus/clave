// Sincronização de ponta a ponta: aparelhos simulados contra um servidor em memória que se comporta
// como o Supabase (ver memoryRemote.ts). Cada "aparelho" reproduz o store: edição local carimba os
// documentos; o que vem da sincronização entra sem carimbo novo.
import { describe, expect, it } from 'vitest';
import { memoryLog } from '../state/attemptLog';
import { aggregateStats, type Attempt } from '../state/attempts';
import { DEFAULT_STATE, withStats, type Activity, type State } from '../state/store';
import { RESET_KEY, resetBefore, stampChanges, withMeta } from '../state/syncMeta';
import { PAGE, syncOnce, type LocalSide } from './engine';
import { memoryRemote, type MemoryRemote } from './memoryRemote';

const USER = 'user-1';

interface Device extends LocalSide {
  /** Edição local, como setState do store, no instante `now`. */
  edit(fn: (s: State) => State, now: number): void;
  answer(id: string, exercise: string, at: number, correct?: boolean): Promise<void>;
  study(exercise: string, at: number, seconds?: number): void;
  sync(user?: string): ReturnType<typeof syncOnce>;
  attemptIds(): Promise<string[]>;
}

function device(remote: MemoryRemote, initial: Partial<State> = {}): Device {
  let state: State = withMeta({ ...DEFAULT_STATE, ...initial }, DEFAULT_STATE);
  const log = memoryLog();
  const d: Device = {
    defaults: DEFAULT_STATE,
    log,
    get: () => state,
    apply: fn => { state = fn(state); },
    edit: (fn, now) => { state = stampChanges(state, fn(state), now); },
    // como rebuildStats: edição local (a base de antes da C2 ganha carimbo na primeira vez)
    rebuild: async () => { const derived = aggregateStats(await log.all()); d.edit(s => withStats(s, derived), 1); },
    // como o Player: grava a tentativa e soma no cache de totais (recordAnswer)
    async answer(id, exercise, at, correct = true) {
      await log.add(attempt(id, exercise, at, correct));
      d.edit(s => {
        const p = s.stats[exercise] ?? { attempts: 0, correct: 0, last: 0 };
        return { ...s, stats: { ...s.stats, [exercise]: { attempts: p.attempts + 1, correct: p.correct + (correct ? 1 : 0), last: at } } };
      }, at);
    },
    study(exercise, at, seconds = 60) {
      d.edit(s => ({ ...s, history: [{ at, id: exercise, title: exercise, module: 'theory', seconds } as Activity, ...s.history] }), at);
    },
    sync: (user = USER) => syncOnce(d, remote, user),
    attemptIds: async () => (await log.all()).map(a => a.id).sort(),
  };
  return d;
}

function attempt(id: string, exercise: string, at: number, correct: boolean): Attempt {
  return {
    schema: 1, id, at, session_id: 's', exercise_id: exercise, primary_module: 'theory', skill_tags: [], content_tags: [],
    taxonomy_version: 1, locale: 'pt', question: { surface: 'choices', expected: { kind: 'choice', id: 'a' } },
    parameters_snapshot: { settings: {}, params: {} }, response: { kind: 'choice', id: correct ? 'a' : 'b' },
    outcome: correct ? 'correct' : 'incorrect', validation_type: 'deterministic', error_code: correct ? null : 'unclassified',
    response_time_ms: 1000, hints: 0, repetitions: 0,
  } as unknown as Attempt;
}

const T = 1_800_000_000_000; // um instante qualquer (2027)

describe('primeiro login', () => {
  it('leva tudo o que o aparelho tinha para a conta, sem perder nada', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    phone.edit(s => ({ ...s, profile: { ...s.profile, name: 'Ana', instrument: 'baixo' }, arsenal: ['braco-nota'] }), T);
    phone.edit(s => ({ ...s, settings: { 'braco-nota': { casas: '0-12' } } }), T + 1);
    phone.study('braco-nota', T + 2);
    await phone.answer('a1', 'braco-nota', T + 3);
    await phone.answer('a2', 'braco-nota', T + 4, false);

    await phone.sync();

    expect(remote.attempts).toHaveLength(2);
    expect(remote.history).toHaveLength(1);
    expect(remote.docs.get('profile')?.value).toMatchObject({ name: 'Ana', instrument: 'baixo' });
    expect(remote.docs.get('palette')?.value).toEqual(['braco-nota']);
    expect(remote.docs.get('settings:braco-nota')?.value).toEqual({ casas: '0-12' });
  });

  it('dados de antes da B2 (sem carimbo) também vão, e totais de antes da C2 não somem', async () => {
    const remote = memoryRemote();
    // aparelho que já tinha uso antes de existir a B2 e antes do registro de tentativas
    const old = device(remote, { profile: { ...DEFAULT_STATE.profile, name: 'Bia' }, stats: { 'quiz-teoria': { attempts: 10, correct: 7, last: T } } });
    expect(old.get().sync!.updated.profile).toBe(0);
    await old.sync();
    expect(remote.docs.get('profile')?.value).toMatchObject({ name: 'Bia' });

    const laptop = device(remote);
    await laptop.sync();
    expect(laptop.get().profile.name).toBe('Bia');
    expect(laptop.get().stats['quiz-teoria']).toMatchObject({ attempts: 10, correct: 7 });
  });
});

describe('pronto quando: estudar offline no celular e abrir o computador mostra o mesmo progresso', () => {
  it('o computador vê o que o celular fez offline, e os dois acabam iguais', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    const laptop = device(remote);
    await phone.sync();
    await laptop.sync();

    // offline no celular: estuda e responde, sem sincronizar
    phone.study('ouvido-intervalo', T + 10, 300);
    for (let i = 0; i < 5; i++) await phone.answer(`p${i}`, 'ouvido-intervalo', T + 20 + i, i % 2 === 0);
    // no computador, outra coisa
    laptop.study('pauta-nota', T + 15, 120);
    await laptop.answer('l0', 'pauta-nota', T + 16);

    await phone.sync(); // a internet voltou
    await laptop.sync(); // abriu o computador
    await phone.sync();

    for (const d of [phone, laptop]) {
      expect(await d.attemptIds()).toEqual(['l0', 'p0', 'p1', 'p2', 'p3', 'p4']);
      expect(d.get().history.map(h => h.id)).toEqual(['pauta-nota', 'ouvido-intervalo']); // mais novo primeiro
      expect(d.get().stats['ouvido-intervalo']).toMatchObject({ attempts: 5, correct: 3 });
      expect(d.get().stats['pauta-nota']).toMatchObject({ attempts: 1, correct: 1 });
    }
  });

  it('pega o que chegou atrasado de um aparelho que passou dias offline', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    const laptop = device(remote);
    await phone.answer('velha', 'quiz-teoria', T); // feita na segunda, offline
    await laptop.answer('nova', 'quiz-teoria', T + 3 * 864e5); // feita na quarta
    await laptop.sync(); // o computador já leu tudo até quarta
    await phone.sync(); // o celular só volta à internet na quinta, com a tentativa de segunda
    await laptop.sync();
    expect(await laptop.attemptIds()).toEqual(['nova', 'velha']);
  });

  it('rodar de novo não duplica nem reenvia o que já foi', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    phone.study('braco-nota', T);
    await phone.answer('a1', 'braco-nota', T);
    await phone.sync();
    const writes = { ...remote.writes };
    const before = { ...phone.get() };

    await phone.sync();
    await phone.sync();

    expect(remote.attempts).toHaveLength(1);
    expect(remote.history).toHaveLength(1);
    expect(phone.get().history).toHaveLength(1);
    expect(phone.get().stats).toEqual(before.stats);
    expect(remote.writes.docs).toBe(writes.docs); // nada de documento reenviado sem mudança
  });

  it('lê em páginas mesmo quando centenas de linhas entram no servidor com a mesma hora', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    const n = PAGE * 2 + 3;
    for (let i = 0; i < n; i++) await phone.answer(`a${String(i).padStart(4, '0')}`, 'pauta-nota', T + i);
    await phone.sync(); // um envio em lote: todas com o mesmo synced_at
    expect(new Set(remote.attempts.map(a => a.synced_at)).size).toBe(1);

    const laptop = device(remote);
    await laptop.sync();
    expect(await laptop.attemptIds()).toHaveLength(n);
    expect(laptop.get().stats['pauta-nota'].attempts).toBe(n);
  });
});

describe('configurações: a mais recente vence', () => {
  it('a edição mais nova fica, na ordem que for', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    const laptop = device(remote);
    phone.edit(s => ({ ...s, profile: { ...s.profile, name: 'Antiga' } }), T);
    laptop.edit(s => ({ ...s, profile: { ...s.profile, name: 'Nova' } }), T + 100);
    await laptop.sync();
    await phone.sync(); // o celular tem a mais velha: não sobrescreve
    expect(phone.get().profile.name).toBe('Nova');
    expect(remote.docs.get('profile')?.value).toMatchObject({ name: 'Nova' });
  });

  it('documentos diferentes não brigam entre si', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    const laptop = device(remote);
    phone.edit(s => ({ ...s, sound: false }), T + 50);
    laptop.edit(s => ({ ...s, settings: { ...s.settings, 'pauta-nota': { clave: 'fa' } } }), T + 10);
    laptop.edit(s => ({ ...s, profile: { ...s.profile, name: 'Caio' } }), T + 20);
    await phone.sync();
    await laptop.sync();
    await phone.sync();
    for (const d of [phone, laptop]) {
      expect(d.get().sound).toBe(false);
      expect(d.get().profile.name).toBe('Caio');
      expect(d.get().settings['pauta-nota']).toEqual({ clave: 'fa' });
    }
  });

  it('o servidor recusa sobrescrever com uma versão mais velha (aparelho que leu antes e gravou depois)', async () => {
    const remote = memoryRemote();
    await remote.pushDocs([{ key: 'params', value: { tempo: 120 }, updatedAt: T + 10 }]);
    await remote.pushDocs([{ key: 'params', value: { tempo: 60 }, updatedAt: T }]);
    expect(remote.docs.get('params')?.value).toEqual({ tempo: 120 });
  });

  it('empate de carimbo com valores diferentes converge para o do servidor', async () => {
    const remote = memoryRemote();
    // dois aparelhos com dados de antes da B2: os dois com carimbo 0
    const a = device(remote, { profile: { ...DEFAULT_STATE.profile, name: 'Ana' } });
    const b = device(remote, { profile: { ...DEFAULT_STATE.profile, name: 'Bia' } });
    await a.sync();
    await b.sync();
    await a.sync();
    expect(a.get().profile.name).toBe(b.get().profile.name);
  });
});

describe('totais de antes da C2', () => {
  it('somam os de cada aparelho uma vez só, por mais que sincronize', async () => {
    const remote = memoryRemote();
    const stats = (attempts: number, correct: number) => ({ 'quiz-teoria': { attempts, correct, last: T } });
    const a = device(remote, { stats: stats(5, 4) });
    const b = device(remote, { stats: stats(3, 1) });
    await a.answer('x', 'quiz-teoria', T + 1);
    for (let i = 0; i < 3; i++) { await a.sync(); await b.sync(); }
    for (const d of [a, b]) expect(d.get().stats['quiz-teoria']).toMatchObject({ attempts: 9, correct: 6 });
  });
});

describe('apagar meu progresso', () => {
  it('vale para os outros aparelhos, mas o que um deles fez depois fica', async () => {
    const remote = memoryRemote();
    const phone = device(remote);
    const laptop = device(remote);
    phone.study('braco-nota', T);
    await phone.answer('velha', 'braco-nota', T);
    phone.edit(s => ({ ...s, profile: { ...s.profile, name: 'Ana' } }), T);
    await phone.sync();
    await laptop.sync();
    expect(laptop.get().profile.name).toBe('Ana');

    // no computador, apaga tudo (como resetProgress)
    const at = T + 100;
    await remote.deleteProgress();
    await remote.pushDocs([{ key: RESET_KEY, value: { at }, updatedAt: at }]);
    laptop.apply(s => resetBefore(s, at, DEFAULT_STATE));
    await laptop.log.removeBefore(at);
    await laptop.rebuild();

    // o celular estava offline e estudou depois do reset
    await phone.answer('depois', 'pauta-nota', at + 50);
    await phone.sync();
    await laptop.sync();

    for (const d of [phone, laptop]) {
      expect(await d.attemptIds()).toEqual(['depois']);
      expect(d.get().history).toEqual([]);
      expect(d.get().profile.name).toBe('');
      expect(d.get().stats['braco-nota']).toBeUndefined();
      expect(d.get().stats['pauta-nota']).toMatchObject({ attempts: 1 });
    }
    expect(remote.attempts.map(a => a.id)).toEqual(['depois']);
  });
});

describe('troca de conta no mesmo aparelho', () => {
  it('dados de outra conta saem antes de entrar os da nova, e nunca vão para ela', async () => {
    const remote1 = memoryRemote();
    const remote2 = memoryRemote();
    const shared = device(remote1);
    shared.edit(s => ({ ...s, profile: { ...s.profile, name: 'Pessoa 1' } }), T);
    await shared.answer('de-1', 'quiz-teoria', T);
    await shared.sync('user-1');

    // a sessão da pessoa 1 expirou sem passar pelo "sair"; a pessoa 2 entra no mesmo navegador
    const viaOther = { ...shared, sync: () => syncOnce(shared, remote2, 'user-2') };
    await viaOther.sync();

    expect(remote2.attempts).toHaveLength(0);
    expect(remote2.docs.get('profile')).toBeUndefined();
    expect(await shared.attemptIds()).toEqual([]);
    expect(shared.get().profile.name).toBe('');
    expect(shared.get().sync!.owner).toBe('user-2');
  });
});

describe('faixa etária', () => {
  it('vem do cadastro na conta para o aparelho novo', async () => {
    const remote = memoryRemote();
    remote.setAgeGroup('13to17');
    const laptop = device(remote);
    await laptop.sync();
    expect(laptop.get().ageGroup).toBe('13to17');
  });
});
