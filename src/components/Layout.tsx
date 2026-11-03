import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV } from './nav';
import { useT } from '../i18n';

const ICONS: Record<string, React.ReactNode> = {
  // onda de pulso: praticar
  praticar: <path d="M2,16 H7 L10,7 L15,25 L19,13 L22,16 H30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />,
  // grade: catálogo
  catalogo: <g fill="currentColor"><rect x="4" y="4" width="10" height="10" rx="2.5" /><rect x="18" y="4" width="10" height="10" rx="2.5" /><rect x="4" y="18" width="10" height="10" rx="2.5" /><rect x="18" y="18" width="10" height="10" rx="2.5" /></g>,
  perfil: <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="16" cy="11" r="5.2" /><path d="M6,27 a10,10 0 0 1 20,0" /></g>,
};

export default function Layout() {
  const { pathname } = useLocation();
  const t = useT();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
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
