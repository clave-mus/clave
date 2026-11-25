import { ALL_CHORDS, INST, ROOTS, alturaDoPc, arr, buildChord, chordOptions, chordSymbol, chordTypes, faixaDoBraco, faixaQueCabe, fretRange, guitarChordQuestion, midi, mod, pcPermitido, pick, tuningOf, vozDoBraco } from '../helpers';
import { FRETS } from '../helpers';
import type { ChordId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem, Ctx, Question, SettingValue } from '../types';

/**
 * Acorde no instrumento: **identificar** o desenho, ou **audiar** o desenho.
 *
 * Metade de `que-acorde-e-esse` — as superfícies de teclado e braço. O porquê do eixo está em
 * `nota-na-pauta.ts`.
 *
 * ## O instrumento é configuração, com uma exceção
 *
 * Decisão do Paulo (09/11): o padrão é o instrumento do perfil, **ou o piano se o instrumento for
 * baixo**. Acorde de quatro notas num baixo de quatro cordas é exercício de outra coisa, e as formas
 * de violão que `theory/digitacoes.ts` gera não existem num baixo.
 *
 * ## No braço, o desenho vem do gerador
 *
 * Em 10/11 as 16 formas abertas e as 10 fórmulas de pestana escritas à mão saíram: o gerador produz
 * qualquer voicing, com extensão e inversão — 60 formas distintas em 60 sorteios, contra 26 à mão no
 * total. Ver `guitarChordQuestion`.
 */
/**
 * **Ler a cifra e desenhar o acorde** — a direção que ele pediu em 25/11.
 *
 * A conferência é o **contorno não ordenado**: as notas que formam o acorde, em qualquer ordem de
 * clique e em qualquer oitava, desde que todas deslocadas juntas. É a mesma regra do `ouvido-acorde`
 * desenhando, e pelo mesmo motivo — um dó maior uma oitava abaixo é um dó maior.
 *
 * No braço vem `foco` e `alto`: são três ou quatro toques certeiros num celular deitado, e a
 * moldura do app não cabe junto com o braço (a medida está em `useTela`).
 */
function desenharAcorde(s: Record<string, SettingValue>, ctx: Ctx, noPiano: boolean): Question {
  const types = arr(s.tipos, ['maior']) as ChordId[];
  const type = pick(types);
  const pcRaiz = pcPermitido(ctx);
  const base = alturaDoPc(ctx, pcRaiz, { lo: 48, hi: 72 });
  const root = { ...ROOTS[mod(pcRaiz, 12)], oct: Math.floor(base / 12) - 1 };
  const sym = chordSymbol(root, type, ctx.conv);
  const tuning = tuningOf(s, ctx);
  const [de, ate] = fretRange(s);
  /**
   * ⚠️ **O acorde tem de caber no braço desenhado**, e não só na região de prática.
   *
   * O guarda de varredura pegou na primeira rodada: um acorde montado sobre a região 48–72 chegava
   * a MIDI 80, e a casa 12 de um violão dá 76 — a pessoa teria de clicar onde não há casa. É a
   * mesma armadilha que `ouvido-acorde` e `ouvido-intervalo` já documentam, e a saída é a mesma:
   * desce o bloco inteiro por oitavas até ele caber.
   */
  const alcance = noPiano ? { lo: 0, hi: 127 } : faixaDoBraco(tuning, de, ate);
  let notas = buildChord(root, type).map(midi);
  while (Math.max(...notas) > alcance.hi && Math.min(...notas) - 12 >= alcance.lo) notas = notas.map(m => m - 12);
  while (Math.min(...notas) < alcance.lo && Math.max(...notas) + 12 <= alcance.hi) notas = notas.map(m => m + 12);
  return {
    prompt: ctx.t('chordOnInstrument.drawPrompt', { chord: sym }),
    visual: { kind: 'text', text: '' },
    surface: noPiano
      ? { kind: 'keyboard', ...faixaQueCabe(notas), quantas: notas.length }
      : { kind: 'fretboard', tuning, from: de, to: ate, quantas: notas.length, alto: true, foco: true },
    expected: { kind: 'contorno', midis: notas, ordenada: false },
    // Ouvir é escolha de quem responde: o acorde não toca sozinho, ou a leitura da cifra vira ditado.
    sound: { groups: [notas], instrument: noPiano ? undefined : vozDoBraco(tuning) },
    autoplay: false, reveal: sym,
  };
}

export const acordeNoInstrumento: CatalogItem = {
  id: 'acorde-no-instrumento',
  objetos: ['acordes'], tarefas: ['nomear', 'tocar'],
  primaryModule: 'instrumento',
  skillTags: ['theory.chord_identification', 'keyboard.chord_shapes', 'fretboard.chord_shapes'],
  contentTags: ['chord.triads', 'chord.sevenths', 'chord.inversions', 'chord.open_shapes', 'chord.barre_shapes', 'instrument.keyboard', 'instrument.guitar'],
  kind: 'serie', requires: {}, validation: ['deterministic', 'self_report'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **O seletor de direção saiu em 12/11.** Ele tinha dois valores, e o segundo era `audiar`, que
     * foi para a linha de ouvido (`ouvido-acorde`, estímulo `escrito`). Sobrou um valor só, e
     * seletor de um valor é interface morta — o teste `configuracoes-vivas` cobrou isso na hora.
     */
    /**
     * **Ver e nomear, ou ler e desenhar** — a segunda direção entrou em 25/11, a pedido dele:
     * *"pensei que já tivesse um exercício de desenhar o acorde no instrumento. crie isso"*.
     *
     * Ele tinha razão em esperar: desenhar acorde existia **de ouvido** (`ouvido-acorde`, resposta
     * `desenhar`), e não a partir do NOME. São coisas diferentes — ali o estímulo é som, aqui é a
     * cifra escrita, e quem lê cifra e acha a forma no braço está fazendo outro exercício.
     */
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'identificar', label: ctx.t('scaleOnInstrument.nameIt') },
      { id: 'desenhar', label: ctx.t('chordOnInstrument.drawIt') },
    ] },
    // Piano entra junto, e o baixo não: ver o comentário do item.
    { ...INST(ctx), options: [
      { id: 'violao', label: ctx.t('settings.guitar') },
      { id: 'piano', label: ctx.t('settings.instrumentPiano') },
    ] },
    { id: 'tipos', label: ctx.t('settings.types'), type: 'multi', justify: true, options: chordTypes(ctx.t, ALL_CHORDS) },
    { id: 'pergunta', label: ctx.t('settings.whatToAsk'), type: 'single', quando: s => s.instrumento !== 'piano',
      options: [{ id: 'acorde', label: ctx.t('settings.askChord') }, { id: 'baixo', label: ctx.t('settings.askBass') }] },
    { id: 'soltas', label: ctx.t('settings.openStrings'), type: 'toggle', quando: s => s.instrumento !== 'piano' },
    { ...FRETS(ctx), quando: s => s.instrumento !== 'piano' },
    // Pedido do Paulo em 12/11. É o MESMO toggle de `ouvido-acorde`, e vale a pena ser o mesmo:
    // arpejar antes é como se ouve um acorde desenhado, nota por nota, para depois ouvi-lo junto.
    { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true,
      present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
    /**
     * **A oitava de escuta NÃO entra aqui**, e o motivo é do próprio item: o baixo não é opção de
     * instrumento neste exercício (decisão dele em 09/11 — com perfil de baixo, o padrão é o
     * piano), então a condição seria inalcançável. Interface que nunca aparece é interface morta, e
     * há um teste que a cobra. Se o baixo entrar aqui algum dia, o parâmetro entra com ele.
     */
  ],
  defaults: { tipos: ['maior', 'menor', 'dim', 'aum'], direcao: 'identificar',
    pergunta: 'acorde', soltas: false, casas: '0-12', arpejo: false,
  },
  /**
   * O padrão é o instrumento do perfil, **ou o piano se o perfil for baixo** — a decisão dele de
   * 09/11, que está explicada no alto do arquivo. Era isto que o valor `auto` escondia; agora o
   * chip mostra "piano" para o baixista, que é a informação de que ele precisa.
   */
  defaultsDo: ctx => ({ instrumento: ctx.params.instrument === 'violao' ? 'violao' : 'piano' }),
  make(s, ctx) {
    /** `auto` com baixo cai no piano: as formas de violão não existem num baixo de quatro cordas. */
    const noPiano = s.instrumento === 'piano';
    if (s.direcao === 'desenhar') return desenharAcorde(s, ctx, noPiano);

    if (!noPiano) {
      // Chave por chave, nunca `{...s}`: há teste que proíbe espalhar, e com razão — espalhando não
      // há como saber quais configurações o item de fato lê, e o guarda de "toda configuração
      // oferecida muda alguma coisa" deixa de funcionar.
      const q = guitarChordQuestion({
        superficie: 'braco', tipos: s.tipos, pergunta: s.pergunta, soltas: s.soltas, casas: s.casas,
      }, ctx);
      return q;
    }

    const types = arr(s.tipos, ['maior']) as ChordId[];
    const type = pick(types);
    const pcRaiz = pcPermitido(ctx);
    const base = alturaDoPc(ctx, pcRaiz, { lo: 48, hi: 72 });
    const root = { ...ROOTS[mod(pcRaiz, 12)], oct: Math.floor(base / 12) - 1 };
    const notes = buildChord(root, type).map(midi).map(m => (m > 76 ? m - 12 : m));
    const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);

    return {
      prompt: ctx.t('quiz.whatChord'), visual: { kind: 'keyboard', lo: 48, hi: 83, marks: notes },
      surface: { kind: 'choices', options }, expected, sound: { groups: [notes] }, reveal: sym,
    };
  },
};
