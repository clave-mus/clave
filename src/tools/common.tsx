// Partes comuns das ferramentas: registro de tempo no histórico e o metrônomo reaproveitável.
import { useEffect, useRef, useState } from 'react';
import { atTime, Clock, drum } from '../audio/engine';
import { gradePadrao, passoDaGrade, PROXIMO_ESTADO, type CicloDeCompasso, type EstadoPosicao } from '../theory/metronomo';
import type { ModuleId } from '../catalog/taxonomy';
import type { ActivityParams } from '../state/store';
import { useRegistroDePratica } from '../state/useRegistro';
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
  useEffect(() => {
    if (active) since.current = Date.now();
    else if (since.current) { acc.current += Date.now() - since.current; since.current = null; }
  }, [active]);
  // grava ao esconder a aba, ao sair da página e ao desmontar — sempre a mesma entrada, com o que
  // valia no fim (src/state/useRegistro.ts)
  useRegistroDePratica(() => {
    const total = acc.current + (since.current ? Date.now() - since.current : 0);
    return { id, title, module, seconds: Math.round(total / 1000), snapshot };
  });
}

// ---------------------------------------------------------------------------
// M4 (06/11/2026): grade única, no lugar de "quais tempos tocam" + "subdivisão".
//
// Os dois controles antigos brigavam: um dizia QUANTAS posições existem (subdivisão), o outro
// dizia QUAIS tocam (tempos) — mas "tempos" só sabia falar de tempos inteiros, nunca de uma
// posição dentro de um tempo (o "e" do tempo 2). A grade resolve isso sendo A ÚNICA fonte de
// verdade: ela TEM `compassos × subdivisão` posições, e cada uma liga/desliga e acentua por conta
// própria. "Só tempos 2 e 4", "1/1 sem acento" e "silenciar só o 'e' do tempo 2" viram a mesma
// operação — marcar uma posição — em vez de três recursos diferentes.
//
// A lógica (que posição é qual, o que soa) mora em `theory/metronomo.ts`, pura e testada; aqui só
// a tela e o fio com o relógio de áudio.
// ---------------------------------------------------------------------------

const CICLOS_DE_COMPASSO: (CicloDeCompasso & { label: string })[] = [
  { tocar: 1, silenciar: 0, label: 'always' },
  { tocar: 1, silenciar: 1, label: '1-1' },
  { tocar: 2, silenciar: 2, label: '2-2' },
  { tocar: 3, silenciar: 1, label: '3-1' },
];

export function Metronome({ compact = false, onRunning }: { compact?: boolean; onRunning?: (r: boolean) => void }) {
  const t = useT();
  const [bpm, setBpm] = useState(80);
  const [compassos, setCompassos] = useState(4);
  const [subdivisao, setSubdivisao] = useState(1);
  const [grade, setGrade] = useState<EstadoPosicao[]>(() => gradePadrao(4, 1));
  const [ciclo, setCiclo] = useState(CICLOS_DE_COMPASSO[0]);
  const [running, setRunning] = useState(false);
  const [posAtual, setPosAtual] = useState(-1);
  const clock = useRef<Clock | null>(null);
  const taps = useRef<number[]>([]);
  // o callback do Clock é criado uma vez (em toggle); o que ele lê de grade/ciclo tem de vir de uma
  // ref, senão ficaria preso na grade de quando o relógio começou a tocar
  const cfg = useRef({ grade, ciclo, compassos, subdivisao });
  cfg.current = { grade, ciclo, compassos, subdivisao };

  useEffect(() => () => clock.current?.stop(), []);
  useEffect(() => { if (clock.current) clock.current.bpm = bpm; }, [bpm]);
  useEffect(() => { if (clock.current) clock.current.stepsPerBeat = subdivisao; }, [subdivisao]);
  useEffect(() => onRunning?.(running), [running, onRunning]);

  const mudarGrade = (compassosNovo: number, subdivisaoNova: number) => {
    setCompassos(compassosNovo);
    setSubdivisao(subdivisaoNova);
    setGrade(gradePadrao(compassosNovo, subdivisaoNova));
  };
  const alternarPosicao = (i: number) => setGrade(g => g.map((e, k) => (k === i ? PROXIMO_ESTADO[e] : e)));

  const toggle = () => {
    if (running) { clock.current?.stop(); setRunning(false); setPosAtual(-1); return; }
    const c = new Clock(bpm, subdivisao, (i, tempo) => {
      const { grade: g, ciclo: cc, compassos: cp, subdivisao: sd } = cfg.current;
      const passo = passoDaGrade(i, cp, sd, g, cc);
      if (passo.toca) {
        drum(passo.estado === 'acentuada' ? (passo.pos === 0 ? 'clique-forte' : 'clique') : 'clique', tempo, passo.estado === 'acentuada' ? 1 : 0.35);
      }
      atTime(tempo, () => setPosAtual(passo.pos));
    });
    clock.current = c;
    c.start();
    setRunning(true);
  };
  const tap = () => {
    const tempo = performance.now();
    taps.current = [...taps.current.filter(x => tempo - x < 3000), tempo].slice(-5);
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

      {/* A grade: uma barra por posição. Clicar passa pelos três estados — é o único controle de
          ritmo do metrônomo agora; não existe mais um seletor de "quais tempos" separado. */}
      <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }} role="group" aria-label={t('metronome.grid')}>
        {grade.map((estado, i) => (
          <button
            key={i} type="button" onClick={() => alternarPosicao(i)}
            aria-label={t('metronome.gridCell', { n: i + 1 })} aria-pressed={estado !== 'desligada'}
            style={{
              flex: 1, height: compact ? 22 : 32, border: 0, borderRadius: 3, cursor: 'pointer', padding: 0,
              transform: 'skewX(-12deg)', transition: 'background .05s',
              background: estado === 'desligada' ? 'var(--raised)'
                : posAtual === i ? (i === 0 ? 'var(--mu)' : 'var(--cream)')
                  : estado === 'acentuada' ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.28)',
            }}
          />
        ))}
      </div>

      <div className="row">
        <Btn onClick={toggle} tone={running ? 'mu' : undefined} small={compact}>{t(running ? 'common.stop' : 'common.play')}</Btn>
        <Btn onClick={tap} tone="ghost" small>{t('metronome.tap')}</Btn>
        <Btn onClick={() => setBpm(b => Math.max(30, b - 1))} tone="ghost" small>−1</Btn>
        <Btn onClick={() => setBpm(b => Math.min(240, b + 1))} tone="ghost" small>+1</Btn>
      </div>

      {!compact && (
        <>
          <div className="row">
            <span className="eyebrow" style={{ color: 'var(--cream)' }}>{t('metronome.meter')}</span>
            {[1, 2, 3, 4, 5, 6].map(n => <Chip key={n} on={compassos === n} onClick={() => mudarGrade(n, subdivisao)}>{n}/4</Chip>)}
            <span className="eyebrow" style={{ color: 'var(--cream)', marginLeft: 12 }}>{t('metronome.subdivision')}</span>
            {[[1, '♩'], [2, '♫'], [3, '3'], [4, '♬']].map(([n, l]) => <Chip key={n} on={subdivisao === n} onClick={() => mudarGrade(compassos, Number(n))}>{l}</Chip>)}
          </div>
          <div className="row">
            <span className="eyebrow" style={{ color: 'var(--cream)' }}>{t('metronome.barCycle')}</span>
            {CICLOS_DE_COMPASSO.map(c => (
              <Chip key={c.label} on={ciclo.tocar === c.tocar && ciclo.silenciar === c.silenciar} onClick={() => setCiclo(c)}>
                {c.silenciar === 0 ? t('metronome.barCycleAlways') : t('metronome.barCycleOnOff', { on: c.tocar, off: c.silenciar })}
              </Chip>
            ))}
          </div>
        </>
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
