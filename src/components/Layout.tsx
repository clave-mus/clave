import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV } from './nav';
import { setRevisao, useRevisao } from '../state/store';
import { useT } from '../i18n';

const ICONS: Record<string, React.ReactNode> = {
  // onda de pulso: praticar
  praticar: <path d="M2,16 H7 L10,7 L15,25 L19,13 L22,16 H30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  // grade: catálogo
  catalogo: <g fill="currentColor"><rect x="4" y="4" width="10" height="10" rx="2.5" /><rect x="18" y="4" width="10" height="10" rx="2.5" /><rect x="4" y="18" width="10" height="10" rx="2.5" /><rect x="18" y="18" width="10" height="10" rx="2.5" /></g>,
  perfil: <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="16" cy="11" r="5.2" /><path d="M6,27 a10,10 0 0 1 20,0" /></g>,
};

export default function Layout() {
  const { pathname, search } = useLocation();
  const t = useT();
  const revisao = useRevisao();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  // `?revisao=1` liga o modo de revisão e `?revisao=0` desliga (decisão 91). Sem controle na tela, de
  // propósito: quem testa o beta não deve esbarrar nele.
  useEffect(() => {
    const v = new URLSearchParams(search).get('revisao');
    if (v === '1') setRevisao(true);
    else if (v === '0') setRevisao(false);
  }, [search]);
  return (
    <div className="shell">
      <header className="topbar">
        <div className="in">
          <Link to="/" className="brand" aria-label={t('nav.home')}>Clave</Link>
          <nav className="nav" aria-label={t('nav.main')}>
            {NAV.filter(n => n.icon !== 'perfil').map(n => <NavLink key={n.to} to={n.to} end={n.end}>{t(n.label)}</NavLink>)}
          </nav>
          <div className="right">
            <NavLink to="/perfil" className="nav-profile">{t('nav.profile')}</NavLink>
          </div>
        </div>
      </header>
      {revisao && (
        <div role="status" className="row" style={{ justifyContent: 'center', gap: 12, padding: '8px 16px', background: 'var(--accent-quiet)', color: 'var(--ink)' }}>
          <span>{t('review.banner')}</span>
          <button type="button" className="btn small ghost" onClick={() => setRevisao(false)}><span>{t('review.exit')}</span></button>
        </div>
      )}
      <main className="page"><Outlet /></main>
      <nav className="tabbar" aria-label={t('nav.main')}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <svg viewBox="0 0 32 32" aria-hidden="true">{ICONS[n.icon]}</svg>{t(n.label)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
