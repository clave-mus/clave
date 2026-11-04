// Contrato dos planos da "tarefa com metrônomo".
//
// Duas propriedades atravessam todos os planos, e são as que justificam existir:
//   1. **toda mudança é avisada um compasso antes** (e só as mudanças);
//   2. nenhum plano tem andamento — o motor nunca sobe o bpm sozinho (decisão 82).
import { describe, expect, it } from 'vitest';
import {
  celulasDoCiclo, planoAcento, planoArticulacao, planoDeslocamento, planoSubdivisao, planoSustentar,
  posicaoNoCiclo, somDaCelula, type Plano,
} from './cadencia';
import { familias, GRADES, modosDistintos, tocaveis } from './deslocamento';

const conta = <T>(xs: T[], f: (x: T) => boolean) => xs.filter(f).length;
const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Todos os planos que o catálogo pode montar, para as propriedades gerais. */
const TODOS: [string, Plano][] = [
  ...[2, 3, 4].flatMap(p => [1, 2, 4].map(n => [`acento ${p}×${n}`, planoAcento(p, n)] as [string, Plano])),
  ...[[2, 3], [2, 3, 4], [1, 2, 3, 4], [4, 2]].flatMap(s => [1, 2, 4].map(n => [`subdivisão ${s} ×${n}`, planoSubdivisao(s, n)] as [string, Plano])),
  ...[1, 2, 4].map(n => [`articulação ×${n}`, planoArticulacao(n)] as [string, Plano]),
  ...[1, 2, 3].map(n => [`sustentar ${n}`, planoSustentar(n)] as [string, Plano]),
  ...GRADES.flatMap(g => tocaveis(g).map(p => [`deslocamento ${g}: ${p}`, planoDeslocamento(p, g)] as [string, Plano])),
];

describe('propriedades de todos os planos', () => {
  it('todo compasso tem exatamente 4 tempos, e porTempo células por tempo', () => {
    for (const [nome, plano] of TODOS) {
      for (const c of plano) expect(c.celulas.length, nome).toBe(4 * c.porTempo);
    }
  });

  // O ponto de T4 e T7: não pegar a pessoa de surpresa.
  it('TODA mudança é avisada no compasso anterior — e só as mudanças', () => {
    for (const [nome, plano] of TODOS) {
      plano.forEach((c, i) => {
        const proximo = plano[(i + 1) % plano.length];
        const muda = !igual(c.agora, proximo.agora);
        expect(!!c.aviso, `${nome}, compasso ${i}: muda=${muda}`).toBe(muda);
      });
    }
  });

  it('nenhum plano carrega andamento (decisão 82) — o bpm é da tela e nunca sobe sozinho', () => {
    for (const [nome, plano] of TODOS) {
      for (const c of plano) expect(Object.keys(c), nome).not.toContain('bpm');
    }
  });

  it('o ciclo é finito e não vazio', () => {
    for (const [nome, plano] of TODOS) {
      expect(plano.length, nome).toBeGreaterThan(0);
      expect(celulasDoCiclo(plano), nome).toBeGreaterThan(0);
    }
  });
});

describe('T3 · deslocamento de acento', () => {
  it('uma rodada por posição, e `compassosPorRodada` compassos em cada', () => {
    expect(planoAcento(4, 2)).toHaveLength(8);
    expect(planoAcento(3, 4)).toHaveLength(12);
  });

  it('o acento cai na posição da rodada, em TODOS os tempos do compasso', () => {
    const plano = planoAcento(4, 1);
    plano.forEach((c, k) => {
      const posicoes = c.celulas.map((x, i) => (x === 'forte' ? i : -1)).filter(i => i >= 0);
      expect(posicoes, `rodada ${k}`).toEqual([k, k + 4, k + 8, k + 12]);
    });
  });

  it('a pessoa toca as mesmas notas: só muda onde está a ênfase, nunca quantas células há', () => {
    const plano = planoAcento(4, 1);
    for (const c of plano) expect(conta(c.celulas, x => x === 'forte')).toBe(4);
  });

  it('o aviso só aparece no último compasso de cada rodada, e aponta para a posição seguinte', () => {
    const plano = planoAcento(3, 2);
    expect(plano.map(c => c.aviso?.vars?.pos)).toEqual([undefined, 2, undefined, 3, undefined, 1]);
  });

  it('a última rodada avisa a primeira — o ciclo fecha', () => {
    expect(planoAcento(4, 1)[3].aviso?.vars?.pos).toBe(1);
  });

  it('recusa grade fora de 2 a 4 e rodada sem compasso', () => {
    for (const g of [1, 5, 2.5]) expect(() => planoAcento(g, 1), String(g)).toThrow(RangeError);
    expect(() => planoAcento(4, 0)).toThrow(RangeError);
  });
});

describe('T4 · subdivisão alternada', () => {
  it('muda a subdivisão a cada rodada, na ordem dada', () => {
    const plano = planoSubdivisao([2, 3, 4], 2);
    expect(plano.map(c => c.porTempo)).toEqual([2, 2, 3, 3, 4, 4]);
  });

  it('o clique da pulsação fica ancorado: o início de cada tempo é forte, em toda subdivisão', () => {
    for (const s of [1, 2, 3, 4]) {
      const [c] = planoSubdivisao([s, s === 1 ? 2 : 1], 1);
      expect(conta(c.celulas, x => x === 'forte'), `sub ${s}`).toBe(4);
      c.celulas.forEach((x, i) => expect(x === 'forte', `sub ${s} célula ${i}`).toBe(i % s === 0));
    }
  });

  it('avisa a subdivisão SEGUINTE, e a última avisa a primeira', () => {
    const plano = planoSubdivisao([2, 3, 4], 1);
    expect(plano.map(c => c.aviso?.chave)).toEqual(['cadence.nextSub_3', 'cadence.nextSub_4', 'cadence.nextSub_2']);
  });

  it('recusa menos de duas, repetidas, fora de 1..4, e rodada sem compasso', () => {
    expect(() => planoSubdivisao([2], 1)).toThrow(RangeError);
    expect(() => planoSubdivisao([], 1)).toThrow(RangeError);
    expect(() => planoSubdivisao([2, 2], 1)).toThrow(RangeError);
    expect(() => planoSubdivisao([2, 5], 1)).toThrow(RangeError);
    expect(() => planoSubdivisao([0, 2], 1)).toThrow(RangeError);
    expect(() => planoSubdivisao([2, 3], 0)).toThrow(RangeError);
  });
});

describe('T7 · legato e staccato alternados', () => {
  it('alterna as duas fases, `compassosPorFase` compassos em cada', () => {
    expect(planoArticulacao(2).map(c => c.agora.chave)).toEqual(['cadence.legato', 'cadence.legato', 'cadence.staccato', 'cadence.staccato']);
  });

  it('avisa a articulação seguinte um compasso antes', () => {
    expect(planoArticulacao(2).map(c => c.aviso?.chave)).toEqual([undefined, 'cadence.nextStaccato', undefined, 'cadence.nextLegato']);
  });

  it('o clique é o mesmo nas duas: o app não ouve como a pessoa toca, só marca o momento da troca', () => {
    const [legato, , staccato] = planoArticulacao(2);
    expect(legato.celulas).toEqual(staccato.celulas);
  });

  it('recusa fase sem compasso', () => {
    expect(() => planoArticulacao(0)).toThrow(RangeError);
  });
});

describe('T6 · sustentar e cortar', () => {
  it.each([[1, ['ataque', 'corte', 'silencio', 'silencio']], [2, ['ataque', 'segura', 'corte', 'silencio']], [3, ['ataque', 'segura', 'segura', 'corte']]])(
    'segurar %i tempo(s)', (n, esperado) => {
      expect(planoSustentar(n)[0].celulas).toEqual(esperado);
    });

  it('a distância do ataque ao corte é EXATAMENTE o número de tempos pedido', () => {
    for (const n of [1, 2, 3]) {
      const c = planoSustentar(n)[0].celulas;
      expect(c.indexOf('corte') - c.indexOf('ataque'), `segurar ${n}`).toBe(n);
    }
  });

  it('um ataque, um corte, e `n − 1` células de sustentação', () => {
    for (const n of [1, 2, 3]) {
      const c = planoSustentar(n)[0].celulas;
      expect(conta(c, x => x === 'ataque')).toBe(1);
      expect(conta(c, x => x === 'corte')).toBe(1);
      expect(conta(c, x => x === 'segura')).toBe(n - 1);
    }
  });

  it('o texto diz o tempo em que se corta (segurar n → cortar no n + 1)', () => {
    expect(planoSustentar(2)[0].agora.vars).toEqual({ count: 2, cut: 3 });
  });

  it('recusa 0 e 4 — a nota precisa cortar DENTRO do compasso', () => {
    for (const n of [0, 4, -1, 1.5]) expect(() => planoSustentar(n), String(n)).toThrow(RangeError);
  });
});

describe('T8 · deslocamento de padrão rítmico (decisão 83)', () => {
  it('o ataque cai exatamente nas posições do padrão, em TODOS os quatro tempos', () => {
    const [c] = planoDeslocamento([0, 3], 4);
    const ataques = c.celulas.map((x, i) => (x === 'ataque' ? i : -1)).filter(i => i >= 0);
    expect(ataques).toEqual([0, 3, 4, 7, 8, 11, 12, 15]);
  });

  it('o primeiro tempo da célula ancora a pulsação mesmo quando o padrão não ataca nele', () => {
    const [c] = planoDeslocamento([1, 2], 4);
    expect(c.celulas.slice(0, 4)).toEqual(['normal', 'ataque', 'ataque', 'silencio']);
  });

  // A garantia da decisão 83, agora no plano: cada modo distinto produz um compasso DIFERENTE, e
  // modos iguais não aparecem duas vezes — o app nunca faz a mesma pergunta duas vezes.
  it('cada modo distinto de cada família dá um compasso diferente, em todas as grades', () => {
    for (const grade of GRADES) {
      for (const familia of familias(grade)) {
        const compassos = modosDistintos(familia, grade).map(m => JSON.stringify(planoDeslocamento(m, grade)[0].celulas));
        expect(new Set(compassos).size, `grade ${grade}`).toBe(compassos.length);
      }
    }
  });

  it('a pulsação nunca some: a primeira célula de todo tempo soa, para qualquer um dos 15 padrões', () => {
    for (const grade of GRADES) {
      for (const p of tocaveis(grade)) {
        const [c] = planoDeslocamento(p, grade);
        for (let t = 0; t < 4; t++) expect(c.celulas[t * grade], `${grade}: ${p}`).not.toBe('silencio');
      }
    }
  });
});

describe('posicaoNoCiclo', () => {
  const plano = planoSubdivisao([2, 3], 1); // 8 células, depois 12

  it('reconstrói a sequência de células do ciclo, repetida', () => {
    const esperado = plano.flatMap(c => c.celulas);
    const obtido = Array.from({ length: celulasDoCiclo(plano) * 2 }, (_, i) => {
      const p = posicaoNoCiclo(plano, i);
      return plano[p.compasso].celulas[p.celula];
    });
    expect(obtido).toEqual([...esperado, ...esperado]);
  });

  it('marca o início de cada compasso — é onde o executor troca a subdivisão do relógio', () => {
    const inicios = Array.from({ length: celulasDoCiclo(plano) }, (_, i) => i).filter(i => posicaoNoCiclo(plano, i).inicioDeCompasso);
    expect(inicios).toEqual([0, 8]);
  });

  it('marca o início de cada tempo conforme a subdivisão do compasso em que está', () => {
    expect(posicaoNoCiclo(plano, 2).inicioDeTempo).toBe(true);   // colcheias: 0, 2, 4, 6
    expect(posicaoNoCiclo(plano, 3).inicioDeTempo).toBe(false);
    expect(posicaoNoCiclo(plano, 8 + 3).inicioDeTempo).toBe(true);  // tercinas: 0, 3, 6, 9
    expect(posicaoNoCiclo(plano, 8 + 4).inicioDeTempo).toBe(false);
  });

  it('o ciclo volta ao começo, e índice negativo não quebra', () => {
    const total = celulasDoCiclo(plano);
    expect(posicaoNoCiclo(plano, total)).toEqual(posicaoNoCiclo(plano, 0));
    expect(posicaoNoCiclo(plano, -1)).toEqual(posicaoNoCiclo(plano, total - 1));
  });
});

describe('somDaCelula', () => {
  it('silêncio não soa', () => {
    expect(somDaCelula('silencio', true)).toBeNull();
    expect(somDaCelula('silencio', false)).toBeNull();
  });

  it('acento e ataque são o clique mais forte, mais alto que o normal', () => {
    const forte = somDaCelula('forte', true)!;
    expect(somDaCelula('ataque', true)).toEqual(forte);
    expect(forte.volume).toBeGreaterThan(somDaCelula('normal', true)!.volume);
  });

  it('o corte soa diferente de todo o resto — é o que a pessoa precisa ouvir para cortar no tempo', () => {
    const corte = somDaCelula('corte', true)!;
    for (const c of ['forte', 'normal', 'ataque', 'segura'] as const) expect(somDaCelula(c, true)!.drum).not.toBe(corte.drum);
  });

  it('a subdivisão é mais baixa que o início do tempo', () => {
    expect(somDaCelula('normal', false)!.volume).toBeLessThan(somDaCelula('normal', true)!.volume);
  });

  it('sustentar é um sussurro: a nota continua soando, e o clique não pode competir', () => {
    expect(somDaCelula('segura', true)!.volume).toBeLessThan(somDaCelula('normal', true)!.volume);
  });
});
