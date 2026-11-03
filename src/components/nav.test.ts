import { describe, expect, it } from 'vitest';
import { NAV, REDIRECTS } from './nav';
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
      ['/comunidade', '/estudar', '/mentor', '/progresso', '/rotinas', '/treinar'],
    );
  });

  it('nenhum redirecionamento aponta para si mesmo', () => {
    for (const [from, to] of Object.entries(REDIRECTS)) expect(from).not.toBe(to);
  });
});
