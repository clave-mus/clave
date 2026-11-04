// Executor de rotinas (F3-2 guiado, F3-3 livre, F3-4 a ciclagem na tela).
//
// A lógica toda está em `routines/execucao.ts`, testada sem React. Aqui fica só o que é tela.
//
// **O que esta tela não faz, de propósito:** não avança sozinha, não bloqueia, não esconde nada
// quando o tempo sugerido passa, não dá nota, não celebra e não mostra percentual. É a decisão 4 e a
// lista do que nunca entra.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { itemById } from '../catalog';
import ItemScreen from '../catalog/ItemScreen';
import Player from '../catalog/Player';
import { isSeries } from '../catalog/types';
import type { SettingValue } from '../catalog/types';
import { companheirosDe } from '../catalog/grupos';
import { visivel, type Publicacao } from '../catalog/publicacao';
import { resumoDaPratica } from '../catalog/resumo';
import type { ParametrosDePratica } from '../catalog/params';
import { efeitoDaRotacao } from '../routines/rotacao';
import {
  avancar, comecar, etapaAtual, instanciaDaVez, passouDoSugerido, pausar, posicao, problemasDa,
  PERGUNTAS_POR_ETAPA, resumo, retomar, retomavel, saltarPara, sanear, segundosNaEtapa, segundosTotais, terminou,
  tiquetaque, trocar, voltar, type Desfecho, type Execucao,
} from '../routines/execucao';
import { useRotinas } from '../routines/hooks';
import { ROTINAS_DO_TIME, rotinasDoTime } from '../routines/doTime';
import { copiarRotina, gravarSessao, lerSessao, salvarRotina } from '../routines/storage';
import type { Etapa, Rotina } from '../routines/types';
import { Btn, Chip, Tag } from '../components/ui';
import { fmtClock } from '../tools/common';
import { logActivity } from '../state/store';
import { useRevisao } from '../state/store';
import { itemText, useNaming, useT } from '../i18n';

export default function Sessao() {
  const { id = '' } = useParams();
  const t = useT();
  const naming = useNaming();
  const navigate = useNavigate();
  const rotinas = useRotinas();
  const revisao = useRevisao();

  const [sessao, setSessao] = useState<Execucao | null>(null);
  const [adotou, setAdotou] = useState(false);
  const [relogio, setRelogio] = useState(true);
  /**
   * No modo livre a tela abre nos **cartões**, e tocar num abre aquela etapa (F3-3). No guiado isto é
   * sempre `true`: a etapa atual está em foco por definição.
   */
  const [aberta, setAberta] = useState(false);

  /**
   * A rotina a executar. Pode ser uma da pessoa ou uma do time — e **começar uma do time adota-a**,
   * ver `iniciar`. Enquanto não começou, a do time é lida direto, para dar para olhar sem adotar.
   */
  const doTime = useMemo(() => rotinasDoTime(t).filter(r => visivel(rotinasDoTimePub(r.id), revisao)), [t, revisao]);
  const alvo = rotinas.find(r => r.id === id) ?? doTime.find(r => r.id === id) ?? null;
  // a execução em curso pode apontar para a CÓPIA criada ao começar, não para o alvo da URL
  const rotina = (sessao && rotinas.find(r => r.id === sessao.rotinaId)) ?? alvo;

  // Retoma a execução guardada, se ela for desta rotina. Saneia antes: a pessoa pode ter editado a
  // rotina desde então, e ficar preso numa etapa fantasma é o "falhar em silêncio" que a F3-2 proíbe.
  const [guardada] = useState(() => lerSessao() as Execucao | null);
  const podeRetomar = useMemo(
    () => (guardada && (guardada.rotinaId === id || guardada.rotinaId === copiaDe(id, rotinas))
      ? retomavel(guardada, rotinas) : null),
    [guardada, id, rotinas],
  );

  useEffect(() => { if (sessao) gravarSessao(sessao); }, [sessao]);

  // O cronômetro é CRESCENTE e por etapa. Um tique por segundo; pausada, não soma.
  //
  // As dependências são os três booleanos, e não `sessao`: a sessão muda a cada tique, e depender
  // dela recriaria o intervalo uma vez por segundo.
  const correndo = !!sessao && !sessao.pausada && !terminou(sessao);
  const etapaDoRelogio = sessao?.etapaAtual ?? '';
  useEffect(() => {
    if (!correndo) return;
    const h = window.setInterval(() => setSessao(s => (s ? tiquetaque(s, 1) : s)), 1000);
    return () => window.clearInterval(h);
  }, [correndo, etapaDoRelogio]);

  const iniciar = useCallback((r: Rotina) => {
    // Rotina do time: começar **cria a cópia da pessoa** (decisão 9). É a cópia que guarda o rodízio
    // e o tempo praticado; a original do time nunca muda.
    const minha = r.doTime ? copiarRotina(r, 'time') : r;
    const { sessao: nova, rotina: atualizada } = comecar(minha);
    salvarRotina(atualizada);
    setAdotou(!!r.doTime);
    // No livre o cronômetro existe e FICA QUIETO (F3-3): somar e exibir seria cobrança disfarçada.
    setRelogio(r.modo !== 'livre');
    setAberta(r.modo !== 'livre');
    setSessao(nova);
    if (r.doTime) navigate(`/rotina/${minha.id}/fazer`, { replace: true });
  }, [navigate]);

  /**
   * Fecha a etapa com um desfecho. No **guiado** avança para a próxima; no **livre** volta aos
   * cartões, porque ali não existe "próxima" — a ordem é de quem está praticando.
   */
  const marcar = (d: Desfecho) => {
    if (rotina?.modo === 'livre') {
      setSessao(s => (s ? { ...s, desfechos: { ...s.desfechos, [s.etapaAtual]: d } } : s));
      setAberta(false);
      return;
    }
    setSessao(s => (s ? avancar(s, d) : s));
  };

  if (!rotina) return <div className="empty"><h1>{t('notFound.title')}</h1><div><Btn to="/">{t('common.backHome')}</Btn></div></div>;

  const problemas = problemasDa(rotina, itemId => !!itemById[itemId], itemId => companheirosDe(itemId, x => !!itemById[x] && visivel(itemById[x]!.publicacao, revisao)));

  // ---------------------------------------------------------------- antes de começar
  if (!sessao) {
    if (rotina.etapas.length === 0) {
      return <div className="empty"><h1>{t('session.none')}</h1><div><Btn to={`/rotina/${rotina.id}`}>{t('session.build')}</Btn></div></div>;
    }
    return (
      <div className="sessao-abrir" style={{ display: 'grid', gap: 18 }}>
        <Tag>{rotina.modo === 'guiado' ? t('editor.guided') : t('editor.free')}</Tag>
        <h1>{rotina.nome}</h1>
        {rotina.notas && <p className="muted">{rotina.notas}</p>}
        <Problemas problemas={problemas} rotinaId={rotina.id} />
        <div className="row">
          {podeRetomar && guardada ? (
            <>
              <Btn onClick={() => { setRelogio(rotina.modo !== 'livre'); setAberta(rotina.modo !== 'livre'); setSessao(sanear(guardada, podeRetomar)); }}>{t('session.resume')}</Btn>
              <Btn tone="ghost" onClick={() => iniciar(rotina)}>{t('session.startOver')}</Btn>
            </>
          ) : (
            <Btn onClick={() => iniciar(rotina)}>{t('session.start')}</Btn>
          )}
          <Btn tone="ghost" to={`/rotina/${rotina.id}`}>{t('routines.edit')}</Btn>
        </div>
        {podeRetomar && guardada && (
          <p className="muted">{t('session.resumeFrom', {
            step: tituloDaEtapa(guardada, podeRetomar, t) || '—',
            time: fmtClock(segundosTotais(guardada)),
          })}</p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- fim
  if (terminou(sessao)) {
    const r = resumo(sessao);
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <Tag>{rotina.nome}</Tag>
        <h1>{t('session.doneTitle')}</h1>
        {r.segundos === 0 && r.concluidas === 0 ? (
          <p style={{ fontSize: 18 }}>{t('session.doneNothing')}</p>
        ) : (
          <p style={{ fontSize: 18 }}>
            {t('session.doneTime', { time: fmtClock(r.segundos) })} · {t('session.doneCounts', { done: r.concluidas, n: sessao.ordem.length })}
            {r.puladas > 0 ? ` · ${t('session.doneSkipped', { n: r.puladas })}` : ''}
            {r.naoVisitadas > 0 ? ` · ${t('session.doneUntouched', { n: r.naoVisitadas })}` : ''}
          </p>
        )}
        <div className="row">
          <Btn onClick={() => iniciar(rotina)}>{t('session.repeat')}</Btn>
          <Btn tone="ghost" onClick={() => { gravarSessao(null); navigate('/'); }}>{t('session.close')}</Btn>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- em execução
  const etapa = etapaAtual(sessao, rotina);
  if (!etapa) {
    // a etapa atual sumiu do editor no meio da execução: saneia e segue
    const saneada = sanear(sessao, rotina);
    if (saneada !== sessao) { setSessao(saneada); return null; }
    return <div className="empty"><h1>{t('session.none')}</h1><div><Btn to={`/rotina/${rotina.id}`}>{t('session.build')}</Btn></div></div>;
  }

  // ---------------------------------------------------------------- modo livre: os cartões
  if (rotina.modo === 'livre' && !aberta) {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="eyebrow">{rotina.nome}</span>
          <div className="row">
            <Chip on={!relogio} onClick={() => setRelogio(v => !v)}>{t(relogio ? 'session.hideClock' : 'session.showClock')}</Chip>
            <Btn small tone="ghost" onClick={() => { gravarSessao(sessao); navigate('/'); }}>{t('session.leave')}</Btn>
          </div>
        </div>
        <p className="muted note-line">{t('session.freeHint')}</p>
        {adotou && <p className="muted note-line">{t('session.adoptedToStart')}</p>}
        <Problemas problemas={problemas} rotinaId={rotina.id} />
        <div className="grid cards">
          {sessao.ordem.map(eid => {
            const e = etapaDe(rotina, eid);
            if (!e) return null;
            const it = itemById[instanciaDaVez(sessao, e).itemId];
            if (!it) return null;
            const feita = sessao.desfechos[eid] === 'concluida';
            return (
              <button key={eid} type="button" className="ex-card"
                style={{ textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', opacity: feita ? 0.6 : 1 }}
                onClick={() => { setSessao(s => (s ? saltarPara(s, eid) : s)); setAberta(true); }}>
                <span className="ex-card-text">
                  <b>{itemText(t, it.id, 'title')}</b>
                  <small>
                    {feita ? t('session.gotIt') : ''}
                    {relogio && (sessao.tempoPorEtapa[eid] ?? 0) > 0 ? `${feita ? ' · ' : ''}${fmtClock(sessao.tempoPorEtapa[eid])}` : ''}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
        {/* No livre não há "tempo somado" — somar etapas sem tempo sugerido seria mentira. */}
        <div><Btn tone="ghost" onClick={() => setSessao(s => (s ? { ...s, etapaAtual: '' } : s))}>{t('session.close')}</Btn></div>
      </div>
    );
  }

  const instancia = instanciaDaVez(sessao, etapa);
  const item = itemById[instancia.itemId];
  const n = posicao(sessao);
  const passou = passouDoSugerido(sessao, etapa);
  const rotacao = efeitoDaRotacao(rotina);
  // Herança visível (F2-1): o que veio de cima, com a origem escrita ao lado.
  const daRotina = resumoDaPratica({ ...(rotacao.params as ParametrosDePratica) }, { t, naming });
  const daEtapa = resumoDaPratica(instancia.params, { t, naming });

  const final = () => {
    if (!item) return null;
    const settings = { ...instancia.settings, ...rotacao.settings } as Record<string, SettingValue>;
    const params = { ...(rotacao.params as ParametrosDePratica), ...instancia.params };
    if (isSeries(item)) {
      return (
        <Player
          key={`${etapa.id}:${instancia.itemId}:${sessao.resolvidas[etapa.id] ?? 0}`}
          def={item}
          initialSettings={settings}
          initialParams={params}
          target={PERGUNTAS_POR_ETAPA}
          sessionId={sessao.sessaoId}
          onDone={() => marcar('concluida')}
        />
      );
    }
    return (
      <>
        <ItemScreen key={`${etapa.id}:${instancia.itemId}`} item={item} itemId={item.id} goalMinutes={etapa.segundosSugeridos ? etapa.segundosSugeridos / 60 : undefined} />
        {item.kind === 'tarefa' ? (
          <Autoavaliacao item={item.id} onPick={(d) => { registrarTarefa(item.id, item.primaryModule, segundosNaEtapa(sessao, etapa.id), d, sessao.sessaoId, itemText(t, item.id, 'title')); marcar('concluida'); }} />
        ) : (
          <div><Btn onClick={() => marcar('concluida')}>{t('session.finishStep')}</Btn></div>
        )}
      </>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* a barra: uma faixa por etapa, proporcional ao tempo sugerido quando há */}
      {rotina.modo === 'guiado' && <div style={{ display: 'flex', gap: 6 }} aria-label={t('session.stepOf', { i: n + 1, n: sessao.ordem.length })}>
        {sessao.ordem.map((eid, k) => (
          <div key={eid} style={{
            flex: etapaDe(rotina, eid)?.segundosSugeridos ?? 60, height: 6, borderRadius: 3,
            background: sessao.desfechos[eid] === 'concluida' ? 'var(--accent)' : k === n ? 'var(--ink)' : 'var(--line)',
          }} />
        ))}
      </div>}

      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        {/* No livre não há "etapa 3 de 5": a ordem é de quem pratica, e numerar sugeriria progresso. */}
        <span className="eyebrow">{rotina.nome}{rotina.modo === 'guiado' ? ` · ${t('session.stepOf', { i: n + 1, n: sessao.ordem.length })}` : ''}</span>
        <div className="row">
          <Chip on={!relogio} onClick={() => setRelogio(v => !v)}>{t(relogio ? 'session.hideClock' : 'session.showClock')}</Chip>
          <Chip on={sessao.pausada} onClick={() => setSessao(s => (s ? (s.pausada ? retomar(s) : pausar(s)) : s))}>
            {t(sessao.pausada ? 'session.unpause' : 'session.pause')}
          </Chip>
        </div>
      </div>

      {adotou && <p className="muted note-line">{t('session.adoptedToStart')}</p>}
      <Problemas problemas={problemas} rotinaId={rotina.id} />

      {relogio && (
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="num" style={{ fontSize: 40, fontWeight: 650, lineHeight: 1, color: passou ? 'var(--accent)' : 'var(--ink)' }}>
            {fmtClock(segundosNaEtapa(sessao, etapa.id))}
          </div>
          <span className="eyebrow">
            {etapa.segundosSugeridos ? t('session.suggested', { time: fmtClock(etapa.segundosSugeridos) }) : ''}
            {sessao.pausada ? ` · ${t('session.paused')}` : ''}
          </span>
        </div>
      )}
      {/* Passar do sugerido AVISA e não faz mais nada: não avança, não bloqueia, não esconde. */}
      {passou && <p className="muted note-line">{t('session.overSuggested')}</p>}

      {(daRotina || daEtapa) && (
        <p className="muted note-line">
          {daEtapa ? `${daEtapa} (${t('session.fromStep')})` : `${daRotina} (${t('session.fromRoutine')})`}
        </p>
      )}

      {etapa.instancias.length > 1 && (
        <div className="row">
          <Btn small tone="ghost" onClick={() => setSessao(s => {
            if (!s) return s;
            const { sessao: ns, rotina: nr } = trocar(s, rotina);
            salvarRotina(nr);
            return ns;
          })}>{t('session.swap')}</Btn>
          <span className="muted">{t('session.swapHint', { n: etapa.instancias.length })}</span>
        </div>
      )}

      {item ? final() : (
        <div className="panel"><p>{t('session.missingText', { item: instancia.itemId })}</p></div>
      )}

      <div className="row" style={{ flexWrap: 'wrap' }}>
        {rotina.modo === 'livre' ? (
          <Btn small tone="ghost" onClick={() => setAberta(false)}>← {t('session.steps')}</Btn>
        ) : (
          <>
            <Btn small tone="ghost" disabled={n <= 0} onClick={() => setSessao(s => (s ? voltar(s) : s))}>← {t('session.prev')}</Btn>
            <Btn small tone="ghost" onClick={() => marcar('pulada')}>{t('session.skip')}</Btn>
          </>
        )}
        <Btn small tone="ghost" onClick={() => { gravarSessao(sessao); navigate('/'); }}>{t('session.leave')}</Btn>
      </div>

      {/* A lista compacta: saltar para qualquer etapa, em qualquer direção. Só no guiado — no livre
          os cartões já são a lista. */}
      {rotina.modo === 'guiado' && <div style={{ display: 'grid', gap: 6 }}>
        <span className="eyebrow">{t('session.steps')}</span>
        {sessao.ordem.map((eid, k) => {
          const e = etapaDe(rotina, eid);
          if (!e) return null;
          const it = itemById[instanciaDaVez(sessao, e).itemId];
          return (
            <button key={eid} type="button" className={`step-row ${k === n ? 'on' : ''}`}
              onClick={() => setSessao(s => (s ? saltarPara(s, eid) : s))}
              style={{ textAlign: 'left', border: 0, background: 'none', font: 'inherit', cursor: 'pointer', padding: '6px 0', opacity: k === n ? 1 : 0.65 }}>
              <b>{k + 1}. {it ? itemText(t, it.id, 'title') : eid}</b>
              {sessao.desfechos[eid] && <span className="muted"> · {t(sessao.desfechos[eid] === 'concluida' ? 'session.gotIt' : 'session.skip')}</span>}
              {(sessao.tempoPorEtapa[eid] ?? 0) > 0 && <span className="muted"> · {fmtClock(sessao.tempoPorEtapa[eid])}</span>}
            </button>
          );
        })}
      </div>}
    </div>
  );
}

const etapaDe = (r: Rotina, id: string): Etapa | undefined => r.etapas.find(e => e.id === id);

function tituloDaEtapa(s: Execucao, r: Rotina, t: ReturnType<typeof useT>): string {
  const e = etapaDe(r, s.etapaAtual);
  if (!e) return '';
  const it = itemById[instanciaDaVez(s, e).itemId];
  return it ? itemText(t, it.id, 'title') : '';
}

/** A cópia desta rotina do time, se a pessoa já adotou — é o que faz o retomar achar a execução. */
const copiaDe = (id: string, rotinas: readonly Rotina[]) => rotinas.find(r => r.origem?.rotinaId === id)?.id ?? '';

/** A publicação de uma rotina do time, pelo id com prefixo (`time:de-bolso`). */
const PUB_DO_TIME: Record<string, Publicacao> = Object.fromEntries(ROTINAS_DO_TIME.map(r => [`time:${r.id}`, r.publicacao]));
const rotinasDoTimePub = (id: string) => PUB_DO_TIME[id];

/**
 * Autoavaliação de etapa do tipo `tarefa` (decisão 5): **nunca** vira acerto.
 *
 * O app não ouve a pessoa tocar; quem sabe se conseguiu é ela. As três respostas são as da F3-2, e a
 * do meio existe porque "com ajuda" é informação diferente de "consegui" e de "não consegui".
 */
function Autoavaliacao({ item, onPick }: { item: string; onPick: (d: 'consegui' | 'com-ajuda' | 'repetir') => void }) {
  const t = useT();
  return (
    <div className="panel" style={{ display: 'grid', gap: 10 }} key={item}>
      <b>{t('session.howWasIt')}</b>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <Btn small onClick={() => onPick('consegui')}>{t('session.gotIt')}</Btn>
        <Btn small tone="ghost" onClick={() => onPick('com-ajuda')}>{t('session.withHelp')}</Btn>
        <Btn small tone="ghost" onClick={() => onPick('repetir')}>{t('session.again')}</Btn>
      </div>
    </div>
  );
}

/**
 * Grava a autoavaliação como **atividade**, não como tentativa.
 *
 * Uma tentativa tem pergunta, resposta esperada e correção; uma tarefa de instrumento não tem
 * nenhuma das três. Registrar como tentativa produziria `correct`, que é o que a decisão 5 proíbe.
 */
function registrarTarefa(id: string, module: Parameters<typeof logActivity>[0]['module'], seconds: number,
  autoavaliacao: 'consegui' | 'com-ajuda' | 'repetir', sessao: string, title: string) {
  logActivity({ id, title, module, seconds, sessao, autoavaliacao });
}

function Problemas({ problemas, rotinaId }: { problemas: { etapaId: string; itemId: string; substitutos: string[] }[]; rotinaId: string }) {
  const t = useT();
  if (problemas.length === 0) return null;
  return (
    <div className="panel" style={{ display: 'grid', gap: 8 }}>
      <b>{t('session.missingTitle')}</b>
      {problemas.map(p => (
        <p key={p.etapaId} className="muted" style={{ margin: 0 }}>
          {t('session.missingText', { item: p.itemId })}{' '}
          {p.substitutos.length === 0 && t('session.missingNone')}
        </p>
      ))}
      <div><Btn small tone="ghost" to={`/rotina/${rotinaId}`}>{t('session.build')}</Btn></div>
    </div>
  );
}
