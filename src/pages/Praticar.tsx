// Praticar · a home (decisão 20b). Responde "o que eu estudo agora?" em um toque.
//
// Estado de transição: as ROTINAS são o corpo definitivo desta tela. Hoje ela lista as que a pessoa
// montou com "Salvar numa rotina" e deixa abrir cada etapa **com a configuração e a tonalidade que
// foram salvas** — mas ainda não EXECUTA a rotina (ordem, tempo por etapa, modo guiado): isso é a
// F3-2 e a F3-5. O arsenal (item guardado sem configuração) saiu (decisão 88): era uma rotina de
// uma etapa sem poder dizer o que a etapa fazia.
// O seletor de contexto tem dois estados aqui; os cinco contextos chegam com a F1-3, quando o
// catálogo passar a declarar requisitos em vez do `mobile: boolean` de hoje.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../data/localized';
import { itemById } from '../catalog';
import { useRevisao, useStore } from '../state/store';
import { visivel } from '../catalog/publicacao';
import { useGlobalParams } from '../catalog/params';
import { resumoDaEtapa } from '../catalog/resumo';
import type { Ctx } from '../catalog/types';
import { resolverInstancia } from '../routines/ciclagem';
import { removerEtapa } from '../routines/edicao';
import type { Etapa, Rotina } from '../routines/types';
import { useRotinas } from '../routines/hooks';
import { apagarRotina, gravarRotinas, novaRotina } from '../routines/storage';
import { Btn, Chip, SecTitle } from '../components/ui';
import { useLocale, useNaming, useT } from '../i18n';

export default function Praticar() {
  const profile = useStore(s => s.profile);
  const [withInst, setWithInst] = useState(false);
  const t = useT();
  const { moduleById } = useContent();
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

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'home.helloMorning' : hour < 19 ? 'home.helloAfternoon' : 'home.helloEvening';

  // O contexto filtra as ETAPAS, e a rotina continua sendo uma só: quem está sem o instrumento vê o
  // que dá para fazer agora, e é avisada do que ficou escondido.
  // Rascunho some da rotina de quem não está em modo de revisão (decisão 91) — e some ANTES do filtro
  // de contexto, para não ser contado como "escondido porque pede o instrumento", que não é verdade.
  const revisao = useRevisao();
  const publicada = (itemId: string) => { const it = itemById[itemId]; return !!it && visivel(it.publicacao, revisao); };
  const etapasDe = (r: (typeof rotinas)[number]) => r.etapas.filter(e => publicada(e.instancias[0].itemId));
  const cabe = (itemId: string) => publicada(itemId) && (withInst || itemById[itemId]!.mobile);
  const totalEtapas = rotinas.reduce((n, r) => n + etapasDe(r).length, 0);
  const visiveis = rotinas.reduce((n, r) => n + etapasDe(r).filter(e => cabe(e.instancias[0].itemId)).length, 0);
  const escondidas = totalEtapas - visiveis;

  return (
    <div className="praticar">
      <section className="hero">
        <div className="hero-field" aria-hidden="true" />
        <div className="hero-in">
          <p className="eyebrow">{t('nav.practice')}</p>
          <h1>{t(hello)}{profile.name ? `, ${profile.name}` : ''}</h1>
          <p className="hero-sub">{t('home.pickContext')}</p>
          <div className="row" role="group" aria-label={t('home.context')}>
            <Chip on={!withInst} onClick={() => setWithInst(false)}>{t('home.noInstrument')}</Chip>
            <Chip on={withInst} onClick={() => setWithInst(true)}>{t('home.withInstrument')}</Chip>
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
                      <Btn small tone="ghost" to={`/rotina/${r.id}`}>{t('routines.edit')}</Btn>
                      <Btn small tone="ghost" onClick={() => setApagando(r.id)}>{t('routines.deleteRoutine')}</Btn>
                    </div>
                  )}
                </div>

                {etapasDe(r).length === 0 ? (
                  <p className="muted" style={{ margin: 0 }}>{t('routines.emptyRoutine')}</p>
                ) : etapasDe(r).every(e => !cabe(e.instancias[0].itemId)) ? (
                  <p className="muted" style={{ margin: 0 }}>{t('home.noneFitText')}</p>
                ) : (
                  <div className="grid cards">
                    {etapasDe(r).filter(e => cabe(e.instancias[0].itemId)).map(e => {
                      // Uma etapa pode ter várias instâncias (ela cicla); o botão de salvar só cria
                      // com uma. Mostra a primeira e conta as outras, para nada sumir em silêncio.
                      const item = itemById[e.instancias[0].itemId];
                      if (!item) return null;
                      // A linha diz O QUE varia, nunca um valor que mudaria a cada execução: mostrar a
                      // tonalidade da primeira variante mentiria em duas de três execuções.
                      const { titulo, detalhe } = resumoDaEtapa(e.instancias, id => itemById[id], ctx);
                      return (
                        <div key={e.id} className="card-wrap">
                          <button type="button" className="ex-card" style={{ textAlign: 'left', border: 0, font: 'inherit', cursor: 'pointer' }}
                            onClick={() => abrirEtapa(r, e)}>
                            <span className="acc" style={{ background: moduleById[item.primaryModule].color }} />
                            <span className="ex-card-text">
                              <b>{titulo}</b>
                              <small>{detalhe || moduleById[item.primaryModule].name}</small>
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

      {rotinas.length > 0 && (
        <div className="row" style={{ padding: '0 var(--gutter)' }}>
          <Btn small tone="ghost" onClick={criarVazia}>{t('routines.create')}</Btn>
        </div>
      )}

      {rotinas.length === 0 && (
        <section className="sec">
          <SecTitle link={{ to: '/catalogo', label: t('home.seeAll') }}>{t('routines.yours')}</SecTitle>
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

      {escondidas > 0 && visiveis > 0 && (
        <p className="muted note-line">{t('home.hiddenByContext', { count: escondidas })}</p>
      )}
    </div>
  );
}
