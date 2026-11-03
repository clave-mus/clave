import { beforeEach, describe, expect, it } from 'vitest';
import { memoryLog, setAttemptLog, type AttemptLog } from './attemptLog';
import {
  aggregateStats, ATTEMPT_SCHEMA, buildFeedback, CONFIDENCE_CHANCE, CONFIDENCE_SERIES, mergeStats, newId,
  shouldAskConfidence, subtractStats, type Attempt,
} from './attempts';
import { getState, rebuildStats, setState } from './store';
import sql from '../../supabase/migrations/20261102120000_attempts.sql?raw';

const attempt = (exercise_id: string, outcome: Attempt['outcome'], at: number, validation_type: Attempt['validation_type'] = 'deterministic'): Attempt => ({
  schema: ATTEMPT_SCHEMA, id: newId(), at, session_id: 's', exercise_id, primary_module: 'theory', skill_tags: [], content_tags: [],
  taxonomy_version: 1, locale: 'pt', question: { surface: 'choices', expected: { kind: 'option', id: 'a' } },
  parameters_snapshot: { settings: {}, params: { instrument: 'violao', tuning: [], key: null, range: { lo: 0, hi: 0 }, material: 'cromatico' } },
  response: { kind: 'option', id: 'a' }, outcome, validation_type, error_code: outcome === 'incorrect' ? 'unclassified' : null,
  response_time_ms: 1000, hints: 0, repetitions: 0,
});

describe('pergunta de confiança', () => {
  it('só ao fechar uma série, e nunca sempre', () => {
    expect(shouldAskConfidence(CONFIDENCE_SERIES - 1, () => 0)).toBe(false); // série incompleta: nunca
    expect(shouldAskConfidence(CONFIDENCE_SERIES, () => 0)).toBe(true);
    expect(shouldAskConfidence(CONFIDENCE_SERIES, () => 0.99)).toBe(false);
    expect(CONFIDENCE_CHANCE).toBeLessThan(1);
    // em muitas séries, pergunta numa fração delas
    let asked = 0;
    for (let i = 0; i < 3000; i++) if (shouldAskConfidence(CONFIDENCE_SERIES)) asked++;
    expect(asked / 3000).toBeGreaterThan(CONFIDENCE_CHANCE - 0.05);
    expect(asked / 3000).toBeLessThan(CONFIDENCE_CHANCE + 0.05);
  });
  it('a confiança fica ligada às tentativas da série, num registro à parte', () => {
    const f = buildFeedback('sessão', ['a', 'b'], 'unsure', 5);
    expect(f).toMatchObject({ schema: ATTEMPT_SCHEMA, session_id: 'sessão', attempt_ids: ['a', 'b'], confidence: 'unsure', at: 5 });
    expect(f.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('totais derivados do registro', () => {
  it('contam só as tentativas conferidas automaticamente', () => {
    const s = aggregateStats([attempt('x', 'correct', 1), attempt('x', 'incorrect', 3), attempt('x', 'self_assessed', 9, 'self_report'), attempt('y', 'correct', 2)]);
    expect(s).toEqual({ x: { attempts: 2, correct: 1, last: 3 }, y: { attempts: 1, correct: 1, last: 2 } });
  });
  it('somar e separar a base anterior não perde nem duplica', () => {
    const legacy = { x: { attempts: 10, correct: 7, last: 5 } };
    const fromLog = { x: { attempts: 2, correct: 1, last: 9 }, y: { attempts: 1, correct: 0, last: 8 } };
    const total = mergeStats(legacy, fromLog);
    expect(total).toEqual({ x: { attempts: 12, correct: 8, last: 9 }, y: { attempts: 1, correct: 0, last: 8 } });
    expect(subtractStats(total, fromLog)).toEqual({ x: { attempts: 10, correct: 7, last: 9 } });
  });
});

describe('rebuildStats', () => {
  let log: AttemptLog;
  beforeEach(() => { log = memoryLog(); setAttemptLog(log); });

  it('na primeira vez, guarda como base o que veio de antes do registro, sem contar em dobro', async () => {
    // 10 respostas de antes da C2 + 2 já registradas (que também somaram nos totais)
    await log.add(attempt('x', 'correct', 100));
    await log.add(attempt('x', 'incorrect', 200));
    setState(s => ({ ...s, legacyStats: undefined, stats: { x: { attempts: 12, correct: 8, last: 200 } } }));
    await rebuildStats();
    expect(getState().legacyStats).toEqual({ x: { attempts: 10, correct: 7, last: 200 } });
    expect(getState().stats.x).toMatchObject({ attempts: 12, correct: 8 });
    // depois, novas tentativas entram pelo registro, e a base não muda
    await log.add(attempt('x', 'correct', 300));
    await rebuildStats();
    expect(getState().stats.x).toEqual({ attempts: 13, correct: 9, last: 300 });
    expect(getState().legacyStats?.x.attempts).toBe(10);
  });

  it('tentativas que chegam de outro aparelho aparecem nos totais', async () => {
    setState(s => ({ ...s, legacyStats: {}, stats: {} }));
    await log.add(attempt('y', 'correct', 1));
    await log.add(attempt('y', 'correct', 2));
    await rebuildStats();
    expect(getState().stats.y).toEqual({ attempts: 2, correct: 2, last: 2 });
  });
});

describe('migração do Supabase', () => {
  it('tem uma coluna para cada campo da tentativa e da confiança', () => {
    const a = attempt('x', 'correct', 1);
    for (const field of Object.keys(a)) expect(sql, field).toMatch(new RegExp(`\\n  ${field} `));
    for (const field of Object.keys(buildFeedback('s', [], 'sure'))) expect(sql, field).toMatch(new RegExp(`\\n  ${field} `));
  });
  it('aceita exatamente os valores do formato', () => {
    for (const v of ['correct', 'partial', 'incorrect', 'self_assessed', 'unscored', 'deterministic', 'self_report', 'none',
      'enharmonic_spelling', 'octave', 'semitone', 'chord_quality', 'chord_root', 'unclassified', 'guess', 'unsure', 'sure']) {
      expect(sql).toContain(`'${v}'`);
    }
  });
  it('liga o RLS e não deixa alterar uma tentativa gravada', () => {
    expect(sql).toContain('alter table public.attempts enable row level security');
    expect(sql).toContain('alter table public.attempt_feedback enable row level security');
    expect(sql).not.toMatch(/for update/);
  });
});
