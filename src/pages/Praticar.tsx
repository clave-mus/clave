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
import { Link } from 'react-router-dom';
import { useContent } from '../data/localized';
import { itemById } from '../catalog';
import { useRevisao, useStore } from '../state/store';
import { visivel } from '../catalog/publicacao';
import { useGlobalParams } from '../catalog/params';
import { resumoDaConfiguracao, resumoDaPratica } from '../catalog/resumo';
import type { Ctx } from '../catalog/types';
import { removerEtapa } from '../routines/edicao';
import { useRotinas } from '../routines/hooks';
import { apagarRotina, gravarRotinas } from '../routines/storage';
import { Btn, Chip, SecTitle } from '../components/ui';
import { itemText, useLocale, useNaming, useT } from '../i18n';

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
                    <Btn small tone="ghost" onClick={() => setApagando(r.id)}>{t('routines.deleteRoutine')}</Btn>
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
                      const inst = e.instancias[0];
                      const item = itemById[inst.itemId];
                      if (!item) return null;
                      const title = itemText(t, item.id, 'title');
                      const resumo = [resumoDaPratica(inst.params, ctx), resumoDaConfiguracao(item, inst.settings, ctx)].filter(Boolean).join(' · ');
                      const mais = e.instancias.length > 1 ? ` +${e.instancias.length - 1}` : '';
                      return (
                        <div key={e.id} className="card-wrap">
                          {/* a configuração da etapa vai no state, não na URL: é dado da rotina da pessoa */}
                          <Link to={`/catalogo/${item.id}`} state={{ instancia: inst.settings, params: inst.params ?? {} }} className="ex-card">
                            <span className="acc" style={{ background: moduleById[item.primaryModule].color }} />
                            <span className="ex-card-text">
                              <b>{title}{mais}</b>
                              <small>{resumo || moduleById[item.primaryModule].name}</small>
                            </span>
                          </Link>
                          <button type="button" className="card-x" onClick={() => gravarRotinas(removerEtapa(rotinas, r.id, e.id))}
                            aria-label={t('routines.removeStep', { title })}>×</button>
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

      {rotinas.length === 0 && (
        <section className="sec">
          <SecTitle link={{ to: '/catalogo', label: t('home.seeAll') }}>{t('routines.yours')}</SecTitle>
          <div className="empty">
            <h3>{t('home.emptyTitle')}</h3>
            <p className="muted">{t('home.emptyText')}</p>
            <Btn to="/catalogo">{t('home.openCatalog')}</Btn>
          </div>
        </section>
      )}

      {escondidas > 0 && visiveis > 0 && (
        <p className="muted note-line">{t('home.hiddenByContext', { count: escondidas })}</p>
      )}
    </div>
  );
}
