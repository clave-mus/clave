// O gerador do "Mapa do braço". O que importa travar aqui é o que o Paulo pediu em 13/11, nesta
// ordem: **as posições existem no braço**, **o passeio pelo braço é de verdade** e **configuração
// sem material é recusada em vez de sorteada** (decisão 13).
import { describe, expect, it } from 'vitest';
import { JANELAS, assinaturaDoArpejo, digitacoesNaJanela, permutacoes, rotacoes, sortearArpejo, temMaterial, type OpcoesDoMapa } from './mapa-do-braco';
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
  it('permutar multiplica o material por mais de quatro', () => {
    const o = emDoMaior();
    const soma = (ordens: number[][]) => [1, 2, 3, 4, 5, 6, 7]
      .reduce((n, g) => n + JANELAS.reduce((m, j) => m + ordens.reduce((k, ord) => k + digitacoesNaJanela(o, g, ord, j).length, 0), 0), 0);
    // Medido direto, e não por `materialDoMapa`: ela conta UMA ordem por combinação, de propósito —
    // serve para saber se há material, e permutar não cria desenho onde não havia.
    expect(soma(permutacoes(o.graus))).toBeGreaterThan(soma([[...o.graus]]) * 3);
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
        for (const ordem of permutacoes(o.graus)) {
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

  it('as ordens e os sete graus do campo saem todos', () => {
    const rnd = semente(31337);
    const o = emDoMaior();
    const ordens = new Set<string>(); const graus = new Set<number>();
    for (let i = 0; i < 600; i++) {
      const a = sortearArpejo(o, rnd)!;
      ordens.add(a.graus.join('')); graus.add(a.grau);
    }
    /**
     * Com os graus FIXOS em 1-3-5-7, as sequências possíveis são as 24 permutações deles — e saem
     * todas em 600 sorteios. Exigir mais de 15 deixa folga para o sorteio e ainda reprovaria o
     * estado anterior, onde só havia as 4 rotações.
     */
    expect(ordens.size, 'poucas sequências diferentes').toBeGreaterThan(15);
    expect(graus.size).toBe(7);
  });

  /**
   * **As permutações espalham entre cordas** — o pedido do Paulo em 14/11, e a razão de elas
   * entrarem no lugar das rotações.
   *
   * Medido com vão 5 no violão: rotações dão média de 2,99 cordas por desenho e 12% usando as
   * quatro; permutações, 3,35 e 41%. Este teste trava o que importa: a média não volta a cair.
   */
  it('a média de cordas por desenho passa de três', () => {
    const rnd = semente(1234);
    const o = emDoMaior({ vao: 5 });
    let soma = 0;
    const N = 300;
    for (let i = 0; i < N; i++) soma += new Set(sortearArpejo(o, rnd)!.posicoes.map(p => p.corda)).size;
    expect(soma / N, 'desenhos condensados em poucas cordas').toBeGreaterThan(3);
  });

  /**
   * **Graus sorteados**: a maior fonte de variabilidade do item, medida em 35× mais desenhos.
   * Nas palavras dele: *"a ideia do exercicio nao é mentalizar os arpejos, mas sim usar os arpejos
   * como motor pra pedir várias posições de notas"*.
   */
  it('com graus sorteados, muitas combinações diferentes saem', () => {
    const rnd = semente(55);
    const o = emDoMaior({ sorteados: 4 });
    const combos = new Set<string>();
    for (let i = 0; i < 400; i++) combos.add(sortearArpejo(o, rnd)!.graus.join(''));
    // há 35 combinações de quatro graus entre sete; exigir 20 em 400 sorteios é folgado e firme
    expect(combos.size, 'poucas combinações de graus').toBeGreaterThan(20);
  });

  it('com uma nota por corda, nenhum desenho repete corda', () => {
    const rnd = semente(808);
    const o = emDoMaior({ vao: 5, cordasDistintas: true });
    for (let i = 0; i < 200; i++) {
      const a = sortearArpejo(o, rnd)!;
      expect(new Set(a.posicoes.map(p => p.corda)).size, 'corda repetida').toBe(a.posicoes.length);
    }
  });
});

describe('a verificação e o sorteio olham o mesmo espaço', () => {
  /**
   * **A equivalência que faz a verificação ser rápida, medida por força bruta.**
   *
   * `primeiroQueExiste` pergunta com `contorno: 'qualquer'` e ordena o resultado, em vez de testar
   * as permutações uma a uma — o que levava 3,9 s por chamada com sete graus. O argumento é que
   * *existe permutação cujas notas sobem* se e só se *existe atribuição sem restrição de direção*,
   * porque ordenar um conjunto de posições por altura produz a sequência ascendente.
   *
   * Argumento meu não vale sem medida: este teste compara as duas respostas em todas as
   * combinações, janelas e graus de um espaço pequeno. Se a equivalência for falsa em algum caso,
   * ele acusa.
   */
  it('existe ordem que sobe, se e só se existe atribuição sem direção', () => {
    for (const [tuning, vao, distintas] of [[BAIXO, 5, false], [BAIXO, 6, true], [VIOLAO, 4, false]] as const) {
      for (const graus of [[1, 3, 5], [1, 4, 6], [2, 4, 7]]) {
        const o = emDoMaior({ tuning, vao, graus, cordasDistintas: distintas });
        for (const janela of JANELAS) {
          for (let grau = 1; grau <= 7; grau++) {
            const porPermutacao = permutacoes(graus).some(ord => digitacoesNaJanela(o, grau, ord, janela).length > 0);
            const semDirecao = digitacoesNaJanela(o, grau, graus, janela, 'qualquer').length > 0;
            expect(semDirecao, `${tuning.length} cordas, vão ${vao}, graus ${graus.join('')}, janela ${janela.join('-')}, grau ${grau}`).toBe(porPermutacao);
          }
        }
      }
    }
  });

  /**
   * **O caso que o Paulo relatou em 14/11**, e ele é a razão deste describe existir.
   *
   * Ele: *"Com estas configurações não há pergunta possível está aparecendo para Mib maior com 4
   * graus, menor melódica, 6 casas, baixo, uma nota por corda... curiosamente, nao aparece toda
   * vez. pra Fa# tambem aparece as vezes."*
   *
   * Medido: naquela configuração a ordem crescente tem **zero** desenhos e as permutações têm
   * **1176** — e a verificação só olhava a crescente. Quem decidia era a amostragem, que acertava
   * em 12 de 20 chamadas: daí o "às vezes". O espelho do defeito do dia anterior, onde o sorteio
   * não achava o que a verificação prometia.
   */
  it('o caso relatado: a recusa nunca é intermitente', () => {
    for (const tonica of [note(2, -1, 4), note(3, 1, 4)]) {
      for (const familia of ['menor-melodica-jazz', 'maior'] as const) {
        const o = emDoMaior({ tonica, familia, tuning: BAIXO, vao: 6, sorteados: 4, cordasDistintas: true });
        // Vinte chamadas com o sorteio de verdade: a resposta tem de ser a MESMA todas as vezes.
        const respostas = new Set(Array.from({ length: 20 }, () => temMaterial(o)));
        expect(respostas.size, `${noteName(tonica, 'pt')} ${familia}: resposta intermitente`).toBe(1);
        // E, havendo material, o sorteio entrega pergunta — não só a verificação promete.
        if ([...respostas][0]) {
          for (let i = 0; i < 20; i++) expect(sortearArpejo(o), `${noteName(tonica, 'pt')} ${familia}`).not.toBeNull();
        }
      }
    }
  });

  /** A recusa por contagem é instantânea: mais notas que cordas, com uma por corda, não existe. */
  it('mais notas que cordas, uma por corda: recusa sem varrer', () => {
    const o = emDoMaior({ tuning: BAIXO, vao: 6, graus: [1, 2, 3, 4, 5], cordasDistintas: true });
    const t0 = Date.now();
    expect(temMaterial(o)).toBe(false);
    // Varrendo as permutações isto levava segundos; por contagem, é imediato.
    expect(Date.now() - t0, 'a recusa deveria ser instantânea').toBeLessThan(200);
  });
});

describe('a região fixa do braço', () => {
  /**
   * Pedido do Paulo em 14/11: *"quero poder fixar uma região do braço (por exemplo, entre as casas
   * 5 e 10) ou até mesmo casas cruzando a casa 12 — como entre 7 e 15"*.
   */
  it('todas as posições caem dentro da região pedida, inclusive atravessando a 12ª casa', () => {
    const rnd = semente(2026);
    for (const janelaFixa of [[0, 4], [5, 10], [7, 15], [12, 17], [10, 14]] as const) {
      for (const [tuning, vao] of [[VIOLAO, 4], [BAIXO, 5]] as const) {
        const o = emDoMaior({ tuning, vao, sorteados: 4, janelaFixa, maxCasa: janelaFixa[1] });
        for (let i = 0; i < 60; i++) {
          const a = sortearArpejo(o, rnd);
          expect(a, `${tuning.length} cordas, casas ${janelaFixa.join('-')}`).not.toBeNull();
          for (const p of a!.posicoes) {
            expect(p.casa, `casa ${p.casa} fora de ${janelaFixa.join('-')}`).toBeGreaterThanOrEqual(janelaFixa[0]);
            expect(p.casa).toBeLessThanOrEqual(janelaFixa[1]);
          }
          // Fixando a região, o passeio deixa de existir de propósito: é sempre ela.
          expect(a!.janela).toEqual(janelaFixa);
        }
      }
    }
  });

  /** Acima da 12ª casa a conta é a mesma: casa é um número somado à corda. */
  it('a região alta soa as alturas certas', () => {
    const rnd = semente(99);
    const o = emDoMaior({ tuning: VIOLAO, vao: 5, sorteados: 4, janelaFixa: [12, 17], maxCasa: 17 });
    for (let i = 0; i < 40; i++) {
      for (const p of sortearArpejo(o, rnd)!.posicoes) expect(p.midi).toBe(VIOLAO[p.corda] + p.casa);
    }
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

  /**
   * **Toda janela do braço tem desenho**, somando as permutações — é o que garante o passeio.
   *
   * A forma deste teste mudou em 14/11, com o sorteio procedural: `materialDoMapa` passou a contar
   * uma ordem por combinação (ela responde *se há* material, não *quanto*), então contar zeros nela
   * mediria outra coisa. Aqui a soma é sobre as permutações, que é o espaço de verdade.
   */
  it('somando as ordens, nenhuma janela do braço fica sem desenho', () => {
    for (const [tuning, vao] of [[VIOLAO, 5], [BAIXO, 6]] as const) {
      for (const graus of [[1, 3, 5, 7], [1, 4, 6, 7], [1, 3, 5]]) {
        const o = emDoMaior({ tuning, vao, graus });
        for (const janela of JANELAS) {
          const quantos = [1, 2, 3, 4, 5, 6, 7].reduce((n, g) =>
            n + permutacoes(graus).reduce((m, ord) => m + digitacoesNaJanela(o, g, ord, janela).length, 0), 0);
          expect(quantos, `${tuning.length} cordas, graus ${graus.join('')}, janela ${janela.join('-')}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
