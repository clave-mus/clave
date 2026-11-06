// P9 · a ordenação do ciclo é função pura, testável sem tela.
import { describe, expect, it } from 'vitest';
import { ordenarPorAntiguidade } from './ciclo';
import { novaRotina } from './storage';

describe('ordenarPorAntiguidade', () => {
  it('a mais antiga sem praticar vem primeiro', () => {
    const a = { ...novaRotina('A'), ultimaPraticaEm: 100 };
    const b = { ...novaRotina('B'), ultimaPraticaEm: 50 };
    const c = { ...novaRotina('C'), ultimaPraticaEm: 200 };
    expect(ordenarPorAntiguidade([a, b, c]).map(r => r.nome)).toEqual(['B', 'A', 'C']);
  });

  it('nunca praticada (sem o campo) vem antes de qualquer uma com data', () => {
    const nunca = novaRotina('Nunca');
    const antiga = { ...novaRotina('Antiga'), ultimaPraticaEm: 1 };
    expect(ordenarPorAntiguidade([antiga, nunca]).map(r => r.nome)).toEqual(['Nunca', 'Antiga']);
  });

  it('fechar uma etapa reordena: quem acabou de praticar vai para o fim', () => {
    const a = { ...novaRotina('A'), ultimaPraticaEm: 10 };
    const b = { ...novaRotina('B'), ultimaPraticaEm: 20 };
    expect(ordenarPorAntiguidade([a, b]).map(r => r.nome)).toEqual(['A', 'B']);

    const aAgora = { ...a, ultimaPraticaEm: 30 }; // fechou a primeira etapa agora
    expect(ordenarPorAntiguidade([aAgora, b]).map(r => r.nome)).toEqual(['B', 'A']);
  });

  it('não muda o array original', () => {
    const a = { ...novaRotina('A'), ultimaPraticaEm: 200 };
    const b = { ...novaRotina('B'), ultimaPraticaEm: 100 };
    const lista = [a, b];
    ordenarPorAntiguidade(lista);
    expect(lista).toEqual([a, b]);
  });
});
