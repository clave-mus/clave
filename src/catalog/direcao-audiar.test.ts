// A direção `audiar` (10/11/2026) — a terceira, ao lado de ler e escrever.
//
// É a coluna "oposto" do desenho do Paulo em `OR-ouvido-relativo.md`, e o achado que a encolheu:
// ele descreveu cinco "opostos" (ler a coisa, ouvir o contexto, audiar, conferir) e parecia cinco
// exercícios novos. **Não é nenhum** — no oposto o que os olhos recebem é notação ou instrumento,
// que é o estímulo dos itens que a reorganização já criou. Então é um valor a mais no seletor de
// direção que eles já têm.
//
// O teste genérico de "toda pergunta tem resposta que a superfície consegue dar" usa só os padrões,
// e o padrão é `ler` — então sem este arquivo a direção nova não seria exercitada por nada.
import { describe, expect, it } from 'vitest';
import { EXERCISES } from './catalog';
import { isSeries, type Ctx, type SeriesItem } from './types';
import { resolveParams } from './params';
import { buildAttempt } from '../state/attempts';
import { resolvePresentation } from '../audio/presentation';
import { translate, type MessageKey, type Vars } from '../i18n';

const ctx: Ctx = {
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams('baixo', {}),
};
const COM_AUDIAR = ['nota-na-pauta', 'nota-no-instrumento', 'intervalo-na-pauta', 'intervalo-no-instrumento'];
const item = (id: string) => EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
const perguntar = (id: string) => {
  const ex = item(id);
  return ex.make({ ...ex.defaults, direcao: 'audiar' } as never, ctx);
};

describe('a direção existe nos quatro itens reorganizados', () => {
  it.each(COM_AUDIAR)('%s oferece `audiar` no seletor de direção', id => {
    const dir = item(id).settings(ctx).find(st => st.id === 'direcao');
    expect(dir, 'tem seletor de direção').toBeTruthy();
    expect((dir!.options ?? []).map(o => o.id)).toContain('audiar');
  });
});

describe('audiar é audiar: o gabarito não toca sozinho', () => {
  // O ponto do exercício. Se a resposta tocasse de cara, seria ouvir e comparar — o outro exercício.
  it.each(COM_AUDIAR)('%s não dá autoplay', id => {
    for (let i = 0; i < 20; i++) expect(perguntar(id).autoplay ?? false, id).toBe(false);
  });

  it.each(COM_AUDIAR)('%s põe o gabarito atrás de um botão, e um contexto antes', id => {
    for (let i = 0; i < 20; i++) {
      const q = perguntar(id);
      const partes = (q.sound?.partes ?? []).map(p => p.id);
      expect(partes, id).toContain('contexto');
      expect(partes, id).toContain('resposta');
    }
  });

  // O que soa de entrada é só o contexto — uma nota. A resposta fica guardada na parte.
  it.each(COM_AUDIAR)('%s só soa o contexto sem pedir nada', id => {
    for (let i = 0; i < 20; i++) {
      const q = perguntar(id);
      expect(q.sound!.groups, id).toHaveLength(1);
      expect(q.sound!.groups[0], id).toHaveLength(1);
    }
  });

  it.each(COM_AUDIAR)('%s mostra o que se deve audiar, e não um texto vazio', id => {
    for (let i = 0; i < 20; i++) {
      const q = perguntar(id);
      expect(['staff', 'fretboard'], id).toContain(q.visual.kind);
      expect(q.prompt.length, id).toBeGreaterThan(0);
      expect(q.reveal.length, id).toBeGreaterThan(0);
    }
  });
});

describe('a tentativa não mente sobre quem conferiu', () => {
  /**
   * `buildAttempt` cravava `validation_type: 'deterministic'`. Com autoavaliação isso diria no
   * histórico que o app conferiu, quando quem julgou foi a pessoa — e a análise usa esse campo.
   *
   * Agora é **deduzido da forma da pergunta**, que é a regra que o `context.test.ts` chama de "os
   * deduzidos saem da forma da pergunta, não de declaração".
   */
  it.each(COM_AUDIAR)('%s grava a tentativa como self_report', id => {
    const ex = item(id);
    const q = perguntar(id);
    const a = buildAttempt({
      exercise: ex, question: q, response: { kind: 'option', id: 'facil' }, correct: true,
      sessionId: 's', locale: 'pt', settings: { ...ex.defaults, direcao: 'audiar' }, params: ctx.params,
      presentation: resolvePresentation([ex.presentation]), responseTimeMs: 1000, repetitions: 1,
    });
    expect(a.validation_type, id).toBe('self_report');
    expect(a.question.surface, id).toBe('autoavaliacao');
  });

  it('e as outras direções seguem como deterministic', () => {
    for (const id of COM_AUDIAR) {
      const ex = item(id);
      const q = ex.make({ ...ex.defaults } as never, ctx);
      const a = buildAttempt({
        exercise: ex, question: q, response: { kind: 'option', id: 'x' }, correct: false,
        sessionId: 's', locale: 'pt', settings: ex.defaults, params: ctx.params,
        presentation: resolvePresentation([ex.presentation]), responseTimeMs: 1000, repetitions: 1,
      });
      expect(a.validation_type, id).toBe('deterministic');
    }
  });
});

describe('o contexto é a TÔNICA, e dois dos quatro erraram isso sozinhos', () => {
  /**
   * `intervalo-no-instrumento` tocava a corda mais grave do instrumento como se fosse tônica, e
   * `intervalo-na-pauta` cravava dó3 ignorando a tonalidade. Achei porque fui olhar o que soava em
   * vez de confiar no "passou". Daí `tonicaDeContexto`, usada pelos quatro.
   */
  it.each(COM_AUDIAR)('%s toca a tônica da tonalidade em vigor', id => {
    for (const [pc, nome] of [[0, 'dó'], [2, 'ré'], [7, 'sol']] as const) {
      const c: Ctx = { ...ctx, params: resolveParams('baixo', { key: { tonic: pc, mode: 'maior' } }) };
      const ex = item(id);
      for (let i = 0; i < 10; i++) {
        const q = ex.make({ ...ex.defaults, direcao: 'audiar' } as never, c);
        const contexto = q.sound!.groups[0][0];
        expect(((contexto % 12) + 12) % 12, `${id} em ${nome}`).toBe(pc);
      }
    }
  });

  // Sem tonalidade fixa cai em dó, e não numa altura sorteada: altura qualquer não é centro tonal,
  // e tocá-la como contexto de uma nota gerada à parte não estabeleceria nada.
  it.each(COM_AUDIAR)('%s cai em dó quando a tonalidade é livre', id => {
    const ex = item(id);
    for (let i = 0; i < 10; i++) {
      const q = ex.make({ ...ex.defaults, direcao: 'audiar' } as never, ctx);
      expect(((q.sound!.groups[0][0] % 12) + 12) % 12, id).toBe(0);
    }
  });

  it.each(COM_AUDIAR)('%s põe o contexto abaixo do que se audia: âncora, não concorrente', id => {
    const ex = item(id);
    for (let i = 0; i < 20; i++) {
      const q = ex.make({ ...ex.defaults, direcao: 'audiar' } as never, ctx);
      const contexto = q.sound!.groups[0][0];
      const resposta = (q.sound!.partes ?? []).find(p => p.id === 'resposta')!.groups.flat();
      expect(contexto, id).toBeLessThan(Math.min(...resposta));
    }
  });
});
