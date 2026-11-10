// Grupos por propósito: que itens fazem sentido **na mesma etapa de rotina** (decisão 95).
//
// O critério NÃO é "treina a mesma habilidade" — é "serve ao mesmo propósito agora". A diferença
// importa: dois itens podem compartilhar `skillTags` e ainda não combinarem numa mesma etapa, se o
// que cada um pede da pessoa agora for diferente (um pede metrônomo, o outro silêncio, por exemplo).
//
// **Um item entra em vários grupos.** É o que resolve a objeção certa de que um exercício serve a
// vários propósitos: não é preciso eleger o principal.
//
// **O membro de um grupo é uma INSTÂNCIA, não um id** — e isso passou a ser obrigatório com as fusões
// por superfície (decisão 16). Depois delas, "qual nota é essa?" é um item só que serve à pauta, ao
// teclado e ao braço: um grupo que listasse só o id ofereceria leitura de pauta dentro de "o braço".
// O grupo diz o id **e a configuração que define o propósito**.
//
// **O conteúdo é curadoria do Paulo** (decisão 51). Acrescentar grupo ou item aqui é decisão de
// produto, não de tarefa — proponha, não decida.
import { ITEMS } from './index';
import type { MessageKey } from '../i18n';

/** Um membro de grupo: o item e, quando o propósito depende dela, a configuração. */
export interface MembroDeGrupo {
  itemId: string;
  /** As chaves que definem o propósito. Omitir quer dizer "em qualquer configuração". */
  settings?: Record<string, unknown>;
}

export interface GrupoDeRodizio {
  id: string;
  /** Nome que a pessoa vê, nos dois idiomas (`grupos.<id>`). */
  nome: MessageKey;
  itens: readonly MembroDeGrupo[];
}

const na = (itemId: string, superficie: string): MembroDeGrupo => ({ itemId, settings: { superficie } });

export const GRUPOS: readonly GrupoDeRodizio[] = [
  {
    id: 'ritmo-metronomo', nome: 'grupos.ritmo-metronomo',
    itens: [{ itemId: 'acento-deslocado' }, { itemId: 'subdivisao-alternada' }, { itemId: 'deslocamento-ritmico' }],
  },
  {
    // Desde a reorganização de 09/11/2026 ler e escrever são o MESMO item (`nota-na-pauta`), e a
    // justificativa que existia aqui — "entra mesmo sendo escrever, não ler" — deixou de ser
    // necessária. Era remendo da estrutura antiga.
    id: 'leitura-pauta', nome: 'grupos.leitura-pauta',
    itens: [{ itemId: 'nota-na-pauta' }, na('que-intervalo-e-esse', 'pauta'), na('que-acorde-e-esse', 'pauta'),
      { itemId: 'pauta-escala' }],
  },
  {
    // `ouvido-tecla` fica FORA: ele é de ouvido, mas responde no teclado, e o propósito ali é outro.
    id: 'ouvido', nome: 'grupos.ouvido',
    // `relacoes-melodia-harmonia` entrou em 09/11, aprovado pelo Paulo: combina na mesma etapa que
    // os outros de ouvido, que é o critério do grupo (e não "treina a mesma habilidade").
    itens: [{ itemId: 'ouvido-intervalo' }, { itemId: 'ouvido-acorde' }, { itemId: 'ouvido-escala' }, { itemId: 'ouvido-celulas' },
      { itemId: 'relacoes-melodia-harmonia' }],
  },
  {
    id: 'o-braco', nome: 'grupos.o-braco',
    itens: [{ itemId: 'nota-no-instrumento' }, na('que-intervalo-e-esse', 'braco'),
      na('que-acorde-e-esse', 'braco')],
  },
  {
    id: 'o-teclado', nome: 'grupos.o-teclado',
    itens: [{ itemId: 'nota-no-instrumento', settings: { instrumento: 'piano' } }, na('que-acorde-e-esse', 'teclado'),
      { itemId: 'ouvido-tecla' }],
  },
];

/** O membro casa com esta instância? Sem `settings` declarado, casa com qualquer configuração. */
const casa = (m: MembroDeGrupo, inst: MembroDeGrupo) =>
  m.itemId === inst.itemId && Object.entries(m.settings ?? {}).every(([k, v]) => (inst.settings ?? {})[k] === v);

/** Os grupos a que uma instância pertence. Vazio é o caso comum, e está certo. */
export const gruposDaInstancia = (inst: MembroDeGrupo) => GRUPOS.filter(g => g.itens.some(m => casa(m, inst)));

/**
 * Os outros membros que combinam com este na mesma etapa, sem repetir e sem incluir ele mesmo.
 *
 * `visivel` filtra o que a pessoa pode ver (um rascunho não aparece fora do modo de revisão), e é por
 * isso que o botão não aparece onde não há o que oferecer: aqui a lista volta vazia.
 */
export function companheirosDe(inst: MembroDeGrupo, visivel: (id: string) => boolean): MembroDeGrupo[] {
  const out: MembroDeGrupo[] = [];
  const chave = (m: MembroDeGrupo) => `${m.itemId}|${JSON.stringify(m.settings ?? {})}`;
  const vistos = new Set([chave(inst)]);
  for (const g of gruposDaInstancia(inst)) {
    for (const m of g.itens) {
      if (casa(m, inst) || !visivel(m.itemId) || vistos.has(chave(m))) continue;
      vistos.add(chave(m));
      out.push(m);
    }
  }
  return out;
}

/** Os ids declarados que não existem no catálogo. Deve ser sempre vazio — ver o teste. */
export const idsFantasma = () => GRUPOS.flatMap(g => g.itens.map(m => m.itemId)).filter(id => !ITEMS.some(i => i.id === id));
