import {
  ALL_SCALES, FRETS, INST, arr, assinaturaDaEscala, buildScale, faixaQueCabe, fretRange, midi, notaGrafada, noteName,
  optionsWith, ordinal, pcPermitido, pick, plain, regiao, scaleName, shuffle, tuningOf, vozDoBraco,
} from '../helpers';
import type { MessageKey, Note, Question, ScaleId } from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem, Ctx, SettingValue, Surface } from '../types';
import type { FretMark } from '../../components/music/Fretboard';
import { mod } from '../../theory/core';
import { digitacoesDaEscala } from '../../theory/digitacao-de-escala';
import { getModo, notasDoModo } from '../../theory/digitacoes';
import type { FamiliaBase } from '../../theory/digitacoes';

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
/** As três famílias que o exercício de digitação oferece. A menor natural é o 6º grau da maior. */
const FAMILIAS: [FamiliaBase, MessageKey][] = [
  ['maior', 'scaleOnInstrument.family_maior'],
  ['menor-harmonica', 'scaleOnInstrument.familyHarmonica'],
  ['menor-melodica-jazz', 'scaleOnInstrument.familyMelodica'],
];
const NOME_DA_FAMILIA = (f: FamiliaBase): MessageKey =>
  (FAMILIAS.find(([id]) => id === f)?.[1] ?? 'scaleOnInstrument.family_maior');

/**
 * **Monte uma digitação deste modo no braço** — o exercício que ele desenhou em 25/11 para decorar
 * os modos no braço do baixo só com o celular.
 *
 * O enunciado pede o modo **pelo grau** (*"o 2º modo da escala maior"*), que foi a decisão dele: é
 * o que o exercício treina, funciona igual nas três famílias, e evita batizar os vinte e um modos.
 * O nome tradicional, quando existe, aparece na revelação.
 *
 * O braço vem **alto** e com a tônica desenhada como apoio: sem ela a pergunta seria "monte um
 * modo em algum lugar", e o que se decora é o desenho A PARTIR da tônica.
 */
function montarDigitacao(s: Record<string, SettingValue>, ctx: Ctx): Question {
  const possiveis = FAMILIAS.map(([id]) => id);
  const familias = (arr(s.familia, ['maior']) as FamiliaBase[]).filter(f => possiveis.includes(f));
  const familia = pick(familias.length ? familias : possiveis);
  const graus = arr(s.graus, ['1']).map(Number).filter(g => g >= 1 && g <= 7);
  const grau = pick(graus.length ? graus : [1]);
  const tuning = tuningOf(s, ctx);
  const maxVaoCasas = Number(s.vao ?? 4);
  const desenhos = Math.min(5, Math.max(1, Number(s.desenhos ?? 1)));
  /** Sete graus, mais a tônica de cima quando o desenho fecha na oitava. */
  const porDesenho = s.oitava === false ? 7 : 8;
  const [, ate] = fretRange(s);

  /**
   * A tônica do modo sai das classes permitidas, e **tem de ter digitação no braço** — numa região
   * curta com vão apertado, nem toda tônica tem. Procurar antes de perguntar é a decisão 13 por
   * dentro: em vez de recusar a configuração, o sorteio escolhe uma tônica que funciona.
   */
  const candidatas = shuffle([...Array(12).keys()].map(k => mod(pcPermitido(ctx) + k, 12)));
  let tonica: Note = notaGrafada(ctx, 48 + candidatas[0]);
  let exemplos: ReturnType<typeof digitacoesDaEscala> = [];
  for (const pcAlvo of candidatas) {
    const tentativa = notaGrafada(ctx, 48 + pcAlvo);
    const achadas = digitacoesDaEscala({ tonica: tentativa, familia, grau, tuning, maxCasa: ate, maxVaoCasas, limite: 60 });
    // **Desenhos SUFICIENTES**, e não "pelo menos um": pedindo três digitações diferentes, uma
    // tônica que só tem duas naquela região é uma pergunta sem resposta. Medido na tela em 25/11 —
    // com as casas 0–5 existe **um** desenho, e o botão de sugestão se esgotava no segundo toque.
    if (achadas.length >= desenhos) { tonica = tentativa; exemplos = achadas; break; }
  }

  const nota = noteName(tonica, ctx.naming);
  /**
   * **A grafia do modo**, classe por classe — pedido dele em 25/11: *"em escalas como a de fá
   * sustenido, seria necessário que todas as notas digitadas seguissem a enarmonia"*.
   *
   * As notas já vêm grafadas de `notasDoModo` — é a teoria que manda, não uma tabela de
   * sustenidos: em fá♯ maior a sétima é **Mi♯**, e numa escala de bemóis o Sol♭ não vira Fá♯.
   */
  const notasDoGrau = notasDoModo(getModo(tonica, familia, grau));
  const grafia = Object.fromEntries(notasDoGrau.map(n => [mod(midi(n), 12), noteName(n, ctx.naming)]));
  /** As alturas que soam, subindo da tônica até a oitava — a escala como ela se toca. */
  const alturasQueSoam = [...notasDoGrau.map(midi), midi(notasDoGrau[0]) + 12];
  const familiaEscrita = ctx.t(NOME_DA_FAMILIA(familia));
  const tradicional = NOME_TRADICIONAL[`${familia}:${grau}`];
  return {
    // O ordinal vem da convenção do idioma: `4º` em português, `4th` em inglês. Era `${grau}º`
    // cravado, e saía "mode 4º" na tela inglesa.
    prompt: desenhos > 1
      ? ctx.t('scaleOnInstrument.buildManyPrompt', { n: String(desenhos), degree: ordinal(grau, ctx.conv), family: familiaEscrita, note: nota })
      : ctx.t('scaleOnInstrument.buildPrompt', { degree: ordinal(grau, ctx.conv), family: familiaEscrita, note: nota }),
    visual: { kind: 'text', text: '' },
    surface: {
      kind: 'fretboard', tuning, from: 0, to: ate, quantas: porDesenho * desenhos, alto: true, foco: true, semRepetir: true,
      // A tônica aparece como apoio: o desenho que se decora parte dela.
      apoio: { midis: exemplos.length ? [tuning[exemplos[0][0].corda] + exemplos[0][0].casa] : [] },
    },
    expected: { kind: 'digitacao', tonica, familia, grau, tuning, maxVaoCasas, desenhos },
    // Acertando, a tela espera: há o botão de ver um desenho que você não fez.
    aguardaDepois: true,
    grafia,
    // Ouvir é escolha: a escala soa no botão, nunca sozinha — senão a pergunta vira ditado.
    /**
     * ⚠️ **O som sobe sempre** — e não subia.
     *
     * Ele tocava `48 + classe de altura`, e classe de altura **dá a volta**: num modo que começa em
     * Lá, o Dó da terceira nota é a classe 0, e `48 + 0` cai abaixo do Lá que acabou de soar. Ele
     * relatou ouvindo: *"elas começam mais agudas, como esperado pra soar bem, mas aí voltam a ser
     * mais graves depois de subir um pouco, no meio da escala"*.
     *
     * Agora as alturas saem das NOTAS do modo, que já sobem, mais a oitava de cima fechando — é a
     * escala como ela se toca, e é o que a pessoa está tentando montar no braço.
     */
    sound: { groups: alturasQueSoam.map(m => [m]), instrument: vozDoBraco(tuning) },
    autoplay: false,
    reveal: tradicional ? `${nota} — ${ctx.t(tradicional)}` : `${ordinal(grau, ctx.conv)} · ${nota} ${familiaEscrita}`,
  };
}

/** Os modos que têm nome de uso corrente. Os outros se dizem pelo grau, e está certo assim. */
const NOME_TRADICIONAL: Record<string, MessageKey | undefined> = {
  'maior:2': 'scaleOnInstrument.mode_dorico',
  'maior:3': 'scaleOnInstrument.mode_frigio',
  'maior:4': 'scaleOnInstrument.mode_lidio',
  'maior:5': 'scaleOnInstrument.mode_mixolidio',
  'maior:6': 'scaleOnInstrument.mode_eolio',
  'maior:7': 'scaleOnInstrument.mode_locrio',
  'menor-harmonica:5': 'scaleOnInstrument.mode_frigioDominante',
  'menor-melodica-jazz:4': 'scaleOnInstrument.mode_lidioDominante',
  'menor-melodica-jazz:7': 'scaleOnInstrument.mode_superlocrio',
};

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
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'identificar', label: ctx.t('scaleOnInstrument.nameIt') },
      { id: 'desenhar', label: ctx.t('scaleOnInstrument.drawIt') },
    ] },
    /**
     * **No braço, desenhar é MONTAR UMA DIGITAÇÃO** — o exercício que ele desenhou em 25/11, para
     * decorar os modos no braço do baixo só com o celular. A família e o grau substituem a lista de
     * escalas: o enunciado vira *"o 2º modo da escala maior"*, que é o que ele pediu, e é também o
     * que faz as menores entrarem sem precisar de nome para cada modo (decisão dele na Q3).
     */
    { id: 'familia', label: ctx.t('scaleOnInstrument.family'), type: 'multi', justify: true,
      quando: s => s.instrumento !== 'piano' && s.direcao === 'desenhar',
      options: FAMILIAS.map(([id, rotulo]) => ({ id, label: ctx.t(rotulo) })) },
    { id: 'graus', label: ctx.t('scaleOnInstrument.degrees'), type: 'multi', justify: true,
      quando: s => s.instrumento !== 'piano' && s.direcao === 'desenhar',
      options: ['1', '2', '3', '4', '5', '6', '7'].map(g => ({ id: g, label: `${g}º` })) },
    /**
     * **Quantos desenhos diferentes na mesma rodada** (decisão dele na Q2, que pediu até cinco):
     * *"seria legal pedir pro usuário escrever diversas digitações pra mesma escala. isso ajuda a
     * sair do shape"*.
     *
     * Eles chegam numa pergunta só, em sequência: cada sete posições formam um desenho, e a
     * conferência exige que todos sejam válidos **e diferentes entre si**.
     */
    { id: 'desenhos', label: ctx.t('scaleOnInstrument.howMany'), type: 'single',
      quando: s => s.instrumento !== 'piano' && s.direcao === 'desenhar',
      options: ['1', '2', '3', '4', '5'].map(n => ({ id: n, label: n })) },
    /**
     * **Fechar na oitava** — defeito que ele relatou em 25/11: *"está considerando que errei quando
     * adiciono a oitava, só aceita se eu for até a sétima"*. Uma digitação de escala vai da tônica
     * à tônica, e é assim que se toca. Ligado por padrão.
     *
     * É controle, e não só tolerância no juiz, porque a superfície precisa saber **quantos toques**
     * esperar: pedindo dois desenhos, ela divide as posições em dois grupos iguais.
     */
    { id: 'oitava', label: ctx.t('scaleOnInstrument.octave'), type: 'toggle',
      quando: s => s.instrumento !== 'piano' && s.direcao === 'desenhar' },
    { id: 'vao', label: ctx.t('scaleOnInstrument.span'), type: 'single',
      quando: s => s.instrumento !== 'piano' && s.direcao === 'desenhar',
      options: ['3', '4', '5'].map(n => ({ id: n, label: ctx.t('scaleOnInstrument.spanFrets', { n }) })) },
    { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    { ...FRETS(ctx), quando: s => s.instrumento !== 'piano' },
  ],
  defaults: { direcao: 'identificar', tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'], casas: '0-12',
    familia: ['maior'], graus: ['1', '2', '3', '4', '5', '6', '7'], vao: '4', desenhos: '1', oitava: true },
  // O instrumento começa no do perfil, como nos irmãos — e o piano é um valor como os outros.
  defaultsDo: ctx => ({ instrumento: ctx.params.instrument === 'piano' ? 'piano' : (ctx.params.instrument === 'baixo' ? 'baixo' : 'violao') }),
  presets: [
    { id: 'no-piano', nome: 'presets.escalaNoPiano', settings: { instrumento: 'piano', direcao: 'identificar', tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] } },
    { id: 'desenhar-no-piano', nome: 'presets.escalaDesenhar', settings: { instrumento: 'piano', direcao: 'desenhar', tipos: ['maior', 'menor'] } },
    { id: 'modos-no-piano', nome: 'presets.escalasModos', settings: { instrumento: 'piano', direcao: 'identificar', tipos: ['dorico', 'frigio', 'lidio', 'mixolidio', 'locrio'] } },
    { id: 'no-braco', nome: 'presets.escalaNoBraco', settings: { direcao: 'identificar', tipos: ['maior', 'menor', 'penta-maior', 'penta-menor', 'blues'], casas: '0-5' } },
  ],
  presentation: { gap: 0.32 },
  /**
   * **Região curta não dá desenho para todo mundo.** Com as casas 0–5 e vão de 4, um modo costuma
   * ter UM desenho; pedir três diferentes ali é pedir o impossível. Recusar e explicar é a decisão
   * 13 — e a saída é da pessoa: abrir as casas, alargar o vão, ou pedir menos desenhos.
   */
  problema(s, ctx) {
    if (s.instrumento === 'piano' || s.direcao !== 'desenhar') return null;
    const desenhos = Math.min(5, Math.max(1, Number(s.desenhos ?? 1)));
    if (desenhos < 2) return null;
    const familias = FAMILIAS.map(([id]) => id).filter(f => arr(s.familia, ['maior']).includes(f));
    const graus = arr(s.graus, ['1']).map(Number).filter(g => g >= 1 && g <= 7);
    const tuning = tuningOf(s, ctx);
    const [, ate] = fretRange(s);
    const maxVaoCasas = Number(s.vao ?? 4);
    for (const familia of familias.length ? familias : ['maior' as FamiliaBase]) {
      for (const grau of graus.length ? graus : [1]) {
        for (let pcAlvo = 0; pcAlvo < 12; pcAlvo++) {
          const achadas = digitacoesDaEscala({ tonica: notaGrafada(ctx, 48 + pcAlvo), familia, grau, tuning, maxCasa: ate, maxVaoCasas, limite: 60 });
          if (achadas.length >= desenhos) return null;
        }
      }
    }
    return ctx.t('scaleOnInstrument.semDesenhos', { n: String(desenhos) });
  },
  make(s, ctx): Question {
    // No braço, desenhar é montar uma digitação — outro gerador, outra conferência.
    if (s.instrumento !== 'piano' && s.direcao === 'desenhar') return montarDigitacao(s, ctx);
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
