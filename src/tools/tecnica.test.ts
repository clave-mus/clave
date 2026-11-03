// As rotinas da área de técnica (decisão 81): T1 permutações, T2 ordem das cordas, T5 troca de posição.
// Os geradores têm o seu teste em theory/tecnica.test.ts; aqui é o que cada rotina TOCA.
import { describe, expect, it } from 'vitest';
import { ROUTINES } from './tecnica-rotinas';
import { permutacoesDe, trocasDePosicao, codificarTroca, casasDaTroca, gruposDeCordas } from '../theory/tecnica';

const rotina = (id: string) => ROUTINES.find(r => r.id === id)!;

describe('T1 · permutações de dedos', () => {
  const r = rotina('permutacoes');

  it('toca a ordem pedida, na casa em que o dedo f mora (5 + f − 1)', () => {
    const notas = r.build(4, '2413', 0).slice(0, 4);
    expect(notas.map(n => n.finger)).toEqual([2, 4, 1, 3]);
    expect(notas.map(n => n.f)).toEqual([6, 8, 5, 7]);
  });

  it('sobe todas as cordas e desce de volta', () => {
    const seq = r.build(4, '1234', 0);
    expect(seq).toHaveLength(32);
    expect(seq.slice(0, 4).every(n => n.s === 0)).toBe(true);
    expect(seq.slice(-4).every(n => n.s === 0)).toBe(true);
  });

  it('os 24 valores do eixo são as 24 permutações', () => {
    expect(r.eixo?.valores(4)).toEqual(permutacoesDe(4));
  });
});

describe('T2 · ordem das cordas (sempre quatro cordas vizinhas)', () => {
  const r = rotina('cordas');

  it('atravessa as cordas NA ORDEM pedida: "4 2 3 1" começa na mais grave do grupo e termina na mais aguda', () => {
    expect(r.build(4, '4231', 0).slice(0, 4).map(n => n.s)).toEqual([0, 2, 1, 3]);
  });

  it('toca cada corda do grupo exatamente uma vez por volta, e repete a volta', () => {
    const seq = r.build(4, '3142', 0);
    expect(seq).toHaveLength(8);
    expect(new Set(seq.slice(0, 4).map(n => n.s)).size).toBe(4);
    expect(seq.slice(0, 4)).toEqual(seq.slice(4));
  });

  // O ponto desta mudança: são 24 ordens em QUALQUER instrumento. Com as seis cordas seriam 720, e o
  // contador de "já vi" perderia o sentido.
  it('são 24 ordens no baixo de quatro E na guitarra de seis', () => {
    for (const n of [4, 5, 6]) expect(r.eixo!.valores(n), `${n} cordas`).toHaveLength(24);
  });

  it('o grupo escolhido manda: o mesmo "4 2 3 1" cai em cordas diferentes em cada grupo da guitarra', () => {
    expect(r.build(6, '4231', 0).slice(0, 4).map(n => n.s)).toEqual([0, 2, 1, 3]);
    expect(r.build(6, '4231', 1).slice(0, 4).map(n => n.s)).toEqual([1, 3, 2, 4]);
    expect(r.build(6, '4231', 2).slice(0, 4).map(n => n.s)).toEqual([2, 4, 3, 5]);
  });

  it('toda ordem, em todo grupo de todo instrumento, usa exatamente QUATRO cordas vizinhas', () => {
    for (const n of [4, 5, 6]) {
      for (let g = 0; g < gruposDeCordas(n); g++) {
        for (const v of r.eixo!.valores(n)) {
          const cordas = [...new Set(r.build(n, v, g).map(x => x.s))].sort((a, b) => a - b);
          expect(cordas, `${n} cordas, grupo ${g}, ${v}`).toEqual([g, g + 1, g + 2, g + 3]);
        }
      }
    }
  });

  it('um grupo que não existe é preso ao último, sem sair do braço', () => {
    expect(r.build(4, '1234', 5).every(x => x.s >= 0 && x.s < 4)).toBe(true);
    expect(r.build(6, '1234', 99).every(x => x.s >= 2 && x.s < 6)).toBe(true);
  });

  it('um valor ilegível ou de outro tamanho não quebra', () => {
    expect(() => r.build(6, '615243', 0)).not.toThrow();
    expect(r.build(6, '615243', 0).every(x => x.s >= 0 && x.s < 4)).toBe(true);
  });

  it('declara que trabalha com grupos de cordas', () => {
    expect(r.grupos).toBe(true);
    for (const outra of ROUTINES.filter(x => x.id !== 'cordas')) expect(outra.grupos, outra.id).toBeUndefined();
  });
});

describe('T5 · troca de posição', () => {
  const r = rotina('troca');

  it('desliza com o dedo pedido, da casa de saída para a de chegada', () => {
    const notas = r.build(4, '5-8-2', 0).slice(0, 2);
    const { de, para } = casasDaTroca({ de: 5, para: 8, dedo: 2 });
    expect(notas.map(n => n.f)).toEqual([de, para]);
    expect(notas.every(n => n.finger === 2)).toBe(true);
  });

  it('é o MESMO dedo nas duas casas — é isso que faz ser um deslize e não uma troca de dedo', () => {
    for (const v of r.eixo!.valores(4)) {
      const seq = r.build(4, v, 0);
      expect(new Set(seq.map(n => n.finger)).size, v).toBe(1);
    }
  });

  it('todas as 88 trocas tocam só casas que existem', () => {
    const valores = r.eixo!.valores(4);
    expect(valores).toHaveLength(88);
    for (const v of valores) for (const n of r.build(4, v, 0)) expect(n.f, v).toBeGreaterThanOrEqual(1);
  });

  it('passa por todas as cordas', () => {
    expect(new Set(r.build(4, '5-8-1', 0).map(n => n.s))).toEqual(new Set([0, 1, 2, 3]));
  });

  it('valor ilegível cai na primeira troca em vez de quebrar', () => {
    const primeira = codificarTroca(trocasDePosicao()[0]);
    expect(r.build(4, 'lixo', 0)).toEqual(r.build(4, primeira, 0));
  });
});

describe('o instrumento certo', () => {
  it('as rotinas novas servem a baixo e violão, não ao piano (não há cordas)', () => {
    for (const id of ['cordas', 'troca']) expect(rotina(id).for).toEqual(['violao', 'baixo']);
  });
});
