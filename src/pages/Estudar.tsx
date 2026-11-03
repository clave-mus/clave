import { Link, useParams } from 'react-router-dom';
import { LESSONS as LESSON_BASE } from '../data/content';
import { useContent } from '../data/localized';
import { exerciseById } from '../catalog/catalog';
import { itemById } from '../catalog';
import { useStore } from '../state/store';
import { Btn, Field, PageHead, SecTitle, Tag } from '../components/ui';
import NotFound from './NotFound';
import { itemText, useT } from '../i18n';

export function lessonProgress(id: string, stats: Record<string, { correct: number }>) {
  const m = LESSON_BASE.find(x => x.id === id)!;
  if (!m.exercises.length) return 0;
  return m.exercises.reduce((a, e) => a + Math.min(1, (stats[e]?.correct ?? 0) / 20), 0) / m.exercises.length;
}

export default function Estudar() {
  const stats = useStore(s => s.stats);
  const t = useT();
  const { GENRES, LESSONS, lessonById, MODULES, ROADMAPS } = useContent();
  return (
    <div>
      <PageHead tag={t('study.tag')} title={t('study.title')} sub={t('study.sub')} />

      <section className="sec" style={{ marginTop: 20 }}>
        <SecTitle>{t('study.roadmaps')}</SecTitle>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {ROADMAPS.map(r => {
            const p = r.steps.reduce((a, s) => a + lessonProgress(s.lesson, stats), 0) / r.steps.length;
            return (
              <div key={r.id} className="panel" style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Field seed={r.id} className="field-square" style={{ width: 68, flex: 'none' }} />
                  <div>
                    <h3 style={{ fontSize: 34 }}>{r.title}</h3>
                    <span className="script" style={{ color: 'var(--mu)', fontSize: 20 }}>{r.sub}</span>
                  </div>
                </div>
                <div className="progressbar"><i style={{ width: `${p * 100}%` }} /></div>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, fontSize: 14 }}>
                  {r.steps.map(s => <li key={s.lesson}><Link to={`/estudar/${s.lesson}`}>{lessonById[s.lesson].title}</Link> <span className="muted">· {s.note}</span></li>)}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sec">
        <SecTitle>{t('study.genres')}</SecTitle>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {GENRES.map(g => (
            <Link key={g.id} to={`/estudar/genero/${g.id}`} className="cover-card">
              <Field seed={g.id} color={g.color} className="field-square" label={g.name} style={{ borderRadius: 0 }} />
              <div className="lbl"><h3 style={{ color: g.color }}>{g.name}</h3><span className="sub">{g.sub}</span><small>{g.cat} · {t('study.tracks', { count: g.sides.reduce((a, s) => a + s.tracks.length, 0) })}</small></div>
            </Link>
          ))}
        </div>
      </section>

      {MODULES.map(a => {
        const mods = LESSONS.filter(l => l.primaryModule === a.id);
        if (!mods.length) return null;
        return (
          <section key={a.id} className="sec" style={{ marginTop: 40 }}>
            <SecTitle>{a.name}</SecTitle>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {mods.map(m => (
                <Link key={m.id} to={`/estudar/${m.id}`} className="ex-card">
                  <span className="acc" style={{ background: a.color }} />
                  <div style={{ minWidth: 0 }}>
                    <h3>{m.title}</h3>
                    <p>{m.why}</p>
                    <div className="progressbar" style={{ marginTop: 10 }}><i style={{ width: `${lessonProgress(m.id, stats) * 100}%` }} /></div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function LessonPage() {
  const { id = '' } = useParams();
  const t = useT();
  const { lessonById, moduleById } = useContent();
  const m = lessonById[id];
  if (!m) return <NotFound />;
  const a = moduleById[m.primaryModule];
  return (
    <div style={{ display: 'grid', gap: 28 }}>
      <Link to={`/treinar#${m.primaryModule}`} className="eyebrow" style={{ textDecoration: 'none' }}>{t('study.backToModule', { module: a.name })}</Link>
      <header className="page-head" style={{ marginBottom: 0 }}>
        <div><Tag>{a.name}</Tag><h1>{m.title}</h1></div>
        <Field seed={a.id} color={a.color} className="field-square" style={{ width: 84 }} />
      </header>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="panel" style={{ background: 'var(--co)' }}><div className="eyebrow" style={{ color: 'var(--cream)' }}>{t('study.why')}</div><p style={{ fontSize: 18, marginTop: 8 }}>{m.why}</p></div>
        <div className="panel"><div className="eyebrow">{t('study.how')}</div><p style={{ fontSize: 18, marginTop: 8 }}>{m.how}</p></div>
      </div>
      <section>
        <SecTitle>{t('study.steps')}</SecTitle>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {m.steps.map((s, i) => (
            <li key={i} style={{ display: 'flex', gap: 16, alignItems: 'baseline', background: 'var(--bk-2)', padding: '14px 18px' }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 34, color: 'var(--mu)', width: 28, flex: 'none' }}>{i + 1}</span>
              <span style={{ fontSize: 17 }}>{s}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <SecTitle>{t('study.practice')}</SecTitle>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {m.exercises.map(e => exerciseById[e] && (
            <Link key={e} to={`/treinar/${e}`} className="ex-card"><span className="acc" style={{ background: moduleById[exerciseById[e].primaryModule].color }} /><div><h3>{itemText(t, e, 'title')}</h3><p>{itemText(t, e, 'desc')}</p></div></Link>
          ))}
          {m.tools.map(id => itemById[id] && (
            <Link key={id} to={`/catalogo/${id}`} className="ex-card"><span className="acc" style={{ background: moduleById[itemById[id]!.primaryModule].color }} /><div><h3>{itemText(t, id, 'title')}</h3><p>{itemText(t, id, 'desc')}</p></div></Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export function GenrePage() {
  const { id = '' } = useParams();
  const t = useT();
  const { genreById } = useContent();
  const g = genreById[id];
  if (!g) return <NotFound />;
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <Link to="/estudar" className="eyebrow" style={{ textDecoration: 'none' }}>{t('study.back')}</Link>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start', gap: 32 }}>
        <Field seed={g.id} color={g.color} className="field-square" label={g.name} style={{ width: '100%', fontSize: 34 }} />
        <div style={{ display: 'grid', gap: 16 }}>
          <span className="eyebrow">{g.cat}</span>
          <h1 style={{ fontSize: 'clamp(64px, 10vw, 128px)', color: g.color }}>{g.name}</h1>
          <span className="script" style={{ fontSize: 30 }}>{g.sub}</span>
          <p className="muted" style={{ fontSize: 17 }}>{g.desc}</p>
          {g.sides.map(side => (
            <div key={side.side}>
              <div className="eyebrow" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 6, marginBottom: 8 }}>{side.side}</div>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                {side.tracks.map((track, i) => (
                  <li key={track.title} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20, color: 'var(--mu)', width: 18 }}>{i + 1}</span>
                    {track.to ? <Link to={track.to} style={{ fontWeight: 600 }}>{track.title}</Link> : <span style={{ fontWeight: 600 }}>{track.title} <span className="muted" style={{ fontWeight: 400 }}>{t('study.soon')}</span></span>}
                    <span style={{ flex: 1, borderBottom: '1px dotted #5a534a', transform: 'translateY(-4px)' }} />
                    <span className="num muted">{track.min}:00</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <div><Btn to={g.sides[0].tracks.find(track => track.to)?.to ?? '/treinar'}>{t('study.playFirst')}</Btn></div>
        </div>
      </div>
    </div>
  );
}
