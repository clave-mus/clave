// O que os itens do catálogo compartilham: configurações reaproveitadas, sorteio com contexto musical
// e os geradores de pergunta que servem a mais de um item.
//
// Existe porque `catalog.ts` tinha 946 linhas e quatro pessoas mexendo nele: todo PR tocava o mesmo
// arquivo e todo PR dava conflito (F1-5). Agora cada família mora em `items/<id>.ts` e o que é comum
// mora aqui.
//
// Os textos vêm de ctx.t (src/i18n): os fixos por chave e os de teoria montados com a gramática de
// cada idioma (src/theory/names.ts). As cifras seguem a convenção do idioma (ctx.conv).
import { buildChord, buildScale, chordSymbol, clefBottom, FLAT_ORDER, harmonicField, ALL_SCALE_IDS, majorTonic, midi, mod, note, noteName, optionsWith, pc, pcName, pick, randInt, relativeMinor, SCALES, scaleMidi, semisFor, SHARP_ORDER, shuffle, transpose, type ChordId, type Clef, type Direcao, type Note, type Quality, type ScaleId } from '../theory/core';
import { digitacoesDaReceita } from '../theory/digitacoes';
import { pcPermitido, regiao } from './contexto-musical';
import { accidentalCount, intervalName, ordinal, semitoneName } from '../theory/names';
import type { MessageKey } from '../i18n';
import type { Voice } from '../audio/engine';
import { TUNINGS } from '../components/music/Fretboard';
import type { ChoiceOption, Ctx, Expected, Question, Setting, SettingValue } from './types';
import { clave, GRAUS_DO_MATERIAL, pcsPermitidas } from './contexto-musical';

// Reexportado para o item declarar **um import só**. Sem isto, cada `items/<id>.ts` abriria com cinco
// linhas de import de quatro módulos, e a declaração — que é o que se lê — ficaria enterrada.
export {
  buildChord, buildScale, CHORDS, chordSymbol, clefBottom, FLAT_ORDER, harmonicField, ALL_SCALE_IDS, majorTonic, SHARP_ORDER,
  scaleDegreeLabels, midi, mod, note, noteName, optionsWith, pc, pcName, pcNameUm, pick, randInt, relativeMinor,
  TRIADS, SEVENTHS, EXTENSOES, ALTERADOS, comMesmoNucleo,
  SCALES, scaleDegs, scaleMidi, semisFor, shuffle, transpose,
} from '../theory/core';
export type { ChordId, Clef, Direcao, Note, Quality, ScaleId } from '../theory/core';
export { accidentalCount, intervalName, ordinal, semitoneName } from '../theory/names';
export { CELLS, RHYTHM_PRESETS, randomBars } from '../theory/rhythm';
export type { CellId } from '../theory/rhythm';
export { TUNINGS } from '../components/music/Fretboard';
export { alturaDoPc, alturaNaRegiao, clave, faixaDaClave, tonalidade, GRAUS_DO_MATERIAL, grauDoPc, grausDaTonalidade, nomeNaTonalidade, notaDaTonalidade, notaGrafada, pcsDosGraus, pcsEscolhidas, notaNaPauta, passosDaRegiao, pcPermitida, pcPermitido, pcsPermitidas, quintasDaTonalidade, regiao, tonicaGrafada, tonicaNaRegiao } from './contexto-musical';
export type { ChoiceOption, Ctx, Expected, Question, Setting, SettingValue } from './types';
export type { MessageKey } from '../i18n';

// ## As quatro fusões por superfície (decisões 16 e 53)
//
// Doze itens eram quatro perguntas repetidas em três superfícies. **A superfície é parâmetro, não
// exercício** — e o que prova que isto não é só arrumação é a validação: a mesma pergunta valida
// GRAFIA na pauta (Dó♯ ≠ Ré♭, porque a pauta distingue) e ALTURA no teclado e no braço (onde a
// tecla é a mesma). Três itens separados escondiam essa diferença atrás de três telas.
//
// Cada superfície traz as suas configurações, e as outras **somem** (`Setting.quando`). A extensão
// não se unifica, de propósito: `pauta / suplementares`, `1 / 2 oitavas` e faixas de casa são três
// unidades incomparáveis, e um parâmetro só precisaria de três listas de opções — o que é três
// parâmetros com um nome em comum.

export type S = Record<string, SettingValue>;
export const arr = (v: SettingValue | undefined, fallback: string[]) => (Array.isArray(v) && v.length ? v : fallback);

// ---------------- configurações reaproveitadas ----------------
// CLEFS, INST e as superfícies de resposta ficam SEM `tier` de propósito: não existe "clave de sol
// mais fácil que clave de fá" nem "violão mais fácil que baixo". Inventar ordem onde ela não existe
// é o erro que a decisão 9 proíbe.
export const CLEFS = ({ t }: Ctx): Setting => ({ id: 'claves', label: t('settings.clefs'), type: 'multi', options: [{ id: 'sol', label: t('settings.clefSol') }, { id: 'fa', label: t('settings.clefFa') }] });
export const EXT = ({ t }: Ctx): Setting => ({ id: 'extensao', label: t('settings.range'), type: 'single', options: [{ id: 'pauta', label: t('settings.rangeStaff'), tier: 1 }, { id: 'suplementares', label: t('settings.rangeLedger'), tier: 2 }] });
export const ACC = ({ t }: Ctx): Setting => ({ id: 'acidentes', label: t('settings.accidentals'), type: 'toggle' });
/**
 * O instrumento do braço. **Sem a opção "meu instrumento"** desde 14/11: o valor inicial vem do
 * perfil (`CatalogItem.defaultsDo`), e o chip mostra *violão* ou *baixo* — o que a pessoa precisa
 * saber. Um chip marcado "meu instrumento" não diz qual é, e era a crítica do Paulo.
 */
export const INST = ({ t }: Ctx): Setting => ({ id: 'instrumento', label: t('settings.instrument'), type: 'single', options: [
  { id: 'violao', label: t('settings.guitar') }, { id: 'baixo', label: t('settings.bass') }] });
/** O instrumento do perfil, reduzido ao que um item de braço aceita. */
export const bracoDoPerfil = (ctx: Ctx) => (ctx.params.instrument === 'baixo' ? 'baixo' : 'violao');
/**
 * A superfície padrão: o teclado para quem toca piano, o braço para os outros.
 *
 * **Uma função, dois chamadores** — `defaultsDo` (para o chip da tela mostrar o valor certo) e o
 * `make` (para quem chama o item sem passar pelo Player: testes, rotinas, links). Em 14/11 eu pus a
 * regra só no `defaultsDo` e dois testes caíram na hora: o `make` chamado direto perdia o perfil, e
 * o timbre do braço voltava a ser o do violão num perfil de baixo. Default estático que contradiz o
 * contexto é pior que default ausente.
 */
export const superficieDoPerfil = (ctx: Ctx) => (ctx.params.instrument === 'piano' ? 'teclado' : 'braco');
/**
 * **Restringir aos graus que a pessoa escolhe** — o `multi` que o rascunho do Paulo pede na Nota, na
 * Melodia e no Intervalo harmônico. Vazio é o padrão e quer dizer "sem restrição".
 *
 * **Grau, e não nome de nota** (decisão dele em 13/11): a lista segue o material, então com "só a
 * tonalidade" ela mostra os graus daquela tonalidade e nada mais — em dó maior sem ♭3, em dó menor
 * com ele. E a seleção sobrevive à troca de tonalidade, porque o id é a distância da tônica.
 *
 * É `podeVazio` porque vazio aqui é estado legítimo, não configuração pela metade.
 */
export const GRAUS_ESCOLHIDOS = (ctx: Ctx): Setting => ({
  id: 'grausEscolhidos', label: ctx.t('settings.onlyTheseDegrees'), type: 'multi', justify: true, podeVazio: true,
  options: GRAUS_DO_MATERIAL(ctx),
});

/**
 * **O timbre, como parâmetro de exercício** — declarado uma vez, usado por todo item de ouvido.
 *
 * Nasceu no `ouvido-intervalo` em 19/11, da pergunta do Paulo (*"será que podemos adicionar mais
 * timbres?"*), e virou compartilhado no mesmo dia quando ele pediu a varredura: *"revise todo o
 * catálogo e procure onde o piano novo pode entrar como timbre, onde pode ter timbres diferentes
 * como parâmetro"*. Seis itens pediam a mesma coisa, e seis cópias divergiriam no primeiro ajuste —
 * nesta mesma sessão eu recolhi cinco cópias de uma função de grafia.
 *
 * Três valores, e o do meio é o que a pergunta dele destravou:
 *
 * - **o do perfil**, que é o comportamento de sempre e segue sendo o padrão;
 * - **escolher um**, com os seis nomeados como no Perfil — a escolha existia, mas só lá, na casinha
 *   do "piano", onde ninguém a associaria a um exercício;
 * - **sorteado a cada pergunta**, que é a parte que treina: reconhecer o que se ouve independente do
 *   timbre é a habilidade que transfere para a música, e treinar sempre no mesmo som não treina isso.
 *
 * O item declara `...TIMBRE(ctx)` nas configurações, `...TIMBRE_DEFAULTS` nos padrões, e chama
 * `vozDaPergunta(s)` no `make` — que devolve a camada de `Question.presentation`, ou nada.
 */
export const VOZES: Voice[] = ['piano', 'limpo', 'pad', 'violao', 'baixo', 'orgao'];

/**
 * **Ver o que soou, ao conferir** — o controle compartilhado da revelação visual (26/11).
 *
 * Nasce compartilhado porque ele pediu nos três de uma vez: a Tônica primeiro, e logo *"seria legal
 * pôr a mesma coisa como opção em acordes de ouvido e graus do campo harmônico"*.
 *
 * Ligado por padrão: a revelação só aparece **depois** de responder, então ela não entrega nada —
 * e um padrão desligado faria o pedido chegar só a quem fosse procurá-lo no painel.
 */
export const VER_O_QUE_SOOU = (ctx: Ctx): Setting =>
  ({ id: 'verOQueSoou', label: ctx.t('settings.showWhatSounded'), type: 'toggle' });

/**
 * A faixa de teclado que mostra um punhado de notas: elas, **com uma terça de folga** para cada
 * lado (decisão dele em 26/11). A tecla vizinha é onde a confusão mora, e faixa fixa desperdiça
 * tela no celular.
 */
export const faixaDaRevelacao = (notas: readonly number[]) =>
  ({ lo: Math.min(...notas) - 4, hi: Math.max(...notas) + 4 });

export const TIMBRE = (ctx: Ctx): Setting[] => [
  { id: 'timbre', label: ctx.t('settings.timbre'), type: 'single', options: [
    { id: 'perfil', label: ctx.t('settings.timbreFromProfile') },
    { id: 'escolher', label: ctx.t('settings.timbreChoose') },
    { id: 'sorteado', label: ctx.t('settings.timbreRandom') },
  ] },
  // Pura apresentação: trocar o timbre escolhido não sorteia uma pergunta nova.
  { id: 'qualTimbre', label: ctx.t('settings.whichTimbre'), type: 'single', quando: s => s.timbre === 'escolher',
    soPresentation: true, present: v => ({ voice: String(v) as Voice }),
    options: VOZES.map(v => ({ id: v, label: ctx.t(`voices.${v}` as const) })) },
];

export const TIMBRE_DEFAULTS = { timbre: 'perfil', qualTimbre: 'piano' } as const;

/**
 * A camada de apresentação **da pergunta**: o timbre sorteado, ou nada.
 *
 * Sorteado é propriedade da pergunta, e não da configuração — as outras camadas valem para a rodada
 * inteira. Ver `Question.presentation`.
 *
 * `preservar` é para quando a voz **carrega informação**: um acorde desenhado no braço soa com a voz
 * do braço, e sortear apagaria isso (foi queixa dele em 13/11). Nos itens que respondem no braço, o
 * sorteio vale no teclado e na pauta, e o braço mantém a sua voz.
 */
export const vozDaPergunta = (s: Record<string, unknown>, preservar = false): { voice: Voice } | undefined =>
  (!preservar && s.timbre === 'sorteado' ? { voice: pick(VOZES) } : undefined);

/**
 * **A superfície em vigor é um braço de BAIXO?** — quem decide é o valor escolhido, e o perfil só
 * entra quando o valor é o genérico `braco`.
 */
export const emBracoDeBaixo = (ctx: Ctx, onde: unknown): boolean =>
  onde === 'baixo' || (onde === 'braco' && bracoDoPerfil(ctx) === 'baixo');

/**
 * **Ouvir uma ou duas oitavas acima**, onde a superfície é um braço de baixo.
 *
 * Pedido dele em 20/11: *"nos exercícios com superfície de baixo, sempre dê pra escolher ouvir as
 * notas uma ou duas oitavas acima"*. Um baixo de quatro cordas começa no Mi1 (MIDI 28): ali o fone
 * de celular quase não entrega a fundamental, e cantar de volta pede uma voz que a maioria não tem.
 *
 * É `soPresentation` e soma em `transpor`: **a nota continua sendo a que é**. A resposta é a posição
 * real no braço, o desenho mostra onde ela mora, e só a altura que chega ao ouvido muda. Era a única
 * forma de atender o pedido sem mentir sobre o que soou — transpor no gerador faria o exercício
 * pedir uma nota e aceitar outra.
 *
 * `quando` é do item: cada um sabe em que configuração a sua superfície é o braço do baixo.
 */
export const ESCUTA_ACIMA = (ctx: Ctx, quando: (s: Record<string, SettingValue>) => boolean): Setting[] => [
  { id: 'oitavaDeEscuta', label: ctx.t('settings.listenOctave'), type: 'single', quando,
    soPresentation: true, present: v => ({ transpor: Number(v) * 12 }),
    options: [
      { id: '0', label: ctx.t('settings.listenAsIs') },
      { id: '1', label: ctx.t('settings.listenOctaveUp') },
      { id: '2', label: ctx.t('settings.listenTwoOctavesUp') },
    ] },
];

export const ESCUTA_DEFAULTS = { oitavaDeEscuta: '0' } as const;

export const FRETS = ({ t }: Ctx): Setting => ({ id: 'casas', label: t('settings.frets'), type: 'single', options: [
  { id: '0-5', label: t('settings.frets05'), tier: 1 }, { id: '5-9', label: t('settings.frets59'), tier: 2 }, { id: '0-12', label: t('settings.frets012'), tier: 3 }] });
/** Direção de percurso. Entra em todo item que toca uma escala ou um arpejo (decisão 70). */
// ---------------- a fusão por superfície, e por que ela não existe mais ----------------
//
// `SUP` e `porSuperficie` moravam aqui: montavam o seletor de superfície e as configurações que
// apareciam e desapareciam com ele. Saíram em 10/11/2026, **sem chamador nenhum**, quando a
// reorganização terminou de trocar o eixo do catálogo.
//
// O que elas resolviam era um problema que deixou de existir: doze itens eram quatro perguntas
// repetidas em três superfícies, e a fusão de 2026 as juntou com a superfície como parâmetro. O
// Paulo viu que estava invertido — a validação, a extensão e as habilidades mudam com a
// SUPERFÍCIE, e não com a direção —, e agora são seis itens, um por superfície, com a direção
// como parâmetro. Ninguém mais precisa esconder configuração de ninguém com `Setting.quando`.
//
// Ver `docs/tarefas/OR-ouvido-relativo.md` e os comentários em `items/nota-na-pauta.ts`.

/** As teclas pretas, por classe de altura. */
export const PRETAS = [1, 3, 6, 8, 10];

/** As alternativas de nota no teclado, sem as pretas quando a pessoa as desligou. */
export const teclasPermitidas = (ctx: Ctx, s: S): ChoiceOption[] =>
  pcOptions(ctx.naming).filter(o => s.pretas || !PRETAS.includes(Number(o.id)));

/** Uma altura do teclado que o material permite. */
export function alturaDeTeclado(ctx: Ctx, s: S, lo: number, hi: number): number {
  const permitidas = pcsPermitidas(ctx).filter(p => s.pretas || !PRETAS.includes(p));
  let m: number;
  do m = randInt(lo, hi); while (!permitidas.includes(mod(m, 12)));
  return m;
}

/**
 * **O piso da faixa que um alto-falante de celular reproduz**: Mi4, 330 Hz (MIDI 64).
 *
 * Medido em 15/11, com o relato do Paulo de craquelado no aparelho sem fone. A percentagem da
 * energia da nota que fica acima de 300 Hz, onde esses alto-falantes começam a responder:
 *
 * | Mi1 41 Hz | Lá1 55 | Mi2 82 | Lá2 110 | Mi3 165 | Lá3 220 | **Mi4 330** |
 * |---|---|---|---|---|---|---|
 * | 0% | 0% | 1% | 3% | 7–13% | 3–10% | **100%** |
 *
 * O salto é a fundamental cruzar os 300 Hz: os harmônicos da corda são fracos demais para carregar
 * a nota sozinhos. Medi também que **nada no timbre resolve** — abrir o filtro do laço leva de 0,1%
 * a 0,2%, e saturação pesada a 1,2%. Subir a altura é a única saída de verdade, e uma oitava não
 * basta (Mi1 → Mi2 é 0% → 1%).
 */
export const PISO_AUDIVEL = 64;

/** Quatro cordas é baixo; seis é violão. */
export const vozDoBraco = (tuning: readonly number[]) => (tuning.length === 4 ? 'baixo' as const : 'violao' as const);

/**
 * A faixa de teclado que **cabe** estas notas, de dó a dó e com pelo menos `minimo` semitons.
 *
 * Existe porque faixa fixa com nota variável é resposta impossível: `ouvido-acorde` desenhava o
 * teclado de resposta em 48–72 enquanto a fundamental saía da região de quem usa e as inversões
 * somavam até 19 semitons — medido, o acorde chegava a MIDI 83 com a região padrão, e a tecla para
 * clicar a resposta **não existia na tela**. Quem erra assim não errou de música.
 *
 * Alinhar nos dós é para o teclado não começar no meio de um grupo de teclas pretas, que é onde o
 * desenho fica ilegível.
 */
export function faixaQueCabe(ms: readonly number[], minimo = 24): { lo: number; hi: number } {
  const piso = Math.min(...ms), teto = Math.max(...ms);
  let lo = Math.floor(piso / 12) * 12;
  let hi = Math.ceil((teto + 1) / 12) * 12;
  // alarga em oitavas, de baixo e de cima alternadamente, até a largura mínima
  while (hi - lo < minimo) { if (lo >= 12) lo -= 12; if (hi - lo < minimo) hi += 12; }
  return { lo, hi };
}

/**
 * Uma altura que **existe no braço** e tem uma das classes pedidas — `null` quando não há nenhuma.
 *
 * Enumerar e sortear, em vez de calcular uma oitava: é a diferença entre esta função e
 * `alturaDoPc`, e foi ela que custou duas rodadas de conserto em 13/11.
 *
 * `alturaDoPc` promete "uma altura desta classe na faixa", e quando **nenhuma** cabe ela cai num
 * fallback (`lo + mod(pc − lo, 12)`) que pode **passar do teto**. Com a janela estreita que o braço
 * de um baixo impõe — quatro semitons, às vezes — isso acontece para oito das doze classes, e aí a
 * resposta certa caía fora do braço desenhado: medido, MIDI 57 num instrumento cuja última casa dá
 * 55, em `ouvido-acorde` e `ouvido-intervalo`. O guarda de varredura só pegou na quinta rodada,
 * porque depende do sorteio.
 *
 * Aqui não há como estourar: a lista é de alturas reais do braço. A `preferida` (a região de quem
 * usa) filtra quando dá, e é descartada quando não dá — sair da região é melhor que sair do
 * instrumento.
 *
 * Havia uma quarta cópia desta conta, local em `ouvido-tecla`; esta é a dela, generalizada para
 * várias classes e uma janela.
 */
export function alturaNoBraco(
  tuning: readonly number[], pcs: readonly number[],
  preferida?: { lo: number; hi: number }, from = 0, to = 12,
): number | null {
  const doBraco: number[] = [];
  for (const corda of tuning) for (let f = from; f <= to; f++) if (pcs.includes(mod(corda + f, 12))) doBraco.push(corda + f);
  if (!doBraco.length) return null;
  const naFaixa = preferida ? doBraco.filter(m => m >= preferida.lo && m <= preferida.hi) : [];
  return pick(naFaixa.length ? naFaixa : doBraco);
}

/**
 * As alturas que um braço alcança entre duas casas — da corda mais grave solta ao topo da mais aguda.
 *
 * Serve para o sorteio não produzir nota que o braço não tem. É a mesma regra que o `ouvido-tecla`
 * aprendeu em 13/11 depois de três relatos do Paulo: **não ofereça o que aquela tela não entrega.**
 * Sem isto, uma melodia sorteada na região global podia pedir um Si5 num baixo de quatro cordas, e
 * aí só havia escolha entre desenhar a casa errada ou não desenhar a nota.
 */
export function faixaDoBraco(tuning: readonly number[], from = 0, to = 12): { lo: number; hi: number } {
  return { lo: Math.min(...tuning) + from, hi: Math.max(...tuning) + to };
}

/**
 * **Todas** as casas do braço que dão exatamente esta altura — vazio quando nenhuma alcança.
 *
 * A mesma altura vive em várias cordas, e o braço só vira mapa quando se vê que o dó da casa 8 da
 * quarta corda é o mesmo dó da casa 3 da segunda. Foi o pedido do Paulo em 13/11: *"no baixo a nota
 * de referência se mostra apenas em uma das suas posições. mostre ela em todas."*
 */
export function casasDaAltura(tuning: readonly number[], m: number, from = 0, to = 12): { s: number; f: number }[] {
  const out: { s: number; f: number }[] = [];
  for (let s = 0; s < tuning.length; s++) {
    const f = m - tuning[s];
    if (f >= from && f <= to) out.push({ s, f });
  }
  return out;
}
/**
 * Uma casa que dá esta altura, preferindo a corda mais grave — **`null` quando o braço não alcança**.
 *
 * Havia três cópias desta função, e elas **divergiam no caso que importa**: a de `ouvido-tecla`
 * devolvia `null`, e as de `ouvido-acorde` e `melodia-de-ouvido` devolviam `{ s: 0, f: 0 }` — a casa
 * 0 da corda mais grave, que é **uma nota diferente da pedida**. Um acorde com uma nota fora do
 * braço era desenhado com um Mi2 no lugar dela, calado, e a pessoa estudava um acorde que não é o
 * acorde. O próprio Player já tinha aprendido a regra e a escreve: *"marca na casa errada é pior que
 * marca nenhuma"*.
 */
export function casaDaAltura(tuning: readonly number[], m: number, from = 0, to = 12): { s: number; f: number } | null {
  return casasDaAltura(tuning, m, from, to)[0] ?? null;
}

/** Como a pergunta chama a corda. No violão as duas Mi se distinguem por grave e aguda. */
export function nomeDaCorda(tuning: readonly number[], str: number, ctx: Ctx): string {
  const open = pcName(tuning[str], ctx.naming, false);
  if (tuning.length === 6 && str === 0) return ctx.t('quiz.lowString', { note: open });
  if (tuning.length === 6 && str === 5) return ctx.t('quiz.highString', { note: open });
  return open;
}

/** Quantos semitons tem um intervalo da lista. */
export const semisDoIntervalo = (id: string) => { const iv = INTERVALS.find(i => i.id === id)!; return semisFor(iv.num, iv.q); };

/**
 * Os pares de casas tocáveis no braço, com a distância de cada um.
 *
 * **Enumera em vez de passear no aleatório**, e usa o braço inteiro sem interseccionar com a região em
 * MIDI — ver `casaPermitida`: a região esmagava o alcance e sobrava um par só (decisão 101).
 */
export function paresNoBraco(tuning: readonly number[]) {
  const faixa = { lo: tuning[0], hi: tuning[tuning.length - 1] + 9 };
  const pares: { s1: number; f1: number; s2: number; f2: number; d: number }[] = [];
  for (let a = 0; a < tuning.length - 1; a++) {
    for (let fa = 1; fa <= 6; fa++) {
      const ma = tuning[a] + fa;
      if (ma < faixa.lo || ma > faixa.hi) continue;
      for (let b = a; b < Math.min(tuning.length, a + 3); b++) {
        for (let fb = Math.max(0, fa - 2); fb <= fa + 4; fb++) {
          const d = tuning[b] + fb - ma;
          if (d >= 1 && d <= 12) pares.push({ s1: a, f1: fa, s2: b, f2: fb, d });
        }
      }
    }
  }
  return pares;
}

/**
 * Os tópicos de um item de teoria em texto. Cada item recebe só os seus.
 *
 * **Item com um tópico só não declara configuração nenhuma**, em vez de declarar uma lista de um item:
 * uma lista com uma opção é um controle que não controla nada, e esconder a única configuração do item
 * deixaria o botão "Personalizar" abrindo o vazio.
 */
export const TOPICOS = {
  graus: 'settings.topicDegrees', modos: 'settings.topicModes', acordes: 'settings.topicChords',
  campo: 'settings.topicField', tonalidades: 'settings.topicKeys', sub5: 'settings.topicSub5',
  // 04/11: os quatro novos. A regra que os escolheu é **resposta única e calculável** — ver
  // `theoryQuestion`, onde está escrito o que ficou de fora e por quê.
  enarmonia: 'settings.topicEnharmonic', armadura: 'settings.topicSignature',
  'intervalo-nomeado': 'settings.topicNamedInterval', 'campo-menor': 'settings.topicMinorField',
  inversoes: 'settings.topicInversions', 'modo-do-grau': 'settings.topicModeDegree',
} as const;
export type TopicoId = keyof typeof TOPICOS;
export const TEMAS = ({ t }: Ctx, quais: TopicoId[]): Setting => ({
  id: 'temas', label: t('settings.topics'), type: 'multi',
  options: quais.map(id => ({ id, label: t(TOPICOS[id]) })),
});

export const DIRECAO = ({ t }: Ctx): Setting => ({ id: 'direcao', label: t('settings.direction'), type: 'single', options: [
  { id: 'sobe', label: t('settings.up') }, { id: 'desce', label: t('settings.down') }, { id: 'ambos', label: t('settings.upDown') }] });

/**
 * As alturas a tocar de uma escala, na direção escolhida.
 *
 * `ambos` sobe e desce, e é o único caso em que a melódica clássica **mostra o que ela é**: sobe
 * com 6ª e 7ª elevadas e desce como menor natural. A oitava do topo não se repete na virada.
 */
export function scaleSound(tonic: number, id: ScaleId, dir?: SettingValue): number[] {
  const d = (dir ?? 'sobe') as Direcao | 'ambos';
  if (d === 'ambos') return [...scaleMidi(tonic, id, 'sobe'), ...scaleMidi(tonic, id, 'desce').slice(1)];
  return scaleMidi(tonic, id, d);
}

/**
 * Uma célula de graus: um passeio de `size` graus dentro da escala, onde cada vizinho dista 1 ou 2
 * posições e nenhum grau se repete. Extraído de `ouvido-celulas` (X3, 06/11) para `audiar` usar a
 * mesma regra — motor duplicado é proibido, e as duas BUG fixes documentadas lá (clamp nas bordas
 * devolvendo o mesmo grau; distratores inválidos) valem igual para quem gerar graus depois.
 */
export function celulaDeGraus(top: number, size: number): number[] {
  const out: number[] = [randInt(0, top)];
  while (out.length < size) {
    const de = out[out.length - 1];
    const cabem = [-2, -1, 1, 2].filter(d => de + d >= 0 && de + d <= top);
    out.push(de + pick(cabem));
  }
  return out;
}

export const chordName = (t: Ctx['t'], id: ChordId) => t(`theory.chords.${id}` as MessageKey);
/**
 * **A assinatura do DESENHO de uma escala**: as classes de altura que ela acende, a partir de uma
 * tônica. Duas escalas com a mesma assinatura são a mesma figura numa tela.
 *
 * Existe por um par concreto, achado por teste em 20/11: **menor melódica clássica e menor melódica
 * jazz sobem iguais** — a diferença das duas é na DESCIDA, e um desenho não desce. Oferecer as duas
 * como alternativas da mesma pergunta é uma pergunta sem resposta.
 *
 * Quem desenha escala e pede o nome filtra os distratores por aqui.
 */
export const assinaturaDaEscala = (tonica: Note, id: ScaleId): string =>
  [...new Set(buildScale(tonica, id).map(n => mod(midi(n), 12)))].sort((a, b) => a - b).join(',');

export const scaleName = (t: Ctx['t'], id: ScaleId) => t(`theory.scales.${id}` as MessageKey);
export const chordTypes = (t: Ctx['t'], ids: ChordId[]) => ids.map(c => ({ id: c, label: chordName(t, c) }));
/**
 * Todas as qualidades de acorde, em **ordem de complexidade** (U7, 06/11/2026): tríades comuns
 * primeiro, tétrades depois, as duas mais raras por último. Aprovada pelo Paulo — não é mais a
 * ordem de declaração de `CHORDS` em `core.ts`, que é de quando cada uma foi acrescentada.
 * `helpers.test.ts` confere que o conjunto continua batendo com `CHORDS` se uma nova entrar lá.
 */
export const ALL_CHORDS: ChordId[] = ['maior', 'menor', 'dim', 'aum', 'sus2', 'sus4', '7', '7M', 'm7', 'm7b5', 'dim7', '7M#5', 'm7M'];
/** Reordena qualquer lista de qualidades (ex.: a seleção da pessoa) pela ordem de complexidade acima. */
export const porComplexidade = (ids: ChordId[]) => [...ids].sort((a, b) => ALL_CHORDS.indexOf(a) - ALL_CHORDS.indexOf(b));
export const ALL_SCALES = ALL_SCALE_IDS;

// O `tier` é dica de dificuldade relativa, só para a variação automática pré-marcar (F2-2).
// Aqui existe ordem defensável: oitava, quinta e terças antes das segundas e sétimas, e o trítono
// por último. Onde não houver ordem defensável, o tier fica ausente — ver abaixo.
export const INTERVALS: { id: string; num: number; q: Quality; tier: 1 | 2 | 3 }[] = [
  { id: 'J8', num: 8, q: 'J', tier: 1 }, { id: 'J5', num: 5, q: 'J', tier: 1 }, { id: 'J4', num: 4, q: 'J', tier: 1 },
  { id: 'M3', num: 3, q: 'M', tier: 1 }, { id: 'm3', num: 3, q: 'm', tier: 1 },
  { id: 'M6', num: 6, q: 'M', tier: 2 }, { id: 'm6', num: 6, q: 'm', tier: 2 },
  { id: 'M2', num: 2, q: 'M', tier: 2 }, { id: 'm2', num: 2, q: 'm', tier: 2 },
  { id: 'm7', num: 7, q: 'm', tier: 3 }, { id: 'M7', num: 7, q: 'M', tier: 3 },
  { id: 'A4', num: 4, q: 'A', tier: 3 }, { id: 'd5', num: 5, q: 'd', tier: 3 },
];
export const ivLabel = (id: string, ctx: Ctx) => { const iv = INTERVALS.find(i => i.id === id)!; return intervalName({ num: iv.num, semis: semisFor(iv.num, iv.q) }, ctx.conv); };
export const semiOptions = (ctx: Ctx): ChoiceOption[] => Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), label: semitoneName(i + 1, ctx.conv) }));
/** A mesma ordem de dificuldade dos intervalos escritos, em semitons (F2-2). */
/**
 * Dó maior, e tonalidade livre, para os atalhos de percepção.
 *
 * Princípio do Paulo (09/11/2026): *"é mais valioso fixar uma tonalidade em todos exercícios de
 * percepção melódica ou harmônica, pois isso emula com mais verossimilhança as condições reais de
 * música"*. Por isso os atalhos de entrada desses itens trazem dó maior.
 *
 * **Uma referência só, compartilhada**, e não um objeto por atalho: `useParamsDoItem` memoiza por
 * identidade, e um literal novo a cada render recalcularia os parâmetros sem nada ter mudado.
 *
 * `TONALIDADE_LIVRE` é explícito de propósito. Um atalho **sem** `params` não limpa o que outro
 * atalho pôs — ele só não mexe. Para voltar ao sorteio é preciso dizer `key: null`.
 */
export const EM_DO_MAIOR = { key: { tonic: 0, mode: 'maior' } } as const;

/**
 * A tônica que serve de **contexto** para audiar, numa região escolhida.
 *
 * Não é `tonicaNaRegiao`: aquela sorteia uma altura qualquer quando não há tonalidade fixa, e uma
 * altura qualquer **não é um centro tonal** — tocá-la como contexto de uma nota gerada à parte não
 * estabelece nada. Aqui, sem tonalidade, cai em dó.
 *
 * Existe porque os quatro itens com a direção `audiar` precisavam dela e **dois deles erraram
 * sozinhos**: um cravou dó3 ignorando a tonalidade, e o outro tocou a corda mais grave do
 * instrumento como se fosse tônica.
 */
export function tonicaDeContexto(ctx: Ctx, abaixoDe: number): number {
  /**
   * **Com tonalidade livre, o centro é SORTEADO** (decisão do Paulo em 13/11), e não dó.
   *
   * O raciocínio dele, e ele está certo: centro fixo deixa a altura absoluta substituir o ouvido
   * relativo — se o contexto é sempre dó, depois de uma semana a pessoa reconhece o ré por lembrar
   * da frequência, não por ouvir a relação. Sorteando, a única coisa estável entre rodadas é o
   * intervalo, que é o que o exercício mede. É o mesmo motivo pelo qual `reconhecer-padroes-escala`
   * sorteia a tônica desde que nasceu.
   *
   * Antes disto, duas linhas de ouvido fixavam dó e três sorteavam. Agora as cinco sorteiam.
   */
  const pcTonica = ctx.params.key?.tonic ?? randInt(0, 11);
  let m = abaixoDe - mod(abaixoDe - pcTonica, 12);
  while (m > abaixoDe - 2) m -= 12;
  /**
   * **E não sai da região.** O teste `contexto-musical` pegou: numa faixa estreita não há oitava
   * livre abaixo do material, e o contexto saía por baixo do piso que a pessoa configurou.
   *
   * Quando não cabe, ele sobe e **aceita ficar junto** do que se audia. É a mesma troca de
   * `acomodarMelodiaEAcorde`: âncora dentro da região serve ao exercício, âncora fora da região
   * quebra a promessa da região.
   */
  const { lo } = regiao(ctx);
  while (m < lo) m += 12;
  return m;
}
export const TONALIDADE_LIVRE = { key: null } as const;

/** Os doze intervalos, do uníssono à oitava, como os ids que `semiOptions` usa. */
export const TODOS_OS_INTERVALOS = Array.from({ length: 12 }, (_, i) => String(i + 1));

export const SEMI_TIER: Record<number, 1 | 2 | 3> = { 12: 1, 7: 1, 5: 1, 4: 1, 3: 1, 9: 2, 8: 2, 2: 2, 1: 2, 10: 3, 11: 3, 6: 3 };
export const ROOTS: Note[] = [note(0), note(1, -1), note(1), note(2, -1), note(2), note(3), note(3, 1), note(4), note(5, -1), note(5), note(6, -1), note(6)];
export const spellPc = (p: number, oct = 4): Note => ({ ...ROOTS[mod(p, 12)], oct });
export const MODES: ScaleId[] = ['maior', 'dorico', 'frigio', 'lidio', 'mixolidio', 'menor', 'locrio'];

/** A clave da pergunta: o que o item escolheu, ou a clave global quando ele não escolheu (F2-3). */
export function pickClef(s: S, ctx: Ctx): Clef {
  const escolhidas = Array.isArray(s.claves) && s.claves.length ? (s.claves as string[]) : [clave(ctx)];
  return pick(escolhidas) as Clef;
}
export function stepRange(clef: Clef, ext: SettingValue | undefined): [number, number] {
  const b = clefBottom(clef);
  return ext === 'suplementares' ? [b - 6, b + 14] : [b - 1, b + 9];
}
export function randAcc(on: SettingValue | undefined) {
  if (!on) return 0;
  const r = Math.random();
  return r < 0.5 ? 0 : r < 0.75 ? 1 : -1;
}
/** Uma casa do braço cuja nota o material permite (F2-3). Tenta algumas vezes e desiste para a
 *  primeira que couber — com `diatonico` numa região curta, nem toda corda tem nota da tonalidade. */
/**
 * Uma casa do braço que o material permite.
 *
 * **Não usa `params.range`, e isso é a correção de um bug que travava três exercícios.** A versão
 * anterior interseccionava com a região em MIDI: num baixo com casas 0–5 e a região padrão (48–72),
 * sobrava **uma única casa no braço inteiro** — a corda Sol na casa 5 —, e o exercício repetia a mesma
 * pergunta para sempre. Medido: 1 posição distinta em 200 sorteios.
 *
 * E a causa é conceitual, não um descuido de limite: **num exercício de braço, a região é a faixa de
 * casas** (`casas`), que a pessoa escolhe. A região em MIDI foi feita para ouvido e pauta ("quero
 * praticar no grave"), e sobrepô-la ao braço mede a mesma coisa duas vezes com unidades diferentes.
 */
export function casaPermitida(
  tuning: readonly number[], from: number, to: number, ctx: Ctx,
  /**
   * Quais cordas podem sair, pela numeração de quem toca (1ª é a mais AGUDA). Sem a lista, todas.
   *
   * `tuning` vai da grave para a aguda, então a 1ª corda é o último índice: a conversão é
   * `tuning.length - n`. Corda que não existe na afinação em vigor é ignorada — marcar a 6ª num
   * baixo de quatro não deixa o exercício sem pergunta.
   */
  cordas?: readonly string[],
  /** As classes de altura que podem sair. Sem a lista, o que o material permite. */
  classes?: readonly number[],
) {
  const permitidas = classes?.length ? classes : pcsPermitidas(ctx);
  const lo = from === 0 ? 0 : from + 1;
  const indices = cordas?.length
    ? new Set(cordas.map(n => tuning.length - Number(n)).filter(i => i >= 0 && i < tuning.length))
    : null;
  const todas: { str: number; f: number; m: number }[] = [];
  for (let str = 0; str < tuning.length; str++) {
    if (indices && !indices.has(str)) continue;
    for (let f = lo; f <= to; f++) {
      const m = tuning[str] + f;
      if (permitidas.includes(mod(m, 12))) todas.push({ str, f, m });
    }
  }
  if (todas.length) return pick(todas);
  const possiveis = indices?.size ? [...indices] : tuning.map((_, i) => i);
  const str = pick(possiveis), f = randInt(lo, to);
  return { str, f, m: tuning[str] + f };
}

export function fretRange(s: S): [number, number] {
  const [a, b] = String(s.casas ?? '0-5').split('-').map(Number);
  return [a, b];
}
export function tuningOf(s: S, ctx: Ctx) {
  if (s.instrumento === 'auto' || !s.instrumento) return ctx.params.tuning;
  return TUNINGS[s.instrumento as 'violao' | 'baixo'];
}
export const pcOptions = (naming: Ctx['naming']): ChoiceOption[] => Array.from({ length: 12 }, (_, p) => ({ id: String(p), label: pcName(p, naming), value: { kind: 'pitchClass', pc: p } }));
/** Opção que é uma cifra: confere pela fundamental e pela qualidade, não pelo texto. */
export const chordOption = (label: string): ChoiceOption => ({ id: label, label, value: { kind: 'chord', text: label } });
export const chordExpected = (root: Pick<Note, 'letter' | 'acc'>, quality: ChordId): Expected => ({ kind: 'chord', root: pc({ ...root, oct: 4 }), quality });
/** Opção comum, escolhida pelo id. */
export const plain = (o: string): ChoiceOption => ({ id: o, label: o });

// =====================================================================

// =====================================================================
// Quiz de teoria: perguntas geradas
// =====================================================================
// Cada frase é uma mensagem com lacunas (quiz.* em src/i18n); o que muda de forma conforme o
// idioma — ordinais, nomes de intervalo, plural de acidentes — vem de src/theory/names.ts.
/**
 * Os pares enarmônicos que valem perguntar.
 *
 * As cinco teclas pretas, onde as duas grafias são correntes, **mais** os quatro casos de tecla branca
 * (Mi/Fá♭, Si/Dó♭, Fá/Mi♯, Dó/Si♯) — que são os que confundem de verdade, porque parecem erro e não são.
 * Dobrados ficam fora: aparecem em música real, mas numa pergunta de múltipla escolha viram pegadinha.
 */
export const ENARMONIAS: [Note, Note][] = [
  [note(0, 1), note(1, -1)], // Dó♯ / Ré♭
  [note(1, 1), note(2, -1)], // Ré♯ / Mi♭
  [note(3, 1), note(4, -1)], // Fá♯ / Sol♭
  [note(4, 1), note(5, -1)], // Sol♯ / Lá♭
  [note(5, 1), note(6, -1)], // Lá♯ / Si♭
  [note(2), note(3, -1)],    // Mi / Fá♭
  [note(6), note(0, -1)],    // Si / Dó♭
  [note(3), note(2, 1)],     // Fá / Mi♯
  [note(0), note(6, 1)],     // Dó / Si♯
];

/**
 * Quais acidentes a armadura de `f` quintas tem, **na ordem**.
 *
 * A ordem vem de `theory/core.ts` — ela já estava lá, para montar a armadura na pauta. A primeira
 * versão disto a redigitou aqui, e duas cópias da ordem dos acidentes é uma a mais do que precisa
 * existir.
 */
export function acidentesDaArmadura(f: number): Note[] {
  const ordem = f > 0 ? SHARP_ORDER : FLAT_ORDER;
  return ordem.slice(0, Math.abs(f)).map(letra => note(letra, f > 0 ? 1 : -1));
}

/** Como a qualidade de um intervalo se inverte: maior↔menor, aumentado↔diminuto, justo fica. */
export const INVERTE: Record<Quality, Quality> = { M: 'm', m: 'M', A: 'd', d: 'A', J: 'J' };

export function theoryQuestion(topic: string, ctx: Ctx): Question {
  const { t, conv } = ctx;
  const nm = (n: Pick<Note, 'letter' | 'acc'>) => noteName(n, ctx.naming);
  const sym = (root: Pick<Note, 'letter' | 'acc'>, id: ChordId) => chordSymbol(root, id, conv);
  const major = (n: Pick<Note, 'letter' | 'acc'>) => t('theory.keyMajor', { note: nm(n) });
  const modeName = (id: ScaleId) => t(`theory.modes.${id}` as MessageKey);
  const keyPool = Array.from({ length: 13 }, (_, i) => i - 6);
  const text = (q: string, opts: string[], correct: string, reveal = correct, wide = false): Question => ({
    prompt: q, visual: { kind: 'text', text: q }, surface: { kind: 'choices', options: opts.map(plain), wide }, expected: { kind: 'option', id: correct }, reveal,
  });
  // respostas que são cifras: conferem pela fundamental e pela qualidade, não pelo texto
  const chordText = (q: string, opts: string[], expected: Expected, reveal: string): Question => ({
    prompt: q, visual: { kind: 'text', text: q }, surface: { kind: 'choices', options: opts.map(chordOption) }, expected, reveal,
  });
  const notePool = (exclude: string) => ROOTS.map(r => nm(r)).filter(x => x !== exclude);

  if (topic === 'graus') {
    const f = pick(keyPool);
    const tonic = majorTonic(f);
    const scale = buildScale(tonic, 'maior');
    if (Math.random() < 0.5) {
      const d = randInt(2, 7);
      const ans = nm(scale[d - 1]);
      return text(t('quiz.degreeOf', { ord: ordinal(d, conv), key: major(tonic) }), optionsWith(ans, notePool(ans), 6), ans);
    }
    const d = randInt(2, 7);
    const degrees = [1, 2, 3, 4, 5, 6, 7].map(n => ordinal(n, conv));
    return text(t('quiz.whichDegree', { note: nm(scale[d - 1]), key: major(tonic) }), degrees, ordinal(d, conv));
  }
  if (topic === 'modos') {
    if (Math.random() < 0.5) {
      const mode = pick(MODES);
      const tonic = pick(ROOTS);
      const d = pick([2, 3, 6, 7]);
      const ans = nm(buildScale(tonic, mode)[d - 1]);
      // as distratoras mais traiçoeiras: a versão maior e a menor do mesmo grau
      const maj = nm(transpose(tonic, { num: d, semis: semisFor(d, 'M') }));
      const min = nm(transpose(tonic, { num: d, semis: semisFor(d, 'm') }));
      const pool = [...new Set([maj, min, ...shuffle(notePool(ans))])].filter(x => x !== ans).slice(0, 5);
      return text(t('quiz.modeDegree', { ord: ordinal(d, conv, 'f'), note: nm(tonic), mode: modeName(mode) }), shuffle([ans, ...pool]), ans);
    }
    const label = (id: ScaleId, i: number) => {
      const [num, semi] = SCALES[id].degs[i];
      const diff = semi - SCALES.maior.degs[i][1];
      return (diff < 0 ? '♭' : diff > 0 ? '♯' : '') + num;
    };
    const pairs: [ScaleId, ScaleId][] = [];
    MODES.forEach(a => MODES.forEach(b => {
      if (a === b) return;
      const diffs = SCALES[a].degs.filter((d, i) => d[1] !== SCALES[b].degs[i][1]);
      if (diffs.length === 1) pairs.push([a, b]);
    }));
    const [a, b] = pick(pairs);
    const i = SCALES[a].degs.findIndex((d, k) => d[1] !== SCALES[b].degs[k][1]);
    const ans = label(a, i);
    const pool = ['♭2', '2', '♭3', '3', '4', '♯4', '♭5', '5', '♭6', '6', '♭7', '7'];
    return text(t('quiz.modeDiff', { a: modeName(a), b: modeName(b) }), optionsWith(ans, pool, 5), ans);
  }
  // ---------------------------------------------------------------------------------------------
  // Os quatro tópicos novos (04/11/2026). A regra que os escolheu: **resposta única e calculável**.
  // Função harmônica e nome de cadência ficaram FORA — divergem entre tradições, e item ambíguo não
  // pode gerar "erro do usuário" (decisão 13).
  // ---------------------------------------------------------------------------------------------

  if (topic === 'enarmonia') {
    // A mesma tecla com dois nomes. É o buraco mais prático do catálogo para quem toca instrumento de
    // corda: `braco-*` responde por CLASSE DE ALTURA e nunca cobra a grafia.
    const [a, b] = pick(ENARMONIAS);
    const certa = Math.random() < 0.5;
    const [alvo, resposta] = certa ? [a, b] : [b, a];
    // As distratoras: notas a um semitom de distância e a grafia "óbvia e errada" (mesma letra).
    const pool = ENARMONIAS.flatMap(([x, y]) => [nm(x), nm(y)])
      .filter(x => x !== nm(resposta) && x !== nm(alvo));
    return text(t('quiz.enharmonicOf', { note: nm(alvo) }), optionsWith(nm(resposta), [...new Set(pool)], 6), nm(resposta));
  }

  if (topic === 'armadura') {
    // O inverso do que já existia: `tonalidades` pergunta quantos acidentes tem a tonalidade; isto
    // pergunta **quais**, na ordem. É a pergunta que faz a ordem dos acidentes virar útil em vez de
    // decorada.
    const f = pick(keyPool.filter(x => x !== 0));
    const lista = acidentesDaArmadura(f).map(n => nm(n)).join(' ');
    const erradas = new Set<string>();
    for (const g of shuffle(keyPool.filter(x => x !== 0 && x !== f))) {
      if (erradas.size >= 4) break;
      const outra = acidentesDaArmadura(g).map(n => nm(n)).join(' ');
      if (outra !== lista) erradas.add(outra);
    }
    return text(t('quiz.signatureOf', { key: major(majorTonic(f)) }), shuffle([lista, ...erradas]), lista, lista, true);
  }

  if (topic === 'intervalo-nomeado') {
    const a = pick(ROOTS);
    if (Math.random() < 0.5) {
      // De uma nota a outra, **sem pauta e sem som**: é a única forma de cobrar intervalo em silêncio
      // e sem olhar notação.
      const iv = pick(INTERVALS);
      const b = transpose({ ...a, oct: 4 }, { num: iv.num, semis: semisFor(iv.num, iv.q) });
      if (Math.abs(b.acc) > 1) return theoryQuestion('intervalo-nomeado', ctx);
      const ans = ivLabel(iv.id, ctx);
      const pool = INTERVALS.map(x => ivLabel(x.id, ctx)).filter(x => x !== ans);
      return text(t('quiz.intervalFromTo', { a: nm(a), b: nm(b) }), optionsWith(ans, pool, 6), ans);
    }
    // A inversão: a terça maior inverte em sexta menor. Calculada, não tabelada.
    const iv = pick(INTERVALS.filter(x => x.num > 1 && x.num < 8));
    const inv = INTERVALS.find(x => x.num === 9 - iv.num && x.q === INVERTE[iv.q])!;
    const ans = ivLabel(inv.id, ctx);
    const pool = INTERVALS.map(x => ivLabel(x.id, ctx)).filter(x => x !== ans);
    return text(t('quiz.inversionOf', { interval: ivLabel(iv.id, ctx) }), optionsWith(ans, pool, 6), ans);
  }

  if (topic === 'campo-menor') {
    // O `campo` só cobria MAIOR. Os campos menores (natural e harmônica) são metade da harmonia que
    // esta gente toca, e `harmonicField` já sabe os quatro modos — era só perguntar.
    const modo = pick(['menor', 'menor-harmonica'] as const);
    const tonic = pick(ROOTS);
    const field = harmonicField(tonic, modo, Math.random() < 0.5, conv);
    const d = pick(field);
    const outros = harmonicField(tonic, modo === 'menor' ? 'menor-harmonica' : 'menor', true, conv);
    const pool = [...field.map(x => x.symbol), ...outros.map(x => x.symbol)];
    return chordText(
      t('quiz.minorFieldDegree', { note: nm(tonic), mode: t(`theory.scales.${modo}` as MessageKey), roman: d.roman }),
      optionsWith(d.symbol, [...new Set(pool)], 6), chordExpected(d.root, d.chord), d.symbol,
    );
  }

  if (topic === 'inversoes') {
    // A cifra com barra, que é notação de verdade: aparece em toda cifra de música popular e não era
    // cobrada em lugar nenhum. Resposta única — a nota do baixo de uma inversão é calculada.
    const root = pick(ROOTS);
    const type = pick(['maior', 'menor', '7', 'm7', '7M'] as ChordId[]);
    const notas = buildChord(root, type);
    const inv = randInt(1, notas.length - 1);
    const baixo = buildChord(root, type, inv)[0];
    // **O baixo da cifra usa letra**, como o resto da cifra — `chordSymbol` sempre usa `noteName(.., 'en')`.
    // A primeira versão usava o nome no idioma da pessoa e produzia `B7M/Lá♯`, que não é cifra de
    // nada: foi o teste que pegou.
    const nomeNaCifra = (n: Pick<Note, 'letter' | 'acc'>) => noteName(n, 'en');
    const cifra = `${sym(root, type)}/${nomeNaCifra(baixo)}`;
    if (Math.random() < 0.5) {
      // "Dó maior com a terça no baixo se escreve como?"
      const ans = cifra;
      const pool = notas.slice(1).map(x => `${sym(root, type)}/${nomeNaCifra(x)}`).filter(x => x !== ans);
      // **A fundamental fica fora das distratoras**: `D/D` não é inversão de nada, e alternativa
      // absurda não ensina — ela só diminui o número real de opções. Foi o teste que pegou.
      const outras = ROOTS.filter(r => nomeNaCifra(r) !== nomeNaCifra(root))
        .slice(0, 6).map(r => `${sym(root, type)}/${nomeNaCifra(r)}`).filter(x => x !== ans);
      return text(t('quiz.inversionAs', { chord: sym(root, type), ord: ordinal(inv * 2 + 1, conv, 'f') }),
        optionsWith(ans, [...new Set([...pool, ...outras])], 5), ans);
    }
    // "Em C/E, que nota está no baixo?" — a volta, e é a que diz se a notação foi entendida. Aqui a
    // resposta é no idioma da pessoa: a pergunta é sobre a NOTA, não sobre como se escreve a cifra.
    const ans = nm(baixo);
    return text(t('quiz.whatIsBass', { chord: cifra }), optionsWith(ans, notePool(ans), 6), ans);
  }

  if (topic === 'modo-do-grau') {
    // Os modos **por posição**. Hoje eles são cobrados por grau alterado e por diferença entre dois
    // modos, mas nunca por "qual é o quarto" — que é como quase todo mundo os aprendeu.
    const i = randInt(0, MODES.length - 1);
    const mode = MODES[i];
    const ords = MODES.map((_, k) => ordinal(k + 1, conv, 'm'));
    if (Math.random() < 0.5) {
      const ans = modeName(mode);
      return text(t('quiz.modeOfDegree', { ord: ords[i] }), optionsWith(ans, MODES.map(modeName), 6), ans);
    }
    return text(t('quiz.degreeOfMode', { mode: modeName(mode) }), ords, ords[i]);
  }

  if (topic === 'acordes') {
    const root = pick(ROOTS);
    const type = pick(['maior', 'menor', '7', 'm7', '7M', 'm7b5', 'dim'] as ChordId[]);
    const notes = buildChord(root, type);
    if (Math.random() < 0.4) {
      const third = nm(notes[1]);
      return text(t('quiz.thirdOf', { chord: sym(root, type) }), optionsWith(third, notePool(third), 6), third);
    }
    const fmt = (ns: Note[]) => ns.map(nm).join(' – ');
    const ans = fmt(notes);
    // Para cada nota (menos a fundamental), tenta as duas direções de acidente; em acordes com
    // acidentes extremos (ex.: b5 soletrado como dobrado-bemol) só uma direção é válida, então
    // sortear a direção ao acaso às vezes não achava nenhuma em 20 tentativas (teste instável).
    const wrongs = new Set<string>();
    for (const i of shuffle([...notes.keys()].slice(1))) {
      if (wrongs.size >= 3) break;
      for (const d of shuffle([1, -1])) {
        const alt = notes.map((n, j) => (j === i ? { ...n, acc: n.acc + d } : n));
        if (alt.every(n => Math.abs(n.acc) <= 1)) { wrongs.add(fmt(alt)); break; }
      }
    }
    return text(t('quiz.chordNotes', { chord: sym(root, type) }), shuffle([ans, ...wrongs]), ans, ans, true);
  }
  if (topic === 'campo') {
    const f = pick(keyPool);
    const tonic = majorTonic(f);
    const field = harmonicField(tonic, 'maior', Math.random() < 0.5, conv);
    const d = pick(field);
    const pool = [...field.map(x => x.symbol), ...field.map(x => sym(x.root, x.chord === 'maior' ? 'menor' : x.chord === 'menor' ? 'maior' : '7'))];
    return chordText(t('quiz.fieldDegree', { key: major(tonic), roman: d.roman }), optionsWith(d.symbol, [...new Set(pool)], 6), chordExpected(d.root, d.chord), d.symbol);
  }
  if (topic === 'sub5') {
    const f = pick(keyPool);
    const tonic = majorTonic(f);
    const v = transpose(tonic, { num: 5, semis: 7 });
    const sub = transpose(tonic, { num: 2, semis: 1 });
    const ans = sym(sub, '7');
    const pool = [sym(v, '7'), sym(transpose(tonic, { num: 4, semis: 5 }), '7'), sym(transpose(tonic, { num: 7, semis: 10 }), '7'), sym(transpose(tonic, { num: 6, semis: 8 }), '7'), sym(transpose(tonic, { num: 3, semis: 3 }), '7')];
    return chordText(t('quiz.sub5', { chord: sym(tonic, 'maior') }), optionsWith(ans, pool, 5), chordExpected(sub, '7'), t('quiz.sub5Reveal', { answer: ans, dominant: sym(v, '7') }));
  }
  // tonalidades
  const f = pick(keyPool.filter(x => x !== 0));
  const tonic = majorTonic(f);
  const sorteio = Math.random();
  if (sorteio < 0.34) {
    const ans = nm(relativeMinor(f));
    return text(t('quiz.relativeOf', { key: major(tonic) }), optionsWith(ans, keyPool.map(k => nm(relativeMinor(k))), 6), ans, t('theory.keyMinor', { note: ans }));
  }
  if (sorteio < 0.67) {
    // **A direção que faltava.** A relativa só era perguntada de maior para menor, e é a de volta que
    // trava na prática: quem vê uma música em Fá menor precisa saber que a armadura é a de Lá♭ maior.
    const menor = relativeMinor(f);
    const ans = nm(tonic);
    return text(
      t('quiz.relativeMajorOf', { key: t('theory.keyMinor', { note: nm(menor) }) }),
      optionsWith(ans, keyPool.map(k => nm(majorTonic(k))), 6), ans, major(tonic),
    );
  }
  const accLabel = (k: number) => accidentalCount(k, conv);
  return text(t('quiz.accidentalsOf', { key: major(tonic) }), optionsWith(accLabel(f), keyPool.map(accLabel), 6), accLabel(f));
}

// ---------------- acordes desenhados ----------------
//
// As tabelas de formas escritas à mão (`OPEN`, `E_FORM`, `A_FORM`) saíram em 09/11/2026: o gerador
// de `theory/digitacoes.ts` produz qualquer voicing, com extensão e inversão, e manter as duas
// coisas era o motor duplicado que o projeto proíbe. Ver `guitarChordQuestion`.

/**
 * As alternativas de uma pergunta de acorde: a cifra certa, as outras qualidades em jogo sobre a mesma
 * fundamental, e a mesma qualidade sobre outras fundamentais.
 *
 * `emJogo` são as qualidades que a pessoa escolheu. Quando não vêm (as formas de violão são posições
 * reais, não uma escolha de qualidade), caem nas cinco que o desenho de violão produz.
 */
export function chordOptions(root: Note, type: ChordId, conv: Ctx['conv'], emJogo?: ChordId[]) {
  const sym = chordSymbol(root, type, conv);
  const types: ChordId[] = emJogo?.length ? emJogo : ['maior', 'menor', '7', 'm7', '7M'];
  /**
   * Os distratores de fundamental **excluem a enarmônica da resposta**, e não só a string igual.
   *
   * A conferência de acorde compara **classe de altura** da fundamental (`chordExpected`), então
   * "Ré♭m" e "Dó♯m" são a mesma resposta certa — e duas respostas certas é o que a decisão 13
   * proíbe. Passava escondido porque a fundamental vinha da própria lista `ROOTS`: a string saía
   * idêntica e o `Set` a engolia. Em 13/11 a fundamental passou a ser grafada pela tonalidade, a
   * string deixou de coincidir, e o teste de "exatamente uma alternativa certa" caiu na hora.
   *
   * Filtrar por classe de altura é o conserto de verdade — a string igual era coincidência, não
   * proteção.
   */
  const pcDaResposta = pc({ ...root, oct: 4 });
  const outrasFundamentais = shuffle(ROOTS.filter(r => pc({ ...r, oct: 4 }) !== pcDaResposta)).slice(0, 5);
  const pool = [...types.map(t => chordSymbol(root, t, conv)), ...outrasFundamentais.map(r => chordSymbol(r, type, conv))];
  return { sym, options: optionsWith(sym, [...new Set(pool)], 6).map(chordOption), expected: chordExpected(root, type) };
}
/**
 * Um acorde desenhado no braço — a forma vem do **gerador**, não de tabela escrita à mão.
 *
 * ## O que mudou em 09/11/2026
 *
 * Antes havia 16 formas abertas e 10 fórmulas de pestana, todas escritas à mão: nenhuma extensão,
 * nenhuma inversão, nenhum voicing. O Paulo pediu *"voicings diversos, extensões, inversões, que
 * não seja só os gavetões"* — e o motor que faz isso **já estava no repositório e ninguém usava**:
 * `theory/digitacoes.ts`, o algoritmo que ele mesmo doou (`M5`), com 22 testes.
 *
 * Ligar os dois também cumpre a regra do projeto: havia **dois** jeitos de achar um acorde no
 * braço, e motor duplicado é proibido. As tabelas à mão saíram.
 *
 * ## Formas móveis por padrão
 *
 * `soltas: false` proíbe corda solta, e é o padrão a pedido dele. Um gavetão aberto é uma forma
 * memorizada numa posição fixa; uma forma sem cordas soltas é **relativa**, e move pelo braço — é a
 * que transfere.
 *
 * ## Duas perguntas, não uma
 *
 * Fixar o acorde para "focar nos desenhos relativos" (pedido dele) **muda a pergunta**: se é sempre
 * Dó maior, "que acorde é esse" tem uma resposta e o exercício morre. Então com a fundamental fixa
 * a pergunta vira **qual nota está no baixo** — que é reconhecer o desenho, e é o que ele quer. O
 * `role` de cada `Encaixe` já é o grau, então a resposta sai do motor sem conta nenhuma.
 *
 * A fundamental fixa é a **da tonalidade em vigor** (dó quando livre), seguindo o princípio dele de
 * que fixar tonalidade emula as condições reais de música.
 */
export function guitarChordQuestion(s: S, ctx: Ctx): Question {
  const tuning = TUNINGS.violao;
  const [, maxCasa] = fretRange(s);
  const types = arr(s.tipos, ['maior', 'menor', '7', 'm7', '7M']) as ChordId[];
  const type = pick(types);
  const peloBaixo = s.pergunta === 'baixo';
  const pcRaiz = peloBaixo ? (ctx.params.key?.tonic ?? 0) : pcPermitido(ctx);
  const root = { ...spellPc(pcRaiz), oct: 3 };

  // `limite` existe porque o gerador é infinito em potencial; 300 é mais que suficiente para
  // sortear com variedade sem varrer o braço inteiro a cada pergunta.
  const todas = [...digitacoesDaReceita(root, type, {
    tuning, maxCasa: Math.max(4, maxCasa), maxVaoCasas: 4, limite: 300,
  })];
  const cabem = todas.filter(f => (s.soltas ? true : f.every(e => e.casa > 0)));
  const forma = (cabem.length ? pick(cabem) : todas.length ? pick(todas) : []);
  if (!forma.length) {
    // Sem forma possível (faixa de casas estreita demais para a qualidade pedida): o item explica
    // em vez de gerar pergunta sem resposta. Ver `problema` no item.
    return guitarChordQuestion({ ...s, casas: '0-12', soltas: true }, ctx);
  }

  const usadas = forma.map(e => e.casa).filter(f => f > 0);
  const from = usadas.length && Math.min(...usadas) > 3 ? Math.min(...usadas) - 1 : 0;
  const played = [...forma].sort((a, b) => a.midi - b.midi).map(e => e.midi);
  const noBaixo = [...forma].sort((a, b) => a.midi - b.midi)[0];
  const visual: Question['visual'] = {
    kind: 'fretboard', tuning, from, to: from + 5,
    marks: forma.map(e => ({ s: e.corda, f: e.casa, color: e.casa === 0 ? 'var(--cream)' : undefined })),
    muted: tuning.map((_, i) => i).filter(i => !forma.some(e => e.corda === i)),
  };

  if (peloBaixo) {
    // As alternativas são os graus que ESTE acorde tem — nem mais, nem menos.
    const graus = [...new Set(forma.map(e => e.role))];
    return {
      prompt: ctx.t('quiz.whichBass', { chord: chordSymbol(root, type, ctx.conv) }), visual,
      surface: { kind: 'choices', options: graus.map(g => ({ id: g, label: ctx.t('quiz.degreeInBass', { degree: g }) })) },
      expected: { kind: 'option', id: noBaixo.role },
      sound: { groups: [played], instrument: 'violao' },
      reveal: ctx.t('quiz.degreeInBass', { degree: noBaixo.role }),
    };
  }
  const { sym, options, expected } = chordOptions(root, type, ctx.conv, types);
  return {
    prompt: ctx.t('quiz.whatChord'), visual,
    surface: { kind: 'choices', options }, expected,
    sound: { groups: [played], instrument: 'violao' }, reveal: sym,
  };
}
