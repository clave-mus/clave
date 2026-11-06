import { describe, expect, it } from 'vitest';
import { CELLS, METER_IDS, METERS, parsePattern } from './rhythm-cells';
import {
  aplicarPreset, BAR_COUNTS, barSignature, checkSettings, DEFAULT_SETTINGS, generateExercise, poolFor,
  PRESETS, timeline, validateExercise, type RhythmSettings,
} from './rhythm-gen';

const settings = (over: Partial<RhythmSettings> = {}): RhythmSettings => ({ ...DEFAULT_SETTINGS, ...over });

/** Conjuntos de figuras no lugar da escada de níveis que saiu (06/11/2026). */
const FIGS = {
  minimas: { w: false, h: true, q: false, '8': false, '16': false },
  seminimas: { w: true, h: true, q: true, '8': false, '16': false },
  colcheias: { w: true, h: true, q: true, '8': true, '16': false },
  tudo: DEFAULT_SETTINGS.figures,
} as const;
const SEM_RECURSO = { pontuada: false, sincope: false, ligadura: false, quialtera: false };

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
  it('as semínimas ligadas novas carregam o recurso `ligadura`', () => {
    const by = Object.fromEntries(CELLS.map(c => [c.id, c]));
    expect(by['q-qt-q-q'].traits).toContain('ligadura');
    expect(by['q-qt-q-q'].figures).toEqual(['q']);
    expect(by['q-qt-q'].traits).toContain('ligadura');
  });
});

describe('gerador', () => {
  it('cada compasso soma exatamente a fórmula de compasso, em todo conjunto de figuras', () => {
    for (const meter of METER_IDS) {
      for (const figures of Object.values(FIGS)) {
        for (let seed = 1; seed <= 30; seed++) {
          const s = settings({ meter, figures, bars: 8 });
          if (checkSettings(s)) continue; // conjunto que não fecha o compasso é recusado, não gerado
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

  it('só mínimas e semínimas: nada de colcheia, quiáltera nem ligadura', () => {
    const s = settings({ figures: FIGS.seminimas, traits: SEM_RECURSO });
    for (let seed = 1; seed <= 100; seed++) {
      for (const e of generateExercise(s, { seed }).bars.flatMap(b => b.events)) {
        expect(['w', 'h', 'q']).toContain(e.value);
        expect(e.tuplet).toBeUndefined();
        expect(e.tie).toBe(false);
      }
    }
    // A mínima pontuada do 3/4 e do 4/4 TEM ponto e mesmo assim passa, porque o ponto cai no
    // pulso — é o próprio compasso, não ritmo pontuado. É o que `hd` documenta em rhythm-cells.
    expect(poolFor(s).some(c => c.id === 'hd')).toBe(true);
  });

  it('a densidade cresce conforme se acrescenta figura', () => {
    const density = (figures: RhythmSettings['figures']) => {
      let notes = 0;
      for (let seed = 1; seed <= 80; seed++) notes += generateExercise(settings({ figures }), { seed }).bars.flatMap(b => b.events).length;
      return notes;
    };
    expect(density(FIGS.seminimas)).toBeLessThan(density(FIGS.colcheias));
    expect(density(FIGS.colcheias)).toBeLessThan(density(FIGS.tudo));
  });

  it('respeita figuras, pausas e recursos desligados', () => {
    const s = settings({
      figures: { w: false, h: false, q: true, '8': true, '16': false },
      rests: false,
      traits: SEM_RECURSO,
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
    const s = settings({ restKinds: { h: false, q: false, '8': true, '16': false } });
    for (let seed = 1; seed <= 80; seed++) {
      for (const e of generateExercise(s, { seed }).bars.flatMap(b => b.events)) if (e.rest) expect(e.value).toBe('8');
    }
  });

  it('nunca gera compasso só de pausas nem com mais pausa do que som', () => {
    for (const meter of METER_IDS) {
      for (let seed = 1; seed <= 80; seed++) {
        const ex = generateExercise(settings({ meter }), { seed });
        for (const bar of ex.bars) {
          const rest = bar.events.filter(e => e.rest).reduce((t, e) => t + e.dur, 0);
          expect(rest).toBeLessThanOrEqual(METERS[meter].barTicks / 2);
        }
      }
    }
  });

  it('mínimas começam em tempo forte no 4/4', () => {
    const s = settings({ figures: FIGS.seminimas, traits: SEM_RECURSO });
    for (let seed = 1; seed <= 100; seed++) {
      for (const bar of generateExercise(s, { seed }).bars) {
        for (const e of bar.events) if (e.value === 'h' && !e.dots) expect([0, 48]).toContain(e.at);
      }
    }
  });

  it('quiálteras ficam dentro de meio pulso, um pulso ou dois pulsos', () => {
    for (let seed = 1; seed <= 80; seed++) {
      for (const bar of generateExercise(settings(), { seed }).bars) {
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
    let prev = generateExercise(settings(), { seed: 1 });
    for (let seed = 2; seed <= 60; seed++) {
      const avoid = new Set(prev.bars.map(barSignature));
      const ex = generateExercise(settings(), { seed, avoid });
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
      const all = generateExercise(settings({ bars: 8 }), { seed }).bars.flatMap(b => b.events);
      all.forEach((e, i) => { if (e.tie) { expect(e.rest).toBe(false); expect(all[i + 1].rest).toBe(false); } });
    }
  });
});

describe('a frequência de pausa é um botão, não um liga/desliga', () => {
  const pausaMedia = (pausas: number) => {
    let r = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const ex = generateExercise(settings({ pausas }), { seed });
      r += ex.bars.reduce((s, b) => s + b.events.filter(e => e.rest).length, 0);
    }
    return r / 60;
  };

  it('menos peso de pausa gera menos pausa', () => {
    expect(pausaMedia(0.2)).toBeLessThan(pausaMedia(1));
  });

  it('peso zero tira a pausa de vez', () => {
    expect(pausaMedia(0)).toBe(0);
  });
});

describe('configurações', () => {
  it('o padrão funciona em todas as fórmulas', () => {
    for (const meter of METER_IDS) expect(checkSettings(settings({ meter }))).toBeNull();
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
    for (const meter of METER_IDS) for (let fm = 0; fm < 32; fm++) for (let tm = 0; tm < 16; tm += 5) for (const ro of restOpts) {
      const s = settings({
        meter, bars: 2, ...ro,
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
    const full = poolFor(settings()).map(c => c.id);
    const less = poolFor(settings({ figures: { ...DEFAULT_SETTINGS.figures, '16': false } })).map(c => c.id);
    expect(less.every(id => full.includes(id))).toBe(true);
    expect(less.length).toBeLessThan(full.length);
  });
});

describe('presets (X1) — a porta de entrada no lugar dos níveis', () => {
  it('todo preset gera exercício válido, em todo tamanho', () => {
    for (const p of PRESETS) {
      for (const bars of BAR_COUNTS) {
        const s = { ...aplicarPreset(DEFAULT_SETTINGS, p.id), bars };
        expect(checkSettings(s), p.id).toBeNull();
        for (let seed = 1; seed <= 12; seed++) {
          expect(validateExercise(generateExercise(s, { seed }), s), `${p.id} semente ${seed}`).toEqual([]);
        }
      }
    }
  });

  it('são cumulativos: cada um acrescenta uma figura ao anterior', () => {
    // Em ordem de duração, não de iteração: chave numérica (`8`, `16`) vem antes em objeto JS.
    const ORDEM = ['w', 'h', 'q', '8', '16'];
    const figurasDe = (id: string) => {
      const s = aplicarPreset(DEFAULT_SETTINGS, id);
      return ORDEM.filter(f => s.figures[f as keyof typeof s.figures]);
    };
    expect(figurasDe('minimas')).toEqual(['h']);
    expect(figurasDe('seminimas')).toEqual(['h', 'q']);
    expect(figurasDe('colcheias')).toEqual(['h', 'q', '8']);
    expect(figurasDe('semicolcheias')).toEqual(['h', 'q', '8', '16']);
  });

  it('os quatro cumulativos vêm sem ligadura e sem pontuada, como o Paulo pediu', () => {
    for (const id of ['minimas', 'seminimas', 'colcheias', 'semicolcheias']) {
      const s = aplicarPreset(DEFAULT_SETTINGS, id);
      expect(s.traits.ligadura, id).toBe(false);
      expect(s.traits.pontuada, id).toBe(false);
      expect(s.traits.quialtera, id).toBe(false);
      expect(s.pausas, id).toBeLessThan(DEFAULT_SETTINGS.pausas);
    }
  });

  it('trocar de preset não arrasta configuração do anterior', () => {
    const comQuialtera = settings({ traits: { ...DEFAULT_SETTINGS.traits, quialtera: true } });
    expect(aplicarPreset(comQuialtera, 'minimas').traits.quialtera).toBe(false);
  });

  it('o preset guarda o número de compassos, que é escolha de tela e não dele', () => {
    expect(aplicarPreset(settings({ bars: 8 }), 'colcheias').bars).toBe(8);
  });
});

describe('preset "Ligaduras" — o que estava quebrado', () => {
  const s = aplicarPreset(DEFAULT_SETTINGS, 'ligaduras');

  it('gera ligadura de verdade, e na grande maioria dos exercícios', () => {
    let comLigadura = 0;
    const N = 40;
    for (let seed = 1; seed <= N; seed++) {
      const ex = generateExercise(s, { seed });
      if (ex.bars.some(b => b.events.some(e => e.tie))) comLigadura++;
    }
    // Antes desta rodada o número era ZERO: as duas células com ligadura exigiam colcheia, e a
    // antecipação entre compassos também. É esta a garantia que faltava.
    expect(comLigadura / N).toBeGreaterThan(0.8);
  });

  it('e continua sem colcheia — o preset é sobre ligadura, não sobre subdividir', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const e of generateExercise(s, { seed }).bars.flatMap(b => b.events)) {
        expect(['w', 'h', 'q']).toContain(e.value);
      }
    }
  });
});

describe('preset "Notas esparsas" — o sorteio posicional', () => {
  const s = aplicarPreset(DEFAULT_SETTINGS, 'esparsas');

  it('soam exatamente duas notas por compasso', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const bar of generateExercise(s, { seed }).bars) {
        expect(bar.events.filter(e => !e.rest)).toHaveLength(2);
      }
    }
  });

  it('as duas notas são semicolcheias, e o resto é pausa', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const e of generateExercise(s, { seed }).bars.flatMap(b => b.events)) {
        if (!e.rest) expect(e.value).toBe('16');
        expect(e.dots).toBe(0);
        expect(e.tie).toBe(false);
      }
    }
  });

  it('o compasso fecha certo e passa na validação de escrita', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const ex = generateExercise(s, { seed });
      expect(validateExercise(ex, s)).toEqual([]);
      for (const bar of ex.bars) expect(bar.events.reduce((t, e) => t + e.dur, 0)).toBe(METERS[s.meter].barTicks);
    }
  });

  it('agrupa as pausas em vez de enfileirar semicolcheias soltas', () => {
    // Um tempo inteiro vazio precisa virar UMA pausa de semínima, não quatro de semicolcheia.
    let viuPausaDeSeminima = false;
    for (let seed = 1; seed <= 40; seed++) {
      for (const bar of generateExercise(s, { seed }).bars) {
        if (bar.events.some(e => e.rest && e.value === 'q')) viuPausaDeSeminima = true;
        // e nunca quatro pausas de semicolcheia seguidas dentro do mesmo tempo
        const r16 = bar.events.filter(e => e.rest && e.value === '16');
        for (const a of r16) {
          const mesmoTempo = r16.filter(b => Math.floor(b.at / 24) === Math.floor(a.at / 24));
          expect(mesmoTempo.length).toBeLessThan(4);
        }
      }
    }
    expect(viuPausaDeSeminima).toBe(true);
  });

  it('o compasso é majoritariamente pausa — é o ponto do preset', () => {
    const m = METERS[s.meter];
    for (let seed = 1; seed <= 20; seed++) {
      for (const bar of generateExercise(s, { seed }).bars) {
        const pausa = bar.events.filter(e => e.rest).reduce((t, e) => t + e.dur, 0);
        expect(pausa).toBeGreaterThan(m.barTicks / 2);
      }
    }
  });
});

describe('linha do tempo', () => {
  it('não reataca notas ligadas e cobre o exercício inteiro', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const ex = generateExercise(settings(), { seed });
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
