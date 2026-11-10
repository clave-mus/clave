// Parâmetros musicais: o contexto que vale para todos os itens do catálogo.
//
// Eles chegam em CAMADAS (F2-1), e cada valor resolvido lembra DE ONDE veio. É isso que permite a
// tela escrever "Tonalidade: Dó maior (da rotina)" — sem a origem, a herança vira mágica e a
// pessoa não entende por que o exercício está em Dó.
//
//   1. item     o padrão do próprio item de catálogo
//   2. perfil   QUEM a pessoa é: instrumento, afinação, timbres, volume — escolhido uma vez
//   3. rotina   o que se pratica: tonalidade, região, material — herdado por todas as etapas
//   4. etapa    substituição explícita numa etapa só
//   5. agora    o que a pessoa escolheu NESTE exercício, lembrado por item
//
// Tonalidade, região, material e clave **não têm camada de perfil** (decisão 87): trocam toda
// semana, e morar no perfil os deixava fora de tudo que se salva numa rotina.
//
// A camada mais específica vence. Acrescentar um parâmetro novo aqui faz todo item respeitá-lo
// sem editar o catálogo — é o critério de pronto da F2-1.
import type { Voice } from '../audio/engine';
import { DEFAULT_PRESENTATION, type Presentation } from '../audio/presentation';
import type { Instrument } from '../data/modules';
import type { Clef } from '../theory/core';
import { useCallback, useMemo, useState } from 'react';
import { TUNINGS } from '../components/music/Fretboard';
import { limparPratica, setPratica, useStore } from '../state/store';

/** Limites do volume dos exercícios, em múltiplos do padrão (1 = 100%). Acima de 1,25 o limitador do
 *  motor já corta os acordes mais cheios. */
export const VOLUME_RANGE = { min: 0.3, max: 1.25, step: 0.05 };

/**
 * Os parâmetros que um item lê, já resolvidos. O nome ficou de quando eram todos "globais" — e foi
 * esse o erro: **dois tipos de coisa moravam aqui, e só um deles é do perfil.**
 *
 * **Do perfil — quem a pessoa é.** Mudam raramente e valem para tudo: `instrument`, `tuning`,
 * `timbres`, `volume`.
 *
 * **De prática — o que ela está praticando agora.** Mudam por exercício, por rotina, por semana:
 * `key`, `range`, `material`. Vêm do item, da rotina, da etapa ou do "agora" — **nunca do perfil**
 * (decisão 87). Ver `ParametrosDePratica`.
 *
 * `clef` é um resíduo: nenhum item a lê — todos os de pauta têm a configuração `claves`, e só caem
 * nesta quando a pessoa desmarca todas. Não é do perfil nem de prática, e não tem controle na tela.
 *
 * `tempo` não existe mais aqui: nenhuma tela o lia (cada ferramenta tem o seu `bpm`), e ele ia para
 * o histórico como se fosse o andamento praticado — o Progresso mostrava "80 bpm" até em exercício
 * de ouvido, que não tem andamento.
 */
export interface GlobalParams {
  /** Instrumento da pessoa (do perfil). */
  instrument: Instrument;
  /** Afinação das cordas, em MIDI, da mais grave para a mais aguda. */
  tuning: readonly number[];
  /** Centro tonal: tônica (classe de altura) e modo. null = livre, cada pergunta sorteia. */
  key: { tonic: number; mode: 'maior' | 'menor' } | null;
  /** Região em que o exercício toca, em MIDI. É região de PRÁTICA, não a extensão da voz da pessoa. */
  range: { lo: number; hi: number };
  /** Material permitido: todas as notas ou só as da tonalidade. */
  material: 'cromatico' | 'diatonico';
  /** Clave de leitura: só vale quando o item não tem `claves` escolhida — ver acima. */
  clef: Clef;
  /** Timbre escolhido para cada instrumento. */
  timbres: Record<Instrument, Voice>;
  /** Volume dos exercícios com som, em múltiplos do padrão (1 = 100%, ver VOLUME_RANGE). */
  volume: number;
}

/** O que muda de exercício para exercício. Nunca mora no perfil (decisão 87). */
export const PARAMETROS_DE_PRATICA = ['key', 'range', 'material'] as const;
export type ParametroDePratica = (typeof PARAMETROS_DE_PRATICA)[number];
export type ParametrosDePratica = Partial<Pick<GlobalParams, ParametroDePratica>>;

/** O que o perfil guarda: só o que é da pessoa, não do exercício. */
export type PerfilGuardado = Partial<Pick<GlobalParams, 'tuning' | 'volume'>> & { timbres?: Partial<Record<Instrument, Voice>> };

/**
 * Valores que uma camada qualquer pode trazer. É largo de propósito — `resolveParams` o aceita para
 * qualquer camada, e os testes montam contextos com ele. Quem GUARDA no perfil usa `PerfilGuardado`.
 */
export type StoredParams = Partial<Omit<GlobalParams, 'instrument' | 'timbres'>> & { timbres?: Partial<Record<Instrument, Voice>> };

export const DEFAULT_PARAMS: Omit<GlobalParams, 'instrument' | 'tuning'> = {
  key: null,
  range: { lo: 48, hi: 72 },
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

/**
 * Só o que é DA PESSOA, resolvido (o mesmo objeto enquanto nada muda). Serve a quem não depende do
 * exercício — o painel de som, uma ferramenta que só precisa do timbre.
 *
 * Os campos de prática (`key`, `range`, `material`, `clef`) vêm aqui com o padrão e **não devem ser
 * lidos daqui**: o exercício os resolve em `useParamsDoItem`, com a camada de prática por cima.
 */
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

/**
 * Os parâmetros de UM exercício: o perfil por baixo, e a prática dele por cima.
 *
 * `daEtapa` é o que veio de uma etapa de rotina ao abrir o item. Enquanto a pessoa não mexer, é ele
 * que vale; ao mexer, a mudança fica local e **nem a prática guardada do item nem a da etapa é
 * tocada** — a mesma regra das configurações.
 */
export function useParamsDoItem(itemId: string, daEtapa?: ParametrosDePratica | null, doItem?: ParametrosDePratica) {
  const instrument = useStore(s => s.profile.instrument);
  const perfil = useStore(s => s.params);
  const guardada = useStore(s => s.pratica[itemId]);
  const [local, setLocal] = useState<ParametrosDePratica | null>(daEtapa ?? null);

  // `doItem` é a entrada do item (o primeiro preset), e fica **embaixo** de tudo que a pessoa
  // escolheu: etapa de rotina primeiro, depois o que ela guardou neste item, e só então o atalho.
  const pratica: ParametrosDePratica = local ?? guardada ?? doItem ?? SEM_PRATICA;
  const params = useMemo(() => valoresDe(resolveCamadas([
    camadaDoPerfil(instrument, perfil),
    { origin: local ? 'etapa' : 'agora', values: pratica },
  ])), [instrument, perfil, local, pratica]);

  const mudar = useCallback((patch: ParametrosDePratica) => {
    if (local) setLocal({ ...local, ...patch });
    else setPratica(itemId, patch);
  }, [local, itemId]);

  /** Desfaz as escolhas: volta ao que o item faz sem ninguém ter mexido. */
  const limpar = useCallback(() => {
    if (local) setLocal({});
    else limparPratica(itemId);
  }, [local, itemId]);

  return { params, pratica, mudar, limpar };
}

/** Referência estável para "nada escolhido" — um `{}` novo a cada render quebraria o `useMemo`. */
const SEM_PRATICA: ParametrosDePratica = {};
