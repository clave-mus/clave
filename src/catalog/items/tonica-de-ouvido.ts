import { voicingsDe, type Voicing } from '../../theory/voicings';
import {
  ALTERADOS, EXTENSOES, SEVENTHS, TRIADS, arr, chordSymbol, comMesmoNucleo, harmonicField, midi, mod, notaGrafada,
  noteName, pick, tonalidade, type ChordId, type Ctx, type Note, type Question,
} from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem } from '../types';
import { randInt } from '../../theory/core';

/**
 * **Tônica de ouvido** — um acorde soa num voicing de piano, e a tarefa é cantar ou audiar a
 * fundamental.
 *
 * Ideia do Paulo em 15/11: *"tocar um acorde qualquer e ter que cantar/audiar a tônica"*.
 *
 * ## Por que item novo, e não um modo do `ouvido-acorde`
 *
 * Ele perguntou exatamente isso — *"como será que ele se encaixa no nosso catálogo?"* —, e a
 * primeira resposta parecia ser "modo", porque o objeto é o mesmo (um acorde soando) e porque o
 * rascunho dele já observa, em 3.4, que *o que está fixo define a pergunta*: aqui a qualidade é dada
 * e a fundamental é perguntada.
 *
 * O que decidiu pelo item novo foi o **gerador**, que é o critério do modelo de 12/11. O objeto aqui
 * não é "um acorde" — é **um acorde num voicing**, e esse gerador não existia: `buildChord` fazia
 * posição fundamental e inversão por rotação. Somado a isso, a habilidade é outra (achar a
 * fundamental ouvindo ≠ reconhecer a cor) e o `ouvido-acorde` é legado, está fixado em duas rotinas
 * e já tinha 25 opções declaradas.
 *
 * O motor nasceu **compartilhado** (`theory/voicings.ts`) porque ele pediu: *"com esse novo motor,
 * podemos pensar em expandir o acordes de ouvido também, pra abranger esses voicings"*. Quando essa
 * expansão vier, não haverá motor duplicado.
 *
 * ## A tarefa é SÓ a fundamental
 *
 * Correção dele sobre uma suposição minha: eu havia proposto que, sem o nome do acorde na tela, a
 * tarefa passasse a incluir descobrir a qualidade. Ele cortou — *"descobrir a qualidade já é o outro
 * exercício que já existe"*. Então mostrar o nome é **ajuda**, não mudança de pergunta: com o nome,
 * sabe-se a qualidade e procura-se a fundamental; sem ele, procura-se a fundamental às cegas.
 *
 * ## O que este exercício não mede
 *
 * O app não ouve. A conferência é autoavaliação (decisão 37), e o histórico grava `self_report` —
 * nunca medição. `requires` fica **sem** `voz` de propósito: audiar é interno, e declarar voz
 * esconderia o exercício no ônibus, que é onde ele mais serve.
 */
export const tonicaDeOuvido: CatalogItem = {
  id: 'tonica-de-ouvido',
  objetos: ['acordes', 'notas'], tarefas: ['ouvir', 'audiar'],
  primaryModule: 'perception.harmonic',
  skillTags: ['ear.chord_quality', 'ear.audiation'],
  contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions'],
  kind: 'serie', requires: {}, validation: ['self_report'], mobile: true,
  respeita: ['key'],
  publicacao: RASCUNHO,
  settings: ctx => [
    /**
     * **Quais famílias de acorde entram** — por família e não uma a uma, porque são 25 qualidades e
     * 25 chips numa tela de celular é um muro.
     */
    { id: 'familias', label: ctx.t('settings.types'), type: 'multi', justify: true, options: [
      { id: 'triades', label: ctx.t('settings.triads') },
      { id: 'tetrades', label: ctx.t('settings.tetrads') },
      { id: 'extensoes', label: ctx.t('settings.extensions') },
      { id: 'alterados', label: ctx.t('settings.altered') },
    ] },
    /**
     * **De qual grau do campo vem a fundamental.** Era o que ele quis dizer com "acordes de uma
     * tonalidade fixa": os graus do campo harmônico, não qualquer fundamental solta.
     */
    { id: 'graus', label: ctx.t('settings.whichDegrees'), type: 'multi', justify: true,
      options: [1, 2, 3, 4, 5, 6, 7].map(g => ({ id: String(g), label: String(g) })) },
    /**
     * **Sem a fundamental soando** — o degrau difícil, desligado por padrão.
     *
     * Num voicing de jazz a terça e a sétima definem o acorde e o baixista cobre a raiz. Achar uma
     * tônica que não está tocando é o que se faz tocando em grupo, e é outra habilidade.
     */
    { id: 'semFundamental', label: ctx.t('settings.withoutRoot'), type: 'toggle' },
    /**
     * **Soltar a qualidade da função do grau** — desligado por padrão, decisão dele em 15/11.
     *
     * Desligado, o acorde é **o do grau**: em dó maior o III é Mim7, e as extensões que a pessoa
     * pediu entram como enfeite daquele acorde (o V vira Sol7(♭9), que é onde a alteração de fato
     * aparece na música). Ligado, a fundamental continua vindo do grau mas a qualidade é sorteada
     * livremente — mais variedade, ao custo de acordes que aquela tonalidade não tem.
     *
     * Eu havia implementado só o ligado, e por descuido: em dó maior saía `Mim7(♭5)` no grau III, e
     * ele havia dito "quis dizer os graus do campo harmônico". O padrão agora é o que ele pediu.
     */
    { id: 'qualidadeLivre', label: ctx.t('settings.freeQuality'), type: 'toggle' },
    /** Mostrar o nome do acorde **antes** de responder. Padrão: mostrar (decisão dele). */
    { id: 'mostrarNome', label: ctx.t('settings.showChordName'), type: 'toggle' },
    /** Subir tudo para a faixa que um alto-falante de celular reproduz — ver `PISO_AUDIVEL`. */
    { id: 'somAudivel', label: ctx.t('settings.phoneSpeakerRange'), type: 'toggle' },
  ],
  defaults: {
    familias: ['tetrades'], graus: ['1', '2', '3', '4', '5', '6', '7'],
    semFundamental: false, qualidadeLivre: false, mostrarNome: true, somAudivel: false,
  },
  presets: [
    { id: 'tetrades', nome: 'presets.tonicaTetrades', settings: { familias: ['tetrades'], mostrarNome: true }, params: { key: { tonic: 0, mode: 'maior' } } },
    { id: 'triades', nome: 'presets.tonicaTriades', settings: { familias: ['triades'], mostrarNome: true }, params: { key: { tonic: 0, mode: 'maior' } } },
    { id: 'coloridos', nome: 'presets.tonicaColoridos', settings: { familias: ['extensoes', 'alterados'], mostrarNome: true }, params: { key: { tonic: 0, mode: 'maior' } } },
    { id: 'sem-raiz', nome: 'presets.tonicaSemRaiz', settings: { familias: ['tetrades', 'extensoes'], semFundamental: true, mostrarNome: false }, params: { key: { tonic: 0, mode: 'maior' } } },
  ],
  presentation: { gap: 0.6, dur: 2.4 },
  problema(s, ctx) {
    if (!qualidades(s).length) return ctx.t('player.tonicaSemFamilia');
    if (!grausEscolhidos(s).length) return ctx.t('player.tonicaSemGrau');
    // Tríade sem fundamental não existe (sobram duas notas), e o gerador recusa — então o item avisa.
    if (s.semFundamental === true && qualidades(s).every(q => (TRIADS as string[]).includes(q))) {
      return ctx.t('player.tonicaTriadeSemRaiz');
    }
    return null;
  },
  make(s, ctx): Question {
    const fams = arr(s.familias as never, ['tetrades']);
    // Tríades só se a pessoa pediu tríades e nada mais: pedir tétrade manda no campo.
    const soTriades = fams.length === 1 && fams[0] === 'triades';
    const campo = harmonicField(notaGrafada(ctx, (3 + 1) * 12 + pcDaTonica(ctx)), modoDoCampo(ctx), !soTriades, ctx.conv);
    const grau = campo[pick(grausEscolhidos(s)) - 1] ?? campo[0];
    const qualidade = s.qualidadeLivre === true ? pick(qualidades(s)) : qualidadeDoGrau(grau.chord, fams);
    const escolhidos = voicingsDe(grau.root, qualidade, {
      semFundamental: s.semFundamental === true,
      ...(s.somAudivel === true ? { piso: 60, teto: 96 } : {}),
    });
    const voicing: Voicing | null = escolhidos.length ? escolhidos[randInt(0, escolhidos.length - 1)] : null;
    const notas = voicing?.todas ?? [];
    const cifra = chordSymbol(grau.root, qualidade, ctx.conv);
    const tonica = noteName(grau.root, ctx.naming);
    return {
      /**
       * **A cifra vai no enunciado**, não no visual.
       *
       * `Visual.text` só muda a classe do prompt no Player — o conteúdo dele nunca é renderizado, e
       * vários itens passam `text: ''` como "visual vazio". Descobri isso conferindo a tela, e a
       * cifra no enunciado é melhor de qualquer forma: ela é parte da pergunta ("a fundamental de
       * Dm7"), não uma ilustração.
       */
      prompt: s.mostrarNome === true
        ? ctx.t('quiz.tonicaPromptCom', { chord: cifra })
        : ctx.t('quiz.tonicaPrompt'),
      // O teclado NÃO é desenhado: ver as notas entregaria a fundamental de graça.
      visual: { kind: 'text', text: '' },
      surface: { kind: 'autoavaliacao' },
      expected: { kind: 'option', id: 'facil' },
      sound: {
        groups: [notas.map(midi)],
        partes: [
          { id: 'acorde', label: ctx.t('quiz.partChord'), groups: [notas.map(midi)] },
          // A tônica é o gabarito: ouvi-la é o que libera a autoavaliação.
          { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [[alturaDaTonica(notas, grau.root)]] },
        ],
      },
      autoplay: true,
      reveal: ctx.t('quiz.tonicaReveal', { chord: cifra, note: tonica }),
    };
  },
};

/**
 * **A qualidade do acorde daquele grau**, enfeitada se a pessoa pediu extensões ou alterações.
 *
 * O acorde do grau vem do campo (`harmonicField`), e `comMesmoNucleo` diz quais qualidades são o
 * mesmo acorde com nona, décima terceira ou alteração — um fato calculado do motor, não uma tabela.
 * Então o V de dó maior (Sol7) pode sair Sol7(♭9), e o III (Mim7) pode sair Mim7(9): a função não
 * muda, a cor muda.
 *
 * Graus que não têm enfeite na família pedida ficam como são. `dim7` é o caso: nenhuma das doze
 * qualidades novas tem o núcleo dele, e inventar uma seria conteúdo que ninguém revisou.
 */
function qualidadeDoGrau(base: ChordId, familias: readonly string[]): ChordId {
  const permitidas: ChordId[] = [
    ...(familias.includes('extensoes') ? EXTENSOES : []),
    ...(familias.includes('alterados') ? ALTERADOS : []),
  ];
  const enfeites = comMesmoNucleo(base).filter(id => permitidas.includes(id));
  // A base continua no sorteio: pedir extensões não quer dizer que todo acorde venha enfeitado.
  return pick([base, ...enfeites]);
}

/** As qualidades em jogo, somando as famílias que a pessoa marcou. */
function qualidades(s: Record<string, unknown>): ChordId[] {
  const fams = arr(s.familias as never, ['tetrades']);
  const out: ChordId[] = [];
  if (fams.includes('triades')) out.push(...TRIADS);
  if (fams.includes('tetrades')) out.push(...SEVENTHS);
  if (fams.includes('extensoes')) out.push(...EXTENSOES);
  if (fams.includes('alterados')) out.push(...ALTERADOS);
  return out;
}

const grausEscolhidos = (s: Record<string, unknown>): number[] =>
  arr(s.graus as never, ['1', '2', '3', '4', '5', '6', '7']).map(Number).filter(g => g >= 1 && g <= 7);

/** A tônica do campo: a da tonalidade, ou uma sorteada e mantida (como no `mapa-do-braco`). */
function pcDaTonica(ctx: Ctx): number {
  const k = tonalidade(ctx);
  if (k) return mod(k.tonic, 12);
  const guardada = SORTEADA.get(ctx.params.instrument);
  if (guardada !== undefined) return guardada;
  const p = randInt(0, 11);
  SORTEADA.set(ctx.params.instrument, p);
  return p;
}
const SORTEADA = new Map<string, number>();

const modoDoCampo = (ctx: Ctx) => (tonalidade(ctx)?.mode === 'menor' ? 'menor' as const : 'maior' as const);

/**
 * A altura em que o gabarito da tônica soa: a classe da fundamental, **uma oitava acima da nota mais
 * grave** do voicing.
 *
 * Não é a fundamental na oitava dela por duas razões: com `semFundamental` ela não está no acorde, e
 * a pessoa cantou numa oitava confortável, não na do baixo. Acima do grave é onde a voz mora.
 */
function alturaDaTonica(notas: readonly Note[], root: Note): number {
  const pc = mod(midi({ ...root, oct: 4 }), 12);
  const base = notas.length ? midi(notas[0]) : 60;
  let m = base + 12;
  while (mod(m, 12) !== pc) m += 1;
  return m;
}
