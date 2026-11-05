// Praticar · a home (decisão 20b). Responde "o que eu estudo agora?" em um toque.
//
// Estado de transição: as ROTINAS são o corpo definitivo desta tela. Hoje ela lista as que a pessoa
// montou com "Salvar numa rotina" e deixa abrir cada etapa **com a configuração e a tonalidade que
// foram salvas** — mas ainda não EXECUTA a rotina (ordem, tempo por etapa, modo guiado): isso é a
// F3-2 e a F3-5. O arsenal (item guardado sem configuração) saiu (decisão 88): era uma rotina de
// uma etapa sem poder dizer o que a etapa fazia.
// O seletor de contexto tem dois estados aqui; os cinco contextos chegam com a F1-3, quando o
// catálogo passar a declarar requisitos em vez do `mobile: boolean` de hoje.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../data/localized';
import { EXERCISES, itemById } from '../catalog';
import { useRevisao, useStore } from '../state/store';
import { visivel } from '../catalog/publicacao';
import { CONTEXTOS, cabeNoContexto, porQueNaoCabe, type Contexto } from '../catalog/context';
import { useGlobalParams } from '../catalog/params';
import { resumoDaEtapa } from '../catalog/resumo';
import type { Ctx } from '../catalog/types';
import { resolverInstancia } from '../routines/ciclagem';
import { removerEtapa } from '../routines/edicao';
import { tempoTotal, type Etapa, type Rotina } from '../routines/types';
import { useRotinas } from '../routines/hooks';
import { apagarRotina, copiarRotina, gravarRotinas, novaRotina } from '../routines/storage';
import { ROTINAS_DO_TIME, rotinasDoTime } from '../routines/doTime';
import { Btn, Chip, SecTitle } from '../components/ui';
import { itemText, useLocale, useNaming, useT } from '../i18n';

/** O contexto e o "posso cantar" ficam lembrados neste navegador — é conveniência de tela, não perfil. */
const CTX_KEY = 'clave:contexto';
const SING_KEY = 'clave:posso-cantar';
const guardar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento: só não lembra */ } };
const lerContexto = (): Contexto => {
  try {
    const v = localStorage.getItem(CTX_KEY);
    return CONTEXTOS.includes(v as Contexto) ? (v as Contexto) : 'onibus';
  } catch { return 'onibus'; }
};
const lerCantar = () => { try { return localStorage.getItem(SING_KEY) === 'true'; } catch { return false; } };

/** A chave de i18n de cada contexto. Explícito, para o texto não depender do id. */
const nomeDoContexto: Record<Contexto, string> = {
  bolso: 'Bolso', onibus: 'Onibus', silencio: 'Silencio', instrumento: 'Instrumento',
};


export default function Praticar() {
  const profile = useStore(s => s.profile);
  const [contexto, setContexto] = useState<Contexto>(lerContexto);
  const [podeCantar, setPodeCantar] = useState(lerCantar);
  const trocarContexto = (c: Contexto) => { setContexto(c); guardar(CTX_KEY, c); };
  const trocarCantar = (v: boolean) => { setPodeCantar(v); guardar(SING_KEY, String(v)); };
  const t = useT();
  const { moduleById, MODULES } = useContent();
  const history = useStore(s => s.history);
  const revisao = useRevisao();
  const rotinas = useRotinas();
  const [apagando, setApagando] = useState<string | null>(null);
  const naming = useNaming();
  const locale = useLocale();
  const params = useGlobalParams();
  const ctx: Ctx = { naming, conv: locale, t, params };
  const navigate = useNavigate();

  /**
   * Abre uma etapa: **resolve o rodízio** antes de navegar (decisão 7).
   *
   * É por isso que é um botão e não um link: a etapa precisa escolher a instância da vez e **gravar
   * `ultimaUsada`** — se o rodízio reiniciasse a cada abertura, a pessoa cairia sempre na primeira, e o
   * rodízio não existiria na prática. (Era o que acontecia antes desta correção: o Praticar abria sempre
   * a instância 0.)
   */
  const abrirEtapa = (r: Rotina, e: Etapa) => {
    const { instancia, etapa } = resolverInstancia(e);
    gravarRotinas(rotinas.map(x => (x.id === r.id ? { ...x, etapas: x.etapas.map(y => (y.id === etapa.id ? etapa : y)) } : x)));
    const item = itemById[instancia.itemId];
    if (item) navigate(`/catalogo/${item.id}`, { state: { instancia: instancia.settings, params: instancia.params ?? {} } });
  };

  /** Cria uma rotina vazia e abre o editor — antes só dava para criar salvando um exercício. */
  const criarVazia = () => {
    const nova = novaRotina(t('routines.newName'));
    gravarRotinas([...rotinas, nova]);
    navigate(`/rotina/${nova.id}`);
  };

  /**
   * Adotar uma rotina do time **cria uma cópia da pessoa** (decisão 9): é a cópia que evolui, e a
   * original nunca muda. Depois de adotar, abre o editor — adotar é o começo de personalizar.
   */
  const adotar = (r: Rotina) => {
    const minha = copiarRotina(r, 'time');
    gravarRotinas([...rotinas, minha]);
    navigate(`/rotina/${minha.id}`);
  };

  /**
   * O card de descoberta: **um**, fora das rotinas, com o motivo explícito. **Não é sorteio** (F3-3).
   *
   * A regra é determinística e verificável: o primeiro módulo em que a pessoa **nunca** abriu nada,
   * e nele o primeiro item publicado que cabe no contexto de agora. Sem histórico naquele módulo não
   * há o que afirmar além de "você nunca abriu" — que é exatamente o que o texto diz, e nada mais.
   * Quando todos os módulos têm histórico, o card **não aparece**: inventar um motivo seria pior que
   * não sugerir nada.
   */
  const descoberta = useMemo(() => {
    const praticados = new Set(history.map(h => h.module));
    const modulo = MODULES.find(m => !praticados.has(m.id));
    if (!modulo) return null;
    const item = EXERCISES.find(i => i.primaryModule === modulo.id && visivel(i.publicacao, revisao) && cabeNoContexto(i, contexto, podeCantar));
    return item ? { item, modulo } : null;
  }, [history, MODULES, revisao, contexto, podeCantar]);

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'home.helloMorning' : hour < 19 ? 'home.helloAfternoon' : 'home.helloEvening';

  // O contexto filtra as ETAPAS, e a rotina continua sendo uma só: quem está sem o instrumento vê o
  // que dá para fazer agora, e é avisada do que ficou escondido.
  // Rascunho some da rotina de quem não está em modo de revisão (decisão 91) — e some ANTES do filtro
  // de contexto, para não ser contado como "escondido porque pede o instrumento", que não é verdade.
  // As rotinas do time passam pelo MESMO portão dos itens (decisão 91): as cinco são rascunho até o
  // Paulo revisá-las, e rascunho não aparece para quem usa.
  const doTime = rotinasDoTime(t).filter((_, n) => visivel(ROTINAS_DO_TIME[n].publicacao, revisao));
  const publicada = (itemId: string) => { const it = itemById[itemId]; return !!it && visivel(it.publicacao, revisao); };
  const etapasDe = (r: (typeof rotinas)[number]) => r.etapas.filter(e => publicada(e.instancias[0].itemId));
  const cabe = (itemId: string) => publicada(itemId) && cabeNoContexto(itemById[itemId]!, contexto, podeCantar);
  /** Por que esta etapa não cabe aqui — a tela diz o motivo em vez de só esconder (F3-3). */
  const motivo = (itemId: string) => {
    const it = itemById[itemId];
    if (!it) return null;
    const q = porQueNaoCabe(it, contexto, podeCantar);
    return q ? t(`home.why${q.charAt(0).toUpperCase()}${q.slice(1)}` as never) : null;
  };

  return (
    <div className="praticar">
      <section className="hero">
        <div className="hero-field" aria-hidden="true" />
        <div className="hero-in">
          <p className="eyebrow">{t('nav.practice')}</p>
          <h1>{t(hello)}{profile.name ? `, ${profile.name}` : ''}</h1>
          <p className="hero-sub">{t('home.pickContext')}</p>
          <div className="row" role="group" aria-label={t('home.context')} style={{ flexWrap: 'wrap' }}>
            {CONTEXTOS.map(c => (
              <Chip key={c} on={contexto === c} title={t(`home.ctx${nomeDoContexto[c]}Hint` as never)} onClick={() => trocarContexto(c)}>
                {t(`home.ctx${nomeDoContexto[c]}` as never)}
              </Chip>
            ))}
            {/* "Posso cantar" é ortogonal aos quatro: libera o que exige voz em qualquer um deles. */}
            <Chip on={podeCantar} onClick={() => trocarCantar(!podeCantar)}>{t('home.canSing')}</Chip>
          </div>
        </div>
      </section>

      {!profile.onboarded && (
        <section className="sec invite">
          <div>
            <h2>{t('home.firstTime')}</h2>
            <p>{t('home.firstTimeText')}</p>
          </div>
          <Btn to="/comecar">{t('common.start')}</Btn>
        </section>
      )}

      {/* P8: suas rotinas vêm antes das da comunidade — a do time só faz sentido como vitrine
          enquanto você não tem a sua; depois, ela já virou cópia e não precisa aparecer na frente. */}
      {rotinas.length > 0 && (
        <section className="sec">
          <SecTitle link={{ to: '/catalogo', label: t('home.seeAll') }}>{t('routines.yours')}</SecTitle>
          <div style={{ display: 'grid', gap: 16 }}>
            {rotinas.map(r => (
              <div key={r.id} className="panel" style={{ display: 'grid', gap: 12 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <b>{r.nome}</b>
                  {apagando === r.id ? (
                    <div className="row">
                      <span className="muted">{t('routines.deleteConfirm', { name: r.nome })}</span>
                      <Btn small tone="ghost" onClick={() => { apagarRotina(r.id); setApagando(null); }}>{t('routines.deleteRoutine')}</Btn>
                      <Btn small tone="mu" onClick={() => setApagando(null)}>{t('routines.cancel')}</Btn>
                    </div>
                  ) : (
                    <div className="row">
                      {etapasDe(r).length > 0 && <Btn small to={`/rotina/${r.id}/fazer`}>{t('session.start')}</Btn>}
                      <Btn small tone="ghost" to={`/rotina/${r.id}`}>{t('routines.edit')}</Btn>
                      <Btn small tone="ghost" onClick={() => setApagando(r.id)}>{t('routines.deleteRoutine')}</Btn>
                    </div>
                  )}
                </div>

                {etapasDe(r).length === 0 ? (
                  <p className="muted" style={{ margin: 0 }}>{t('routines.emptyRoutine')}</p>
                ) : etapasDe(r).every(e => !cabe(e.instancias[0].itemId)) ? (
                  <p className="muted" style={{ margin: 0 }}>{t('home.noneFitHere', { ctx: t(`home.ctx${nomeDoContexto[contexto]}` as never) })}</p>
                ) : (
                  <div className="grid cards">
                    {etapasDe(r).map(e => {
                      // Uma etapa pode ter várias instâncias (ela cicla); o botão de salvar só cria
                      // com uma. Mostra a primeira e conta as outras, para nada sumir em silêncio.
                      const item = itemById[e.instancias[0].itemId];
                      if (!item) return null;
                      // A linha diz O QUE varia, nunca um valor que mudaria a cada execução: mostrar a
                      // tonalidade da primeira variante mentiria em duas de três execuções.
                      const { titulo, detalhe } = resumoDaEtapa(e.instancias, id => itemById[id], ctx);
                      // Etapa que não cabe aparece ESMAECIDA COM O MOTIVO, nunca escondida (F3-3):
                      // esconder faria a rotina parecer menor do que é, e sem explicar por quê.
                      const naoCabe = motivo(e.instancias[0].itemId);
                      return (
                        <div key={e.id} className="card-wrap">
                          <button type="button" className="ex-card" style={{ textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer', opacity: naoCabe ? 0.45 : 1 }}
                            onClick={() => abrirEtapa(r, e)}>
                            <span className="acc" style={{ background: moduleById[item.primaryModule].color }} />
                            <span className="ex-card-text">
                              <b>{titulo}</b>
                              <small>{naoCabe ?? (detalhe || moduleById[item.primaryModule].name)}</small>
                            </span>
                          </button>
                          <button type="button" className="card-x" onClick={() => gravarRotinas(removerEtapa(rotinas, r.id, e.id))}
                            aria-label={t('routines.removeStep', { title: titulo })}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {doTime.length > 0 && (
        <section className="sec">
          <SecTitle>{t('doTime.title')}</SecTitle>
          <p className="muted" style={{ margin: '0 var(--gutter) 12px' }}>{t('doTime.sub')}</p>
          <div style={{ display: 'grid', gap: 12 }}>
            {doTime.map(r => {
              const total = tempoTotal(r);
              const adotada = rotinas.some(x => x.origem?.rotinaId === r.id);
              return (
                <div key={r.id} className="panel" style={{ display: 'grid', gap: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <b>{r.nome}</b>
                    <div className="row">
                      <Btn small to={`/rotina/${r.id}/fazer`}>{t('session.start')}</Btn>
                      {adotada
                        ? <span className="muted">{t('doTime.adopted')}</span>
                        : <Btn small tone="ghost" onClick={() => adotar(r)}>{t('doTime.adopt')}</Btn>}
                    </div>
                  </div>
                  <p className="muted" style={{ margin: 0 }}>{r.notas}</p>
                  <small className="muted">
                    {t('editor.itemsOf', { n: r.etapas.length })}
                    {total ? ` · ${t('editor.minutes', { n: Math.round(total / 60) })}` : ''}
                  </small>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {rotinas.length > 0 && (
        <div className="row" style={{ padding: '0 var(--gutter)' }}>
          <Btn small tone="ghost" onClick={criarVazia}>{t('routines.create')}</Btn>
        </div>
      )}

      {descoberta && (
        <section className="sec">
          <SecTitle>{t('home.discoverTitle')}</SecTitle>
          <div className="panel" style={{ display: 'grid', gap: 10 }}>
            <b>{itemText(t, descoberta.item.id, 'title')}</b>
            <p className="muted" style={{ margin: 0 }}>{itemText(t, descoberta.item.id, 'desc')}</p>
            <small className="muted">{t('home.discoverWhy', { area: descoberta.modulo.name })}</small>
            <div className="row">
              <Btn small tone="ghost" to={`/catalogo/${descoberta.item.id}`}>{t('home.discoverAdd')}</Btn>
            </div>
          </div>
        </section>
      )}

      {rotinas.length === 0 && (
        <section className="sec">
          <SecTitle>{t('routines.yours')}</SecTitle>
          <div className="empty">
            <h3>{t('home.emptyTitle')}</h3>
            <p className="muted">{t('home.emptyText')}</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Btn to="/catalogo">{t('home.openCatalog')}</Btn>
              <Btn tone="ghost" onClick={criarVazia}>{t('routines.create')}</Btn>
            </div>
          </div>
        </section>
      )}


    </div>
  );
}
