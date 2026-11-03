// Contrato do "Salvar numa rotina": criar uma rotina, anexar uma etapa, tirar uma etapa.
import { describe, expect, it } from 'vitest';
import { anexarInstancia, lerAbertura, removerEtapa } from './edicao';
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
