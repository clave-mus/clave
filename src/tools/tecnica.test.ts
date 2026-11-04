// As rotinas da área de técnica (decisão 81): T1 permutações, T2 ordem das cordas, T5 troca de posição.
// Os geradores têm o seu teste em theory/tecnica.test.ts; aqui é o que cada rotina TOCA.
import { describe, expect, it } from 'vitest';
import { ALCANCE, formaSobAMao, janelaDaMao, ROUTINES } from './tecnica-rotinas';
import { permutacoesDe, gruposDeCordas } from '../theory/tecnica';

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

  it('o root-fifth-octave usa a digitação do Paulo: tônica 1, quinta 2, oitava 4', () => {
    expect(rotina('tqo').build(4, '', 0).slice(0, 4).map(x => x.finger)).toEqual([1, 2, 4, 2]);
  });

  // Tudo na mesma casa é uma pestana, e no baixo pestana não se faz. O exercício é atravessar as
  // cordas, não segurar um acorde.
  it('NÃO põe todas as notas na mesma casa', () => {
    for (const n of [4, 6]) {
      for (const v of r.eixo!.valores(n)) {
        const casas = new Set(r.build(n, v, 0).map(x => x.f));
        expect(casas.size, `${n} cordas, ${v}`).toBeGreaterThan(1);
      }
    }
  });

  it('as casas sobem uma a cada corda do grupo, mantendo a mão numa posição só', () => {
    const volta = r.build(4, '4321', 0).slice(0, 4);
    expect(volta.map(x => x.f)).toEqual([5, 6, 7, 8]);
    expect(Math.max(...volta.map(x => x.f)) - Math.min(...volta.map(x => x.f))).toBe(3);
  });

  it('não diz qual dedo usar — aqui o ponto é a ordem das cordas', () => {
    for (const x of r.build(4, '1234', 0)) expect(x.finger).toBeUndefined();
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



describe('o instrumento certo', () => {
  it('as rotinas novas servem a baixo e violão, não ao piano (não há cordas)', () => {
    for (const id of ['cordas']) expect(rotina(id).for).toEqual(['violao', 'baixo']);
  });
});

// A forma sob a mão (A21). Testada aqui, sem React, porque no navegador o destaque só anda com o
// relógio do áudio rodando — e um teste que depende de áudio real não é teste.
describe('formaSobAMao', () => {
  // Uma sequência que sobe o braço, como a `tqo` faz: casas 3, 5, 7 e depois 10, 12.
  const seq = [
    { s: 0, f: 3 }, { s: 1, f: 5 }, { s: 2, f: 5 },
    { s: 0, f: 10 }, { s: 1, f: 12 }, { s: 2, f: 12 },
  ];

  it('mostra só o que cabe na mão, e não a sequência inteira', () => {
    // Era o bug da primeira versão: 19 círculos na tqo, e o desenho perdido.
    const m = formaSobAMao(seq, 0, false);
    expect(m.map(x => x.f).sort((a, b) => a - b)).toEqual([3, 5, 5]);
  });

  it('e a forma ANDA quando o exercício sobe o braço', () => {
    expect(formaSobAMao(seq, 3, false).map(x => x.f).sort((a, b) => a - b)).toEqual([10, 12, 12]);
  });

  it('a janela tem o alcance da mão, começando uma casa antes da atual', () => {
    expect(janelaDaMao(seq, 0)).toEqual({ from: 2, to: 6 });
    expect(janelaDaMao(seq, 3)).toEqual({ from: 9, to: 13 });
  });

  it('a janela não desce abaixo da casa 0', () => {
    expect(janelaDaMao([{ s: 0, f: 0 }], 0).from).toBe(0);
  });

  // O padrão do `Fretboard` já é `--mu`, então marcar só o destaque deixava tudo da mesma cor.
  // Conferido no navegador antes de virar teste: oito círculos, nenhum distinguível.
  it('exatamente uma casa fica destacada, e as outras têm cor própria', () => {
    const m = formaSobAMao(seq, 1, false);
    expect(m.filter(x => x.color === 'var(--mu)')).toHaveLength(1);
    expect(m.every(x => !!x.color)).toBe(true);
  });

  it('sem posição atual (parado), nenhuma fica destacada', () => {
    expect(formaSobAMao(seq, -1, false).filter(x => x.color === 'var(--mu)')).toHaveLength(0);
  });

  it('a casa repetida na sequência aparece uma vez, e o destaque vence', () => {
    const repetida = [{ s: 0, f: 5 }, { s: 1, f: 5 }, { s: 0, f: 5 }];
    const m = formaSobAMao(repetida, 2, false);
    expect(m).toHaveLength(2);
    expect(m.find(x => x.s === 0)?.color).toBe('var(--mu)');
  });

  // A21: o dedo só aparece onde o dedo É o exercício.
  it('o dedo só entra quando pedido', () => {
    const comDedos = [{ s: 0, f: 5, finger: 1 }, { s: 0, f: 7, finger: 3 }];
    expect(formaSobAMao(comDedos, 0, true).map(x => x.label)).toEqual(['1', '3']);
    expect(formaSobAMao(comDedos, 0, false).every(x => x.label === undefined)).toBe(true);
  });

  // A propriedade que importa não é um número máximo (9 casas numa mão de 5 trastes é uma forma
  // legítima): é que a mão **recorta** a sequência. A primeira versão mostrava tudo, e era isso o bug.
  it('nas rotinas que sobem o braço, a mão recorta — nunca mostra a sequência inteira', () => {
    for (const r of ROUTINES.filter(x => x.for.includes('baixo'))) {
      const s = r.build(4, r.eixo?.valores(4)[0] ?? '', 0);
      const todas = new Set(s.map(p => `${p.s}:${p.f}`)).size;
      const vao = Math.max(...s.map(p => p.f)) - Math.min(...s.map(p => p.f));
      if (vao < ALCANCE) continue; // cabe inteira na mão: aí mostrar tudo está certo
      for (let i = 0; i < s.length; i++) {
        expect(formaSobAMao(s, i, false).length, `${r.id} em ${i}`).toBeLessThan(todas);
      }
    }
  });

  it('e quando a rotina cabe toda na mão, ela aparece toda', () => {
    const curta = [{ s: 0, f: 5 }, { s: 1, f: 6 }, { s: 2, f: 7 }];
    expect(formaSobAMao(curta, 0, false)).toHaveLength(3);
  });
});
