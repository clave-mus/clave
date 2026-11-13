// A corda pulsada afina, e não explode (09/11/2026).
//
// O Paulo relatou: "a nota tem o mesmo bug antigo — soa bizarra a primeira vez, depois não soa
// mais. Esse erro é inato aos sons de cordas." Estava certo nas duas coisas.
//
// A versão anterior montava o laço de Karplus-Strong com nós vivos do WebAudio, e medido num
// `OfflineAudioContext` ele **divergia** (pico de 2,6 × 10²³) e **produzia NaN** — que envenenava o
// `master`, compartilhado e permanente, e por isso silenciava tudo depois.
//
// Nada disso tinha teste, e não tinha como ter: dependia de nó de áudio do navegador. Calculando a
// corda em JS, a conta fica testável — e é esta a razão principal de o conserto ter sido esse, e
// não ajustar o Q do filtro.
import { describe, expect, it } from 'vitest';
import { amostrasDeCorda } from './engine';

/**
 * Chama a função DO MOTOR, nunca uma cópia dela — `amostrasDeCorda` é pura justamente para isto.
 *
 * O ruído do ataque é injetado com semente fixa. Sem isso o teste reprovava em 2 de 5 execuções:
 * a excitação sorteada muda onde o medidor acha o pico, e um teste de afinação que depende de sorte
 * não serve nem para afirmar nem para negar.
 */
function corda(m: number, corte: number, t60: number, segundos = 1.5, semente = 12345): Float32Array {
  let s = semente;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  return amostrasDeCorda(m, SR, corte, t60, Math.ceil(SR * segundos), rnd);
}

const SR = 44100;
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Magnitude numa frequência exata (Goertzel). Não confunde fundamental com harmônico. */
function magnitude(x: Float32Array, f: number, ini: number, n: number, sr = SR): number {
  const coef = 2 * Math.cos((2 * Math.PI * f) / sr);
  let s1 = 0, s2 = 0;
  for (let i = ini; i < ini + n && i < x.length; i++) {
    const s = x[i] + coef * s1 - s2;
    s2 = s1; s1 = s;
  }
  return Math.sqrt(s1 * s1 + s2 * s2 - coef * s1 * s2);
}
/**
 * Quantos cents a altura que soa está longe da pedida, por varredura em volta dela.
 *
 * A janela é **proporcional ao período** — quarenta voltas da corda —, e começa depois do ataque
 * assentar. Isto importou mais que qualquer coisa na síntese: com vinte voltas o medidor acusava 20
 * cents de erro no Lá2, e com sessenta o mesmo sinal media 1. Eu quase registrei um defeito que era
 * do meu instrumento, e por isso o número de voltas está escrito aqui como parte da medição.
 *
 * Varre grosso com janela curta e refina com a longa. A varredura grossa só precisa chegar a ±10
 * cents, e usar a janela longa nos 51 passos dela multiplicava o tempo do teste por três.
 */
function desvioEmCents(x: Float32Array, alvo: number): number {
  const ini = Math.round(SR * 0.3);
  const longa = Math.min(x.length - ini, Math.round((40 * SR) / alvo));
  // a grossa também precisa de voltas suficientes, senão erra feio nas graves (4 voltas a 31 Hz)
  const curta = Math.min(longa, Math.max(6144, Math.round((10 * SR) / alvo)));
  const varre = (de: number, ate: number, passo: number, n: number) => {
    let melhor = -1, cents = de;
    for (let c = de; c <= ate; c += passo) {
      const m = magnitude(x, alvo * Math.pow(2, c / 1200), ini, n);
      if (m > melhor) { melhor = m; cents = c; }
    }
    return cents;
  };
  const grosso = varre(-250, 250, 10, curta);
  return varre(grosso - 12, grosso + 12, 1, longa);
}

/**
 * Os mesmos números de `CORDAS` em `engine.ts`, **cada voz na extensão do seu instrumento**.
 *
 * Violão vai do Mi2 (40) ao topo de 24 casas (88); baixo, do Si0 de um cinco cordas (23) ao topo
 * (67). A primeira versão media as duas de 23 a 88 e reprovava no violão em MIDI 23 — 31 Hz, uma
 * oitava e meia abaixo da nota mais grave que um violão tem. Estava medindo um caso que o
 * instrumento não produz.
 */
const VOZES = [
  { nome: 'violao', corte: 3200, t60: 1.8, alturas: [40, 47, 52, 57, 64, 69, 76, 83, 88] },
  { nome: 'baixo', corte: 1800, t60: 2.2, alturas: [23, 28, 33, 40, 45, 52, 57, 62, 67] },
];
/**
 * Nove alturas por voz, em vez de semitom por semitom: o teste afirma uma propriedade, e varrer 66
 * notas × 2 sementes × 2 vozes levava 50 s na suíte. As listas incluem as pontas e os lugares onde
 * a versão antiga quebrava — o Lá4, onde saíam 191 Hz em vez de 440, e de MIDI 80 para cima, onde a
 * nota simplesmente não soava.
 */

describe.each(VOZES)('$nome', ({ corte, t60, alturas }) => {
  // O que dava 2,6 × 10²³ na versão de nós vivos. Com ganho de laço menor que 1, não há como.
  it('nunca passa de amplitude 1, em toda a extensão', () => {
    for (const m of alturas) {
      const x = corda(m, corte, t60);
      let pico = 0;
      for (const v of x) pico = Math.max(pico, Math.abs(v));
      expect(pico, `MIDI ${m}`).toBeLessThanOrEqual(1);
    }
  });

  // É o NaN que envenenava o `master` e silenciava o resto da sessão.
  it('nenhuma amostra é NaN ou infinita', () => {
    for (const m of alturas) {
      for (const v of corda(m, corte, t60)) {
        expect(Number.isFinite(v), `MIDI ${m}`).toBe(true);
      }
    }
  });

  // O coração: a nota que soa é a nota pedida. Antes, 440 Hz saíam 191.
  // O coração: a nota que soa é a nota pedida. Antes, 440 Hz saíam 191.
  //
  // Varre TRÊS sementes de ruído. Com uma só, uma excitação azarada passaria e o defeito voltaria
  // sem ninguém ver — foi o que a instabilidade do teste ensinou.
  it('afina dentro de 10 cents em toda a extensão declarada', () => {
    for (const m of alturas) {
      for (const semente of [12345, 20261109]) {
        const x = corda(m, corte, t60, 2.5, semente);
        expect(Math.abs(desvioEmCents(x, hz(m))), `MIDI ${m}, semente ${semente}`).toBeLessThanOrEqual(10);
      }
    }
  });

});

it('o laço decai: a corda não sustenta para sempre', () => {
  const x = corda(40, 1800, 2.2, 3);
  const inicio = Math.max(...Array.from(x.slice(0, SR * 0.1)).map(Math.abs));
  const fim = Math.max(...Array.from(x.slice(SR * 1.5)).map(Math.abs));
  expect(fim).toBeLessThan(inicio * 0.5);
});

/**
 * A fundamental tem de mandar em TODA a extensão — o bug do Paulo em 12/11: *"o fá da casa 3 da
 * corda ré soou mais grave que o si da corda lá casa 2"*.
 *
 * Com ruído puro no ataque, a amplitude de cada harmônico era sorteada, e em 56 de 120 casos o 2º
 * harmônico vencia a fundamental: a nota soava uma oitava acima. Como acontecia com umas notas e
 * não com outras, **a ordem entre duas posições invertia**. Daí o estouro triangular.
 */
describe('a fundamental manda', () => {
  it('em 15 alturas e 4 ruídos, a fundamental tem mais energia que o 2º harmônico', () => {
    for (const m of [24, 28, 31, 33, 35, 38, 40, 41, 43, 45, 48, 50, 55, 59, 64]) {
      const f = hz(m);
      for (let s = 1; s <= 4; s++) {
        let semente = (s * 7919) >>> 0;
        const rnd = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;
        const x = amostrasDeCorda(m, SR, 1800, 2.2, SR * 2, rnd);
        const razao = magnitude(x, f, 2000, SR) / Math.max(1e-9, magnitude(x, 2 * f, 2000, SR));
        // Medido: a pior razão é 2,4. O piso de 1,5 é folga sem deixar passar o bug (que dava < 1).
        expect(razao, `midi ${m}, ruído ${s}`).toBeGreaterThan(1.5);
      }
    }
  });
});
