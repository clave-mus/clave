import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { REDIRECTS, reescreverRotaLegada } from './components/nav';
import Praticar from './pages/Praticar';
import Onboarding from './pages/Onboarding';
import Editor from './pages/Editor';
import Sessao from './pages/Sessao';
import CicloEditor from './pages/CicloEditor';
import Ciclo from './pages/Ciclo';
import Recebida from './pages/Recebida';
import Perfil from './pages/Perfil';
import Progresso from './pages/Progresso';
import Treinar, { ItemPage } from './pages/Treinar';
import NotFound from './pages/NotFound';
import { localeTag, useLocale } from './i18n';

export default function App() {
  const locale = useLocale();
  useEffect(() => { document.documentElement.lang = localeTag(locale); }, [locale]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/comecar" element={<Onboarding />} />
        <Route element={<Layout />}>
          <Route index element={<Praticar />} />
          <Route path="catalogo" element={<Treinar />} />
          <Route path="catalogo/:id" element={<ItemPage />} />
          {/* Aulas saiu do app (revisão de 04/11, P7); endereços antigos ainda caem de pé. */}
          <Route path="estudar/*" element={<Navigate to="/catalogo" replace />} />
          <Route path="rotina/:id" element={<Editor />} />
          <Route path="rotina/:id/fazer" element={<Sessao />} />
          <Route path="ciclo/:id" element={<CicloEditor />} />
          <Route path="ciclo/:id/fazer" element={<Ciclo />} />
          {/* Rotina que chegou por link (decisão 23). Não pede conta. */}
          <Route path="r/:dados" element={<Recebida />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="perfil/historico" element={<Progresso />} />
          {/* Endereços antigos que ainda chegam de link salvo (src/components/nav.ts). */}
          {Object.entries(REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from.slice(1)} element={<Navigate to={to} replace />} />
          ))}
          <Route path="treinar/:id" element={<RedirectItem from="/treinar/" />} />
          <Route path="ferramentas/:id" element={<RedirectItem from="/ferramentas/" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

/** /treinar/:id e /ferramentas/:id viraram /catalogo/:id — exercício e ferramenta são o mesmo
 *  tipo de item desde a F1-1 (decisão 17), então a rota também é uma só. */
function RedirectItem({ from }: { from: string }) {
  return <Navigate to={reescreverRotaLegada(window.location, from)} replace />;
}
