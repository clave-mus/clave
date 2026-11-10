// Jogador de exercício: mostra a pergunta, toca o som, confere a resposta e guarda o progresso.
// Só conhece o modelo da C1 (superfície, esperado, conteúdo sonoro). A conferência é de
// validate.ts e o som, de presentation.ts.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { atTime, now, pararTudo } from '../audio/engine';
import { playContent, resolvePresentation, type Presentation } from '../audio/presentation';
import { useContent } from '../data/localized';
import { getState, recordAnswer, saveSettings, useStore } from '../state/store';
import { useRegistroDePratica } from '../state/useRegistro';
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
import type { Ctx, ParteDoSom, SeriesItem, Question, Response, SettingValue, Surface } from './types';
import SalvarNaRotina from '../components/SalvarNaRotina';
import { paramsRegistraveis } from './registro';
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
  /**
   * **O primeiro preset é a entrada do item** (pedido do Paulo, 09/11): quem abre sem nada salvo
   * cai no atalho mais simples, settings e tonalidade.
   *
   * Não vale quando o item foi aberto por uma rotina ou por um link compartilhado — ali a
   * configuração já veio decidida, e sobrepor a entrada apagaria a escolha de quem montou.
   */
  const entrada = initialSettings || initialParams ? undefined : def.presets?.[0];
  // O perfil por baixo, e por cima o que a pessoa escolheu NESTE exercício (decisão 87).
  const { params, pratica, mudar, limpar } = useParamsDoItem(def.id, initialParams, entrada?.params);
  // Dentro de uma rotina em execução, "salvar numa rotina" é ruído: a pessoa já está numa.
  const emRotina = !!target;
  const saved = useStore(s => s.settings[def.id]);
  // Aberto a partir de uma etapa de rotina, o item começa com a configuração DA ETAPA — não com a
  // que a pessoa deixou salva no item. E mexer nas configurações precisa continuar funcionando:
  // enquanto houver `local`, é nele que a mudança cai, e a configuração guardada do item não é
  // tocada. (A primeira versão do link compartilhado deixava `initialSettings` mandar em tudo, e o
  // painel de configurações virava decoração: gravava num lugar que ninguém lia.)
  const [local, setLocal] = useState<Record<string, SettingValue> | null>(initialSettings ?? null);
  const settings = useMemo(() => ({ ...def.defaults, ...(entrada?.settings ?? {}), ...(local ?? saved ?? {}) }), [def, saved, local, entrada]);
  const guardarSettings = useCallback((v: Record<string, SettingValue>) => (local ? setLocal(v) : saveSettings(def.id, v)), [local, def.id]);
  /**
   * Clicar num atalho aplica as duas camadas de uma vez. Separar levaria ao caso em que o atalho
   * diz "dó maior" e a tonalidade continua a de antes — um atalho que não entrega o que promete.
   */
  const aplicarPreset = useCallback((p: NonNullable<SeriesItem['presets']>[number]) => {
    guardarSettings({ ...def.defaults, ...p.settings });
    if (p.params) mudar(p.params);
  }, [def.defaults, guardarSettings, mudar]);
  const locale = useLocale();
  const ctx: Ctx = useMemo(() => ({ naming, conv: locale, t, params }), [naming, locale, t, params]);
  /**
   * Só o que muda a PERGUNTA. Mexer em "arpejar" ou na duração não sorteia um acorde novo — antes
   * sorteava, e a pessoa perdia o que estava tentando identificar.
   */
  const chaveDaPergunta = useMemo(() => {
    const soSom = new Set(def.settings(ctx).filter(s => s.soPresentation).map(s => s.id));
    return JSON.stringify(Object.entries(settings).filter(([k]) => !soSom.has(k)).sort());
  }, [def, ctx, settings]);
  // `settings` é lido pela ref, para a pergunta não ser refeita quando só a apresentação muda
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const make = useCallback(() => def.make(settingsRef.current, ctx), [def, ctx, chaveDaPergunta]); // eslint-disable-line react-hooks/exhaustive-deps
  // Por que estas configurações não geram pergunta (decisão 13). Havendo motivo, `make` NUNCA é
  // chamado: o certo é recusar e explicar, não sortear uma pergunta impossível de responder.
  const problema = useMemo(() => def.problema?.(settings, ctx) ?? null, [def, settings, ctx]);
  // o que as configurações da pessoa mudam no som (ex.: arpejar, duração do acorde)
  const settingsPresentation = useMemo(() => def.settings(ctx).filter(s => s.quando?.(settings) ?? true).reduce<Partial<Presentation>>(
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

  // ao esconder a aba, sair da página ou desmontar, registra a atividade no histórico — sempre a mesma
  // entrada, com o que valia NO FIM (src/state/useRegistro.ts)
  useRegistroDePratica(() => {
    const s = scoreRef.current;
    if (s.total <= 0 || target) return null;
    return {
      id: def.id, title: itemText(t, def.id, 'title'), module: def.primaryModule,
      seconds: Math.round((Date.now() - started.current) / 1000), correct: s.correct, total: s.total,
      // a mesma forma do snapshot de uma tentativa (F3-9)
      snapshot: { settings, params: paramsRegistraveis(params, def.respeita) },
    };
  });

  // camadas: global (timbre do instrumento, volume) < exercício < configurações da pessoa
  const presentationFor = useCallback((question: Question) =>
    resolvePresentation([globalPresentation(params, question.sound?.instrument), def.presentation, settingsPresentation]), [params, def.presentation, settingsPresentation]);

  /** Toca o som da pergunta. `listening` = a pessoa está ouvindo para responder (conta como escuta). */
  const play = useCallback((question: Question, listening = false) => {
    const content = question.sound;
    if (!content || !getState().sound) return;
    // Para o que ainda está soando: tocar de novo enquanto o acorde anterior decai sobrepõe os dois, e
    // quem identifica de ouvido escuta a soma — que é outro acorde.
    pararTudo();
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

  /**
   * Toca um pedaço declarado do som (o acorde de contexto, uma nota da melodia).
   *
   * **Não conta como escuta** e não mexe em `earReadyAt`: ouvir o acorde sozinho é estudar, não
   * responder, e somá-lo ao tempo de resposta falsearia a medida.
   */
  const playParte = useCallback((question: Question, parte: ParteDoSom) => {
    if (!getState().sound) return;
    pararTudo();
    const dur = playContent({ groups: parte.groups, instrument: question.sound?.instrument }, presentationFor(question));
    setPlaying(true);
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
      exercise: def, question: q, response, correct: ok, sessionId: session.current, locale, settings, params, respeita: def.respeita,
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
          {!emRotina && <SalvarNaRotina itemId={def.id} settings={settings} params={pratica} />}
          </div>
        </div>
        {showSettings && <SettingsPanel def={def} ctx={ctx} values={settings} onChange={guardarSettings} onPreset={aplicarPreset}
          extra={def.respeita?.length ? <PracticePanel respeita={def.respeita} params={params} onChange={mudar} /> : null}
          onReset={() => { guardarSettings({ ...def.defaults }); limpar(); }} />}
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

      <Stage q={q} phase={phase} playing={playing} heard={heard} onPlay={() => play(q, true)} onPlayParte={p => playParte(q, p)} naming={naming} picked={picked} acc={acc} onAnswer={submit} />

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
        </div>
      </div>
      {/* Fora da `row` do rodapé: ao lado do texto do exercício, o painel espremia os dois em largura média. */}
      {!emRotina && <SalvarNaRotina itemId={def.id} settings={settings} params={pratica} />}

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

      {showSettings && <SettingsPanel def={def} ctx={ctx} values={settings} onChange={guardarSettings} onPreset={aplicarPreset}
          extra={def.respeita?.length ? <PracticePanel respeita={def.respeita} params={params} onChange={mudar} /> : null}
        onReset={() => { guardarSettings({ ...def.defaults }); limpar(); }} />}
    </div>
  );
}

// ---------------- palco: o que é perguntado ----------------
function Stage({ q, phase, playing, heard, onPlay, onPlayParte, naming, picked, acc, onAnswer }: {
  q: Question; phase: Phase; playing: boolean; heard: boolean; onPlay: () => void;
  onPlayParte: (p: ParteDoSom) => void; naming: 'pt' | 'en';
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
    if (picked) marks[Number(picked)] = phase === 'right' ? 'var(--ok)' : 'var(--err)';
    if (phase === 'wrong') for (let m = sf.lo; m <= sf.hi; m++) if (ok({ kind: 'pitch', midi: m })) marks[m] = 'var(--ok)';
    return (
      <div className="stage dark">
        {fb}
        <div className="prompt">{q.prompt}</div>
        {v.kind === 'ear' && <Listen playing={playing} heard={heard} onPlay={onPlay} partes={q.sound?.partes} onPlayParte={onPlayParte} />}
        <div style={{ width: '100%', marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Keyboard lo={sf.lo} hi={sf.hi} marks={marks} naming={naming} onPress={m => phase === 'ask' && onAnswer({ kind: 'pitch', midi: m }, String(m))} labels="do" />
        </div>
      </div>
    );
  }
  if (sf.kind === 'fretboard') {
    const marks = [];
    if (picked) {
      const [s, f] = picked.split(':').map(Number);
      marks.push({ s, f, color: phase === 'right' ? 'var(--ok)' : 'var(--err)', label: phase === 'right' ? '✓' : undefined });
    }
    if (phase === 'wrong') {
      const strings = sf.onlyString !== undefined ? [sf.onlyString] : sf.tuning.map((_, i) => i);
      for (const s of strings) for (let f = sf.from; f <= sf.to; f++) if (ok({ kind: 'pitch', midi: sf.tuning[s] + f })) marks.push({ s, f, color: 'var(--ok)', label: '✓' });
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
      {v.kind === 'ear' && <><Listen playing={playing} heard={heard} onPlay={onPlay} partes={q.sound?.partes} onPlayParte={onPlayParte} />{v.hint && <div className="hint">{v.hint}</div>}</>}
    </div>
  );
}

function Listen({ playing, heard, onPlay, partes, onPlayParte }: {
  playing: boolean; heard: boolean; onPlay: () => void;
  partes?: ParteDoSom[]; onPlayParte?: (p: ParteDoSom) => void;
}) {
  const t = useT();
  return (
    <>
      <button type="button" className={`listen ${playing ? 'playing' : ''}`} onClick={onPlay} aria-label={t(heard ? 'player.listenAgain' : 'player.listen')}><PlayIcon /></button>
      <div className="hint">{t(heard ? 'player.hintAgain' : 'player.hintFirst')}</div>
      {/* Os pedaços só aparecem onde o item os declarou — ver `SoundContent.partes`. Ficam abaixo
          do botão grande e menores que ele: repetir tudo continua sendo o gesto principal. O rótulo
          em cima entrou com o pedido do Paulo de deixá-los mais visíveis: sem ele, botões soltos
          embaixo do principal não dizem o que fazem. */}
      {partes && partes.length > 0 && onPlayParte && (
        <div className="listen-partes" role="group" aria-label={t('player.parts')}>
          <span className="eyebrow">{t('player.parts')}</span>
          <div className="partes-fila">
            {partes.map(p => (
              <button key={p.id} type="button" className="listen-parte" onClick={() => onPlayParte(p)}>{p.label}</button>
            ))}
          </div>
        </div>
      )}
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
      <div className={`answers ${sf.wide ? 'wide' : ''} ${sf.compact ? 'compact' : ''} ${rhythm ? 'rhythm' : ''}`}>
        {sf.options.map((o, i) => (
          <button key={o.id} type="button" className={`ans ${sf.compact ? 'compact' : ''} ${rhythm ? 'rhythm' : ''} ${state(o.id, ok(optionResponse(o)))}`} disabled={phase !== 'ask'} onClick={() => onAnswer(optionResponse(o), o.id)}>
            {i < 9 && <span className="k">{i + 1}</span>}
            {o.rhythm ? <RhythmLine bars={o.rhythm} label={t('player.option', { n: i + 1 })} /> : o.label}
          </button>
        ))}
      </div>
    );
  }
  if (sf.kind === 'sequence') {
    return <SequenceArea sf={sf} q={q} phase={phase} picked={picked} onAnswer={onAnswer} />;
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
function SettingsPanel({ def, ctx, values, onChange, onPreset, extra, onReset }: { def: SeriesItem; ctx: Ctx; values: Record<string, SettingValue>; onChange: (v: Record<string, SettingValue>) => void; onPreset: (p: NonNullable<SeriesItem['presets']>[number]) => void; extra?: ReactNode; onReset: () => void }) {
  const t = useT();
  return (
    <div className="settings">
      {/* Atalhos nomeados pelo CONTEÚDO, nunca por nível (decisão 100) */}
      {def.presets?.length ? (
        <div className="field" style={{ display: 'grid', gap: 8 }}>
          <span>{t('presets.title')}</span>
          <div className="row">
            {def.presets.map(p => {
              const igual = Object.entries(p.settings).every(([k, v]) => JSON.stringify(values[k]) === JSON.stringify(v));
              // `igual` olha só os settings: um atalho que diferisse apenas na tonalidade não
              // acenderia. Nenhum dos de hoje é assim, e acender pela tonalidade pediria comparar
              // a camada resolvida, que o painel não tem.
              return <Chip key={p.id} on={igual} onClick={() => onPreset(p)}>{t(p.nome)}</Chip>;
            })}
          </div>
        </div>
      ) : null}
      {def.settings(ctx).filter(s => s.quando?.(values) ?? true).map(s => (
        <div className="field" key={s.id}>
          <span>{s.label}</span>
          {s.type === 'toggle' && (
            <label className="switch"><input type="checkbox" id={`set-${def.id}-${s.id}`} checked={!!values[s.id]} onChange={e => onChange({ ...values, [s.id]: e.target.checked })} />{t(values[s.id] ? 'common.yes' : 'common.no')}</label>
          )}
          {s.type === 'single' && (
            <div className="row">{s.options!.map(o => <Chip key={o.id} on={values[s.id] === o.id} onClick={() => onChange({ ...values, [s.id]: o.id })}>{o.label}</Chip>)}</div>
          )}
          {s.type === 'multi' && (
            <div className={`row ${s.justify ? 'row-justify' : ''}`}>{s.options!.map(o => {
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
      {/* UM botão só: antes o painel de prática trazia o seu, e apareciam dois lado a lado. */}
      <div className="row"><Btn small tone="ghost" onClick={onReset}>{t('player.resetDefaults')}</Btn></div>
    </div>
  );
}

/**
 * Montar a resposta escolhendo entre **todas** as opções, em ordem.
 *
 * O estado parcial mora aqui, e a chave do componente é a pergunta: trocar de pergunta desmonta o
 * componente e zera a montagem, sem efeito nenhum para limpar. Nada é enviado antes de a sequência
 * estar cheia — meia resposta não é resposta, e enviar sozinho ao completar tiraria da pessoa a
 * chance de corrigir o último toque.
 */
function SequenceArea({ sf, q, phase, picked, onAnswer }: {
  sf: Extract<Surface, { kind: 'sequence' }>; q: Question; phase: Phase; picked: string | null; onAnswer: Submit;
}) {
  const t = useT();
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const sep = sf.separador ?? ' ';
  const cheia = escolhidos.length >= sf.comprimento;
  const porId = new Map(sf.options.map(o => [o.id, o]));
  const rotulo = (id: string) => porId.get(id)?.label ?? id;
  const certa = q.expected.kind === 'option' ? q.expected.id : '';

  return (
    <div className="sequencia">
      {/* As casas: o que já foi escolhido e o que falta. Mostrar as vazias é o que diz quantas
          notas a pessoa tem de informar sem precisar de texto explicando. */}
      <div className="seq-casas" role="status" aria-label={t('player.sequenceSoFar')}>
        {Array.from({ length: sf.comprimento }, (_, i) => (
          <span key={i} className={`seq-casa ${escolhidos[i] ? 'cheia' : ''}`}>{escolhidos[i] ? rotulo(escolhidos[i]) : ''}</span>
        ))}
      </div>

      {phase === 'ask' ? (
        <>
          <div className="answers compact seq-paleta">
            {sf.options.map(o => (
              <button key={o.id} type="button" className="ans compact" disabled={cheia}
                onClick={() => setEscolhidos(v => (v.length >= sf.comprimento ? v : [...v, o.id]))}>{o.label}</button>
            ))}
          </div>
          <div className="row seq-acoes">
            <Btn small tone="ghost" disabled={!escolhidos.length} onClick={() => setEscolhidos(v => v.slice(0, -1))}>{t('player.undoLast')}</Btn>
            <Btn disabled={!cheia} onClick={() => onAnswer({ kind: 'option', id: escolhidos.join(sep) }, escolhidos.join(sep))}>{t('player.submitAnswer')}</Btn>
          </div>
        </>
      ) : (
        <div className="seq-conferido">
          <span className={picked === certa ? 'right' : 'wrong'}>{picked?.split(sep).map(rotulo).join(sep) || '—'}</span>
          {picked !== certa && <span className="right">{certa.split(sep).map(rotulo).join(sep)}</span>}
        </div>
      )}
    </div>
  );
}
