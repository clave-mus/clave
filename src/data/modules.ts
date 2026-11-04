// Os cinco módulos de habilidade (decisão 6): Teoria, Técnica e as três de Percepção.
// O módulo diz onde o exercício mora no app; o que ele testa são as etiquetas (src/catalog/taxonomy.ts).
// Aqui fica só a estrutura; nomes e textos estão em src/i18n/content.*.ts e chegam às telas já no
// idioma da pessoa (useContent, em src/data/localized.ts).
import type { ModuleId } from '../catalog/taxonomy';

export interface ModuleBase {
  id: ModuleId;
  color: string; // token CSS
}
// As cinco cores são uma família do campo quente do estilo Campo, com duas âncoras frias para
// as áreas se distinguirem entre si. Definidas como tokens em src/index.css, nos dois temas.
export const MODULE_LIST: ModuleBase[] = [
  { id: 'theory', color: 'var(--area-1)' },
  { id: 'technique', color: 'var(--area-2)' },
  { id: 'perception.melodic', color: 'var(--area-3)' },
  { id: 'perception.harmonic', color: 'var(--area-4)' },
  { id: 'perception.rhythmic', color: 'var(--area-5)' },
];

export type Instrument = 'piano' | 'violao' | 'baixo';
export const INSTRUMENTS: { id: Instrument }[] = [
  { id: 'piano' },
  { id: 'violao' },
  { id: 'baixo' },
];

/**
 * Os objetivos do perfil são as **portas** (decisão 20). O id é o da porta, e a lista mora em
 * `src/catalog/portas.ts` com os itens de cada uma; aqui fica só o apelido do tipo, para o estado
 * guardado não precisar importar o catálogo.
 *
 * Os sete objetivos antigos (*improvisar, harmonia, tirar-de-ouvido, ler-partitura, agilidade, jazz,
 * repertorio*) saíram: eram de antes da decisão 20, alimentavam o gerador de sessão que já não
 * existe, e nenhum deles tinha itens declarados atrás de si. Quem os tinha salvos no navegador os
 * perde na migração — de propósito, porque mapeá-los para portas seria inventar uma escolha que a
 * pessoa não fez.
 */
export type { PortaId as GoalId } from '../catalog/portas';
