// Guardar, ler e migrar rotinas (F3-1).
//
// A migração existe desde a v1, mesmo sendo a única versão que existe. O motivo está em types.ts:
// rotina compartilhada por link é dado fora do controle do app, e quando o formato mudar o link
// antigo quebra se não houver migração.
import { FORMATO_ROTINA, type Etapa, type Instancia, type Rotina, type SessaoDeRotina } from './types';

const KEY = 'clave:rotinas';
const KEY_SESSAO = 'clave:rotina-sessao';

export function novoId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Migração
// ---------------------------------------------------------------------------

/** Uma etapa de migração: leva do formato `de` para `de + 1`. */
type PassoDeMigracao = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Um passo por versão. Para subir o formato: acrescente o passo aqui, suba `FORMATO_ROTINA`,
 * e **escreva um teste** com uma rotina da versão antiga.
 *
 * Está vazio porque só existe a v1 — e é de propósito que a máquina esteja montada antes de
 * precisar dela.
 */
const PASSOS: Record<number, PassoDeMigracao> = {};

/**
 * Lê uma rotina de qualquer formato conhecido e devolve no formato atual.
 * Devolve `null` quando o dado não é uma rotina — link adulterado, colagem errada, versão de um
 * app mais novo. **Nunca lança**: quem chama está lidando com dado de fora.
 */
export function migrarRotina(raw: unknown): Rotina | null {
  if (!raw || typeof raw !== 'object') return null;
  let r = { ...(raw as Record<string, unknown>) };

  const formato = typeof r.formato === 'number' ? r.formato : 0;
  if (formato > FORMATO_ROTINA) return null; // veio de uma versão mais nova: não inventar

  for (let v = formato; v < FORMATO_ROTINA; v++) {
    const passo = PASSOS[v];
    if (!passo) return null; // buraco na corrente de migração
    r = passo(r);
  }
  r.formato = FORMATO_ROTINA;
  return ehRotina(r) ? r : null;
}

/** Confere a forma mínima. Serve de guarda tanto para o que vem do disco quanto do link. */
export function ehRotina(r: unknown): r is Rotina {
  if (!r || typeof r !== 'object') return false;
  const o = r as Partial<Rotina>;
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    typeof o.nome === 'string' &&
    (o.modo === 'livre' || o.modo === 'guiado') &&
    typeof o.embaralhar === 'boolean' &&
    !!o.params && typeof o.params === 'object' &&
    Array.isArray(o.etapas) && o.etapas.every(ehEtapa)
  );
}

function ehEtapa(e: unknown): e is Etapa {
  if (!e || typeof e !== 'object') return false;
  const o = e as Partial<Etapa>;
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    Array.isArray(o.instancias) && o.instancias.length > 0 && o.instancias.every(ehInstancia) &&
    (o.politica === 'ordem' || o.politica === 'sorteio' || o.politica === 'sorteio-sem-repetir')
  );
}

function ehInstancia(i: unknown): i is Instancia {
  if (!i || typeof i !== 'object') return false;
  const o = i as Partial<Instancia>;
  return typeof o.itemId === 'string' && o.itemId.length > 0 && !!o.settings && typeof o.settings === 'object';
}

// ---------------------------------------------------------------------------
// Fábricas
// ---------------------------------------------------------------------------

export function novaRotina(nome: string, modo: Rotina['modo'] = 'guiado'): Rotina {
  return { formato: FORMATO_ROTINA, id: novoId(), nome, modo, embaralhar: false, params: {}, etapas: [] };
}

export function novaEtapa(itemId: string, settings: Record<string, unknown> = {}): Etapa {
  return { id: novoId(), instancias: [{ itemId, settings }], politica: 'ordem' };
}

/**
 * Cópia para adotar: id novo, crédito à origem, e **sem** a marca do time.
 *
 * É a regra da decisão 9: a sugestão de variação altera a cópia da pessoa, nunca a rotina
 * publicada. Vale igual para rotina do time e para rotina que chegou por link.
 */
export function copiarRotina(r: Rotina, autor?: string): Rotina {
  return {
    ...r,
    id: novoId(),
    doTime: undefined,
    origem: { rotinaId: r.id, autor },
    params: { ...r.params },
    etapas: r.etapas.map(e => ({
      ...e,
      id: novoId(),
      ultimaUsada: undefined,
      params: e.params ? { ...e.params } : undefined,
      // cópia profunda das configurações: rasa faria a cópia e a original dividirem o MESMO objeto,
      // e mexer numa alteraria a outra — justamente o que a decisão 9 proíbe
      instancias: e.instancias.map(i => ({ ...i, settings: { ...i.settings }, params: i.params ? { ...i.params } : undefined })),
    })),
    rotacao: r.rotacao ? { ...r.rotacao, valores: [...r.rotacao.valores], posicao: 0, visitas: [] } : undefined,
  };
}

// ---------------------------------------------------------------------------
// Disco
// ---------------------------------------------------------------------------

function lerJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function gravarJSON(key: string, valor: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: segue só em memória */
  }
}

/** Todas as rotinas da pessoa. O que não migrar é descartado em silêncio, nunca quebra a tela. */
export function lerRotinas(): Rotina[] {
  const raw = lerJSON<unknown[]>(KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map(migrarRotina).filter((r): r is Rotina => r !== null);
}

export function gravarRotinas(rotinas: Rotina[]) {
  gravarJSON(KEY, rotinas);
  avisar();
}

// ---------------------------------------------------------------------------
// Assinatura — para a tela acompanhar o disco sem reler a cada render
// ---------------------------------------------------------------------------

const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach(f => f());

/** Chama `f` sempre que as rotinas mudarem. Devolve a função que cancela. */
export function aoMudarRotinas(f: () => void): () => void {
  ouvintes.add(f);
  return () => { ouvintes.delete(f); };
}

let ultimaLeitura: { raw: string | null; rotinas: Rotina[] } | null = null;

/**
 * As rotinas, **com a mesma referência enquanto o disco não mudar**.
 *
 * Existe porque `lerRotinas` devolve um array novo a cada chamada, e uma tela que o usasse direto
 * como snapshot entraria em loop de render: o React compara por referência.
 */
export function rotinasEstaveis(): Rotina[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* sem armazenamento */ }
  if (ultimaLeitura && ultimaLeitura.raw === raw) return ultimaLeitura.rotinas;
  ultimaLeitura = { raw, rotinas: lerRotinas() };
  return ultimaLeitura.rotinas;
}

/** O nome da chave de armazenamento, para a tela escutar mudanças vindas de outra aba. */
export const CHAVE_ROTINAS = KEY;

export function salvarRotina(r: Rotina): Rotina[] {
  const todas = lerRotinas();
  const i = todas.findIndex(x => x.id === r.id);
  const novas = i >= 0 ? todas.map(x => (x.id === r.id ? r : x)) : [...todas, r];
  gravarRotinas(novas);
  return novas;
}

export function apagarRotina(id: string): Rotina[] {
  const novas = lerRotinas().filter(r => r.id !== id);
  gravarRotinas(novas);
  return novas;
}

/** A execução em andamento, se houver. É o que oferece "continuar de onde parou". */
export function lerSessao(): SessaoDeRotina | null {
  const s = lerJSON<SessaoDeRotina>(KEY_SESSAO);
  return s && typeof s.rotinaId === 'string' && typeof s.etapaAtual === 'string' ? s : null;
}
export function gravarSessao(s: SessaoDeRotina | null) {
  if (s) gravarJSON(KEY_SESSAO, s);
  else {
    try { localStorage.removeItem(KEY_SESSAO); } catch { /* sem armazenamento */ }
  }
}
