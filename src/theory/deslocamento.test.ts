// Contrato do enumerador de deslocamento (T8, decisão 83).
//
// O espaço inteiro tem 15 padrões na maior grade, então **tudo aqui é conferido por enumeração
// exaustiva** — não há amostragem, não há aleatório. É a propriedade mais útil desta tarefa.
import { describe, expect, it } from 'vitest';
import {
  canonica, desenho, familias, GRADES, mesmaFamilia, modosDistintos, quantosModos, rodar, tocaveis, valido,
  type Grade, type Padrao,
} from './deslocamento';

const d = (p: Padrao, g: Grade) => desenho(p, g);

describe('o território é finito, e estes são os números', () => {
  // A tabela da decisão 83. Se algum destes números mudar, a decisão mudou junto.
  it.each([
    [2 as Grade, 3, 2],
    [3 as Grade, 7, 3],
    [4 as Grade, 15, 5],
  ])('grade %i: %i padrões tocáveis, %i famílias', (grade, padroes, fams) => {
    expect(tocaveis(grade)).toHaveLength(padroes);
    expect(familias(grade)).toHaveLength(fams);
  });

  it('as cinco famílias de semicolcheia são exatamente estas, e não há uma sexta', () => {
    expect(familias(4).map(p => d(p, 4))).toEqual([
      'x . . .',
      'x x . .',
      'x . x .',
      'x x x .',
      'x x x x',
    ]);
  });

  it('os modos de cada família de semicolcheia batem com a tabela da decisão', () => {
    const esperado: Record<string, number> = {
      'x . . .': 4,
      'x x . .': 4,
      'x . x .': 2, // ← o caso que o módulo existe para acertar
      'x x x .': 4,
      'x x x x': 1,
    };
    for (const p of familias(4)) expect(quantosModos(p, 4), d(p, 4)).toBe(esperado[d(p, 4)]);
  });

  it('a soma dos modos de todas as famílias é o total de padrões tocáveis', () => {
    for (const grade of GRADES) {
      const soma = familias(grade).reduce((n, p) => n + quantosModos(p, grade), 0);
      expect(soma, `grade ${grade}`).toBe(tocaveis(grade).length);
    }
  });
});

describe('simetria: menos modos que posições', () => {
  it('`x . x .` rodado duas vezes volta a ser ele mesmo', () => {
    expect(rodar([0, 2], 4, 2)).toEqual([0, 2]);
  });

  it('o número de modos sempre DIVIDE o tamanho da grade', () => {
    for (const grade of GRADES) {
      for (const p of tocaveis(grade)) {
        expect(grade % quantosModos(p, grade), `grade ${grade}, ${d(p, grade)}`).toBe(0);
      }
    }
  });

  it('nenhum modo listado é igual a outro — é a asserção que impede perguntar duas vezes', () => {
    for (const grade of GRADES) {
      for (const p of tocaveis(grade)) {
        const modos = modosDistintos(p, grade).map(x => d(x, grade));
        expect(new Set(modos).size, `grade ${grade}, ${d(p, grade)}`).toBe(modos.length);
      }
    }
  });
});

describe('o exemplo do Paulo', () => {
  // semicolcheia, pausa de colcheia, semicolcheia: ataques em 0 e 3, preenchendo um tempo.
  const seu: Padrao = [0, 3];

  it('é a família "dois juntos", rodada', () => {
    expect(mesmaFamilia(seu, [0, 1], 4)).toBe(true);
    expect(d(canonica(seu, 4), 4)).toBe('x x . .');
  });

  it('rodar `x x . .` uma vez para a direita chega nele', () => {
    expect(rodar([0, 1], 4, 1)).toEqual([1, 2]);
    expect(rodar([0, 1], 4, 3)).toEqual([0, 3]);
  });

  it('tem quatro modos, e são estes', () => {
    expect(modosDistintos(seu, 4).map(p => d(p, 4))).toEqual([
      'x . . x',
      'x x . .',
      '. x x .',
      '. . x x',
    ]);
  });
});

describe('invariantes de cada operação', () => {
  it('rodar devolve sempre um padrão válido, com os mesmos ataques', () => {
    for (const grade of GRADES) {
      for (const p of tocaveis(grade)) {
        for (let k = -8; k <= 8; k++) {
          const r = rodar(p, grade, k);
          expect(valido(r, grade), `${d(p, grade)} +${k}`).toBe(true);
          expect(r).toHaveLength(p.length);
        }
      }
    }
  });

  it('rodar por `grade` volta ao início', () => {
    for (const grade of GRADES) {
      for (const p of tocaveis(grade)) expect(rodar(p, grade, grade)).toEqual([...p]);
    }
  });

  it('todo padrão é um modo da sua própria família', () => {
    for (const grade of GRADES) {
      for (const p of tocaveis(grade)) {
        const modos = modosDistintos(canonica(p, grade), grade);
        expect(modos.some(x => d(x, grade) === d(p, grade)), `grade ${grade}, ${d(p, grade)}`).toBe(true);
      }
    }
  });

  it('mesmaFamilia é reflexiva, simétrica e parte o espaço exatamente nas famílias', () => {
    for (const grade of GRADES) {
      const todos = tocaveis(grade);
      for (const a of todos) {
        expect(mesmaFamilia(a, a, grade)).toBe(true);
        for (const b of todos) expect(mesmaFamilia(a, b, grade)).toBe(mesmaFamilia(b, a, grade));
      }
      // cada padrão cai em exatamente uma família
      for (const p of todos) {
        expect(familias(grade).filter(f => mesmaFamilia(p, f, grade)), d(p, grade)).toHaveLength(1);
      }
    }
  });
});
