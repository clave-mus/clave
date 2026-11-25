// Escala no instrumento — 20/11/2026, o irmão que faltava na família das superfícies.
//
// O que este arquivo guarda é a **legibilidade do desenho**: um desenho de escala só é uma pergunta
// se ele distinguir uma escala da outra. Três coisas podem quebrar isso sem dar erro nenhum — duas
// escalas com as mesmas notas, uma região que corta notas da escala, e a tônica deixar de ser
// marcada (sem ela, dó maior e ré dórico são a MESMA figura).
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { validate } from './validate';
import { ALL_SCALES, assinaturaDaEscala, note, type ScaleId } from './helpers';
import { midi, mod } from '../theory/core';
import { classesDoModo, digitacoesDaEscala, julgarDigitacao } from '../theory/digitacao-de-escala';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctxCom = (instrument: 'violao' | 'baixo' | 'piano'): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams(instrument, { key: { tonic: 0, mode: 'maior' } }),
});
const item = EXERCISES.filter(isSeries).find(e => e.id === 'escala-no-instrumento') as SeriesItem;
const base = (ctx: Ctx) => ({ ...item.defaults, ...(item.defaultsDo?.(ctx) ?? {}) });

describe('o desenho distingue uma escala da outra', () => {
  /**
   * **O par que empata é um só, e ele é conhecido**: as duas menores melódicas **sobem iguais** —
   * a diferença das duas é na descida, e um desenho não desce. O teste trava o inventário: se
   * entrar uma escala nova que empate com outra, ela aparece aqui, e quem a escrever vai saber que
   * o filtro de distratores precisa cobri-la.
   */
  it('o inventário de escalas que desenham igual é exatamente este', () => {
    const empates: string[] = [];
    for (let pc = 0; pc < 12; pc++) {
      const vistas = new Map<string, ScaleId>();
      for (const id of ALL_SCALES) {
        const chave = assinaturaDaEscala({ ...note(pc), oct: 4 }, id);
        const antes = vistas.get(chave);
        if (antes) empates.push(`${antes} = ${id}`);
        else vistas.set(chave, id);
      }
    }
    expect([...new Set(empates)]).toEqual(['menor-melodica = menor-melodica-jazz']);
  });

  /** E o que não pode acontecer: as duas na MESMA pergunta, como figura repetida. */
  it('nenhuma pergunta oferece duas alternativas com o mesmo desenho', () => {
    for (const instrument of ['piano', 'baixo'] as const) {
      const ctx = ctxCom(instrument);
      for (let i = 0; i < 60; i++) {
        const q = item.make({ ...base(ctx), tipos: [...ALL_SCALES] } as never, ctx);
        if (q.surface.kind !== 'choices') continue;
        expect(new Set(q.surface.options.map(o => o.id)).size).toBe(q.surface.options.length);
        // e as duas melódicas nunca juntas: elas acendem as mesmas teclas
        const rotulos = q.surface.options.map(o => o.label);
        const melodicas = rotulos.filter(r => /mel[óo]dica/i.test(r));
        expect(melodicas.length, melodicas.join(' | ')).toBeLessThan(2);
      }
    }
  });

  it('a tônica é marcada no desenho, nas duas superfícies', () => {
    for (const instrument of ['piano', 'baixo'] as const) {
      const ctx = ctxCom(instrument);
      for (let i = 0; i < 40; i++) {
        const q = item.make({ ...base(ctx), tipos: [...ALL_SCALES] } as never, ctx);
        if (q.visual.kind === 'keyboard') {
          // no piano, a tônica leva o rótulo `1`
          expect(Object.values(q.visual.rotulos ?? {}), 'piano sem rótulo de tônica').toContain('1');
        } else if (q.visual.kind === 'fretboard') {
          // no braço, ela sai no acento — e as outras, não
          const acentos = q.visual.marks.filter(m => m.color === 'var(--mu)');
          expect(acentos.length, 'braço sem tônica no acento').toBeGreaterThan(0);
          expect(acentos.length, 'braço com tudo no acento').toBeLessThan(q.visual.marks.length);
        }
      }
    }
  });

  /**
   * **A região não pode cortar nota da escala.** No braço o desenho são todas as posições da escala
   * entre duas casas; se aquele trecho não alcançar as doze classes, uma escala pode aparecer com
   * menos notas do que tem e virar outra. Nas regiões que o item oferece isso não acontece — as
   * cordas se sobrepõem e o trecho é contínuo —, e é isso que fica travado aqui.
   */
  it.each(['0-5', '5-9', '0-12'])('no braço, a região %s mostra TODAS as classes da escala', casas => {
    const ctx = ctxCom('baixo');
    for (let i = 0; i < 30; i++) {
      const q = item.make({ ...base(ctx), casas, tipos: [...ALL_SCALES] } as never, ctx);
      if (q.visual.kind !== 'fretboard') continue;
      const desenhadas = new Set(q.visual.marks.map(m => mod(q.visual.kind === 'fretboard' ? q.visual.tuning[m.s] + m.f : 0, 12)));
      const queSoam = new Set((q.sound?.groups ?? []).flat().map(m => mod(m, 12)));
      for (const pc of queSoam) expect(desenhadas.has(pc), `classe ${pc} soa e não aparece em ${casas}`).toBe(true);
    }
  });
});

describe('as duas direções', () => {
  /**
   * **Desenhar existe nas duas superfícies desde 25/11** — e no braço é outro exercício: montar
   * uma DIGITAÇÃO, com dezenas de respostas certas. No piano continua sendo marcar as notas da
   * escala, onde a resposta é uma só (decisão dele, e o motor de digitação é o que faltava).
   */
  it('no braço, desenhar é montar uma digitação; no piano, marcar as notas', () => {
    const noBraco = ctxCom('baixo');
    const q = item.make({ ...base(noBraco), direcao: 'desenhar' } as never, noBraco);
    expect(q.expected.kind).toBe('digitacao');
    expect(q.surface.kind).toBe('fretboard');
    // oito toques — tônica a tônica, fechando na oitava (ele relatou em 25/11 que parar na sétima
    // era o único aceito) — e braço alto para o dedo no celular deitado
    expect('quantas' in q.surface && q.surface.quantas).toBe(8);
    expect('alto' in q.surface && q.surface.alto).toBe(true);

    const noPiano = ctxCom('piano');
    const p = item.make({ ...base(noPiano), instrumento: 'piano', direcao: 'desenhar' } as never, noPiano);
    expect(p.expected.kind).toBe('contorno');
  });

  it('a digitação pedida tem pelo menos uma resposta possível no braço', () => {
    const ctx = ctxCom('baixo');
    for (let i = 0; i < 40; i++) {
      const q = item.make({ ...base(ctx), direcao: 'desenhar' } as never, ctx);
      if (q.expected.kind !== 'digitacao') continue;
      const achadas = digitacoesDaEscala({ ...q.expected, maxCasa: 12, limite: 60 });
      expect(achadas.length, `${q.expected.familia}/${q.expected.grau} sem digitação`).toBeGreaterThan(0);
      // e o que a busca devolve é aceito pelo juiz da pergunta
      expect(julgarDigitacao(achadas[0], q.expected).certo).toBe(true);
    }
  });

  it('desenhando, a conferência é o contorno das notas da escala', () => {
    const ctx = ctxCom('piano');
    const q = item.make({ ...base(ctx), instrumento: 'piano', direcao: 'desenhar' } as never, ctx);
    expect(q.expected.kind).toBe('contorno');
    expect(q.surface.kind).toBe('keyboard');
    // e a escala não toca sozinha: ouvir é escolha de quem responde, senão vira ditado
    expect(q.autoplay).toBe(false);
  });

  it('identificando, todas as alternativas partem da mesma tônica', () => {
    const ctx = ctxCom('piano');
    for (let i = 0; i < 30; i++) {
      const q = item.make({ ...base(ctx), instrumento: 'piano', tipos: [...ALL_SCALES] } as never, ctx);
      if (q.surface.kind !== 'choices') continue;
      const tonicas = new Set(q.surface.options.map(o => o.label.split(' ')[0]));
      expect(tonicas.size, `alternativas com tônicas diferentes: ${[...tonicas].join(', ')}`).toBe(1);
    }
  });
});

/**
 * **Vários desenhos na mesma rodada** (decisão dele na Q2, 25/11): até cinco, e eles têm de ser
 * diferentes entre si — repetir o mesmo desenho é justamente o que o modo existe para evitar.
 */
describe('a rodada de vários desenhos', () => {
  const ctx = ctxCom('baixo');
  const pergunta = (desenhos: string, extra: Record<string, unknown> = {}) =>
    item.make({ ...base(ctx), direcao: 'desenhar', desenhos, casas: '0-12', ...extra } as never, ctx);

  it('sem fechar na oitava, são sete por desenho', () => {
    const q = pergunta('2', { oitava: false });
    expect('quantas' in q.surface && q.surface.quantas).toBe(14);
  });

  it.each(['1', '2', '3', '5'])('pede 8 × %s posições, fechando na oitava', desenhos => {
    const q = pergunta(desenhos);
    expect('quantas' in q.surface && q.surface.quantas).toBe(8 * Number(desenhos));
    expect(q.expected.kind === 'digitacao' && q.expected.desenhos).toBe(Number(desenhos));
  });

  it('aceita desenhos diferentes e recusa o mesmo repetido', () => {
    const q = pergunta('2');
    if (q.expected.kind !== 'digitacao') throw new Error('era para ser digitação');
    const ds = digitacoesDaEscala({ ...q.expected, maxCasa: 12, limite: 60 });
    expect(ds.length).toBeGreaterThan(1);
    const resposta = (grupos: typeof ds) => ({
      kind: 'pitches' as const,
      midis: grupos.flat().map(p => q.expected.kind === 'digitacao' ? q.expected.tuning[p.corda] + p.casa : 0),
      posicoes: grupos.flat(),
    });
    expect(validate(q.expected, resposta([ds[0], ds[1]])), 'dois diferentes').toBe(true);
    expect(validate(q.expected, resposta([ds[0], ds[0]])), 'o mesmo duas vezes').toBe(false);
  });

  it('recusa quando um dos desenhos é inválido', () => {
    const q = pergunta('2');
    if (q.expected.kind !== 'digitacao') throw new Error('era para ser digitação');
    const ds = digitacoesDaEscala({ ...q.expected, maxCasa: 12, limite: 60 });
    const quebrado = [...ds[1].slice(0, 6), { corda: ds[1][6].corda, casa: ds[1][6].casa + 1 }];
    const grupos = [ds[0], quebrado];
    expect(validate(q.expected, {
      kind: 'pitches',
      midis: grupos.flat().map(p => q.expected.kind === 'digitacao' ? q.expected.tuning[p.corda] + p.casa : 0),
      posicoes: grupos.flat(),
    })).toBe(false);
  });
});

/**
 * **Região curta não dá desenho para todo mundo** — medido na tela em 25/11: com as casas 0–5 e
 * vão de 4, um modo costuma ter UM desenho, e o botão de sugestão se esgotava no segundo toque.
 * Pedir três diferentes ali é pergunta sem resposta, e a decisão 13 manda recusar e explicar.
 */
describe('a recusa quando não há desenho de sobra', () => {
  const ctx = ctxCom('baixo');
  const recusa = (extra: Record<string, unknown>) =>
    item.problema?.({ ...base(ctx), direcao: 'desenhar', ...extra } as never, ctx) ?? null;

  it('recusa cinco desenhos numa região apertada', () => {
    expect(recusa({ desenhos: '5', casas: '0-5', vao: '3', familia: ['maior'], graus: ['1'] })).toBeTruthy();
  });

  it('não recusa um desenho só, nem o braço inteiro', () => {
    expect(recusa({ desenhos: '1', casas: '0-5', vao: '3' })).toBeNull();
    expect(recusa({ desenhos: '3', casas: '0-12', vao: '4' })).toBeNull();
  });

  it('a pergunta sorteada sempre tem desenhos suficientes para o que pediu', () => {
    for (const desenhos of ['2', '3', '4']) {
      for (let i = 0; i < 12; i++) {
        const q = item.make({ ...base(ctx), direcao: 'desenhar', desenhos, casas: '0-12' } as never, ctx);
        if (q.expected.kind !== 'digitacao') continue;
        const achadas = digitacoesDaEscala({ ...q.expected, maxCasa: 12, limite: 60 });
        expect(achadas.length, `${q.expected.familia}/${q.expected.grau} com ${desenhos}`).toBeGreaterThanOrEqual(Number(desenhos));
      }
    }
  });
});

/**
 * **A enarmonia** — ele relatou em 25/11: *"em escalas como a de fá sustenido, seria necessário que
 * todas as notas digitadas seguissem a enarmonia. mesmo acertando, a escala sai com os nomes
 * errados"*. O Player escrevia o nome por uma tabela fixa em sustenidos; agora a pergunta leva a
 * grafia, que sai da escala — e é a teoria que manda, não a tabela.
 */
describe('a grafia das notas segue a escala', () => {
  const ctx = ctxCom('baixo');

  it('toda pergunta de digitação leva a grafia das sete classes', () => {
    for (let i = 0; i < 40; i++) {
      const q = item.make({ ...base(ctx), direcao: 'desenhar' } as never, ctx);
      if (q.expected.kind !== 'digitacao') continue;
      expect(Object.keys(q.grafia ?? {}), 'sem grafia').toHaveLength(7);
      // e ela cobre exatamente as classes do modo
      const classes = classesDoModo(q.expected).sort((a, b) => a - b);
      expect(Object.keys(q.grafia!).map(Number).sort((a, b) => a - b)).toEqual(classes);
    }
  });

  /**
   * O caso que ele deu: em **fá♯ maior** a sétima é **Mi♯**, e não Fá. A tabela fixa do Player
   * escreveria Fá, porque ela só conhece sustenidos sobre as sete naturais.
   */
  it('em fá♯ maior a sétima é Mi♯, não Fá', () => {
    const emFaSustenido = {
      ...ctx,
      params: resolveParams('baixo', { key: { tonic: 6, mode: 'maior' }, material: 'diatonico' }),
    };
    let viu = false;
    for (let i = 0; i < 60; i++) {
      const q = item.make({ ...base(emFaSustenido), direcao: 'desenhar', familia: ['maior'], graus: ['1'] } as never, emFaSustenido);
      if (q.expected.kind !== 'digitacao') continue;
      // a TÔNICA tem de ser fá♯ — mi maior também tem fá♯, e foi nela que eu tropecei escrevendo
      if (mod(midi(q.expected.tonica), 12) !== 6 || q.expected.grau !== 1) continue;
      const nomes = Object.values(q.grafia ?? {});
      viu = true;
      expect(nomes, `fá♯ maior saiu como ${nomes.join(' ')}`).toContain('Mi♯');
      expect(nomes).not.toContain('Fá');
    }
    expect(viu, 'nunca sorteou fá♯ como tônica').toBe(true);
  });
});
