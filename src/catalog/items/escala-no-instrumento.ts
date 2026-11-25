import {
  ALL_SCALES, FRETS, INST, arr, assinaturaDaEscala, buildScale, faixaQueCabe, fretRange, midi, notaGrafada, noteName,
  optionsWith, pcPermitido, pick, plain, regiao, scaleName, shuffle, tuningOf, vozDoBraco,
} from '../helpers';
import type { MessageKey, Note, Question, ScaleId } from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem, Surface } from '../types';
import type { FretMark } from '../../components/music/Fretboard';
import { mod } from '../../theory/core';

/**
 * **Escala no instrumento** — o irmão que faltava na família das superfícies.
 *
 * Nota e acorde já existem dos dois lados desde a reorganização de 09/11: `nota-na-pauta` e
 * `nota-no-instrumento`, `acorde-na-pauta` e `acorde-no-instrumento`. A escala só tinha a metade da
 * pauta (`pauta-escala`), e o pedido dele em *Mapear o piano* era exatamente a outra:
 *
 * > Desenho das escalas no piano. Ver um desenho de escala e dizer qual é. Oposto: ler o nome de
 * > uma escala e selecionar todas as notas no piano. Interface: poder ouvir a escala.
 *
 * O nome é dele (20/11), e o id segue a convenção dos irmãos.
 *
 * ## A tônica é marcada, e isso não é enfeite
 *
 * Um desenho de escala **sem tônica é ambíguo**: dó maior e ré dórico acendem exatamente as mesmas
 * teclas. Com a tônica numa cor própria, o par (tônica, tipo) é único — é o mesmo cuidado que o
 * `ouvido-acorde` tem com material que divide classes de altura.
 *
 * ## Todas as alternativas partem da MESMA tônica
 *
 * Copiado do `pauta-escala`, e pelo defeito que ele relatou lá em 12/11: com tônicas diferentes nos
 * nomes, ler a primeira nota descartava metade das opções sem saber escala nenhuma.
 *
 * ## Desenhar é só no piano, e isso é o desenho dele
 *
 * No braço, marcar "todas as notas da escala na região" seriam vinte e tantos cliques, e escolher
 * **uma** digitação exigiria um motor de digitação de escala que não existe (o `digitacoes.ts` é de
 * acorde e arpejo). O documento dele pede o oposto no piano, e é lá que ele fica — no braço o item
 * só identifica. Quando houver motor de digitação, a direção abre para o braço sem mudar o resto.
 */
export const escalaNoInstrumento: CatalogItem = {
  id: 'escala-no-instrumento',
  objetos: ['escalas'], tarefas: ['nomear', 'tocar'],
  primaryModule: 'instrumento',
  // Reaproveita as etiquetas que existem, de propósito: taxonomia é decisão dele, e `escala
  // desenhada` cabe em "reconhecer uma escala escrita" e em "achar as teclas de uma nota dada".
  skillTags: ['theory.scale_identification', 'keyboard.note_finding', 'fretboard.note_finding'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues',
    'instrument.keyboard', 'instrument.guitar'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'material', 'range'],
  publicacao: RASCUNHO,
  settings: ctx => [
    // Piano entra junto dos dois braços: aqui ele é um instrumento como os outros, e é **onde o
    // pedido dele nasceu**.
    { ...INST(ctx), options: [...(INST(ctx).options ?? []), { id: 'piano', label: ctx.t('settings.instrumentPiano') }] },
    /**
     * **Ver e nomear, ou ler e desenhar** — as duas direções que ele descreveu. Desenhar só aparece
     * no piano; ver o comentário do item.
     */
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', quando: s => s.instrumento === 'piano',
      options: [
        { id: 'identificar', label: ctx.t('scaleOnInstrument.nameIt') },
        { id: 'desenhar', label: ctx.t('scaleOnInstrument.drawIt') },
      ] },
    { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    { ...FRETS(ctx), quando: s => s.instrumento !== 'piano' },
  ],
  defaults: { direcao: 'identificar', tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'], casas: '0-12' },
  // O instrumento começa no do perfil, como nos irmãos — e o piano é um valor como os outros.
  defaultsDo: ctx => ({ instrumento: ctx.params.instrument === 'piano' ? 'piano' : (ctx.params.instrument === 'baixo' ? 'baixo' : 'violao') }),
  presets: [
    { id: 'no-piano', nome: 'presets.escalaNoPiano', settings: { instrumento: 'piano', direcao: 'identificar', tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] } },
    { id: 'desenhar-no-piano', nome: 'presets.escalaDesenhar', settings: { instrumento: 'piano', direcao: 'desenhar', tipos: ['maior', 'menor'] } },
    { id: 'modos-no-piano', nome: 'presets.escalasModos', settings: { instrumento: 'piano', direcao: 'identificar', tipos: ['dorico', 'frigio', 'lidio', 'mixolidio', 'locrio'] } },
    { id: 'no-braco', nome: 'presets.escalaNoBraco', settings: { direcao: 'identificar', tipos: ['maior', 'menor', 'penta-maior', 'penta-menor', 'blues'], casas: '0-5' } },
  ],
  presentation: { gap: 0.32 },
  make(s, ctx): Question {
    const tipos = arr(s.tipos, ['maior']) as ScaleId[];
    const tipo = pick(tipos);
    const noPiano = s.instrumento === 'piano';
    const desenhar = noPiano && s.direcao === 'desenhar';

    /**
     * A tônica, grafada pela tonalidade em vigor — a mesma regra do `pauta-escala` — e **dentro da
     * região**, com uma oitava de folga no teto para a escala inteira caber. Nasceu em `60 + pc`,
     * cravado, e o guarda de região pegou na primeira rodada: com a região começando em 66, a
     * escala soava abaixo do piso que a pessoa pediu.
     */
    const { lo, hi } = regiao(ctx);
    /**
     * A tônica é a primeira ocorrência da classe **a partir do piso** — nunca abaixo dele. A escala
     * pode passar do teto em até uma oitava, e isso é a regra escrita no próprio guarda de região:
     * *"o teto é o da fundamental, não o da última nota"*.
     *
     * Tentei primeiro descontar a oitava do teto para a escala inteira caber, e foi pior: numa
     * região de doze semitons (a que o teste usa) a conta empurrava a tônica para **abaixo do
     * piso** — 43 numa região que começa em 54.
     */
    let alturaDaTonica = lo + mod(pcPermitido(ctx) - lo, 12);
    if (alturaDaTonica > hi) alturaDaTonica -= 12;
    const tonica: Note = notaGrafada(ctx, alturaDaTonica);
    const notas = [...buildScale(tonica, tipo), { ...tonica, oct: tonica.oct + 1 }];
    const midis = notas.map(midi);
    const pcs = [...new Set(midis.map(m => mod(m, 12)))];
    const nome = (t: Note, id: ScaleId) =>
      ctx.t('quiz.scaleOf', { note: noteName(t, ctx.naming), scale: ctx.t(`theory.scalesInline.${id}` as MessageKey) });
    const certa = nome(tonica, tipo);

    /**
     * Desenhando: o enunciado diz a escala, e a resposta é o **contorno** das notas — em qualquer
     * ordem de clique e em qualquer oitava, desde que todas deslocadas juntas (a regra do §4).
     */
    if (desenhar) {
      return {
        prompt: ctx.t('scaleOnInstrument.drawPrompt', { scale: certa }),
        visual: { kind: 'ear' },
        surface: { kind: 'keyboard', ...faixaQueCabe(midis), quantas: midis.length },
        expected: { kind: 'contorno', midis, ordenada: false },
        // Ouvir a escala é escolha de quem responde: ela não toca sozinha, ou o exercício viraria
        // ditado. É o *"poder ouvir a escala"* do rascunho dele.
        sound: { groups: midis.map(m => [m]) }, autoplay: false,
        reveal: certa,
      };
    }

    /**
     * Identificando: o desenho aparece, e a pergunta é que escala é. A tônica sai numa cor própria
     * — sem ela, dó maior e ré dórico são a mesma figura.
     */
    /** No piano não há afinação, e pedir uma devolvia `undefined` — o braço só se monta no braço. */
    const tuning = noPiano ? [] : tuningOf(s, ctx);
    const [de, ate] = fretRange(s);
    const marcasNoBraco: FretMark[] = [];
    for (let corda = 0; corda < tuning.length; corda++) {
      for (let casa = de; casa <= ate; casa++) {
        const m = tuning[corda] + casa;
        if (!pcs.includes(mod(m, 12))) continue;
        marcasNoBraco.push({ s: corda, f: casa, color: mod(m, 12) === mod(midi(tonica), 12) ? 'var(--mu)' : 'var(--line)' });
      }
    }
    const visual: Question['visual'] = noPiano
      ? { kind: 'keyboard', ...faixaQueCabe(midis), marks: midis.slice(0, -1), rotulos: { [midi(tonica)]: '1' } }
      : { kind: 'fretboard', tuning, from: de, to: ate, marks: marcasNoBraco };

    /**
     * **Distrator com o mesmo desenho é pergunta sem resposta** — e existe um par assim: as duas
     * melódicas **sobem iguais**, e a diferença delas é na descida, que um desenho não tem. Achado
     * por teste em 20/11, antes de ir para a tela.
     */
    const vistas = new Set([assinaturaDaEscala(tonica, tipo)]);
    /** Um desenho por alternativa: o primeiro de cada assinatura entra, os empatados ficam fora. */
    const inedita = (t: ScaleId) => {
      const a = assinaturaDaEscala(tonica, t);
      if (vistas.has(a)) return false;
      vistas.add(a);
      return true;
    };
    const outros = shuffle([
      ...tipos.filter(t => t !== tipo),
      ...ALL_SCALES.filter(t => t !== tipo && !tipos.includes(t)),
    ]).filter(inedita);
    const pool = [...new Set([certa, ...outros.slice(0, 5).map(t => nome(tonica, t))])];
    const superficie: Surface = { kind: 'choices', options: optionsWith(certa, pool, 6).map(plain), wide: true };
    return {
      prompt: ctx.t('quiz.whatScale'), visual,
      surface: superficie, expected: { kind: 'option', id: certa },
      // No braço o som é do braço, como em todo item de braço (queixa dele em 13/11).
      sound: { groups: midis.map(m => [m]), instrument: noPiano ? undefined : vozDoBraco(tuning) },
      autoplay: false, reveal: certa,
    };
  },
};
