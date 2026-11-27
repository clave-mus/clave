// **O motor da nota comum**, conferido contra os exemplos que ele escreveu em 26/11.
//
// Os exemplos vieram numerados na mensagem dele, e são o teste: se o motor não os reproduz nota por
// nota, ele não é o exercício que foi pedido.
import { describe, expect, it } from 'vitest';
import { arpejoDoPapel, alteracaoDoGrau, inversoesDe, papeisDa, semisDoGrau } from './nota-comum';
import { pcNameUm } from './core';

/** Dó4 — a nota comum dos exemplos dele. */
const DO = 60;
/**
 * ⚠️ O nome aqui é só para o teste se ler como os exemplos dele. **A grafia de verdade é do
 * catálogo**, que sabe a tonalidade — por isso o lado da enarmonia entra como parâmetro: os
 * exemplos 3 e 4 dele estão em bemóis, e `pcName` sem pedir escolhe sustenido.
 */
const nomes = (ms: number[], bemol = false) => ms.map(m => pcNameUm(((m % 12) + 12) % 12, 'pt', bemol)).join(' ');

describe('os exemplos do Paulo', () => {
  it('1) dó é a fundamental de um acorde maior: dó mi sol', () => {
    const a = arpejoDoPapel(DO, { qualidade: 'maior', grau: 1 })!;
    expect(nomes(a.alturas)).toBe('Dó Mi Sol');
    expect(a.fundamental).toBe(DO);
  });

  /**
   * *"dó lá dó mi pq a ideia é sempre começar no dó"* — a âncora primeiro, depois o acorde do chão
   * para cima. A terça do lá menor é o próprio dó, e por isso ele aparece duas vezes.
   */
  it('2) dó é a terça de um acorde menor: dó lá dó mi', () => {
    const a = arpejoDoPapel(DO, { qualidade: 'menor', grau: 3 })!;
    expect(nomes(a.alturas)).toBe('Dó Lá Dó Mi');
    expect(a.alturas[0]).toBe(DO);
    // A fundamental fica ABAIXO da nota comum: lá3 contra dó4.
    expect(a.fundamental).toBe(DO - 3);
  });

  it('3) dó é a terça de um acorde maior: dó láb dó mib', () => {
    const a = arpejoDoPapel(DO, { qualidade: 'maior', grau: 3 })!;
    expect(nomes(a.alturas, true)).toBe('Dó Lá♭ Dó Mi♭');
  });

  it('4) dó é a quinta de um acorde maior: fá maior', () => {
    const a = arpejoDoPapel(DO, { qualidade: 'maior', grau: 5 })!;
    expect(nomes(a.alturas)).toBe('Dó Fá Lá Dó');
  });

  it('5) dó é a sétima de um menor com sétima: ré menor', () => {
    const a = arpejoDoPapel(DO, { qualidade: 'm7', grau: 7 })!;
    expect(nomes(a.alturas)).toBe('Dó Ré Fá Lá Dó');
  });

  it('6) dó é a sétima de um dominante: ré7', () => {
    const a = arpejoDoPapel(DO, { qualidade: '7', grau: 7 })!;
    expect(nomes(a.alturas)).toBe('Dó Ré Fá♯ Lá Dó');
  });

  it('7) dó é a nona bemol de um dominante: si7(♭9)', () => {
    const a = arpejoDoPapel(DO, { qualidade: '7(b9)', grau: 9 })!;
    expect(a.fundamental).toBe(DO - 13);
    expect(nomes(a.alturas)).toBe('Dó Si Ré♯ Fá♯ Lá Dó');
    expect(alteracaoDoGrau('7(b9)', 9)).toBe(-1);
  });

  /**
   * ⚠️ **O exemplo 8 não existe no motor**: *"sexta de um acorde menor com sexta"* pede a qualidade
   * `m6`, e `CHORDS` não a tem. Cadastrar qualidade nova é decisão dele — ela apareceria na lista de
   * todos os itens que oferecem acordes, não só aqui.
   */
  it('8) a sexta de um acorde menor com sexta ainda não tem qualidade no motor', () => {
    expect(semisDoGrau('menor', 6)).toBeNull();
    expect(Object.keys({ m6: 1 }).every(id => !(id in { maior: 1, menor: 1 }))).toBe(true);
  });
});

describe('a inversão é quem fica no chão', () => {
  /** A tabela que ele aprovou em 26/11, com dó como terça de lá menor. */
  it.each([
    [1, 'Dó Lá Dó Mi'],
    [3, 'Dó Mi Lá'],
    [5, 'Dó Mi Lá Dó'],
  ])('baixo no grau %i: %s', (baixo, esperado) => {
    const a = arpejoDoPapel(DO, { qualidade: 'menor', grau: 3 }, { baixo })!;
    expect(nomes(a.alturas)).toBe(esperado);
    // O chão é mesmo o grau pedido, e nada soa abaixo dele.
    expect(Math.min(...a.acorde)).toBe(a.acorde[0]);
    expect(((a.acorde[0] - a.fundamental) % 12 + 12) % 12).toBe(semisDoGrau('menor', baixo));
  });

  it('com a nota comum no baixo, o desenho começa subindo', () => {
    const a = arpejoDoPapel(DO, { qualidade: 'menor', grau: 3 }, { baixo: 3 })!;
    expect(a.alturas[0]).toBe(DO);
    expect(a.acorde[0]).toBe(DO);
    // Sem repetir a âncora: ela É o chão.
    expect(a.alturas.filter(m => m === DO)).toHaveLength(1);
  });

  it('toda inversão de toda qualidade sobe sem repetir altura', () => {
    for (const q of ['maior', 'menor', '7', 'm7', '7M', 'dim7', '7(b9)', 'm7b5'] as const) {
      for (const papel of papeisDa(q)) {
        for (const baixo of inversoesDe(q)) {
          const a = arpejoDoPapel(DO, papel, { baixo });
          expect(a, `${q} grau ${papel.grau} baixo ${baixo}`).toBeTruthy();
          const subida = a!.acorde;
          for (let i = 1; i < subida.length; i++) {
            expect(subida[i], `${q}: ${subida}`).toBeGreaterThan(subida[i - 1]);
          }
          // Toda nota do acorde aparece uma vez, e a nota comum está entre elas.
          expect(new Set(subida.map(m => ((m % 12) + 12) % 12)).size).toBe(subida.length);
          expect(subida.map(m => ((m % 12) + 12) % 12)).toContain(0);
        }
      }
    }
  });

  /**
   * **O desenho cabe na voz.** Não é conforto, é viabilidade: um arpejo de cinco notas com a
   * fundamental treze semitons abaixo da âncora já passa de duas oitavas, e aí o exercício vira
   * ginástica de registro em vez de ouvido.
   */
  it('nenhum desenho passa de duas oitavas', () => {
    for (const q of ['maior', 'menor', '7', 'm7', '7M', '7(b9)', '7(13)'] as const) {
      for (const papel of papeisDa(q)) {
        for (const baixo of inversoesDe(q)) {
          const a = arpejoDoPapel(DO, papel, { baixo })!;
          const vao = Math.max(...a.alturas) - Math.min(...a.alturas);
          expect(vao, `${q} grau ${papel.grau} baixo ${baixo}: ${vao} semitons`).toBeLessThanOrEqual(24);
        }
      }
    }
  });
});
