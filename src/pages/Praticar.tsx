// Praticar · a home (decisão 20b). Responde "o que eu estudo agora?" em um toque.
//
// Estado de transição: as ROTINAS, que são o corpo definitivo desta tela, são a frente F3.
// Até lá, a tela mostra os itens que a pessoa guardou, já configurados, que é o mesmo papel que a
// rotina em modo livre vai cumprir (decisão 4).
// O seletor de contexto tem dois estados aqui; os cinco contextos chegam com a F1-3, quando o
// catálogo passar a declarar requisitos em vez do `mobile: boolean` de hoje.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../data/localized';
import { itemById } from '../catalog';
import { toggleArsenal, useStore } from '../state/store';
import { Btn, Chip, SecTitle } from '../components/ui';
import { itemText, useT } from '../i18n';

export default function Praticar() {
  const profile = useStore(s => s.profile);
  const saved = useStore(s => s.arsenal);
  const [withInst, setWithInst] = useState(false);
  const t = useT();
  const { moduleById } = useContent();

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
