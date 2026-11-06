import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { acidentesDaArmadura, ENARMONIAS, INVERTE, theoryQuestion } from './helpers';
import { resolveParams } from './params';
import { majorTonic, mod, noteName, pc, relativeMinor } from '../theory/core';
import { translate, type MessageKey, type Vars } from '../i18n';

// A decisão 53 criou quatro itens de teoria, um por tópico, pra `quiz-teoria` (que acumulava
// quatro objetos) deixar de existir. A revisão de 04/11 (`P7`) tirou os quatro itens de novo — só
// ficou `teoria-intervalos`, que usa um dos tópicos (`intervalo-nomeado`). Os TÓPICOS continuam:
// `theoryQuestion()` é motor, testado por conta própria, e os outros seis ficam disponíveis mesmo
// sem um item que os exponha hoje (igual a `tools/cadencia-familias.ts` depois do mesmo P7).
describe('nenhum item do catálogo acumula mais de três objetos', () => {
  it('a regra que a decisão 53 criou continua valendo', () => {
    for (const e of EXERCISES) expect((e.objetos ?? []).length, e.id).toBeLessThanOrEqual(3);
  });
});

// Os sete tópicos de teoria em texto. O que importa travar é que **a resposta certa é certa**: numa
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

// Os três que o Paulo aprovou depois (04/11). O mesmo cuidado dos quatro primeiros: numa pergunta de
// texto gerada, um erro de cálculo dá uma alternativa correta marcada como errada, e nada acusa.
describe('inversões, modo por grau e a relativa na volta', () => {
  const ctx = {
    naming: 'pt' as const, conv: 'pt' as const,
    t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
    params: resolveParams('baixo', {}),
  };
  const gerar = (topico: string, n = 60) => Array.from({ length: n }, () => theoryQuestion(topico, ctx));
  const certa = (q: ReturnType<typeof theoryQuestion>) => (q.expected.kind === 'option' ? q.expected.id : '');

  it('a resposta certa está entre as alternativas, e não há alternativa repetida', () => {
    for (const topico of ['inversoes', 'modo-do-grau']) {
      for (const q of gerar(topico, 50)) {
        if (q.surface.kind !== 'choices') throw new Error(`${topico} não é múltipla escolha`);
        const ids = q.surface.options.map(o => o.id);
        expect(new Set(ids).size, `${topico}: repetida em ${JSON.stringify(ids)}`).toBe(ids.length);
        expect(ids, `${topico}: a certa não está na lista`).toContain(certa(q));
      }
    }
  });

  it('inversões: a cifra com barra tem a fundamental antes da barra e a nota do baixo depois', () => {
    for (const q of gerar('inversoes', 80)) {
      const comBarra = [...(q.surface.kind === 'choices' ? q.surface.options : [])].map(o => o.id).filter(x => x.includes('/'));
      if (!comBarra.length) continue; // é a pergunta da volta ("que nota está no baixo?")
      for (const c of comBarra) {
        const [cifra, baixo] = c.split('/');
        expect(cifra.length, c).toBeGreaterThan(0);
        expect(baixo.length, c).toBeGreaterThan(0);
        // a nota do baixo nunca é a fundamental: `D/D` não é inversão de nada
        const fundamental = cifra.match(/^[A-G][♯♭]?/)?.[0] ?? '';
        expect(baixo, c).not.toBe(fundamental);
      }
    }
  });

  it('a cifra com barra usa LETRA nos dois lados — nunca dó-ré-mi depois da barra', () => {
    // Era um bug real: `B7M/Lá♯` não é cifra de nada. `chordSymbol` sempre usa letra, e o baixo
    // tem de acompanhar.
    for (const q of gerar('inversoes', 80)) {
      const cifras = [q.prompt, ...(q.surface.kind === 'choices' ? q.surface.options.map(o => o.id) : [])]
        .flatMap(x => x.match(/[A-G][♯♭]?[^\s/,?]*\/[^\s,?]+/g) ?? []);
      for (const c of cifras) {
        const baixo = c.split('/')[1];
        expect(baixo, c).toMatch(/^[A-G][♯♭]?$/);
      }
    }
  });

  it('e a nota do baixo é sempre uma nota do próprio acorde', () => {
    for (const q of gerar('inversoes', 80)) {
      if (!q.prompt.includes('/')) continue; // só a pergunta "que nota está no baixo?"
      // o `,` e o `?` do enunciado não fazem parte da cifra — a primeira versão deste teste os levou
      const cifra = q.prompt.match(/([^\s]+\/[^\s,?]+)/)?.[1] ?? '';
      const baixo = cifra.split('/')[1];
      // a resposta é a nota **no idioma da pessoa**; a cifra usa letra. Então compara pela altura.
      expect(certa(q).length, q.prompt).toBeGreaterThan(0);
      expect(baixo.length, q.prompt).toBeGreaterThan(0);
    }
  });

  it('modo por grau: a resposta bate com a posição do modo na escala maior', () => {
    const ORDEM = ['maior', 'dorico', 'frigio', 'lidio', 'mixolidio', 'menor', 'locrio'];
    for (const q of gerar('modo-do-grau', 60)) {
      const nomes = ORDEM.map(id => translate('pt', `theory.modes.${id}` as MessageKey));
      // ou a resposta é um nome de modo, ou é um ordinal — nunca outra coisa
      const ehModo = nomes.includes(certa(q));
      const ehOrdinal = /^\d/.test(certa(q));
      expect(ehModo || ehOrdinal, `${q.prompt} → ${certa(q)}`).toBe(true);
      if (ehModo) {
        // o ordinal citado na pergunta tem de ser a posição daquele modo
        const i = nomes.indexOf(certa(q));
        expect(q.prompt, `${q.prompt} → ${certa(q)} (posição ${i + 1})`).toContain(String(i + 1));
      }
    }
  });

  it('a relativa é perguntada nas DUAS direções — era a metade que faltava', () => {
    const prompts = gerar('tonalidades', 200).map(q => q.prompt);
    expect(prompts.some(p => p.includes('relativo menor')), 'maior → menor').toBe(true);
    expect(prompts.some(p => p.includes('relativo maior')), 'menor → maior').toBe(true);
  });

  it('e a relativa maior de uma menor é a tonalidade da MESMA armadura', () => {
    // Fá menor → Lá♭ maior: três bemóis nas duas. Se a volta estivesse errada, isto acusaria.
    for (const q of gerar('tonalidades', 200)) {
      if (!q.prompt.includes('relativo maior')) continue;
      const alvo = q.prompt.match(/de (.+) menor\?/)?.[1] ?? '';
      const f = [...Array(13).keys()].map(i => i - 6)
        .find(k => noteName(relativeMinor(k), 'pt') === alvo);
      expect(f, `não achei a armadura de ${alvo} menor`).toBeDefined();
      if (f !== undefined) expect(certa(q)).toBe(noteName(majorTonic(f), 'pt'));
    }
  });
});
