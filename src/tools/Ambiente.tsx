// Solfejar e tocar: uma sala silenciosa com drone, metrônomo e cronômetro com meta.
import { useEffect, useRef, useState } from 'react';
import { drone, playGroups } from '../audio/engine';
import { pcName } from '../theory/core';
import { Btn, Chip } from '../components/ui';
import { fmtClock, Metronome, useToolLog } from './common';
import { useNaming, useT, type MessageKey } from '../i18n';

const DRONES: { id: string; label: MessageKey; semis: number[] }[] = [
  { id: 'nota', label: 'ambient.droneTonic', semis: [0, 12] },
  { id: 'quinta', label: 'ambient.droneFifth', semis: [0, 7, 12] },
  { id: 'maior', label: 'ambient.droneMajor', semis: [0, 4, 7, 12] },
  { id: 'menor', label: 'ambient.droneMinor', semis: [0, 3, 7, 12] },
];

export default function Ambiente({ goalMinutes }: { goalMinutes?: number }) {
  const naming = useNaming();
  const t = useT();
  const [tonic, setTonic] = useState(0);
  const [kind, setKind] = useState('quinta');
  const [droneOn, setDroneOn] = useState(false);
  const [goal, setGoal] = useState(goalMinutes ?? 10);
  const [elapsed, setElapsed] = useState(0);
  const [timing, setTiming] = useState(false);
  const [metro, setMetro] = useState(false);
  const stopDrone = useRef<(() => void) | null>(null);
  const chimed = useRef(false);
  useToolLog('ambiente', 'Solfejar e tocar', 'perception.melodic', timing || droneOn || metro);

  useEffect(() => () => stopDrone.current?.(), []);
  useEffect(() => {
    if (!droneOn) { stopDrone.current?.(); stopDrone.current = null; return; }
    stopDrone.current?.();
    const semis = DRONES.find(d => d.id === kind)!.semis;
    stopDrone.current = drone(semis.map(s => 48 + tonic + s));
  }, [droneOn, tonic, kind]);
  useEffect(() => {
    if (!timing) return;
    const id = window.setInterval(() => setElapsed(e => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [timing]);
  useEffect(() => {
    if (elapsed >= goal * 60 && !chimed.current) {
      chimed.current = true;
      playGroups([[72], [76], [79], [84]], { gap: 0.18, dur: 1.2 });
    }
  }, [elapsed, goal]);

  const done = elapsed >= goal * 60;
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
      <section className="panel" style={{ display: 'grid', gap: 16 }}>
        <h2 style={{ fontSize: 36 }}>{t('ambient.drone')}</h2>
        <p className="muted">{t('ambient.droneText')}</p>
        <div className="row" role="group" aria-label={t('ambient.tonic')}>
          {Array.from({ length: 12 }, (_, p) => <Chip key={p} on={tonic === p} onClick={() => setTonic(p)}>{pcName(p, naming, false)}</Chip>)}
        </div>
        <div className="row" role="group" aria-label={t('ambient.droneKind')}>
          {DRONES.map(d => <Chip key={d.id} on={kind === d.id} onClick={() => setKind(d.id)}>{t(d.label)}</Chip>)}
        </div>
        <div><Btn onClick={() => setDroneOn(v => !v)} tone={droneOn ? 'mu' : 'co'}>{t(droneOn ? 'ambient.droneOff' : 'ambient.droneOn')}</Btn></div>
      </section>

      <section style={{ display: 'grid', gap: 16 }}>
        <div className="panel" style={{ display: 'grid', gap: 12, background: done ? 'var(--mu)' : undefined, color: done ? 'var(--bk)' : undefined }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 36 }}>{t('ambient.timer')}</h2>
            {done && <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 22, textTransform: 'uppercase' }}>{t('ambient.goalMet')}</span>}
          </div>
          <div className="num" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 84, lineHeight: 0.9 }}>{fmtClock(elapsed)}</div>
          <div className="row">
            <span className="eyebrow" style={{ color: 'inherit' }}>{t('ambient.goal')}</span>
            {[5, 10, 15, 20, 30].map(m => <Chip key={m} on={goal === m} onClick={() => { setGoal(m); chimed.current = false; }}>{t('common.minutes', { n: m })}</Chip>)}
          </div>
          <div className="row">
            <Btn onClick={() => setTiming(v => !v)} tone={timing ? 'mu' : undefined}>{t(timing ? 'common.pause' : elapsed ? 'common.continue' : 'common.start')}</Btn>
            <Btn tone="ghost" small onClick={() => { setElapsed(0); chimed.current = false; }}>{t('common.reset')}</Btn>
          </div>
        </div>
        <Metronome compact onRunning={setMetro} />
      </section>

      <section className="panel" style={{ display: 'grid', gap: 12, gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h3 style={{ fontSize: 28 }}>{t('ambient.howTo')}</h3>
            <ol style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 4 }}>
              <li>{t('ambient.step1')}</li>
              <li>{t('ambient.step2')}</li>
              <li>{t('ambient.step3')}</li>
              <li>{t('ambient.step4')}</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
