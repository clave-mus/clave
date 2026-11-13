import type { ComponentType } from 'react';
import type { Instrument } from '../data/modules';
import type { ChordId, Clef, Convention, Naming, Note } from '../theory/core';
import type { MessageKey, Translate } from '../i18n';
import type { Presentation } from '../audio/presentation';
import type { Classification } from './taxonomy';
import type { GlobalParams, ParametroDePratica, ParametrosDePratica } from './params';
import type { Publicacao } from './publicacao';
import type { CellId } from '../theory/rhythm';
import type { FretMark } from '../components/music/Fretboard';

// Uma pergunta separa quatro coisas (C1):
// - conteúdo musical: o que se pergunta (visual, sound);
// - apresentação: como soa (timbre, volume, intervalo, arpejo) — resolvida na hora de tocar, ver
//   src/audio/presentation.ts; a pergunta não decide isso;
// - superfície: onde a pessoa responde (surface), que devolve uma Response estruturada;
// - validação: o que está certo (expected), conferido por src/catalog/validate.ts com
//   equivalência musical (enarmonias, cifras equivalentes, posições com a mesma altura).

export type Visual =
  | { kind: 'staff'; clef: Clef; fifths?: number; columns: Note[][] }
  | { kind: 'keyboard'; lo: number; hi: number; marks: number[] }
  | { kind: 'fretboard'; tuning: readonly number[]; from: number; to: number; marks: FretMark[]; muted?: number[] }
  | { kind: 'ear'; hint?: string }
  | { kind: 'text'; text: string };

/** Resposta estruturada, como a superfície a entrega. É o que a C2 grava em cada tentativa. */
export type Response =
  | { kind: 'option'; id: string }
  /** Uma classe de altura escolhida (opções de nome de nota), sem oitava nem grafia. */
  | { kind: 'pitchClass'; pc: number }
  /** Uma altura tocada (teclado, braço). */
  | { kind: 'pitch'; midi: number }
  /** Uma nota escrita (letras, pauta); oct só quando a superfície define a oitava. */
  | { kind: 'spelled'; letter: number; acc: number; oct?: number }
  /** Uma cifra digitada, em qualquer convenção. */
  | { kind: 'chord'; text: string }
  /**
   * **Várias alturas**, montadas numa superfície de instrumento ou pauta — um acorde desenhado, uma
   * melodia tocada de volta. A ordem é a de quem respondeu; se ela importa, quem decide é o
   * `Expected` (ver `contorno`).
   */
  | { kind: 'pitches'; midis: number[] };

/** O que está certo, em termos musicais. */
export type Expected =
  | { kind: 'option'; id: string }
  /** Classe de altura: qualquer oitava, qualquer grafia (Dó♯ = Ré♭). */
  | { kind: 'pitchClass'; pc: number }
  /** Altura exata, em qualquer grafia ou posição do braço. */
  | { kind: 'pitch'; midi: number }
  /** Grafia exata: letra e acidente (e oitava, se dada). Aqui Dó♯ ≠ Ré♭. */
  | { kind: 'spelled'; letter: number; acc: number; oct?: number }
  /** Acorde: classe de altura da fundamental e qualidade. */
  | { kind: 'chord'; root: number; quality: ChordId }
  /**
   * **Contorno**: a conferência do meio, que o Paulo pediu e definiu (`OR-ouvido-relativo.md`, §4).
   *
   * As duas que existiam não serviam a melodia: `pitchClass` é frouxa (acerta na oitava errada — foi
   * o que escondeu o bug do teclado) e `pitch` é rígida (exigiria a oitava absoluta de cada nota).
   * Nas palavras dele: *"não dá pro usuário ouvir uma nota, saber qual é, ouvir uma nota acima e
   * dizer que estava abaixo"*.
   *
   * **A regra:** certo se TODA nota da resposta está deslocada da esperada pelo MESMO número de
   * oitavas. O conjunto inteiro pode subir ou descer junto; nota solta, não.
   *
   * `ordenada` é `true` para melodia (a ordem é a resposta) e `false` para acorde desenhado, onde
   * a pessoa clica as notas em qualquer ordem e o que importa é o conjunto.
   */
  | { kind: 'contorno'; midis: number[]; ordenada?: boolean };

export interface ChoiceOption {
  id: string;
  label: string;
  rhythm?: CellId[][];
  /** O que a opção significa, quando a conferência é musical (ex.: a cifra); sem isso, vale o id. */
  value?: Response;
}

/** Onde a pessoa responde. */
export type Surface =
  /** `compact`: botões menores, para lista longa de qualidade (U7) — cifra em si já é curta. */
  | { kind: 'choices'; options: ChoiceOption[]; wide?: boolean; compact?: boolean }
  /**
   * Montar a resposta escolhendo **entre todas as opções possíveis**, em ordem, em vez de entre
   * quatro alternativas (pedido do Paulo, 09/11/2026: "a gente tenha que escolher entre todas
   * opções possiveis — todos graus da escala ou do campo").
   *
   * A resposta que sai daqui é `{ kind: 'option', id }` com os escolhidos unidos por `separador` —
   * **exatamente** o que `choices` entrega. Por isso o validador não mudou uma linha: o item
   * declara o mesmo `expected` nos dois modos, e quem troca é só a tela.
   *
   * Com `comprimento: 1` isto é só uma lista maior de botões, e nem precisaria de superfície
   * própria; com mais de um, a pessoa escolhe em ordem e o que entra é uma sequência.
   */
  | { kind: 'sequence'; options: ChoiceOption[]; comprimento: number; separador?: string }
  /**
   * **Audiar e conferir**: não há resposta a conferir, só a pessoa dizendo como foi.
   *
   * É a superfície da direção `audiar` — a terceira ao lado de ler e escrever, e o que faz a coluna
   * "oposto" do desenho do Paulo (`OR-ouvido-relativo.md`) deixar de ser cinco exercícios novos.
   *
   * O gabarito **não toca sozinho**: fica atrás de um botão, porque audiar antes de ouvir é o
   * exercício. Declare-o em `sound.partes` e deixe `autoplay: false`.
   *
   * `expected` é `{ kind: 'option', id: 'facil' }` — "consegui" é o acerto, e o resto da máquina
   * funciona sem caso novo. O que muda é o `validation_type` da tentativa, **deduzido** desta
   * superfície: autoavaliação não é medida, e o histórico não pode dizer que foi.
   */
  | { kind: 'autoavaliacao' }
  | { kind: 'letters'; accidentals: boolean }
  /**
   * `quantas` transforma teclado, braço e pauta em **superfície que acumula**: a pessoa põe N notas
   * e envia de uma vez, e a resposta sai como `{ kind: 'pitches' }`.
   *
   * Não é uma quarta superfície de propósito. Desenhar um acorde no piano é clicar nas mesmas
   * teclas de sempre — o que muda é quantas respostas entram antes de valer. Uma superfície nova
   * duplicaria o teclado, o braço e a pauta, e motor duplicado é proibido.
   *
   * Mesma regra do `sequence`: nada é enviado antes de estar cheia, e a pessoa pode desfazer o
   * último toque. Meia resposta não é resposta.
   */
  | { kind: 'keyboard'; lo: number; hi: number; quantas?: number }
  | { kind: 'fretboard'; tuning: readonly number[]; from: number; to: number; onlyString?: number; quantas?: number }
  /**
   * `fifths` é a armadura desenhada na pauta de RESPOSTA. Com ela, clicar na linha do fá em Sol
   * maior já vale Fá♯ — era o "muito trabalho de ligar o sustenido" (Paulo, 12/11). Sem ela (ou
   * com tonalidade livre), a pessoa escreve o acidente à mão, como antes.
   */
  | { kind: 'staff'; clef: Clef; accidentals: boolean; fifths?: number; quantas?: number };

/** Conteúdo sonoro: só as notas. Como elas soam fica com a apresentação. */
export interface SoundContent {
  groups: number[][]; // grupos de alturas MIDI, em sequência; as notas de um grupo são simultâneas
  drums?: number[]; // ataques, em tempos (para ritmo)
  /** De que instrumento é o som, para usar o timbre escolhido para ele. Sem isso, piano. */
  instrument?: Instrument;
  /**
   * Pedaços que dá para **ouvir isolados**, além do botão que repete tudo (09/11/2026).
   *
   * Nasceu de "reconhecer melodia na harmonia": ouvir o acorde de contexto sozinho, e depois cada
   * nota da melodia sozinha, é o que torna o exercício estudável em vez de um teste de memória.
   *
   * **É opt-in, e isso é de propósito.** Dava para deduzir os pedaços de `groups` — cada grupo um
   * botão —, mas aí todo item de ouvido ganharia botões que ninguém pediu, e em vários deles
   * (um intervalo melódico, por exemplo) ouvir as notas separadas **entrega a resposta**. Quem
   * sabe se separar ajuda ou estraga é o item.
   */
  partes?: ParteDoSom[];
  /**
   * Índices de `groups` que o arpejo alcança. Sem a lista, o arpejo vale para todos.
   *
   * Existe porque arpejar o CONTEXTO estraga o contexto: ele é uma cadência que deve soar como
   * harmonia, e quebrá-la em notas soltas tira dela exatamente o que ela estabelece. Quem arpeja é
   * o acorde da pergunta (Paulo, 12/11/2026).
   */
  arpejaveis?: number[];
}

/** Um pedaço do som que a pessoa pode repetir sozinho. */
export interface ParteDoSom {
  id: string;
  label: string;
  groups: number[][];
}

export interface Question {
  prompt: string;
  visual: Visual;
  surface: Surface;
  expected: Expected;
  sound?: SoundContent; // tocado ao mostrar (ouvido) ou ao responder (visual)
  autoplay?: boolean;
  reveal: string; // a resposta certa, por extenso
}

export type SettingValue = string | string[] | boolean | number;

/** Uma opção de uma configuração de lista. */
export interface SettingOption {
  id: string;
  label: string;
  /**
   * Dica de dificuldade relativa, só para a variação automática PRÉ-MARCAR o que costuma ser o
   * próximo passo (F2-2, decisão 9). `1` costuma vir primeiro.
   *
   * **Nunca ordena, nunca bloqueia, nunca esconde.** Ausente quer dizer "sem opinião", e é o caso
   * da maioria: não existe "clave de sol mais fácil que clave de fá". Forçar uma ordem onde ela
   * não existe é erro pedagógico — por isso o app abre o menu inteiro e só sugere.
   */
  tier?: 1 | 2 | 3;
}

export interface Setting {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'toggle' | 'range';
  options?: SettingOption[];
  /** Para 'range': limites, passo e como mostrar o valor (ex.: v => `${v} s`). */
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  /** Se a configuração muda só como o som é tocado, diz o que ela muda na apresentação. */
  present?: (v: SettingValue) => Partial<Presentation>;
  /**
   * A configuração muda **só** como o som é tocado, nunca a pergunta.
   *
   * O Player usa isto para **não sortear uma pergunta nova** quando ela muda: mexer em "arpejar" ou na
   * duração no meio de um acorde trocava o acorde, e a pessoa perdia o que estava tentando identificar.
   *
   * **Não dá para inferir de `present`:** o seletor de instrumento de `acorde-visual` tem `present` e
   * TAMBÉM é lido pelo `make` (decide violão ou piano). Por isso é declarado, e há teste conferindo que
   * uma configuração marcada assim de fato não é lida pelo `make`.
   */
  soPresentation?: true;
  /**
   * Mostrar esta configuração só quando isto for verdade.
   *
   * Existe para as fusões por superfície (`F1-4`): depois de fundir pauta, teclado e braço num item só,
   * a extensão tem **três unidades incomparáveis** — `pauta / linhas suplementares`, `1 / 2 oitavas`,
   * faixas de casa. Não é um parâmetro com três listas de opções: são três configurações, cada uma
   * visível quando a sua superfície está ativa.
   *
   * **Declarativo de propósito.** A alternativa seria dar à função `settings` acesso aos valores, o que
   * criaria ordem de avaliação e re-render em cascata; aqui a tela só filtra.
   */
  quando?: (s: Record<string, SettingValue>) => boolean;
  /**
   * Para `'multi'`: estica os chips para preencher a linha, em vez de ficarem alinhados à
   * esquerda com o seu tamanho natural (U8). Existe porque uma lista longa (as treze qualidades
   * de acorde) deixa o último chip sozinho e pequeno na última linha — e aqui isso parece
   * esquecido, não intencional. Opt-in: a maioria das listas é curta, e esticar chip de rótulo
   * longo também pode ficar pior.
   */
  justify?: true;
  /**
   * Um `multi` que pode ficar VAZIO. O Player bloqueia desligar o último chip porque na maioria
   * das listas (tipos de acorde, graus) vazio = nenhuma pergunta possível. Mas há listas de
   * ACRÉSCIMO, onde vazio é o padrão e um estado legítimo — os empréstimos modais de
   * `ouvido-campo`: sem isto, quem ligasse um empréstimo nunca mais conseguiria desligar o último.
   */
  podeVazio?: true;
}
/** O que um exercício precisa saber para montar a pergunta no idioma e no contexto da pessoa. */
export interface Ctx {
  naming: Naming;
  conv: Convention;
  t: Translate;
  /** Parâmetros globais: instrumento, afinação, tonalidade, região, andamento… (ver params.ts). */
  params: GlobalParams;
}

/**
 * Tipo de término da etapa (decisão 5). É propriedade do item, não configuração — e determina
 * o executor **e** o que aquela etapa consegue afirmar:
 *
 * - `serie`    termina em N perguntas (ou no tempo) → produz EVIDÊNCIA validada
 * - `ambiente` termina quando a pessoa para          → produz ATIVIDADE, sem nota
 * - `tarefa`   termina na autoavaliação da pessoa    → produz AUTOAVALIAÇÃO, nunca acerto
 */
export type Termination = 'serie' | 'ambiente' | 'tarefa';

/**
 * O que a tela de um item do tipo `ambiente` ou `tarefa` recebe. Tudo opcional: cada tela usa o
 * que lhe serve e ignora o resto. Quando a F1-3 levar as configurações das telas para o catálogo,
 * isto encolhe para um objeto de parâmetros resolvidos.
 */
export interface ScreenProps {
  /** Tempo sugerido da etapa, quando o item roda dentro de uma rotina. */
  goalMinutes?: number;
  /**
   * A configuração da instância, quando o item foi aberto a partir de uma etapa de rotina.
   *
   * É o que torna possível a MESMA ferramenta aparecer várias vezes na rotina com configurações
   * diferentes — a rotina "De bolso" é quatro variações do ciclo sem tela. Sem isto, a configuração
   * de um ambiente só existiria no estado da tela, e duas etapas do mesmo ambiente seriam idênticas.
   */
  settings?: Record<string, SettingValue>;
  /** Versão reduzida, para caber dentro de outra tela. */
  compact?: boolean;
  onRunning?: (running: boolean) => void;
  presetId?: string;
  /** Qual item abriu esta tela — é como uma mesma tela serve a várias famílias (decisão 15). */
  itemId?: string;
}

// Título e descrição ficam nos textos de cada idioma (exercises.<id> e tools.<id> em src/i18n;
// ver itemText). O id é estável: rotinas, tentativas e configurações salvas apontam para ele,
// então nunca muda (taxonomy.test.ts trava a lista). Etiquetas: ver src/catalog/taxonomy.ts.
//
// Exercício e ferramenta são O MESMO TIPO (decisão 17): registro unificado, tela separada quando
// precisa. Assim o braço virtual não tem duas implementações, e uma ferramenta entra numa etapa
// de rotina sem nenhum caso especial no código.
/**
 * O que o item exige do mundo (F1-2). **Só três são declarados**, porque só estes são fato do
 * mundo; olhos, mãos e áudio são DEDUZIDOS em src/catalog/context.ts, para não desatualizarem.
 */
export interface Requisitos {
  /** Precisa do instrumento em mãos. */
  instrumento?: true;
  /** Precisa captar som. Nenhum item pode EXIGIR isto — é sempre acréscimo opcional. */
  microfone?: true;
  /** Precisa cantar ou vocalizar. */
  voz?: true;
}

/**
 * Como a resposta pode ser conferida. **O primeiro é o padrão**, e com instrumento o padrão é
 * sempre `self_report` (decisão 37): o app apresenta, a pessoa julga.
 *
 * `microphone` e `midi` são acréscimos **experimentais e opcionais** (decisões 43 e 44).
 * Nenhum item pode depender deles.
 */
export type ModoDeValidacao = 'deterministic' | 'self_report' | 'microphone' | 'midi' | 'none';

export interface CatalogItem extends Classification {
  id: string;
  kind: Termination;
  requires: Requisitos;
  /** Os modos que o item aceita; o primeiro é o padrão. */
  validation: ModoDeValidacao[];
  /** @deprecated Use `requires.instrumento`. Fica até as telas migrarem. */
  mobile: boolean;
  settings: (ctx: Ctx) => Setting[];
  defaults: Record<string, SettingValue>;
  /**
   * Quais parâmetros de PRÁTICA este item de fato respeita (decisão 87). A tela só oferece o
   * controle de tonalidade, região ou material onde ele muda alguma coisa — oferecer onde o item o
   * ignora seria prometer o que não acontece, o mesmo erro de "material diatônico sem tonalidade".
   *
   * **Não é opinião: é medido.** `contexto-declarado.test.ts` confere contra as chamadas reais que o
   * `make` faz, então esta lista não envelhece sem o teste acusar.
   */
  respeita?: readonly ParametroDePratica[];
  /**
   * Atalhos de configuração, **nomeados pelo conteúdo** (decisão 100).
   *
   * Não são "níveis": nomear "1, 2, 3" afirmaria uma progressão linear que nem sempre existe, e a
   * decisão 9 proíbe. "Só tríades" e "Com suspensos" descrevem o que muda, sem dizer qual é mais
   * avançado — a pessoa escolhe pelo que quer praticar, não por onde "deveria" estar.
   *
   * O nome de cada preset é curadoria do dono do produto.
   */
  /**
   * `params` leva a camada de PRÁTICA do atalho — tonalidade, região, material. Entrou em 09/11
   * porque o Paulo quis que o atalho mais simples do `ouvido-celulas` começasse em dó maior, e
   * tonalidade não é configuração do item: é parâmetro de prática (decisão 87).
   *
   * **O primeiro preset é a entrada do item**: quem abre sem nada salvo cai nele, settings e
   * params. Ver `Player`.
   */
  presets?: readonly { id: string; nome: MessageKey; settings: Record<string, SettingValue>; params?: ParametrosDePratica }[];
  /**
   * Se as pessoas veem este item (decisão 91). **Omitir é o mesmo que `rascunho`**: um item novo nasce
   * escondido, e só o Paulo o publica.
   */
  publicacao?: Publicacao;
  /** Apresentação própria do item (ex.: intervalo maior entre notas), por cima da global. */
  presentation?: Partial<Presentation>;
  /**
   * O item roda **sem olhos e sem mãos**?
   *
   * É o único requisito deduzido que um item pode declarar, e só itens de tela própria precisam dele:
   * `requisitosDe` não consegue sondar uma tela, então assume o caso conservador (usa olhos, mãos e
   * áudio) para nunca oferecer o que a pessoa não consegue fazer. Num ciclo de áudio puro essa
   * suposição está errada, e só o item sabe. Ver `context.ts`.
   */
  semTela?: true;
  /** Só em `kind: 'serie'`: sorteia a pergunta. Quem renderiza e corrige é o Player. */
  make?: (s: Record<string, SettingValue>, ctx: Ctx) => Question;
  /**
   * Por que estas configurações não geram pergunta. Devolve a mensagem já traduzida, ou `null`.
   *
   * Existe para a decisão 13: **item ambíguo não pode gerar "erro do usuário"**. Quando a própria
   * configuração torna a pergunta impossível de responder, o certo não é sortear e corrigir — é
   * recusar e dizer por quê. O caso que criou isto: menor melódica clássica e jazz **soam idênticas
   * subindo**, então pedir para distinguir as duas só com direção ascendente é pedir o impossível
   * (decisão 70).
   *
   * O Player chama antes de `make` e, havendo mensagem, **não chama `make`**.
   */
  problema?: (s: Record<string, SettingValue>, ctx: Ctx) => string | null;
  /** Só em `ambiente` e `tarefa`: tela própria, carregada sob demanda. */
  screen?: () => Promise<{ default: ComponentType<ScreenProps> }>;
}

/** Um item que o Player sabe rodar: tem `make`. */
export type SeriesItem = CatalogItem & { make: NonNullable<CatalogItem['make']> };
export const isSeries = (i: CatalogItem): i is SeriesItem => typeof i.make === 'function';
