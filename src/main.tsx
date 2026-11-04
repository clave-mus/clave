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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
