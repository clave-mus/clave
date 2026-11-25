// A linha de baixo do backing — 19/11/2026.
//
// O Paulo: *"as linhas de baixo estão sempre meio estranhas no acorde vii diminuto"*. Estavam, e a
// causa era um `7` somado cru à fundamental: num diminuto a quinta tem **6** semitons, então o
// baixo tocava uma nota que não é do acorde. A terça já saía do acorde; a quinta, não.
//
// E o samba: *"faça com que o baixo faça a quinta grave, e não a aguda, e em semicolcheias
// pontuadas, como deve ser tocado"*.
import { describe, expect, it } from 'vitest';
import { alturaDoBaixo, GROOVES, linhaDoTempo, desvioDoPasso } from '../theory/levada';
import { PRESETS, resolverProgressaoParaTeste, lerGuardado } from './backing-progressao';
import { CHORDS, mod, pc, type ChordId } from '../theory/core';

const RAIZ = 48; // dó3, uma fundamental qualquer
const graus = (id: ChordId) => CHORDS[id].degs.map(([, s]) => s);

describe('a quinta vem do acorde, não de uma soma fixa', () => {
  it('no diminuto é diminuta, no aumentado é aumentada, nos outros é justa', () => {
    expect(alturaDoBaixo('quinta', RAIZ, 'dim', 0) - RAIZ).toBe(6);
    expect(alturaDoBaixo('quinta', RAIZ, 'm7b5', 0) - RAIZ).toBe(6);
    expect(alturaDoBaixo('quinta', RAIZ, 'dim7', 0) - RAIZ).toBe(6);
    expect(alturaDoBaixo('quinta', RAIZ, 'aum', 0) - RAIZ).toBe(8);
    for (const id of ['maior', 'menor', '7', '7M', 'm7'] as ChordId[]) {
      expect(alturaDoBaixo('quinta', RAIZ, id, 0) - RAIZ, id).toBe(7);
    }
  });

  /**
   * A invariante que o relato dele pedia: **toda nota de baixo que diz um grau do acorde é nota do
   * acorde**. Vale para as 25 qualidades, e é o que impede o fá♯ sobre o Si°.
   */
  it('raiz, terça e quinta são notas do acorde — em toda qualidade que existe', () => {
    for (const id of Object.keys(CHORDS) as ChordId[]) {
      for (const grau of ['raiz', 'terca', 'quinta'] as const) {
        const semi = alturaDoBaixo(grau, RAIZ, id, 0) - RAIZ;
        expect(graus(id), `${id}/${grau}: ${semi} não é do acorde (${graus(id)})`).toContain(semi);
      }
    }
  });

  it('a quinta grave é uma oitava abaixo da quinta do acorde', () => {
    for (const id of Object.keys(CHORDS) as ChordId[]) {
      expect(alturaDoBaixo('quintaGrave', RAIZ, id, 0), id)
        .toBe(alturaDoBaixo('quinta', RAIZ, id, 0) - 12);
      // e fica ABAIXO da fundamental, que é o ponto de ser grave
      expect(alturaDoBaixo('quintaGrave', RAIZ, id, 0), id).toBeLessThan(RAIZ);
    }
  });

  /**
   * **A aproximação conduz, e não sorteia** — isto era um defeito, achado em 19/11: ela escolhia o
   * lado com `Math.random()`, então a mesma progressão aproximava por baixo numa volta do loop e por
   * cima na outra. A nota mais importante da linha trocava de lugar a cada laço.
   *
   * A regra é a de um baixista: **contra o movimento**. Subindo, entra-se por baixo; descendo, por
   * cima; e com a fundamental repetida, por baixo — que soa como condução, não como erro.
   */
  it('a aproximação conduz para a fundamental seguinte, e é sempre a mesma', () => {
    // subindo (dó3 → sol3): entra por baixo, no fá♯
    expect(alturaDoBaixo('aprox', 48, 'maior', 55)).toBe(54);
    // descendo (sol3 → dó3): entra por cima, no dó♯
    expect(alturaDoBaixo('aprox', 55, 'maior', 48)).toBe(49);
    // mesma fundamental: por baixo
    expect(alturaDoBaixo('aprox', 48, 'maior', 48)).toBe(47);
    // e não muda entre chamadas: nada de sorteio
    const vistos = new Set<number>();
    for (let i = 0; i < 60; i++) vistos.add(alturaDoBaixo('aprox', 48, 'maior', 55));
    expect([...vistos]).toEqual([54]);
  });
});

describe('o samba', () => {
  it('toca a quinta GRAVE, nunca a aguda', () => {
    const quintas = GROOVES.samba.bass.filter(([, g]) => g.startsWith('quinta')).map(([, g]) => g);
    expect(quintas.length).toBeGreaterThan(0);
    expect(quintas.every(g => g === 'quintaGrave'), quintas.join(',')).toBe(true);
  });

  /**
   * **A linha que ele ditou em 19/11, na terceira versão** — as duas primeiras eram minhas leituras
   * erradas das palavras dele: *"um tempo em cada nota, tipo — colcheia pontuada e semicolcheia na
   * tônica, aí colcheia pontuada e semicolcheia na quinta, depois repete"*.
   *
   * Um tempo por nota harmônica, e dentro do tempo a dupla: colcheia pontuada (3 passos) +
   * semicolcheia (1), as duas na mesma nota. São oito ataques no compasso.
   */
  it('é colcheia pontuada + semicolcheia, um tempo por nota', () => {
    expect(GROOVES.samba.bass).toEqual([
      [0, 'raiz', 3], [3, 'raiz', 1],
      [4, 'quintaGrave', 3], [7, 'quintaGrave', 1],
      [8, 'raiz', 3], [11, 'raiz', 1],
      [12, 'quintaGrave', 3], [15, 'quintaGrave', 1],
    ]);
  });

  it('cada dupla fecha um tempo exato, e o compasso fecha nos quatro', () => {
    const bass = GROOVES.samba.bass;
    const porTempo = GROOVES.samba.grid / GROOVES.samba.tempos;
    for (let i = 0; i < bass.length; i += 2) {
      const [p1, , d1] = bass[i];
      const [p2, , d2] = bass[i + 1];
      // a colcheia pontuada começa no tempo, a semicolcheia emenda e as duas somam um tempo
      expect(p1 % porTempo, `dupla ${i / 2 + 1}`).toBe(0);
      expect(p2).toBe(p1 + d1);
      expect(d1 + d2, `dupla ${i / 2 + 1}`).toBe(porTempo);
    }
    expect(bass.length / 2).toBe(GROOVES.samba.tempos);
  });

  it('a tônica nos tempos ímpares e a quinta grave nos pares', () => {
    const porDupla = GROOVES.samba.bass.filter((_, i) => i % 2 === 0).map(([, g]) => g);
    expect(porDupla).toEqual(['raiz', 'quintaGrave', 'raiz', 'quintaGrave']);
    // e a semicolcheia repete a nota da sua dupla, não a da seguinte
    for (let i = 0; i < GROOVES.samba.bass.length; i += 2) {
      expect(GROOVES.samba.bass[i + 1][1]).toBe(GROOVES.samba.bass[i][1]);
    }
  });

  /**
   * E o encaixe que ninguém combinou: a semicolcheia cai no **último passo do tempo**, que é onde o
   * micro-tempo adianta 27 ms (a 88 bpm). É dela que vem a antecipação do samba.
   */
  it('a semicolcheia cai onde o micro-tempo adianta', () => {
    const porTempo = GROOVES.samba.grid / GROOVES.samba.tempos;
    for (const [passo, , dur] of GROOVES.samba.bass) {
      if (dur !== 1) continue;
      expect(passo % porTempo).toBe(porTempo - 1);
      expect(desvioDoPasso(GROOVES.samba, passo, 0.17045)).toBeLessThan(0);
    }
  });
});

describe('bossa nova e baião saíram', () => {
  it('não há levada nem progressão deles', () => {
    expect(Object.keys(GROOVES)).not.toContain('bossa');
    expect(Object.keys(GROOVES)).not.toContain('baiao');
    expect(PRESETS.map(p => p.id)).not.toContain('bossa');
    expect(PRESETS.map(p => p.id)).not.toContain('baiao');
  });

  it('e as levadas que ficaram continuam inteiras', () => {
    expect(Object.keys(GROOVES).sort()).toEqual(['balada', 'nenhum', 'rock', 'samba', 'shuffle', 'swing', 'valsa']);
    for (const [nome, g] of Object.entries(GROOVES)) {
      expect(g.bass.length, `${nome}: sem baixo`).toBeGreaterThan(0);
      for (const [passo, , dur] of g.bass) {
        expect(passo, `${nome}: passo fora da grade`).toBeLessThan(g.grid);
        expect(dur, `${nome}: duração não positiva`).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Empréstimos e modulação — 19/11/2026, decidido em sete perguntas.
//
// A progressão era uma lista de graus de UM campo. Empréstimo é acorde de fora que não muda o
// centro; modulação é uma MARCA que troca o centro do ponto em diante. As duas peças resolvem na
// mesma passada, e é isso que este bloco mede.

const CONV = 'pt' as const;
const DO_MAIOR = { fifths: 0, mode: 'maior' as const };

describe('os empréstimos saem da lista curada', () => {
  it('em dó maior, a grafia vem do grau de onde o empréstimo vem', () => {
    const { chords } = resolverProgressaoParaTeste(
      [{ deg: 6, emp: 'bVI' }, { deg: 7, emp: 'bVII' }, { deg: 4, emp: 'iv' }, { deg: 2, emp: 'bII' }],
      DO_MAIOR, false, CONV);
    // Lá♭, e não Sol♯ — é a razão de `grau`/`alt` existirem
    expect(chords.map(c => c.symbol)).toEqual(['A♭', 'B♭', 'Fm', 'D♭']);
    expect(chords.map(c => c.roman)).toEqual(['♭VI', '♭VII', 'iv', '♭II']);
  });

  it('em lá menor, o vii° é o sétimo grau ELEVADO', () => {
    const { chords } = resolverProgressaoParaTeste([{ deg: 7, emp: 'viio' }, { deg: 5, emp: 'V' }], { fifths: 0, mode: 'menor' }, false, CONV);
    // em lá menor o sétimo grau é sol; o empréstimo é sol♯ diminuto
    expect(chords[0].symbol).toBe('G♯°');
    expect(chords[1].symbol).toBe('E');
  });

  it('com tétrades, o empréstimo vem com a sétima da lista', () => {
    const { chords } = resolverProgressaoParaTeste([{ deg: 7, emp: 'bVII' }, { deg: 4, emp: 'iv' }], DO_MAIOR, true, CONV);
    // o ♭VII do campo maior é DOMINANTE (o backdoor), e o iv é menor com sétima
    expect(chords.map(c => c.symbol)).toEqual(['B♭7', 'Fm7']);
  });
});

describe('a modulação é uma marca', () => {
  it('não ocupa compasso, e troca o centro do ponto em diante', () => {
    const { chords, porItem, noFim } = resolverProgressaoParaTeste(
      [{ deg: 1 }, { mod: { fifths: -1, mode: 'maior' } }, { deg: 1 }, { deg: 5 }],
      DO_MAIOR, false, CONV);
    // três compassos, quatro itens
    expect(chords).toHaveLength(3);
    expect(porItem).toEqual([0, null, 1, 2]);
    // o primeiro I é dó; depois da marca, o I é FÁ e o V é dó
    expect(chords.map(c => c.symbol)).toEqual(['C', 'F', 'C']);
    // e o romano é relativo à tonalidade em vigor: o dó do fim é o V de fá, não o I
    expect(chords.map(c => c.roman)).toEqual(['I', 'I', 'V']);
    expect(noFim).toEqual({ fifths: -1, mode: 'maior' });
  });

  it('dá para modular várias vezes, e a última manda no fim', () => {
    const { chords, noFim } = resolverProgressaoParaTeste(
      [{ mod: { fifths: 2, mode: 'maior' } }, { deg: 1 }, { mod: { fifths: 0, mode: 'menor' } }, { deg: 1 }],
      DO_MAIOR, false, CONV);
    expect(chords.map(c => c.symbol)).toEqual(['D', 'Am']);
    expect(noFim.mode).toBe('menor');
  });

  it('cada compasso sabe em que tonalidade está', () => {
    const { chords } = resolverProgressaoParaTeste(
      [{ deg: 1 }, { mod: { fifths: 0, mode: 'menor' } }, { deg: 1 }], DO_MAIOR, false, CONV);
    expect(chords[0].tom).toEqual(DO_MAIOR);
    expect(chords[1].tom).toEqual({ fifths: 0, mode: 'menor' });
  });

  it('sem marca nenhuma, nada muda — a progressão de sempre', () => {
    const { chords, porItem, noFim } = resolverProgressaoParaTeste([{ deg: 1 }, { deg: 5 }, { deg: 6 }, { deg: 4 }], DO_MAIOR, false, CONV);
    expect(chords.map(c => c.symbol)).toEqual(['C', 'G', 'Am', 'F']);
    expect(porItem).toEqual([0, 1, 2, 3]);
    expect(noFim).toEqual(DO_MAIOR);
  });
});

describe('o preset que mostra as duas peças', () => {
  it('existe, modula para a relativa menor e usa o V emprestado', () => {
    const p = PRESETS.find(x => x.id === 'modula');
    expect(p, 'o preset de modulação não existe').toBeTruthy();
    const { chords, noFim } = resolverProgressaoParaTeste(p!.items, { fifths: 0, mode: p!.mode }, p!.tetrads, CONV);
    expect(noFim).toEqual({ fifths: 0, mode: 'menor' });
    // o ii–V–I de dó e, depois da marca, o iiø–V7–i de lá menor
    expect(chords.map(c => c.symbol)).toEqual(['Dm7', 'G7', 'C7M', 'C7M', 'Bm7(♭5)', 'E7', 'Am7', 'Am7']);
    // o V da menor é maior: é o empréstimo, não o v diatônico
    expect(chords[5].type).toBe('7');
  });
});

// ---------------------------------------------------------------------------
// O voicing do acompanhamento — 19/11/2026, da revisão que ele pediu.
//
// O que havia colapsava o acorde numa oitava só (`55 + mod(pc + semi - 55, 12)`): o dó maior saía em
// segunda inversão, o Cmaj7 com o si colado no dó, o Am7 com o sol colado no lá — e nenhum acorde
// olhava o anterior. Agora é o motor de `theory/voicings.ts`, escolhendo o que **move menos** sem
// encardir embaixo.
describe('o voicing do acompanhamento', () => {
  const vozesDe = (p: typeof PRESETS[number]) =>
    resolverProgressaoParaTeste(p.items as never, { fifths: 0, mode: p.mode }, p.tetrads, CONV).chords;

  it('toda nota é nota do acorde', () => {
    for (const p of PRESETS) {
      for (const c of vozesDe(p)) {
        const doAcorde = new Set(CHORDS[c.type].degs.map(([, semi]) => mod(pc(c.root) + semi, 12)));
        for (const m of c.vozes) {
          expect([...doAcorde], `${p.id}/${c.symbol}: ${m} fora do acorde`).toContain(mod(m, 12));
        }
        // e nenhum grau do acorde desaparece, a não ser a quinta que o motor tira nas extensões
        const tocadas = new Set(c.vozes.map(m => mod(m, 12)));
        expect(doAcorde.size - tocadas.size, `${p.id}/${c.symbol}: faltou grau`).toBeLessThanOrEqual(1);
      }
    }
  });

  /**
   * **Nada menor que uma terça menor abaixo do dó central.** É a regra de prática que o primeiro
   * critério (mover pouco) violava: ele escolhia sempre o voicing mais compacto, que é o aglomerado.
   */
  it('não encardi embaixo: nenhuma segunda abaixo do dó central', () => {
    for (const p of PRESETS) {
      for (const c of vozesDe(p)) {
        for (let i = 1; i < c.vozes.length; i++) {
          if (c.vozes[i - 1] >= 60) continue;
          expect(c.vozes[i] - c.vozes[i - 1], `${p.id}/${c.symbol}: ${c.vozes}`).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('conduz as vozes: o movimento médio fica abaixo de dois semitons', () => {
    for (const p of PRESETS) {
      const cs = vozesDe(p);
      let soma = 0, n = 0;
      for (let i = 1; i < cs.length; i++) {
        for (const m of cs[i].vozes) { soma += Math.min(...cs[i - 1].vozes.map(a => Math.abs(a - m))); n++; }
      }
      if (!n) continue;
      expect(soma / n, `${p.id}`).toBeLessThan(2);
    }
  });

  it('acorde repetido soa igual, e a volta do loop soa igual — o voicing é decidido na resolução', () => {
    const cs = resolverProgressaoParaTeste([{ deg: 1 }, { deg: 1 }], { fifths: 0, mode: 'maior' }, true, CONV).chords;
    expect(cs[0].vozes).toEqual(cs[1].vozes);
    // duas resoluções da mesma progressão dão o mesmo som (nada de sorteio aqui)
    const outra = resolverProgressaoParaTeste([{ deg: 1 }, { deg: 1 }], { fifths: 0, mode: 'maior' }, true, CONV).chords;
    expect(outra.map(c => c.vozes)).toEqual(cs.map(c => c.vozes));
  });

  it('e o acorde cabe na região de duas mãos, sem invadir o agudo da melodia', () => {
    for (const p of PRESETS) {
      for (const c of vozesDe(p)) {
        expect(Math.min(...c.vozes), `${p.id}/${c.symbol}`).toBeGreaterThanOrEqual(36);
        expect(Math.max(...c.vozes), `${p.id}/${c.symbol}`).toBeLessThanOrEqual(84);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Duração por compasso — 19/11/2026, da revisão.
//
// Antes todo acorde durava exatamente um compasso, e era o limite que mais aparecia ao escrever
// música de verdade: nem ii–V dentro do mesmo compasso, nem tônica de dois.

describe('a linha do tempo', () => {
  it('um compasso cada é o de sempre', () => {
    const { janelas, total } = linhaDoTempo([{}, {}, {}, {}], 16);
    expect(janelas).toEqual([{ inicio: 0, fim: 16 }, { inicio: 16, fim: 32 }, { inicio: 32, fim: 48 }, { inicio: 48, fim: 64 }]);
    expect(total).toBe(64);
  });

  it('meio compasso é meio, e dois são dois', () => {
    const { janelas, total } = linhaDoTempo([{ dur: 0.5 }, { dur: 0.5 }, { dur: 2 }], 16);
    expect(janelas.map(j => j.fim - j.inicio)).toEqual([8, 8, 32]);
    expect(total).toBe(48);
  });

  /**
   * **O loop fecha em compasso inteiro**, e o último acorde estica para isso. A levada é periódica
   * por compasso (`i % grid`): um loop quebrado faria a bateria entrar fora de fase com a harmonia a
   * cada volta, o que soa como defeito e não como música.
   */
  it('soma quebrada: o último estica até fechar o compasso', () => {
    const { janelas, total } = linhaDoTempo([{ dur: 0.5 }, { dur: 0.5 }, { dur: 0.5 }], 16);
    expect(total).toBe(32);
    expect(janelas[2]).toEqual({ inicio: 16, fim: 32 });
  });

  it('na grade de tercinas (swing), meio compasso são seis passos', () => {
    const { janelas } = linhaDoTempo([{ dur: 0.5 }, { dur: 1 }], 12);
    expect(janelas.map(j => j.fim - j.inicio)).toEqual([6, 18]);
  });

  it('progressão vazia não quebra, e um acorde só ocupa um compasso', () => {
    expect(linhaDoTempo([], 16)).toEqual({ janelas: [], total: 16 });
    expect(linhaDoTempo([{}], 16).janelas).toEqual([{ inicio: 0, fim: 16 }]);
  });

  it('todo passo do loop tem exatamente um acorde soando', () => {
    for (const durs of [[{}, {}], [{ dur: 0.5 as const }, { dur: 2 as const }, {}], [{ dur: 2 as const }]]) {
      const { janelas, total } = linhaDoTempo(durs, 16);
      for (let p = 0; p < total; p++) {
        const quantos = janelas.filter(j => p >= j.inicio && p < j.fim).length;
        expect(quantos, `passo ${p} de ${JSON.stringify(durs)}`).toBe(1);
      }
    }
  });
});

describe('compasso ternário', () => {
  it('a valsa tem três tempos; todas as outras, quatro', () => {
    expect(GROOVES.valsa.tempos).toBe(3);
    expect(GROOVES.valsa.grid).toBe(12);
    for (const [nome, g] of Object.entries(GROOVES)) {
      if (nome === 'valsa') continue;
      expect(g.tempos, nome).toBe(4);
    }
  });

  /**
   * `grid / tempos` é o que o relógio usa como passos por tempo. Com `grid / 4` fixo — que era o
   * código antes —, a valsa tocaria em 4/4 com a grade de 12, ou seja, fora de compasso.
   */
  it('os passos por tempo saem de grid/tempos, e são inteiros em toda levada', () => {
    for (const [nome, g] of Object.entries(GROOVES)) {
      const passosPorTempo = g.grid / g.tempos;
      expect(Number.isInteger(passosPorTempo), `${nome}: ${passosPorTempo}`).toBe(true);
      expect(passosPorTempo, nome).toBeGreaterThanOrEqual(3);
    }
  });

  it('e a valsa cabe na linha do tempo: meio compasso são seis passos', () => {
    // no meio da progressão, meio compasso é meio mesmo
    expect(linhaDoTempo([{ dur: 0.5 }, { dur: 0.5 }, { dur: 1 }], GROOVES.valsa.grid).janelas.map(j => j.fim - j.inicio)).toEqual([6, 6, 12]);
    // no FIM, ele estica para o loop fechar redondo — a regra de sempre, agora em 3/4
    expect(linhaDoTempo([{ dur: 1 }, { dur: 0.5 }], GROOVES.valsa.grid).janelas.map(j => j.fim - j.inicio)).toEqual([12, 12]);
  });
});

// ---------------------------------------------------------------------------
// Guardar a progressão — 19/11/2026, da revisão: *"o que você monta se perde"*.
//
// A leitura valida a forma porque configuração guardada é **dado de fora**: pode vir de uma versão
// antiga do app, e dado de fora que entra sem conferência quebra a tela de quem só abriu o app.

describe('a progressão guardada', () => {
  const bom = { items: [{ deg: 1 }, { mod: { fifths: 0, mode: 'menor' } }, { deg: 5 }], fifths: -1, mode: 'maior', tetrads: true, style: 'samba', bpm: 98 };

  it('volta inteira quando está íntegra', () => {
    expect(lerGuardado(JSON.stringify(bom))).toEqual(bom);
  });

  /**
   * Os três de som (contagem, baixo, timbre) foram para a gaveta depois: uma versão guardada antes
   * não os tem, e a leitura precisa aceitar isso em vez de recusar a progressão inteira.
   */
  it('aceita versão antiga, sem os interruptores de som', () => {
    const lido = lerGuardado(JSON.stringify(bom));
    expect(lido!.contagem).toBeUndefined();
    const novo = { ...bom, contagem: false, bassOn: false, acordesOn: false, compVoice: 'pad' };
    expect(lerGuardado(JSON.stringify(novo))).toEqual(novo);
    // e timbre que não existe é ignorado, não derruba o resto
    const torto = lerGuardado(JSON.stringify({ ...bom, compVoice: 'cravo' }));
    expect(torto!.items).toHaveLength(3);
    expect(torto!.compVoice).toBeUndefined();
  });

  it('recusa o que não é progressão, sem quebrar', () => {
    for (const cru of [
      undefined, null, 42, '', 'nada disso', '{', '[]',
      JSON.stringify({ ...bom, items: [] }),
      JSON.stringify({ ...bom, items: [{ nada: 1 }] }),
      JSON.stringify({ ...bom, items: 'quatro acordes' }),
      JSON.stringify({ ...bom, fifths: 'dó' }),
      JSON.stringify({ ...bom, bpm: null }),
      JSON.stringify({ ...bom, mode: 'lídio' }),
      JSON.stringify({ ...bom, style: 'bossa' }),
    ]) {
      expect(lerGuardado(cru as never), String(cru).slice(0, 40)).toBeNull();
    }
  });

  /**
   * A levada **bossa** saiu em 19/11, e uma progressão guardada antes disso ainda a nomeia. Recusar
   * é o certo: cair numa levada que não existe mais deixaria a tela sem o que tocar.
   */
  it('e recusa levada que não existe mais — o caso do bossa removido', () => {
    expect(lerGuardado(JSON.stringify({ ...bom, style: 'baiao' }))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Micro-tempo do samba — 19/11/2026, pedido dele com os números: *"um atraso sutil (de uns 12 ms em
// 120 bpm) na segunda semicolcheia e adiantamento na terceira e quarta (de uns 20 ms em 120 bpm)"*.
//
// Guardado em **fração da semicolcheia**, e não em milissegundos: assim o balanço é o mesmo balanço
// em qualquer andamento. O teste confere os milissegundos nos dois andamentos que importam.

describe('o micro-tempo', () => {
  /** A duração de um passo (semicolcheia), em segundos. */
  const sd = (bpm: number, g = GROOVES.samba) => 60 / bpm / (g.grid / g.tempos);
  const ms = (bpm: number, step: number) => Math.round(desvioDoPasso(GROOVES.samba, step, sd(bpm)) * 1000 * 10) / 10;

  it('a 120 bpm dá os números que ele pediu', () => {
    expect(ms(120, 0)).toBe(0);     // a que cai no tempo não se mexe
    expect(ms(120, 1)).toBe(12);    // a segunda atrasa 12 ms
    expect(ms(120, 2)).toBe(-20);   // a terceira adianta 20 ms
    expect(ms(120, 3)).toBe(-20);   // a quarta também
  });

  it('e o mesmo balanço vale em outro andamento, proporcional', () => {
    // a 98 bpm (o andamento do preset) a semicolcheia é maior, e o desvio acompanha
    expect(ms(98, 1)).toBeCloseTo(14.7, 1);
    expect(ms(98, 2)).toBeCloseTo(-24.5, 1);
    // a 160 bpm ele encolhe
    expect(ms(160, 1)).toBeCloseTo(9, 1);
  });

  it('vale em todos os quatro tempos do compasso, e não só no primeiro', () => {
    for (const tempo of [0, 1, 2, 3]) {
      const base = tempo * 4;
      expect(ms(120, base), `tempo ${tempo + 1}`).toBe(0);
      expect(ms(120, base + 1), `tempo ${tempo + 1}`).toBe(12);
      expect(ms(120, base + 2), `tempo ${tempo + 1}`).toBe(-20);
      expect(ms(120, base + 3), `tempo ${tempo + 1}`).toBe(-20);
    }
  });

  /**
   * **O pulso não anda.** O desvio é sempre relativo ao tempo nominal do passo, nunca acumulado: a
   * semicolcheia que cai no tempo fica em zero nos quatro tempos. É o que separa balanço de relógio
   * errado — acumulando, o compasso ficaria mais curto ou mais longo a cada volta.
   */
  it('o tempo forte continua exatamente no lugar', () => {
    for (const bpm of [50, 88, 120, 220]) {
      for (const tempo of [0, 1, 2, 3]) expect(ms(bpm, tempo * 4), `${bpm} bpm`).toBe(0);
    }
  });

  /**
   * O relógio agenda com 80 ms de antecedência (`Clock.start`): um adiantamento maior que isso cairia
   * no passado e o som não sairia. O pior caso é o andamento mais lento que o controle permite.
   */
  it('o adiantamento nunca cai no passado: cabe na antecedência do relógio', () => {
    const pior = Math.max(...[0, 1, 2, 3].map(p => Math.abs(desvioDoPasso(GROOVES.samba, p, sd(50)))));
    expect(pior).toBeLessThan(0.08);
    expect(Math.round(pior * 1000)).toBe(48);
  });

  it('as outras levadas não têm micro-tempo, e seguem retas', () => {
    for (const [nome, g] of Object.entries(GROOVES)) {
      if (nome === 'samba') continue;
      for (let p = 0; p < g.grid; p++) expect(desvioDoPasso(g, p, 0.125), `${nome}/${p}`).toBe(0);
    }
  });
});
