// O catálogo do Treinar, repartido por módulo (decisão 6): cada exercício, ferramenta e aula mora em
// UM módulo (o principal) e aparece só ali. Teoria absorve o antigo Estudar: as aulas ficam ao lado dos
// exercícios do mesmo módulo.
import { LESSONS } from '../data/content';
import { MODULE_LIST } from '../data/modules';
import { AMBIENTES, EXERCISES } from './index';
import { visivel } from './publicacao';
import type { ModuleId } from './taxonomy';

export interface ModuleEntry {
  module: ModuleId;
  /** Ids das aulas do módulo (aulas são leitura: o filtro "sem instrumento" não as esconde). */
  lessons: string[];
  /** Ids dos exercícios do módulo. */
  exercises: string[];
  /** Ids das ferramentas do módulo. */
  tools: string[];
}

export function catalogByModule(opts: { mobileOnly?: boolean; revisao?: boolean; portao?: boolean } = {}): ModuleEntry[] {
  // Rascunho não aparece para quem usa (decisão 91); só no modo de revisão.
  // `portao` é opção para o teste exercitar o comportamento do beta (portão ligado) mesmo com o
  // padrão de hoje desligado — ver `publicacao.ts`.
  const aparece = (i: { publicacao?: Parameters<typeof visivel>[0] }) => visivel(i.publicacao, !!opts.revisao, opts.portao);
  return MODULE_LIST.map(m => ({
    module: m.id,
    lessons: LESSONS.filter(l => l.primaryModule === m.id).map(l => l.id),
    exercises: EXERCISES.filter(e => e.primaryModule === m.id && aparece(e) && (!opts.mobileOnly || e.mobile)).map(e => e.id),
    tools: AMBIENTES.filter(t => t.primaryModule === m.id && aparece(t) && (!opts.mobileOnly || t.mobile)).map(t => t.id),
  }));
}
