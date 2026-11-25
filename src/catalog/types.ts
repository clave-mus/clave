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
import type { FamiliaBase } from '../theory/digitacoes';

// Uma pergunta separa quatro coisas (C1):
// - conteúdo musical: o que se pergunta (visual, sound);
// - apresentação: como soa (timbre, volume, intervalo, arpejo) — resolvida na hora de tocar, ver
//   src/audio/presentation.ts; a pergunta não decide isso;
// - superfície: onde a pessoa responde (surface), que devolve uma Response estruturada;
// - validação: o que está certo (expected), conferido por src/catalog/validate.ts com
//   equivalência musical (enarmonias, cifras equivalentes, posições com a mesma altura).

export type Visual =
  | { kind: 'staff'; clef: Clef; fifths?: number; columns: Note[][] }
  /**
   * `animar` acende as marcas **uma a uma, na ordem da lista**, com quase um segundo em cada
   * (pedido do Paulo em 13/11).
   *
   * Existe porque num braço ou teclado três notas são três pontos acesos, e **nada diz qual é a
   * primeira** — `● ● ●` não é melodia. A alternativa era numerar as marcas; ele escolheu a
   * animação, que mostra a ordem no tempo em vez de pedir que se leia um número.
   *
   * Com `prefers-reduced-motion` a animação não roda, e aí as marcas aparecem **numeradas** de uma
   * vez: a ordem é informação do exercício, não enfeite, e some junto com o movimento seria perder
   * a pergunta.
   */
  /**
   * `marcasFracas` são marcas de APOIO, não a pergunta: a nota de referência num exercício de
   * audiação, por exemplo. Elas aparecem na cor fraca e com o nome escrito, e a pergunta fica no
   * acento — sem isso as duas eram iguais e a pessoa não sabia qual audiar.
   */
  | { kind: 'keyboard'; lo: number; hi: number; marks: number[]; marcasFracas?: number[]; rotulos?: Record<number, string>; animar?: boolean }
  | { kind: 'fretboard'; tuning: readonly number[]; from: number; to: number; marks: FretMark[]; muted?: number[]; animar?: boolean }
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
  /**
   * Várias alturas postas numa superfície que acumula. `posicoes` vem junto quando a superfície é
   * um braço: duas cordas dão a mesma altura, e uma **digitação** é onde se toca, não só o que soa.
   */
  | { kind: 'pitches'; midis: number[]; posicoes?: { corda: number; casa: number }[] };

/** O que está certo, em termos musicais. */
export type Expected =
  /**
   * **Uma digitação de escala no braço** — e aqui o certo não é uma lista de posições, é uma
   * REGRA: as classes do modo, nenhuma repetida, subindo em ordem de grau, dentro do vão da mão.
   *
   * Existem dezenas de digitações certas para o mesmo modo (medido: 22 para ré dórico num baixo,
   * com vão de 4 casas), e foi por isso que esta conferência não pôde ser `contorno`. Quem julga é
   * `theory/digitacao-de-escala.ts`.
   */
  | { kind: 'digitacao'; tonica: Note; familia: FamiliaBase; grau: number; tuning: readonly number[]; maxVaoCasas?: number;
      /**
       * Quantos desenhos **diferentes** a rodada pede (1 a 5, decisão dele em 25/11): *"seria legal
       * pedir pro usuário escrever diversas digitações pra mesma escala. isso ajuda a sair do
       * shape"*. As posições chegam em sequência, e cada sete formam um desenho.
       */
      desenhos?: number }
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
  | { kind: 'sequence'; options: ChoiceOption[]; comprimento: number; separador?: string;
      /**
       * **Uma lista por passo**, quando os passos pedem coisas diferentes — e com um rótulo cada,
       * porque sem ele a pessoa não sabe o que está escolhendo agora.
       *
       * Nasceu em 20/11, do modo "que acorde é, e que nota é por cima": o primeiro passo são os
       * graus do campo e o segundo são os graus da escala. A lista única de antes dava os dois
       * passos com a mesma paleta, e a paleta é metade do enunciado.
       *
       * Quando `passos` existe, é ele que manda: `comprimento` passa a ser o número de passos, e
       * `options` serve só para quem precisa da união (a leitura dos rótulos na conferência).
       */
      passos?: { label: string; options: ChoiceOption[] }[] }
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
  | { kind: 'keyboard'; lo: number; hi: number; quantas?: number; apoio?: Apoio }
  | { kind: 'fretboard'; tuning: readonly number[]; from: number; to: number; onlyString?: number; quantas?: number; apoio?: Apoio;
      /**
       * Cordas com o dobro do espaçamento. Medido em 25/11 num celular deitado: com o espaçamento
       * normal cada corda tem **24 px** de altura — metade de um alvo de toque confortável. Montar
       * uma digitação são sete toques certeiros, e aí 24 px é pouco.
       */
      alto?: boolean }
  /**
   * `fifths` é a armadura desenhada na pauta de RESPOSTA. Com ela, clicar na linha do fá em Sol
   * maior já vale Fá♯ — era o "muito trabalho de ligar o sustenido" (Paulo, 12/11). Sem ela (ou
   * com tonalidade livre), a pessoa escreve o acidente à mão, como antes.
   */
  | { kind: 'staff'; clef: Clef; accidentals: boolean; fifths?: number; quantas?: number; apoio?: Apoio }
  /**
   * **O mapa do braço**: as posições de um arpejo desenhadas no braço, uma destacada por vez, e a
   * resposta é o NOME da nota destacada — clica-se no botão, não no braço.
   *
   * É a oitava superfície, e a única peça nova do item (13/11/2026). Nenhuma das sete servia:
   * `choices` responde uma vez e aqui são N em sequência; `sequence` responde N vezes mas não tem
   * braço nem avanço sincronizado com o desenho; `fretboard` é para clicar **no** braço, e aqui o
   * braço é o enunciado. O que falta é o cruzamento: braço mostrando posições em três estados
   * (ainda não · é esta · já foi) e botões de nome fixos ao lado.
   *
   * O braço é desenhado pelo mesmo `Fretboard` dos outros (decisão 17 — uma implementação de braço
   * virtual), e os botões usam o estilo de `choices`. A superfície nova é a coreografia, não o
   * desenho.
   */
  | {
    kind: 'mapa';
    tuning: readonly number[];
    from: number;
    to: number;
    /** As posições na ordem de execução; a de índice `respondidas` é a destacada. */
    posicoes: readonly PosicaoDoMapa[];
    /** Os botões de nome, fixos durante toda a rodada — as notas do campo em vigor. */
    opcoes: ChoiceOption[];
    /**
     * Tocar o arpejo inteiro ao completar, em vez de só a última nota.
     *
     * Declarado aqui e não deduzido: o Player tentava inferir isto do som (`groups.length ===
     * posicoes.length`), condição que é **sempre verdadeira** — então o parâmetro que o Paulo pediu
     * desligado por padrão tocava sempre, e quem o pegou foi o guarda `configuracoes-vivas`, que
     * acusa configuração que a tela oferece e ninguém lê.
     */
    ouvirNoFim?: boolean;
    /**
     * A região em jogo, quando ela é fixa: o braço inteiro continua desenhado e o que está fora
     * dela aparece apagado. Ver `Fretboard.foco` — nunca se recorta o braço.
     */
    foco?: readonly [number, number];
    /**
     * O **centro tonal em vigor**, em texto curto ("Dó maior").
     *
     * Vem do item porque só ele sabe: com tonalidade livre a tônica é sorteada por ele, e no modo de
     * foco — onde a moldura do app desaparece — esta é a única pista do que está soando. Sem ela a
     * pessoa nomearia graus de um campo que não sabe qual é.
     */
    rotulo?: string;
  };

/** Uma posição do arpejo no braço, com a classe de altura que a responde. */
export interface PosicaoDoMapa {
  corda: number;
  casa: number;
  /** A altura real da posição — a casa daquela corda. É ela que o braço desenha. */
  midi: number;
  /** A classe de altura: é ela que o botão de nome responde, em qualquer oitava. */
  pc: number;
  /**
   * **A altura que SOA**, que pode não ser a da posição.
   *
   * Existe por causa do alto-falante de celular, e o Paulo relatou em 15/11: *"o som está meio
   * bugado... está dando umas craqueladas"* no aparelho, sem fone, enquanto no PC estava certo.
   *
   * Medido: num Mi1 (41 Hz) **0%** da energia está acima de 300 Hz, que é onde um alto-falante
   * desses começa a reproduzir. O cone se move sem produzir som, e o que se ouve é o esforço dele.
   * A fundamental precisa passar de ~300 Hz: Lá3 (220 Hz) ainda dá 3–10%, e Mi4 (330 Hz) dá 100%.
   *
   * O desenho **não muda** — a casa é a casa. Só o som sobe por oitavas, e no `mapa-do-braco` isso
   * é inofensivo porque a pergunta é *qual nota*, não *qual altura*: ouvir o Mi1 como Mi4 continua
   * confirmando "é um mi". Num item de ouvido seria destrutivo, e por isso isto é do item.
   */
  soa: number;
}

/**
 * **Notas de APOIO numa superfície de resposta**: dadas, não perguntadas.
 *
 * É a nota de referência de um exercício de ouvido, por exemplo. Ela soa antes da pergunta e a
 * pessoa precisa **ver onde ela está** — num braço, saber que o dó de referência é a casa 8 da
 * terceira corda é metade do trabalho de achar o resto. O Paulo pediu isto em 13/11, em três telas:
 * *"no braço do baixo, ainda tem que ter alguma indicação visual de qual nota tocou como
 * referencia"* e *"na pauta tambem ainda precisa mostrar a nota de referencia"*.
 *
 * Aparece na cor fraca, com o nome escrito, e **nunca conta como resposta**: a conferência não a
 * conhece. Quem desenha é o Player, que já sabe a afinação e a clave da superfície.
 */
export interface Apoio {
  /** As alturas a mostrar. */
  midis: number[];
  /** O nome de cada uma, para a marca não ser um ponto misterioso. */
  rotulos?: Record<number, string>;
}

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
  /**
   * Este pedaço **é o gabarito**, e ouvi-lo libera a autoavaliação (ver `playParte`).
   *
   * O id `resposta` já dizia isso, e basta onde o gabarito é um botão só. Em `ouvido-intervalo`
   * audiando, o gabarito são as notas **uma de cada vez** — um botão por nota, a pedido do Paulo em
   * 18/11 —, e aí não há um id único para marcar. Qual delas conferir é escolha de quem estuda.
   */
  gabarito?: boolean;
}

export interface Question {
  prompt: string;
  visual: Visual;
  surface: Surface;
  expected: Expected;
  sound?: SoundContent; // tocado ao mostrar (ouvido) ou ao responder (visual)
  autoplay?: boolean;
  reveal: string; // a resposta certa, por extenso
  /**
   * **Apresentação desta pergunta**, por cima do perfil, do item e das configurações.
   *
   * Existe desde 19/11, para o timbre **sorteado a cada pergunta** do `ouvido-intervalo`: o perfil
   * e as configurações são escolhas que valem para a rodada inteira, e sortear a cada pergunta é,
   * por definição, propriedade da pergunta. Camada última de propósito — quando a pessoa pede
   * sorteio, é o sorteio que ela quer ver valer.
   */
  presentation?: Partial<Presentation>;
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
  /**
   * As opções que a TELA oferece, quando elas dependem de outras configurações.
   *
   * `options` é a lista completa — o que existe e o que os atalhos podem declarar, e é contra ela que
   * os testes validam. `opcoesDe` é o recorte que faz sentido **agora**, dadas as outras escolhas.
   *
   * Nasceu de um defeito que o Paulo relatou três vezes seguidas, cada vez de um ângulo: a oitava da
   * referência em `ouvido-tecla` dependia da superfície de resposta, e `options` não conhecia a
   * superfície. Primeiro a lista saía do instrumento do PERFIL (e faltava dó2 no braço do baixo);
   * depois virou a união de todos os alcances (e aí sobravam dó4 e dó5 no braço do baixo, que ao
   * serem clicados não mudavam nada). As duas versões ofereciam o que não acontecia — e é isso que
   * este campo existe para impedir.
   */
  opcoesDe?: (s: Record<string, SettingValue>) => SettingOption[];
  /**
   * **Um aviso sob o controle**, quando o valor escolhido não é o que vale.
   *
   * Nasceu em 14/11 com a região do braço do `mapa-do-braco`: fixando as casas 5 a 10, uma abertura
   * de mão de 6 casas não cabe, e o item a aperta. Apertar em silêncio é o defeito que o Paulo já
   * apontou duas vezes ("mudei pra 2 e ele não muda"), então o chip continua mostrando a escolha
   * dele e esta linha diz o que está em vigor.
   *
   * Devolve a mensagem já traduzida, ou `null` quando não há o que avisar.
   */
  aviso?: (s: Record<string, SettingValue>) => string | null;
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
   * **Valores iniciais que dependem do contexto** — hoje, do instrumento do perfil.
   *
   * Entrou em 14/11, quando o Paulo apontou uma indireção que o app repetia em sete itens: a opção
   * *"Meu instrumento"*. Nas palavras dele: *"o parametro instrumento deve começar como sendo o do
   * perfil, sim, por conveniencia. mas que fique marcado violão se o instrumento do perfil for
   * violão. entende que não tem sentido ter essa configuração?"*
   *
   * Tem toda razão, e o problema é de informação: um chip marcado "Meu instrumento" **não diz qual
   * é**. Quem abre a tela precisa saber o que vai acontecer, e "violão" diz; "meu instrumento"
   * manda a pessoa lembrar de uma configuração que está em outra tela. O valor `auto` existia só
   * para o item poder cair no perfil — e isso é trabalho do valor inicial, não de uma opção na
   * lista.
   *
   * `defaults` segue sendo a declaração estática (os testes e os atalhos a usam); isto sobrepõe o
   * que o contexto resolve.
   */
  defaultsDo?: (ctx: Ctx) => Record<string, SettingValue>;
  /**
   * **A identidade da pergunta para o anti-eco**, quando ela é mais rica que a resposta.
   *
   * O `sortearSemEco` do Player evita repetir a RESPOSTA, e isso serve para quase tudo: duas
   * perguntas com a mesma resposta são a mesma pergunta. O `mapa-do-braco` é a exceção — ali duas
   * perguntas podem pedir as mesmas quatro notas (a resposta) **em posições completamente
   * diferentes do braço** (a pergunta), e é justamente variar a posição que o exercício existe para
   * fazer. O Paulo foi explícito: *"cuidado pra nao fazer com que o arpejo de do maior comece
   * sempre só na 3a casa da corda lá"*.
   *
   * Sem isto, a alternativa era o item manter memória própria e duplicar o mecanismo de rejeição
   * por idade que já existe. Um campo opcional reusa o mecanismo inteiro.
   */
  assinatura?: (q: Question) => string;
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
