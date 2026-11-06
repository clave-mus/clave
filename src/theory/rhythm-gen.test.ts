import { describe, expect, it } from 'vitest';
import { CELLS, METER_IDS, METERS, parsePattern, type Level } from './rhythm-cells';
import {
  BAR_COUNTS, barSignature, checkSettings, DEFAULT_SETTINGS, generateExercise, poolFor, PRESET_POUCAS_NOTAS, timeline, validateExercise,
  type RhythmSettings,
} from './rhythm-gen';

const LEVELS: Level[] = [1, 2, 3, 4, 5];
const settings = (over: Partial<RhythmSettings> = {}): RhythmSettings => ({ ...DEFAULT_SETTINGS, ...over });

describe('padrões', () => {
  it('lê figuras, pausas, pontos, ligaduras e quiálteras', () => {
    expect(parsePattern('8. 16').map(e => e.dur)).toEqual([18, 6]);
    expect(parsePattern('r8 8~').map(e => [e.rest, e.tie])).toEqual([[true, false], [false, true]]);
    expect(parsePattern('3:2(8 8 8)').map(e => e.dur)).toEqual([8, 8, 8]);
    expect(parsePattern('2:3(8 8)').map(e => e.dur)).toEqual([18, 18]);
    expect(() => parsePattern('8 x')).toThrow();
  });
  it('toda célula do catálogo ocupa pulsos inteiros', () => {
    for (const c of CELLS) {
      const beat = c.kind === 'composto' ? 36 : 24;
      expect(c.span % beat, c.id).toBe(0);
    }
  });
  it('deduz os recursos de cada célula', () => {
    const by = Object.fromEntries(CELLS.map(c => [c.id, c]));
    expect(by['8d-16'].traits).toContain('pontuada');
    expect(by['16-8-16'].traits).toContain('sincope');
    expect(by['8-q-8'].traits).toContain('sincope');
    expect(by['q-h-q'].traits).toContain('sincope');
    expect(by['8-8t-8-8'].traits).toEqual(expect.arrayContaining(['ligadura', 'sincope']));
    expect(by['t8x3'].traits).toEqual(['quialtera']);
    expect(by['c-qd'].traits).toEqual([]); // semínima pontuada é o pulso do 6/8, não ritmo pontuado
    expect(by['hd'].traits).toEqual([]);
    expect(by['8-8'].traits).toEqual([]);
  });
});

describe('gerador', () => {
  it('cada compasso soma exatamente a fórmula de compasso, em todos os níveis e compassos', () => {
    for (const meter of METER_IDS) {
      for (const level of LEVELS) {
        for (let seed = 1; seed <= 60; seed++) {
          const s = settings({ meter, level, bars: 8 });
          const ex = generateExercise(s, { seed });
          expect(ex.bars).toHaveLength(8);
          for (const bar of ex.bars) expect(bar.events.reduce((t, e) => t + e.dur, 0)).toBe(METERS[meter].barTicks);
          expect(validateExercise(ex, s)).toEqual([]);
        }
      }
    }
  });

  it('é reproduzível pela semente', () => {
    const a = generateExercise(settings(), { seed: 42 });
    const b = generateExercise(settings(), { seed: 42 });
    expect(a).toEqual(b);
  });

  it('nível 1 só usa semínimas, mínimas e semibreves', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const ex = generateExercise(settings({ level: 1 }), { seed });
      for (const e of ex.bars.flatMap(b => b.events)) {
        expect(['w', 'h', 'q']).toContain(e.value);
        expect(e.tuplet).toBeUndefined();
        expect(e.tie).toBe(false);
      }
    }
  });

  it('a complexidade cresce com o nível', () => {
    const density = (level: Level) => {
      let notes = 0;
      for (let seed = 1; seed <= 80; seed++) notes += generateExercise(settings({ level }), { seed }).bars.flatMap(b => b.events).length;
      return notes;
    };
    const d = LEVELS.map(density);
    expect(d[0]).toBeLessThan(d[1]);
    expect(d[1]).toBeLessThan(d[2]);
  });

  it('o nível escolhido aparece no exercício', () => {
    for (const level of [2, 3, 4, 5] as Level[]) {
      for (let seed = 1; seed <= 40; seed++) {
        const ex = generateExercise(settings({ level }), { seed });
        const levels = ex.bars.flatMap(b => b.cells).map(id => CELLS.find(c => c.id === id)!.level);
        expect(levels, `nível ${level}, semente ${seed}`).toContain(level);
      }
    }
  });

  it('respeita figuras, pausas e recursos desligados', () => {
    const s = settings({
      level: 5,
      figures: { w: false, h: false, q: true, '8': true, '16': false },
      rests: false,
      traits: { pontuada: false, sincope: false, ligadura: false, quialtera: false },
    });
    for (let seed = 1; seed <= 80; seed++) {
      for (const e of generateExercise(s, { seed }).bars.flatMap(b => b.events)) {
        expect(['q', '8']).toContain(e.value);
        expect(e.rest).toBe(false);
        expect(e.dots).toBe(0);
        expect(e.tie).toBe(false);
        expect(e.tuplet).toBeUndefined();
      }
    }
  });

  it('controla os tipos de pausa', () => {
    const s = settings({ level: 3, restKinds: { h: false, q: false, '8': true, '16': false } });
    for (let seed = 1; seed <= 80; seed++) {
      for (const e of generateExercise(s, { seed }).bars.flatMap(b => b.events)) if (e.rest) expect(e.value).toBe('8');
    }
  });

  it('nunca gera compasso só de pausas nem com mais pausa do que som', () => {
    for (const meter of METER_IDS) {
      for (let seed = 1; seed <= 80; seed++) {
        const ex = generateExercise(settings({ meter, level: 3 }), { seed });
        for (const bar of ex.bars) {
          const rest = bar.events.filter(e => e.rest).reduce((t, e) => t + e.dur, 0);
          expect(rest).toBeLessThanOrEqual(METERS[meter].barTicks / 2);
        }
      }
    }
  });

  it('mínimas começam em tempo forte no 4/4', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const bar of generateExercise(settings({ level: 1 }), { seed }).bars) {
        for (const e of bar.events) if (e.value === 'h' && !e.dots) expect([0, 48]).toContain(e.at);
      }
    }
  });

  it('quiálteras ficam dentro de meio pulso, um pulso ou dois pulsos', () => {
    for (let seed = 1; seed <= 80; seed++) {
      for (const bar of generateExercise(settings({ level: 5 }), { seed }).bars) {
        const groups = new Map<number, number[]>();
        bar.events.forEach(e => e.tuplet && groups.set(e.tuplet.id, [...(groups.get(e.tuplet.id) ?? []), e.at, e.at + e.dur]));
        groups.forEach(pts => {
          const start = Math.min(...pts);
          const end = Math.max(...pts);
          expect(start % 12).toBe(0);
          expect([12, 24, 48]).toContain(end - start);
          if (end - start >= 24) expect(start % 24).toBe(0);
        });
      }
    }
  });

  it('evita repetir os compassos do exercício anterior', () => {
    let repeated = 0;
    let total = 0;
    let prev = generateExercise(settings({ level: 3 }), { seed: 1 });
    for (let seed = 2; seed <= 60; seed++) {
      const avoid = new Set(prev.bars.map(barSignature));
      const ex = generateExercise(settings({ level: 3 }), { seed, avoid });
      repeated += ex.bars.filter(b => avoid.has(barSignature(b))).length;
      total += ex.bars.length;
      prev = ex;
    }
    expect(repeated / total).toBeLessThan(0.05);
  });

  it('exercícios seguidos não saem iguais', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) seen.add(generateExercise(settings(), { seed }).bars.map(barSignature).join('|'));
    expect(seen.size).toBe(50);
  });

  it('ligaduras sempre levam a uma nota', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const all = generateExercise(settings({ level: 4, bars: 8 }), { seed }).bars.flatMap(b => b.events);
      all.forEach((e, i) => { if (e.tie) { expect(e.rest).toBe(false); expect(all[i + 1].rest).toBe(false); } });
    }
  });
});

describe('configurações', () => {
  it('o padrão funciona em todas as fórmulas e níveis', () => {
    for (const meter of METER_IDS) for (const level of LEVELS) expect(checkSettings(settings({ meter, level }))).toBeNull();
  });
  it('avisa quando não sobra figura nenhuma', () => {
    const s = settings({ figures: { w: false, h: false, q: false, '8': false, '16': false } });
    expect(checkSettings(s)).toBe('noFigures');
    expect(() => generateExercise(s)).toThrow();
  });
  it('qualquer combinação de opções gera exercício válido ou explica o motivo', () => {
    const figs = ['w', 'h', 'q', '8', '16'] as const;
    const traits = ['pontuada', 'sincope', 'ligadura', 'quialtera'] as const;
    const restOpts = [{ rests: false }, { rests: true }, { rests: true, restKinds: { h: false, q: false, '8': true, '16': false } }];
    let ok = 0;
    let refused = 0;
    for (const meter of METER_IDS) for (const level of LEVELS) for (let fm = 0; fm < 32; fm++) for (let tm = 0; tm < 16; tm += 5) for (const ro of restOpts) {
      const s = settings({
        meter, level, bars: 2, ...ro,
        figures: Object.fromEntries(figs.map((f, i) => [f, !!(fm & (1 << i))])) as RhythmSettings['figures'],
        traits: Object.fromEntries(traits.map((t, i) => [t, !!(tm & (1 << i))])) as RhythmSettings['traits'],
      });
      const why = checkSettings(s);
      if (why) { refused++; expect(() => generateExercise(s, { seed: fm })).toThrow(why); continue; }
      expect(validateExercise(generateExercise(s, { seed: fm }), s)).toEqual([]);
      ok++;
    }
    expect(ok).toBeGreaterThan(refused);
  });
  it('restringir figuras só tira células do conjunto', () => {
    const full = poolFor(settings({ level: 3 })).map(c => c.id);
    const less = poolFor(settings({ level: 3, figures: { ...DEFAULT_SETTINGS.figures, '16': false } })).map(c => c.id);
    expect(less.every(id => full.includes(id))).toBe(true);
    expect(less.length).toBeLessThan(full.length);
  });
});

describe('família aditiva (X1)', () => {
  const FAMILIAS = ['binaria', 'ternaria', 'quaternaria', 'pontuada'] as const;
  const soFamilia = (fam: (typeof FAMILIAS)[number]) => settings({
    level: 5,
    familias: Object.fromEntries(FAMILIAS.map(f => [f, f === fam])) as RhythmSettings['familias'],
  });

  it('cada família sozinha gera compasso válido, em toda fórmula e todo tamanho — ligada ou no nível 5', () => {
    for (const fam of FAMILIAS) {
      for (const meter of METER_IDS) for (const bars of BAR_COUNTS) {
        const s = { ...soFamilia(fam), meter, bars };
        const why = checkSettings(s);
        // Algumas famílias não têm célula na fórmula composta (6/8) — e aí o motivo é ESTE, não um defeito.
        if (why) { expect(why).toBe('noFigures'); continue; }
        expect(validateExercise(generateExercise(s, { seed: 7 }), s)).toEqual([]);
      }
    }
  });

  it('é OU, não E: ligar uma família não exige as outras', () => {
    const full = poolFor(settings({ level: 5 })).length;
    const soBinaria = poolFor(soFamilia('binaria')).length;
    expect(soBinaria).toBeGreaterThan(0);
    expect(soBinaria).toBeLessThan(full);
  });

  it('célula sem família (nota simples, pausa) passa mesmo com todas as famílias desligadas', () => {
    const s = settings({ level: 1, familias: { binaria: false, ternaria: false, quaternaria: false, pontuada: false } });
    const ids = poolFor(s).map(c => c.id);
    expect(ids).toContain('q'); // semínima simples: sem família, não devia ser filtrada
    expect(ids).toContain('rq'); // pausa de semínima: idem
  });

  it('desligar todas as famílias não impede gerar (sobra o material sem família)', () => {
    const s = settings({ level: 1, familias: { binaria: false, ternaria: false, quaternaria: false, pontuada: false } });
    expect(checkSettings(s)).toBeNull();
    expect(validateExercise(generateExercise(s, { seed: 3 }), s)).toEqual([]);
  });
});

describe('preset "8 posições, 2 notas" (X1)', () => {
  it('gera compasso válido', () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(validateExercise(generateExercise(PRESET_POUCAS_NOTAS, { seed }), PRESET_POUCAS_NOTAS)).toEqual([]);
    }
  });

  it('fica mesmo perto de duas notas, bem mais pausado que o padrão', () => {
    let soantes = 0;
    const N = 40;
    for (let seed = 1; seed <= N; seed++) {
      const ex = generateExercise(PRESET_POUCAS_NOTAS, { seed });
      soantes += ex.bars.reduce((s, b) => s + b.events.filter(e => !e.rest).length, 0) / ex.bars.length;
    }
    // Compare com o padrão: ao nível 2 normal, uma figura por tempo já dá 2+ notas por tempo em média.
    expect(soantes / N).toBeLessThan(3);
  });

  it('metaNotas desliga a regra de "no máximo meio compasso de pausa" — aqui pausa maioria é o alvo', () => {
    const m = METERS[PRESET_POUCAS_NOTAS.meter];
    let algumaBemPausada = false;
    for (let seed = 1; seed <= 30 && !algumaBemPausada; seed++) {
      const ex = generateExercise(PRESET_POUCAS_NOTAS, { seed });
      algumaBemPausada = ex.bars.some(b => b.events.filter(e => e.rest).reduce((s, e) => s + e.dur, 0) > m.barTicks / 2);
    }
    expect(algumaBemPausada).toBe(true);
  });
});

describe('linha do tempo', () => {
  it('não reataca notas ligadas e cobre o exercício inteiro', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const ex = generateExercise(settings({ level: 4 }), { seed });
      const { entries, total } = timeline(ex);
      expect(total).toBe(ex.bars.length * METERS[ex.meter].barTicks);
      const all = ex.bars.flatMap(b => b.events);
      entries.forEach((t, i) => {
        if (i > 0 && all[i - 1].tie) expect(t.attack).toBe(false);
        if (all[i].rest) expect(t.attack).toBe(false);
      });
    }
  });
});
