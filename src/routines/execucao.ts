// Executor de rotinas: a lógica (F3-2, F3-3 e F3-4). Nada aqui conhece React.
//
// A tela é `pages/Sessao.tsx`. Este módulo responde às perguntas que a tela não deve responder:
// em que etapa estou, quanto tempo cada uma levou, o que já visitei, o que concluí, e o que fazer
// quando a rotina aponta para um item que não existe mais.
//
// **Três propriedades que o desenho precisa ter, e que estão travadas em teste:**
//
//   1. A ORDEM é resolvida ao COMEÇAR e guardada. Se `embaralhar` fosse aplicado a cada render, a
//      lista mudaria debaixo da pessoa. Pela mesma razão, o rodízio resolve uma instância por etapa
//      ao começar, e `ultimaUsada` é gravado na rotina (decisão 7).
//   2. O TEMPO é por etapa e CRESCENTE. Passar do sugerido **informa e não faz mais nada**: não
//      avança, não bloqueia, não esconde nada (decisão 4).
//   3. NADA é obrigatório. Pular, voltar, saltar e sair são todos legítimos, e o resumo final conta
//      o que aconteceu sem nota, sem percentual e sem celebração.
import { ordemDasEtapas, resolverInstancia } from './ciclagem';
import type { Etapa, Rotina, SessaoDeRotina } from './types';

/** Como uma etapa terminou. `pulada` é um resultado legítimo, não uma falha. */
export type Desfecho = 'concluida' | 'pulada';

/**
 * A execução em andamento.
 *
 * Estende `SessaoDeRotina` com o que a F3-2 pediu e o modelo da F3-1 não tinha: a **ordem** (porque
 * embaralhar não pode ser recalculado) e os **desfechos** (porque o resumo final precisa distinguir
 * "fiz" de "passei por").
 */
export interface Execucao extends SessaoDeRotina {
  /** Ids das etapas na ordem desta execução. Resolvida uma vez, em `comecar`. */
  ordem: string[];
  desfechos: Record<string, Desfecho>;
  /** Quando a pessoa pausou, em ms. Ausente quando está correndo. */
  pausadaEm?: number;
}

const idDeSessao = () =>
  (globalThis.crypto?.randomUUID?.() ?? `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

/**
 * Começa uma execução: resolve a ordem e o rodízio, e devolve **a sessão e a rotina atualizada**.
 *
 * A rotina volta alterada porque o rodízio grava `ultimaUsada` nela — se isso não persistisse, a
 * pessoa cairia sempre na primeira instância e o rodízio não existiria na prática.
 */
export function comecar(r: Rotina, agora = Date.now(), random = Math.random): { sessao: Execucao; rotina: Rotina } {
  const etapas = ordemDasEtapas(r.etapas, r.embaralhar, random);
  const resolvidas: Record<string, number> = {};
  const atualizadas = new Map<string, Etapa>();
  for (const e of etapas) {
    const { etapa, indice } = resolverInstancia(e, random);
    resolvidas[e.id] = indice;
    atualizadas.set(e.id, etapa);
  }
  return {
    sessao: {
      rotinaId: r.id,
      comecouEm: agora,
      etapaAtual: etapas[0]?.id ?? '',
      ordem: etapas.map(e => e.id),
      tempoPorEtapa: {},
      desfechos: {},
      pausada: false,
      resolvidas,
      sessaoId: idDeSessao(),
    },
    // a ordem da rotina NÃO muda: embaralhar é da execução, não do objeto guardado
    rotina: { ...r, etapas: r.etapas.map(e => atualizadas.get(e.id) ?? e) },
  };
}

/** Em que posição da ordem a execução está. `-1` se a etapa atual não está mais na rotina. */
export const posicao = (s: Execucao) => s.ordem.indexOf(s.etapaAtual);

export const etapaAtual = (s: Execucao, r: Rotina): Etapa | undefined => r.etapas.find(e => e.id === s.etapaAtual);

/** A instância que esta execução resolveu para a etapa. */
export function instanciaDaVez(s: Execucao, e: Etapa) {
  const i = s.resolvidas[e.id] ?? 0;
  return e.instancias[i] ?? e.instancias[0];
}

/**
 * Troca a instância da etapa atual **nesta execução** (o botão "trocar" da F3-4).
 *
 * Grava na rotina também, porque `ultimaUsada` é o que faz o rodízio avançar na próxima vez.
 */
export function trocar(s: Execucao, r: Rotina, random = Math.random): { sessao: Execucao; rotina: Rotina } {
  const atual = etapaAtual(s, r);
  if (!atual || atual.instancias.length < 2) return { sessao: s, rotina: r };
  const { etapa, indice } = resolverInstancia(
    { ...atual, ultimaUsada: s.resolvidas[atual.id] ?? atual.ultimaUsada },
    random,
  );
  return {
    sessao: { ...s, resolvidas: { ...s.resolvidas, [atual.id]: indice } },
    rotina: { ...r, etapas: r.etapas.map(e => (e.id === etapa.id ? etapa : e)) },
  };
}

// ---------------------------------------------------------------------------
// Navegação — toda manual, de propósito (decisão 4)
// ---------------------------------------------------------------------------

const irPara = (s: Execucao, n: number): Execucao =>
  n < 0 || n >= s.ordem.length ? s : { ...s, etapaAtual: s.ordem[n] };

/** Avança registrando o desfecho. Sem desfecho, é um pulo — e pulo é resultado legítimo. */
export function avancar(s: Execucao, desfecho: Desfecho = 'pulada'): Execucao {
  const marcada: Execucao = { ...s, desfechos: { ...s.desfechos, [s.etapaAtual]: desfecho } };
  const n = posicao(s);
  // na última etapa, avançar TERMINA: `etapaAtual` vazio é o sinal de fim
  return n === s.ordem.length - 1 ? { ...marcada, etapaAtual: '' } : irPara(marcada, n + 1);
}

/** Volta uma etapa. **Não apaga o desfecho nem o tempo** — refazer soma, não zera. */
export const voltar = (s: Execucao): Execucao => irPara(s, posicao(s) - 1);

export const saltarPara = (s: Execucao, etapaId: string): Execucao =>
  s.ordem.includes(etapaId) ? { ...s, etapaAtual: etapaId } : s;

export const terminou = (s: Execucao) => s.etapaAtual === '';

// ---------------------------------------------------------------------------
// Tempo
// ---------------------------------------------------------------------------

/** Soma segundos na etapa atual. Pausada, não soma — é o que a pausa quer dizer. */
export function tiquetaque(s: Execucao, segundos = 1): Execucao {
  if (s.pausada || terminou(s)) return s;
  return { ...s, tempoPorEtapa: { ...s.tempoPorEtapa, [s.etapaAtual]: (s.tempoPorEtapa[s.etapaAtual] ?? 0) + segundos } };
}

export const pausar = (s: Execucao, agora = Date.now()): Execucao => ({ ...s, pausada: true, pausadaEm: agora });
export const retomar = (s: Execucao): Execucao => ({ ...s, pausada: false, pausadaEm: undefined });

export const segundosNaEtapa = (s: Execucao, etapaId: string) => s.tempoPorEtapa[etapaId] ?? 0;
export const segundosTotais = (s: Execucao) => Object.values(s.tempoPorEtapa).reduce((a, b) => a + b, 0);

/**
 * Passou do tempo sugerido?
 *
 * Só **informa**. Etapa sem tempo sugerido nunca passa — e no modo livre nenhuma tem, porque somar
 * tempo de rotina livre seria mentira.
 */
export function passouDoSugerido(s: Execucao, e: Etapa): boolean {
  return !!e.segundosSugeridos && segundosNaEtapa(s, e.id) >= e.segundosSugeridos;
}

// ---------------------------------------------------------------------------
// Retomada
// ---------------------------------------------------------------------------

/**
 * A sessão guardada ainda serve?
 *
 * Não serve se a rotina foi apagada, se terminou, ou se **nenhuma** das etapas da ordem existe mais
 * (a pessoa esvaziou a rotina no editor). Com a ordem parcialmente válida, serve: a execução segue
 * pelas que sobraram, que é melhor que jogar fora o tempo já praticado.
 */
export function retomavel(s: Execucao | null, rotinas: readonly Rotina[]): Rotina | null {
  if (!s || terminou(s)) return null;
  const r = rotinas.find(x => x.id === s.rotinaId);
  if (!r) return null;
  return s.ordem.some(id => r.etapas.some(e => e.id === id)) ? r : null;
}

/**
 * Tira da ordem as etapas que não existem mais, e reposiciona se a atual era uma delas.
 *
 * É o caminho de "a pessoa editou a rotina no meio da execução". Sem isto, a tela ficaria presa numa
 * etapa fantasma — que é exatamente o "falhar em silêncio" que a tarefa proíbe.
 */
export function sanear(s: Execucao, r: Rotina): Execucao {
  const vivas = s.ordem.filter(id => r.etapas.some(e => e.id === id));
  if (vivas.length === s.ordem.length) return s;
  const atual = vivas.includes(s.etapaAtual) ? s.etapaAtual : (vivas[0] ?? '');
  return { ...s, ordem: vivas, etapaAtual: atual };
}

// ---------------------------------------------------------------------------
// Item que sumiu
// ---------------------------------------------------------------------------

export interface Problema {
  etapaId: string;
  itemId: string;
  /** Companheiro de grupo que pode servir no lugar. Vazio quando não há nenhum a oferecer. */
  substitutos: string[];
}

/**
 * Etapas que apontam para item inexistente, com substituto quando há.
 *
 * O substituto é **oferta, nunca troca automática**: a decisão 7 diz que o app entrega o que a
 * pessoa pôs ali. Mas sumir em silêncio é pior que oferecer.
 */
export function problemasDa(
  r: Rotina,
  existe: (itemId: string) => boolean,
  companheiros: (itemId: string) => string[] = () => [],
): Problema[] {
  const out: Problema[] = [];
  for (const e of r.etapas) {
    for (const i of e.instancias) {
      if (existe(i.itemId)) continue;
      out.push({ etapaId: e.id, itemId: i.itemId, substitutos: companheiros(i.itemId).filter(existe) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Resumo final
// ---------------------------------------------------------------------------

/**
 * O que aconteceu. **Sem nota, sem percentual, sem celebração** — é o que a F3-2 proíbe
 * explicitamente, e é coerente com a lista do que nunca entra.
 */
export interface Resumo {
  segundos: number;
  visitadas: number;
  concluidas: number;
  puladas: number;
  /** Etapas da ordem em que a pessoa não chegou a pôr o pé. */
  naoVisitadas: number;
}

export function resumo(s: Execucao): Resumo {
  const visitadas = s.ordem.filter(id => (s.tempoPorEtapa[id] ?? 0) > 0 || id in s.desfechos).length;
  const desfechos = Object.entries(s.desfechos).filter(([id]) => s.ordem.includes(id));
  return {
    segundos: segundosTotais(s),
    visitadas,
    concluidas: desfechos.filter(([, d]) => d === 'concluida').length,
    puladas: desfechos.filter(([, d]) => d === 'pulada').length,
    naoVisitadas: s.ordem.length - visitadas,
  };
}

/**
 * "Pratiquei hoje" é **qualquer etapa efetivamente usada** (F3-3): tempo real numa etapa basta.
 *
 * Não existe meta de completude, e por isso isto não compara com o total: não há "você deixou 3
 * etapas por fazer".
 */
export const praticou = (s: Execucao) => segundosTotais(s) > 0 || Object.keys(s.desfechos).length > 0;

/**
 * Quantas perguntas uma etapa de **série** faz antes de terminar.
 *
 * **Decisão provisória de 03/11/2026** (ver `docs/decisoes-provisorias.md`): doze. O modelo de rotina
 * não guarda esse número, e sem ele a etapa de série nunca terminava sozinha — ficava esperando a
 * pessoa clicar.
 *
 * **Quem termina a etapa é a contagem, não o relógio.** A F3-2 diz as duas coisas — "série termina em
 * N perguntas ou no tempo" e "passar do tempo sugerido não avança, não bloqueia, não some com nada" —,
 * e elas se contradizem. Vale a segunda, que é a mais explícita e a mais coerente com a decisão 4: o
 * tempo **informa**, e nada mais.
 */
export const PERGUNTAS_POR_ETAPA = 12;
