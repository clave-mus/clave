// O modelo de rotinas (F3-1). A rotina é o objeto central do Clave: tudo — item, ferramenta,
// teoria, histórico — só ganha sentido dentro de uma (decisão 1).
//
// Este arquivo é só o formato. Executor, editor e link ficam em Runner, Editor e share.
import type { ValoresDeCamada } from '../catalog/params';

/**
 * A versão do formato. **Sobe sempre que o significado de um campo muda.**
 *
 * Não é burocracia: rotina sai do controle do app no momento em que vira link compartilhado
 * (decisão 23). Quando o formato mudar, link antigo quebra se não houver migração — e escrever a
 * migração agora custa uma função, enquanto escrever depois custa link quebrado de gente real.
 */
export const FORMATO_ROTINA = 1;

/** Um item do catálogo com uma configuração. É o que a etapa realmente aponta. */
export interface Instancia {
  itemId: string;
  /** Configurações do item (as de `settings`), não os parâmetros globais. */
  settings: Record<string, unknown>;
  /** Substituição de parâmetro global só para esta instância. */
  params?: ValoresDeCamada;
}

/** Como a etapa escolhe a instância da vez, quando tem mais de uma (decisão 7). */
export type PoliticaDeCiclagem = 'ordem' | 'sorteio' | 'sorteio-sem-repetir';

/**
 * Uma etapa é um **conjunto de instâncias**. Com uma só, é uma etapa comum; com mais de uma, ela
 * cicla a cada execução — que é como a rotina ganha variação sem deixar de ser a mesma rotina.
 *
 * Não existem dois tipos de etapa no modelo, de propósito: "acrescentar variação" é só pôr mais
 * um item num conjunto que já existe.
 */
export interface Etapa {
  id: string;
  instancias: Instancia[];
  politica: PoliticaDeCiclagem;
  /**
   * Índice da última instância usada. **Persiste entre sessões** — se o rodízio reiniciasse a cada
   * abertura, a ciclagem não existiria na prática: a pessoa cairia sempre na primeira.
   */
  ultimaUsada?: number;
  /**
   * Tempo sugerido, em segundos. Só **informa**; nunca encerra a etapa nem bloqueia o avanço.
   *
   * Pertence à **etapa**, não à instância: senão a ciclagem mudaria o tempo sugerido e a rotina
   * guiada ficaria de duração variável sem motivo.
   */
  segundosSugeridos?: number;
  /** Substituição explícita de parâmetro, visível na tela como "(da etapa)". */
  params?: ValoresDeCamada;
}

/** Os parâmetros que podem entrar em rotação (decisão 38). A lista é curada de propósito. */
export const ROTACIONAVEIS = ['tonalidade', 'regiao', 'corda', 'modo', 'qualidadeAcorde', 'digitacao', 'deslocamento'] as const;
export type Rotacionavel = (typeof ROTACIONAVEIS)[number];

/** Quando a rotação anda. O padrão é manual, e isso não é preguiça de desenho — ver abaixo. */
export type Avanco = { kind: 'manual' } | { kind: 'execucoes'; n: number };

/** Uma visita: por onde a rotação já passou. É o que responde "já pratiquei em Sol?". */
export interface Visita {
  valor: unknown;
  /** Quando entrou neste valor (ms desde 1970). */
  em: number;
  /** Quantas vezes a rotina rodou enquanto estava neste valor. */
  sessoes: number;
}

/**
 * Rotação de parâmetro (decisão 38): a rotina avança **um** parâmetro por uma lista de valores.
 *
 * É o que permite morar numa tonalidade por uma semana e atravessá-la em várias frentes antes de
 * passar para a próxima. **O avanço é manual por padrão**, e isso é o ponto: avanço automático
 * jogaria a pessoa na tonalidade seguinte no terceiro dia, quando ela ainda não está firme.
 * Quem sabe se internalizou é ela.
 */
export interface Rotacao {
  param: Rotacionavel;
  valores: unknown[];
  posicao: number;
  avanco: Avanco;
  visitas: Visita[];
}

export type ModoDeExecucao = 'livre' | 'guiado';

export interface Rotina {
  formato: number;
  id: string;
  nome: string;
  notas?: string;
  /**
   * `livre` — cartões, qualquer ordem, cronômetro quieto. `guiado` — etapa atual em foco, tempo
   * sugerido visível. É **postura padrão, não jaula**: nos dois dá para pular e esconder o relógio.
   */
  modo: ModoDeExecucao;
  /** Randomiza a ordem das etapas. Independente da ciclagem dentro da etapa. */
  embaralhar: boolean;
  /** Herdados por todas as etapas, com substituição explícita e visível. */
  params: ValoresDeCamada;
  rotacao?: Rotacao;
  etapas: Etapa[];
  /** De onde veio, quando a rotina chegou por link (decisão 23). */
  origem?: { rotinaId: string; autor?: string };
  /** Rotina publicada pelo time: adotá-la cria uma cópia da pessoa, e é a cópia que evolui. */
  doTime?: boolean;
}

/** Uma execução em andamento. É o que faz "fechar a página e retomar" funcionar. */
export interface SessaoDeRotina {
  rotinaId: string;
  comecouEm: number;
  etapaAtual: string;
  /** Segundos acumulados por etapa. */
  tempoPorEtapa: Record<string, number>;
  pausada: boolean;
  /** Qual instância cada etapa resolveu **nesta** execução. */
  resolvidas: Record<string, number>;
  /** Liga a execução às tentativas gravadas (`attempts.session_id`). */
  sessaoId: string;
}

/** Só as guiadas somam tempo: fazer isso numa rotina livre seria mentira. */
export function tempoTotal(r: Rotina): number | null {
  if (r.modo !== 'guiado') return null;
  return r.etapas.reduce((a, e) => a + (e.segundosSugeridos ?? 0), 0);
}

/** O valor em que a rotação está agora, ou `undefined` se não há rotação. */
export function valorDaRotacao(r: Rotina): unknown {
  return r.rotacao?.valores[r.rotacao.posicao];
}
