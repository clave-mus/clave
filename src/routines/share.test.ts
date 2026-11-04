// O link é a única forma de uma rotina sair do app (decisão 23), e o que entra por ele é **dado de
// fora**: truncado pelo aplicativo de mensagem, colado pela metade, vindo de uma versão mais nova.
// Então metade destes testes é sobre não quebrar com lixo.
import { describe, expect, it } from 'vitest';
import { cabeNoLink, doLink, linkDaRotina, LIMITE_DO_LINK, paraLink } from './share';
import { copiarRotina } from './storage';
import { FORMATO_ROTINA, type Etapa, type Rotina } from './types';

const etapa = (id: string, itens: string[], extra: Partial<Etapa> = {}): Etapa => ({
  id, instancias: itens.map(itemId => ({ itemId, settings: {} })), politica: 'ordem', ...extra,
});
const rotina = (extra: Partial<Rotina> = {}): Rotina => ({
  formato: FORMATO_ROTINA, id: 'r1', nome: 'Manhã de braço', modo: 'guiado', embaralhar: false, params: {},
  etapas: [etapa('a', ['que-nota-e-essa'], { segundosSugeridos: 300 }), etapa('b', ['ache-a-nota'])],
  ...extra,
});

describe('ida e volta', () => {
  it('o que importa atravessa: nome, modo, embaralhar, notas, etapas e tempos', () => {
    const r = rotina({ notas: 'devagar', embaralhar: true, modo: 'livre' });
    const v = doLink(paraLink(r))!;
    expect(v.rotina.nome).toBe('Manhã de braço');
    expect(v.rotina.modo).toBe('livre');
    expect(v.rotina.embaralhar).toBe(true);
    expect(v.rotina.notas).toBe('devagar');
    expect(v.rotina.etapas.map(e => e.instancias[0].itemId)).toEqual(['que-nota-e-essa', 'ache-a-nota']);
    expect(v.rotina.etapas[0].segundosSugeridos).toBe(300);
  });

  it('acento sobrevive — `btoa` sozinho não dá conta, e nome de rotina em português tem acento', () => {
    const r = rotina({ nome: 'Tonalidade: Ré♭ maior · atenção à grafia' });
    expect(doLink(paraLink(r))!.rotina.nome).toBe('Tonalidade: Ré♭ maior · atenção à grafia');
  });

  it('a configuração e os parâmetros de cada instância atravessam', () => {
    const r = rotina({ etapas: [{
      id: 'a', politica: 'ordem',
      instancias: [{ itemId: 'que-nota-e-essa', settings: { superficie: 'braco', casas: '5-9' }, params: { key: { tonic: 7, mode: 'maior' }, material: 'diatonico' } }],
    }] });
    const i = doLink(paraLink(r))!.rotina.etapas[0].instancias[0];
    expect(i.settings).toEqual({ superficie: 'braco', casas: '5-9' });
    expect(i.params).toEqual({ key: { tonic: 7, mode: 'maior' }, material: 'diatonico' });
  });

  it('o rodízio atravessa com as instâncias e a política', () => {
    const r = rotina({ etapas: [etapa('a', ['x1', 'x2', 'x3'], { politica: 'sorteio-sem-repetir' })] });
    const e = doLink(paraLink(r))!.rotina.etapas[0];
    expect(e.instancias).toHaveLength(3);
    expect(e.politica).toBe('sorteio-sem-repetir');
  });

  it('a rotação atravessa, e volta na POSIÇÃO ZERO — ela é de quem pratica, não da rotina', () => {
    const r = rotina({ rotacao: { param: 'tonalidade', valores: [{ tonic: 0 }, { tonic: 7 }], posicao: 1, avanco: { kind: 'manual' }, visitas: [{ valor: { tonic: 0 }, em: 1, sessoes: 4 }] } });
    const rot = doLink(paraLink(r))!.rotina.rotacao!;
    expect(rot.valores).toHaveLength(2);
    expect(rot.posicao).toBe(0);
    expect(rot.visitas).toEqual([]);
    expect(rot.avanco).toEqual({ kind: 'manual' });
  });

  it('o autor viaja só se quem mandou se identificou', () => {
    expect(doLink(paraLink(rotina()))!.autor).toBeUndefined();
    expect(doLink(paraLink(rotina(), 'Paulo'))!.autor).toBe('Paulo');
  });
});

describe('o que NÃO viaja', () => {
  // Nada que seja local de quem mandou: senão duas pessoas ficariam com o mesmo id de rotina, e o
  // rodízio de uma avançaria a partir de onde o rodízio da outra tinha parado.
  it('o id, o `ultimaUsada` e o tempo praticado ficam', () => {
    const r = rotina({ etapas: [etapa('a', ['x1', 'x2'], { ultimaUsada: 1 })] });
    const v = doLink(paraLink(r))!.rotina;
    expect(v.id).not.toBe('r1');
    expect(v.etapas[0].ultimaUsada).toBeUndefined();
  });

  it('e `doTime` não viaja: rotina recebida é rotina de pessoa, não do time', () => {
    expect(doLink(paraLink(rotina({ doTime: true })))!.rotina.doTime).toBeFalsy();
  });
});

describe('adotar o que chegou', () => {
  it('cria uma cópia com id próprio e crédito à origem (decisão 9)', () => {
    const v = doLink(paraLink(rotina(), 'Paulo'))!;
    const minha = copiarRotina(v.rotina, v.autor);
    expect(minha.id).not.toBe(v.rotina.id);
    expect(minha.origem?.autor).toBe('Paulo');
    expect(minha.etapas[0].instancias[0].itemId).toBe('que-nota-e-essa');
  });
});

describe('o tamanho', () => {
  it('uma rotina de verdade cabe numa mensagem', () => {
    expect(cabeNoLink(rotina(), 'https://clave.app')).toBe(true);
    expect(linkDaRotina(rotina(), 'https://clave.app').length).toBeLessThan(400);
  });

  it('e uma rotina absurda não cabe — é informação para a tela, não erro', () => {
    const gigante = rotina({ etapas: Array.from({ length: 60 }, (_, k) => etapa(`e${k}`, ['que-acorde-e-esse'], { segundosSugeridos: 300 })) });
    expect(cabeNoLink(gigante, 'https://clave.app')).toBe(false);
    expect(linkDaRotina(gigante, 'https://clave.app').length).toBeGreaterThan(LIMITE_DO_LINK);
  });

  it('a barra final da origem não duplica', () => {
    expect(linkDaRotina(rotina(), 'https://clave.app/')).not.toContain('//r/');
  });
});

describe('texto de fora nunca quebra o app', () => {
  it('devolve null para lixo, em vez de lançar', () => {
    for (const x of ['', 'abc', '!!!!', 'eyJ', btoa('{"n":1}'), 'null', paraLink(rotina()).slice(0, 12)]) {
      expect(() => doLink(x)).not.toThrow();
      expect(doLink(x), JSON.stringify(x)).toBeNull();
    }
  });

  it('devolve null para rotina de um formato mais novo — não inventa o que não conhece', () => {
    const futuro = btoa(JSON.stringify({ v: FORMATO_ROTINA + 1, n: 'Do futuro', m: 'g', p: [] }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(doLink(futuro)).toBeNull();
  });

  it('devolve null quando não há etapa nenhuma válida', () => {
    const vazia = btoa(JSON.stringify({ v: FORMATO_ROTINA, n: 'Vazia', m: 'g', p: [[0, 0, []]] }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // etapa sem instância é etapa inválida: `ehRotina` recusa, e recusar é melhor que abrir vazia
    expect(doLink(vazia)).toBeNull();
  });

  it('política desconhecida vira `ordem` em vez de quebrar', () => {
    const esquisita = btoa(JSON.stringify({ v: FORMATO_ROTINA, n: 'X', m: 'g', p: [[99, 0, [['que-nota-e-essa', {}]]]] }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(doLink(esquisita)!.rotina.etapas[0].politica).toBe('ordem');
  });

  it('o link é seguro em URL: sem +, / nem = no corpo', () => {
    const corpo = paraLink(rotina({ nome: 'çãõ ♭♯ ~ ' }));
    expect(corpo).not.toMatch(/[+/=]/);
  });
});
