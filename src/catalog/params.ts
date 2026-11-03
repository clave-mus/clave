// Parâmetros globais: o contexto musical que vale para todos os exercícios (C1). Cada exercício lê
// daqui em vez de guardar a própria cópia, e as rotinas (D3) vão poder substituí-los por etapa.
import type { Voice } from '../audio/engine';
import { DEFAULT_PRESENTATION, type Presentation } from '../audio/presentation';
import type { Instrument } from '../data/modules';
import type { Clef } from '../theory/core';
import { useMemo } from 'react';
import { TUNINGS } from '../components/music/Fretboard';
import { useStore } from '../state/store';

/** Limites do volume dos exercícios, em múltiplos do padrão (1 = 100%). Acima de 1,25 o limitador do
 *  motor já corta os acordes mais cheios. */
export const VOLUME_RANGE = { min: 0.3, max: 1.25, step: 0.05 };

export interface GlobalParams {
  /** Instrumento da pessoa (do perfil). */
  instrument: Instrument;
  /** Afinação das cordas, em MIDI, da mais grave para a mais aguda. */
  tuning: readonly number[];
  /** Centro tonal: tônica (classe de altura) e modo. null = livre, cada pergunta sorteia. */
  key: { tonic: number; mode: 'maior' | 'menor' } | null;
  /** Região e extensão, em MIDI. */
  range: { lo: number; hi: number };
  /** Andamento, em bpm. */
  tempo: number;
  /** Material permitido: todas as notas ou só as da tonalidade. */
  material: 'cromatico' | 'diatonico';
  /** Clave de leitura. */
  clef: Clef;
  /** Timbre escolhido para cada instrumento. */
  timbres: Record<Instrument, Voice>;
  /** Volume dos exercícios com som, em múltiplos do padrão (1 = 100%, ver VOLUME_RANGE). */
  volume: number;
}

/** O que a pessoa escolheu (guardado no estado); o resto vem do padrão e do perfil. */
export type StoredParams = Partial<Omit<GlobalParams, 'instrument' | 'timbres'>> & { timbres?: Partial<Record<Instrument, Voice>> };

export const DEFAULT_PARAMS: Omit<GlobalParams, 'instrument' | 'tuning'> = {
  key: null,
  range: { lo: 48, hi: 72 },
  tempo: 80,
  material: 'cromatico',
  clef: 'sol',
  timbres: { piano: 'piano', violao: 'violao', baixo: 'baixo' },
  volume: 1,
};

export function defaultTuning(instrument: Instrument): readonly number[] {
  return instrument === 'baixo' ? TUNINGS.baixo : TUNINGS.violao;
}

export function resolveParams(instrument: Instrument, stored: StoredParams = {}): GlobalParams {
  return {
    ...DEFAULT_PARAMS,
    ...stored,
    timbres: { ...DEFAULT_PARAMS.timbres, ...stored.timbres },
    instrument,
    tuning: stored.tuning ?? defaultTuning(instrument),
  };
}

/** A camada global da apresentação: timbre do instrumento do som e volume geral. */
export function globalPresentation(p: GlobalParams, soundInstrument: Instrument = 'piano'): Partial<Presentation> {
  return { voice: p.timbres[soundInstrument], volume: p.volume * DEFAULT_PRESENTATION.volume };
}

/** Parâmetros globais da pessoa, resolvidos (o mesmo objeto enquanto nada muda). */
export function useGlobalParams(): GlobalParams {
  const instrument = useStore(s => s.profile.instrument);
  const stored = useStore(s => s.params);
  return useMemo(() => resolveParams(instrument, stored), [instrument, stored]);
}
