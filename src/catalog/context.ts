// Contexto de prática (F1-2, decisão 47): onde a pessoa está e o que cabe ali.
//
// Três requisitos são DECLARADOS no item, porque são fato do mundo: instrumento, microfone, voz.
// Os outros três são DEDUZIDOS daqui, para não desatualizarem quando o item mudar:
//
//   olhos  o visual é só som, ou tem coisa na tela?
//   mãos   existe superfície de resposta?
//   áudio  a pergunta toca alguma coisa?
//
// Os dois eixos de classificação (objeto, tarefa) são **independentes** disto. "Tocar" num braço
// virtual, na tela, continua sendo a tarefa *tocar* — ela só não exige o instrumento.
import { PARAMS_BASE } from './params';
import { isSeries, type CatalogItem, type Requisitos } from './types';

/** O que a pessoa escolhe na tela. "Posso cantar" é marcador à parte, ortogonal a estes. */
export type Contexto = 'bolso' | 'onibus' | 'silencio' | 'instrumento';

export const CONTEXTOS: readonly Contexto[] = ['bolso', 'onibus', 'silencio', 'instrumento'] as const;

export interface RequisitosCompletos extends Requisitos {
  olhos: boolean;
  maos: boolean;
  audio: boolean;
}

/** Contexto de sondagem: só serve para olhar a forma da pergunta, nunca para mostrar nada. */
const SONDA = {
  naming: 'pt' as const,
  conv: 'pt' as const,
  t: ((k: string) => k) as never,
  params: PARAMS_BASE,
};

const cache = new Map<string, RequisitosCompletos>();

/**
 * Tudo que o item exige, declarado e deduzido.
 *
 * Para itens de **série**, deduz sondando uma pergunta — a forma do visual e a presença de som não
 * dependem de idioma nem de configuração. Para **ambientes e tarefas**, que têm tela própria,
 * assume o caso conservador: usa olhos, mãos e áudio. Errar para mais só esconde o item de um
 * contexto apertado; errar para menos ofereceria algo que a pessoa não consegue fazer.
 *
 * **A única exceção é `semTela`**, que o item declara: um ciclo de áudio puro não tem o que olhar nem
 * onde tocar, e a suposição conservadora estaria errada ali.
 */
export function requisitosDe(item: CatalogItem): RequisitosCompletos {
  const emCache = cache.get(item.id);
  if (emCache) return emCache;

  let olhos = true, maos = true, audio = true;
  // O item de tela própria que declara `semTela` é um ciclo de áudio: não há o que olhar nem onde
  // tocar. É a única exceção à regra de que olhos/mãos/áudio são deduzidos, e ela existe porque a
  // sonda não entra numa tela — ver `CatalogItem.semTela`.
  if (item.semTela) { olhos = false; maos = false; }
  else if (isSeries(item)) {
    try {
      const q = item.make(item.defaults, SONDA);
      olhos = q.visual.kind !== 'ear';
      maos = true; // todo item de série tem superfície de resposta
      audio = q.sound !== undefined;
    } catch {
      /* sonda falhou: fica no caso conservador */
    }
  }

  const out: RequisitosCompletos = { ...item.requires, olhos, maos, audio };
  cache.set(item.id, out);
  return out;
}

/** Só para o teste: a sonda guarda em cache por id. */
export function limparCacheDeRequisitos() {
  cache.clear();
}

/**
 * O item cabe neste contexto?
 *
 * - **bolso** — nada de olhos, mãos, voz, instrumento ou microfone. Só ouvido, e dá para fazer
 *   até dirigindo. **O habitante dele é o ciclo sem tela** (`maos-livres`, F6-1); os de série não
 *   cabem porque todos têm superfície de resposta, e responder pede as mãos.
 * - **ônibus** — olhos e mãos liberados; sem instrumento, microfone ou canto.
 * - **silêncio** — sem áudio, para quem esqueceu o fone.
 * - **com o instrumento** — tudo liberado.
 *
 * `podeCantar` é ortogonal: libera o que exige voz, em qualquer contexto.
 */
export function cabeNoContexto(item: CatalogItem, contexto: Contexto, podeCantar = false): boolean {
  const r = requisitosDe(item);
  if (r.voz && !podeCantar) return false;
  // nenhum item EXIGE microfone (decisão 43); se algum passar a exigir, só com o instrumento
  if (r.microfone && contexto !== 'instrumento') return false;

  switch (contexto) {
    case 'bolso':
      return !r.instrumento && !r.olhos && !r.maos && !r.voz;
    case 'onibus':
      return !r.instrumento;
    case 'silencio':
      return !r.instrumento && !r.audio;
    case 'instrumento':
      return true;
  }
}

/** Por que não cabe — é o que a tela mostra em vez de simplesmente esconder o item. */
export function porQueNaoCabe(item: CatalogItem, contexto: Contexto, podeCantar = false): string | null {
  if (cabeNoContexto(item, contexto, podeCantar)) return null;
  const r = requisitosDe(item);
  if (r.voz && !podeCantar) return 'voz';
  if (r.instrumento) return 'instrumento';
  if (r.microfone) return 'microfone';
  if (contexto === 'silencio' && r.audio) return 'audio';
  if (contexto === 'bolso' && (r.olhos || r.maos)) return 'maos';
  return 'outro';
}
