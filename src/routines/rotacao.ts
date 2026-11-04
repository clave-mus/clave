// Rotação de parâmetro (F3-8, decisão 38).
//
// A rotina avança UM parâmetro por uma lista de valores. É o que permite morar numa tonalidade por
// uma semana e atravessá-la em várias frentes — notas no braço, regiões, modos, harmonia,
// vocabulário — antes de passar para a próxima.
//
// **O avanço é manual por padrão, e isso não é preguiça de desenho.** Avanço automático jogaria a
// pessoa na tonalidade seguinte no terceiro dia, quando ela ainda não está firme na atual. Quem
// sabe se internalizou é ela — é a mesma lógica da autoavaliação.
import type { ValoresDeCamada } from '../catalog/params';
import type { Rotacao, Rotacionavel, Rotina } from './types';

/**
 * Onde cada parâmetro rotacionável aterrissa.
 *
 * `param` cai na cascata de parâmetros; `setting` cai na configuração da instância. Um item que
 * queira ser rotacionado por um eixo de `setting` **precisa usar esse id** na sua configuração —
 * é convenção de código, e o teste do catálogo a verifica.
 */
export const ALVO_DA_ROTACAO: Record<Rotacionavel, { kind: 'param'; key: 'key' | 'range' } | { kind: 'setting'; id: string }> = {
  tonalidade: { kind: 'param', key: 'key' },
  regiao: { kind: 'param', key: 'range' },
  corda: { kind: 'setting', id: 'corda' },
  modo: { kind: 'setting', id: 'modo' },
  qualidadeAcorde: { kind: 'setting', id: 'tipos' },
  // Os dois eixos de técnica (decisões 81 e 83). São a mesma máquina dos outros cinco, e é por isso
  // que as duas famílias custaram pouco: `digitacao` percorre as 24 ordenações de 1-2-3-4,
  // `deslocamento` percorre os modos de um padrão rítmico de um tempo.
  digitacao: { kind: 'setting', id: 'digitacao' },
  ordemDeCordas: { kind: 'setting', id: 'ordemDeCordas' },
  deslocamento: { kind: 'setting', id: 'deslocamento' },
};

/** O que a rotação injeta na execução: uma camada de parâmetros e/ou uma configuração. */
export interface EfeitoDaRotacao {
  params: ValoresDeCamada;
  settings: Record<string, unknown>;
}

const VAZIO: EfeitoDaRotacao = { params: {}, settings: {} };

/** O que a rotação vale agora. Sem rotação, não injeta nada. */
export function efeitoDaRotacao(r: Rotina): EfeitoDaRotacao {
  const rot = r.rotacao;
  if (!rot || rot.valores.length === 0) return VAZIO;
  const valor = rot.valores[clamp(rot.posicao, rot.valores.length)];
  if (valor === undefined) return VAZIO;

  const alvo = ALVO_DA_ROTACAO[rot.param];
  return alvo.kind === 'param'
    ? { params: { [alvo.key]: valor } as ValoresDeCamada, settings: {} }
    : { params: {}, settings: { [alvo.id]: valor } };
}

const clamp = (i: number, n: number) => ((i % n) + n) % n;

/** Quantas sessões a pessoa já fez no valor atual. */
export function sessoesNoValorAtual(rot: Rotacao): number {
  const valor = rot.valores[clamp(rot.posicao, rot.valores.length)];
  return rot.visitas.find(v => Object.is(v.valor, valor))?.sessoes ?? 0;
}

/**
 * Marca mais uma execução no valor atual.
 *
 * Com avanço automático (`execucoes`), **sugere** passar adiante quando a conta fecha — mas quem
 * avança de fato continua sendo quem chama, nunca este módulo sozinho.
 */
export function registrarExecucao(r: Rotina, agora = Date.now()): { rotina: Rotina; podeAvancar: boolean } {
  const rot = r.rotacao;
  if (!rot || rot.valores.length === 0) return { rotina: r, podeAvancar: false };

  const valor = rot.valores[clamp(rot.posicao, rot.valores.length)];
  const i = rot.visitas.findIndex(v => Object.is(v.valor, valor));
  const visitas = i >= 0
    ? rot.visitas.map((v, k) => (k === i ? { ...v, sessoes: v.sessoes + 1 } : v))
    : [...rot.visitas, { valor, em: agora, sessoes: 1 }];

  const nova: Rotacao = { ...rot, visitas };
  const podeAvancar = rot.avanco.kind === 'execucoes' && sessoesNoValorAtual(nova) >= rot.avanco.n;
  return { rotina: { ...r, rotacao: nova }, podeAvancar };
}

/** Passa para o próximo valor da lista, dando a volta no fim. */
export function avancar(r: Rotina, agora = Date.now()): Rotina {
  return irPara(r, (r.rotacao?.posicao ?? 0) + 1, agora);
}

/** Volta para o valor anterior. Descer é tão legítimo quanto subir. */
export function voltar(r: Rotina, agora = Date.now()): Rotina {
  return irPara(r, (r.rotacao?.posicao ?? 0) - 1, agora);
}

/** Vai direto para uma posição da lista. */
export function irPara(r: Rotina, posicao: number, agora = Date.now()): Rotina {
  const rot = r.rotacao;
  if (!rot || rot.valores.length === 0) return r;
  const nova = clamp(posicao, rot.valores.length);
  if (nova === rot.posicao) return r;

  const valor = rot.valores[nova];
  // a visita marca QUANDO se entrou no valor; voltar a um valor já visitado reabre a data
  const visitas = rot.visitas.some(v => Object.is(v.valor, valor))
    ? rot.visitas.map(v => (Object.is(v.valor, valor) ? { ...v, em: agora } : v))
    : [...rot.visitas, { valor, em: agora, sessoes: 0 }];

  return { ...r, rotacao: { ...rot, posicao: nova, visitas } };
}

/** Por onde a rotação já passou, da visita mais recente para a mais antiga. */
export function jaPassouPor(rot: Rotacao): { valor: unknown; em: number; sessoes: number }[] {
  return [...rot.visitas].sort((a, b) => b.em - a.em);
}

/** Faltou visitar? É o que responde "faz quanto tempo que não toco em Fá♯?". */
export function aindaNaoVisitados(rot: Rotacao): unknown[] {
  return rot.valores.filter(v => !rot.visitas.some(x => Object.is(x.valor, v)));
}

// ---------------------------------------------------------------------------
// Listas prontas
// ---------------------------------------------------------------------------

/** As 12 tonalidades no ciclo de quartas: Dó, Fá, Si♭… É a ordem clássica de estudo. */
export const CICLO_DE_QUARTAS = Array.from({ length: 12 }, (_, i) => (i * 5) % 12);
/** As 12 em ordem cromática. */
export const CROMATICA = Array.from({ length: 12 }, (_, i) => i);
