// Partitura rítmica com VexFlow (a mesma biblioteca do protótipo do gerador de partituras).
// Pauta de uma linha só (as outras quatro ficam ocultas), clave de percussão e todas as notas
// na mesma altura. Os compassos se distribuem em linhas conforme a largura disponível.
import { useEffect, useRef, useState } from 'react';
import { Beam, BarlineType, Dot, Formatter, Renderer, Stave, StaveNote, StaveTie, Tuplet, Voice, type StemmableNote } from 'vexflow/bravura';
import { METERS, type Meter } from '../../theory/rhythm-cells';
import type { Bar, Exercise, RhythmEvent } from '../../theory/rhythm-gen';
import { useT } from '../../i18n';

const LINE_H = 96; // altura lógica de cada linha
const ONLY_MIDDLE_LINE = [0, 1, 2, 3, 4].map(i => ({ visible: i === 2 }));
const CLEF_W = 34;
const TIME_W = 26;
/** O espaço à esquerda é reservado em TODA linha, mesmo onde a fórmula não é desenhada — é o que
 *  faz os compassos da primeira linha terem exatamente a mesma largura dos das outras. */
const HEAD_W = CLEF_W + TIME_W;
/** Unidades lógicas por tick. Dá a largura do compasso a partir da DURAÇÃO dele, não do que ele
 *  contém: é isso que mantém o tamanho igual de um exercício para o outro. */
const W_POR_TICK = 3.2;

/**
 * Quantos compassos por linha.
 *
 * **Não depende do conteúdo** (06/11/2026, pedido do Paulo). Antes dependia: a largura mínima era a
 * soma das figuras do compasso, então quatro compassos caíam em uma linha quando o exercício era
 * ralo e em duas quando era denso — a página mudava de forma a cada "novo exercício", e ele leu isso
 * como confusão, com razão. Agora a largura vem da fórmula de compasso, que não muda entre sorteios.
 */
function barsPerLine(ex: Exercise, logicalW: number): number {
  const n = ex.bars.length;
  const larguraDoCompasso = METERS[ex.meter].barTicks * W_POR_TICK;
  const fit = Math.max(1, Math.min(n, 4, Math.floor((logicalW - HEAD_W) / larguraDoCompasso)));
  for (let k = fit; k > 1; k--) if (n % k === 0) return k;
  return 1;
}

/** Barras de ligação por pulso; pausas nas pontas ficam de fora, pausas no meio ficam sob a barra. */
function beamGroups(bar: Bar, m: Meter): number[][] {
  const out: number[][] = [];
  let run: number[] = [];
  let window = -1;
  const flush = () => {
    let a = 0;
    let b = run.length - 1;
    while (a <= b && bar.events[run[a]].rest) a++;
    while (b >= a && bar.events[run[b]].rest) b--;
    const slice = run.slice(a, b + 1);
    if (slice.filter(i => !bar.events[i].rest).length >= 2) out.push(slice);
    run = [];
  };
  bar.events.forEach((e, i) => {
    const w = Math.floor(e.at / m.beatTicks);
    const beamable = e.value === '8' || e.value === '16';
    if (!beamable || w !== window) flush();
    window = w;
    if (beamable) run.push(i);
  });
  flush();
  return out;
}

interface Props {
  exercise: Exercise;
  /** Figura em destaque, como "compasso:índice". */
  active?: string | null;
  onError?: (msg: string) => void;
}

export default function RhythmScore({ exercise, active = null, onError }: Props) {
  const t = useT();
  const host = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, SVGElement>());
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const el = host.current!;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el || width < 50) return;
    el.innerHTML = '';
    els.current.clear();
    try {
      draw(el, exercise, width, els.current);
      setFailed(null);
    } catch (err) {
      el.innerHTML = '';
      const msg = err instanceof Error ? err.message : String(err);
      setFailed(msg);
      onError?.(msg);
    }
  }, [exercise, width, onError]);

  useEffect(() => {
    if (!active) return;
    const el = els.current.get(active);
    if (!el) return;
    el.classList.add('is-active');
    // Acompanha a leitura rolando a página, mas só se a partitura estiver na tela (não puxa quem foi mexer nos ajustes).
    const box = host.current?.getBoundingClientRect();
    if (box && box.bottom > 0 && box.top < window.innerHeight) el.closest('.rs-line')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return () => el.classList.remove('is-active');
  }, [active, exercise, width]);

  const m = METERS[exercise.meter];
  return (
    <div className="rhythm-score" role="img" aria-label={t('music.rhythmScore', { bars: exercise.bars.length, meter: m.id })}>
      <div ref={host} />
      {failed && <p className="rs-error">Não deu para desenhar este exercício. Gere outro.</p>}
    </div>
  );
}

function draw(el: HTMLDivElement, ex: Exercise, width: number, els: Map<string, SVGElement>) {
  const m = METERS[ex.meter];
  const scale = width < 480 ? 1 : width < 820 ? 1.2 : 1.4; // notação maior quando há espaço
  const logicalW = width / scale;
  const k = barsPerLine(ex, logicalW);
  const color = getComputedStyle(el).color;
  const all: { note: StaveNote; ev: RhythmEvent; line: number; ctx: ReturnType<Renderer['getContext']> }[] = [];

  for (let l = 0; l * k < ex.bars.length; l++) {
    const bars = ex.bars.slice(l * k, l * k + k);
    const div = document.createElement('div');
    div.className = 'rs-line';
    el.appendChild(div);
    // Desenha em unidades lógicas; o viewBox faz o SVG acompanhar a largura da tela pelo CSS.
    const renderer = new Renderer(div, Renderer.Backends.SVG);
    renderer.resize(logicalW, LINE_H);
    const ctx = renderer.getContext();
    ctx.setFillStyle(color);
    ctx.setStrokeStyle(color);
    const svg = div.querySelector('svg');
    svg?.setAttribute('viewBox', `0 0 ${logicalW} ${LINE_H}`);
    svg?.removeAttribute('style');
    svg?.removeAttribute('width');
    svg?.removeAttribute('height');

    // **Todo compasso tem a mesma largura**, aqui e nas outras linhas: o espaço da fórmula é
    // reservado sempre (`HEAD_W`), e a sobra é dividida em partes iguais por `k` — não pelo número
    // de compassos desta linha, senão a última linha incompleta esticaria os seus.
    const porCompasso = (logicalW - HEAD_W - 2) / k;
    let x = 0;
    bars.forEach((bar, j) => {
      const bi = l * k + j;
      const w = porCompasso + (j === 0 ? HEAD_W : 0);
      const stave = new Stave(x, 0, w, { space_above_staff_ln: 4 });
      stave.setConfigForLines(ONLY_MIDDLE_LINE);
      stave.setBegBarType(BarlineType.NONE);
      if (j === 0) stave.addClef('percussion');
      if (j === 0 && l > 0) stave.setMeasure(bi + 1); // número do compasso no início de cada linha
      if (j === 0 && l === 0) stave.addTimeSignature(`${m.num}/${m.den}`);
      if (bi === ex.bars.length - 1) stave.setEndBarType(BarlineType.END);
      stave.setContext(ctx).draw();
      x += w;

      const notes = bar.events.map((ev, i) => {
        const n = new StaveNote({ keys: ['b/4'], duration: ev.value + (ev.rest ? 'r' : ''), dots: ev.dots, stem_direction: 1, clef: 'percussion' });
        if (ev.dots) Dot.buildAndAttach([n], { all: true });
        n.setAttribute('id', `rs-${bi}-${i}`);
        all.push({ note: n, ev, line: l, ctx });
        return n;
      });
      // Barras antes das quiálteras: a quiáltera só desenha colchete quando as notas não estão ligadas por barra.
      const beams = beamGroups(bar, m).map(g => new Beam(g.map(i => notes[i] as StemmableNote)));
      const tuplets: Tuplet[] = [];
      const seen = new Set<number>();
      bar.events.forEach(ev => {
        if (!ev.tuplet || seen.has(ev.tuplet.id)) return;
        seen.add(ev.tuplet.id);
        const group = notes.filter((_, i) => bar.events[i].tuplet?.id === ev.tuplet!.id);
        tuplets.push(new Tuplet(group, { num_notes: ev.tuplet.num, notes_occupied: ev.tuplet.occupied, location: 1, ratioed: false }));
      });
      const voice = new Voice({ num_beats: m.num, beat_value: m.den });
      voice.setStrict(true); // a VexFlow confere de novo se o compasso fecha
      voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], Math.max(20, stave.getNoteEndX() - stave.getNoteStartX() - 14));
      voice.draw(ctx, stave);
      beams.forEach(b => b.setContext(ctx).draw());
      tuplets.forEach(t => t.setContext(ctx).draw());
      notes.forEach((n, i) => { const g = n.getSVGElement(); if (g) els.set(`${bi}:${i}`, g); });
    });
  }

  // Ligaduras, inclusive de um compasso para o outro e de uma linha para a seguinte.
  all.forEach((a, i) => {
    if (!a.ev.tie) return;
    const b = all[i + 1];
    if (!b) return;
    if (a.line === b.line) {
      new StaveTie({ first_note: a.note, last_note: b.note, first_indices: [0], last_indices: [0] }).setContext(a.ctx).draw();
    } else {
      new StaveTie({ first_note: a.note, last_note: null, first_indices: [0], last_indices: [0] }).setContext(a.ctx).draw();
      new StaveTie({ first_note: null, last_note: b.note, first_indices: [0], last_indices: [0] }).setContext(b.ctx).draw();
    }
  });
}
