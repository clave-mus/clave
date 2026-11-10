// Gerador de leitura: partituras infinitas em loop de 4 compassos.
// Modo notas: figura constante, poucas notas, para focar só na altura.
// Modo ritmo: uma linha só, para focar só nas figuras.
import { useEffect, useMemo, useRef, useState } from 'react';
import { atTime, Clock, drum, tone } from '../audio/engine';
import { applyKey, clefBottom, midi, noteName, type Clef, type Note } from '../theory/core';
import { CELLS, RHYTHM_PRESETS, randomBars, type CellId } from '../theory/rhythm';
import RhythmLine from '../components/music/RhythmLine';
import Staff from '../components/music/Staff';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useNaming, useT, type MessageKey } from '../i18n';

interface NotePreset { id: string; name: MessageKey; clef: Clef; fifths: number; steps: number[] }
const S4 = 28; // Dó4
const F2 = 17; // Fá2... índice diatônico (2*7+3)
export const NOTE_PRESETS: NotePreset[] = [
  { id: 'tres', name: 'reading.presetThree', clef: 'sol', fifths: 0, steps: [S4, S4 + 1, S4 + 2] },
  { id: 'cinco', name: 'reading.presetFive', clef: 'sol', fifths: 0, steps: [0, 1, 2, 3, 4].map(i => S4 + i) },
  { id: 'oitava', name: 'reading.presetOctave', clef: 'sol', fifths: 0, steps: Array.from({ length: 8 }, (_, i) => S4 + i) },
  { id: 'pauta', name: 'reading.presetStaff', clef: 'sol', fifths: 0, steps: Array.from({ length: 9 }, (_, i) => clefBottom('sol') + i) },
  { id: 'sol-maior', name: 'reading.presetGMajor', clef: 'sol', fifths: 1, steps: Array.from({ length: 8 }, (_, i) => S4 + 4 + i) },
  { id: 'fa-cinco', name: 'reading.presetBassFive', clef: 'fa', fifths: 0, steps: [0, 1, 2, 3, 4].map(i => F2 + i) },
  { id: 'fa-pauta', name: 'reading.presetBassStaff', clef: 'fa', fifths: 0, steps: Array.from({ length: 9 }, (_, i) => clefBottom('fa') + i) },
];

function melody(steps: number[], n = 16): number[] {
  const out = [steps[Math.floor(Math.random() * steps.length)]];
  while (out.length < n) {
    const prev = steps.indexOf(out[out.length - 1]);
    const jump = [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)];
    const i = Math.max(0, Math.min(steps.length - 1, prev + jump));
    out.push(steps[i]);
  }
  return out;
}

export default function Leitura() {
  const naming = useNaming();
  const t = useT();
  const [mode, setMode] = useState<'notas' | 'ritmo'>('notas');
  const [preset, setPreset] = useState(NOTE_PRESETS[0]);
  const [rPreset, setRPreset] = useState(RHYTHM_PRESETS[0]);
  const [seed, setSeed] = useState(0);
  const [bpm, setBpm] = useState(60);
  const [hear, setHear] = useState(false);
  const [names, setNames] = useState(false);
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState<number | null>(null); // tempo atual (em tempos)
  const [startBar, setStartBar] = useState(0);
  const clock = useRef<Clock | null>(null);
  useToolLog('leitura', 'Gerador de leitura', mode === 'notas' ? 'perception.melodic' : 'perception.rhythmic', running, { settings: { bpm, modo: mode } });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const notes: Note[] = useMemo(() => melody(preset.steps).map(s => applyKey(s, preset.fifths)), [preset, seed]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bars: CellId[][] = useMemo(() => randomBars(rPreset.cells, 4), [rPreset, seed]);
  const onsets = useMemo(() => {
    const out: number[] = [];
    let t = 0;
    bars.forEach(b => b.forEach(c => CELLS[c].events.forEach(ev => { if (!ev.rest) out.push(t); t += ev.d; })));
    return out;
  }, [bars]);
  const live = useRef({ notes, onsets, hear, mode, startBar });
  live.current = { notes, onsets, hear, mode, startBar };

  useEffect(() => () => clock.current?.stop(), []);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);
  useEffect(() => { stop(); }, [mode, preset, rPreset, seed]);

  function stop() {
    clock.current?.stop();
    clock.current = null;
    setRunning(false);
    setPos(null);
  }
  const play = (from = startBar) => {
    stop();
    setStartBar(from);
    const c = new Clock(bpm, 4, (i, t) => {
      const L = live.current;
      const beatF = i / 4;
      if (i % 4 === 0) {
        const b = Math.floor(beatF);
        drum(b < 4 ? (b === 0 ? 'clique-forte' : 'clique') : ((b - 4) % 4 === 0 ? 'clique-forte' : 'clique'), t, b < 4 ? 1 : 0.55);
      }
      if (i < 16) return; // contagem de um compasso
      const total = 16 - L.startBar * 4;
      const at = L.startBar * 4 + (((i - 16) / 4) % total);
      atTime(t, () => setPos(at));
      if (L.mode === 'notas' && i % 4 === 0 && L.hear) tone(midi(L.notes[Math.round(at)]), t, 0.5, 'piano', 0.6);
      if (L.mode === 'ritmo' && L.onsets.some(o => Math.abs(o - at) < 0.01) && L.hear) drum('aro', t);
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };

  const cursorNote = pos === null ? null : Math.floor(pos);
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* U9: a pauta é a primeira coisa a aparecer na tela, não o fim de uma rolagem — o que vem
          antes dela fica compacto (modo + preset), e o resto do ajuste vai DEPOIS do palco, como
          já é em Ritmo.tsx (o painel de andamento lá também vem depois, não antes). */}
      <div className="row">
        <Chip on={mode === 'notas'} onClick={() => setMode('notas')}>{t('reading.notes')}</Chip>
        <Chip on={mode === 'ritmo'} onClick={() => setMode('ritmo')}>{t('reading.rhythm')}</Chip>
      </div>
      {/* Os dois presets traduzem pelo que o dado guarda: o de notas por chave (`p.name` é
          `MessageKey`), o de ritmo pelo ID — que é como `ritmo-ouvido` já fazia, e por isso nenhuma
          chave nova foi preciso. O de ritmo imprimia `{p.name}` cru, e em inglês os chips diziam
          "Duas figuras: semínima e colcheias". */}
      {mode === 'notas'
        ? <div className="row">{NOTE_PRESETS.map(p => <Chip key={p.id} on={p.id === preset.id} onClick={() => setPreset(p)}>{t(p.name)}</Chip>)}</div>
        : <div className="row">{RHYTHM_PRESETS.map(p => <Chip key={p.id} on={p.id === rPreset.id} onClick={() => setRPreset(p)}>{t(`theory.rhythmPresets.${p.id}` as MessageKey)}</Chip>)}</div>}

      <div style={{ background: 'var(--co)', padding: '20px 16px', display: 'grid', gap: 8 }}>
        {[0, 1].map(row => (
          <div key={row} style={{ overflowX: 'auto' }}>
            {mode === 'notas' ? (
              <>
                <Staff clef={preset.clef} fifths={preset.fifths} timeSig={row === 0 ? [4, 4] : undefined} colWidth={40}
                  cursor={cursorNote !== null && Math.floor(cursorNote / 8) === row ? cursorNote % 8 : null}
                  columns={notes.slice(row * 8, row * 8 + 8).map((n, i) => ({ notes: [{ note: n }], kind: 'quarter' as const, barAfter: i % 4 === 3 }))} label={t('common.bars', { a: row * 2 + 1, b: row * 2 + 2 })} />
                {names && <div className="muted" style={{ color: 'var(--cream)', fontSize: 14, paddingLeft: 90, letterSpacing: '.04em' }}>{notes.slice(row * 8, row * 8 + 8).map(n => noteName(n, naming)).join('  ·  ')}</div>}
              </>
            ) : (
              <RhythmLine bars={bars.slice(row * 2, row * 2 + 2)} cursor={pos !== null && Math.floor(pos / 8) === row ? pos % 8 : null} label={t('common.bars', { a: row * 2 + 1, b: row * 2 + 2 })} />
            )}
          </div>
        ))}
      </div>

      <div className="row">
        <Btn onClick={() => (running ? stop() : play())} tone={running ? 'mu' : undefined}>{running ? t('common.stop') : t('reading.loop')}</Btn>
        <Btn tone="ghost" onClick={() => setSeed(s => s + 1)}>{t('reading.another')}</Btn>
        <span className="eyebrow" style={{ marginLeft: 8 }}>{t('reading.startBar')}</span>
        {[0, 1, 2, 3].map(b => <Chip key={b} on={startBar === b} onClick={() => play(b)}>{b + 1}</Chip>)}
      </div>

      <div className="panel" style={{ display: 'grid', gap: 12 }}>
        <div className="row">
          <span className="eyebrow">{t('common.tempo')}</span>
          {/* U9: "cronômetro discreto" — era 26px/900 de peso, do tamanho de um placar. */}
          <span className="num" style={{ fontFamily: 'var(--display)', fontWeight: 620, fontSize: 17 }}>♩ = {bpm}</span>
          <input className="range" style={{ maxWidth: 220 }} type="range" min={40} max={160} value={bpm} onChange={e => setBpm(Number(e.target.value))} aria-label={t('common.tempo')} id="lt-bpm" />
          <label className="switch"><input type="checkbox" id="lt-hear" checked={hear} onChange={e => setHear(e.target.checked)} />{t(mode === 'notas' ? 'reading.playMelody' : 'reading.playRhythm')}</label>
          {mode === 'notas' && <label className="switch"><input type="checkbox" id="lt-names" checked={names} onChange={e => setNames(e.target.checked)} />{t('reading.showNames')}</label>}
        </div>
      </div>

      <p className="muted" style={{ maxWidth: '62ch' }}>
        {t(mode === 'notas' ? 'reading.hintNotes' : 'reading.hintRhythm')}
      </p>
    </div>
  );
}
