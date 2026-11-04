import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { acidentesDaArmadura, ENARMONIAS, INVERTE, theoryQuestion } from './helpers';
import { resolveParams } from './params';
import { mod, noteName, pc } from '../theory/core';
import { translate, type MessageKey, type Vars } from '../i18n';
// A decisão 53: `quiz-teoria` era o único item com QUATRO objetos. O ponto da divisão é que cada um
// dos quatro passe a ter **um só** — e que nenhum outro item volte a acumular.
describe('a divisão do quiz de teoria (decisão 53)', () => {
  it('cada um dos quatro itens de teoria tem um objeto só', () => {
    for (const id of ['teoria-graus', 'teoria-acordes', 'teoria-campo', 'teoria-tonalidades']) {
      expect(EXERCISES.find(e => e.id === id)?.objetos, id).toHaveLength(1);
    }
  });

  it('os quatro objetos são diferentes entre si — era isso que estava empacotado num item', () => {
    const objs = ['teoria-graus', 'teoria-acordes', 'teoria-campo', 'teoria-tonalidades']
      .map(id => EXERCISES.find(e => e.id === id)!.objetos![0]);
    expect(new Set(objs).size).toBe(4);
    expect([...objs].sort()).toEqual(['acordes', 'escalas', 'harmonia', 'notacao']);
  });

  it('e nenhum item do catálogo acumula mais de três objetos', () => {
    for (const e of EXERCISES) expect((e.objetos ?? []).length, e.id).toBeLessThanOrEqual(3);
  });
});

// Os quatro tópicos novos (04/11/2026). O que importa travar é que **a resposta certa é certa**: numa
// pergunta de texto gerada, um erro de cálculo dá uma alternativa correta que o app marca como errada,
// e nada acusa — nem o tipo, nem a tela.
describe('os tópicos novos de teoria', () => {
  const ctx = {
    naming: 'pt' as const, conv: 'pt' as const,
    t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
    params: resolveParams('baixo', {}),
  };
  const gerar = (topico: string, n = 60) => Array.from({ length: n }, () => theoryQuestion(topico, ctx));
  /** A alternativa certa, como texto, para conferir contra o cálculo. */
  const certa = (q: ReturnType<typeof theoryQuestion>) => (q.expected.kind === 'option' ? q.expected.id : '');

  it('toda pergunta tem a resposta certa entre as alternativas', () => {
    for (const topico of ['enarmonia', 'armadura', 'intervalo-nomeado', 'campo-menor']) {
      for (const q of gerar(topico, 40)) {
        expect(q.surface.kind, topico).toBe('choices');
        if (q.surface.kind !== 'choices') continue;
        const ids = q.surface.options.map(o => o.id);
        expect(new Set(ids).size, `${topico}: alternativa repetida em ${JSON.stringify(ids)}`).toBe(ids.length);
        if (q.expected.kind === 'option') expect(ids, `${topico}: a certa não está na lista`).toContain(q.expected.id);
      }
    }
  });

  it('enarmonia: a resposta é a MESMA tecla, e um nome diferente', () => {
    // O nome MAIS LONGO que casa, não o primeiro: "Si♯" contém "Si", e a primeira versão deste teste
    // achava o alvo errado por isso — e acusava o app de um erro que era dela.
    const porNome = [...ENARMONIAS.flat()].sort((a, b) => noteName(b, 'pt').length - noteName(a, 'pt').length);
    for (const q of gerar('enarmonia')) {
      const alvo = porNome.find(n => q.prompt.includes(noteName(n, 'pt')))!;
      const resp = porNome.find(n => noteName(n, 'pt') === certa(q))!;
      expect(mod(pc({ ...resp, oct: 4 }), 12), `${noteName(alvo, 'pt')} → ${certa(q)}`).toBe(mod(pc({ ...alvo, oct: 4 }), 12));
      expect(certa(q)).not.toBe(noteName(alvo, 'pt'));
    }
  });

  it('armadura: a resposta tem tantos acidentes quantos a tonalidade pede, e todos do mesmo tipo', () => {
    for (const q of gerar('armadura')) {
      const lista = certa(q).split(' ').filter(Boolean);
      expect(lista.length).toBeGreaterThan(0);
      // uma armadura não mistura sustenido com bemol
      const sus = lista.filter(x => x.includes('♯')).length;
      const bem = lista.filter(x => x.includes('♭')).length;
      expect(sus === 0 || bem === 0, certa(q)).toBe(true);
    }
  });

  it('e a ordem dos acidentes é sempre a convencional, truncada', () => {
    const sus = acidentesDaArmadura(7).map(n => noteName(n, 'pt')).join(' ');
    const bem = acidentesDaArmadura(-7).map(n => noteName(n, 'pt')).join(' ');
    for (let f = 1; f <= 7; f++) {
      expect(acidentesDaArmadura(f).map(n => noteName(n, 'pt')).join(' ')).toBe(sus.split(' ').slice(0, f).join(' '));
      expect(acidentesDaArmadura(-f).map(n => noteName(n, 'pt')).join(' ')).toBe(bem.split(' ').slice(0, f).join(' '));
    }
  });

  it('a inversão de um intervalo soma 9 em graus, e as qualidades se trocam', () => {
    for (const [q, i] of Object.entries(INVERTE)) expect(INVERTE[i]).toBe(q);
    expect(INVERTE.J).toBe('J');
  });

  it('campo-menor: a resposta é uma cifra conferida pela fundamental e pela qualidade', () => {
    for (const q of gerar('campo-menor', 40)) {
      expect(q.expected.kind).toBe('chord');
      expect(q.reveal.trim()).not.toBe('');
    }
  });

  // Decisão 13: item ambíguo não pode gerar "erro do usuário". É por isso que estes dois ficaram fora.
  it('os tópicos declarados são só os de resposta única — função e cadência não entraram', () => {
    const declarados = EXERCISES.flatMap(e => (e.settings?.({ t: (k: string) => k } as never) ?? []))
      .filter(s => s.id === 'temas').flatMap(s => s.options?.map(o => o.id) ?? []);
    for (const proibido of ['funcao', 'cadencia']) expect([...new Set(declarados)]).not.toContain(proibido);
  });
});
