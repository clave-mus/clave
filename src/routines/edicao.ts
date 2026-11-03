// As duas operações mínimas sobre rotinas que a tela precisa agora: anexar uma instância e tirar uma
// etapa. Funções puras — recebem as rotinas e devolvem as novas, sem tocar no disco.
//
// **Isto não é o editor de rotinas** (F3-5). Reordenar etapas, tempo por etapa, modo livre ou
// guiado e configurar a rotação são desenho do Paulo, e ficam para lá. O que existe aqui é só o que
// o botão "Salvar numa rotina" exige: criar uma rotina e pôr uma etapa nela.
import type { ParametrosDePratica } from '../catalog/params';
import type { SettingValue } from '../catalog/types';
import { novaEtapa, novaRotina } from './storage';
import type { Rotina } from './types';

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
