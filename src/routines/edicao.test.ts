// Contrato do "Salvar numa rotina": criar uma rotina, anexar uma etapa, tirar uma etapa.
import { describe, expect, it } from 'vitest';
import {
  acrescentarInstancia, alterarEtapa, alterarInstancia, alterarRotina, anexarInstancia, aplicarATodas,
  duplicarRotina, gerarVariantes, lerAbertura, moverEtapa, removerEtapa, removerInstancia,
} from './edicao';
import { novaRotina, ehRotina } from './storage';
import type { Rotina } from './types';

const rotinaCom = (nome: string, itemId: string): Rotina => {
  const r = anexarInstancia([], { nome }, itemId, { a: 1 });
  if (!r.ok) throw new Error('fixture quebrada');
  return r.rotina;
};

describe('anexarInstancia · criando uma rotina', () => {
  it('cria a rotina com o nome e uma etapa só', () => {
    const r = anexarInstancia([], { nome: 'Manhã' }, 'pauta-nota', { extensao: 'pauta' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rotina.nome).toBe('Manhã');
    expect(r.rotina.etapas).toHaveLength(1);
    expect(r.rotina.etapas[0].instancias).toEqual([{ itemId: 'pauta-nota', settings: { extensao: 'pauta' } }]);
    expect(r.rotinas).toEqual([r.rotina]);
  });

  it('a rotina criada é uma rotina válida — passa pelo mesmo guarda do disco', () => {
    const r = anexarInstancia([], { nome: 'X' }, 'ouvido-escala', { tipos: ['maior', 'menor'] });
    expect(r.ok && ehRotina(r.rotina)).toBe(true);
  });

  it('apara espaços do nome, e recusa o nome que sobra vazio', () => {
    const ok = anexarInstancia([], { nome: '  Ônibus  ' }, 'x', {});
    expect(ok.ok && ok.rotina.nome).toBe('Ônibus');
    for (const nome of ['', '   ', '\t\n']) {
      expect(anexarInstancia([], { nome }, 'x', {})).toEqual({ ok: false, motivo: 'nome-vazio' });
    }
  });

  it('duas rotinas com o mesmo nome são rotinas diferentes — o id é que as distingue', () => {
    const a = rotinaCom('Igual', 'x');
    const r = anexarInstancia([a], { nome: 'Igual' }, 'y', {});
    expect(r.ok && r.rotinas).toHaveLength(2);
    expect(r.ok && r.rotinas[0].id).not.toBe(r.ok && r.rotinas[1].id);
  });
});

describe('anexarInstancia · numa rotina que já existe', () => {
  it('põe a etapa no FIM, sem mexer nas que já estavam', () => {
    const base = rotinaCom('R', 'primeiro');
    const r = anexarInstancia([base], { rotinaId: base.id }, 'segundo', { b: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rotina.etapas.map(e => e.instancias[0].itemId)).toEqual(['primeiro', 'segundo']);
    expect(r.rotina.etapas[0]).toBe(base.etapas[0]);
  });

  it('o mesmo item duas vezes, com configurações diferentes, é permitido — é o ponto de salvar a configuração', () => {
    const base = rotinaCom('R', 'ouvido-escala');
    const r = anexarInstancia([base], { rotinaId: base.id }, 'ouvido-escala', { direcao: 'desce' });
    expect(r.ok && r.rotina.etapas).toHaveLength(2);
  });

  it('uma rotina que não existe é recusada, sem criar nada', () => {
    expect(anexarInstancia([rotinaCom('R', 'x')], { rotinaId: 'fantasma' }, 'y', {})).toEqual({ ok: false, motivo: 'rotina-inexistente' });
  });

  it('só a rotina escolhida muda', () => {
    const a = rotinaCom('A', 'x'), b = rotinaCom('B', 'y');
    const r = anexarInstancia([a, b], { rotinaId: b.id }, 'z', {});
    expect(r.ok && r.rotinas[0]).toBe(a);
    expect(r.ok && r.rotinas[1].etapas).toHaveLength(2);
  });

  it('cada etapa nova ganha um id próprio', () => {
    const base = rotinaCom('R', 'x');
    const r = anexarInstancia([base], { rotinaId: base.id }, 'x', {});
    const ids = r.ok ? r.rotina.etapas.map(e => e.id) : [];
    expect(new Set(ids).size).toBe(2);
  });
});

describe('anexarInstancia · não aliasa nem muta', () => {
  it('não muta a lista que recebeu', () => {
    const base = rotinaCom('R', 'x');
    const antes = JSON.stringify([base]);
    anexarInstancia([base], { rotinaId: base.id }, 'y', {});
    anexarInstancia([base], { nome: 'Outra' }, 'y', {});
    expect(JSON.stringify([base])).toBe(antes);
  });

  // O defeito que a decisão 9 proíbe, em escala menor: a configuração salva dividindo o MESMO array
  // com o estado da tela. Mexer em um mexeria no outro.
  it('copia as configurações de lista por inteiro, e não só o objeto de cima', () => {
    const tipos = ['maior', 'menor'];
    const r = anexarInstancia([], { nome: 'R' }, 'ouvido-escala', { tipos });
    if (!r.ok) throw new Error('falhou');
    tipos.push('dorico');
    expect(r.rotina.etapas[0].instancias[0].settings.tipos).toEqual(['maior', 'menor']);
  });

  it('a rotina criada não é a mesma referência de uma rotina nova qualquer', () => {
    const r = anexarInstancia([], { nome: 'R' }, 'x', {});
    expect(r.ok && r.rotina).not.toBe(novaRotina('R'));
  });
});

describe('removerEtapa', () => {
  it('tira só a etapa pedida', () => {
    const r1 = rotinaCom('R', 'a');
    const r2 = anexarInstancia([r1], { rotinaId: r1.id }, 'b', {});
    if (!r2.ok) throw new Error('falhou');
    const [primeira, segunda] = r2.rotina.etapas;
    const sai = removerEtapa(r2.rotinas, r1.id, primeira.id);
    expect(sai[0].etapas).toEqual([segunda]);
  });

  it('não apaga a rotina quando a última etapa sai — apagar é um gesto à parte', () => {
    const r = rotinaCom('R', 'a');
    const sai = removerEtapa([r], r.id, r.etapas[0].id);
    expect(sai).toHaveLength(1);
    expect(sai[0].etapas).toEqual([]);
  });

  it('etapa ou rotina que não existem não mudam nada', () => {
    const r = rotinaCom('R', 'a');
    expect(removerEtapa([r], r.id, 'fantasma')[0].etapas).toHaveLength(1);
    expect(removerEtapa([r], 'fantasma', r.etapas[0].id)[0].etapas).toHaveLength(1);
  });

  it('não muta a lista que recebeu', () => {
    const r = rotinaCom('R', 'a');
    const antes = JSON.stringify([r]);
    removerEtapa([r], r.id, r.etapas[0].id);
    expect(JSON.stringify([r])).toBe(antes);
  });
});

describe('anexarInstancia · tonalidade, região e material (decisão 87)', () => {
  // O buraco que a decisão 87 fecha: "Salvar em Fá maior" não gravava Fá maior, porque a tonalidade
  // morava no perfil, fora da instância.
  it('grava o que a pessoa escolheu NA instância', () => {
    const r = anexarInstancia([], { nome: 'R' }, 'ouvido-escala', {}, { key: { tonic: 5, mode: 'maior' }, material: 'diatonico' });
    expect(r.ok && r.rotina.etapas[0].instancias[0].params).toEqual({ key: { tonic: 5, mode: 'maior' }, material: 'diatonico' });
  });

  it('sem escolha nenhuma, não grava params — a etapa fica livre, e não "o que o item guarda hoje"', () => {
    const r = anexarInstancia([], { nome: 'R' }, 'ouvido-escala', {}, {});
    expect(r.ok && 'params' in r.rotina.etapas[0].instancias[0]).toBe(false);
  });

  it('a etapa não divide o objeto com o estado da tela', () => {
    const key = { tonic: 7, mode: 'menor' as const };
    const r = anexarInstancia([], { nome: 'R' }, 'x', {}, { key });
    if (!r.ok) throw new Error('falhou');
    key.tonic = 0;
    expect(r.rotina.etapas[0].instancias[0].params?.key?.tonic).toBe(7);
  });

  it('duas etapas do mesmo item em tonalidades diferentes são etapas diferentes', () => {
    const a = anexarInstancia([], { nome: 'R' }, 'ouvido-escala', {}, { key: { tonic: 0, mode: 'maior' } });
    if (!a.ok) throw new Error('falhou');
    const b = anexarInstancia(a.rotinas, { rotinaId: a.rotina.id }, 'ouvido-escala', {}, { key: { tonic: 7, mode: 'maior' } });
    expect(b.ok && b.rotina.etapas.map(e => e.instancias[0].params?.key?.tonic)).toEqual([0, 7]);
  });

  it('a rotina com params continua sendo uma rotina válida', () => {
    const r = anexarInstancia([], { nome: 'R' }, 'x', {}, { range: { lo: 36, hi: 60 } });
    expect(r.ok && ehRotina(r.rotina)).toBe(true);
  });
});

describe('lerAbertura', () => {
  it('devolve a configuração e os params da etapa', () => {
    expect(lerAbertura({ instancia: { direcao: 'desce' }, params: { key: { tonic: 5, mode: 'maior' } } }))
      .toEqual({ settings: { direcao: 'desce' }, params: { key: { tonic: 5, mode: 'maior' } } });
  });

  // "Sem tonalidade" numa etapa quer dizer LIVRE — não "use a que o item guarda hoje". Por isso
  // `params` vem sempre preenchido, mesmo vazio: é o que faz o Player abrir em modo da etapa.
  it('sem params na etapa, devolve params vazio e não null', () => {
    expect(lerAbertura({ instancia: { a: 1 } })).toEqual({ settings: { a: 1 }, params: {} });
  });

  it('devolve null para qualquer coisa que não seja uma etapa aberta', () => {
    for (const lixo of [null, undefined, 42, 'x', [], {}, { instancia: null }, { instancia: 'x' }, { instancia: [1] }]) {
      expect(lerAbertura(lixo), JSON.stringify(lixo)).toBeNull();
    }
  });

  it('params malformado vira vazio, sem derrubar a abertura', () => {
    for (const ruim of ['x', 7, [1, 2], null]) {
      expect(lerAbertura({ instancia: {}, params: ruim })).toEqual({ settings: {}, params: {} });
    }
  });

  it('aceita configuração vazia — uma etapa de ferramenta não tem nenhuma', () => {
    expect(lerAbertura({ instancia: {} })).toEqual({ settings: {}, params: {} });
  });
});

describe('editor · alterar e mover', () => {
  const comEtapas = (n: number): Rotina => {
    let rs = anexarInstancia([], { nome: 'R' }, 'item0', {});
    if (!rs.ok) throw new Error('fixture');
    for (let i = 1; i < n; i++) {
      const r = anexarInstancia(rs.rotinas, { rotinaId: rs.rotina.id }, `item${i}`, {});
      if (!r.ok) throw new Error('fixture');
      rs = r;
    }
    return rs.rotina;
  };
  const ids = (r: Rotina) => r.etapas.map(e => e.instancias[0].itemId);

  it('alterarRotina muda só os campos pedidos', () => {
    const r = comEtapas(2);
    const [nova] = alterarRotina([r], r.id, { nome: 'Outra', modo: 'livre', embaralhar: true });
    expect([nova.nome, nova.modo, nova.embaralhar]).toEqual(['Outra', 'livre', true]);
    expect(nova.etapas).toBe(r.etapas);
  });

  it('moverEtapa reordena', () => {
    const r = comEtapas(4);
    expect(ids(moverEtapa([r], r.id, 0, 2)[0])).toEqual(['item1', 'item2', 'item0', 'item3']);
    expect(ids(moverEtapa([r], r.id, 3, 0)[0])).toEqual(['item3', 'item0', 'item1', 'item2']);
  });

  // Arrastar um pouco além da borda é gesto comum: prender é melhor que sumir com a etapa.
  it('índice fora da lista é preso a ela, e a etapa nunca se perde', () => {
    const r = comEtapas(3);
    for (const [de, para] of [[0, 9], [0, -5], [2, 99]] as const) {
      expect(moverEtapa([r], r.id, de, para)[0].etapas).toHaveLength(3);
    }
    expect(ids(moverEtapa([r], r.id, 0, 9)[0])).toEqual(['item1', 'item2', 'item0']);
  });

  it('mover de um índice que não existe não muda nada', () => {
    const r = comEtapas(3);
    expect(moverEtapa([r], r.id, 7, 0)[0]).toBe(r);
  });

  it('alterarEtapa muda tempo e política', () => {
    const r = comEtapas(2);
    const [nova] = alterarEtapa([r], r.id, r.etapas[0].id, { segundosSugeridos: 600, politica: 'sorteio-sem-repetir' });
    expect(nova.etapas[0].segundosSugeridos).toBe(600);
    expect(nova.etapas[0].politica).toBe('sorteio-sem-repetir');
    expect(nova.etapas[1]).toBe(r.etapas[1]);
  });
});

describe('editor · o rodízio', () => {
  const umaEtapa = (): Rotina => {
    const r = anexarInstancia([], { nome: 'R' }, 'braco-ache', { casas: '0-5' }, { key: { tonic: 5, mode: 'maior' } });
    if (!r.ok) throw new Error('fixture');
    return r.rotina;
  };

  it('acrescentar instância cria o rodízio', () => {
    const r = umaEtapa();
    const [nova] = acrescentarInstancia([r], r.id, r.etapas[0].id, 'ouvido-intervalo', {}, { key: { tonic: 7, mode: 'maior' } });
    expect(nova.etapas[0].instancias.map(i => i.itemId)).toEqual(['braco-ache', 'ouvido-intervalo']);
    expect(nova.etapas[0].instancias[1].params).toEqual({ key: { tonic: 7, mode: 'maior' } });
  });

  it('sem params, não grava params', () => {
    const r = umaEtapa();
    const [nova] = acrescentarInstancia([r], r.id, r.etapas[0].id, 'x');
    expect('params' in nova.etapas[0].instancias[1]).toBe(false);
  });

  // Etapa sem instância não existe no modelo: `resolverInstancia` lança.
  it('a ÚLTIMA instância não sai — tirar a etapa inteira é outro gesto', () => {
    const r = umaEtapa();
    expect(removerInstancia([r], r.id, r.etapas[0].id, 0)[0].etapas[0].instancias).toHaveLength(1);
  });

  it('tirar uma de três deixa duas, e zera `ultimaUsada`', () => {
    let rs = [umaEtapa()];
    const eid = rs[0].etapas[0].id;
    rs = acrescentarInstancia(rs, rs[0].id, eid, 'b');
    rs = acrescentarInstancia(rs, rs[0].id, eid, 'c');
    rs = alterarEtapa(rs, rs[0].id, eid, { ultimaUsada: 2 });
    const depois = removerInstancia(rs, rs[0].id, eid, 1)[0].etapas[0];
    expect(depois.instancias.map(i => i.itemId)).toEqual(['braco-ache', 'c']);
    // o índice guardado apontava para outra coisa depois da remoção: zerar é mais honesto que adivinhar
    expect(depois.ultimaUsada).toBeUndefined();
  });

  it('alterarInstancia muda só a variante pedida, e funde com o que já havia', () => {
    let rs = [umaEtapa()];
    const eid = rs[0].etapas[0].id;
    rs = acrescentarInstancia(rs, rs[0].id, eid, 'b', {}, { key: { tonic: 0, mode: 'maior' } });
    rs = alterarInstancia(rs, rs[0].id, eid, 1, { range: { lo: 36, hi: 60 } });
    expect(rs[0].etapas[0].instancias[1].params).toEqual({ key: { tonic: 0, mode: 'maior' }, range: { lo: 36, hi: 60 } });
    expect(rs[0].etapas[0].instancias[0].params).toEqual({ key: { tonic: 5, mode: 'maior' } });
  });
});

describe('editor · aplicar a todas (o que substitui Etapa.params)', () => {
  const tres = (): Rotina[] => {
    const r = anexarInstancia([], { nome: 'R' }, 'a', {}, { key: { tonic: 0, mode: 'maior' } });
    if (!r.ok) throw new Error('fixture');
    let rs = acrescentarInstancia(r.rotinas, r.rotina.id, r.rotina.etapas[0].id, 'b', {}, { key: { tonic: 2, mode: 'menor' } });
    rs = acrescentarInstancia(rs, r.rotina.id, r.rotina.etapas[0].id, 'c');
    return rs;
  };

  it('põe o mesmo parâmetro em todas as variantes', () => {
    const rs = tres();
    const depois = aplicarATodas(rs, rs[0].id, rs[0].etapas[0].id, { key: { tonic: 5, mode: 'maior' } });
    for (const inst of depois[0].etapas[0].instancias) expect(inst.params?.key).toEqual({ tonic: 5, mode: 'maior' });
  });

  it('não apaga os outros parâmetros que cada variante tinha', () => {
    let rs = tres();
    rs = alterarInstancia(rs, rs[0].id, rs[0].etapas[0].id, 0, { range: { lo: 36, hi: 60 } });
    const depois = aplicarATodas(rs, rs[0].id, rs[0].etapas[0].id, { material: 'diatonico' });
    expect(depois[0].etapas[0].instancias[0].params).toEqual({ key: { tonic: 0, mode: 'maior' }, range: { lo: 36, hi: 60 }, material: 'diatonico' });
  });
});

describe('editor · gerar variantes', () => {
  const base = (): Rotina[] => {
    const r = anexarInstancia([], { nome: 'R' }, 'braco-ache', { casas: '0-5' }, { key: { tonic: 5, mode: 'maior' } });
    if (!r.ok) throw new Error('fixture');
    return r.rotinas;
  };
  const doze = Array.from({ length: 12 }, (_, pc) => ({ key: { tonic: pc, mode: 'maior' as const } }));

  it('gera uma variante por valor, do mesmo item', () => {
    const rs = base();
    const depois = gerarVariantes(rs, rs[0].id, rs[0].etapas[0].id, 0, doze);
    const inst = depois[0].etapas[0].instancias;
    expect(inst).toHaveLength(12);
    expect(new Set(inst.map(i => i.itemId))).toEqual(new Set(['braco-ache']));
    expect(inst.map(i => i.params?.key?.tonic)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  // Gerar 12 a partir de uma instância em Fá dá 12, não 13 com Fá repetido.
  it('SUBSTITUI a etapa, em vez de acrescentar à instância que serviu de modelo', () => {
    const rs = base();
    expect(gerarVariantes(rs, rs[0].id, rs[0].etapas[0].id, 0, doze)[0].etapas[0].instancias).toHaveLength(12);
  });

  it('as variantes herdam as CONFIGURAÇÕES do modelo — só o parâmetro gerado muda', () => {
    const rs = base();
    for (const i of gerarVariantes(rs, rs[0].id, rs[0].etapas[0].id, 0, doze)[0].etapas[0].instancias) {
      expect(i.settings).toEqual({ casas: '0-5' });
    }
  });

  it('cada variante tem o seu objeto, sem compartilhar referência', () => {
    const rs = base();
    const inst = gerarVariantes(rs, rs[0].id, rs[0].etapas[0].id, 0, doze)[0].etapas[0].instancias;
    expect(inst[0].settings).not.toBe(inst[1].settings);
    expect(inst[0].params).not.toBe(inst[1].params);
  });

  it('lista vazia não mexe em nada', () => {
    const rs = base();
    expect(gerarVariantes(rs, rs[0].id, rs[0].etapas[0].id, 0, [])).toBe(rs);
  });

  it('zera `ultimaUsada`: o índice antigo apontava para outra lista', () => {
    let rs = base();
    rs = alterarEtapa(rs, rs[0].id, rs[0].etapas[0].id, { ultimaUsada: 0 });
    expect(gerarVariantes(rs, rs[0].id, rs[0].etapas[0].id, 0, doze)[0].etapas[0].ultimaUsada).toBeUndefined();
  });
});

describe('editor · duplicar', () => {
  it('cria uma cópia com id novo e sem a marca de origem', () => {
    const r = anexarInstancia([], { nome: 'Original' }, 'a', {});
    if (!r.ok) throw new Error('fixture');
    const d = duplicarRotina(r.rotinas, r.rotina.id, 'Cópia');
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(d.rotina.nome).toBe('Cópia');
    expect(d.rotina.id).not.toBe(r.rotina.id);
    expect(d.rotina.origem).toBeUndefined();
    expect(d.rotinas).toHaveLength(2);
  });

  it('a cópia não divide as etapas com a original', () => {
    const r = anexarInstancia([], { nome: 'O' }, 'a', { x: [1, 2] });
    if (!r.ok) throw new Error('fixture');
    const d = duplicarRotina(r.rotinas, r.rotina.id, 'C');
    if (!d.ok) throw new Error('falhou');
    expect(d.rotina.etapas[0].id).not.toBe(r.rotina.etapas[0].id);
    expect(d.rotina.etapas[0].instancias[0].settings).not.toBe(r.rotina.etapas[0].instancias[0].settings);
  });

  it('recusa nome vazio e rotina que não existe', () => {
    const r = anexarInstancia([], { nome: 'O' }, 'a', {});
    if (!r.ok) throw new Error('fixture');
    expect(duplicarRotina(r.rotinas, r.rotina.id, '  ')).toEqual({ ok: false, motivo: 'nome-vazio' });
    expect(duplicarRotina(r.rotinas, 'fantasma', 'C')).toEqual({ ok: false, motivo: 'rotina-inexistente' });
  });
});
