// Partes comuns das ferramentas: registro de tempo no histórico e o metrônomo reaproveitável.
import { useEffect, useRef, useState } from 'react';
import { atTime, Clock, drum } from '../audio/engine';
import type { ModuleId } from '../catalog/taxonomy';
import { logActivity, type ActivityParams } from '../state/store';
import { Btn, Chip } from '../components/ui';
import { useT } from '../i18n';

/** Soma o tempo em que a ferramenta ficou ativa e registra no histórico ao sair. */
/**
 * Conta o tempo de uso de um ambiente e grava a atividade ao sair.
 *
 * `snapshot` guarda com que configuração a prática rodou (F3-9). Ambiente não produz tentativa
 * nenhuma, então sem ele a atividade não deixa rastro de conteúdo — e "em que tonalidade eu
 * pratiquei?" fica sem resposta.
 */
export function useToolLog(id: string, title: string, module: ModuleId, active: boolean, snapshot?: ActivityParams) {
  const acc = useRef(0);
  const since = useRef<number | null>(null);
  const snap = useRef(snapshot);
  snap.current = snapshot;
  useEffect(() => {
    if (active) since.current = Date.now();
    else if (since.current) { acc.current += Date.now() - since.current; since.current = null; }
  }, [active]);
  useEffect(() => () => {
    const total = acc.current + (since.current ? Date.now() - since.current : 0);
    logActivity({ id, title, module, seconds: Math.round(total / 1000), snapshot: snap.current });
  }, [id, title, module]);
}

export function Metronome({ compact = false, onRunning }: { compact?: boolean; onRunning?: (r: boolean) => void }) {
  const t = useT();
  const [bpm, setBpm] = useState(80);
  const [beats, setBeats] = useState(4);
  const [sub, setSub] = useState(1);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const clock = useRef<Clock | null>(null);
  const taps = useRef<number[]>([]);
  const cfg = useRef({ beats, sub });
  cfg.current = { beats, sub };

  useEffect(() => () => clock.current?.stop(), []);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);
  useEffect(() => { if (clock.current) clock.current.stepsPerBeat = sub; }, [sub]);
  useEffect(() => onRunning?.(running), [running, onRunning]);

  const toggle = () => {
    if (running) { clock.current?.stop(); setRunning(false); setBeat(-1); return; }
    const c = new Clock(bpm, sub, (i, t) => {
      const { beats: b, sub: sb } = cfg.current;
      const onBeat = i % sb === 0;
      const n = Math.floor(i / sb) % b;
      drum(onBeat ? (n === 0 ? 'clique-forte' : 'clique') : 'clique', t, onBeat ? 1 : 0.35);
      if (onBeat) atTime(t, () => setBeat(n));
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };
  const tap = () => {
    const t = performance.now();
    taps.current = [...taps.current.filter(x => t - x < 3000), t].slice(-5);
    if (taps.current.length >= 2) {
      const d = taps.current.slice(1).map((x, i) => x - taps.current[i]);
      setBpm(Math.round(60000 / (d.reduce((a, z) => a + z, 0) / d.length)));
    }
  };

  return (
    <div className="metro" style={{ background: 'var(--co)', padding: compact ? 16 : 24, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: compact ? 44 : 72, lineHeight: 0.9 }} className="num">♩ = {bpm}</span>
        <span className="eyebrow" style={{ color: 'var(--cream)', marginLeft: 'auto' }}>{tempoName(bpm)}</span>
      </div>
      <input className="range" type="range" min={30} max={240} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label={t('common.tempo')} id={compact ? 'bpm-c' : 'bpm'} />
      <div style={{ display: 'flex', gap: 10 }} aria-hidden="true">
        {Array.from({ length: beats }, (_, i) => (
          <div key={i} style={{ flex: 1, height: compact ? 10 : 16, transform: 'skewX(-12deg)', background: beat === i ? (i === 0 ? 'var(--mu)' : 'var(--cream)') : 'rgba(0,0,0,.28)', transition: 'background .05s' }} />
        ))}
      </div>
      <div className="row">
        <Btn onClick={toggle} tone={running ? 'mu' : undefined} small={compact}>{t(running ? 'common.stop' : 'common.play')}</Btn>
        <Btn onClick={tap} tone="ghost" small>{t('metronome.tap')}</Btn>
        <Btn onClick={() => setBpm(b => Math.max(30, b - 4))} tone="ghost" small>−4</Btn>
        <Btn onClick={() => setBpm(b => Math.min(240, b + 4))} tone="ghost" small>+4</Btn>
      </div>
      {!compact && (
        <div className="row">
          <span className="eyebrow" style={{ color: 'var(--cream)' }}>{t('metronome.meter')}</span>
          {[2, 3, 4, 5, 6].map(n => <Chip key={n} on={beats === n} onClick={() => setBeats(n)}>{n}/4</Chip>)}
          <span className="eyebrow" style={{ color: 'var(--cream)', marginLeft: 12 }}>{t('metronome.subdivision')}</span>
          {[[1, '♩'], [2, '♫'], [3, '3'], [4, '♬']].map(([n, l]) => <Chip key={n} on={sub === n} onClick={() => setSub(Number(n))}>{l}</Chip>)}
        </div>
      )}
    </div>
  );
}

export function tempoName(v: number) {
  return v < 60 ? 'Largo' : v < 76 ? 'Adagio' : v < 108 ? 'Andante' : v < 120 ? 'Moderato' : v < 168 ? 'Allegro' : 'Presto';
}

export function fmtClock(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}
