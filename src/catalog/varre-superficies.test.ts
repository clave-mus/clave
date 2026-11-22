// **A varredura de superfícies**: as mesmas perguntas, feitas a TODOS os itens de série, em três
// instrumentos e seis tonalidades (13/11/2026).
//
// Nasceu de um pedido do Paulo: *"avaliar os erros que tivemos e ver o que tu pode adiantar de
// correções nos outros exercícios que ainda não revisei"*. Três rodadas de revisão dele tinham um
// padrão — ele achava um defeito numa tela, eu consertava **naquela** tela, e o mesmo defeito
// seguia vivo nas outras. A causa era sempre a mesma: a conta estava copiada em cada item.
//
// Este arquivo é o contrário disso. Em vez de consertar por tela, afirma a invariante para o
// catálogo inteiro: todo item que nasce já nasce medido. O que ele achou de primeira:
//
// - **armadura**: `intervalo-na-pauta`, `acorde-na-pauta` e `pauta-escala` não desenhavam a
//   armadura da tonalidade escolhida, mesmo depois de a decisão D2 dizer que ela se desenha;
// - **resposta impossível**: `ouvido-acorde` e `ouvido-intervalo` no baixo pediam uma nota que o
//   braço de quatro cordas não alcança — não havia casa para clicar;
// - **tônica contra a armadura**: `pauta-escala` anunciava "escala de Fá♯ maior" sob cinco bemóis.
//
// ## As duas invariantes que eu quis escrever e NÃO escrevi
//
// Valem mais registradas que esquecidas, porque as duas pareciam óbvias e as duas estavam erradas.
// Medi antes de afirmar, e a medição desmentiu:
//
// 1. *"nota desenhada concorda com a armadura"* — acusou `Fá♯♯` em dó maior e eu quase o consertei.
//    Mas **Si aumentado É Si–Ré♯–Fá♯♯**; grafar Sol ali faria dele outro acorde. Acorde e escala
//    alterados produzem grafia fora da tonalidade *por definição*, e isso é teoria correta. O que
//    precisa seguir a tonalidade é só a **tônica sorteada**, que é enunciado — e essa entrou;
// 2. *"toda marca desenhada no braço é nota que soa"* — acusou `melodia-de-ouvido` audiando, onde a
//    melodia **não deve** tocar: ver e imaginar é o exercício. A invariante proibiria audiar.
//
// Guardar as duas aqui é o ponto: medir antes de afirmar me impediu duas vezes de "consertar" o que
// estava certo.
import { describe, expect, it } from 'vitest';
import { ITEMS } from './index';
import { resolveParams, type GlobalParams } from './params';
import { quintasDaTonalidade } from './contexto-musical';
import { mod } from '../theory/core';
import { translate, type MessageKey, type Vars } from '../i18n';
import type { Ctx, Question, SettingValue } from './types';

type Params = Parameters<typeof resolveParams>[1];
const ctxDe = (p: Params, inst: GlobalParams['instrument']): Ctx => ({
  naming: 'pt', conv: 'pt', t: (k: MessageKey, v?: Vars) => translate('pt', k, v),
  params: resolveParams(inst, p),
});

/** Seis tonalidades, escolhidas pelos lados da armadura — é ali que a grafia erra. */
const TONALIDADES: { nome: string; p: Params }[] = [
  { nome: 'livre', p: { key: null } },
  { nome: 'dó maior', p: { key: { tonic: 0, mode: 'maior' } } },
  { nome: 'sol maior', p: { key: { tonic: 7, mode: 'maior' } } },
  { nome: 'ré♭ maior', p: { key: { tonic: 1, mode: 'maior' } } },
  { nome: 'ré menor', p: { key: { tonic: 2, mode: 'menor' } } },
  { nome: 'lá menor', p: { key: { tonic: 9, mode: 'menor' } } },
];
const INSTRUMENTOS: GlobalParams['instrument'][] = ['violao', 'baixo', 'piano'];

/**
 * Cada valor que um `single` ou `toggle` pode tomar, **um por vez** sobre os defaults.
 *
 * Um por vez, e não o produto cartesiano: o produto são milhares de combinações, e a suíte toda tem
 * meio minuto de orçamento. Como quase todo defeito desta família vem de UM parâmetro (a
 * superfície, a tonalidade, o instrumento), variar um por vez os pega — os três achados de hoje
 * saíram assim.
 */
function configuracoes(item: typeof ITEMS[number], ctx: Ctx): Record<string, SettingValue>[] {
  if (!('settings' in item) || !item.settings || !('defaults' in item) || !item.defaults) return [{}];
  const settings = item.settings(ctx);
  const defaults = { ...item.defaults } as Record<string, SettingValue>;
  /**
   * **Duas bases, e a segunda é o conserto de um furo que a contraprova achou no próprio guarda.**
   *
   * Com uma base só — os defaults — o teste passava no estado anterior do teclado de
   * `ouvido-acorde`, onde a faixa era 48–72 fixa. A razão: os defaults marcam tríades, e uma tríade
   * sobre a fundamental mais alta chega a 71, **um semitom** abaixo do teto. O defeito morava nas
   * tétrades, e variar um parâmetro por vez nunca pedia *desenhar no teclado* **e** *tétrade*
   * juntos — e é exatamente nesse cruzamento, superfície × conteúdo, que esta família de defeito
   * vive.
   *
   * Então os `single` e `toggle` variam sobre duas bases: os defaults, e os defaults com todo
   * `multi` cheio. A segunda é também o atalho "tudo" de vários itens, então não é um caso
   * artificial — é o uso pela ponta larga. Custa o dobro de perguntas e vale: foi o que fez o
   * guarda enxergar o defeito de verdade.
   */
  const cheio = { ...defaults };
  for (const st of settings) if (st.type === 'multi' && st.options) cheio[st.id] = st.options.map(o => o.id);
  const out: Record<string, SettingValue>[] = [defaults, cheio];
  for (const base of [defaults, cheio]) {
    for (const st of settings) {
      if (st.type === 'single' && st.options) for (const o of st.options) out.push({ ...base, [st.id]: o.id });
      if (st.type === 'toggle') for (const v of [true, false]) out.push({ ...base, [st.id]: v });
    }
  }
  return out;
}

/** Toda pergunta que o catálogo sabe fazer, com de onde ela veio — para a falha dizer onde olhar. */
function* todasAsPerguntas(): Generator<{ q: Question; onde: string; fifths: number | null }> {
  for (const item of ITEMS) {
    if (item.kind !== 'serie' || !('make' in item) || !item.make) continue;
    for (const inst of INSTRUMENTOS) {
      for (const { nome, p } of TONALIDADES) {
        const ctx = ctxDe(p, inst);
        const fifths = quintasDaTonalidade(ctx);
        for (const s of configuracoes(item, ctx)) {
          if (item.problema?.(s, ctx)) continue;
          // Duas rodadas por configuração: quase tudo aqui sorteia, e uma rodada só deixa passar o
          // caso azarado — foi assim que a resposta fora do braço sobreviveu até hoje.
          for (let r = 0; r < 2; r++) {
            yield { q: item.make(s, ctx), onde: `${item.id} · ${inst} · ${nome} · ${JSON.stringify(s)}`, fifths };
          }
        }
      }
    }
  }
}

/** As alturas que a resposta exige — só as que são altura; `option` e `chord` não são. */
function alturasEsperadas(q: Question): number[] {
  const e = q.expected;
  return e.kind === 'pitch' ? [e.midi] : e.kind === 'contorno' ? e.midis : [];
}

/**
 * **`pauta-armadura` é a exceção, e ela é da natureza do item**: ali a armadura não é o cenário da
 * pergunta, é **a pergunta** — o exercício desenha uma e pede a tonalidade. Obrigá-la a seguir a
 * tonalidade em vigor daria a resposta de graça, e o item deixaria de existir.
 *
 * É a mesma distinção que `contexto-musical.ts` faz do material, na frase que vale para tudo aqui:
 * *o parâmetro filtra o que o app sorteia, não o que o app pergunta.* Uma exceção por item, com a
 * razão escrita — e esta é a única.
 */
const A_ARMADURA_E_A_PERGUNTA = ['pauta-armadura'];

describe('a tonalidade escolhida desenha a armadura (decisão D2)', () => {
  /**
   * D2 foi aprovada pelo Paulo em 12/11 e aplicada em dois itens. Em 13/11 ela valia em três das
   * nove telas de pauta — o resto desenhava a armadura de dó maior em qualquer tonalidade, e aí
   * cada acidente precisava de um sinal escrito à mão, que foi a queixa que originou a decisão.
   */
  it('todo desenho de pauta leva a armadura, e é a da tonalidade em vigor', () => {
    for (const { q, onde, fifths } of todasAsPerguntas()) {
      if (fifths === null) continue;
      if (A_ARMADURA_E_A_PERGUNTA.some(id => onde.startsWith(id))) continue;
      if (q.visual.kind === 'staff') expect(q.visual.fifths, `visual · ${onde}`).toBe(fifths);
      if (q.surface.kind === 'staff') expect(q.surface.fifths, `surface · ${onde}`).toBe(fifths);
    }
  });
});

describe('a superfície de resposta contém a resposta', () => {
  /**
   * **O defeito mais grave que esta varredura achou**, porque ele aparece como erro da pessoa.
   *
   * `ouvido-acorde` desenhava o teclado de resposta em 48–72 fixo enquanto o acorde subia até 83
   * (a fundamental sai da região de quem usa, e as inversões somam até 19 semitons). No braço do
   * baixo, pior: `ouvido-intervalo` pedia MIDI 64 num instrumento cuja última casa dá 55. A tecla
   * não existia na tela. Quem "errou" não errou nada.
   */
  it('toda altura esperada tem tecla no teclado desenhado', () => {
    for (const { q, onde } of todasAsPerguntas()) {
      const sf = q.surface;
      if (sf.kind !== 'keyboard') continue;
      for (const m of alturasEsperadas(q)) {
        expect(m >= sf.lo && m <= sf.hi, `${m} fora de ${sf.lo}–${sf.hi} · ${onde}`).toBe(true);
      }
      if (q.expected.kind === 'pitchClass') {
        const pc = q.expected.pc;
        const alguma = Array.from({ length: sf.hi - sf.lo + 1 }, (_, k) => sf.lo + k).some(m => mod(m, 12) === pc);
        expect(alguma, `classe ${pc} sem tecla · ${onde}`).toBe(true);
      }
    }
  });

  it('toda altura esperada tem casa no braço desenhado', () => {
    for (const { q, onde } of todasAsPerguntas()) {
      const sf = q.surface;
      if (sf.kind !== 'fretboard') continue;
      for (const m of alturasEsperadas(q)) {
        const tem = sf.tuning.some(t => m - t >= sf.from && m - t <= sf.to);
        expect(tem, `${m} sem casa em [${sf.tuning.join(',')}] casas ${sf.from}–${sf.to} · ${onde}`).toBe(true);
      }
    }
  });
});

describe('toda pergunta tem conteúdo', () => {
  /**
   * **O furo que as outras invariantes deixavam passar**: uma pergunta vazia satisfaz todas elas.
   *
   * "Toda altura esperada cabe na superfície" é verdade trivialmente quando não há altura esperada;
   * "o braço soa com voz de braço" é verdade quando nada soa. E isso não é hipótese: em 13/11 eu
   * mesmo zerei o acorde de `ouvido-acorde` com um erro de aliasing — `caberNaFaixa` devolve os
   * mesmos arrays quando não desloca, e um `length = 0` na cópia-que-não-era-cópia apagou a fonte.
   * O acorde ficou sem nota, sem marca e sem som, e **as três invariantes passaram**.
   *
   * Quem pegou foi outro teste, por acidente. Esta é a rede que faltava.
   */
  it('o que deve soar soa, e o braço desenhado tem marca', () => {
    for (const { q, onde } of todasAsPerguntas()) {
      if (q.sound) {
        // `drums` conta: em `ritmo-ouvido` o som é ataque no tempo e não tem altura nenhuma —
        // `groups` vazio ali é o normal, e exigir altura reprovaria o item por existir.
        const soa = q.sound.groups.flat().length
          + (q.sound.drums?.length ?? 0)
          + (q.sound.partes ?? []).reduce((n, p) => n + p.groups.flat().length, 0);
        expect(soa, `nada soa · ${onde}`).toBeGreaterThan(0);
      }
      // Audiar desenha sem tocar, e tocar sem desenhar é o normal de "ouvir" — o que não existe é
      // um braço desenhado com zero marcas quando ele É o estímulo.
      if (q.visual.kind === 'fretboard' && q.surface.kind === 'autoavaliacao') {
        expect(q.visual.marks.length, `braço sem marca no audiar · ${onde}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('a autoavaliação tem o que conferir', () => {
  /**
   * **Uma dependência que o conserto de 13/11 criou, e que ninguém travou.**
   *
   * O Paulo pediu que os três botões de autoavaliação só aparecessem *"depois que tu ouvir a
   * resposta"* — julgar "consegui" antes de conferir é julgar no vácuo. O Player passou a esperar
   * pelo pedaço `resposta` de `sound.partes`.
   *
   * O efeito colateral é que um item com autoavaliação e **sem** esse pedaço fica impossível de
   * responder: a tela espera para sempre por um botão que não existe. Nenhum item está assim hoje,
   * e é justamente por isso que vale travar — o próximo item de audiar vai nascer desta armadilha.
   *
   * ⚠️ **`gabarito` conta tanto quanto o id `resposta`**, e isto saiu errado até 20/11: o Player
   * libera a autoavaliação com `parte.id === 'resposta' || parte.gabarito` (ver a linha 232 dele),
   * porque existe gabarito que são VÁRIOS botões — audiar as notas de um intervalo é um. O teste
   * olhava só o id, e por sorte nenhuma pergunta sorteada caía no outro caso: no melódico, audiar
   * as notas exigia direção harmônica, que os padrões não traziam. Com o intervalo harmônico virando
   * item, a varredura passou a gerar a pergunta — e acusou o teste, não o item.
   */
  it('todo item de autoavaliação oferece o pedaço `resposta` para ouvir', () => {
    for (const { q, onde } of todasAsPerguntas()) {
      if (q.surface.kind !== 'autoavaliacao') continue;
      const temResposta = (q.sound?.partes ?? [])
        .some(p => (p.id === 'resposta' || p.gabarito) && p.groups.flat().length > 0);
      expect(temResposta, `autoavaliação sem gabarito para ouvir · ${onde}`).toBe(true);
    }
  });
});

describe('o timbre segue a superfície', () => {
  /**
   * Paulo, 13/11: *"no audiar do braço, o som está de piano"*. Era o item não declarar voz, e o
   * padrão do motor é o piano de amostras — que, de passagem, nem alcança os graves de um baixo: as
   * amostras param no Dó2 e um baixo de quatro cordas desce ao Mi1.
   */
  it('braço desenhado soa com voz de braço, nunca com a voz padrão', () => {
    for (const { q, onde } of todasAsPerguntas()) {
      const noBraco = q.visual.kind === 'fretboard' || q.surface.kind === 'fretboard';
      if (!noBraco || !q.sound) continue;
      expect(['violao', 'baixo'], `${onde}`).toContain(q.sound.instrument);
    }
  });
});
