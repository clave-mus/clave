// "Publicado": quem decide o que as pessoas veem (decisão 91).
//
// A decisão 51 diz que *tarefa delegada constrói o motor e a fiação; publicar a família é passo
// humano do Paulo.* Até aqui isso era só um acordo — nada no código o fazia valer: todo item
// declarado aparecia no catálogo. Quando três colegas puserem as suas IAs para construir itens, o
// acordo não segura. Este módulo é o que segura.
//
// **Três estados, e o terceiro existe por honestidade:**
//
//   rascunho   construído, ainda não revisado. **Escondido** de quem usa. É o que se declara por
//              padrão: omitir `publicacao` num item novo é o mesmo que `rascunho`, de propósito.
//   legado     já estava no app antes deste portão existir. **Visível**, mas **sem revisão formal**
//              — a revisão de ambiguidade (F6-7) ainda está pendente. Dizer "publicado" seria
//              afirmar uma revisão que não aconteceu.
//   publicado  revisado pelo Paulo, com data e nome. Só ele muda um item para cá.
//
// O padrão é o estado MAIS restritivo (rascunho), então esquecer de declarar nunca expõe nada.
export type Publicacao =
  | { estado: 'rascunho' }
  | { estado: 'legado' }
  | { estado: 'publicado'; revisadoEm: string; por: string };

export const RASCUNHO: Publicacao = { estado: 'rascunho' };
export const LEGADO: Publicacao = { estado: 'legado' };

export type EstadoDePublicacao = Publicacao['estado'];

/** O estado de um item. Sem declaração, é rascunho. */
export const estadoDe = (p?: Publicacao): EstadoDePublicacao => p?.estado ?? 'rascunho';

/**
 * A pessoa vê este item?
 *
 * `revisao` é o modo de revisão: quem o liga (o Paulo, os colegas) vê os rascunhos para poder
 * revisá-los. Rascunho nunca aparece sem ele.
 */
export const visivel = (p: Publicacao | undefined, revisao: boolean): boolean => revisao || estadoDe(p) !== 'rascunho';

/** Data no formato `2026-11-03`, que é o que `publicado` exige. */
export const ehDataIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
