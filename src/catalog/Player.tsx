// Jogador de exercício: mostra a pergunta, toca o som, confere a resposta e guarda o progresso.
// Só conhece o modelo da C1 (superfície, esperado, conteúdo sonoro). A conferência é de
// validate.ts e o som, de presentation.ts.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { atTime, now } from '../audio/engine';
import { playContent, resolvePresentation, type Presentation } from '../audio/presentation';
import { useContent } from '../data/localized';
import { getState, logActivity, recordAnswer, saveSettings, useStore } from '../state/store';
import { buildAttempt, buildFeedback, CONFIDENCE_SERIES, newId, shouldAskConfidence, type AttemptFeedback } from '../state/attempts';
import { saveAttempt, saveFeedback } from '../state/attemptLog';
import { fromStep, mod, noteName, type Note } from '../theory/core';
import Fretboard from '../components/music/Fretboard';
import Keyboard from '../components/music/Keyboard';
import RhythmLine from '../components/music/RhythmLine';
import Staff from '../components/music/Staff';
import { Btn, Chip, PlayIcon, Tag } from '../components/ui';
import { globalPresentation, useParamsDoItem, type ParametrosDePratica } from './params';
import { optionResponse, validate } from './validate';
import type { Ctx, SeriesItem, Question, Response, SettingValue } from './types';
import SalvarNaRotina from '../components/SalvarNaRotina';
import PracticePanel from '../components/PracticePanel';
import { itemText, useLocale, useNaming, useT } from '../i18n';

type Phase = 'ask' | 'right' | 'wrong';
type Submit = (r: Response, pickedId: string) => void;

interface Props {
  def: SeriesItem;
  /** Em sessão guiada: quantas perguntas até terminar. */
  target?: number;
  onDone?: (r: { correct: number; total: number; seconds: number }) => void;
  initialSettings?: Record<string, SettingValue> | null;
  /** Tonalidade, região e material da etapa, quando o item foi aberto a partir de uma. */
  initialParams?: ParametrosDePratica | null;
  /** Sessão de prática a que as tentativas pertencem (a sessão guiada passa a dela). */
  sessionId?: string;
}

export default function Player({ def, target, onDone, initialSettings, initialParams, sessionId }: Props) {
  const naming = useNaming();
  const soundOn = useStore(s => s.sound);
  const t = useT();
  const { moduleById } = useContent();
  // O perfil por baixo, e por cima o que a pessoa escolheu NESTE exercício (decisão 87).
  const { params, pratica, mudar, limpar } = useParamsDoItem(def.id, initialParams);
  const saved = useStore(s => s.settings[def.id]);
  // Aberto a partir de uma etapa de rotina, o item começa com a configuração DA ETAPA — não com a
  // que a pessoa deixou salva no item. E mexer nas configurações precisa continuar funcionando:
  // enquanto houver `local`, é nele que a mudança cai, e a configuração guardada do item não é
  // tocada. (A primeira versão do link compartilhado deixava `initialSettings` mandar em tudo, e o
  // painel de configurações virava decoração: gravava num lugar que ninguém lia.)
  const [local, setLocal] = useState<Record<string, SettingValue> | null>(initialSettings ?? null);
  const settings = useMemo(() => ({ ...def.defaults, ...(local ?? saved ?? {}) }), [def, saved, local]);
  const guardarSettings = useCallback((v: Record<string, SettingValue>) => (local ? setLocal(v) : saveSettings(def.id, v)), [local, def.id]);
  const locale = useLocale();
  const ctx: Ctx = useMemo(() => ({ naming, conv: locale, t, params }), [naming, locale, t, params]);
  const make = useCallback(() => def.make(settings, ctx), [def, settings, ctx]);
  // Por que estas configurações não geram pergunta (decisão 13). Havendo motivo, `make` NUNCA é
  // chamado: o certo é recusar e explicar, não sortear uma pergunta impossível de responder.
  const problema = useMemo(() => def.problema?.(settings, ctx) ?? null, [def, settings, ctx]);
  // o que as configurações da pessoa mudam no som (ex.: arpejar, duração do acorde)
  const settingsPresentation = useMemo(() => def.settings(ctx).reduce<Partial<Presentation>>(
    (acc, s) => (s.present && settings[s.id] !== undefined ? { ...acc, ...s.present(settings[s.id]) } : acc), {}), [def, ctx, settings]);

  const [q, setQ] = useState<Question | null>(() => (def.problema?.(settings, ctx) ? null : make()));
  const [phase, setPhase] = useState<Phase>('ask');
  const [picked, setPicked] = useState<string | null>(null);
  const [acc, setAcc] = useState(0);
  // `seguidas` é a contagem DENTRO da série. Não confundir com dias seguidos praticados, que
  // saiu de propósito (decisão 11): aquilo é cobrança, isto é informação útil — e é o gatilho da
  // sugestão de variação (F7-1), que dispara em acertos seguidos, não em taxa.
  const [score, setScore] = useState({ correct: 0, total: 0, seguidas: 0 });
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const started = useRef(Date.now());
  const scoreRef = useRef(score);
  scoreRef.current = score;
  // registro da tentativa (C2): sessão, quando dava para responder e quantas vezes ouviu
  const session = useRef(sessionId ?? newId());
  const askedAt = useRef(Date.now());
  const earReadyAt = useRef<number | null>(null);
  const listens = useRef(0);
  // tentativas da série em curso; ao fechar a série, às vezes pergunta a confiança (nunca a cada resposta)
  const series = useRef<string[]>([]);
  const [confidenceFor, setConfidenceFor] = useState<string[] | null>(null);
  useEffect(() => { askedAt.current = Date.now(); earReadyAt.current = null; listens.current = 0; }, [q]);

  // ao sair, registra a atividade no histórico
  useEffect(() => {
    const t0 = started.current;
    return () => {
      const s = scoreRef.current;
      if (s.total > 0 && !target) logActivity({
        id: def.id, title: itemText(t, def.id, 'title'), module: def.primaryModule,
        seconds: Math.round((Date.now() - t0) / 1000), correct: s.correct, total: s.total,
        // a mesma forma do snapshot de uma tentativa (F3-9)
        snapshot: { settings, params: { instrument: params.instrument, tuning: params.tuning, key: params.key, range: params.range, material: params.material, clef: params.clef } },
      });
    };
  }, [def, target, t]);

  // camadas: global (timbre do instrumento, volume) < exercício < configurações da pessoa
  const presentationFor = useCallback((question: Question) =>
    resolvePresentation([globalPresentation(params, question.sound?.instrument), def.presentation, settingsPresentation]), [params, def.presentation, settingsPresentation]);

  /** Toca o som da pergunta. `listening` = a pessoa está ouvindo para responder (conta como escuta). */
  const play = useCallback((question: Question, listening = false) => {
    const content = question.sound;
    if (!content || !getState().sound) return;
    const dur = playContent(content, presentationFor(question));
    if (listening) {
      listens.current++;
      // nos de ouvido, o tempo de resposta conta do fim do primeiro som
      if (earReadyAt.current === null) earReadyAt.current = Date.now() + dur * 1000;
    }
    setPlaying(true);
    setHeard(true);
    atTime(now() + dur, () => setPlaying(false));
  }, [presentationFor]);

  const next = useCallback(() => {
    if (problema) return;
    const nq = make();
    setQ(nq);
    setPhase('ask');
    setPicked(null);
    setAcc(0);
    if (nq.autoplay && heard) window.setTimeout(() => play(nq, true), 250);
  }, [make, heard, play, problema]);

  // configurações mudaram: recomeça
  useEffect(() => { setQ(problema ? null : make()); setPhase('ask'); setPicked(null); }, [make, problema]);

  const submit: Submit = useCallback((response, pickedId) => {
    if (phase !== 'ask' || !q) return;
    const ok = validate(q.expected, response);
    const ns = { correct: score.correct + (ok ? 1 : 0), total: score.total + 1, seguidas: ok ? score.seguidas + 1 : 0 };
    setScore(ns);
    setPicked(pickedId);
    setPhase(ok ? 'right' : 'wrong');
    recordAnswer(def.id, ok);
    const readyAt = q.visual.kind === 'ear' ? earReadyAt.current ?? askedAt.current : askedAt.current;
    const attempt = buildAttempt({
      exercise: def, question: q, response, correct: ok, sessionId: session.current, locale, settings, params,
      presentation: q.sound ? presentationFor(q) : undefined,
      responseTimeMs: Date.now() - readyAt, repetitions: Math.max(0, listens.current - 1),
    });
    saveAttempt(attempt);
    series.current.push(attempt.id);
    if (series.current.length >= CONFIDENCE_SERIES) {
      if (shouldAskConfidence(series.current.length)) setConfidenceFor(series.current);
      series.current = [];
    }
    if (!q.autoplay && soundOn) play(q);
    if (target && ns.total >= target) {
      window.setTimeout(() => onDone?.({ correct: ns.correct, total: ns.total, seconds: Math.round((Date.now() - started.current) / 1000) }), ok ? 900 : 1800);
      return;
    }
    if (ok) window.setTimeout(next, 850);
  }, [phase, score, def, q, soundOn, play, presentationFor, locale, settings, params, target, onDone, next]);

  // atalhos de teclado: 1-9 para opções, Enter para seguir, espaço para ouvir de novo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (!q) return;
      if (e.key === 'Enter' && phase === 'wrong') { e.preventDefault(); next(); }
      if (e.key === ' ' && q.sound && q.autoplay) { e.preventDefault(); play(q, true); }
      const n = Number(e.key);
      if (q.surface.kind === 'choices' && n >= 1 && n <= q.surface.options.length && phase === 'ask') {
        const o = q.surface.options[n - 1];
        submit(optionResponse(o), o.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, q, next, play, submit]);

  const area = moduleById[def.primaryModule];


  // Configuração que não gera pergunta: explica e abre as configurações. Nunca sorteia.
  if (problema || !q) {
    return (
      <div className="player">
        <div className="player-head">
          <div>
            <div className="row"><Tag>{area.name}</Tag></div>
            <h1>{itemText(t, def.id, 'title')}</h1>
          </div>
        </div>
        <div className="panel" role="alert" style={{ display: 'grid', gap: 10 }}>
          <b>{t('player.cantAsk')}</b>
          <span className="muted">{problema ?? t('player.cantAsk')}</span>
        </div>
        <div className="player-foot">
          <div />
          <div className="row">
            <Btn small tone="ghost" onClick={() => setShowSettings(v => !v)}>{t(showSettings ? 'player.close' : 'player.customize')}</Btn>
          <SalvarNaRotina itemId={def.id} settings={settings} params={pratica} />
          </div>
        </div>
        {showSettings && <SettingsPanel def={def} ctx={ctx} values={settings} onChange={guardarSettings}
          extra={def.respeita?.length ? <PracticePanel respeita={def.respeita} params={params} onChange={mudar} temEscolha={Object.keys(pratica).length > 0} onReset={limpar} /> : null} />}
      </div>
    );
  }

  return (
    <div className="player">
      <div className="player-head">
        <div>
          <div className="row"><Tag>{area.name}</Tag>{def.mobile && <Tag tone="dark">{t('common.mobile')}</Tag>}</div>
          <h1>{itemText(t, def.id, 'title')}</h1>
        </div>
        <div className="score">
          <div><b className="num">{score.correct}/{score.total}</b><span>{t('player.hits')}</span></div>
          {score.seguidas > 1 && <div><b className="num">{score.seguidas}</b><span>{t('player.inARow')}</span></div>}
        </div>
      </div>
      {target && <div className="progressbar" aria-label={t('player.progressOf', { done: score.total, total: target })}><i style={{ width: `${(score.total / target) * 100}%` }} /></div>}

      <Stage q={q} phase={phase} playing={playing} heard={heard} onPlay={() => play(q, true)} naming={naming} picked={picked} acc={acc} onAnswer={submit} />

      <AnswerArea q={q} phase={phase} picked={picked} acc={acc} setAcc={setAcc} onAnswer={submit} naming={naming} />

      <div className="player-foot">
        <div className="reveal" aria-live="polite">
          {phase === 'wrong' && <>{t('player.answer')} <b>{q.reveal}</b></>}
          {phase === 'right' && <span className="muted">{t('player.right')}</span>}
          {phase === 'ask' && <span className="muted">{itemText(t, def.id, 'desc')}</span>}
        </div>
        <div className="row">
          {phase === 'wrong' && <Btn onClick={next} tone="mu">{t('player.next')}</Btn>}
          <Btn small tone="ghost" onClick={() => setShowSettings(v => !v)}>{t(showSettings ? 'player.close' : 'player.customize')}</Btn>
          <SalvarNaRotina itemId={def.id} settings={settings} params={pratica} />
        </div>
      </div>

      {confidenceFor && (
        <div className="panel" role="group" aria-label={t('player.confidenceQuestion')} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <span>{t('player.confidenceQuestion')}</span>
          <div className="row">
            {(['guess', 'unsure', 'sure'] as AttemptFeedback['confidence'][]).map(c => (
              <Chip key={c} onClick={() => { saveFeedback(buildFeedback(session.current, confidenceFor, c)); setConfidenceFor(null); }}>{t(`player.confidence.${c}`)}</Chip>
            ))}
            <Btn small tone="ghost" onClick={() => setConfidenceFor(null)}>{t('player.confidenceSkip')}</Btn>
          </div>
        </div>
      )}

      {showSettings && <SettingsPanel def={def} ctx={ctx} values={settings} onChange={guardarSettings}
          extra={def.respeita?.length ? <PracticePanel respeita={def.respeita} params={params} onChange={mudar} temEscolha={Object.keys(pratica).length > 0} onReset={limpar} /> : null} />}
    </div>
  );
}

// ---------------- palco: o que é perguntado ----------------
function Stage({ q, phase, playing, heard, onPlay, naming, picked, acc, onAnswer }: {
  q: Question; phase: Phase; playing: boolean; heard: boolean; onPlay: () => void; naming: 'pt' | 'en';
  picked: string | null; acc: number; onAnswer: Submit;
}) {
  const t = useT();
  const v = q.visual;
  const sf = q.surface;
  const ok = (r: Response) => validate(q.expected, r);
  const fb = phase === 'right' ? <div className="feedback ok">{t('player.feedbackRight')}</div> : phase === 'wrong' ? <div className="feedback bad">{t('player.feedbackWrong')}</div> : null;
  const isText = v.kind === 'text' && v.text;

  // superfícies que ficam no próprio palco (teclado, braço, pauta)
  if (sf.kind === 'keyboard') {
    const marks: Record<number, string> = {};
    if (picked) marks[Number(picked)] = phase === 'right' ? 'var(--mu)' : 'var(--ve)';
    if (phase === 'wrong') for (let m = sf.lo; m <= sf.hi; m++) if (ok({ kind: 'pitch', midi: m })) marks[m] = 'var(--mu)';
    return (
      <div className="stage dark">
        {fb}
        <div className="prompt">{q.prompt}</div>
        {v.kind === 'ear' && <Listen playing={playing} heard={heard} onPlay={onPlay} />}
        <div style={{ width: '100%', marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Keyboard lo={sf.lo} hi={sf.hi} marks={marks} naming={naming} onPress={m => phase === 'ask' && onAnswer({ kind: 'pitch', midi: m }, String(m))} labels="do" />
        </div>
      </div>
    );
  }
  if (sf.kind === 'fretboard') {
    const marks = [];
    if (picked) { const [s, f] = picked.split(':').map(Number); marks.push({ s, f, color: phase === 'right' ? 'var(--mu)' : 'var(--ve)' }); }
    if (phase === 'wrong') {
      const strings = sf.onlyString !== undefined ? [sf.onlyString] : sf.tuning.map((_, i) => i);
      for (const s of strings) for (let f = sf.from; f <= sf.to; f++) if (ok({ kind: 'pitch', midi: sf.tuning[s] + f })) marks.push({ s, f, color: 'var(--mu)', label: '✓' });
    }
    return (
      <div className="stage dark">
        {fb}
        <div className="prompt">{q.prompt}</div>
        <Fretboard tuning={sf.tuning} from={sf.from} to={sf.to} marks={marks} onlyString={sf.onlyString} naming={naming}
          onPick={(s, f) => phase === 'ask' && onAnswer({ kind: 'pitch', midi: sf.tuning[s] + f }, `${s}:${f}`)} />
      </div>
    );
  }
  if (sf.kind === 'staff') {
    const cols: Note[][] = [];
    if (picked) cols.push([fromStep(Number(picked.split(':')[0]), Number(picked.split(':')[1]))]);
    const e = q.expected;
    const answer: Note | null = e.kind === 'spelled' && e.oct !== undefined ? { letter: mod(e.letter, 7) as 0, acc: e.acc, oct: e.oct } : null;
    const shown = phase === 'wrong' && answer ? [[...(cols[0] ?? []), answer]] : cols;
    return (
      <div className="stage">
        {fb}
        <div className="prompt">{q.prompt}</div>
        <Staff clef={sf.clef} columns={shown.map(c => ({ notes: c.map(n => ({ note: n })) }))} colWidth={90} ghostAcc={acc}
          onPick={phase === 'ask' ? s => onAnswer({ kind: 'spelled', letter: mod(s, 7), acc, oct: Math.floor(s / 7) }, `${s}:${acc}`) : undefined} />
        <div className="hint">{t('player.tapStaff')}</div>
      </div>
    );
  }

  return (
    <div className={`stage ${v.kind === 'staff' ? '' : 'dark'}`}>
      {fb}
      {isText ? <div className="prompt text">{q.prompt}</div> : <div className="prompt">{q.prompt}</div>}
      {v.kind === 'staff' && <Staff clef={v.clef} fifths={v.fifths} columns={v.columns.map(c => ({ notes: c.map(n => ({ note: n })) }))} colWidth={v.columns.length > 4 ? 44 : 64} />}
      {v.kind === 'keyboard' && <Keyboard lo={v.lo} hi={v.hi} marks={Object.fromEntries(v.marks.map(m => [m, 'var(--mu)']))} naming={naming} />}
      {v.kind === 'fretboard' && <Fretboard tuning={v.tuning} from={v.from} to={v.to} marks={v.marks} muted={v.muted} naming={naming} />}
      {v.kind === 'ear' && <><Listen playing={playing} heard={heard} onPlay={onPlay} />{v.hint && <div className="hint">{v.hint}</div>}</>}
    </div>
  );
}

function Listen({ playing, heard, onPlay }: { playing: boolean; heard: boolean; onPlay: () => void }) {
  const t = useT();
  return (
    <>
      <button type="button" className={`listen ${playing ? 'playing' : ''}`} onClick={onPlay} aria-label={t(heard ? 'player.listenAgain' : 'player.listen')}><PlayIcon /></button>
      <div className="hint">{t(heard ? 'player.hintAgain' : 'player.hintFirst')}</div>
    </>
  );
}

// ---------------- área de resposta ----------------
function AnswerArea({ q, phase, picked, acc, setAcc, onAnswer, naming }: {
  q: Question; phase: Phase; picked: string | null; acc: number; setAcc: (n: number) => void; onAnswer: Submit; naming: 'pt' | 'en';
}) {
  const t = useT();
  const sf = q.surface;
  const ok = (r: Response) => validate(q.expected, r);
  const state = (id: string, correct: boolean) => (phase === 'ask' ? '' : correct ? 'right' : picked === id ? 'wrong' : '');

  if (sf.kind === 'choices') {
    const rhythm = sf.options.some(o => o.rhythm);
    return (
      <div className={`answers ${sf.wide ? 'wide' : ''} ${rhythm ? 'rhythm' : ''}`}>
        {sf.options.map((o, i) => (
          <button key={o.id} type="button" className={`ans ${rhythm ? 'rhythm' : ''} ${state(o.id, ok(optionResponse(o)))}`} disabled={phase !== 'ask'} onClick={() => onAnswer(optionResponse(o), o.id)}>
            {i < 9 && <span className="k">{i + 1}</span>}
            {o.rhythm ? <RhythmLine bars={o.rhythm} label={t('player.option', { n: i + 1 })} /> : o.label}
          </button>
        ))}
      </div>
    );
  }
  const accRow = (allowed: boolean) => allowed && (
    <div className="accrow" role="group" aria-label={t('player.accidental')}>
      {[[-1, '♭'], [0, '♮'], [1, '♯']].map(([v, l]) => <Chip key={v} on={acc === v} onClick={() => setAcc(Number(v))}>{l}</Chip>)}
    </div>
  );
  if (sf.kind === 'letters') {
    // na revelação, a letra certa aparece com o acidente certo
    const revealAcc = q.expected.kind === 'spelled' ? q.expected.acc : acc;
    return (
      <div>
        {accRow(sf.accidentals)}
        <div className="letters">
          {[0, 1, 2, 3, 4, 5, 6].map(l => {
            const right = ok({ kind: 'spelled', letter: l, acc: revealAcc });
            return (
              <button key={l} type="button" className={`ans ${phase === 'ask' ? '' : right ? 'right' : picked?.startsWith(`${l}:`) ? 'wrong' : ''}`}
                disabled={phase !== 'ask'} onClick={() => onAnswer({ kind: 'spelled', letter: l, acc }, `${l}:${acc}`)}>
                {noteName({ letter: l as 0, acc: phase !== 'ask' && right ? revealAcc : acc }, naming)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (sf.kind === 'staff') return <div>{accRow(sf.accidentals)}</div>;
  return null;
}

// ---------------- personalizar ----------------
function SettingsPanel({ def, ctx, values, onChange, extra }: { def: SeriesItem; ctx: Ctx; values: Record<string, SettingValue>; onChange: (v: Record<string, SettingValue>) => void; extra?: ReactNode }) {
  const t = useT();
  return (
    <div className="settings">
      {def.settings(ctx).map(s => (
        <div className="field" key={s.id}>
          <span>{s.label}</span>
          {s.type === 'toggle' && (
            <label className="switch"><input type="checkbox" id={`set-${def.id}-${s.id}`} checked={!!values[s.id]} onChange={e => onChange({ ...values, [s.id]: e.target.checked })} />{t(values[s.id] ? 'common.yes' : 'common.no')}</label>
          )}
          {s.type === 'single' && (
            <div className="row">{s.options!.map(o => <Chip key={o.id} on={values[s.id] === o.id} onClick={() => onChange({ ...values, [s.id]: o.id })}>{o.label}</Chip>)}</div>
          )}
          {s.type === 'multi' && (
            <div className="row">{s.options!.map(o => {
              const cur = (values[s.id] as string[]) ?? [];
              const on = cur.includes(o.id);
              return <Chip key={o.id} on={on} onClick={() => {
                const nextV = on ? cur.filter(x => x !== o.id) : [...cur, o.id];
                if (nextV.length) onChange({ ...values, [s.id]: nextV });
              }}>{o.label}</Chip>;
            })}</div>
          )}
          {s.type === 'range' && (() => {
            const v = Number(values[s.id] ?? s.min ?? 0);
            return (
              <div className="row">
                <input className="range" type="range" style={{ maxWidth: 240 }} id={`set-${def.id}-${s.id}`} aria-label={s.label}
                  min={s.min} max={s.max} step={s.step} value={v} onChange={e => onChange({ ...values, [s.id]: Number(e.target.value) })} />
                <span className="num">{s.format ? s.format(v) : v}</span>
              </div>
            );
          })()}
        </div>
      ))}
      {extra}
      <div className="row"><Btn small tone="ghost" onClick={() => onChange({ ...def.defaults })}>{t('player.resetDefaults')}</Btn></div>
    </div>
  );
}
