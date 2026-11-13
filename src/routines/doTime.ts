// As rotinas que já vêm no app (F3-6).
//
// ⚠️ **São PROPOSTA, não curadoria fechada.** O conteúdo musical de uma rotina do time é decisão de
// produto (decisão 51); estas foram escritas por IA a pedido do Paulo, para ele revisar. Enquanto
// não forem revisadas elas ficam em `rascunho`, e **ninguém as vê** fora do modo de revisão
// (decisão 91). O que está em revisão está listado em `docs/revisao-pendente.md`.
//
// **Adotar uma cria uma cópia da pessoa** (decisão 9), e é a cópia que evolui — a original nunca
// muda. Quem faz isso é `copiarRotina`, que já existe.
//
// Por que estas cinco, e não outras: cada uma responde uma frase diferente de "o que eu estudo
// agora?". Uma é para quando não há instrumento à mão; uma é para morar numa tonalidade; uma é para
// o braço; duas são as duas aberturas de sessão mais comuns (ouvido e leitura). Fora disso é
// repetição.
import { ALL_CHORDS, ALL_SCALES, TODOS_OS_INTERVALOS } from '../catalog/helpers';
import type { Publicacao } from '../catalog/publicacao';
import { RASCUNHO } from '../catalog/publicacao';

import type { MessageKey, Translate } from '../i18n';
import { CICLO_DE_QUARTAS } from './rotacao';
import type { Etapa, Instancia, PoliticaDeCiclagem, Rotina } from './types';
import { FORMATO_ROTINA } from './types';

/** Uma etapa escrita à mão: o que tocar, como configurar, e quanto tempo sugerir. */
interface EtapaEscrita {
  /** Uma instância é um item com configuração; mais de uma faz a etapa ciclar (decisão 7). */
  instancias: Instancia[];
  minutos?: number;
  politica?: PoliticaDeCiclagem;
  /** Por que esta etapa está aqui. Não aparece na tela: é para o Paulo revisar. */
  porque: string;
}

export interface RotinaDoTime {
  id: string;
  nome: MessageKey;
  sobre: MessageKey;
  modo: Rotina['modo'];
  embaralhar?: boolean;
  /** Só tonalidade, por ora: é o eixo que todas as etapas destas rotinas respeitam. */
  rotacaoDeTonalidade?: boolean;
  etapas: EtapaEscrita[];
  publicacao: Publicacao;
}

const i = (itemId: string, settings: Record<string, unknown> = {}, params?: Instancia['params']): Instancia =>
  ({ itemId, settings, ...(params ? { params } : {}) });

/** Só as notas da tonalidade. Depende de `respeita: ['material']` no item — conferido em teste. */
const DIATONICO = { material: 'diatonico' } as const;

/**
 * Dó maior nas etapas de percepção (Paulo, 09/11/2026): fixar a tonalidade emula as condições
 * reais de música melhor que sortear um centro a cada pergunta.
 *
 * Repetido aqui, e não herdado do atalho de entrada do item: etapa de rotina **manda** nos
 * parâmetros de prática (decisão 87), e o `Player` só aplica a entrada do item quando a etapa não
 * trouxe nada.
 */
const EM_DO = { key: { tonic: 0, mode: 'maior' } } as const;

export const ROTINAS_DO_TIME: readonly RotinaDoTime[] = [
  // ---------------------------------------------------------------------------------------------
  // AS QUATRO DE "NÃO ESTOU COM O INSTRUMENTO"
  //
  // Elas existem porque a maior parte do tempo de estudo possível não é na frente do instrumento, e
  // porque **cada uma pede uma coisa diferente do mundo**: uma só precisa de ouvido, uma só de olhos,
  // uma de olhos e dedos na tela, uma de fone. Juntar as quatro numa só "de bolso" era o erro —
  // metade das etapas não cabia no bolso de verdade.
  // ---------------------------------------------------------------------------------------------
  {
    id: 'de-bolso', nome: 'doTime.bolso.nome', sobre: 'doTime.bolso.sobre',
    modo: 'livre', publicacao: RASCUNHO,
    // **Só o ciclo sem tela**, em quatro variações. É a única rotina que roda com o celular no bolso:
    // nenhuma etapa pede olhar nem responder. O rodízio é por OBJETO, e o tempo de pensar cresce com
    // a dificuldade do que está sendo tocado.
    etapas: [
      { porque: 'intervalos e acordes: o par de sempre, com 6 s para pensar',
        instancias: [i('maos-livres', { objetos: ['intervalos', 'acordes'], pensar: 6, anuncio: 'voz' })] },
      { porque: 'escalas e modos pedem mais tempo — a frase inteira tem de caber na cabeça antes da resposta',
        instancias: [i('maos-livres', { objetos: ['escalas', 'modos'], pensar: 10, anuncio: 'voz' })] },
      { porque: 'graus: ouvir a tônica e situar a frase dentro dela, que é o mais difícil dos seis',
        instancias: [i('maos-livres', { objetos: ['graus'], pensar: 12, anuncio: 'ambos' })] },
      { porque: 'tudo junto, rápido: é o modo de manutenção, para quando os outros três já estão fáceis',
        instancias: [i('maos-livres', { objetos: ['intervalos', 'acordes', 'escalas', 'modos', 'graus', 'notas'], pensar: 5, anuncio: 'voz' })] },
    ],
  },
  {
    id: 'ouvido-no-fone', nome: 'doTime.fone.nome', sobre: 'doTime.fone.sobre',
    modo: 'livre', publicacao: RASCUNHO,
    // Revisada com o Paulo em 09/11/2026, etapa por etapa. Três mudanças de fundo:
    //
    // 1. **tudo em dó maior.** Princípio dele: fixar tonalidade emula as condições reais de
    //    música. Vem do `EM_DO_MAIOR` dos itens, aqui repetido na etapa porque etapa de rotina
    //    manda nos parâmetros (decisão 87) e não herda o atalho de entrada do item;
    // 2. **tudo ligado** em qualidades e escalas: eram duas etapas cada (tríades/tétrades,
    //    escalas/modos) e ele pediu "só uma etapa completa pra isso ja basta";
    // 3. **o ritmo saiu** — foi para a rotina de percepção rítmica.
    etapas: [
      // Primeiro porque é a porta: uma nota, com dó de referência, respondida no teclado.
      { porque: 'ouvir uma nota contra o dó e achá-la no teclado: a porta de entrada do ouvido',
        instancias: [i('ouvido-tecla', { referencia: true, pretas: true }, EM_DO)] },
      // Melódicos e harmônicos SEPARADOS, a pedido dele: são dois ouvidos. O harmônico não tem
      // ordem no tempo para se apoiar, e por isso é bem mais difícil que o melódico.
      { porque: 'intervalos melódicos, subindo: a unidade de tudo',
        instancias: [i('ouvido-intervalo', { intervalos: TODOS_OS_INTERVALOS, direcao: 'sobe' }, EM_DO)] },
      { porque: 'os mesmos intervalos tocados juntos: sem ordem no tempo, o ouvido tem de ouvir a fusão',
        instancias: [i('ouvido-intervalo', { intervalos: TODOS_OS_INTERVALOS, direcao: 'juntas' }, EM_DO)] },
      { porque: 'todas as qualidades de acorde, sobre a mesma fundamental: sobra a cor',
        instancias: [i('ouvido-acorde', { tipos: ALL_CHORDS, arpejo: true, duracao: 2 }, EM_DO)] },
      // Entrou em 12/11/2026, a pedido dele ("não tínhamos um exercício de reconhecer graus do
      // campo harmônico?"). Vem colada na de qualidades porque é a mesma pergunta mudando de eixo:
      // ali a cor sobre a mesma fundamental, aqui o LUGAR dentro de um campo, depois da cadência.
      { porque: 'os mesmos acordes, agora dentro de um campo: a pergunta deixa de ser a cor e vira a função',
        instancias: [i('ouvido-campo', { campo: 'maior', tetrades: true, contexto: 'ii-V-I' }, EM_DO)] },
      { porque: 'todas as escalas, subindo e descendo — é descendo que as duas melódicas se separam',
        instancias: [i('ouvido-escala', { tipos: ALL_SCALES, direcao: 'ambos' }, EM_DO)] },
      // Duas etapas do mesmo item, a pedido dele: uma nota e três notas. Sem alternativas nas
      // duas — escolhendo entre todos os graus, que é o padrão novo do item.
      { porque: 'uma nota sobre o acorde da tônica: que grau é, sem alternativas para descartar',
        instancias: [i('ouvido-celulas', { escala: 'maior', tamanho: '1', graus: ['1'], resposta: 'todos' }, EM_DO)] },
      { porque: 'três notas sobre o mesmo acorde: agora é o desenho inteiro, e ainda sem alternativas',
        instancias: [i('ouvido-celulas', { escala: 'maior', tamanho: '3', graus: ['1'], resposta: 'todos' }, EM_DO)] },
      // Entrou em 10/11/2026, a pedido dele. Vem depois das duas de melodia na harmonia porque é
      // vizinha delas — ali o desenho é uma célula contra um acorde, aqui é o MESMO desenho andando
      // pela escala, e a pergunta deixa de ser que graus são e passa a ser onde começaram.
      //
      // Pentatônica de quatro notas: o padrão do item, e o recorte que ele escolheu.
      { porque: 'o mesmo desenho começando em cada grau: onde ele começou desta vez?',
        instancias: [i('reconhecer-padroes-escala', { escala: 'penta-maior', tamanho: '4', contexto: 'triade' }, EM_DO)] },
      // No fim, por decisão dele. É a única etapa em que ninguém confere nada: a pessoa canta e
      // ela mesma julga. Depois de oito etapas de resposta certa e errada, fechar cantando é bom.
      { porque: 'audiar: ouvir por dentro antes de conferir — e aqui quem julga é você',
        instancias: [i('audiar', {}, EM_DO)] },
    ],
  },
  {
    id: 'mapear-braco', nome: 'doTime.braco.nome', sobre: 'doTime.braco.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    // **Uma só.** Eram duas — "na rua" e "com o instrumento" —, e a divisão entre elas era **contexto
    // puro**, que é justamente o que não define uma rotina: o contexto é do momento, e quem decide se
    // dá para fazer isto no ônibus é quem está praticando. O seletor de contexto da Praticar esmaece a
    // etapa que não cabe **com o motivo**, e é assim que a mesma rotina serve em casa e na rua.
    //
    // O que entra segue o critério do Paulo (decisão 109): **trabalha a posição das notas no braço.**
    etapas: [
      { minutos: 5, porque: 'reconhecer a casa que o app aponta: mais fácil que achar, e aquece a vista',
        instancias: [i('nota-no-instrumento', { direcao: 'identificar', instrumento: 'auto', casas: '0-5' })] },
      { minutos: 8, politica: 'ordem', porque: 'achar a nota, rodiziando a região: casa, meio do braço, braço inteiro',
        instancias: [
          i('nota-no-instrumento', { direcao: 'achar', instrumento: 'auto', casas: '0-5' }),
          i('nota-no-instrumento', { direcao: 'achar', instrumento: 'auto', casas: '5-9' }),
          i('nota-no-instrumento', { direcao: 'achar', instrumento: 'auto', casas: '0-12' }),
        ] },
      // **Identificar e construir, em rodízio** — o Paulo pediu assim. São habilidades diferentes, e
      // alternar entre elas gasta metade do tempo que fazer as duas toda vez.
      { minutos: 6, politica: 'ordem', porque: 'o intervalo nas duas direções: reconhecer o desenho numa vez, construí-lo na outra',
        instancias: [
          i('intervalo-no-instrumento', { direcao: 'identificar', instrumento: 'auto' }),
          i('intervalo-no-instrumento', { direcao: 'construir', instrumento: 'auto' }),
        ] },
      // Formas móveis, nas cinco primeiras casas: é a forma relativa que transfere, e não o
      // gavetão numa posição fixa. As tabelas à mão saíram em 09/11/2026 — o desenho vem do
      // gerador de `theory/digitacoes.ts`.
      { minutos: 5, porque: 'desenho de acorde no braço, formas móveis',
        instancias: [i('acorde-no-instrumento', { instrumento: 'violao', soltas: false, casas: '0-5' })] },
      // A única que pede o instrumento de verdade. Quem está na rua pula; quem está em casa tem aqui
      // a parte que a tela não faz.
      { minutos: 6, porque: 'achar a nota no braço de verdade: a única etapa que a tela não consegue fazer por você',
        instancias: [i('no-instrumento', { esperar: 8, ouvirAntes: true })] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  {
    id: 'percepcao-ritmica', nome: 'doTime.ritmica.nome', sobre: 'doTime.ritmica.sobre',
    // Nasce rascunho como as outras cinco. O Paulo pediu para não VER a distinção, e o selo saiu da
    // tela em 10/11/2026 — a declaração continua como registro de que a revisão musical dele não
    // passou por aqui ainda.
    modo: 'livre', publicacao: RASCUNHO,
    // Rotina nova (10/11/2026), com o desenho do Paulo. O "qual ritmo tocou" saiu da rotina do fone
    // e veio para cá — lá ele era a única etapa que não era melódica nem harmônica.
    //
    // As quatro etapas de leitura são as que ele pediu, variando os RECURSOS: "1 - apenas
    // pontuadas, 2 - apenas quialteras, 3 - pontuadas, sincopes e ligaduras, 4 - tudo". Elas só
    // existem porque o item `ritmo` passou a declarar o atalho — antes a configuração morava toda
    // dentro da tela, e as quatro etapas abririam no mesmo estado.
    etapas: [
      { porque: 'ouvir o ritmo e reconhecê-lo escrito: entra antes de ler, porque ouvir é mais fácil',
        instancias: [i('ritmo-ouvido', { figuras: ['basico', 'semis'] })] },
      { porque: 'ler só pontuadas: a figura que mais engana quem conta de cabeça',
        instancias: [i('ritmo', { preset: 'pontuadas' })] },
      { porque: 'ler só quiálteras: a divisão que não cabe na conta binária',
        instancias: [i('ritmo', { preset: 'quialteras' })] },
      { porque: 'pontuadas, síncopes e ligaduras juntas — é onde elas se confundem',
        instancias: [i('ritmo', { preset: 'ligaduras' })] },
      { porque: 'tudo junto, com as nove células essenciais: o estado final',
        instancias: [i('ritmo', { preset: 'essenciais' })] },
    ],
  },
  {
    id: 'internalizar-tonalidade', nome: 'doTime.tonalidade.nome', sobre: 'doTime.tonalidade.sobre',
    modo: 'guiado', rotacaoDeTonalidade: true, publicacao: RASCUNHO,
    // A rotina que melhor mostra o que o Clave é: morar numa tonalidade e atravessá-la em várias
    // frentes. Em rotação MANUAL — quem sabe se internalizou é quem está estudando (decisão 38).
    etapas: [
      { minutos: 5, porque: 'primeiro o som da tonalidade: três notas dela, para a tônica virar referência',
        instancias: [i('ouvido-celulas', { escala: 'maior', tamanho: '3' })] },
      { minutos: 5, porque: 'as notas dela no braço, só as diatônicas, na região de casa',
        instancias: [i('nota-no-instrumento', { direcao: 'achar', instrumento: 'auto', casas: '0-5' }, DIATONICO)] },
      { minutos: 5, porque: 'a mesma tonalidade noutra região — é o que liga as partes do braço',
        instancias: [i('nota-no-instrumento', { direcao: 'identificar', instrumento: 'auto', casas: '5-9' }, DIATONICO)] },
      { minutos: 5, porque: 'os acordes que nascem dela, de ouvido',
        instancias: [i('ouvido-acorde', { tipos: ['maior', 'menor', 'm7', '7M', '7'], arpejo: true, duracao: 2 })] },
      { minutos: 10, porque: 'fecha tocando dentro dela, com a harmonia rodando',
        instancias: [i('backing')] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  /**
   * A rotina que o Paulo pediu para si, em 10/11/2026: *"eu vou querer incluir isso em uma rotina
   * minha: Reconhecer notas e acordes no violão e no piano · Leitura de partitura · Melodia na
   * pauta (audiar uma melodia de poucas notas)"*.
   *
   * ⚠️ **A terceira parte não existe ainda** e é decisão dele: audiar uma melodia ESCRITA de poucas
   * notas. Hoje `nota-na-pauta` audia **uma** nota; várias notas na pauta é outro objeto (melodia,
   * não nota), e pela decisão 15 a pergunta é se isso é parâmetro de um item ou item novo — produto,
   * não implementação. Enquanto ele não decide, a rotina fecha com a nota solta audiada, que é a
   * parte verdadeira do que ele pediu.
   *
   * O instrumento de cada etapa é **declarado**, não `auto`: a rotina diz "no violão e no piano",
   * então ela fixa os dois em etapas próprias em vez de seguir o perfil.
   */
  {
    id: 'notas-acordes-e-leitura', nome: 'doTime.notasAcordes.nome', sobre: 'doTime.notasAcordes.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    etapas: [
      { minutos: 4, porque: 'as notas no braço, o instrumento dele: o mapa antes da harmonia',
        instancias: [i('nota-no-instrumento', { direcao: 'identificar', instrumento: 'violao', casas: '0-12' })] },
      { minutos: 4, porque: 'as mesmas notas no piano, onde a oitava é visível e o braço não ajuda',
        instancias: [i('nota-no-instrumento', { direcao: 'identificar', instrumento: 'piano', pretas: true, oitavas: '2' })] },
      { minutos: 5, porque: 'os acordes no braço, pelas formas que se tocam de verdade',
        instancias: [i('acorde-no-instrumento', { direcao: 'identificar', instrumento: 'violao', tipos: ['maior', 'menor', 'dim', 'aum'], casas: '0-12' })] },
      { minutos: 5, porque: 'os mesmos acordes no piano: a mesma harmonia com outra geometria',
        instancias: [i('acorde-no-instrumento', { direcao: 'identificar', instrumento: 'piano', tipos: ['maior', 'menor', 'dim', 'aum'] })] },
      { minutos: 5, porque: 'ler altura na pauta, sem ritmo para dividir a atenção',
        instancias: [i('nota-na-pauta', { direcao: 'ler', claves: ['sol'], acidentes: false })] },
      { minutos: 5, porque: 'a leitura corrida, onde altura e ritmo voltam a andar juntos',
        instancias: [i('leitura')] },
      // Fecha audiando: ver a nota escrita e ouvi-la por dentro antes de conferir. É a parte da
      // melodia que já existe hoje — uma nota.
      { minutos: 4, porque: 'audiar o que está escrito: ouvir por dentro antes de conferir',
        instancias: [i('nota-na-pauta', { direcao: 'audiar', claves: ['sol'], acidentes: false }, EM_DO)] },
    ],
  },
  {
    id: 'leitura-diaria', nome: 'doTime.leitura.nome', sobre: 'doTime.leitura.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    // Altura e ritmo SEPARADOS, que é como se aprende a ler: juntar os dois cedo demais trava os dois.
    etapas: [
      { minutos: 5, porque: 'altura só, numa clave só, sem acidentes',
        instancias: [i('nota-na-pauta', { direcao: 'ler', claves: ['sol'], acidentes: false })] },
      { minutos: 5, porque: 'ritmo só, no nível de entrada (semínima e colcheias)',
        instancias: [i('ritmo-ouvido', { figuras: ['basico'] })] },
      { minutos: 5, porque: 'os dois juntos, no ambiente de leitura corrida',
        instancias: [i('leitura')] },
    ],
  },
];

/**
 * As rotinas do time como `Rotina` de verdade, prontas para o executor e o editor.
 *
 * **Ids determinísticos**, e não `novoId()`: a rotina do time é relida a cada abertura, e id novo a
 * cada leitura quebraria o `origem.rotinaId` de quem adotou e a chave de `ultimaUsada`.
 */
export function rotinasDoTime(t: Translate): Rotina[] {
  return ROTINAS_DO_TIME.map(r => ({
    formato: FORMATO_ROTINA,
    id: `time:${r.id}`,
    nome: t(r.nome),
    notas: t(r.sobre),
    modo: r.modo,
    embaralhar: r.embaralhar ?? false,
    params: {},
    doTime: true,
    ...(r.rotacaoDeTonalidade
      ? { rotacao: {
          param: 'tonalidade' as const,
          valores: CICLO_DE_QUARTAS.map(tonic => ({ tonic, mode: 'maior' as const })),
          posicao: 0,
          avanco: { kind: 'manual' as const },
          visitas: [],
        } }
      : {}),
    etapas: r.etapas.map((e, n): Etapa => ({
      id: `time:${r.id}:${n + 1}`,
      instancias: e.instancias,
      politica: e.politica ?? 'ordem',
      ...(e.minutos ? { segundosSugeridos: e.minutos * 60 } : {}),
    })),
  }));
}

/** Procura por id (`time:de-bolso`). Serve ao executor, que só recebe o id na URL. */
export const rotinaDoTimePorId = (id: string) => ROTINAS_DO_TIME.find(r => `time:${r.id}` === id);
