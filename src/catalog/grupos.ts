// Grupos por propósito: que itens fazem sentido **na mesma etapa de rotina** (decisão 95).
//
// O critério NÃO é "treina a mesma habilidade" — é "serve ao mesmo propósito agora". A diferença
// importa: `technique.tempo_control` junta metrônomo com "sustentar e cortar" porque os dois usam
// clique, e eles não combinam num aquecimento de mão. Foi por medir pelas `skillTags` que o
// aquecimento não apareceu no primeiro levantamento.
//
// **Um item entra em vários grupos.** É o que resolve a objeção certa de que um exercício serve a
// vários propósitos: não é preciso eleger o principal.
//
// **O conteúdo é curadoria do Paulo** (decisão 51). Acrescentar grupo ou item aqui é decisão de
// produto, não de tarefa — proponha, não decida.
import { ITEMS } from './index';
import type { MessageKey } from '../i18n';

export interface GrupoDeRodizio {
  id: string;
  /** Nome que a pessoa vê, nos dois idiomas (`grupos.<id>`). */
  nome: MessageKey;
  itens: readonly string[];
}

export const GRUPOS: readonly GrupoDeRodizio[] = [
  {
    id: 'aquecimento-mao', nome: 'grupos.aquecimento-mao',
    itens: ['tecnica', 'sustentar-e-cortar', 'legato-staccato'],
  },
  {
    id: 'ritmo-metronomo', nome: 'grupos.ritmo-metronomo',
    itens: ['acento-deslocado', 'subdivisao-alternada', 'deslocamento-ritmico'],
  },
  {
    // `pauta-construir` entra mesmo sendo escrever, não ler: serve ao mesmo propósito de praticar pauta.
    id: 'leitura-pauta', nome: 'grupos.leitura-pauta',
    itens: ['pauta-nota', 'pauta-intervalo', 'pauta-acorde', 'pauta-escala', 'pauta-construir'],
  },
  {
    // `ouvido-tecla` fica FORA: ele é de ouvido, mas responde no teclado, e o propósito ali é outro.
    id: 'ouvido', nome: 'grupos.ouvido',
    itens: ['ouvido-intervalo', 'ouvido-acorde', 'ouvido-escala', 'ouvido-celulas'],
  },
  {
    id: 'o-braco', nome: 'grupos.o-braco',
    itens: ['braco-nota', 'braco-ache', 'braco-intervalo'],
  },
];

/** Os grupos a que um item pertence. Vazio é o caso comum, e está certo. */
export const gruposDoItem = (itemId: string) => GRUPOS.filter(g => g.itens.includes(itemId));

/**
 * Os outros itens que combinam com este na mesma etapa, sem repetir e sem incluir ele mesmo.
 *
 * `visivel` filtra o que a pessoa pode ver (um rascunho não aparece fora do modo de revisão), e é por
 * isso que o botão não aparece onde não há o que oferecer: aqui a lista volta vazia.
 */
export function companheirosDe(itemId: string, visivel: (id: string) => boolean): string[] {
  const out = new Set<string>();
  for (const g of gruposDoItem(itemId)) {
    for (const id of g.itens) if (id !== itemId && visivel(id)) out.add(id);
  }
  return [...out];
}

/** Os ids declarados que não existem no catálogo. Deve ser sempre vazio — ver o teste. */
export const idsFantasma = () => GRUPOS.flatMap(g => g.itens).filter(id => !ITEMS.some(i => i.id === id));
