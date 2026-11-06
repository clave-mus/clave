// A ponte entre as rotinas (e os ciclos de rotinas) no disco e a tela.
import { useSyncExternalStore } from 'react';
import { aoMudarCiclos, aoMudarRotinas, CHAVE_CICLOS, CHAVE_ROTINAS, ciclosEstaveis, rotinasEstaveis } from './storage';
import type { Ciclo, Rotina } from './types';

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

function assinarCiclos(f: () => void): () => void {
  const parar = aoMudarCiclos(f);
  const dosOutros = (e: StorageEvent) => { if (e.key === CHAVE_CICLOS || e.key === null) f(); };
  window.addEventListener('storage', dosOutros);
  return () => { parar(); window.removeEventListener('storage', dosOutros); };
}

/** Os ciclos de rotinas da pessoa, sempre em dia com o disco. */
export function useCiclos(): Ciclo[] {
  return useSyncExternalStore(assinarCiclos, ciclosEstaveis, () => []);
}
