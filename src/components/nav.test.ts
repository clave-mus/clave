import { describe, expect, it } from 'vitest';
import { NAV, REDIRECTS, reescreverRotaLegada } from './nav';
import pt from '../i18n/pt';

describe('navegação', () => {
  it('tem três abas: Praticar · Catálogo · Perfil (decisão 20b)', () => {
    expect(NAV.map(i => i.icon)).toEqual(['praticar', 'catalogo', 'perfil']);
  });

  it('a primeira aba é a raiz, e só ela casa exatamente', () => {
    expect(NAV[0].to).toBe('/');
    expect(NAV[0].end).toBe(true);
    expect(NAV.slice(1).every(i => !i.end)).toBe(true);
  });

  it('não traz de volta aba de progresso, rotinas, comunidade ou mentor', () => {
    const paths = NAV.map(i => i.to);
    expect(paths).not.toContain('/progresso');
    expect(paths).not.toContain('/rotinas');
    expect(paths).not.toContain('/comunidade');
    expect(paths).not.toContain('/mentor');
  });

  it('todo rótulo existe nos textos', () => {
    for (const item of NAV) {
      const [ns, key] = item.label.split('.') as ['nav', keyof typeof pt.nav];
      expect(pt[ns][key]).toBeTruthy();
    }
  });
});

describe('endereços antigos', () => {
  it('cada um aponta para uma rota que existe hoje', () => {
    const current = new Set([...NAV.map(i => i.to), '/perfil/historico']);
    for (const to of Object.values(REDIRECTS)) expect(current.has(to)).toBe(true);
  });

  it('cobre tudo que saiu da navegação', () => {
    expect(Object.keys(REDIRECTS).sort()).toEqual(
      ['/comunidade', '/mentor', '/progresso', '/rotinas', '/treinar'],
    );
  });

  it('nenhum redirecionamento aponta para si mesmo', () => {
    for (const [from, to] of Object.entries(REDIRECTS)) expect(from).not.toBe(to);
  });
});

describe('reescreverRotaLegada', () => {
  const loc = (pathname: string, search = '', hash = '') => ({ pathname, search, hash });

  it('troca o prefixo antigo pelo novo', () => {
    expect(reescreverRotaLegada(loc('/treinar/pauta-nota'), '/treinar/')).toBe('/catalogo/pauta-nota');
    expect(reescreverRotaLegada(loc('/ferramentas/tecnica'), '/ferramentas/')).toBe('/catalogo/tecnica');
  });

  // O bug: o redirecionamento reescrevia só o pathname, e o link chegava no item certo mas sem os
  // parâmetros que carregava — em silêncio, sem erro nenhum.
  it('leva a query junto', () => {
    expect(reescreverRotaLegada(loc('/treinar/pauta-nota', '?c=abc%3D'), '/treinar/')).toBe('/catalogo/pauta-nota?c=abc%3D');
  });

  it('leva o âncora junto', () => {
    expect(reescreverRotaLegada(loc('/ferramentas/tecnica', '', '#topo'), '/ferramentas/')).toBe('/catalogo/tecnica#topo');
  });

  it('leva os dois, na ordem em que um endereço os escreve', () => {
    expect(reescreverRotaLegada(loc('/treinar/x', '?a=1&b=2', '#h'), '/treinar/')).toBe('/catalogo/x?a=1&b=2#h');
  });

  it('sem query nem âncora, não acrescenta nada', () => {
    expect(reescreverRotaLegada(loc('/treinar/x'), '/treinar/')).toBe('/catalogo/x');
  });
});
