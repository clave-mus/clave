// A ponte entre as rotinas no disco e a tela.
import { useSyncExternalStore } from 'react';
import { aoMudarRotinas, CHAVE_ROTINAS, rotinasEstaveis } from './storage';
import type { Rotina } from './types';

function assinar(f: () => void): () => void {
  const parar = aoMudarRotinas(f);
  // outra aba do navegador mexeu nas rotinas: o evento só dispara nas OUTRAS abas
  const dosOutros = (e: StorageEvent) => { if (e.key === CHAVE_ROTINAS || e.key === null) f(); };
  window.addEventListener('storage', dosOutros);
  return () => { parar(); window.removeEventListener('storage', dosOutros); };
}

/** As rotinas da pessoa, sempre em dia com o disco. */
export function useRotinas(): Rotina[] {
  return useSyncExternalStore(assinar, rotinasEstaveis, () => []);
}
