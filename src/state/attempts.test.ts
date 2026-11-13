import { describe, expect, it } from 'vitest';
import { resolvePresentation } from '../audio/presentation';
import { EXERCISES } from '../catalog/catalog';
import { isSeries } from '../catalog/types';
import { resolveParams } from '../catalog/params';
import { TAXONOMY_VERSION } from '../catalog/taxonomy';
import type { Ctx, Question, Response } from '../catalog/types';
import { optionResponse, validate } from '../catalog/validate';
import { translate, type MessageKey, type Vars } from '../i18n';
import { memoryLog } from './attemptLog';
import { buildAttempt, classifyError, coverage, queryAttempts, type Attempt } from './attempts';

const params = resolveParams('violao');
const ctx: Ctx = { naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v), params };

describe('classificação do erro', () => {
  it('enarmonia: a altura certa com outra grafia', () => {
    expect(classifyError({ kind: 'spelled', letter: 0, acc: 1 }, { kind: 'spelled', letter: 1, acc: -1 })).toBe('enharmonic_spelling');
  });
  it('oitava: a nota certa na oitava errada (grafia ou altura)', () => {
    expect(classifyError({ kind: 'spelled', letter: 4, acc: 0, oct: 4 }, { kind: 'spelled', letter: 4, acc: 0, oct: 5 })).toBe('octave');
    expect(classifyError({ kind: 'pitch', midi: 64 }, { kind: 'pitch', midi: 52 })).toBe('octave');
  });
  it('semitom: errou por meio tom, em qualquer superfície', () => {
    expect(classifyError({ kind: 'pitchClass', pc: 0 }, { kind: 'pitch', midi: 61 })).toBe('semitone');
    expect(classifyError({ kind: 'pitchClass', pc: 0 }, { kind: 'pitchClass', pc: 11 })).toBe('semitone');
    expect(classifyError({ kind: 'spelled', letter: 2, acc: 0 }, { kind: 'spelled', letter: 3, acc: 0 })).toBe('semitone'); // Mi → Fá
    expect(classifyError({ kind: 'pitch', midi: 60 }, { kind: 'pitch', midi: 59 })).toBe('semitone');
  });
  it('acorde: qualidade ou fundamental trocada', () => {
    expect(classifyError({ kind: 'chord', root: 0, quality: '7M' }, { kind: 'chord', text: 'C7' })).toBe('chord_quality');
    expect(classifyError({ kind: 'chord', root: 0, quality: '7M' }, { kind: 'chord', text: 'Dmaj7' })).toBe('chord_root');
  });
  it('na dúvida, não classifica', () => {
    expect(classifyError({ kind: 'pitchClass', pc: 0 }, { kind: 'pitch', midi: 67 })).toBe('unclassified'); // uma quinta: não dá para dizer o porquê
    expect(classifyError({ kind: 'chord', root: 0, quality: '7M' }, { kind: 'chord', text: 'Dm7' })).toBe('unclassified'); // tudo trocado
    expect(classifyError({ kind: 'option', id: 'M3' }, { kind: 'option', id: 'm3' })).toBe('unclassified'); // opção opaca
  });
});

/** Responde uma pergunta do jeito que a superfície responderia: certo ou com a primeira resposta errada. */
function answer(q: Question, wantCorrect: boolean): Response {
  const ok = (r: Response) => validate(q.expected, r) === wantCorrect;
  const sf = q.surface;
  const candidates: Response[] =
    sf.kind === 'choices' ? sf.options.map(optionResponse)
      : sf.kind === 'keyboard' ? Array.from({ length: sf.hi - sf.lo + 1 }, (_, k) => ({ kind: 'pitch', midi: sf.lo + k }) as Response)
      // Todas as cordas, não só a primeira: a resposta certa pode estar em qualquer uma, e com a
      // superfície do `ouvido-tecla` virando parâmetro isso deixou de ser detalhe.
      : sf.kind === 'fretboard' ? (sf.onlyString !== undefined ? [sf.onlyString] : sf.tuning.map((_, i) => i))
        .flatMap(st => Array.from({ length: sf.to - sf.from + 1 }, (_, k) => ({ kind: 'pitch', midi: sf.tuning[st] + sf.from + k }) as Response))
      : sf.kind === 'letters' ? [0, 1, 2, 3, 4, 5, 6].flatMap(l => [-1, 0, 1].map(acc => ({ kind: 'spelled', letter: l, acc }) as Response))
      // `sequence`: a resposta é a sequência montada, unida pelo separador. A certa, e algumas
      // erradas deslocando a paleta — mais de uma porque um deslocamento pode cair na certa.
      : sf.kind === 'sequence' ? (() => {
        const sep = sf.separador ?? ' ';
        const certa = q.expected.kind === 'option' ? q.expected.id : '';
        const erradas = [1, 2, 3].map(d => Array.from({ length: sf.comprimento },
          (_, k) => sf.options[(k + d) % sf.options.length].id).join(sep));
        return [certa, ...erradas].map(id => ({ kind: 'option', id }) as Response);
      })()
      : q.expected.kind === 'spelled' ? [{ ...q.expected, kind: 'spelled' } as Response, { kind: 'spelled', letter: q.expected.letter + 1, acc: 0, oct: q.expected.oct } as Response]
      : [];
  return candidates.find(ok)!;
}

function attemptsFromCatalog(perExercise = 6): Attempt[] {
  const out: Attempt[] = [];
  for (const ex of EXERCISES.filter(isSeries)) {
    for (let i = 0; i < perExercise; i++) {
      const q = ex.make(ex.defaults, ctx);
      const correct = i % 2 === 0;
      const response = answer(q, correct);
      out.push(buildAttempt({
        exercise: ex, question: q, response, correct, sessionId: 's1', locale: 'pt', settings: ex.defaults, params,
        presentation: resolvePresentation([ex.presentation]), responseTimeMs: 1200, repetitions: 1,
      }));
    }
  }
  return out;
}

describe('registro de uma tentativa', () => {
  const all = attemptsFromCatalog();

  it('guarda o que foi testado, perguntado e respondido, com a versão das etiquetas', () => {
    for (const a of all) {
      const ex = EXERCISES.find(e => e.id === a.exercise_id)!;
      expect(a.primary_module).toBe(ex.primaryModule);
      expect(a.skill_tags).toEqual(ex.skillTags);
      expect(a.content_tags).toEqual(ex.contentTags);
      expect(a.taxonomy_version).toBe(TAXONOMY_VERSION);
      expect(a.question.expected).toBeTruthy();
      expect(a.validation_type).toBe('deterministic');
      expect(['correct', 'incorrect']).toContain(a.outcome);
      // o resultado gravado bate com a conferência da resposta gravada
      expect(validate(a.question.expected, a.response)).toBe(a.outcome === 'correct');
      expect(a.error_code === null).toBe(a.outcome === 'correct');
      if (a.question.surface === 'choices') expect(a.question.options?.length).toBeGreaterThan(1);
    }
  });

  it('o volume não entra na foto dos parâmetros; o resto da apresentação sim', () => {
    const withSound = all.filter(a => a.question.notes || a.question.drums);
    expect(withSound.length).toBeGreaterThan(0);
    withSound.forEach(a => {
      expect(a.parameters_snapshot.presentation).toBeTruthy();
      expect(a.parameters_snapshot.presentation).not.toHaveProperty('volume');
    });
  });

  it('sobrevive a ida e volta em JSON (é o que a sincronização vai mandar)', () => {
    all.forEach(a => expect(JSON.parse(JSON.stringify(a))).toEqual(a));
  });
});

describe('consulta sem inferir do nome do exercício', () => {
  it('recupera quais habilidades e conteúdos foram testados e com que validação', async () => {
    const log = memoryLog();
    for (const a of attemptsFromCatalog(4)) await log.add(a);
    const saved = await log.all();
    const { skills, contents } = coverage(saved);
    // todas as habilidades exercitadas pelo catálogo aparecem, contadas pelas etiquetas gravadas
    const expectedSkills = new Set(EXERCISES.flatMap(e => e.skillTags));
    expect(new Set(Object.keys(skills))).toEqual(expectedSkills);
    expect(skills['fretboard.note_naming']?.byValidation.deterministic).toBeGreaterThan(0);
    expect(contents['instrument.bass']?.attempts).toBeGreaterThan(0);
    // e dá para filtrar por habilidade + validação + resultado
    const misses = queryAttempts(saved, { skill: 'ear.chord_quality', validation: 'deterministic', outcome: 'incorrect' });
    expect(misses.length).toBeGreaterThan(0);
    misses.forEach(a => expect(a.skill_tags).toContain('ear.chord_quality'));
  });

  it('o registro em memória devolve em ordem de tempo e apaga tudo', async () => {
    const log = memoryLog();
    const [a, b] = attemptsFromCatalog(1);
    await log.add({ ...b, at: 2 });
    await log.add({ ...a, at: 1 });
    expect((await log.all()).map(x => x.at)).toEqual([1, 2]);
    await log.clear();
    expect(await log.all()).toEqual([]);
  });
});
