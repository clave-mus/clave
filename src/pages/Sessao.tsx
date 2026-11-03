// Executor guiado — BASE DA TAREFA F3-2, fora das rotas por enquanto.
//
// O gerador de sessão que alimentava esta tela saiu na F0-3 (decisão 1: quem escolhe é a pessoa).
// O que sobrevive aqui e serve ao executor de rotinas: a barra de etapas, o cronômetro por etapa,
// o avanço manual, o Player embutido e a tela final.
//
// O que precisa mudar na F3-2, segundo docs/tarefas/F3-rotinas.md:
// - `Block` vira `Step` com conjunto de instâncias e política de ciclagem (decisão 7);
// - o cronômetro passa a ser CRESCENTE e a informar sem bloquear, em vez de regressivo;
// - os três tipos de término (Série, Ambiente, Tarefa) se comportam diferente no fim da etapa;
// - a herança de parâmetros fica visível ("Tonalidade: Dó maior (da rotina)");
// - a sessão é salva para fechar a página e retomar.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useContent } from '../data/localized';
import { itemById } from '../catalog';
import { isSeries } from '../catalog/types';
import Player from '../catalog/Player';
import { logActivity } from '../state/store';
import { newId } from '../state/attempts';
import ItemScreen from '../catalog/ItemScreen';
import { Btn, Tag } from '../components/ui';
import { fmtClock } from '../tools/common';
import type { ModuleId } from '../catalog/taxonomy';
import { itemText, useT, type MessageKey } from '../i18n';

/** Uma etapa da sessão. Vira `Step` na F3-2. */
export interface Block {
  kind: 'exercise' | 'tool';
  id: string;
  minutes: number;
  target?: number;
  label?: MessageKey;
}

/** Em que módulo um item mora. Vira `areas[0]` quando a F1-3 pluralizar a classificação. */
export function moduleOf(id: string): ModuleId {
  return itemById[id]?.primaryModule ?? 'theory';
}

function loadPlan(state: unknown): Block[] {
  return (state as { plan?: Block[] } | null)?.plan ?? [];
}

export default function Sessao() {
  const location = useLocation();
  const t = useT();
  const { moduleById } = useContent();
  const [plan] = useState(() => loadPlan(location.state));
  // uma sessão guiada é uma sessão de prática só, para as tentativas de todos os blocos
  const [sessionId] = useState(newId);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<{ correct: number; total: number }[]>([]);
  const [left, setLeft] = useState(0);

  const block = plan[i];
  useEffect(() => {
    if (block?.kind === 'tool') setLeft(block.minutes * 60);
  }, [i, block]);
  useEffect(() => {
    if (block?.kind !== 'tool') return;
    const t = window.setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    return () => window.clearInterval(t);
  }, [i, block]);

  if (!plan.length) {
    return <div className="empty"><h1>{t('session.none')}</h1><div><Btn to="/">{t('session.build')}</Btn></div></div>;
  }

  if (i >= plan.length) {
    const c = results.reduce((a, r) => a + r.correct, 0);
    const total = results.reduce((a, r) => a + r.total, 0);
    const minutes = plan.reduce((a, b) => a + b.minutes, 0);
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <Tag>{t('session.done')}</Tag>
        <h1>{t('session.bravo')}</h1>
        <p style={{ fontSize: 18 }}>{total ? t('session.summaryWithAnswers', { blocks: plan.length, minutes, correct: c, total }) : t('session.summary', { blocks: plan.length, minutes })}</p>
        <div className="row"><Btn to="/">{t('common.backHome')}</Btn><Btn to="/perfil/historico" tone="ghost">{t('common.seeProgress')}</Btn></div>
      </div>
    );
  }

  const nextBlock = (r?: { correct: number; total: number; seconds: number }) => {
    if (r && block.kind === 'exercise') {
      setResults(x => [...x, r]);
      logActivity({ id: block.id, title: itemText(t, block.id, 'title'), module: moduleOf(block.id), seconds: r.seconds, correct: r.correct, total: r.total });
    }
    setI(n => n + 1);
  };
  const item = itemById[block.id];
  const ambiente = block.kind === 'tool' && item && !isSeries(item) ? item : null;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', gap: 6 }} aria-label={t('session.blockOf', { i: i + 1, n: plan.length })}>
        {plan.map((b, k) => <div key={k} title={b.label ? t(b.label) : itemText(t, b.id, 'title')} style={{ flex: b.minutes, height: 6, borderRadius: 3, background: k < i ? 'var(--accent)' : k === i ? 'var(--ink)' : 'var(--line)' }} />)}
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="eyebrow">{t('session.blockOf', { i: i + 1, n: plan.length })} · {moduleById[moduleOf(block.id)].name}</span>
        <Btn small tone="ghost" onClick={() => nextBlock()}>{t('session.skip')}</Btn>
      </div>
      {block.kind === 'exercise' && item && isSeries(item) && (
        <Player key={i} def={item} target={block.target} onDone={nextBlock} sessionId={sessionId} />
      )}
      {ambiente && (
        <>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 'clamp(38px, 6vw, 70px)' }}>{block.label ? t(block.label) : itemText(t, block.id, 'title')}</h1>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontSize: 40, fontWeight: 650, lineHeight: 1, color: left === 0 ? 'var(--accent)' : 'var(--ink)' }}>{fmtClock(left)}</div>
              <span className="eyebrow">{t(left === 0 ? 'session.timeUp' : 'session.remaining')}</span>
            </div>
          </div>
          <ItemScreen key={i} item={ambiente} />
          <div><Btn onClick={() => nextBlock()} tone={left === 0 ? 'mu' : 'ghost'}>{t('session.finish')}</Btn></div>
        </>
      )}
    </div>
  );
}
