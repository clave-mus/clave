// F3-1 · modelo e armazenamento de rotinas.
//
// Contrato da tarefa: criar, ler, alterar e apagar pelo código; e uma rotina da v1 sobrevive a uma
// subida de formato sem perder nada. O segundo é o que importa — link compartilhado é dado que sai
// do controle do app.
import { beforeEach, describe, expect, it } from 'vitest';
import {
  aoMudarCiclos, aoMudarRotinas, apagarCiclo, apagarRotina, ciclosEstaveis, copiarRotina, ehRotina,
  gravarCiclos, gravarRotinas, gravarSessao, lerCiclos, lerRotinas, lerSessao, migrarRotina, novaEtapa,
  novaRotina, novoCiclo, rotinasEstaveis, salvarCiclo, salvarRotina,
} from './storage';
import { FORMATO_ROTINA, tempoTotal, valorDaRotacao, type Rotina } from './types';

// localStorage de mentira, para o teste não depender de navegador
const mem = new Map<string, string>();
beforeEach(() => {
  mem.clear();
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

const comEtapas = (nome = 'Mapear o braço'): Rotina => {
  const r = novaRotina(nome);
  r.etapas = [novaEtapa('nota-no-instrumento', { direcao: 'achar', casas: '0-5' }), novaEtapa('ouvido-intervalo')];
  r.etapas[0].segundosSugeridos = 300;
  r.etapas[1].segundosSugeridos = 600;
  return r;
};

describe('criar, ler, alterar, apagar', () => {
  it('a rotina ida e volta pelo disco sai idêntica', () => {
    const r = comEtapas();
    salvarRotina(r);
    expect(lerRotinas()).toEqual([r]);
  });

  it('salvar de novo substitui em vez de duplicar', () => {
    const r = comEtapas();
    salvarRotina(r);
    salvarRotina({ ...r, nome: 'Outro nome' });
    const todas = lerRotinas();
    expect(todas).toHaveLength(1);
    expect(todas[0].nome).toBe('Outro nome');
  });

  it('apagar tira só a pedida', () => {
    const a = comEtapas('A'), b = comEtapas('B');
    salvarRotina(a); salvarRotina(b);
    expect(apagarRotina(a.id).map(r => r.nome)).toEqual(['B']);
  });

  it('sem nada no disco, devolve lista vazia em vez de quebrar', () => {
    expect(lerRotinas()).toEqual([]);
  });

  it('lixo no disco não derruba a tela', () => {
    mem.set('clave:rotinas', '{isto não é json');
    expect(lerRotinas()).toEqual([]);
    mem.set('clave:rotinas', JSON.stringify(['nada a ver', 42, null]));
    expect(lerRotinas()).toEqual([]);
  });

  it('uma rotina ruim no meio não leva as boas junto', () => {
    const boa = comEtapas();
    gravarRotinas([boa, { formato: 1, id: 'x' } as unknown as Rotina]);
    expect(lerRotinas()).toEqual([boa]);
  });
});

describe('migração de formato', () => {
  it('a rotina do formato atual passa sem mudar', () => {
    const r = comEtapas();
    expect(migrarRotina(JSON.parse(JSON.stringify(r)))).toEqual(r);
  });

  it('recusa formato mais novo que o do app, em vez de adivinhar', () => {
    const futura = { ...comEtapas(), formato: FORMATO_ROTINA + 1 };
    expect(migrarRotina(futura)).toBeNull();
  });

  it('recusa o que não é rotina', () => {
    for (const lixo of [null, 42, 'rotina', [], {}, { id: 'a' }, { ...comEtapas(), etapas: 'nada' }]) {
      expect(migrarRotina(lixo)).toBeNull();
    }
  });

  it('recusa etapa sem instância — etapa vazia não é etapa', () => {
    const r = comEtapas();
    r.etapas[0].instancias = [];
    expect(ehRotina(r)).toBe(false);
  });

  it('a corrente de migração existe desde a v1, e um buraco nela é recusa, não perda silenciosa', () => {
    // formato 0 não tem passo registrado: a rotina é recusada em vez de entrar meio migrada
    expect(migrarRotina({ ...comEtapas(), formato: 0 })).toBeNull();
  });
});

describe('adotar uma rotina cria uma cópia', () => {
  it('a cópia tem id novo, crédito à origem, e perde a marca do time', () => {
    const doTime = { ...comEtapas('Mapear o braço do baixo'), doTime: true };
    const minha = copiarRotina(doTime, 'Clave');

    expect(minha.id).not.toBe(doTime.id);
    expect(minha.doTime).toBeUndefined();
    expect(minha.origem).toEqual({ rotinaId: doTime.id, autor: 'Clave' });
    expect(minha.nome).toBe(doTime.nome);
    expect(minha.etapas).toHaveLength(doTime.etapas.length);
  });

  it('as etapas da cópia são independentes — mexer numa não mexe na outra', () => {
    const original = comEtapas();
    const copia = copiarRotina(original);
    copia.etapas[0].instancias[0].settings.casas = '0-12';
    expect(original.etapas[0].instancias[0].settings.casas).toBe('0-5');
    expect(copia.etapas[0].id).not.toBe(original.etapas[0].id);
  });

  it('a cópia começa a rotação do zero, sem o histórico de quem publicou', () => {
    const original = comEtapas();
    original.rotacao = {
      param: 'tonalidade', valores: [0, 7, 2], posicao: 2, avanco: { kind: 'manual' },
      visitas: [{ valor: 0, em: 1, sessoes: 4 }],
    };
    const copia = copiarRotina(original);
    expect(copia.rotacao?.posicao).toBe(0);
    expect(copia.rotacao?.visitas).toEqual([]);
    expect(copia.rotacao?.valores).toEqual([0, 7, 2]);
  });
});

describe('ciclagem e tempo', () => {
  it('a última instância usada sobrevive ao disco — senão a ciclagem não existe', () => {
    const r = comEtapas();
    r.etapas[0].instancias.push({ itemId: 'nota-no-instrumento', settings: {} });
    r.etapas[0].ultimaUsada = 1;
    salvarRotina(r);
    expect(lerRotinas()[0].etapas[0].ultimaUsada).toBe(1);
  });

  it('o tempo sugerido é da etapa, não da instância', () => {
    const r = comEtapas();
    r.etapas[0].instancias.push({ itemId: 'nota-no-instrumento', settings: {} });
    // trocar de instância não pode mudar a duração da rotina
    expect(tempoTotal(r)).toBe(900);
  });

  it('só a rotina guiada soma tempo — na livre, somar seria mentira', () => {
    const r = comEtapas();
    expect(tempoTotal(r)).toBe(900);
    expect(tempoTotal({ ...r, modo: 'livre' })).toBeNull();
  });
});

describe('rotação de parâmetro', () => {
  it('o valor atual é o da posição', () => {
    const r = comEtapas();
    r.rotacao = { param: 'tonalidade', valores: [0, 7, 2, 9], posicao: 1, avanco: { kind: 'manual' }, visitas: [] };
    expect(valorDaRotacao(r)).toBe(7);
  });

  it('sem rotação, não há valor', () => {
    expect(valorDaRotacao(comEtapas())).toBeUndefined();
  });

  it('a rotação sobrevive ao disco com posição e visitas', () => {
    const r = comEtapas();
    r.rotacao = {
      param: 'tonalidade', valores: [0, 7], posicao: 1, avanco: { kind: 'execucoes', n: 3 },
      visitas: [{ valor: 0, em: 1700000000000, sessoes: 3 }],
    };
    salvarRotina(r);
    expect(lerRotinas()[0].rotacao).toEqual(r.rotacao);
  });
});

describe('sessão em andamento', () => {
  it('guarda e devolve, para "continuar de onde parou"', () => {
    const s = {
      rotinaId: 'r1', comecouEm: 1, etapaAtual: 'e2', tempoPorEtapa: { e1: 300 },
      pausada: true, resolvidas: { e1: 0, e2: 1 }, sessaoId: 's1',
    };
    gravarSessao(s);
    expect(lerSessao()).toEqual(s);
  });

  it('encerrar limpa', () => {
    gravarSessao({ rotinaId: 'r', comecouEm: 1, etapaAtual: 'e', tempoPorEtapa: {}, pausada: false, resolvidas: {}, sessaoId: 's' });
    gravarSessao(null);
    expect(lerSessao()).toBeNull();
  });
});

describe('o histórico guarda os parâmetros (F3-9)', () => {
  it('uma atividade sem validação nenhuma deixa rastro do conteúdo', async () => {
    const { logActivity, getState, resetAll } = await import('../state/store');
    resetAll();
    logActivity({
      id: 'ambiente', title: 'Solfejar e tocar', module: 'perception.melodic', seconds: 300,
      snapshot: { settings: { tonica: 7 }, params: { instrument: 'baixo', tuning: [28, 33, 38, 43], key: { tonic: 7, mode: 'maior' }, range: { lo: 40, hi: 64 }, material: 'diatonico' } },
    });
    const a = getState().history[0];
    // nenhuma tentativa foi gravada — é só isto que responde "em que tonalidade eu pratiquei?"
    expect(a.correct).toBeUndefined();
    expect(a.snapshot?.params?.key).toEqual({ tonic: 7, mode: 'maior' });
    expect(a.snapshot?.settings?.tonica).toBe(7);
  });

  it('atividade antiga, sem snapshot, continua válida', async () => {
    const { logActivity, getState, resetAll } = await import('../state/store');
    resetAll();
    logActivity({ id: 'metronomo', title: 'Metrônomo', module: 'technique', seconds: 120 });
    expect(getState().history[0].snapshot).toBeUndefined();
  });
});

describe('assinatura: a tela acompanha o disco', () => {
  it('avisa quem escuta quando se grava, salva ou apaga', () => {
    let avisos = 0;
    const parar = aoMudarRotinas(() => { avisos++; });
    const r = comEtapas();
    salvarRotina(r);
    expect(avisos).toBe(1);
    apagarRotina(r.id);
    expect(avisos).toBe(2);
    gravarRotinas([]);
    expect(avisos).toBe(3);
    parar();
  });

  it('quem cancelou a assinatura não é mais avisado', () => {
    let avisos = 0;
    const parar = aoMudarRotinas(() => { avisos++; });
    parar();
    salvarRotina(comEtapas());
    expect(avisos).toBe(0);
  });

  // `lerRotinas` devolve um array novo a cada chamada; usado direto como snapshot, o React compararia
  // por referência, veria "mudou" a cada render e entraria em loop.
  it('rotinasEstaveis devolve a MESMA referência enquanto o disco não muda', () => {
    salvarRotina(comEtapas());
    expect(rotinasEstaveis()).toBe(rotinasEstaveis());
    expect(lerRotinas()).not.toBe(lerRotinas());
  });

  it('e uma referência nova quando o disco muda', () => {
    salvarRotina(comEtapas('A'));
    const antes = rotinasEstaveis();
    salvarRotina(comEtapas('B'));
    const depois = rotinasEstaveis();
    expect(depois).not.toBe(antes);
    expect(depois.map(r => r.nome)).toEqual(['A', 'B']);
  });

  it('sem nada gravado, devolve lista vazia e estável', () => {
    expect(rotinasEstaveis()).toEqual([]);
    expect(rotinasEstaveis()).toBe(rotinasEstaveis());
  });
});

describe('Etapa.params saiu do modelo (decisão 97)', () => {
  // A tonalidade de uma etapa mora na INSTÂNCIA. O campo da etapa nunca foi lido por ninguém: era
  // validado e copiado, e nada o consumia. Rotina antiga com ele continua válida, mas o campo é
  // descartado na leitura — senão `copiarRotina` propagaria um campo morto para sempre.
  const antiga = {
    formato: FORMATO_ROTINA, id: 'r1', nome: 'Antiga', modo: 'guiado', embaralhar: false, params: {},
    etapas: [{
      id: 'e1', politica: 'ordem', segundosSugeridos: 300,
      params: { key: { tonic: 5, mode: 'maior' } },
      instancias: [{ itemId: 'nota-no-instrumento', settings: {} }],
    }],
  };

  it('a rotina antiga continua válida', () => {
    expect(migrarRotina(antiga)).not.toBeNull();
  });

  it('e o campo é descartado na leitura', () => {
    const r = migrarRotina(antiga)!;
    expect(r.etapas[0]).not.toHaveProperty('params');
  });

  it('o que a etapa de fato guarda sobrevive', () => {
    const r = migrarRotina(antiga)!;
    expect(r.etapas[0].segundosSugeridos).toBe(300);
    expect(r.etapas[0].instancias[0].itemId).toBe('nota-no-instrumento');
  });

  it('a instância mantém os seus params — é lá que a tonalidade mora agora', () => {
    const comInstancia = {
      ...antiga,
      etapas: [{ ...antiga.etapas[0], instancias: [{ itemId: 'nota-no-instrumento', settings: {}, params: { key: { tonic: 7, mode: 'maior' } } }] }],
    };
    expect(migrarRotina(comInstancia)!.etapas[0].instancias[0].params).toEqual({ key: { tonic: 7, mode: 'maior' } });
  });

  it('a cópia para adotar não propaga o campo morto', () => {
    const r = migrarRotina(antiga)!;
    expect(copiarRotina(r).etapas[0]).not.toHaveProperty('params');
  });
});

describe('as fusões por superfície na leitura (decisão 16)', () => {
  // Sem isto, a etapa de quem já usava o app apareceria no executor como "exercício que não existe
  // mais". E a superfície é a metade que não pode faltar: migrar `braco-ache` sem ela jogaria a
  // pessoa na pauta.
  const comAntigos = (itemId: string, settings: Record<string, unknown> = {}) => ({
    formato: FORMATO_ROTINA, id: 'r9', nome: 'Antiga', modo: 'guiado' as const, embaralhar: false, params: {},
    etapas: [{ id: 'e9', politica: 'ordem' as const, instancias: [{ itemId, settings }] }],
  });
  const lida = (itemId: string, settings?: Record<string, unknown>) =>
    migrarRotina(comAntigos(itemId, settings))!.etapas[0].instancias[0];

  // A superfície virou o ITEM em 10/11/2026, então o id antigo vira o item novo e a superfície que
  // ele era vira a DIREÇÃO: quem identificava vai para ler/identificar, quem produzia vai para
  // escrever/achar. A tabela está em `state/migrate.ts`, e ela foi reescrita porque apontava para
  // itens que deixaram de existir — rotina salva migraria para item inexistente.
  it('o id antigo vira o item novo, com a direção que a superfície era', () => {
    expect(lida('braco-ache', { casas: '0-5' })).toEqual({ itemId: 'nota-no-instrumento', settings: { casas: '0-5', direcao: 'achar' } });
    expect(lida('pauta-nota', { claves: ['fa'] })).toEqual({ itemId: 'nota-na-pauta', settings: { claves: ['fa'], direcao: 'ler' } });
    expect(lida('teclado-tecla', { pretas: false })).toEqual({ itemId: 'nota-no-instrumento', settings: { pretas: false, direcao: 'achar', instrumento: 'piano' } });
  });

  it('`acorde-visual` guardava a superfície na configuração `onde`, e ela sai', () => {
    expect(lida('acorde-visual', { onde: 'piano' })).toEqual({ itemId: 'acorde-no-instrumento', settings: { direcao: 'identificar', instrumento: 'piano' } });
    expect(lida('acorde-visual', { onde: 'violao', formas: 'todos' })).toEqual({ itemId: 'acorde-no-instrumento', settings: { formas: 'todos', direcao: 'identificar' } });
  });

  it('a rotina antiga continua válida, e a etapa não some', () => {
    const r = migrarRotina(comAntigos('braco-intervalo'))!;
    expect(r).not.toBeNull();
    expect(r.etapas).toHaveLength(1);
  });

  it('instância de item não fundido passa intacta', () => {
    expect(lida('ouvido-escala', { direcao: 'sobe' })).toEqual({ itemId: 'ouvido-escala', settings: { direcao: 'sobe' } });
  });
});

describe('ciclos de rotinas (P9)', () => {
  it('o ciclo ida e volta pelo disco sai idêntico', () => {
    const c = { ...novoCiclo('Ônibus'), rotinaIds: ['r1', 'r2'] };
    salvarCiclo(c);
    expect(lerCiclos()).toEqual([c]);
  });

  it('salvar de novo substitui em vez de duplicar', () => {
    const c = novoCiclo('Ônibus');
    salvarCiclo(c);
    salvarCiclo({ ...c, rotinaIds: ['r1'] });
    const todos = lerCiclos();
    expect(todos).toHaveLength(1);
    expect(todos[0].rotinaIds).toEqual(['r1']);
  });

  it('apagar tira só o pedido', () => {
    const a = novoCiclo('A'), b = novoCiclo('B');
    salvarCiclo(a); salvarCiclo(b);
    expect(apagarCiclo(a.id).map(c => c.nome)).toEqual(['B']);
  });

  it('sem nada no disco, devolve lista vazia em vez de quebrar', () => {
    expect(lerCiclos()).toEqual([]);
  });

  it('lixo no disco não derruba a tela', () => {
    mem.set('clave:ciclos', '{isto não é json');
    expect(lerCiclos()).toEqual([]);
    mem.set('clave:ciclos', JSON.stringify(['nada a ver', 42, null, { id: 'x' }]));
    expect(lerCiclos()).toEqual([]);
  });

  it('avisa quem escuta quando se grava, salva ou apaga', () => {
    let avisos = 0;
    const parar = aoMudarCiclos(() => { avisos++; });
    const c = novoCiclo('A');
    salvarCiclo(c);
    expect(avisos).toBe(1);
    apagarCiclo(c.id);
    expect(avisos).toBe(2);
    gravarCiclos([]);
    expect(avisos).toBe(3);
    parar();
  });

  it('ciclosEstaveis devolve a MESMA referência enquanto o disco não muda, e nova quando muda', () => {
    salvarCiclo(novoCiclo('A'));
    expect(ciclosEstaveis()).toBe(ciclosEstaveis());
    salvarCiclo(novoCiclo('B'));
    const depois = ciclosEstaveis();
    expect(depois.map(c => c.nome)).toEqual(['A', 'B']);
  });
});
