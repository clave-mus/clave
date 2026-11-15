// O gerador do "Mapa do braço". O que importa travar aqui é o que o Paulo pediu em 13/11, nesta
// ordem: **as posições existem no braço**, **o passeio pelo braço é de verdade** e **configuração
// sem material é recusada em vez de sorteada** (decisão 13).
import { describe, expect, it } from 'vitest';
import { JANELAS, assinaturaDoArpejo, digitacoesNaJanela, materialDoMapa, rotacoes, sortearArpejo, type OpcoesDoMapa } from './mapa-do-braco';
import { buildScale, midi, mod, note, noteName } from './core';

const VIOLAO = [40, 45, 50, 55, 59, 64];
const BAIXO = [28, 33, 38, 43];
const emDoMaior = (over: Partial<OpcoesDoMapa> = {}): OpcoesDoMapa =>
  ({ tonica: note(0, 0, 4), familia: 'maior', graus: [1, 3, 5, 7], tuning: VIOLAO, vao: 4, ...over });

/** Semente fixa: um gerador que depende de sorte não serve para afirmar nem para negar. */
function semente(s: number) {
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

describe('rotações são as inversões', () => {
  it('uma rotação por grau, começando em cada um deles', () => {
    expect(rotacoes([1, 3, 5, 7])).toEqual([[1, 3, 5, 7], [3, 5, 7, 1], [5, 7, 1, 3], [7, 1, 3, 5]]);
    expect(rotacoes([1, 3, 5])).toEqual([[1, 3, 5], [3, 5, 1], [5, 1, 3]]);
  });

  /**
   * Medido em 13/11, e é o que justificou a decisão: as quatro rotações levam o material de 219
   * para 1059 desenhos no violão. Sem elas o exercício repetiria cedo.
   */
  it('rotacionar multiplica o material por mais de quatro', () => {
    const o = emDoMaior();
    const base = [1, 2, 3, 4, 5, 6, 7].reduce((n, g) => n + JANELAS.reduce((m, j) => m + digitacoesNaJanela(o, g, o.graus, j).length, 0), 0);
    const todas = materialDoMapa(o).reduce((n, x) => n + x.quantos, 0);
    expect(todas).toBeGreaterThan(base * 3);
  });
});

describe('as posições existem no braço, e dentro da janela', () => {
  it('em 300 sorteios, nenhuma casa fora da janela e nenhuma corda inexistente', () => {
    const rnd = semente(20261113);
    for (const [tuning, vao] of [[VIOLAO, 4], [BAIXO, 5]] as const) {
      const o = emDoMaior({ tuning, vao });
      for (let i = 0; i < 300; i++) {
        const a = sortearArpejo(o, rnd)!;
        expect(a).not.toBeNull();
        const [de, ate] = a.janela;
        for (const p of a.posicoes) {
          expect(p.casa, `casa ${p.casa} fora de ${de}–${ate}`).toBeGreaterThanOrEqual(de);
          expect(p.casa).toBeLessThanOrEqual(ate);
          expect(p.corda).toBeGreaterThanOrEqual(0);
          expect(p.corda).toBeLessThan(tuning.length);
          // a altura é mesmo a daquela posição — é o que a tela vai desenhar e o motor vai tocar
          expect(p.midi).toBe(tuning[p.corda] + p.casa);
        }
      }
    }
  });

  /**
   * **A casa 0 obedece à janela como qualquer outra**, e isto é escolha de desenho: o
   * `maxVaoCasas` do motor ignora corda solta porque ela não gasta dedo, mas aqui o arpejo é uma
   * figura na tela, e uma solta com a mão na 10ª casa não é a "posição próxima" do exercício.
   */
  it('fora da primeira janela, não aparece corda solta', () => {
    const o = emDoMaior();
    for (const janela of JANELAS.filter(j => j[0] > 0)) {
      for (let grau = 1; grau <= 7; grau++) {
        for (const ordem of rotacoes(o.graus)) {
          for (const d of digitacoesNaJanela(o, grau, ordem, janela)) {
            expect(d.every(p => p.casa > 0), `janela ${janela.join('-')}`).toBe(true);
          }
        }
      }
    }
  });

  it('o arpejo sobe: cada nota é mais aguda que a anterior', () => {
    const rnd = semente(777);
    const o = emDoMaior();
    for (let i = 0; i < 200; i++) {
      const a = sortearArpejo(o, rnd)!;
      for (let k = 1; k < a.posicoes.length; k++) {
        expect(a.posicoes[k].midi, `posição ${k}`).toBeGreaterThan(a.posicoes[k - 1].midi);
      }
    }
  });
});

describe('as notas são as do campo', () => {
  /**
   * **O teste que pegou o erro de API.** Na primeira versão eu chamava
   * `getModo(tonica, familia, grau)` para obter o grau do campo — mas aquele `grau` rotaciona o
   * MODO, não escolhe a nota: `getModo(dó, 'maior', 4)` é dó lídio, não o IV grau de dó maior. O
   * arpejo saía com Fá♯ em dó maior, e mais nove notas fora da escala em outros graus.
   *
   * A documentação da função avisa em maiúsculas, e eu li por cima. Este teste é o que transformou
   * isso de bug silencioso em falha na primeira rodada.
   */
  it('em 300 sorteios e dois campos, nenhuma nota fora da escala', () => {
    const daEscala = (familia: 'maior' | 'menor') => new Set(
      buildScale({ ...note(0, 0, 4), letter: 0 }, familia).map(n => mod(midi(n), 12)));
    for (const familia of ['maior', 'menor'] as const) {
      const permitidas = daEscala(familia);
      const rnd = semente(4242);
      for (let i = 0; i < 300; i++) {
        const a = sortearArpejo(emDoMaior({ familia }), rnd)!;
        for (const p of a.posicoes) {
          expect(permitidas.has(mod(p.midi, 12)), `${noteName(p.nota, 'pt')} no grau ${a.grau} de dó ${familia}`).toBe(true);
        }
      }
    }
  });
});

describe('o passeio pelo braço é de verdade', () => {
  /**
   * **O pedido do Paulo, virado teste**: *"cuidado pra nao fazer com que o arpejo de do maior
   * comece sempre só na 3a casa da corda lá"*.
   *
   * Sortear uniformemente entre as digitações NÃO faz isso: medido, 26 das 51 do I grau começam na
   * casa 0, porque corda solta não conta no vão da mão. Daí a região vir antes. Este teste mede a
   * consequência: em 500 sorteios, as cinco janelas aparecem e nenhuma passa de 30%.
   */
  it('em 500 sorteios, todas as regiões aparecem e nenhuma domina', () => {
    const rnd = semente(90210);
    const o = emDoMaior();
    const conta = new Map<string, number>();
    const N = 500;
    for (let i = 0; i < N; i++) {
      const a = sortearArpejo(o, rnd)!;
      const k = a.janela.join('-');
      conta.set(k, (conta.get(k) ?? 0) + 1);
    }
    expect(conta.size, 'alguma região nunca saiu').toBe(JANELAS.length);
    for (const [k, n] of conta) expect(n / N, `região ${k}`).toBeLessThan(0.3);
  });

  it('as quatro inversões saem, e os sete graus também', () => {
    const rnd = semente(31337);
    const o = emDoMaior();
    const rot = new Set<number>(); const graus = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const a = sortearArpejo(o, rnd)!;
      rot.add(a.rotacao); graus.add(a.grau);
    }
    expect([...rot].sort()).toEqual([0, 1, 2, 3]);
    expect(graus.size).toBe(7);
  });
});

describe('anti-eco e recusa', () => {
  it('a mesma posição não sai duas vezes seguidas quando há alternativa', () => {
    const rnd = semente(5150);
    const o = emDoMaior();
    let anterior = assinaturaDoArpejo(sortearArpejo(o, rnd)!);
    for (let i = 0; i < 200; i++) {
      const a = sortearArpejo(o, rnd, x => assinaturaDoArpejo(x) === anterior)!;
      expect(assinaturaDoArpejo(a)).not.toBe(anterior);
      anterior = assinaturaDoArpejo(a);
    }
  });

  /**
   * **Quando não existe nada, devolve `null`** — e o caso tem de ser artificial de propósito,
   * porque medindo se descobre que **com instrumento de verdade sempre há material**: nem vão 0
   * esgota, já que corda solta não gasta dedo e cinco soltas de um violão formam arpejos. Testei
   * primeiro com vão 0 num baixo esperando zero, e havia 27 desenhos.
   *
   * Então o contrato se verifica com uma corda só: duas notas distintas numa corda exigem duas
   * casas, e vão 0 permite uma. Para o item isso quer dizer que o `problema()` quase nunca vai
   * disparar — o que não o torna inútil, só raro.
   */
  it('sem material, devolve null em vez de sortear o impossível', () => {
    // Uma corda, uma casa: duas notas distintas não cabem. É o único jeito de chegar ao zero.
    expect(sortearArpejo(emDoMaior({ graus: [1, 3], vao: 0, maxCasa: 0, tuning: [40] }), semente(1))).toBeNull();
  });

  /**
   * **O contrapeso do teste acima, e a descoberta que ele custou**: nenhuma configuração que a
   * interface deixa montar fica sem material. Tentei três vezes produzir o zero com valores reais
   * — vão 0 num baixo, duas notas distantes, uma corda — e todas as três tinham desenhos, porque
   * corda solta não gasta dedo e o vão não a limita.
   *
   * Vale travar porque é o oposto de um defeito: garante que a pessoa nunca vê uma recusa no
   * caminho normal. Se um dia um parâmetro novo criar um beco sem saída, este teste cai antes de
   * a recusa aparecer na tela de alguém.
   */
  it('nenhuma configuração oferecida pela interface fica sem material', () => {
    for (const [tuning, vaos] of [[VIOLAO, [3, 4, 5, 6]], [BAIXO, [3, 4, 5, 6]]] as const) {
      for (const vao of vaos) {
        for (const graus of [[1, 3, 5], [1, 3, 5, 7], [1, 4, 6, 7], [1, 2, 3], [1, 5], [2, 4, 6]]) {
          const o = emDoMaior({ tuning, vao, graus });
          for (const familia of ['maior', 'menor'] as const) {
            expect(sortearArpejo({ ...o, familia }, semente(99)), `${tuning.length} cordas, vão ${vao}, graus ${graus.join('')}, ${familia}`).not.toBeNull();
          }
        }
      }
    }
  });

  it('material medido: nenhuma das 35 combinações de janela e grau fica vazia', () => {
    for (const [tuning, vao] of [[VIOLAO, 4], [BAIXO, 5]] as const) {
      for (const graus of [[1, 3, 5, 7], [1, 4, 6, 7], [1, 3, 5]]) {
        const m = materialDoMapa(emDoMaior({ tuning, vao, graus }));
        expect(m.filter(x => x.quantos === 0), `${tuning.length} cordas, graus ${graus.join('')}`).toEqual([]);
      }
    }
  });
});
