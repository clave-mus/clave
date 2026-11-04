// F1-2 · requisitos de contexto.
//
// O que estes testes vigiam, acima de tudo: **nenhum item exige microfone ou MIDI** (decisões 43
// e 44). Eles são acréscimo opcional e experimental; o dia em que um exercício depender deles,
// isto acusa.
import { beforeEach, describe, expect, it } from 'vitest';
import { cabeNoContexto, CONTEXTOS, limparCacheDeRequisitos, porQueNaoCabe, requisitosDe } from './context';
import { AMBIENTES, EXERCISES, ITEMS, itemById } from './index';

beforeEach(limparCacheDeRequisitos);

describe('o que é declarado e o que é deduzido', () => {
  it('nenhum item EXIGE microfone — é sempre acréscimo opcional', () => {
    expect(ITEMS.filter(i => i.requires.microfone).map(i => i.id)).toEqual([]);
  });

  it('nenhum item tem `midi` como modo padrão de validação', () => {
    // midi pode estar na lista, mas nunca em primeiro: o padrão nunca depende de hardware
    expect(ITEMS.filter(i => i.validation[0] === 'midi').map(i => i.id)).toEqual([]);
  });

  it('todo item declara pelo menos um modo de validação', () => {
    for (const i of ITEMS) expect(i.validation.length).toBeGreaterThan(0);
  });

  it('com instrumento, o padrão é autoavaliação (decisão 37)', () => {
    for (const i of ITEMS) {
      if (i.requires.instrumento) expect(i.validation[0]).not.toBe('deterministic');
    }
  });

  it('os deduzidos saem da forma da pergunta, não de declaração', () => {
    const deOuvido = requisitosDe(itemById['ouvido-intervalo']!);
    expect(deOuvido.olhos).toBe(false);  // o visual é só som
    expect(deOuvido.audio).toBe(true);

    const naPauta = requisitosDe(itemById['que-nota-e-essa']!);
    expect(naPauta.olhos).toBe(true);    // tem pauta na tela
  });

  it('`requires.instrumento` substitui o `mobile` antigo, sem contradizê-lo', () => {
    for (const i of ITEMS) expect(!!i.requires.instrumento).toBe(!i.mobile);
  });
});

describe('os cinco contextos', () => {
  it('com o instrumento, tudo cabe', () => {
    for (const i of ITEMS) expect(cabeNoContexto(i, 'instrumento', true)).toBe(true);
  });

  it('no ônibus, nada que peça o instrumento', () => {
    for (const i of ITEMS) {
      if (i.requires.instrumento) expect(cabeNoContexto(i, 'onibus')).toBe(false);
    }
    expect(cabeNoContexto(itemById['ouvido-intervalo']!, 'onibus')).toBe(true);
    expect(cabeNoContexto(itemById['backing']!, 'onibus')).toBe(false);
  });

  it('em silêncio, nada que toque som', () => {
    expect(cabeNoContexto(itemById['ouvido-intervalo']!, 'silencio')).toBe(false);
    // quiz de teoria é texto puro: cabe sem fone
    expect(cabeNoContexto(itemById['teoria-graus']!, 'silencio')).toBe(true);
  });

  it('"de bolso" está VAZIO hoje, e isso é esperado', () => {
    // Não é defeito: o contexto só aceita o que não usa olhos, mãos, voz, instrumento nem
    // microfone, e o único habitante previsto é o treinamento auditivo hands-free (F6-1), que
    // ainda não existe. Está escrito em catalogo.md.
    //
    // Quando a F6-1 entrar, este teste vira `toBeGreaterThan(0)` — e aí a Praticar para de
    // mostrar um contexto que não leva a lugar nenhum.
    expect(ITEMS.filter(i => cabeNoContexto(i, 'bolso'))).toEqual([]);
  });

  it('cada contexto é mais permissivo que o anterior, menos "silêncio" que é outro eixo', () => {
    const conta = (c: (typeof CONTEXTOS)[number]) => ITEMS.filter(i => cabeNoContexto(i, c)).length;
    expect(conta('bolso')).toBeLessThanOrEqual(conta('onibus'));
    expect(conta('onibus')).toBeLessThanOrEqual(conta('instrumento'));
    expect(conta('instrumento')).toBe(ITEMS.length);
  });

  it('todo contexto exceto "de bolso" tem item — nenhum leva a uma tela vazia', () => {
    for (const c of CONTEXTOS.filter(x => x !== 'bolso')) {
      expect(ITEMS.filter(i => cabeNoContexto(i, c)).length, `contexto ${c} vazio`).toBeGreaterThan(0);
    }
  });
});

describe('o motivo de não caber', () => {
  it('explica em vez de só esconder', () => {
    expect(porQueNaoCabe(itemById['backing']!, 'onibus')).toBe('instrumento');
    expect(porQueNaoCabe(itemById['ouvido-intervalo']!, 'silencio')).toBe('audio');
    expect(porQueNaoCabe(itemById['que-nota-e-essa']!, 'bolso')).toBe('maos');
  });

  it('não dá motivo para o que cabe', () => {
    expect(porQueNaoCabe(itemById['teoria-graus']!, 'onibus')).toBeNull();
  });
});

describe('cobertura', () => {
  it('todo exercício e todo ambiente estão no catálogo unificado', () => {
    expect(ITEMS.length).toBe(EXERCISES.length + AMBIENTES.length);
    expect(new Set(ITEMS.map(i => i.id)).size).toBe(ITEMS.length);
  });
});

// O "Pronto quando" da F1-2 pedia dois travamentos, e só o da lista de ids existia.
describe('o tipo de término de cada item está travado (decisão 5)', () => {
  // `kind` é propriedade do item, não configuração: decide o executor E o que a etapa consegue
  // afirmar. Mudar o de um item muda o que a rotina pode dizer sobre ele, então muda aqui de
  // propósito, com a decisão na mão.
  const ambientes: Record<string, string> = {
    metronomo: 'ambiente', ambiente: 'ambiente', backing: 'ambiente', leitura: 'ambiente', ritmo: 'ambiente', tecnica: 'tarefa',
    // a "tarefa com metrônomo": cinco famílias, todas `tarefa` — terminam na autoavaliação
    'acento-deslocado': 'tarefa', 'subdivisao-alternada': 'tarefa', 'sustentar-e-cortar': 'tarefa',
    'legato-staccato': 'tarefa', 'deslocamento-ritmico': 'tarefa',
  };

  it('toda série declara `kind: serie`', () => {
    for (const e of EXERCISES) expect(e.kind, e.id).toBe('serie');
  });

  it('cada ferramenta tem o `kind` esperado, e não há ferramenta fora da lista', () => {
    expect(Object.fromEntries(AMBIENTES.map(a => [a.id, a.kind]))).toEqual(ambientes);
  });

  // A garantia que importa: só `serie` produz tentativa conferida. `ambiente` e `tarefa` não têm
  // `make`, então nunca passam pelo Player e nunca gravam `outcome: 'correct'` — "feito" nunca vira
  // "certo" (decisão 5).
  it('nenhum item que não é série tem `make`, e portanto nenhum grava resposta certa', () => {
    for (const i of ITEMS.filter(x => x.kind !== 'serie')) expect(i.make, i.id).toBeUndefined();
  });

  it('e toda série tem `make`', () => {
    for (const i of ITEMS.filter(x => x.kind === 'serie')) expect(typeof i.make, i.id).toBe('function');
  });
});
