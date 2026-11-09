// Os grupos por propósito (decisão 95). O que importa travar: a lista aponta para itens que existem, o
// botão não aparece onde não há o que oferecer, e **a configuração do propósito é respeitada** — que é
// o que as fusões por superfície tornaram obrigatório.
import { describe, expect, it } from 'vitest';
import { companheirosDe, GRUPOS, gruposDaInstancia, idsFantasma, type MembroDeGrupo } from './grupos';
import { ITEMS } from './index';
import { estadoDe, visivel } from './publicacao';
import pt from '../i18n/pt';
import en from '../i18n/en';

const sempre = () => true;
const chave = (m: MembroDeGrupo) => `${m.itemId}|${JSON.stringify(m.settings ?? {})}`;
const inst = (itemId: string, settings?: Record<string, unknown>): MembroDeGrupo => ({ itemId, settings });
/** Toda instância declarada em algum grupo, para percorrer o modelo pelo lado dele. */
const TODAS = GRUPOS.flatMap(g => g.itens);

describe('a lista', () => {
  it('todo item declarado existe no catálogo', () => {
    expect(idsFantasma()).toEqual([]);
  });

  it('nenhum grupo tem menos de dois membros — com um só não há rodízio', () => {
    for (const g of GRUPOS) expect(g.itens.length, g.id).toBeGreaterThanOrEqual(2);
  });

  it('nenhum grupo repete um membro', () => {
    for (const g of GRUPOS) expect(new Set(g.itens.map(chave)).size, g.id).toBe(g.itens.length);
  });

  it('os ids dos grupos são únicos', () => {
    expect(new Set(GRUPOS.map(g => g.id)).size).toBe(GRUPOS.length);
  });

  it('todo grupo tem nome nos dois idiomas', () => {
    for (const g of GRUPOS) {
      const id = g.id as keyof typeof pt.grupos;
      expect(pt.grupos[id], `${g.id} em pt`).toBeTruthy();
      expect(en.grupos[id], `${g.id} em en`).toBeTruthy();
    }
  });

  // Depois das fusões, o id sozinho não diz o propósito: "qual nota é essa?" serve à pauta, ao teclado
  // e ao braço. Um grupo de superfície que esquecesse a configuração ofereceria a superfície errada.
  it('todo membro de um grupo de superfície declara a superfície', () => {
    for (const g of GRUPOS.filter(x => ['leitura-pauta', 'o-braco', 'o-teclado'].includes(x.id))) {
      for (const m of g.itens) {
        const multisuperficie = (ITEMS.find(i => i.id === m.itemId)?.settings?.({ t: (k: string) => k } as never) ?? []).some(s => s.id === 'superficie');
        if (multisuperficie) expect(m.settings?.superficie, `${g.id} → ${m.itemId}`).toBeTruthy();
      }
    }
  });
});

describe('as decisões do Paulo sobre o conteúdo', () => {
  const itensDe = (id: string) => GRUPOS.find(g => g.id === id)!.itens.map(chave);

  it('escrever a nota na pauta entra em "Leitura na pauta", mesmo sendo escrever e não ler', () => {
    expect(itensDe('leitura-pauta')).toContain(chave(inst('ache-a-nota', { superficie: 'pauta' })));
  });

  it('`ouvido-tecla` fica FORA de "Ouvido" — responde no teclado, e ali o propósito é outro', () => {
    expect(itensDe('ouvido')).not.toContain(chave(inst('ouvido-tecla')));
  });
});

describe('a mesma instância em vários grupos', () => {
  // É o que resolve "um exercício serve a vários propósitos": não é preciso eleger o principal.
  it('o modelo permite, e `gruposDaInstancia` devolve todos', () => {
    for (const m of TODAS) expect(gruposDaInstancia(m).length, chave(m)).toBeGreaterThanOrEqual(1);
    expect(() => gruposDaInstancia(inst('qualquer-um'))).not.toThrow();
  });

  it('instância fora de todo grupo devolve lista vazia, e isso é o caso comum', () => {
    expect(gruposDaInstancia(inst('teoria-intervalos'))).toEqual([]);
    expect(companheirosDe(inst('teoria-intervalos'), sempre)).toEqual([]);
  });

  // O ponto da mudança: o MESMO item em superfícies diferentes cai em grupos diferentes.
  it('"qual nota é essa?" na pauta e no braço caem em grupos diferentes', () => {
    const naPauta = gruposDaInstancia(inst('que-nota-e-essa', { superficie: 'pauta' })).map(g => g.id);
    const noBraco = gruposDaInstancia(inst('que-nota-e-essa', { superficie: 'braco' })).map(g => g.id);
    expect(naPauta).toEqual(['leitura-pauta']);
    expect(noBraco).toEqual(['o-braco']);
  });

  // Sem a configuração, o membro casaria com qualquer superfície — e ofereceria pauta dentro do braço.
  it('um item multissuperfície sem configuração não cai em grupo de superfície nenhum', () => {
    expect(gruposDaInstancia(inst('que-nota-e-essa'))).toEqual([]);
  });
});

describe('companheirosDe', () => {
  it('devolve os outros do grupo, sem incluir ele mesmo', () => {
    const eu = inst('que-nota-e-essa', { superficie: 'pauta' });
    const c = companheirosDe(eu, sempre);
    expect(c.map(chave)).not.toContain(chave(eu));
    expect(c.map(chave).sort()).toEqual([
      chave(inst('ache-a-nota', { superficie: 'pauta' })),
      chave(inst('pauta-escala')),
      chave(inst('que-acorde-e-esse', { superficie: 'pauta' })),
      chave(inst('que-intervalo-e-esse', { superficie: 'pauta' })),
    ].sort());
  });

  it('e os companheiros vêm com a superfície certa, nunca com a configuração do outro grupo', () => {
    for (const m of companheirosDe(inst('que-nota-e-essa', { superficie: 'braco' }), sempre)) {
      expect(m.settings?.superficie, m.itemId).toBe('braco');
    }
  });

  it('não repete, mesmo que dois grupos compartilhem um membro', () => {
    for (const m of TODAS) {
      const c = companheirosDe(m, sempre).map(chave);
      expect(new Set(c).size, chave(m)).toBe(c.length);
    }
  });

  // A condição que o Paulo pediu: o botão só aparece onde há o que oferecer. O portão é LIGADO no
  // teste (hoje ele está desligado, decisão 104) porque é o caso do beta que precisa de guarda.
  it('o que a pessoa não pode ver não é oferecido', () => {
    const podeVer = (id: string) => visivel(ITEMS.find(x => x.id === id)?.publicacao, false, true);
    // "Ritmo com metrônomo" é inteiro rascunho: fora do modo de revisão, ninguém tem companheiro
    for (const id of ['acento-deslocado', 'subdivisao-alternada', 'deslocamento-ritmico']) {
      expect(companheirosDe(inst(id), podeVer), id).toEqual([]);
    }
    expect(companheirosDe(inst('acento-deslocado'), sempre).length).toBe(2);
  });

  it('todo companheiro é um item do catálogo', () => {
    for (const m of TODAS) {
      for (const c of companheirosDe(m, sempre)) expect(ITEMS.some(x => x.id === c.itemId), c.itemId).toBe(true);
    }
  });
});

describe('o que está em rascunho nos grupos', () => {
  // Não é defeito: é o portão da decisão 91 funcionando. Fica medido para ninguém se assustar —
  // e para um rascunho não entrar num grupo sem ninguém reparar.
  it('o inventário de rascunhos dentro de grupos é exatamente este', () => {
    const rascunhos = TODAS.map(m => m.itemId).filter(id => estadoDe(ITEMS.find(i => i.id === id)?.publicacao) === 'rascunho');
    expect([...new Set(rascunhos)].sort()).toEqual([
      // "Ritmo com metrônomo", esperando o Paulo publicar a tarefa com metrônomo
      'acento-deslocado', 'deslocamento-ritmico',
      // "Ouvido", desde 09/11 — entrou no grupo com o aval dele, e segue em rascunho
      'relacoes-melodia-harmonia',
      'subdivisao-alternada',
    ]);
  });
});
