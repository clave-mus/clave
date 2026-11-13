// Audiar: ler a coisa, ouvir só o contexto, produzir o som na cabeça, e conferir depois.
//
// É a coluna "oposto" do desenho do Paulo em `OR-ouvido-relativo.md`. Ela nasceu em 10/11 como um
// terceiro valor do seletor de DIREÇÃO dos itens de notação, e **mudou de casa em 12/11**: a
// pergunta dele — *"onde entraria ler uma sequência de graus, 1543, e audiá-la?"* — não tinha
// resposta ali, porque item de pauta não sabe de melodia nem de grau. O modelo novo:
//
//   **O item é o objeto musical e o seu gerador. Direção e superfície são parâmetros.**
//
// Então audiar é o estímulo `escrito` das LINHAS DE OUVIDO, e este arquivo migrou com ele.
//
// O teste genérico de "toda pergunta tem resposta que a superfície consegue dar" usa só os padrões,
// e o padrão é `som` — então sem este arquivo o estímulo escrito não seria exercitado por nada.
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
/** As linhas de ouvido, que são onde o audiar mora desde 12/11. */
const COM_AUDIAR = ['ouvido-tecla', 'ouvido-intervalo', 'ouvido-acorde', 'ouvido-campo', 'melodia-de-ouvido'];
const item = (id: string) => EXERCISES.filter(isSeries).find(e => e.id === id) as SeriesItem;
const perguntar = (id: string) => {
  const ex = item(id);
  return ex.make({ ...ex.defaults, estimulo: 'escrito' } as never, ctx);
};

describe('toda linha de ouvido tem as duas direções', () => {
  it.each(COM_AUDIAR)('%s oferece o estímulo escrito', id => {
    const est = item(id).settings(ctx).find(st => st.id === 'estimulo');
    expect(est, 'tem seletor de estímulo').toBeTruthy();
    expect((est!.options ?? []).map(o => o.id)).toEqual(['som', 'escrito']);
  });

  /** E os itens de NOTAÇÃO não o têm mais: audiar saiu de lá em 12/11. */
  it.each(['nota-na-pauta', 'nota-no-instrumento', 'intervalo-na-pauta', 'intervalo-no-instrumento', 'acorde-na-pauta', 'acorde-no-instrumento'])(
    '%s não oferece mais `audiar`', id => {
      const dir = item(id).settings(ctx).find(st => st.id === 'direcao');
      expect((dir?.options ?? []).map(o => o.id), id).not.toContain('audiar');
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

  /**
   * O que soa de entrada é **só o contexto**; a resposta fica guardada na parte.
   *
   * Em 10/11 isto exigia "um grupo de uma nota", porque o contexto era sempre a tônica. Com as
   * linhas de ouvido o contexto pode ser uma CADÊNCIA (vários acordes) — o que o teste tem de
   * travar é que **nada da resposta soa de entrada**, não quantos grupos o contexto tem.
   */
  it.each(COM_AUDIAR)('%s só soa o contexto sem pedir nada', id => {
    for (let i = 0; i < 20; i++) {
      const q = perguntar(id);
      const contexto = q.sound!.partes!.find(p => p.id === 'contexto')!.groups;
      expect(q.sound!.groups.filter(g => g.length), id).toEqual(contexto.filter(g => g.length));
    }
  });

  it.each(COM_AUDIAR)('%s mostra o que se deve audiar, e não um texto vazio', id => {
    for (let i = 0; i < 20; i++) {
      const q = perguntar(id);
      // `text` entra porque audiar um GRAU ou um nome de nota é o enunciado, sem desenho (foi o
      // caso que o Paulo levantou: ler `1543` e audiar).
      expect(['staff', 'fretboard', 'keyboard', 'text'], id).toContain(q.visual.kind);
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

describe('o contexto estabelece A TONALIDADE, e dois itens erraram isso sozinhos', () => {
  /**
   * `intervalo-no-instrumento` tocava a corda mais grave do instrumento como se fosse tônica, e
   * `intervalo-na-pauta` cravava dó3 ignorando a tonalidade. Achei porque fui olhar o que soava em
   * vez de confiar no "passou". Daí `tonicaDeContexto`.
   *
   * **O que o teste afirma mudou em 12/11**, com o audiar migrando para as linhas de ouvido: ali o
   * contexto pode ser uma CADÊNCIA, e aí a primeira coisa que soa é o grau ii, não a tônica. O
   * invariante verdadeiro é que o contexto **fecha** na tônica — é isso que estabelece o centro, e
   * é o que as duas cadências do app fazem (`fechaNaTonica`).
   */
  const fecho = (q: ReturnType<SeriesItem['make']>) => {
    const grupos = q.sound!.partes!.find(p => p.id === 'contexto')!.groups.filter(g => g.length);
    return Math.min(...grupos[grupos.length - 1]);
  };

  it.each(COM_AUDIAR)('%s fecha o contexto na tônica da tonalidade em vigor', id => {
    for (const [pc, nome] of [[0, 'dó'], [2, 'ré'], [7, 'sol']] as const) {
      const c: Ctx = { ...ctx, params: resolveParams('baixo', { key: { tonic: pc, mode: 'maior' } }) };
      const ex = item(id);
      for (let i = 0; i < 10; i++) {
        const q = ex.make({ ...ex.defaults, estimulo: 'escrito' } as never, c);
        expect(((fecho(q) % 12) + 12) % 12, `${id} em ${nome}`).toBe(pc);
      }
    }
  });

  /**
   * **Com tonalidade livre, o centro é SORTEADO** — decidido pelo Paulo em 13/11, com o raciocínio
   * que importa: centro fixo deixa a altura absoluta substituir o ouvido relativo. Se o contexto é
   * sempre dó, depois de uma semana a pessoa reconhece o ré por lembrar da frequência em vez de
   * ouvir a relação; sorteando, a única coisa estável entre rodadas é o intervalo.
   *
   * Até 12/11 duas linhas fixavam dó e três sorteavam, e eu deixei **sem teste** de propósito
   * enquanto ele não escolhia. Escolhido, as cinco sorteiam — e isto trava.
   */
  /**
   * ⚠️ **`ouvido-acorde` é a exceção, e ela é de desenho.** Ali o "centro" É a fundamental do
   * acorde, e o rascunho do Paulo pede que ela possa ser fixa — *"se a tônica do acorde é sempre a
   * mesma (padrão: sim, dó)"*. Fixá-la é o ponto daquele item: prender a fundamental tira a variação
   * de altura e deixa só a cor, que é o que ele pergunta.
   *
   * Então ali o teste exercita `fundamental: 'sorteada'` — o que ele tem de provar é que a fixidez
   * vem do PARÂMETRO e não de um dó cravado no código.
   */
  const extraPara = (id: string) => (id === 'ouvido-acorde' ? { fundamental: 'sorteada' } : {});

  it.each(COM_AUDIAR)('%s sorteia o centro quando a tonalidade é livre', id => {
    const ex = item(id);
    const vistos = new Set<number>();
    for (let i = 0; i < 60; i++) {
      const q = ex.make({ ...ex.defaults, estimulo: 'escrito', ...extraPara(id) } as never, ctx);
      const contexto = q.sound!.partes!.find(p => p.id === 'contexto')!.groups.filter(g => g.length);
      vistos.add(((Math.min(...contexto[contexto.length - 1]) % 12) + 12) % 12);
    }
    // Com doze classes possíveis, 60 sorteios que caíssem todos na mesma seriam a marca de um
    // centro cravado — o defeito que esta decisão resolveu.
    expect(vistos.size, `${id} fixou o centro em ${[...vistos]}`).toBeGreaterThan(4);
  });


  /**
   * O contexto **não sai da região**. Era "abaixo do que se audia, ou no piso": com uma tônica solta
   * aquilo fazia sentido, mas uma CADÊNCIA é um leito harmônico e ficar sob a melodia inteira não é
   * exigência musical nenhuma — exigir isso prenderia a cadência num registro grave sem motivo.
   *
   * O que continua valendo, e é o que a lição de 09/11 ensinou, é que nada soa fora do que a pessoa
   * vê: `caberNaFaixa` garante, e aqui se confere.
   */
  /**
   * ⚠️ **Audiando num BRAÇO, quem manda é o alcance dele**, não a região.
   *
   * As duas restrições podem ser incompatíveis: um baixo nas casas 0–12 alcança 28–55, a região
   * padrão é 48–72, e a intersecção tem oito semitons — não cabe uma oitava. Em 13/11 o Paulo pediu
   * que a referência fosse MOSTRADA no braço, e referência que não se vê não é referência; a região
   * diz o que se quer ouvir e não pode mandar no que se desenha.
   *
   * Então o teste afirma o que vale em cada caso: no braço, caber no braço; nas outras, na região.
   */
  it.each(COM_AUDIAR)('%s mantém o contexto na região, ou onde ele é desenhado', id => {
    const ex = item(id);
    for (let i = 0; i < 20; i++) {
      const q = ex.make({ ...ex.defaults, estimulo: 'escrito' } as never, ctx);
      const contexto = q.sound!.partes!.find(p => p.id === 'contexto')!.groups.flat();
      const v = q.visual;
      /**
       * As alturas que o item DESENHA. Só o `ouvido-tecla` desenha o contexto (a referência, que o
       * Paulo pediu para ver); nos outros a cadência não aparece, e aí só a região vale.
       */
      const desenhadas = v.kind === 'fretboard' ? v.marks.map(mk => v.tuning[mk.s] + mk.f)
        : v.kind === 'keyboard' ? v.marks
        : [];
      /**
       * O que o app garante: **nada soa abaixo do piso** da região, e o contexto desenhado cabe onde
       * é desenhado.
       *
       * O teto é outra história, e está documentada em `caberNaFaixa`: uma cadência de tétrades é
       * mais larga que a região padrão (24 semitons), então subir o conjunto para respeitar o piso
       * pode levar a nota mais aguda acima do teto. Afirmar o teto aqui seria afirmar o que o app
       * não promete — e eu quase fiz isso ao escrever este teste mais estrito que a realidade.
       */
      for (const m of contexto) {
        const acimaDoPiso = m >= ctx.params.range.lo;
        expect(acimaDoPiso || desenhadas.includes(m), `${id}: ${m} abaixo do piso e não desenhado`).toBe(true);
      }
    }
  });
});
