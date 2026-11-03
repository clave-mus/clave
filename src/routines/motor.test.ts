// F3-8 · rotação de parâmetro · F3-4 · ciclagem.
//
// O contrato da F3-8 é duro e é o que importa: percorrer uma rotação de 12 tonalidades com avanço
// manual, fechando e reabrindo o app entre cada avanço, mantendo posição e histórico de visitas.
import { describe, expect, it } from 'vitest';
import { ordemDasEtapas, resolverInstancia, trocarInstancia } from './ciclagem';
import {
  aindaNaoVisitados, ALVO_DA_ROTACAO, avancar, CICLO_DE_QUARTAS, efeitoDaRotacao, irPara,
  jaPassouPor, registrarExecucao, sessoesNoValorAtual, voltar,
} from './rotacao';
import { ROTACIONAVEIS, type Etapa, type Rotina } from './types';

const rotina = (over: Partial<Rotina> = {}): Rotina => ({
  formato: 1, id: 'r', nome: 'Internalizar uma tonalidade', modo: 'guiado',
  embaralhar: false, params: {}, etapas: [], ...over,
});

const comRotacaoDeTonalidade = (posicao = 0) =>
  rotina({
    rotacao: { param: 'tonalidade', valores: CICLO_DE_QUARTAS, posicao, avanco: { kind: 'manual' }, visitas: [] },
  });

const etapa = (n: number, politica: Etapa['politica'] = 'ordem', ultimaUsada?: number): Etapa => ({
  id: 'e', politica, ultimaUsada,
  instancias: Array.from({ length: n }, (_, i) => ({ itemId: `item-${i}`, settings: {} })),
});

// ===========================================================================
describe('rotação: o que ela injeta na execução', () => {
  it('tonalidade vira parâmetro global, não configuração do item', () => {
    const r = comRotacaoDeTonalidade(1);
    r.rotacao!.valores = [{ tonic: 0, mode: 'maior' }, { tonic: 7, mode: 'maior' }];
    expect(efeitoDaRotacao(r)).toEqual({ params: { key: { tonic: 7, mode: 'maior' } }, settings: {} });
  });

  it('corda vira configuração do item, não parâmetro global', () => {
    const r = rotina({ rotacao: { param: 'corda', valores: [0, 1, 2, 3], posicao: 2, avanco: { kind: 'manual' }, visitas: [] } });
    expect(efeitoDaRotacao(r)).toEqual({ params: {}, settings: { corda: 2 } });
  });

  it('sem rotação, não injeta nada', () => {
    expect(efeitoDaRotacao(rotina())).toEqual({ params: {}, settings: {} });
  });

  it('lista vazia não quebra', () => {
    const r = rotina({ rotacao: { param: 'tonalidade', valores: [], posicao: 0, avanco: { kind: 'manual' }, visitas: [] } });
    expect(efeitoDaRotacao(r)).toEqual({ params: {}, settings: {} });
  });

  it('todo rotacionável declarado tem alvo', () => {
    for (const k of ROTACIONAVEIS) expect(ALVO_DA_ROTACAO[k]).toBeDefined();
  });
});

describe('rotação: avanço manual', () => {
  it('o contrato da tarefa: 12 tonalidades, avanço manual, fechando o app entre cada uma', () => {
    // "fechar o app" = serializar e reler, que é o que o localStorage faz
    let r = comRotacaoDeTonalidade();
    for (let volta = 0; volta < 12; volta++) {
      r = registrarExecucao(r, 1000 + volta).rotina;
      r = avancar(r, 2000 + volta);
      r = JSON.parse(JSON.stringify(r)) as Rotina; // fechou e reabriu
    }
    expect(r.rotacao!.posicao).toBe(0);                 // deu a volta inteira
    expect(r.rotacao!.visitas).toHaveLength(12);        // passou por todas
    expect(aindaNaoVisitados(r.rotacao!)).toEqual([]);
  });

  it('não avança sozinho: registrar execução não mexe na posição', () => {
    let r = comRotacaoDeTonalidade();
    for (let i = 0; i < 5; i++) r = registrarExecucao(r).rotina;
    expect(r.rotacao!.posicao).toBe(0);
    expect(sessoesNoValorAtual(r.rotacao!)).toBe(5);
    // é a pessoa que decide, e só então a posição anda
    expect(avancar(r).rotacao!.posicao).toBe(1);
  });

  it('dá a volta no fim e no começo', () => {
    const ultimo = CICLO_DE_QUARTAS.length - 1;
    expect(avancar(comRotacaoDeTonalidade(ultimo)).rotacao!.posicao).toBe(0);
    expect(voltar(comRotacaoDeTonalidade(0)).rotacao!.posicao).toBe(ultimo);
  });

  it('voltar é tão legítimo quanto avançar', () => {
    expect(voltar(comRotacaoDeTonalidade(3)).rotacao!.posicao).toBe(2);
  });

  it('ir para a posição em que já se está não mexe em nada', () => {
    const r = comRotacaoDeTonalidade(4);
    expect(irPara(r, 4)).toBe(r);
  });
});

describe('rotação: avanço depois de N execuções', () => {
  it('sugere avançar quando a conta fecha — mas não avança por conta própria', () => {
    let r = rotina({ rotacao: { param: 'tonalidade', valores: [0, 7], posicao: 0, avanco: { kind: 'execucoes', n: 3 }, visitas: [] } });

    let podeAvancar = false;
    for (let i = 0; i < 2; i++) ({ rotina: r, podeAvancar } = registrarExecucao(r));
    expect(podeAvancar).toBe(false);

    ({ rotina: r, podeAvancar } = registrarExecucao(r));
    expect(podeAvancar).toBe(true);
    // mesmo podendo, a posição continua onde estava: quem avança é quem chama
    expect(r.rotacao!.posicao).toBe(0);
  });

  it('com avanço manual, nunca sugere', () => {
    let r = comRotacaoDeTonalidade();
    for (let i = 0; i < 20; i++) {
      const res = registrarExecucao(r);
      r = res.rotina;
      expect(res.podeAvancar).toBe(false);
    }
  });
});

describe('rotação: o histórico de visitas', () => {
  it('responde "já passei por Sol?" e "faz quanto tempo?"', () => {
    let r = comRotacaoDeTonalidade();
    r = registrarExecucao(r, 1000).rotina;
    r = avancar(r, 2000);
    r = registrarExecucao(r, 3000).rotina;

    const passou = jaPassouPor(r.rotacao!);
    expect(passou).toHaveLength(2);
    expect(passou[0].em).toBe(2000);                       // a mais recente primeiro
    expect(passou.map(v => v.valor)).toContain(CICLO_DE_QUARTAS[0]);
    expect(aindaNaoVisitados(r.rotacao!)).toHaveLength(10);
  });

  it('voltar a um valor já visitado reabre a data, sem zerar as sessões', () => {
    let r = comRotacaoDeTonalidade();
    r = registrarExecucao(r, 1000).rotina;
    r = registrarExecucao(r, 1100).rotina;
    r = avancar(r, 2000);
    r = irPara(r, 0, 5000);

    const visita = r.rotacao!.visitas.find(v => v.valor === CICLO_DE_QUARTAS[0])!;
    expect(visita.em).toBe(5000);
    expect(visita.sessoes).toBe(2);
  });
});

// ===========================================================================
describe('ciclagem: uma etapa com um item é uma etapa comum', () => {
  it('sempre devolve a única', () => {
    const r = resolverInstancia(etapa(1));
    expect(r.indice).toBe(0);
    expect(r.etapa.ultimaUsada).toBe(0);
  });

  it('etapa sem instância é erro, não silêncio', () => {
    expect(() => resolverInstancia(etapa(0))).toThrow();
  });
});

describe('ciclagem: rodízio em ordem', () => {
  it('anda uma a cada abertura e dá a volta', () => {
    expect(resolverInstancia(etapa(3)).indice).toBe(0);
    expect(resolverInstancia(etapa(3, 'ordem', 0)).indice).toBe(1);
    expect(resolverInstancia(etapa(3, 'ordem', 1)).indice).toBe(2);
    expect(resolverInstancia(etapa(3, 'ordem', 2)).indice).toBe(0);
  });

  it('abrir três vezes seguidas entrega três instâncias diferentes, mesmo fechando o app', () => {
    let e = etapa(3);
    const vistas: number[] = [];
    for (let i = 0; i < 3; i++) {
      const r = resolverInstancia(e);
      vistas.push(r.indice);
      e = JSON.parse(JSON.stringify(r.etapa)) as Etapa; // fechou e reabriu
    }
    expect(new Set(vistas).size).toBe(3);
  });
});

describe('ciclagem: sorteio', () => {
  it('sorteado fica dentro do conjunto', () => {
    for (const x of [0, 0.34, 0.5, 0.99]) {
      expect(resolverInstancia(etapa(3, 'sorteio'), () => x).indice).toBeLessThan(3);
    }
  });

  it('sorteio sem repetir nunca devolve a última, para qualquer sorteio', () => {
    for (let anterior = 0; anterior < 4; anterior++) {
      for (const x of [0, 0.2, 0.4, 0.6, 0.8, 0.999]) {
        const r = resolverInstancia(etapa(4, 'sorteio-sem-repetir', anterior), () => x);
        expect(r.indice).not.toBe(anterior);
        expect(r.indice).toBeGreaterThanOrEqual(0);
        expect(r.indice).toBeLessThan(4);
      }
    }
  });

  it('"trocar" nunca devolve a mesma, mesmo numa etapa em ordem', () => {
    for (const x of [0, 0.5, 0.99]) {
      expect(trocarInstancia(etapa(3, 'ordem', 1), () => x).indice).not.toBe(1);
    }
  });
});

describe('embaralhar a ordem das etapas', () => {
  const etapas = ['a', 'b', 'c', 'd'].map(id => ({ ...etapa(1), id }));

  it('desligado, devolve a mesma lista', () => {
    expect(ordemDasEtapas(etapas, false)).toBe(etapas);
  });

  it('ligado, mantém todas as etapas — só muda a ordem', () => {
    const out = ordemDasEtapas(etapas, true, () => 0.5);
    expect(out.map(e => e.id).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('é independente da ciclagem: não mexe em `ultimaUsada`', () => {
    const comUso = etapas.map((e, i) => ({ ...e, ultimaUsada: i }));
    const out = ordemDasEtapas(comUso, true, () => 0.3);
    for (const e of out) expect(e.ultimaUsada).toBe(comUso.find(x => x.id === e.id)!.ultimaUsada);
  });
});
