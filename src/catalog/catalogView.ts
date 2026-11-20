// O catálogo do Treinar, repartido por módulo (decisão 6): cada exercício e ferramenta mora em UM
// módulo (o principal) e aparece só ali.
import { MODULE_LIST } from '../data/modules';
import { AMBIENTES, EXERCISES } from './index';
import { visivel } from './publicacao';
import type { ModuleId } from './taxonomy';

export interface ModuleEntry {
  module: ModuleId;
  /** Ids dos exercícios do módulo — séries **e tarefas**: as duas coisas se faz, uma o app confere
   *  e a outra você mesmo. */
  exercises: string[];
  /** Ids das ferramentas do módulo. Vazio desde 20/11: ambiente de prática virou seção própria. */
  tools: string[];
}

export function catalogByModule(opts: { mobileOnly?: boolean; revisao?: boolean; portao?: boolean } = {}): ModuleEntry[] {
  // Rascunho não aparece para quem usa (decisão 91); só no modo de revisão.
  // `portao` é opção para o teste exercitar o comportamento do beta (portão ligado) mesmo com o
  // padrão de hoje desligado — ver `publicacao.ts`.
  const aparece = (i: { publicacao?: Parameters<typeof visivel>[0] }) => visivel(i.publicacao, !!opts.revisao, opts.portao);
  // Um item aparece na sua área e nas que ele declarar em `tambemEm` — ver taxonomy.ts.
  const naArea = (i: { primaryModule: string; tambemEm?: string[] }, m: string) =>
    i.primaryModule === m || !!i.tambemEm?.includes(m);
  const cabe = (i: { mobile?: boolean }) => !opts.mobileOnly || i.mobile;
  return MODULE_LIST.map(m => ({
    module: m.id,
    /**
     * **Série e tarefa entram juntas como exercício**, e isto mudou em 20/11: `AMBIENTES` sempre
     * guardou os dois tipos que não são série, e a tela tratava todos como "ferramenta". Mas tarefa
     * é exercício — tem alvo e termina em autoavaliação (`no-instrumento`, `tecnica`, e agora a
     * leitura de notas e a de ritmo). Ambiente é o que fica rodando enquanto você pratica.
     */
    exercises: [
      ...EXERCISES.filter(e => naArea(e, m.id) && aparece(e) && cabe(e)).map(e => e.id),
      ...AMBIENTES.filter(t => t.kind === 'tarefa' && naArea(t, m.id) && aparece(t) && cabe(t)).map(t => t.id),
    ],
    tools: [],
  }));
}

/**
 * **Os ambientes de prática**, fora das áreas (pedido dele em 20/11).
 *
 * São o que não tem veredito: você liga, pratica, e para quando quiser. Misturá-los com exercício
 * na mesma lista põe lado a lado uma série de doze perguntas e uma ferramenta que fica tocando meia
 * hora — coisas que não se comparam.
 */
export function ambientesDePratica(opts: { mobileOnly?: boolean; revisao?: boolean; portao?: boolean } = {}): string[] {
  const aparece = (i: { publicacao?: Parameters<typeof visivel>[0] }) => visivel(i.publicacao, !!opts.revisao, opts.portao);
  return AMBIENTES
    .filter(a => a.kind === 'ambiente' && aparece(a) && (!opts.mobileOnly || a.mobile))
    .map(a => a.id);
}
