// A ordenação do ciclo de rotinas (P9): sempre a mais antiga sem praticar primeiro.
//
// Função pura, sem tela — é a tela (`pages/Ciclo.tsx`) que decide o que fazer com a ordem, não o
// contrário. "Fechar uma etapa reordena" é consequência direta de `Rotina.ultimaPraticaEm` mudar
// e esta função ser chamada de novo; não há estado próprio do ciclo sobre isso.
import type { Rotina } from './types';

/** As rotinas do ciclo, da mais antiga sem praticar para a mais recente. Nunca praticada vem primeiro. */
export function ordenarPorAntiguidade(rotinas: readonly Rotina[]): Rotina[] {
  return [...rotinas].sort((a, b) => (a.ultimaPraticaEm ?? 0) - (b.ultimaPraticaEm ?? 0));
}
