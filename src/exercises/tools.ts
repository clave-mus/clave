// Ferramentas para usar com o instrumento (ambientes de estudo, não perguntas).
// Título e descrição ficam nos textos de cada idioma (tools.<id> em src/i18n).
import type { ToolDef } from './types';

export const TOOLS: ToolDef[] = [
  { id: 'metronomo', primaryModule: 'technique', mobile: true, path: '/ferramentas/metronomo' },
  { id: 'ambiente', primaryModule: 'perception.melodic', mobile: false, path: '/ferramentas/ambiente' },
  { id: 'backing', primaryModule: 'perception.harmonic', mobile: false, path: '/ferramentas/backing' },
  { id: 'leitura', primaryModule: 'perception.melodic', mobile: true, path: '/ferramentas/leitura' },
  { id: 'ritmo', primaryModule: 'perception.rhythmic', mobile: true, path: '/ferramentas/ritmo' },
  { id: 'tecnica', primaryModule: 'technique', mobile: false, path: '/ferramentas/tecnica' },
];
export const toolById = Object.fromEntries(TOOLS.map(t => [t.id, t]));
