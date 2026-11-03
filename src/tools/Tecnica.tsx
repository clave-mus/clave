// Rotinas de técnica com metrônomo progressivo. Sempre devagar e limpo antes de rápido.
import { useEffect, useMemo, useRef, useState } from 'react';
import { atTime, Clock, drum, tone } from '../audio/engine';
import { useStore } from '../state/store';
import { pcName } from '../theory/core';
import Keyboard from '../components/music/Keyboard';
import { TUNINGS } from '../components/music/Fretboard';
import { Btn, Chip } from '../components/ui';
import { useGlobalParams } from '../catalog/params';
import { useToolLog } from './common';
import { useNaming, useT, type MessageKey } from '../i18n';

interface Pos { s: number; f: number; finger?: number }
interface Routine { id: string; name: MessageKey; desc: MessageKey; for: ('violao' | 'baixo' | 'piano')[]; build: (strings: number) => Pos[] }

const ROUTINES: Routine[] = [
  {
    id: 'tqo', name: 'technique.tqoName', desc: 'technique.tqoDesc', for: ['violao', 'baixo'],
    build: () => [3, 5, 7, 8, 5, 3].flatMap((r, i) => {
      const s = i % 2; // alterna raiz na corda mais grave e na seguinte
      return [{ s, f: r, finger: 2 }, { s: s + 1, f: r + 2, finger: 4 }, { s: s + 2, f: r + 2, finger: 4 }, { s: s + 1, f: r + 2, finger: 4 }];
    }),
  },
  {
    id: 'aranha', name: 'technique.spiderName', desc: 'technique.spiderDesc', for: ['violao', 'baixo'],
    build: n => {
      const out: Pos[] = [];
      for (let pos = 1; pos <= 3; pos++) {
        for (let s = 0; s < n; s++) for (let k = 0; k < 4; k++) out.push({ s, f: pos + k, finger: k + 1 });
        for (let s = n - 1; s >= 0; s--) for (let k = 3; k >= 0; k--) out.push({ s, f: pos + 1 + k, finger: k + 1 });
      }
      return out;
    },
  },
  {
    id: 'cinco', name: 'technique.fiveName', desc: 'technique.fiveDesc', for: ['piano'],
    build: () => [60, 62, 64].flatMap(r => {
      const up = [0, 2, 4, 5, 7];
      const seq = [...up, ...up.slice(0, -1).reverse()];
      return seq.map((semi, i) => ({ s: 0, f: r + semi, finger: i < 5 ? i + 1 : 9 - i }));
    }),
  },
];

export default function Tecnica() {
  const instrument = useStore(s => s.profile.instrument);
  const naming = useNaming();
  const t = useT();
  const params = useGlobalParams();
  const available = ROUTINES.filter(r => r.for.includes(instrument));
  const [routine, setRoutine] = useState(available[0] ?? ROUTINES[0]);
  const [bpm, setBpm] = useState(70);
  const [sub, setSub] = useState(2);
  const [climb, setClimb] = useState(true);
  const [hear, setHear] = useState(false);
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [round, setRound] = useState(0);
  const clock = useRef<Clock | null>(null);
  useToolLog('tecnica', 'Rotinas de técnica', 'technique', running);

  const tuning = instrument === 'baixo' ? TUNINGS.baixo : TUNINGS.violao;
  const seq = useMemo(() => routine.build(tuning.length), [routine, tuning.length]);
  // o timbre é o escolhido para o instrumento no Perfil (ver SoundPanel)
  const live = useRef({ seq, hear, climb, voice: params.timbres[instrument] });
  live.current = { seq, hear, climb, voice: params.timbres[instrument] };
  useEffect(() => () => clock.current?.stop(), []);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);
  useEffect(() => { clock.current?.stop(); setRunning(false); setIdx(-1); }, [routine]);

  const toggle = () => {
    if (running) { clock.current?.stop(); setRunning(false); setIdx(-1); return; }
    setRound(0);
    const c = new Clock(bpm, sub, (i, t) => {
      const L = live.current;
      if (i % sub === 0) drum(Math.floor(i / sub) % 4 === 0 ? 'clique-forte' : 'clique', t, 0.8);
      if (i < 4 * sub) return; // contagem
      const k = i - 4 * sub;
      const n = k % L.seq.length;
      if (n === 0 && k > 0) {
        atTime(t, () => setRound(r => r + 1));
        if (L.climb && clock.current) { clock.current.bpm += 4; atTime(t, () => setBpm(clock.current?.bpm ?? 0)); }
      }
      atTime(t, () => setIdx(n));
      const p = L.seq[n];
      if (L.hear) tone(instrument === 'piano' ? p.f : tuning[p.s] + p.f, t, 0.3, L.voice, 0.5);
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };

  const perLine = 16;
  const lineStart = idx < 0 ? 0 : Math.floor(idx / perLine) * perLine;
  const window_ = seq.slice(lineStart, lineStart + perLine);
  const isPiano = instrument === 'piano';

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="row">
        {available.map(r => <Chip key={r.id} on={r.id === routine.id} onClick={() => setRoutine(r)}>{t(r.name)}</Chip>)}
      </div>
      <p className="muted">{t(routine.desc)}</p>

      <div style={{ background: 'var(--co)', padding: 18, overflowX: 'auto' }}>
        {isPiano ? (
          <Keyboard lo={60} hi={76} marks={idx >= 0 ? { [seq[idx].f]: 'var(--mu)' } : {}} naming={naming} labels="all" />
        ) : (
          <svg viewBox={`0 0 ${40 + perLine * 38} ${26 + (tuning.length - 1) * 22 + 22}`} style={{ width: '100%', minWidth: 520, display: 'block' }} role="img" aria-label={t('technique.tab')}>
            {tuning.map((open, s) => {
              const y = 18 + (tuning.length - 1 - s) * 22;
              return <g key={s}>
                <text x="4" y={y + 4} fontSize="12" fill="var(--cream)" fontFamily="var(--body)" fontWeight="600">{pcName(open, naming, false)}</text>
                <path d={`M30,${y} H${36 + perLine * 38}`} stroke="var(--cream)" strokeWidth="1" opacity="0.8" />
              </g>;
            })}
            {window_.map((p, i) => {
              const x = 48 + i * 38;
              const y = 18 + (tuning.length - 1 - p.s) * 22;
              const on = lineStart + i === idx;
              return <g key={i}>
                <rect x={x - 11} y={y - 10} width="22" height="20" fill={on ? 'var(--mu)' : 'var(--co)'} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={on ? 'var(--bk)' : 'var(--cream)'} fontFamily="var(--body)">{p.f}</text>
                {p.finger && <text x={x} y={20 + (tuning.length - 1) * 22 + 18} textAnchor="middle" fontSize="10" fill="var(--cream)" opacity="0.7" fontFamily="var(--body)">{p.finger}</text>}
              </g>;
            })}
          </svg>
        )}
      </div>

      <div className="row">
        <Btn onClick={toggle} tone={running ? 'mu' : undefined}>{t(running ? 'common.stop' : 'common.startPlay')}</Btn>
        <span className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30 }}>♩ = {bpm}</span>
        <input className="range" style={{ maxWidth: 200 }} type="range" min={40} max={200} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label={t('common.tempo')} id="tc-bpm" />
        {!running && ([[1, '♩'], [2, '♫'], [4, '♬']] as const).map(([n, figure]) => <Chip key={n} on={sub === n} onClick={() => setSub(n)}>{t('technique.perNote', { figure })}</Chip>)}
      </div>
      <div className="row">
        <label className="switch"><input type="checkbox" id="tc-climb" checked={climb} onChange={e => setClimb(e.target.checked)} />{t('technique.climb')}</label>
        <label className="switch"><input type="checkbox" id="tc-hear" checked={hear} onChange={e => setHear(e.target.checked)} />{t('technique.hear')}</label>
        {running && <span className="muted">{t('technique.round', { n: round + 1 })}</span>}
      </div>
    </div>
  );
}
