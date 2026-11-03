// Praticar · a home (decisão 20b). Responde "o que eu estudo agora?" em um toque.
//
// Estado de transição: as ROTINAS são o corpo definitivo desta tela. Hoje ela lista as que a pessoa
// montou com "Salvar numa rotina" e deixa abrir cada etapa **com a configuração que foi salva** — mas
// ainda não EXECUTA a rotina (ordem, tempo por etapa, modo guiado): isso é a F3-2 e a F3-5.
// Os itens guardados continuam abaixo, que é o mesmo papel que a rotina em modo livre vai cumprir
// (decisão 4).
// O seletor de contexto tem dois estados aqui; os cinco contextos chegam com a F1-3, quando o
// catálogo passar a declarar requisitos em vez do `mobile: boolean` de hoje.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../data/localized';
import { itemById } from '../catalog';
import { toggleArsenal, useStore } from '../state/store';
import { useGlobalParams } from '../catalog/params';
import { resumoDaConfiguracao } from '../catalog/resumo';
import type { Ctx } from '../catalog/types';
import { removerEtapa } from '../routines/edicao';
import { useRotinas } from '../routines/hooks';
import { apagarRotina, gravarRotinas } from '../routines/storage';
import { Btn, Chip, SecTitle } from '../components/ui';
import { itemText, useLocale, useNaming, useT } from '../i18n';

export default function Praticar() {
  const profile = useStore(s => s.profile);
  const saved = useStore(s => s.arsenal);
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

  const items = saved
    .map(id => ({ id, item: itemById[id] }))
    .filter((x): x is { id: string; item: NonNullable<typeof x.item> } => !!x.item)
    .filter(({ item }) => withInst || item.mobile);
  const hidden = saved.length - items.length;

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
          <SecTitle>{t('routines.yours')}</SecTitle>
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

                {r.etapas.length === 0 ? (
                  <p className="muted" style={{ margin: 0 }}>{t('routines.emptyRoutine')}</p>
                ) : (
                  <div className="grid cards">
                    {r.etapas.map(e => {
                      // Uma etapa pode ter várias instâncias (ela cicla); o botão de salvar só cria
                      // com uma. Mostra a primeira e conta as outras, para nada sumir em silêncio.
                      const inst = e.instancias[0];
                      const item = itemById[inst.itemId];
                      if (!item) return null;
                      const title = itemText(t, item.id, 'title');
                      const resumo = resumoDaConfiguracao(item, inst.settings, ctx);
                      const mais = e.instancias.length > 1 ? ` +${e.instancias.length - 1}` : '';
                      return (
                        <div key={e.id} className="card-wrap">
                          {/* a configuração da etapa vai no state, não na URL: é dado da rotina da pessoa */}
                          <Link to={`/catalogo/${item.id}`} state={{ instancia: inst.settings }} className="ex-card">
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

      <section className="sec">
        <SecTitle link={{ to: '/catalogo', label: t('home.seeAll') }}>{t('home.saved')}</SecTitle>

        {items.length === 0 ? (
          <div className="empty">
            <h3>{saved.length ? t('home.noneFitTitle') : t('home.emptyTitle')}</h3>
            <p className="muted">{saved.length ? t('home.noneFitText') : t('home.emptyText')}</p>
            <Btn to="/catalogo">{t('home.openCatalog')}</Btn>
          </div>
        ) : (
          <div className="grid cards">
            {items.map(({ id, item }) => {
              const title = itemText(t, id, 'title');
              return (
                <div key={id} className="card-wrap">
                  <Link to={`/catalogo/${id}`} className="ex-card">
                    <span className="acc" style={{ background: moduleById[item.primaryModule].color }} />
                    <span className="ex-card-text">
                      <b>{title}</b>
                      <small>{moduleById[item.primaryModule].name}</small>
                    </span>
                  </Link>
                  <button type="button" className="card-x" onClick={() => toggleArsenal(id)} aria-label={t('home.removeSaved', { title })}>×</button>
                </div>
              );
            })}
            <Link to="/catalogo" className="ex-card add">{t('home.addExercise')}</Link>
          </div>
        )}

        {hidden > 0 && items.length > 0 && (
          <p className="muted note-line">{t('home.hiddenByContext', { count: hidden })}</p>
        )}
      </section>
    </div>
  );
}
