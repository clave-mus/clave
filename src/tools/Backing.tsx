// Backing track sandbox: progressão, levada, análise harmônica e sugestão de escalas.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { atTime, Clock, drum, tone, type Drum, type Voice } from '../audio/engine';
import { useStore } from '../state/store';
import {
  buildScale, chordSymbol, CHORDS, harmonicField, majorTonic, mod, note, noteName, pc, transpose,
  type ChordId, type Convention, type Note, type ScaleId,
} from '../theory/core';
import Fretboard, { TUNINGS } from '../components/music/Fretboard';
import Keyboard from '../components/music/Keyboard';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useLocale, useNaming, useT, type MessageKey } from '../i18n';

interface Item { deg: number; type?: ChordId; flat?: boolean }
type Style = 'rock' | 'balada' | 'bossa' | 'samba' | 'swing' | 'shuffle' | 'baiao' | 'nenhum';
interface Preset { id: string; name: MessageKey; mode: 'maior' | 'menor'; items: Item[]; style: Style; bpm: number; tetrads: boolean }

const P = (deg: number, type?: ChordId, flat?: boolean): Item => ({ deg, type, flat });
export const PRESETS: Preset[] = [
  { id: 'pop', name: 'backing.presetPop', mode: 'maior', items: [P(1), P(5), P(6), P(4)], style: 'rock', bpm: 96, tetrads: false },
  { id: 'ii-v-i', name: 'backing.presetIiVI', mode: 'maior', items: [P(2), P(5), P(1), P(1)], style: 'swing', bpm: 132, tetrads: true },
  { id: 'blues', name: 'backing.presetBlues', mode: 'maior', items: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5].map(d => P(d, '7')), style: 'shuffle', bpm: 88, tetrads: true },
  { id: 'bossa', name: 'backing.presetBossa', mode: 'maior', items: [P(1), P(6, '7'), P(2), P(5)], style: 'bossa', bpm: 128, tetrads: true },
  { id: 'samba', name: 'backing.presetSamba', mode: 'maior', items: [P(1), P(6, '7'), P(2), P(5, '7')], style: 'samba', bpm: 98, tetrads: false },
  { id: 'andaluz', name: 'backing.presetAndalusian', mode: 'menor', items: [P(1), P(7), P(6), P(5, 'maior')], style: 'balada', bpm: 80, tetrads: false },
  { id: 'baiao', name: 'backing.presetBaiao', mode: 'maior', items: [P(1, '7'), P(1, '7'), P(7, 'maior', true), P(1, '7')], style: 'baiao', bpm: 104, tetrads: false },
];

// ---------------- levadas ----------------
interface Groove { grid: number; kick: number[]; snare: number[]; hat: number[]; rim?: number[]; bass: [number, number, number][]; comp: [number, number][] }
// bass: [passo, grau (0 tônica, 7 quinta, 12 oitava, -1 = nota de aproximação), duração em passos]
const GROOVES: Record<Style, Groove> = {
  rock: { grid: 16, kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [[0, 0, 2], [2, 0, 2], [4, 0, 2], [6, 0, 2], [8, 0, 2], [10, 0, 2], [12, 0, 2], [14, 7, 2]], comp: [[0, 6], [6, 2], [8, 8]] },
  balada: { grid: 16, kick: [0, 7, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [[0, 0, 6], [6, 0, 2], [8, 7, 8]], comp: [[0, 16]] },
  bossa: { grid: 16, kick: [0, 6, 8, 14], snare: [], hat: [0, 2, 4, 6, 8, 10, 12, 14], rim: [0, 3, 6, 10, 12], bass: [[0, 0, 6], [6, 7, 2], [8, 7, 6], [14, 0, 2]], comp: [[0, 3], [3, 3], [6, 4], [10, 2], [12, 4]] },
  samba: { grid: 16, kick: [4, 12], snare: [2, 5, 7, 10, 13, 15], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], bass: [[0, 0, 3], [3, 7, 1], [4, 7, 4], [8, 0, 3], [11, 7, 1], [12, 7, 4]], comp: [[2, 2], [5, 2], [7, 3], [10, 2], [13, 3]] },
  baiao: { grid: 16, kick: [0, 6, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], rim: [2, 6, 10, 14], bass: [[0, 0, 6], [6, 0, 2], [8, 7, 8]], comp: [[0, 3], [6, 2], [8, 4], [14, 2]] },
  swing: { grid: 12, kick: [0, 6], snare: [], hat: [0, 3, 5, 6, 9, 11], rim: [3, 9], bass: [[0, 0, 3], [3, 4, 3], [6, 7, 3], [9, -1, 3]], comp: [[0, 3], [5, 4]] },
  shuffle: { grid: 12, kick: [0, 6], snare: [3, 9], hat: [0, 2, 3, 5, 6, 8, 9, 11], bass: [[0, 0, 2], [2, 0, 1], [3, 4, 2], [5, 4, 1], [6, 7, 2], [8, 7, 1], [9, 9, 2], [11, 7, 1]], comp: [[2, 1], [5, 1], [8, 1], [11, 1]] },
  nenhum: { grid: 16, kick: [], snare: [], hat: [], bass: [[0, 0, 16]], comp: [[0, 16]] },
};
const STYLE_NAMES: Record<Style, MessageKey> = {
  rock: 'backing.styleRock', balada: 'backing.styleBallad', bossa: 'backing.styleBossa', samba: 'backing.styleSamba',
  baiao: 'backing.styleBaiao', swing: 'backing.styleSwing', shuffle: 'backing.styleShuffle', nenhum: 'backing.styleNone',
};
const VOICES: [Voice, MessageKey][] = [['piano', 'voices.piano'], ['pad', 'voices.pad'], ['violao', 'voices.violao'], ['orgao', 'voices.orgao']];

// ---------------- harmonia ----------------
interface Resolved { root: Note; type: ChordId; symbol: string; roman: string; scales: { id: ScaleId; root: Note; why: MessageKey }[] }
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function romanFor(deg: number, type: ChordId, flat: boolean, conv: Convention) {
  const minor = ['menor', 'm7', 'dim', 'm7b5', 'dim7'].includes(type);
  const r = (flat ? '♭' : '') + (minor ? ROMAN[deg - 1].toLowerCase() : ROMAN[deg - 1]);
  const suf: Partial<Record<ChordId, string>> = { '7': '7', '7M': conv === 'pt' ? '7M' : 'maj7', m7: '7', m7b5: 'ø', dim: '°', dim7: '°7', aum: '+' };
  return r + (suf[type] ?? '');
}
function resolve(item: Item, tonic: Note, mode: 'maior' | 'menor', tetrads: boolean, conv: Convention): Resolved {
  const field = harmonicField(tonic, mode, tetrads, conv);
  const f = field[item.deg - 1];
  const root = item.flat ? { ...f.root, acc: f.root.acc - 1 } : f.root;
  const type = item.type ?? f.chord;
  const roman = !item.type && !item.flat ? f.roman : romanFor(item.deg, type, !!item.flat || (mode === 'menor' && [3, 6, 7].includes(item.deg)), conv);
  return { root, type, symbol: chordSymbol(root, type, conv), roman, scales: suggestScales(root, type, item.deg, mode, !!item.type || !!item.flat) };
}
function suggestScales(root: Note, type: ChordId, deg: number, mode: 'maior' | 'menor', borrowed: boolean): Resolved['scales'] {
  const s = (id: ScaleId, why: MessageKey) => ({ id, root, why });
  if (type === '7') return [s('mixolidio', 'backing.whyDominant'), s('blues', 'backing.whyBlues')];
  if (type === 'm7b5' || type === 'dim' || type === 'dim7') return [s('locrio', 'backing.whyHalfDim')];
  if (type === '7M' || type === 'maior') {
    if (!borrowed && mode === 'maior' && deg === 4) return [s('lidio', 'backing.whyIvMajor'), s('penta-maior', 'backing.whySafe')];
    return [s('maior', 'backing.whyMajorChord'), s('penta-maior', 'backing.whySafe')];
  }
  if (!borrowed && mode === 'maior') {
    if (deg === 2) return [s('dorico', 'backing.whyIiMajor'), s('penta-menor', 'backing.whySafe')];
    if (deg === 3) return [s('frigio', 'backing.whyIiiMajor'), s('penta-menor', 'backing.whySafe')];
  }
  if (!borrowed && mode === 'menor' && deg === 4) return [s('dorico', 'backing.whyIvMinor'), s('penta-menor', 'backing.whySafe')];
  return [s('menor', 'backing.whyMinorChord'), s('penta-menor', 'backing.whySafe')];
}
const voice = (root: Note, type: ChordId) => {
  const r = pc(root);
  return CHORDS[type].degs.map(([, semi]) => 55 + mod(r + semi - 55, 12)).sort((a, b) => a - b);
};

export default function Backing({ presetId }: { presetId?: string }) {
  const [params] = useSearchParams();
  const naming = useNaming();
  const conv = useLocale();
  const t = useT();
  const instrument = useStore(s => s.profile.instrument);
  const initial = PRESETS.find(p => p.id === (presetId ?? params.get('p'))) ?? PRESETS[0];
  const [fifths, setFifths] = useState(0);
  const [mode, setMode] = useState(initial.mode);
  const [items, setItems] = useState<Item[]>(initial.items);
  const [tetrads, setTetrads] = useState(initial.tetrads);
  const [style, setStyle] = useState<Style>(initial.style);
  const [bpm, setBpm] = useState(initial.bpm);
  const [compVoice, setCompVoice] = useState<Voice>('piano');
  const [bassOn, setBassOn] = useState(true);
  const [running, setRunning] = useState(false);
  const [bar, setBar] = useState(0);
  const [view, setView] = useState<'teclado' | 'braco'>(instrument === 'piano' ? 'teclado' : 'braco');
  const clock = useRef<Clock | null>(null);
  const tonic = useMemo(() => (mode === 'maior' ? majorTonic(fifths) : transpose(majorTonic(fifths), { num: 6, semis: 9 })), [fifths, mode]);
  // O que a pessoa praticou: a tonalidade e o andamento. Só a tonalidade vai em `params`, porque é só
  // ela que esta ferramenta usa — gravar região e material seria afirmar o que ela ignora.
  useToolLog('backing', 'Backing track', 'perception.harmonic', running, {
    settings: { bpm }, params: { key: { tonic: pc(tonic), mode } },
  });
  const chords = useMemo(() => items.map(i => resolve(i, tonic, mode, tetrads, conv)), [items, tonic, mode, tetrads, conv]);
  const field = useMemo(() => harmonicField(tonic, mode, tetrads, conv), [tonic, mode, tetrads, conv]);
  const live = useRef({ chords, style, bassOn, compVoice });
  live.current = { chords, style, bassOn, compVoice };

  useEffect(() => () => clock.current?.stop(), []);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);

  const start = () => {
    if (running) { clock.current?.stop(); setRunning(false); return; }
    const g0 = GROOVES[style];
    const c = new Clock(bpm, g0.grid / 4, (i, t) => {
      const { chords: cs, style: st, bassOn: bo, compVoice: cv } = live.current;
      const g = GROOVES[st];
      if (!cs.length) return;
      const step = i % g.grid;
      const bi = Math.floor(i / g.grid) % cs.length;
      const ch = cs[bi];
      const nextCh = cs[(bi + 1) % cs.length];
      const sd = 60 / (clock.current?.bpm ?? bpm) / (g.grid / 4);
      if (step === 0) atTime(t, () => setBar(bi));
      const hit = (arr: number[] | undefined, k: Drum, v = 1) => arr?.includes(step) && drum(k, t, v);
      hit(g.kick, 'bumbo'); hit(g.snare, 'caixa', st === 'samba' ? 0.45 : 1); hit(g.hat, 'chimbal', step % (g.grid / 4) === 0 ? 0.9 : 0.55); hit(g.rim, 'aro', 0.8);
      const rootMidi = 36 + mod(pc(ch.root) - 36, 12);
      if (bo) g.bass.forEach(([s, semi, d]) => {
        if (s !== step) return;
        let m = rootMidi + (semi === 4 ? CHORDS[ch.type].degs[1][1] : semi === 9 ? 9 : semi);
        if (semi === -1) { const nr = 36 + mod(pc(nextCh.root) - 36, 12); m = nr + (Math.random() < 0.5 ? 1 : -1); }
        tone(m, t, d * sd * 0.92, 'baixo', 0.9);
      });
      g.comp.forEach(([s, d]) => s === step && voice(ch.root, ch.type).forEach(m => tone(m, t, d * sd * 0.95, cv, cv === 'pad' ? 0.8 : 0.45)));
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };

  const loadPreset = (p: Preset) => {
    setItems(p.items); setMode(p.mode); setStyle(p.style); setBpm(p.bpm); setTetrads(p.tetrads); setBar(0);
    if (clock.current) clock.current.stepsPerBeat = GROOVES[p.style].grid / 4;
  };
  const changeStyle = (s: Style) => { setStyle(s); if (clock.current) clock.current.stepsPerBeat = GROOVES[s].grid / 4; };

  const cur = chords[Math.min(bar, chords.length - 1)];
  const [scaleIdx, setScaleIdx] = useState(0);
  const sc = cur?.scales[Math.min(scaleIdx, cur.scales.length - 1)];
  const scaleNotes = sc ? buildScale(sc.root, sc.id) : [];
  const chordPcs = cur ? CHORDS[cur.type].degs.map(([, s]) => mod(pc(cur.root) + s, 12)) : [];
  const scalePcs = scaleNotes.map(pc);
  const kMarks: Record<number, string> = {};
  for (let m = 48; m <= 83; m++) {
    if (chordPcs.includes(m % 12)) kMarks[m] = 'var(--ve)';
    else if (scalePcs.includes(m % 12)) kMarks[m] = 'var(--mu)';
  }
  const tuning = instrument === 'baixo' ? TUNINGS.baixo : TUNINGS.violao;
  const fMarks = tuning.flatMap((open, s) => Array.from({ length: 13 }, (_, f) => f).filter(f => scalePcs.includes(mod(open + f, 12))).map(f => ({
    s, f, color: chordPcs.includes(mod(open + f, 12)) ? 'var(--ve)' : undefined, label: noteName(scaleNotes[scalePcs.indexOf(mod(open + f, 12))] ?? note(0), naming),
  })));

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="panel" style={{ display: 'grid', gap: 14 }}>
        <div className="row"><span className="eyebrow">{t('backing.readyMade')}</span>{PRESETS.map(p => <Chip key={p.id} onClick={() => loadPreset(p)}>{t(p.name)}</Chip>)}</div>
        <div className="row">
          <span className="eyebrow">{t('backing.key')}</span>
          <select className="sel" value={fifths} onChange={e => setFifths(Number(e.target.value))} aria-label={t('backing.tonality')} id="bk-tom">
            {Array.from({ length: 13 }, (_, i) => i - 6).map(f => <option key={f} value={f}>{noteName(mode === 'maior' ? majorTonic(f) : transpose(majorTonic(f), { num: 6, semis: 9 }), naming)}</option>)}
          </select>
          <Chip on={mode === 'maior'} onClick={() => setMode('maior')}>{t('backing.major')}</Chip>
          <Chip on={mode === 'menor'} onClick={() => setMode('menor')}>{t('backing.minor')}</Chip>
          <Chip on={tetrads} onClick={() => setTetrads(v => !v)}>{t('backing.tetrads')}</Chip>
        </div>
      </section>

      <section style={{ background: 'var(--co)', padding: 20, display: 'grid', gap: 16 }}>
        <div className="row" style={{ alignItems: 'stretch' }}>
          {chords.map((c, i) => (
            <button key={i} type="button" onClick={() => setBar(i)} style={{
              border: 0, cursor: 'pointer', minWidth: 84, padding: '10px 12px', textAlign: 'left',
              background: running && i === bar ? 'var(--mu)' : i === bar ? 'var(--cream)' : 'rgba(0,0,0,.28)', color: i === bar ? 'var(--bk)' : 'var(--cream)',
            }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30, lineHeight: 1 }}>{c.symbol}</div>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{c.roman}</div>
            </button>
          ))}
        </div>
        <div className="row">
          <Btn onClick={start} tone={running ? 'mu' : undefined}>{t(running ? 'common.stop' : 'common.playPlay')}</Btn>
          <span className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30 }}>♩ = {bpm}</span>
          <input className="range" style={{ maxWidth: 220 }} type="range" min={50} max={220} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label={t('common.tempo')} id="bk-bpm" />
        </div>
        <div className="row"><span className="eyebrow" style={{ color: 'var(--cream)' }}>{t('backing.groove')}</span>{(Object.keys(STYLE_NAMES) as Style[]).map(s => <Chip key={s} on={style === s} onClick={() => changeStyle(s)}>{t(STYLE_NAMES[s])}</Chip>)}</div>
        <div className="row">
          <span className="eyebrow" style={{ color: 'var(--cream)' }}>{t('backing.chordSound')}</span>
          {VOICES.map(([v, l]) => <Chip key={v} on={compVoice === v} onClick={() => setCompVoice(v)}>{t(l)}</Chip>)}
          <Chip on={bassOn} onClick={() => setBassOn(v => !v)}>{t('backing.bass')}</Chip>
        </div>
      </section>

      <section className="panel" style={{ display: 'grid', gap: 10 }}>
        <div className="eyebrow">{t(mode === 'maior' ? 'backing.buildYoursMajor' : 'backing.buildYoursMinor', { tonic: noteName(tonic, naming) })}</div>
        <div className="row">
          {field.map(d => <Chip key={d.degree} onClick={() => setItems(v => [...v, { deg: d.degree }])}><b>{d.roman}</b> · {d.symbol}</Chip>)}
        </div>
        <div className="row">
          <Btn small tone="ghost" onClick={() => setItems(v => v.slice(0, -1))} disabled={!items.length}>{t('backing.deleteLast')}</Btn>
          <Btn small tone="ghost" onClick={() => { setItems([]); setBar(0); }}>{t('backing.clear')}</Btn>
        </div>
      </section>

      {cur && (
        <section className="panel" style={{ display: 'grid', gap: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow">{t('backing.overChord', { chord: cur.symbol, roman: cur.roman })}</div>
              <div className="row" style={{ marginTop: 8 }}>
                {cur.scales.map((s, i) => <Chip key={s.id} on={i === Math.min(scaleIdx, cur.scales.length - 1)} onClick={() => setScaleIdx(i)}>{noteName(s.root, naming)} {t(`theory.scales.${s.id}` as MessageKey)} ({t(s.why)})</Chip>)}
              </div>
            </div>
            <div className="row">
              <Chip on={view === 'teclado'} onClick={() => setView('teclado')}>{t('backing.keyboard')}</Chip>
              <Chip on={view === 'braco'} onClick={() => setView('braco')}>{t('backing.neck')}</Chip>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 14 }}>
            {t('backing.notesLine', { notes: scaleNotes.map(n => noteName(n, naming)).join(' · ') })} <span style={{ color: 'var(--ve)' }}>■</span> {t('backing.chordNotes')} · <span style={{ color: 'var(--mu)' }}>■</span> {t('backing.restOfScale')}
          </div>
          {view === 'teclado'
            ? <Keyboard lo={48} hi={83} marks={kMarks} naming={naming} />
            : <Fretboard tuning={tuning} from={0} to={12} marks={fMarks} naming={naming} />}
        </section>
      )}
    </div>
  );
}
