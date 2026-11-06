// Leitura rítmica: compassos gerados sob demanda para ler em silêncio (no ônibus, sem instrumento)
// ou, se quiser, ouvir com metrônomo. A geração fica em theory/rhythm-gen.ts; aqui é só a tela.
import { useCallback, useEffect, useRef, useState } from 'react';
import { atTime, Clock, drum } from '../audio/engine';
import RhythmScore from '../components/music/RhythmScore';
import { Btn, Chip } from '../components/ui';
import {
  FAMILIAS, LEVELS, METER_IDS, METERS,
  type Familia, type Figure, type Level, type MeterId, type RestKind, type Trait,
} from '../theory/rhythm-cells';
import {
  BAR_COUNTS, barSignature, DEFAULT_SETTINGS, generateExercise, offeredBy, PRESET_POUCAS_NOTAS, timeline,
  type Exercise, type RhythmSettings,
} from '../theory/rhythm-gen';
import { tempoName, useToolLog } from './common';
import { useT } from '../i18n';

const STORE = 'clave:ritmo';
const HISTORY = 30;

/** ±10 a 30 bpm por sorteio (X1); o teto é quem decide até onde isso pode subir. */
const SORTEIO_BPM = { min: 10, max: 30 };
const BPM_MIN = 30;
const TETO_BPM = { min: 60, max: 140, padrao: 100 };

function loadSettings(): RhythmSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) ?? 'null');
    if (!raw) return DEFAULT_SETTINGS;
    const s: RhythmSettings = {
      ...DEFAULT_SETTINGS, ...raw,
      figures: { ...DEFAULT_SETTINGS.figures, ...raw.figures },
      restKinds: { ...DEFAULT_SETTINGS.restKinds, ...raw.restKinds },
      traits: { ...DEFAULT_SETTINGS.traits, ...raw.traits },
      familias: { ...DEFAULT_SETTINGS.familias, ...raw.familias },
    };
    const sane = s.meter in METERS && LEVELS.some(l => l.level === s.level) && BAR_COUNTS.includes(s.bars);
    return sane ? s : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
function saveSettings(s: RhythmSettings) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* sem armazenamento: só não lembra */ }
}

function make(s: RhythmSettings, prev?: Exercise): { ex?: Exercise; error?: string } {
  try {
    return { ex: generateExercise(s, { avoid: prev && new Set(prev.bars.map(barSignature)) }) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '' };
  }
}

/** Novo andamento sorteado: desloca ±[10,30] bpm, sem passar do teto nem do mínimo da régua. */
function sortearBpm(atual: number, teto: number): number {
  const mag = SORTEIO_BPM.min + Math.random() * (SORTEIO_BPM.max - SORTEIO_BPM.min);
  const novo = atual + (Math.random() < 0.5 ? -mag : mag);
  return Math.round(Math.min(teto, Math.max(BPM_MIN, novo)));
}

const FIGURES: Figure[] = ['w', 'h', 'q', '8', '16'];
const RESTS: RestKind[] = ['h', 'q', '8', '16'];
const TRAITS: Trait[] = ['pontuada', 'sincope', 'ligadura', 'quialtera'];

export default function Ritmo() {
  const t = useT();
  const [settings, setSettings] = useState(loadSettings);
  const [history, setHistory] = useState<Exercise[]>(() => {
    const first = make(settings);
    return first.ex ? [first.ex] : [generateExercise(DEFAULT_SETTINGS)];
  });
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const [bpm, setBpm] = useState(70);
  const [sound, setSound] = useState(true);
  const [click, setClick] = useState(true);
  const [countIn, setCountIn] = useState(true);
  const [loop, setLoop] = useState(true);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  // X1: andamento sorteado a cada exercício, volume separado, e a coloração da figura tocando.
  const [sortear, setSortear] = useState(false);
  const [tetoBpm, setTetoBpm] = useState(TETO_BPM.padrao);
  const [volClick, setVolClick] = useState(0.7);
  const [volSound, setVolSound] = useState(1);
  const [highlight, setHighlight] = useState(true);
  const clock = useRef<Clock | null>(null);
  const timers = useRef<number[]>([]);
  const live = useRef({ sound, click, loop, volClick, volSound });
  live.current = { sound, click, loop, volClick, volSound };

  const ex = history[idx];
  const m = METERS[ex.meter];
  useToolLog('ritmo', 'Leitura rítmica', 'perception.rhythmic', true, { settings: { bpm, compasso: settings.meter } });

  const stop = useCallback(() => {
    clock.current?.stop();
    clock.current = null;
    timers.current.forEach(t => window.clearTimeout(t));
    timers.current = [];
    setRunning(false);
    setActive(null);
    setCount(null);
  }, []);

  const play = useCallback(() => {
    stop();
    const { entries, total } = timeline(ex);
    const byTick = new Map(entries.map(e => [e.at, e]));
    const lead = countIn ? m.barTicks : 0;
    const later = (t: number, fn: () => void) => timers.current.push(atTime(t, fn));
    let done = false;
    // Um passo do relógio por tick: 24 por semínima, o bastante para semis, tercinas e duínas.
    const c = new Clock(bpm, m.beatTicks, (i, t) => {
      if (done) return;
      const L = live.current;
      const tick = i - lead;
      if (tick < 0) {
        if (i % m.beatTicks === 0) {
          drum(i === 0 ? 'clique-forte' : 'clique', t, L.volClick);
          later(t, () => setCount(i / m.beatTicks + 1));
        }
        return;
      }
      if (!L.loop && tick >= total) {
        done = true;
        later(t, stop);
        return;
      }
      const pos = tick % total;
      if (L.click && pos % m.beatTicks === 0) drum(pos % m.barTicks === 0 ? 'clique-forte' : 'clique', t, L.volClick);
      const e = byTick.get(pos);
      if (!e) return;
      if (e.attack && L.sound) drum('aro', t, L.volSound);
      later(t, () => { setCount(null); setActive(`${e.bar}:${e.index}`); });
    });
    clock.current = c;
    c.start();
    setRunning(true);
  }, [ex, m, bpm, countIn, stop]);

  useEffect(() => stop, [stop]);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);
  useEffect(() => { stop(); }, [ex, stop]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const push = useCallback((s: RhythmSettings) => {
    const r = make(s, ex);
    if (!r.ex) { setError(r.error ?? ''); return; }
    setError(null);
    const next = [...history.slice(0, idx + 1), r.ex].slice(-HISTORY);
    setHistory(next);
    setIdx(next.length - 1);
    // "Sortear bpm a cada exercício" (X1): cada compasso NOVO conta, venha do botão "Novo
    // exercício" ou de mudar um filtro — os dois chamam push(). Voltar no histórico não conta.
    if (sortear) setBpm(b => sortearBpm(b, tetoBpm));
  }, [ex, history, idx, sortear, tetoBpm]);

  const update = (patch: Partial<RhythmSettings>) => {
    const s = { ...settings, ...patch };
    setSettings(s);
    push(s);
  };
  const next = useCallback(() => push(settings), [push, settings]);
  const back = useCallback(() => { setError(null); setIdx(i => Math.max(0, i - 1)); }, []);
  const toggle = useCallback(() => (running ? stop() : play()), [running, stop, play]);

  // Atalhos no computador: espaço toca/para, N ou → gera outro, ← volta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (e.metaKey || e.ctrlKey || e.altKey || el?.closest('input, select, textarea, [contenteditable]')) return;
      if (e.key === ' ' && !el?.closest('button')) { e.preventDefault(); toggle(); }
      else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, next, back]);

  const offered = offeredBy(settings.meter, settings.level);
  const restricted = FIGURES.some(f => offered.figures.has(f) && !settings.figures[f]) ||
    TRAITS.some(t => offered.traits.has(t) && !settings.traits[t]) ||
    FAMILIAS.some(f => offered.familias.has(f) && !settings.familias[f]) ||
    (offered.rests.size > 0 && (!settings.rests || RESTS.some(r => offered.rests.has(r) && !settings.restKinds[r])));
  const resetFilters = () => update({
    figures: DEFAULT_SETTINGS.figures, rests: true, restKinds: DEFAULT_SETTINGS.restKinds,
    traits: DEFAULT_SETTINGS.traits, familias: DEFAULT_SETTINGS.familias, metaNotas: undefined,
  });
  const presetPoucasNotas = () => update(PRESET_POUCAS_NOTAS);
  const fromLevel = (has: boolean) => (has ? undefined : t('rhythm.higherLevels'));
  // Problemas de configuração vêm do gerador como código; qualquer outro erro é um defeito.
  const errorText = (code: string) =>
    code === 'noFigures' ? t('rhythm.errorNoFigures')
      : code === 'cantFill' ? t(METERS[settings.meter].compound ? 'rhythm.errorCantFillCompound' : 'rhythm.errorCantFill', { meter: settings.meter })
        : t('rhythm.generateError');

  return (
    <div className="ritmo">
      <div className="ritmo-quick">
        <label className="ritmo-field">
          <span>{t('rhythm.meter')}</span>
          <select className="sel" id="rt-meter" value={settings.meter} onChange={e => update({ meter: e.target.value as MeterId })}>
            {METER_IDS.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label className="ritmo-field">
          <span>{t('rhythm.bars')}</span>
          <select className="sel" id="rt-bars" value={settings.bars} onChange={e => update({ bars: Number(e.target.value) })}>
            {BAR_COUNTS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="ritmo-field">
          <span>{t('rhythm.level')}</span>
          <select className="sel" id="rt-level" value={settings.level} onChange={e => update({ level: Number(e.target.value) as Level })}>
            {LEVELS.map(l => <option key={l.level} value={l.level}>{l.level} · {t(`rhythm.levels.l${l.level}.name`)}</option>)}
          </select>
        </label>
      </div>

      <section className="ritmo-stage" aria-live="polite">
        <div className="ritmo-status">
          <span>{t('rhythm.status', { level: ex.level, name: t(`rhythm.levels.l${ex.level}.name`), meter: ex.meter, bars: ex.bars.length })}{restricted && ` · ${t('rhythm.restricted')}`}</span>
          {count !== null && <b className="ritmo-count">{count}</b>}
        </div>
        <RhythmScore exercise={ex} active={highlight ? active : null} />
        {error !== null && (
          <div className="ritmo-warn" role="alert">
            <span>{errorText(error)}</span>
            <Btn small tone="ghost" onClick={resetFilters}>{t('rhythm.restoreFigures')}</Btn>
          </div>
        )}
      </section>

      <div className="ritmo-actions">
        <Btn tone="ghost" onClick={back} disabled={idx === 0} label={t('rhythm.previous')}>←<span className="ritmo-wide"> {t('rhythm.previousShort')}</span></Btn>
        <Btn onClick={next} id="rt-next">{t('rhythm.newExercise')}</Btn>
        <Btn tone={running ? 'mu' : 'co'} onClick={toggle}>{running ? t('rhythm.stop') : t('common.playPlay')}</Btn>
        {running && <Btn tone="ghost" small onClick={play}>{t('rhythm.fromStart')}</Btn>}
      </div>

      <div className="ritmo-play panel">
        <div className="ritmo-tempo">
          <span className="num">{m.compound ? '♩.' : '♩'} = {bpm}</span>
          <span className="eyebrow">{tempoName(bpm)}</span>
          <input className="range" type="range" min={30} max={200} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label={t('common.tempo')} id="rt-bpm" />
        </div>
        <div className="row">
          <label className="switch"><input type="checkbox" id="rt-sound" checked={sound} onChange={e => setSound(e.target.checked)} />{t('rhythm.sound')}</label>
          <label className="switch"><input type="checkbox" id="rt-click" checked={click} onChange={e => setClick(e.target.checked)} />{t('rhythm.click')}</label>
          <label className="switch"><input type="checkbox" id="rt-count" checked={countIn} onChange={e => setCountIn(e.target.checked)} />{t('rhythm.countIn')}</label>
          <label className="switch"><input type="checkbox" id="rt-loop" checked={loop} onChange={e => setLoop(e.target.checked)} />{t('rhythm.loop')}</label>
          <label className="switch"><input type="checkbox" id="rt-highlight" checked={highlight} onChange={e => setHighlight(e.target.checked)} />{t('rhythm.highlight')}</label>
        </div>
        <div className="row">
          <label className="switch"><input type="checkbox" id="rt-sortear-bpm" checked={sortear} onChange={e => setSortear(e.target.checked)} />{t('rhythm.randomBpm')}</label>
          {sortear && (
            <label className="ritmo-field" style={{ flex: '1 1 160px' }}>
              <span>{t('rhythm.bpmCeiling')} · {tetoBpm}</span>
              <input className="range" type="range" min={TETO_BPM.min} max={TETO_BPM.max} value={tetoBpm} onChange={e => setTetoBpm(Number(e.target.value))} id="rt-teto-bpm" />
            </label>
          )}
        </div>
        <div className="row">
          <label className="ritmo-field" style={{ flex: '1 1 160px' }}>
            <span>{t('rhythm.volClick')} · {Math.round(volClick * 100)}%</span>
            <input className="range" type="range" min={0} max={100} value={Math.round(volClick * 100)} onChange={e => setVolClick(Number(e.target.value) / 100)} id="rt-vol-click" />
          </label>
          <label className="ritmo-field" style={{ flex: '1 1 160px' }}>
            <span>{t('rhythm.volSound')} · {Math.round(volSound * 100)}%</span>
            <input className="range" type="range" min={0} max={100} value={Math.round(volSound * 100)} onChange={e => setVolSound(Number(e.target.value) / 100)} id="rt-vol-sound" />
          </label>
        </div>
      </div>

      <button type="button" className="ritmo-more" aria-expanded={advanced} onClick={() => setAdvanced(a => !a)}>
        {t(advanced ? 'rhythm.hideAdjust' : 'rhythm.showAdjust')}
      </button>
      {advanced && (
        <div className="settings ritmo-adv">
          <p className="muted">{t(`rhythm.levels.l${settings.level}.desc`)} {t('rhythm.turnOff')}</p>
          <div className="field">
            <span>{t('rhythm.figures')}</span>
            <div className="row">
              {FIGURES.map(f => (
                <Chip key={f} on={settings.figures[f] && offered.figures.has(f)} disabled={!offered.figures.has(f)} title={fromLevel(offered.figures.has(f))}
                  onClick={() => update({ figures: { ...settings.figures, [f]: !settings.figures[f] } })}>{t(`rhythm.figureNames.${f}`)}</Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span>{t('rhythm.rests')}</span>
            <div className="row">
              <label className="switch"><input type="checkbox" id="rt-rests" checked={settings.rests} onChange={e => update({ rests: e.target.checked })} />{t('rhythm.withRests')}</label>
              {RESTS.map(r => (
                <Chip key={r} on={settings.rests && settings.restKinds[r] && offered.rests.has(r)} disabled={!settings.rests || !offered.rests.has(r)} title={fromLevel(offered.rests.has(r))}
                  onClick={() => update({ restKinds: { ...settings.restKinds, [r]: !settings.restKinds[r] } })}>{t(`rhythm.restNames.${r}`)}</Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span>{t('rhythm.traits')}</span>
            <div className="row">
              {TRAITS.map(tr => (
                <Chip key={tr} on={settings.traits[tr] && offered.traits.has(tr)} disabled={!offered.traits.has(tr)} title={fromLevel(offered.traits.has(tr))}
                  onClick={() => update({ traits: { ...settings.traits, [tr]: !settings.traits[tr] } })}>{t(`rhythm.traitNames.${tr}`)}</Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span>{t('rhythm.familias')}</span>
            <div className="row">
              {FAMILIAS.map((f: Familia) => (
                <Chip key={f} on={settings.familias[f] && offered.familias.has(f)} disabled={!offered.familias.has(f)} title={fromLevel(offered.familias.has(f))}
                  onClick={() => update({ familias: { ...settings.familias, [f]: !settings.familias[f] } })}>{t(`rhythm.familyNames.${f}`)}</Chip>
              ))}
            </div>
          </div>
          <div className="row">
            <Btn small tone="ghost" onClick={resetFilters} disabled={!restricted}>{t('rhythm.restoreLevel')}</Btn>
            <Btn small tone="ghost" onClick={presetPoucasNotas}>{t('rhythm.presetSparse')}</Btn>
          </div>
        </div>
      )}

      <p className="muted ritmo-hint">
        {t('rhythm.hint')}
      </p>
    </div>
  );
}
