import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContent } from '../data/localized';
import { itemById } from '../catalog';
import { catalogByModule } from '../catalog/catalogView';
import { itensDaPorta } from '../catalog/portasView';
import ItemScreen from '../catalog/ItemScreen';
import Player from '../catalog/Player';
import { isSeries } from '../catalog/types';
import { useRevisao, useStore } from '../state/store';
import { estadoDe, visivel } from '../catalog/publicacao';
import { Chip, Field, PageHead, Tag } from '../components/ui';
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
  /** Por objetivo é o PADRÃO (decisão 20b): a pessoa chega com uma pergunta, não com o nome de uma área. */
  const [por, setPor] = useState<'objetivo' | 'area'>('objetivo');
  const revisao = useRevisao();
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
      <div className="row" style={{ marginBottom: 8, justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className="row" role="group" aria-label={t('train.byGoal')}>
          <Chip on={por === 'objetivo'} onClick={() => setPor('objetivo')}>{t('train.byGoal')}</Chip>
          <Chip on={por === 'area'} onClick={() => setPor('area')}>{t('train.byModule')}</Chip>
        </div>
        <label className="switch"><input type="checkbox" id="mobile-only" checked={mobileOnly} onChange={e => setMobileOnly(e.target.checked)} />{t('train.mobileOnly')}</label>
      </div>

      {por === 'objetivo' && <PorObjetivo mobileOnly={mobileOnly} revisao={revisao} stats={stats} aberto={open} alternar={toggle} />}

      {por === 'area' && catalogByModule({ mobileOnly, revisao }).map(entry => {
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
                    <GradeDeItens exercicios={entry.exercises} ferramentas={entry.tools} color={m.color} stats={stats} />
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
 * A grade de cartões de item. Existe como componente porque o catálogo se entra de **dois** jeitos —
 * por objetivo (o padrão, decisão 20b) e por área —, e os dois mostram os mesmos cartões.
 */
function GradeDeItens({ exercicios, ferramentas, color, stats }: {
  exercicios: string[]; ferramentas: string[]; color: string; stats: Record<string, { attempts: number } | undefined>;
}) {
  const t = useT();
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
      {exercicios.map(id => {
        const st = stats[id];
        const rascunho = estadoDe(itemById[id]?.publicacao) === 'rascunho';
        return (
          <div key={id} style={{ position: 'relative' }}>
            <Link to={`/catalogo/${id}`} className="ex-card">
              <span className="acc" style={{ background: color }} />
              <div style={{ minWidth: 0 }}>
                <h3>{itemText(t, id, 'title')}</h3>
                <p>{itemText(t, id, 'desc')}</p>
                {(st || rascunho) && (
                  <div className="meta">
                    {st && <span className="mini-tag">{t('train.done', { count: st.attempts })}</span>}
                    {rascunho && <span className="mini-tag">{t('review.draft')}</span>}
                  </div>
                )}
              </div>
            </Link>
          </div>
        );
      })}
      {ferramentas.map(id => {
        const tool = itemById[id]!;
        return (
          <Link key={id} to={`/catalogo/${id}`} className="ex-card">
            <span className="acc" style={{ background: color }} />
            <Field seed={tool.id} color={color} className="field-square" style={{ width: 40, flex: 'none' }} />
            <div style={{ minWidth: 0 }}>
              <h3>{itemText(t, id, 'title')}</h3>
              <p>{itemText(t, id, 'desc')}</p>
              <div className="meta">
                <span className="mini-tag">{t('train.toolTag')}</span>
                <span className="mini-tag">{t(tool.mobile ? 'common.mobile' : 'common.withInstrument')}</span>
                {estadoDe(tool.publicacao) === 'rascunho' && <span className="mini-tag">{t('review.draft')}</span>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * O catálogo por **porta** (decisão 20). É a entrada padrão: a pessoa chega com uma pergunta
 * ("quero melhorar o ouvido"), não com o nome de uma área do app.
 *
 * O mesmo item aparece atrás de várias portas, de propósito — `pauta-acorde` é leitura, harmonia e
 * teoria ao mesmo tempo, e obrigá-lo a escolher uma esconderia dois terços do que ele serve.
 */
function PorObjetivo({ mobileOnly, revisao, stats, aberto, alternar }: {
  mobileOnly: boolean; revisao: boolean; stats: Record<string, { attempts: number } | undefined>;
  aberto: string[]; alternar: (id: string) => void;
}) {
  const t = useT();
  const { PORTAS: portas, moduleById } = useContent();
  const navigate = useNavigate();
  return (
    <>
      {portas.map(porta => {
        if (porta.diagnostico) {
          // A nona entrada não é uma porta por objetivo: leva ao nivelamento (decisão 22), e por isso
          // é um cartão e não uma seção que abre.
          return (
            <section key={porta.id} className="sec mod">
              <h2 className="mod-h">
                <button type="button" className="mod-head" onClick={() => navigate('/comecar')}>
                  <span><span className="name">{porta.name}</span><span className="sub">{porta.apoio}</span></span>
                  <span className="chev" aria-hidden="true">→</span>
                </button>
              </h2>
            </section>
          );
        }
        const visiveis = itensDaPorta(porta, revisao).filter(id => !mobileOnly || itemById[id]?.mobile);
        if (visiveis.length === 0) return null;
        const exercicios = visiveis.filter(id => isSeries(itemById[id]!));
        const ferramentas = visiveis.filter(id => !isSeries(itemById[id]!));
        const isOpen = aberto.includes(porta.id);
        // a cor é a do módulo do primeiro item: a porta atravessa áreas, e não tem cor própria
        const color = moduleById[itemById[visiveis[0]]!.primaryModule].color;
        return (
          <section key={porta.id} id={`porta-${porta.id}`} className="sec mod">
            <h2 className="mod-h">
              <button type="button" className="mod-head" aria-expanded={isOpen} aria-controls={`porta-body-${porta.id}`} onClick={() => alternar(porta.id)}>
                <Field seed={porta.id} color={color} className="field-square" style={{ width: 44, flex: 'none' }} />
                <span><span className="name">{porta.name}</span><span className="sub">{porta.apoio}</span></span>
                <span className="count">{t('train.goalItems', { n: visiveis.length })}</span>
                <span className="chev" aria-hidden="true">{isOpen ? '\u2212' : '+'}</span>
              </button>
            </h2>
            {isOpen && (
              <div id={`porta-body-${porta.id}`} className="mod-body solo">
                <GradeDeItens exercicios={exercicios} ferramentas={ferramentas} color={color} stats={stats} />
              </div>
            )}
          </section>
        );
      })}
    </>
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
  const revisao = useRevisao();
  const item = itemById[id];
  if (!item) return <NotFound />;
  // Rascunho não abre para quem não está em modo de revisão, nem por endereço direto (decisão 91).
  if (!visivel(item.publicacao, revisao)) {
    return (
      <div className="panel" role="status" style={{ display: 'grid', gap: 8 }}>
        <b>{t('review.hiddenTitle')}</b>
        <span className="muted">{t('review.hiddenText')}</span>
        <div><Link to="/catalogo" className="eyebrow" style={{ textDecoration: 'none' }}>{t('train.back')}</Link></div>
      </div>
    );
  }

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
