// As cinco famílias declaradas sobre o motor. O que se prova aqui: nenhuma combinação de controles
// que a tela permite monta um plano inválido, e os planos obedecem ao que cada controle promete.
import { describe, expect, it } from 'vitest';
import { FAMILIAS, valoresPadrao, type Familia, type Valores } from './cadencia-familias';
import { celulasDoCiclo } from '../theory/cadencia';
import { familias, GRADES, modosDistintos } from '../theory/deslocamento';

/** Todas as combinações de valores que a tela deixa escolher, controle por controle. */
function combinacoes(f: Familia): Valores[] {
  let todas: Valores[] = [valoresPadrao(f)];
  // os controles dependem dos valores (a família do deslocamento depende da grade): expande em largura
  for (let rodada = 0; rodada < 3; rodada++) {
    const proximas: Valores[] = [];
    for (const v of todas) {
      for (const c of f.controles(v)) {
        if (c.multi) {
          // todos os subconjuntos, inclusive o vazio e o de um só: a tela deixa marcar qualquer um
          const ids = c.opcoes.map(o => o.id);
          for (let m = 0; m < 1 << ids.length; m++) proximas.push({ ...v, [c.id]: ids.filter((_, i) => m & (1 << i)) });
        } else {
          for (const o of c.opcoes) proximas.push({ ...v, [c.id]: o.id });
        }
      }
    }
    todas = [...todas, ...proximas];
  }
  const vistos = new Set<string>();
  return todas.filter(v => !vistos.has(JSON.stringify(v)) && vistos.add(JSON.stringify(v)));
}

describe.each(Object.values(FAMILIAS))('$id', f => {
  const todas = combinacoes(f);

  it('o padrão monta um plano válido, sem problema', () => {
    const v = valoresPadrao(f);
    expect(f.problema?.(v) ?? null).toBeNull();
    const eixo = f.eixo?.(v);
    expect(celulasDoCiclo(f.plano(v, eixo?.valores[0]))).toBeGreaterThan(0);
  });

  it('toda combinação que a tela deixa escolher: ou tem `problema` explicado, ou monta um plano válido', () => {
    expect(todas.length).toBeGreaterThan(1);
    for (const v of todas) {
      const problema = f.problema?.(v) ?? null;
      if (problema) { expect(problema, JSON.stringify(v)).toMatch(/^cadence\./); continue; }
      const eixo = f.eixo?.(v);
      const valores = eixo ? eixo.valores : [undefined];
      for (const e of valores) {
        expect(() => f.plano(v, e), JSON.stringify(v)).not.toThrow();
        const plano = f.plano(v, e);
        for (const c of plano) expect(c.celulas.length, JSON.stringify(v)).toBe(4 * c.porTempo);
      }
    }
  });

  it('o padrão não é compartilhado entre instâncias — mexer num não mexe no seguinte', () => {
    const a = valoresPadrao(f);
    for (const k of Object.keys(a)) a[k] = Array.isArray(a[k]) ? ['x'] : 'x';
    expect(valoresPadrao(f)).toEqual(f.padroes);
  });
});

describe('subdivisão alternada', () => {
  const f = FAMILIAS['subdivisao-alternada'];

  it('menos de duas subdivisões marcadas é um problema explicado — a tela não tenta montar o plano', () => {
    for (const subs of [[], ['3']]) expect(f.problema?.({ ...valoresPadrao(f), subs })).toBe('cadence.needTwo');
  });

  it('a ordem em que foram marcadas não importa: sempre da mais lenta para a mais rápida', () => {
    const a = f.plano({ subs: ['4', '2', '3'], compassos: '1' });
    const b = f.plano({ subs: ['2', '3', '4'], compassos: '1' });
    expect(a).toEqual(b);
    expect(a.map(c => c.porTempo)).toEqual([2, 3, 4]);
  });
});

describe('deslocamento rítmico', () => {
  const f = FAMILIAS['deslocamento-ritmico'];

  it('o eixo tem exatamente os modos distintos da família — a de `x . x .` tem 2, não 4', () => {
    const alternados = familias(4).findIndex(p => p.join() === '0,2');
    expect(f.eixo!({ grade: '4', familia: String(alternados) }).valores).toHaveLength(2);
  });

  it('em toda grade e família, o número de modos do eixo é o de modosDistintos', () => {
    for (const grade of GRADES) {
      familias(grade).forEach((fam, i) => {
        expect(f.eixo!({ grade: String(grade), familia: String(i) }).valores, `${grade}/${i}`).toHaveLength(modosDistintos(fam, grade).length);
      });
    }
  });

  // Trocar a grade muda quantas famílias existem (5 → 2): a escolha antiga não pode apontar para o nada.
  it('uma família que não existe mais na grade nova é presa à última, sem quebrar', () => {
    expect(() => f.eixo!({ grade: '2', familia: '4' })).not.toThrow();
    expect(() => f.plano({ grade: '2', familia: '4' })).not.toThrow();
  });

  it('`normalizar` prende a família ao que existe na grade nova — a tela compara chip a chip', () => {
    expect(f.normalizar!({ grade: '2', familia: '4' })).toEqual({ grade: '2', familia: '1' });
    expect(f.normalizar!({ grade: '4', familia: '2' })).toEqual({ grade: '4', familia: '2' });
    expect(f.normalizar!({ grade: '3', familia: '-3' })).toEqual({ grade: '3', familia: '0' });
  });

  it('depois de normalizar, o valor É uma das opções oferecidas — sempre há um chip marcado', () => {
    for (const grade of GRADES) {
      for (let i = 0; i < 8; i++) {
        const v = f.normalizar!({ grade: String(grade), familia: String(i) });
        const ids = f.controles(v).find(c => c.id === 'familia')!.opcoes.map(o => o.id);
        expect(ids, `${grade}/${i}`).toContain(v.familia);
      }
    }
  });

  it('o plano toca o modo escolhido: o ataque cai onde o eixo diz', () => {
    const v = { grade: '4', familia: '1' }; // `x x . .`
    const eixo = f.eixo!(v);
    const modo = eixo.valores[3]; // um modo que não é o primeiro
    const celulas = f.plano(v, modo)[0].celulas;
    const ataques = celulas.slice(0, 4).map((c, i) => (c === 'ataque' ? i : -1)).filter(i => i >= 0);
    expect(ataques).toEqual(modo.split(',').map(Number));
  });

  it('o eixo mostra o padrão desenhado', () => {
    expect(f.eixo!({ grade: '4', familia: '1' }).mostrar('0,3')).toBe('x . . x');
  });

  it('as famílias oferecidas são desenhos, não chaves de tradução', () => {
    const opcoes = f.controles({ grade: '4', familia: '0' }).find(c => c.id === 'familia')!.opcoes;
    expect(opcoes.map(o => o.texto)).toEqual(['x . . .', 'x x . .', 'x . x .', 'x x x .', 'x x x x']);
  });
});

describe('os controles prometem o que fazem', () => {
  it('acento: a grade escolhida é a do plano', () => {
    expect(FAMILIAS['acento-deslocado'].plano({ porTempo: '3', compassos: '1' }).every(c => c.porTempo === 3)).toBe(true);
  });

  it('sustentar: segurar n corta no tempo n + 1', () => {
    for (const n of [1, 2, 3]) {
      const c = FAMILIAS['sustentar-e-cortar'].plano({ segurar: String(n) })[0].celulas;
      expect(c.indexOf('corte')).toBe(n);
    }
  });

  it('legato e staccato: compassos por fase vale para as duas', () => {
    expect(FAMILIAS['legato-staccato'].plano({ compassos: '4' })).toHaveLength(8);
  });
});
