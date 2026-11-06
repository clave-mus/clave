// Navegação principal (decisão 20b): Praticar · Catálogo · Perfil.
//
// Três abas porque o Clave faz três coisas: praticar, encontrar e configurar.
// - "Rotinas" não é aba: as rotinas SÃO a Praticar.
// - "Teoria" não é aba: as notas curtas moram dentro dos exercícios.
// - "Progresso" não é aba (decisão 11): mora no Perfil, em /perfil/historico.
// O afinador será atalho no cabeçalho, não aba — uso de 30 segundos (tarefa F5-2).
import type { MessageKey } from '../i18n';

export interface NavItem {
  to: string;
  label: MessageKey;
  icon: 'praticar' | 'catalogo' | 'perfil';
  end?: boolean;
}

export const NAV: NavItem[] = [
  { to: '/', label: 'nav.practice', icon: 'praticar', end: true },
  { to: '/catalogo', label: 'nav.catalog', icon: 'catalogo' },
  { to: '/perfil', label: 'nav.profile', icon: 'perfil' },
];

/** Endereços antigos que ainda chegam de link salvo, e para onde eles vão agora. */
export const REDIRECTS: Record<string, string> = {
  '/treinar': '/catalogo',
  '/progresso': '/perfil/historico',
  '/rotinas': '/',
  '/comunidade': '/',
  '/mentor': '/',
};

/**
 * Para onde vai um endereço legado de item, **levando a query e o âncora junto**.
 *
 * O redirecionamento antigo reescrevia só o `pathname` e descartava `?...` e `#...`. Em silêncio:
 * quem abria um link salvo caía no item certo, mas sem os parâmetros que o link carregava — e
 * ninguém via erro nenhum. Vale para qualquer `/treinar/...` ou `/ferramentas/...` guardado, não só
 * para o antigo "copiar link".
 */
export function reescreverRotaLegada(loc: { pathname: string; search: string; hash: string }, from: string): string {
  return loc.pathname.replace(from, '/catalogo/') + loc.search + loc.hash;
}
