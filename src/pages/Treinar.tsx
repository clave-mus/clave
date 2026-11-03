import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useContent } from '../data/localized';
import { itemById } from '../catalog';
import { catalogByModule } from '../catalog/catalogView';
import ItemScreen from '../catalog/ItemScreen';
import Player from '../catalog/Player';
import { isSeries } from '../catalog/types';
import { useStore } from '../state/store';
import { Field, PageHead, Tag } from '../components/ui';
import SalvarNaRotina from '../components/SalvarNaRotina';
import { lerAbertura } from '../routines/edicao';
import NotFound from './NotFound';
import { lessonProgress } from './Estudar';
import { itemText, useT } from '../i18n';

const OPEN_KEY = 'clave:treinar-abertos';
/** Módulos abertos ficam lembrados neste navegador (só uma conveniência de tela). */
function loadOpen(): string[] {
  try { const v = JSON.parse(localStorage.getItem(OPEN_KEY) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch { return []; }
}

export default function Treinar() {
  const t = useT();
  const { MODULES, moduleById, lessonById } = useContent();
  const stats = useStore(s => s.stats);
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
                        const st = stats[id];
                        return (
                          <div key={id} style={{ position: 'relative' }}>
                            <Link to={`/catalogo/${id}`} className="ex-card">
                              <span className="acc" style={{ background: m.color }} />
                              <div style={{ minWidth: 0 }}>
                                <h3>{itemText(t, id, 'title')}</h3>
                                <p>{itemText(t, id, 'desc')}</p>
                                {st && <div className="meta"><span className="mini-tag">{t('train.done', { count: st.attempts })}</span></div>}
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                      {entry.tools.map(id => {
                        const tool = itemById[id]!;
                        return (
                          <Link key={id} to={`/catalogo/${id}`} className="ex-card">
                            <span className="acc" style={{ background: m.color }} />
                            <Field seed={tool.id} color={m.color} className="field-square" style={{ width: 40, flex: 'none' }} />
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

/**
 * A tela de um item do catálogo — qualquer item (decisão 17).
 *
 * Se tem `make`, quem roda é o Player, igual para todos. Se tem `screen`, é a tela própria do
 * item, carregada sob demanda. Não existem mais duas rotas nem dois componentes de página.
 */
export function ItemPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const t = useT();
  const { LESSONS, moduleById } = useContent();
  const item = itemById[id];
  if (!item) return <NotFound />;

  // Aberto a partir de uma etapa de rotina: a configuração DA ETAPA, vinda no state da navegação.
  const daEtapa = lerAbertura(location.state);
  const lesson = LESSONS.find(l => l.exercises.includes(id));
  const area = moduleById[item.primaryModule];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <Link to={`/catalogo#${item.primaryModule}`} className="eyebrow" style={{ textDecoration: 'none' }}>{t('train.back')}</Link>
        {lesson && <Link to={`/estudar/${lesson.id}`} className="eyebrow" style={{ textDecoration: 'none', color: 'var(--accent)' }}>{t('train.lesson', { title: lesson.title })}</Link>}
      </div>

      {isSeries(item) ? (
        <Player key={id + JSON.stringify(daEtapa)} def={item} initialSettings={daEtapa?.settings ?? null} initialParams={daEtapa?.params ?? null} />
      ) : (
        <>
          <header className="page-head" style={{ marginBottom: 0 }}>
            <div>
              <div className="row">
                <Tag>{area.name}</Tag>
                {item.mobile ? <Tag tone="dark">{t('common.mobile')}</Tag> : <Tag tone="co">{t('common.withInstrument')}</Tag>}
              </div>
              <h1>{itemText(t, item.id, 'title')}</h1>
              <p>{itemText(t, item.id, 'desc')}</p>
            </div>
            <Field seed={item.id} color={area.color} className="field-square" style={{ width: 88 }} />
          </header>
          <div className="row"><SalvarNaRotina itemId={item.id} settings={{}} /></div>
          <ItemScreen item={item} />
        </>
      )}
    </div>
  );
}
