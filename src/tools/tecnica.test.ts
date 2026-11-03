// As rotinas da área de técnica (decisão 81): T1 permutações, T2 ordem das cordas, T5 troca de posição.
// Os geradores têm o seu teste em theory/tecnica.test.ts; aqui é o que cada rotina TOCA.
import { describe, expect, it } from 'vitest';
import { ROUTINES } from './tecnica-rotinas';
import { permutacoesDe, trocasDePosicao, codificarTroca, casasDaTroca } from '../theory/tecnica';

const rotina = (id: string) => ROUTINES.find(r => r.id === id)!;

describe('T1 · permutações de dedos', () => {
  const r = rotina('permutacoes');

  it('toca a ordem pedida, na casa em que o dedo f mora (5 + f − 1)', () => {
    const notas = r.build(4, '2413').slice(0, 4);
    expect(notas.map(n => n.finger)).toEqual([2, 4, 1, 3]);
    expect(notas.map(n => n.f)).toEqual([6, 8, 5, 7]);
  });

  it('sobe todas as cordas e desce de volta', () => {
    const seq = r.build(4, '1234');
    expect(seq).toHaveLength(32);
    expect(seq.slice(0, 4).every(n => n.s === 0)).toBe(true);
    expect(seq.slice(-4).every(n => n.s === 0)).toBe(true);
  });

  it('os 24 valores do eixo são as 24 permutações', () => {
    expect(r.eixo?.valores(4)).toEqual(permutacoesDe(4));
  });
});

describe('T2 · ordem das cordas', () => {
  const r = rotina('cordas');

  it('atravessa as cordas NA ORDEM pedida: "4 2 3 1" começa na mais grave e termina na mais aguda', () => {
    const volta = r.build(4, '4231').slice(0, 4).map(n => n.s);
    expect(volta).toEqual([0, 2, 1, 3]);
  });

  it('toca cada corda exatamente uma vez por volta, e repete a volta', () => {
    const seq = r.build(4, '3142');
    expect(seq).toHaveLength(8);
    expect(new Set(seq.slice(0, 4).map(n => n.s)).size).toBe(4);
    expect(seq.slice(0, 4)).toEqual(seq.slice(4));
  });

  it('o eixo acompanha o número de cordas: 24 no baixo de quatro, 720 na guitarra de seis', () => {
    expect(r.eixo?.valores(4)).toHaveLength(24);
    expect(r.eixo?.valores(6)).toHaveLength(720);
  });

  it('toda ordem do eixo gera uma sequência válida, em qualquer número de cordas', () => {
    for (const n of [4, 6]) {
      for (const v of r.eixo!.valores(n)) {
        const seq = r.build(n, v);
        expect(seq.every(x => x.s >= 0 && x.s < n), `${n} cordas, ${v}`).toBe(true);
      }
    }
  });

  it('um valor de outro número de cordas não quebra: descarta o que não existe', () => {
    expect(() => r.build(4, '615243')).not.toThrow();
    expect(r.build(4, '615243').every(x => x.s >= 0 && x.s < 4)).toBe(true);
  });
});

describe('T5 · troca de posição', () => {
  const r = rotina('troca');

  it('desliza com o dedo pedido, da casa de saída para a de chegada', () => {
    const notas = r.build(4, '5-8-2').slice(0, 2);
    const { de, para } = casasDaTroca({ de: 5, para: 8, dedo: 2 });
    expect(notas.map(n => n.f)).toEqual([de, para]);
    expect(notas.every(n => n.finger === 2)).toBe(true);
  });

  it('é o MESMO dedo nas duas casas — é isso que faz ser um deslize e não uma troca de dedo', () => {
    for (const v of r.eixo!.valores(4)) {
      const seq = r.build(4, v);
      expect(new Set(seq.map(n => n.finger)).size, v).toBe(1);
    }
  });

  it('todas as 88 trocas tocam só casas que existem', () => {
    const valores = r.eixo!.valores(4);
    expect(valores).toHaveLength(88);
    for (const v of valores) for (const n of r.build(4, v)) expect(n.f, v).toBeGreaterThanOrEqual(1);
  });

  it('passa por todas as cordas', () => {
    expect(new Set(r.build(4, '5-8-1').map(n => n.s))).toEqual(new Set([0, 1, 2, 3]));
  });

  it('valor ilegível cai na primeira troca em vez de quebrar', () => {
    const primeira = codificarTroca(trocasDePosicao()[0]);
    expect(r.build(4, 'lixo')).toEqual(r.build(4, primeira));
  });
});

describe('o instrumento certo', () => {
  it('as rotinas novas servem a baixo e violão, não ao piano (não há cordas)', () => {
    for (const id of ['cordas', 'troca']) expect(rotina(id).for).toEqual(['violao', 'baixo']);
  });
});
