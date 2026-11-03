import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useContent } from '../data/localized';
import { exerciseById } from '../exercises/catalog';
import { catalogByModule } from '../exercises/catalogView';
import Player, { decodeSettings } from '../exercises/Player';
import { toolById } from '../exercises/tools';
import { toggleArsenal, useStore } from '../state/store';
import Ambiente from '../tools/Ambiente';
import Backing from '../tools/Backing';
import { Metronome } from '../tools/common';
import Leitura from '../tools/Leitura';
import Tecnica from '../tools/Tecnica';
import { Field, PageHead, Tag } from '../components/ui';
import NotFound from './NotFound';
import { lessonProgress } from './Estudar';
import { itemText, useT } from '../i18n';

// A leitura rítmica traz a VexFlow; só baixa quando a ferramenta abre.
const Ritmo = lazy(() => import('../tools/Ritmo'));

export const TOOL_COMPONENTS: Record<string, () => React.ReactElement> = {
  metronomo: () => <Metronome />,
  ambiente: () => <Ambiente />,
  backing: () => <Backing />,
  leitura: () => <Leitura />,
  ritmo: () => <Suspense fallback={<LoadingScore />}><Ritmo /></Suspense>,
  tecnica: () => <Tecnica />,
};

function LoadingScore() {
  const t = useT();
  return <p className="muted">{t('train.loadingScore')}</p>;
}

const OPEN_KEY = 'clave:treinar-abertos';
/** Módulos abertos ficam lembrados neste navegador (só uma conveniência de tela). */
function loadOpen(): string[] {
  try { const v = JSON.parse(localStorage.getItem(OPEN_KEY) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch { return []; }
}

export default function Treinar() {
  const t = useT();
  const { MODULES, moduleById, lessonById } = useContent();
  const stats = useStore(s => s.stats);
  const arsenal = useStore(s => s.arsenal);
  const { hash } = useLocation();
  const [mobileOnly, setMobileOnly] = useState(false);
  const [open, setOpen] = useState<string[]>(loadOpen);
  useEffect(() => { try { localStorage.setItem(OPEN_KEY, JSON.stringify(open)); } catch { /* sem armazenamento: só não lembra */ } }, [open]);
  // /treinar#theory abre o módulo e rola até ele (é para onde voltam as telas de exercício e de aula)
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    if (!MODULES.some(m => m.id === id)) return;
    setOpen(o => (o.includes(id) ? o : [...o, id]));
    requestAnimationFrame(() => document.getElementById(`mod-${id}`)?.scrollIntoView());
  }, [hash, MODULES]);
  const toggle = (id: string) => setOpen(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));

  return (
    <div>
      <PageHead tag={t('train.tag')} title={t('train.title')} sub={t('train.sub')} />
      <div className="row" style={{ marginBottom: 8, justifyContent: 'flex-end' }}>
        <label className="switch"><input type="checkbox" id="mobile-only" checked={mobileOnly} onChange={e => setMobileOnly(e.target.checked)} />{t('train.mobileOnly')}</label>
      </div>

      {catalogByModule({ mobileOnly }).map(entry => {
        const m = moduleById[entry.module];
        const items = entry.exercises.length + entry.tools.length;
        if (!items && !entry.lessons.length) return null;
        const isOpen = open.includes(m.id);
        const counts = [items ? t('train.countItems', { count: items }) : '', entry.lessons.length ? t('train.countLessons', { count: entry.lessons.length }) : ''].filter(Boolean).join(' · ');
        return (
          <section key={m.id} id={`mod-${m.id}`} className="sec mod">
            <h2 className="mod-h">
              <button type="button" className="mod-head" aria-expanded={isOpen} aria-controls={`mod-body-${m.id}`} onClick={() => toggle(m.id)}>
                <Field seed={m.id} color={m.color} className="field-square" style={{ width: 44, flex: 'none' }} />
                <span><span className="name">{m.name}</span><span className="sub">{m.short}</span></span>
                <span className="count">{counts}</span>
                <span className="chev" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
            </h2>
            {isOpen && (
              <div id={`mod-body-${m.id}`} className={`mod-body ${entry.lessons.length && items ? '' : 'solo'}`}>
                {entry.lessons.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>{t('train.lessons')}</div>
                    <div className="mod-lessons">
                      {entry.lessons.map(id => (
                        <Link key={id} to={`/estudar/${id}`} className="ex-card">
                          <span className="acc" style={{ background: m.color }} />
                          <div style={{ minWidth: 0 }}>
                            <h3>{lessonById[id].title}</h3>
                            <div className="progressbar" style={{ marginTop: 10 }}><i style={{ width: `${lessonProgress(id, stats) * 100}%` }} /></div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {items > 0 && (
                  <div>
                    {entry.lessons.length > 0 && <div className="eyebrow" style={{ marginBottom: 8 }}>{t('train.items')}</div>}
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                      {entry.exercises.map(id => {
                        const e = exerciseById[id];
                        const st = stats[id];
                        const pinned = arsenal.includes(id);
                        return (
                          <div key={id} style={{ position: 'relative' }}>
                            <Link to={`/treinar/${id}`} className="ex-card">
                              <span className="acc" style={{ background: m.color }} />
                              <div style={{ minWidth: 0, paddingRight: 26 }}>
                                <h3>{itemText(t, id, 'title')}</h3>
                                <p>{itemText(t, id, 'desc')}</p>
                                <div className="meta"><span className="mini-tag">{t(`train.groups.${e.group}`)}</span>{st && <span className="mini-tag">{t('train.done', { count: st.attempts })}</span>}</div>
                              </div>
                              {st && <span className="pct num">{Math.round((st.correct / st.attempts) * 100)}%</span>}
                            </Link>
                            <button type="button" onClick={() => toggleArsenal(id)} aria-pressed={pinned} aria-label={t(pinned ? 'train.unpin' : 'train.pin')}
                              style={{ position: 'absolute', right: 10, top: 10, border: 0, background: 'none', cursor: 'pointer', fontSize: 20, color: pinned ? 'var(--mu)' : 'var(--muted)' }}>{pinned ? '★' : '☆'}</button>
                          </div>
                        );
                      })}
                      {entry.tools.map(id => {
                        const tool = toolById[id];
                        return (
                          <Link key={id} to={tool.path} className="ex-card">
                            <span className="acc" style={{ background: m.color }} />
                            <Field seed={tool.id} color={moduleById[tool.primaryModule].color} className="field-square" style={{ width: 40, flex: 'none' }} />
                            <div style={{ minWidth: 0 }}>
                              <h3>{itemText(t, id, 'title')}</h3>
                              <p>{itemText(t, id, 'desc')}</p>
                              <div className="meta"><span className="mini-tag">{t('train.toolTag')}</span><span className="mini-tag">{t(tool.mobile ? 'common.mobile' : 'common.withInstrument')}</span></div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function ExercisePage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const t = useT();
  const { LESSONS } = useContent();
  const def = exerciseById[id];
  if (!def) return <NotFound />;
  const shared = decodeSettings(params.get('c'));
  const lesson = LESSONS.find(l => l.exercises.includes(id));
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link to={`/treinar#${def.primaryModule}`} className="eyebrow" style={{ textDecoration: 'none' }}>{t('train.back')}</Link>
        {lesson && <Link to={`/estudar/${lesson.id}`} className="eyebrow" style={{ textDecoration: 'none', color: 'var(--mu)' }}>{t('train.lesson', { title: lesson.title })}</Link>}
      </div>
      {shared && <div className="panel" style={{ background: 'var(--bk-3)', padding: 12 }}>{t('train.shared')}</div>}
      <Player key={id + (shared ? 'c' : '')} def={def} initialSettings={shared} />
    </div>
  );
}

export function ToolPage() {
  const { id = '' } = useParams();
  const t = useT();
  const { moduleById } = useContent();
  const tool = toolById[id];
  const Comp = TOOL_COMPONENTS[id];
  if (!tool || !Comp) return <NotFound />;
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Link to={`/treinar#${tool.primaryModule}`} className="eyebrow" style={{ textDecoration: 'none' }}>{t('train.back')}</Link>
      <header className="page-head" style={{ marginBottom: 0 }}>
        <div><div className="row"><Tag>{moduleById[tool.primaryModule].name}</Tag>{tool.mobile ? <Tag tone="dark">{t('common.mobile')}</Tag> : <Tag tone="co">{t('common.withInstrument')}</Tag>}</div><h1>{itemText(t, tool.id, 'title')}</h1><p>{itemText(t, tool.id, 'desc')}</p></div>
        <Field seed={tool.id} className="field-square" style={{ width: 88 }} />
      </header>
      <Comp />
    </div>
  );
}
