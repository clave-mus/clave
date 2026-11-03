// Como o histórico descreve uma atividade: "Fá maior · Média · 80 bpm".
//
// Função pura, para poder ser testada. Antes morava dentro do Progresso e tinha dois defeitos que só
// apareciam na tela: escrevia a tonalidade com `pcName` (que devolve "Lá♯/Si♭") e o modo CRU
// ("maior", mesmo com a interface em inglês); e mostrava o `tempo` global como se fosse o praticado.
import { resumoDaPratica } from '../catalog/resumo';
import type { Ctx } from '../catalog/types';
import type { ActivityParams } from './store';

export function descreverAtividade(snapshot: ActivityParams | undefined, ctx: Pick<Ctx, 't' | 'naming'>): string {
  if (!snapshot) return '';
  const { key, range, material } = snapshot.params ?? {};
  const partes = [resumoDaPratica({ key, range, material }, ctx)];
  // Andamento só quando a ferramenta o GRAVOU. Informação neutra, nunca placar (decisões 10 e 82).
  const bpm = snapshot.settings?.bpm;
  if (typeof bpm === 'number') partes.push(`${bpm} bpm`);
  return partes.filter(Boolean).join(' · ');
}
