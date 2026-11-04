// As duas operações mínimas sobre rotinas que a tela precisa agora: anexar uma instância e tirar uma
// etapa. Funções puras — recebem as rotinas e devolvem as novas, sem tocar no disco.
//
// **Isto não é o editor de rotinas** (F3-5). Reordenar etapas, tempo por etapa, modo livre ou
// guiado e configurar a rotação são desenho do Paulo, e ficam para lá. O que existe aqui é só o que
// o botão "Salvar numa rotina" exige: criar uma rotina e pôr uma etapa nela.
import type { ParametrosDePratica } from '../catalog/params';
import type { SettingValue } from '../catalog/types';
import { copiarRotina, novaEtapa, novaRotina } from './storage';
import type { Etapa, Instancia, Rotina } from './types';

/** Em que rotina gravar: uma que já existe, ou uma nova com este nome. */
export type Destino = { rotinaId: string } | { nome: string };

export type Resultado =
  | { ok: true; rotinas: Rotina[]; rotina: Rotina }
  | { ok: false; motivo: 'nome-vazio' | 'rotina-inexistente' };

/**
 * Acrescenta uma etapa com `itemId` e `settings` ao fim da rotina.
 *
 * As configurações são **copiadas por inteiro** (`structuredClone`): uma cópia rasa deixaria a
 * etapa dividindo com o estado da tela os arrays das configurações de lista, e mexer na tela mexeria
 * na rotina salva — o mesmo defeito que a decisão 9 proíbe entre rotina do time e cópia da pessoa.
 *
 * Não muta `rotinas`.
 */
export function anexarInstancia(
  rotinas: Rotina[], destino: Destino, itemId: string, settings: Record<string, unknown>, params: ParametrosDePratica = {},
): Resultado {
  const etapa = novaEtapa(itemId, structuredClone(settings));
  // Tonalidade, região e material vão NA INSTÂNCIA, e é isso que faz "salvar em Fá maior" gravar Fá
  // maior (decisão 87). Sem escolha nenhuma, nada é gravado — e a etapa abre livre, não seguindo o
  // que o item guarda hoje.
  if (Object.keys(params).length) etapa.instancias[0].params = structuredClone(params);

  if ('rotinaId' in destino) {
    const alvo = rotinas.find(r => r.id === destino.rotinaId);
    if (!alvo) return { ok: false, motivo: 'rotina-inexistente' };
    const rotina = { ...alvo, etapas: [...alvo.etapas, etapa] };
    return { ok: true, rotina, rotinas: rotinas.map(r => (r.id === rotina.id ? rotina : r)) };
  }

  const nome = destino.nome.trim();
  if (!nome) return { ok: false, motivo: 'nome-vazio' };
  const rotina = { ...novaRotina(nome), etapas: [etapa] };
  return { ok: true, rotina, rotinas: [...rotinas, rotina] };
}

/** Tira uma etapa. Não apaga a rotina, mesmo que ela fique vazia — apagar é um gesto à parte. */
export function removerEtapa(rotinas: Rotina[], rotinaId: string, etapaId: string): Rotina[] {
  return rotinas.map(r => (r.id === rotinaId ? { ...r, etapas: r.etapas.filter(e => e.id !== etapaId) } : r));
}

/**
 * O que a navegação carrega quando uma etapa abre o seu item: a configuração DA ETAPA.
 *
 * Vai no `state` do roteador e não na URL, de propósito: a configuração de uma etapa é dado da
 * rotina da pessoa, não algo para circular em endereço. Compartilhar é papel da rotina (decisão 23).
 */
export interface EstadoDeAbertura { instancia: Record<string, unknown>; params?: ParametrosDePratica }

/** O que a etapa traz ao abrir o item. */
export interface Abertura { settings: Record<string, SettingValue>; params: ParametrosDePratica }

/**
 * Lê o `state` de uma navegação. Devolve `null` para qualquer coisa que não seja uma etapa aberta.
 *
 * `params` vem SEMPRE preenchido, ainda que vazio: uma etapa é a definição completa do exercício, e
 * "sem tonalidade" quer dizer livre — não "use a que o item guarda hoje".
 */
export function lerAbertura(state: unknown): Abertura | null {
  if (!state || typeof state !== 'object') return null;
  const e = state as Partial<EstadoDeAbertura>;
  const i = e.instancia;
  if (!i || typeof i !== 'object' || Array.isArray(i)) return null;
  const params = e.params && typeof e.params === 'object' && !Array.isArray(e.params) ? e.params : {};
  return { settings: i as Record<string, SettingValue>, params };
}

// ---------------------------------------------------------------------------
// O editor (F3-5, decisões 95 e 97)
// ---------------------------------------------------------------------------

/** Altera campos da rotina. Não muta. */
export function alterarRotina(rotinas: Rotina[], id: string, patch: Partial<Omit<Rotina, 'id' | 'formato' | 'etapas'>>): Rotina[] {
  return rotinas.map(r => (r.id === id ? { ...r, ...patch } : r));
}

/**
 * Move a etapa `de` para a posição `para`. Índices fora da lista são presos a ela, em vez de sumirem
 * com a etapa — arrastar um pouco além da borda é gesto comum.
 */
export function moverEtapa(rotinas: Rotina[], rotinaId: string, de: number, para: number): Rotina[] {
  return rotinas.map(r => {
    if (r.id !== rotinaId) return r;
    const n = r.etapas.length;
    if (de < 0 || de >= n) return r;
    const destino = Math.min(Math.max(0, para), n - 1);
    if (destino === de) return r;
    const etapas = [...r.etapas];
    const [movida] = etapas.splice(de, 1);
    etapas.splice(destino, 0, movida);
    return { ...r, etapas };
  });
}

/** Altera uma etapa (tempo sugerido, política de rodízio). */
export function alterarEtapa(rotinas: Rotina[], rotinaId: string, etapaId: string, patch: Partial<Omit<Etapa, 'id' | 'instancias'>>): Rotina[] {
  return rotinas.map(r => (r.id !== rotinaId ? r : {
    ...r, etapas: r.etapas.map(e => (e.id === etapaId ? { ...e, ...patch } : e)),
  }));
}

/** Acrescenta uma instância a uma etapa que já existe — é como o rodízio nasce. */
export function acrescentarInstancia(
  rotinas: Rotina[], rotinaId: string, etapaId: string, itemId: string,
  settings: Record<string, unknown> = {}, params: ParametrosDePratica = {},
): Rotina[] {
  const nova: Instancia = { itemId, settings: structuredClone(settings) };
  if (Object.keys(params).length) nova.params = structuredClone(params);
  return rotinas.map(r => (r.id !== rotinaId ? r : {
    ...r, etapas: r.etapas.map(e => (e.id === etapaId ? { ...e, instancias: [...e.instancias, nova] } : e)),
  }));
}

/**
 * Tira uma instância. **A última não sai**: etapa sem instância não existe no modelo (`resolverInstancia`
 * lança), e a tela precisa de um gesto diferente — remover a etapa inteira.
 */
export function removerInstancia(rotinas: Rotina[], rotinaId: string, etapaId: string, indice: number): Rotina[] {
  return rotinas.map(r => (r.id !== rotinaId ? r : {
    ...r,
    etapas: r.etapas.map(e => {
      if (e.id !== etapaId || e.instancias.length <= 1) return e;
      const instancias = e.instancias.filter((_, i) => i !== indice);
      if (instancias.length === e.instancias.length) return e;
      // `ultimaUsada` aponta para um índice que mudou de lugar: zerar é mais honesto que adivinhar
      return { ...e, instancias, ultimaUsada: undefined };
    }),
  }));
}

/** Altera os parâmetros de prática de uma instância (a tonalidade de uma variante). */
export function alterarInstancia(rotinas: Rotina[], rotinaId: string, etapaId: string, indice: number, params: ParametrosDePratica): Rotina[] {
  return rotinas.map(r => (r.id !== rotinaId ? r : {
    ...r,
    etapas: r.etapas.map(e => (e.id !== etapaId ? e : {
      ...e,
      instancias: e.instancias.map((inst, i) => (i === indice ? { ...inst, params: { ...inst.params, ...structuredClone(params) } } : inst)),
    })),
  }));
}

/** "Aplicar a todas": o que substitui o `Etapa.params` que saiu (decisão 97). */
export function aplicarATodas(rotinas: Rotina[], rotinaId: string, etapaId: string, params: ParametrosDePratica): Rotina[] {
  return rotinas.map(r => (r.id !== rotinaId ? r : {
    ...r,
    etapas: r.etapas.map(e => (e.id !== etapaId ? e : {
      ...e,
      instancias: e.instancias.map(inst => ({ ...inst, params: { ...inst.params, ...structuredClone(params) } })),
    })),
  }));
}

/**
 * Gera uma variante por valor de um parâmetro — "pôr uma variante para cada tonalidade" (decisão 95).
 *
 * Parte da instância `base` e **substitui** a etapa inteira: gerar 12 tonalidades a partir de uma
 * instância em Fá produz 12, e não 13 com Fá repetido.
 */
export function gerarVariantes(
  rotinas: Rotina[], rotinaId: string, etapaId: string, base: number, valores: ParametrosDePratica[],
): Rotina[] {
  if (!valores.length) return rotinas;
  return rotinas.map(r => (r.id !== rotinaId ? r : {
    ...r,
    etapas: r.etapas.map(e => {
      if (e.id !== etapaId) return e;
      const modelo = e.instancias[Math.min(Math.max(0, base), e.instancias.length - 1)];
      if (!modelo) return e;
      return {
        ...e,
        ultimaUsada: undefined,
        instancias: valores.map(p => ({
          itemId: modelo.itemId,
          settings: structuredClone(modelo.settings),
          ...(Object.keys({ ...modelo.params, ...p }).length ? { params: { ...structuredClone(modelo.params ?? {}), ...structuredClone(p) } } : {}),
        })),
      };
    }),
  }));
}

/** Duplicar uma rotina para editar sem mexer na original. */
export const duplicarRotina = (rotinas: Rotina[], id: string, nome: string): Resultado => {
  const original = rotinas.find(r => r.id === id);
  if (!original) return { ok: false, motivo: 'rotina-inexistente' };
  if (!nome.trim()) return { ok: false, motivo: 'nome-vazio' };
  const copia = { ...copiarRotina(original), nome: nome.trim(), origem: undefined };
  return { ok: true, rotina: copia, rotinas: [...rotinas, copia] };
};
