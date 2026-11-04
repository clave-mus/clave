import { describe, expect, it } from 'vitest';
import { mesmoColar, montarPadrao, PADRAO_DEFS, PADROES, padroesUsaveis, rotacoesDoColar, vaoDeclarado } from './padroes';
import type { PadraoDef } from './padroes';

// A clave de son escrita nas DUAS convenções que a decisão 103 comparou. Nenhuma das duas está
// declarada no app: elas existem aqui como caso de teste do motor, que é o que o portão permite.
const SON_DOIS_COMPASSOS: PadraoDef = {
  id: 'teste-son-2c', compasso: '4/4', compassos: 2, grade: '8',
  pattern: 'q. q. h q h', origem: 'Cuba', fonte: 'caso de teste, não é declaração',
};
const SON_UM_COMPASSO: PadraoDef = {
  id: 'teste-son-1c', compasso: '4/4', compassos: 1, grade: '16',
  pattern: '8. 8. q 8 q', origem: 'Cuba', fonte: 'caso de teste, não é declaração',
};

describe('o vão é propriedade do padrão (decisão 103)', () => {
  it('a mesma clave fecha em um compasso com grade de semicolcheia e em dois com grade de colcheia', () => {
    for (const d of [SON_UM_COMPASSO, SON_DOIS_COMPASSOS]) {
      expect(montarPadrao(d).span, d.id).toBe(vaoDeclarado(d));
    }
  });

  // É o ponto inteiro da decisão: as duas grafias dão o MESMO colar, e é por isso que escolher uma
  // convenção global seria arbitrário — o que muda é onde cai a pulsação, não o padrão.
  it('e as duas dão os mesmos intervalos: 3 3 4 2 4', () => {
    for (const d of [SON_UM_COMPASSO, SON_DOIS_COMPASSOS]) {
      expect(montarPadrao(d).intervalos, d.id).toEqual([3, 3, 4, 2, 4]);
    }
  });

  it('recusa padrão que não fecha o vão declarado — colar fora de fase é erro, não tolerância', () => {
    expect(() => montarPadrao({ ...SON_UM_COMPASSO, compassos: 2 })).toThrow(/declara 2 compasso/);
    expect(() => montarPadrao({ ...SON_DOIS_COMPASSOS, compassos: 1 })).toThrow(/declara 1 compasso/);
  });

  it('recusa ataque fora da grade declarada', () => {
    // `8. 8. q 8 q` tem ataques em semicolcheias ímpares; numa grade de colcheia, não cabem.
    expect(() => montarPadrao({ ...SON_UM_COMPASSO, grade: '8' })).toThrow(/fora da grade|múltiplo da grade/);
  });

  it('conta as casas da grade, e não os ticks', () => {
    expect(montarPadrao(SON_UM_COMPASSO).casas).toBe(16);
    expect(montarPadrao(SON_DOIS_COMPASSOS).casas).toBe(16);
  });

  it('os intervalos fecham o colar: somam as casas', () => {
    for (const d of [SON_UM_COMPASSO, SON_DOIS_COMPASSOS]) {
      const p = montarPadrao(d);
      expect(p.intervalos.reduce((a, b) => a + b, 0), d.id).toBe(p.casas);
    }
  });
});

// A afirmação já estava escrita em `docs/tarefas/F6-exercicios.md`; aqui ela passa a ser executável.
describe('son e rumba são colares diferentes, não modos do mesmo', () => {
  const son = [3, 3, 4, 2, 4];
  const rumba = [3, 4, 3, 2, 4];

  it('as cinco rotações da de son são 33424, 34243, 42433, 24334 e 43342', () => {
    expect(rotacoesDoColar(son).map(r => r.join(''))).toEqual(['33424', '34243', '42433', '24334', '43342']);
  });

  it('e a de rumba NÃO está entre elas', () => {
    expect(mesmoColar(son, rumba)).toBe(false);
  });

  it('mas cada colar é rotação de si mesmo', () => {
    for (const c of [son, rumba]) for (const r of rotacoesDoColar(c)) expect(mesmoColar(c, r)).toBe(true);
  });

  it('colares de tamanhos diferentes nunca são o mesmo', () => {
    expect(mesmoColar(son, [3, 3, 2])).toBe(false);
  });
});

// Este é o teste que impede alguém (inclusive uma IA) de encher o arquivo e achar que publicou.
describe('o portão da decisão 85', () => {
  it('nenhum padrão está declarado: o que falta é o revisor de tradição, não código', () => {
    expect(PADRAO_DEFS).toEqual([]);
    expect(PADROES).toEqual([]);
  });

  it('padrão sem revisão de tradição não chega a quem usa, mesmo com fonte', () => {
    const comFonte = montarPadrao(SON_UM_COMPASSO);
    expect(padroesUsaveis([comFonte])).toEqual([]);
  });

  it('padrão com fonte vazia não chega, mesmo revisado', () => {
    const revisado = montarPadrao({ ...SON_UM_COMPASSO, fonte: '  ', revisao: { por: 'alguém', em: '2026-11-03' } });
    expect(padroesUsaveis([revisado])).toEqual([]);
  });

  it('com fonte e revisão, passa — é o caminho que o item vai usar quando houver revisor', () => {
    const pronto = montarPadrao({ ...SON_UM_COMPASSO, revisao: { por: 'quem conhece a tradição', em: '2026-11-03' } });
    expect(padroesUsaveis([pronto]).map(p => p.id)).toEqual(['teste-son-1c']);
  });
});
