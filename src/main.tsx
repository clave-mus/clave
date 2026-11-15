import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonte servida pelo próprio app, nunca por CDN: nada do uso vaza para terceiro.
import '@fontsource-variable/instrument-sans';
import './index.css';
import App from './App';
import { initAccount } from './state/account';
import { applyTheme, getState, rebuildStats } from './state/store';

// tema escolhido no perfil, antes do primeiro quadro, para não piscar o tema errado
applyTheme(getState().theme);
initAccount();
// os totais das telas são refeitos a partir do registro de tentativas
void rebuildStats();

/**
 * O service worker é o que faz o app abrir sem rede — e o Paulo estuda no ônibus.
 *
 * **Só em produção.** Em desenvolvimento ele interceptaria o servidor do Vite e brigaria com o
 * recarregamento a quente; e cachear o dev server é a melhor forma de passar uma tarde depurando
 * um arquivo que não existe mais.
 *
 * O registro é depois da pintura (`load`) para não disputar banda com o primeiro quadro, e falha em
 * silêncio: app sem cache funciona, só não funciona offline. A estratégia está em `public/sw.js`.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then(aquecerTelas).catch(() => { /* sem cache, e o app segue */ });
  });
}

/**
 * Aquece o cache com as telas que **baixam sob demanda**.
 *
 * Sem isto o offline tinha um buraco que só aparece no ônibus: `Ritmo.tsx` traz a VexFlow, 580 KB
 * num pedaço separado, e uma tela que a pessoa nunca abriu com rede vem **em branco** sem ela.
 * Verificado: depois de um recarregamento offline havia quatro coisas no cache, e nenhuma era um
 * pedaço de tela.
 *
 * A lista não é escrita à mão: sai do próprio catálogo (), que já declara `screen: () => import(...)`
 * para cada item de tela própria. Chamar o importador resolve o módulo, e o service worker guarda o
 * pedaço de passagem.
 *
 * Em `requestIdleCallback` e uma vez por carga: é banda gasta em casa para não faltar no ônibus, e
 * não disputa nada com o primeiro quadro. Falha em silêncio — quem não aqueceu só perde o offline
 * daquela tela.
 */
function aquecerTelas() {
  /**
   * `timeout` não é detalhe: sem ele, `requestIdleCallback` pode **nunca** disparar. Em aba oculta o
   * navegador não entrega ociosidade, e quem abre o app e começa a mexer na hora também não. Com o
   * teto, o aquecimento acontece em cinco segundos no pior caso.
   */
  const quando = window.requestIdleCallback
    ? (f: () => void) => window.requestIdleCallback(f, { timeout: 5000 })
    : (f: () => void) => window.setTimeout(f, 3000);
  quando(() => {
    void import('./catalog/ambientes').then(({ AMBIENTES }) => {
      for (const item of AMBIENTES) void item.screen?.().catch(() => { /* sem essa tela offline */ });
    }).catch(() => { /* nada a aquecer */ });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
