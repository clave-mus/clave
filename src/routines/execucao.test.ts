import { describe, expect, it } from 'vitest';
import {
  avancar, comecar, etapaAtual, instanciaDaVez, passouDoSugerido, pausar, posicao, praticou, problemasDa,
  resumo, retomar, retomavel, saltarPara, sanear, segundosNaEtapa, segundosTotais, terminou, tiquetaque,
  trocar, voltar, type Execucao,
} from './execucao';
import { FORMATO_ROTINA, type Etapa, type Rotina } from './types';

const etapa = (id: string, itens: string[], extra: Partial<Etapa> = {}): Etapa => ({
  id, instancias: itens.map(itemId => ({ itemId, settings: {} })), politica: 'ordem', ...extra,
});
const rotina = (etapas: Etapa[], extra: Partial<Rotina> = {}): Rotina => ({
  formato: FORMATO_ROTINA, id: 'r1', nome: 'R', modo: 'guiado', embaralhar: false, params: {}, etapas, ...extra,
});

const tres = () => rotina([
  etapa('a', ['x'], { segundosSugeridos: 60 }),
  etapa('b', ['y'], { segundosSugeridos: 120 }),
  etapa('c', ['z'], { segundosSugeridos: 60 }),
]);

describe('começar', () => {
  it('a ordem é resolvida uma vez e guardada — recalcular mudaria a lista debaixo da pessoa', () => {
    const { sessao } = comecar(tres());
    expect(sessao.ordem).toEqual(['a', 'b', 'c']);
    expect(sessao.etapaAtual).toBe('a');
  });

  it('embaralhar vale para a execução e NÃO reordena a rotina guardada', () => {
    const r = tres();
    const { sessao, rotina: depois } = comecar({ ...r, embaralhar: true }, 0, () => 0.99);
    expect([...sessao.ordem].sort()).toEqual(['a', 'b', 'c']);
    expect(depois.etapas.map(e => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('resolve o rodízio de cada etapa e devolve a rotina com `ultimaUsada` gravado', () => {
    const r = rotina([etapa('a', ['x1', 'x2', 'x3'])]);
    const { sessao, rotina: depois } = comecar(r);
    expect(sessao.resolvidas.a).toBe(0);
    expect(depois.etapas[0].ultimaUsada).toBe(0);
    // segunda execução, partindo da rotina já gravada: cai na instância seguinte
    expect(comecar(depois).sessao.resolvidas.a).toBe(1);
  });

  it('a instância da vez é a que a execução resolveu, não a primeira', () => {
    const r = rotina([etapa('a', ['x1', 'x2', 'x3'], { ultimaUsada: 1 })]);
    const { sessao, rotina: depois } = comecar(r);
    expect(instanciaDaVez(sessao, depois.etapas[0]).itemId).toBe('x3');
  });

  it('rotina vazia não explode: começa sem etapa atual', () => {
    expect(comecar(rotina([])).sessao.etapaAtual).toBe('');
  });
});

describe('navegar — tudo manual (decisão 4)', () => {
  it('avançar anda uma, e na última TERMINA', () => {
    let s = comecar(tres()).sessao;
    s = avancar(s, 'concluida'); expect(s.etapaAtual).toBe('b');
    s = avancar(s, 'concluida'); expect(s.etapaAtual).toBe('c');
    s = avancar(s, 'concluida');
    expect(terminou(s)).toBe(true);
  });

  it('avançar sem desfecho é um PULO, e pulo é resultado legítimo', () => {
    const s = avancar(comecar(tres()).sessao);
    expect(s.desfechos.a).toBe('pulada');
  });

  it('voltar não apaga o tempo nem o desfecho — refazer soma, não zera', () => {
    let s = comecar(tres()).sessao;
    s = tiquetaque(s, 30);
    s = avancar(s, 'concluida');
    s = voltar(s);
    expect(s.etapaAtual).toBe('a');
    expect(segundosNaEtapa(s, 'a')).toBe(30);
    expect(s.desfechos.a).toBe('concluida');
    s = tiquetaque(s, 10);
    expect(segundosNaEtapa(s, 'a')).toBe(40);
  });

  it('voltar na primeira não faz nada, e saltar para etapa que não está na ordem não faz nada', () => {
    const s = comecar(tres()).sessao;
    expect(voltar(s).etapaAtual).toBe('a');
    expect(saltarPara(s, 'inexistente').etapaAtual).toBe('a');
  });

  it('saltar vai para qualquer etapa da ordem, em qualquer direção', () => {
    const s = saltarPara(comecar(tres()).sessao, 'c');
    expect(posicao(s)).toBe(2);
    expect(saltarPara(s, 'a').etapaAtual).toBe('a');
  });

  it('etapaAtual devolve a etapa da rotina, não só o id', () => {
    const r = tres();
    expect(etapaAtual(comecar(r).sessao, r)?.id).toBe('a');
  });
});

describe('o tempo é crescente e não manda em nada', () => {
  it('soma na etapa atual, e o total soma as etapas', () => {
    let s = comecar(tres()).sessao;
    s = tiquetaque(s, 10);
    s = avancar(s, 'concluida');
    s = tiquetaque(s, 25);
    expect(segundosNaEtapa(s, 'a')).toBe(10);
    expect(segundosNaEtapa(s, 'b')).toBe(25);
    expect(segundosTotais(s)).toBe(35);
  });

  it('pausada não soma — é o que a pausa quer dizer', () => {
    let s = pausar(comecar(tres()).sessao);
    s = tiquetaque(s, 60);
    expect(segundosTotais(s)).toBe(0);
    s = tiquetaque(retomar(s), 5);
    expect(segundosTotais(s)).toBe(5);
  });

  it('terminada, não soma mais', () => {
    let s = comecar(rotina([etapa('a', ['x'])])).sessao;
    s = avancar(s, 'concluida');
    expect(segundosTotais(tiquetaque(s, 99))).toBe(0);
  });

  // O ponto da F3-2: passar do sugerido AVISA e não faz mais nada.
  it('passar do sugerido é informação: não avança, não bloqueia, não esconde', () => {
    const r = tres();
    let s = comecar(r).sessao;
    s = tiquetaque(s, 59);
    expect(passouDoSugerido(s, r.etapas[0])).toBe(false);
    s = tiquetaque(s, 1);
    expect(passouDoSugerido(s, r.etapas[0])).toBe(true);
    expect(s.etapaAtual).toBe('a');
    expect(terminou(s)).toBe(false);
  });

  it('etapa sem tempo sugerido nunca passa do sugerido — é o caso do modo livre', () => {
    const r = rotina([etapa('a', ['x'])], { modo: 'livre' });
    const s = tiquetaque(comecar(r).sessao, 9999);
    expect(passouDoSugerido(s, r.etapas[0])).toBe(false);
  });
});

describe('trocar a instância da vez (F3-4)', () => {
  it('troca, e grava na rotina para o rodízio avançar na próxima', () => {
    const r = rotina([etapa('a', ['x1', 'x2', 'x3'])]);
    const inicio = comecar(r);
    expect(inicio.sessao.resolvidas.a).toBe(0);
    const depois = trocar(inicio.sessao, inicio.rotina);
    expect(depois.sessao.resolvidas.a).toBe(1);
    expect(depois.rotina.etapas[0].ultimaUsada).toBe(1);
  });

  it('etapa com uma instância só: trocar não faz nada, e não há interface diferente para isso', () => {
    const r = rotina([etapa('a', ['x'])]);
    const inicio = comecar(r);
    expect(trocar(inicio.sessao, inicio.rotina).sessao).toBe(inicio.sessao);
  });
});

describe('fechar e retomar', () => {
  it('retoma quando a rotina existe e a execução não terminou', () => {
    const r = tres();
    const s = comecar(r).sessao;
    expect(retomavel(s, [r])?.id).toBe('r1');
  });

  it('não retoma sessão terminada, nem de rotina apagada, nem sem sessão', () => {
    const r = tres();
    let s = comecar(r).sessao;
    s = avancar(avancar(avancar(s, 'concluida'), 'concluida'), 'concluida');
    expect(retomavel(s, [r])).toBeNull();
    expect(retomavel(comecar(r).sessao, [])).toBeNull();
    expect(retomavel(null, [r])).toBeNull();
  });

  it('não retoma se TODAS as etapas da ordem sumiram do editor', () => {
    const r = tres();
    const s = comecar(r).sessao;
    expect(retomavel(s, [{ ...r, etapas: [] }])).toBeNull();
  });

  // Editar a rotina no meio da execução é normal; ficar preso numa etapa fantasma não é.
  it('sanear tira as etapas que sumiram e reposiciona se a atual era uma delas', () => {
    const r = tres();
    let s = saltarPara(comecar(r).sessao, 'b');
    s = sanear(s, rotina([r.etapas[0], r.etapas[2]]));
    expect(s.ordem).toEqual(['a', 'c']);
    expect(s.etapaAtual).toBe('a');
  });

  it('sanear não mexe em nada quando a rotina está intacta', () => {
    const r = tres();
    const s = comecar(r).sessao;
    expect(sanear(s, r)).toBe(s);
  });
});

describe('item que sumiu do catálogo', () => {
  const existe = (id: string) => !id.includes('fantasma');

  it('aponta a etapa e o item, e nunca falha em silêncio', () => {
    const r = rotina([etapa('a', ['x']), etapa('b', ['fantasma'])]);
    expect(problemasDa(r, existe)).toEqual([{ etapaId: 'b', itemId: 'fantasma', substitutos: [] }]);
  });

  it('oferece companheiro de grupo quando há — e só os que existem', () => {
    const r = rotina([etapa('b', ['fantasma'])]);
    const p = problemasDa(r, existe, () => ['x', 'outro-fantasma']);
    expect(p[0].substitutos).toEqual(['x']);
  });

  it('rotina sã não produz problema nenhum', () => {
    expect(problemasDa(tres(), existe)).toEqual([]);
  });
});

describe('o resumo final: sem nota, sem percentual, sem celebração', () => {
  it('conta tempo, visitadas, concluídas, puladas e as que ficaram para trás', () => {
    let s = comecar(tres()).sessao;
    s = tiquetaque(s, 40);
    s = avancar(s, 'concluida');
    s = tiquetaque(s, 10);
    s = avancar(s); // pulou a b
    const r = resumo(s);
    expect(r).toEqual({ segundos: 50, visitadas: 2, concluidas: 1, puladas: 1, naoVisitadas: 1 });
  });

  it('não devolve nenhum campo de pontuação', () => {
    const chaves = Object.keys(resumo(comecar(tres()).sessao));
    for (const proibida of ['acertos', 'percentual', 'nota', 'score', 'streak']) expect(chaves).not.toContain(proibida);
  });

  it('desfecho de etapa que saiu da rotina não é contado', () => {
    let s = comecar(tres()).sessao;
    s = avancar(s, 'concluida');
    s = sanear(s, rotina([s.ordem[1], s.ordem[2]].map(id => tres().etapas.find(e => e.id === id)!)));
    expect(resumo(s).concluidas).toBe(0);
  });

  // "Pratiquei hoje" é qualquer etapa efetivamente usada (F3-3). Sem meta de completude.
  it('praticou é verdade com um segundo real, e falso numa execução só aberta', () => {
    const s = comecar(tres()).sessao;
    expect(praticou(s)).toBe(false);
    expect(praticou(tiquetaque(s, 1))).toBe(true);
    expect(praticou(avancar(s, 'concluida'))).toBe(true);
  });
});

describe('a sessão guardada é serializável — ela vai e volta do localStorage', () => {
  it('sobrevive a JSON de ida e volta sem perder nada', () => {
    let s = comecar(tres()).sessao;
    s = tiquetaque(s, 7);
    s = avancar(s, 'concluida');
    const volta = JSON.parse(JSON.stringify(s)) as Execucao;
    expect(volta).toEqual(s);
    expect(resumo(volta)).toEqual(resumo(s));
  });
});
