// Parâmetros musicais: o contexto que vale para todos os itens do catálogo.
//
// Eles chegam em CAMADAS (F2-1), e cada valor resolvido lembra DE ONDE veio. É isso que permite a
// tela escrever "Tonalidade: Dó maior (da rotina)" — sem a origem, a herança vira mágica e a
// pessoa não entende por que o exercício está em Dó.
//
//   1. item     o padrão do próprio item de catálogo
//   2. perfil   instrumento, afinação, timbres, volume — o que a pessoa escolheu uma vez
//   3. rotina   tonalidade, andamento, instrumento — herdado por todas as etapas
//   4. etapa    substituição explícita numa etapa só
//   5. agora    ajuste na hora, que não persiste
//
// A camada mais específica vence. Acrescentar um parâmetro novo aqui faz todo item respeitá-lo
// sem editar o catálogo — é o critério de pronto da F2-1.
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

// ===========================================================================
// A cascata (F2-1)
// ===========================================================================

/** De onde um valor veio. Na ordem de precedência: a última vence. */
export type Origin = 'item' | 'perfil' | 'rotina' | 'etapa' | 'agora';
export const ORIGENS: readonly Origin[] = ['item', 'perfil', 'rotina', 'etapa', 'agora'] as const;

/** O que uma camada pode declarar. `timbres` entra parcial porque se funde em vez de substituir. */
export type ValoresDeCamada = Partial<Omit<GlobalParams, 'timbres'>> & { timbres?: Partial<Record<Instrument, Voice>> };

export interface Camada {
  origin: Origin;
  values: ValoresDeCamada;
}

export interface Resolved<T> {
  value: T;
  origin: Origin;
}
export type ResolvedParams = { [K in keyof GlobalParams]: Resolved<GlobalParams[K]> };

/** O chão de tudo: o padrão do item, antes de qualquer escolha da pessoa. */
export const PARAMS_BASE: GlobalParams = {
  ...DEFAULT_PARAMS,
  instrument: 'violao',
  tuning: defaultTuning('violao'),
};

/**
 * Junta as camadas e devolve cada parâmetro com o valor e a origem.
 *
 * Duas regras que não são "a última vence":
 *
 * - **`timbres` se funde**, não substitui. Escolher o timbre do baixo numa rotina não pode apagar
 *   o timbre de piano que a pessoa escolheu no perfil.
 * - **`tuning` segue o `instrument`** quando ninguém a declarou explicitamente. Trocar de
 *   instrumento sem trocar de afinação deixaria o braço com as cordas erradas.
 */
export function resolveCamadas(camadas: Camada[]): ResolvedParams {
  const out = Object.fromEntries(
    (Object.keys(PARAMS_BASE) as (keyof GlobalParams)[]).map(k => [k, { value: PARAMS_BASE[k], origin: 'item' as Origin }]),
  ) as ResolvedParams;

  let tuningExplicita = false;
  const ordenadas = [...camadas].sort((a, b) => ORIGENS.indexOf(a.origin) - ORIGENS.indexOf(b.origin));

  for (const { origin, values } of ordenadas) {
    for (const [k, v] of Object.entries(values) as [keyof GlobalParams, unknown][]) {  // eslint-disable-line
      if (v === undefined) continue;
      if (k === 'timbres') {
        out.timbres = { value: { ...out.timbres.value, ...(v as Partial<Record<Instrument, Voice>>) }, origin };
        continue;
      }
      if (k === 'tuning') tuningExplicita = true;
      (out[k] as Resolved<unknown>) = { value: v, origin };
    }
  }

  if (!tuningExplicita) {
    out.tuning = { value: defaultTuning(out.instrument.value), origin: out.instrument.origin };
  }
  return out;
}

/** Só os valores, para quem não se importa de onde vieram. */
export function valoresDe(r: ResolvedParams): GlobalParams {
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, (v as Resolved<unknown>).value])) as unknown as GlobalParams;
}

/** A camada do perfil, a partir do que está guardado no estado. */
export function camadaDoPerfil(instrument: Instrument, stored: StoredParams = {}): Camada {
  return { origin: 'perfil', values: { ...stored, instrument } };
}

/** Veio de cima? É o que decide se a tela mostra "(da rotina)" ao lado do valor. */
export function herdado(r: ResolvedParams, key: keyof GlobalParams): boolean {
  return r[key].origin === 'rotina' || r[key].origin === 'etapa';
}
