// Digitações de escala no braço — 25/11/2026.
//
// O exercício dele é "monte uma digitação deste modo, e depois monte outra". Duas coisas precisam
// estar travadas antes de haver tela: que o braço dá desenhos de sobra, e que o veredito aceita
// QUALQUER digitação legítima — não só as que a busca por acaso devolveu.
import { describe, expect, it } from 'vitest';
import { classesDoModo, digitacoesDaEscala, julgarDigitacao, sugerirDigitacao, assinaturaDaDigitacao, formaDaDigitacao } from './digitacao-de-escala';
import { note, mod } from './core';

const BAIXO = [28, 33, 38, 43];
const VIOLAO = [40, 45, 50, 55, 59, 64];
/**
 * ⚠️ `note` recebe o **índice diatônico**, não a classe de altura: `note(2)` é MI. Este arquivo
 * chamava esta constante de `re` e os testes falavam em "mi dórico" — era mi o tempo todo. O nome
 * mentia; o que os testes mediam estava certo, porque qualquer tônica serve para a medida.
 */
const mi = { ...note(2), oct: 2 };

describe('quantos desenhos o braço dá', () => {
  it.each([
    ['maior', 1], ['maior', 2], ['maior', 5],
    ['menor-harmonica', 1], ['menor-harmonica', 5],
    ['menor-melodica-jazz', 1], ['menor-melodica-jazz', 7],
  ] as const)('%s, grau %i: há desenho de sobra no baixo', (familia, grau) => {
    const ds = digitacoesDaEscala({ tonica: mi, familia, grau, tuning: BAIXO });
    expect(ds.length, `${familia}/${grau}`).toBeGreaterThan(5);
    // e todos são de sete notas, uma por grau
    for (const d of ds) expect(d.length).toBe(7);
  });

  it('não repete desenho na lista', () => {
    const ds = digitacoesDaEscala({ tonica: mi, familia: 'maior', grau: 2, tuning: BAIXO });
    expect(new Set(ds.map(assinaturaDaDigitacao)).size).toBe(ds.length);
  });

  it('no violão também, e com mais cordas há mais desenho', () => {
    const noBaixo = digitacoesDaEscala({ tonica: mi, familia: 'maior', grau: 1, tuning: BAIXO });
    const noViolao = digitacoesDaEscala({ tonica: mi, familia: 'maior', grau: 1, tuning: VIOLAO });
    expect(noViolao.length).toBeGreaterThan(noBaixo.length);
  });
});

describe('o veredito', () => {
  const pedido = { tonica: mi, familia: 'maior' as const, grau: 2, tuning: BAIXO };

  it('aceita TODA digitação que a busca devolve', () => {
    for (const d of digitacoesDaEscala(pedido)) {
      expect(julgarDigitacao(d, pedido), assinaturaDaDigitacao(d)).toEqual({ certo: true });
    }
  });

  /**
   * O que importa de verdade: o veredito é regra, não lista. Um desenho legítimo que o `limite` da
   * busca cortou tem de passar igual — senão a pessoa monta algo certo e o app diz que errou.
   */
  it('aceita um desenho legítimo que a busca NÃO devolveu', () => {
    const achadas = new Set(digitacoesDaEscala({ ...pedido, limite: 3 }).map(assinaturaDaDigitacao));
    const todas = digitacoesDaEscala({ ...pedido, limite: 400 });
    const forada = todas.find(d => !achadas.has(assinaturaDaDigitacao(d)))!;
    expect(forada).toBeTruthy();
    expect(julgarDigitacao(forada, pedido)).toEqual({ certo: true });
  });

  it('recusa nota de fora da escala, e diz qual', () => {
    const d = digitacoesDaEscala(pedido)[0];
    const classes = classesDoModo(pedido);
    const foraDaEscala = [...Array(12).keys()].find(c => !classes.includes(c))!;
    // troca a última posição por uma de classe de fora, na mesma corda
    const ultima = d[d.length - 1];
    let casa = ultima.casa;
    while (mod(BAIXO[ultima.corda] + casa, 12) !== foraDaEscala) casa += 1;
    const v = julgarDigitacao([...d.slice(0, -1), { corda: ultima.corda, casa }], pedido);
    expect(v.certo).toBe(false);
    expect(v.motivo).toBe('sobram');
  });

  it('recusa quando falta grau', () => {
    const d = digitacoesDaEscala(pedido)[0];
    const v = julgarDigitacao(d.slice(0, -1), pedido);
    expect(v.certo).toBe(false);
    expect(v.motivo).toBe('faltam');
    expect(v.faltando?.length).toBe(1);
  });

  it('recusa desenho que não sobe em ordem de grau', () => {
    // sobe uma oitava com a segunda nota: as classes continuam certas, a ordem não
    const d = digitacoesDaEscala(pedido)[0];
    const trocado = d.map((x, i) => (i === 1 ? { ...x, casa: x.casa + 12 } : x));
    const v = julgarDigitacao(trocado, { ...pedido, maxVaoCasas: 99 });
    expect(v.certo).toBe(false);
    expect(v.motivo).toBe('desce');
  });

  it('recusa o que não cabe na mão', () => {
    const d = digitacoesDaEscala(pedido)[0];
    const esticado = d.map((x, i) => (i === d.length - 1 ? { ...x, casa: x.casa } : x));
    expect(julgarDigitacao(esticado, { ...pedido, maxVaoCasas: 1 }).motivo).toBe('vao');
  });

  it('a tônica do modo é a nota mais grave do desenho', () => {
    const classes = classesDoModo(pedido);
    for (const d of digitacoesDaEscala(pedido)) {
      const grave = d.reduce((a, b) => (BAIXO[a.corda] + a.casa <= BAIXO[b.corda] + b.casa ? a : b));
      expect(mod(BAIXO[grave.corda] + grave.casa, 12)).toBe(classes[0]);
    }
  });
});

describe('a sugestão', () => {
  const pedido = { tonica: mi, familia: 'maior' as const, grau: 2, tuning: BAIXO };

  it('nunca repete o que a pessoa já montou', () => {
    const feitas: { corda: number; casa: number }[][] = [];
    for (let i = 0; i < 8; i++) {
      const nova = sugerirDigitacao(pedido, feitas);
      if (!nova) break;
      expect(feitas.map(assinaturaDaDigitacao)).not.toContain(assinaturaDaDigitacao(nova));
      feitas.push(nova);
    }
    expect(feitas.length).toBeGreaterThan(4);
  });

  it('devolve null quando acabaram os desenhos', () => {
    const todas = digitacoesDaEscala(pedido);
    expect(sugerirDigitacao(pedido, todas)).toBeNull();
  });

  it('a sugestão é sempre uma digitação válida', () => {
    const s = sugerirDigitacao(pedido, [])!;
    expect(julgarDigitacao(s, pedido)).toEqual({ certo: true });
    expect(s).toHaveLength(7);
  });
});

/**
 * Os três defeitos que ele relatou em 25/11, usando o exercício. Cada um virou um teste, porque
 * cada um passou pela minha revisão sem que eu visse.
 */
describe('o que ele relatou usando', () => {
  const pedido = { tonica: mi, familia: 'maior' as const, grau: 2, tuning: BAIXO };

  it('fechar na oitava vale — era recusado', () => {
    const d = digitacoesDaEscala(pedido)[0];
    const base = Math.min(...d.map(x => BAIXO[x.corda] + x.casa));
    const corda = BAIXO.findIndex(t => base + 12 - t >= 0 && base + 12 - t <= 12);
    const comOitava = [...d, { corda, casa: base + 12 - BAIXO[corda] }];
    expect(julgarDigitacao(comOitava, { ...pedido, maxVaoCasas: 99 })).toEqual({ certo: true });
  });

  it('outra classe repetida continua recusada', () => {
    const d = digitacoesDaEscala(pedido)[0];
    const repetida = [...d, { corda: d[1].corda, casa: d[1].casa + 12 }];
    expect(julgarDigitacao(repetida, { ...pedido, maxVaoCasas: 99 }).motivo).toBe('repetida');
  });

  it('a mesma forma uma oitava acima NÃO é um desenho novo', () => {
    const d = digitacoesDaEscala(pedido)[0];
    const umaOitavaAcima = d.map(x => ({ corda: x.corda, casa: x.casa + 12 }));
    expect(formaDaDigitacao(umaOitavaAcima)).toBe(formaDaDigitacao(d));
    expect(assinaturaDaDigitacao(umaOitavaAcima)).not.toBe(assinaturaDaDigitacao(d));
  });

  it('a sugestão nunca repete a FORMA do que já foi feito', () => {
    const feitas: { corda: number; casa: number }[][] = [];
    for (let i = 0; i < 6; i++) {
      const nova = sugerirDigitacao(pedido, feitas);
      if (!nova) break;
      expect(feitas.map(formaDaDigitacao)).not.toContain(formaDaDigitacao(nova));
      feitas.push(nova);
    }
    expect(feitas.length).toBeGreaterThan(2);
  });

  it('pedindo oitava, todo desenho sugerido vem com oito notas e fecha certo', () => {
    const ds = digitacoesDaEscala({ ...pedido, oitava: true });
    expect(ds.length).toBeGreaterThan(0);
    for (const d of ds) {
      expect(d).toHaveLength(8);
      const alturas = d.map(x => BAIXO[x.corda] + x.casa).sort((a, b) => a - b);
      expect(alturas[7] - alturas[0]).toBe(12);
      expect(julgarDigitacao(d, pedido)).toEqual({ certo: true });
    }
  });
});

/**
 * **A escala ao longo de UMA corda vale** — ele mandou o caso em 25/11, com a tela: mi menor
 * melódica nas casas 0 2 3 5 7 9 11 12 da corda mais grave, recusada por vão.
 *
 * O vão mede posição de mão, e numa corda só a mão desliza. Chamar isso de erro é chamar de erro
 * um estudo clássico de baixo.
 */
describe('numa corda só não há vão', () => {
  
  const umaCorda = [0, 2, 3, 5, 7, 9, 11, 12].map(casa => ({ corda: 0, casa }));

  it('aceita a escala inteira na corda mais grave', () => {
    expect(julgarDigitacao(umaCorda, { tonica: mi, familia: 'menor-melodica-jazz', grau: 1, tuning: BAIXO }))
      .toEqual({ certo: true });
  });

  it('e continua recusando as notas erradas ali', () => {
    const errada = [...umaCorda.slice(0, -1), { corda: 0, casa: 13 }];
    expect(julgarDigitacao(errada, { tonica: mi, familia: 'menor-melodica-jazz', grau: 1, tuning: BAIXO }).certo).toBe(false);
  });

  it('cruzando cordas, o vão volta a valer', () => {
    const espalhada = [{ corda: 0, casa: 0 }, { corda: 0, casa: 2 }, { corda: 0, casa: 3 },
      { corda: 1, casa: 0 }, { corda: 1, casa: 2 }, { corda: 1, casa: 4 }, { corda: 1, casa: 6 }, { corda: 1, casa: 7 }];
    expect(julgarDigitacao(espalhada, { tonica: mi, familia: 'menor-melodica-jazz', grau: 1, tuning: BAIXO, maxVaoCasas: 4 }).motivo)
      .toBe('vao');
  });
});
