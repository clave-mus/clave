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
    id: 'teoria-no-silencio', nome: 'doTime.silencio.nome', sobre: 'doTime.silencio.sobre',
    modo: 'livre', publicacao: RASCUNHO,
    // **Nenhuma etapa faz nem recebe som.** São os cinco itens do catálogo com `audio: false`, e é a
    // rotina que cabe na sala de espera, na aula chata e no fone esquecido em casa.
    etapas: [
      { porque: 'o grau de uma nota na tonalidade, e qual modo é qual: a base de todo o resto',
        instancias: [i('teoria-graus', { temas: ['graus', 'modos'] })] },
      { porque: 'de que notas um acorde é feito — o que a cifra quer dizer',
        instancias: [i('teoria-acordes')] },
      { porque: 'que acorde cai em cada grau: é o que liga teoria a tocar junto',
        instancias: [i('teoria-campo')] },
      { porque: 'tonalidade, armadura e relativa, as três de uma vez',
        instancias: [i('teoria-tonalidades')] },
      { porque: 'intervalo sem pauta e sem som: o único lugar do catálogo onde isso cabe',
        instancias: [i('teoria-intervalos', { temas: ['intervalo-nomeado'] })] },
      { porque: 'reconhecer a armadura escrita, que é o mesmo assunto pela via da leitura',
        instancias: [i('pauta-armadura', { claves: ['sol', 'fa'], modo: 'ambos', max: '4' })] },
    ],
  },
  {
    id: 'instrumento-na-rua', nome: 'doTime.rua.nome', sobre: 'doTime.rua.sobre',
    modo: 'livre', publicacao: RASCUNHO,
    // Visualização nas **três superfícies**, nenhuma pedindo o instrumento. Modo livre e com o botão
    // de pular à mão: a ideia é atravessar o que serve e passar o resto para o fim.
    etapas: [
      { porque: 'nota no braço, na região de casa',
        instancias: [i('que-nota-e-essa', { superficie: 'braco', instrumento: 'auto', casas: '0-5' })] },
      { porque: 'achar a nota no braço, braço inteiro: é o mais difícil dos quatro de braço',
        instancias: [i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '0-12' })] },
      { porque: 'nota no teclado, duas oitavas — o teclado é o mapa que todo mundo lê, mesmo quem não toca',
        instancias: [i('que-nota-e-essa', { superficie: 'teclado', pretas: true, oitavas: '2' })] },
      { porque: 'achar a tecla, que é o mesmo mapa na direção contrária',
        instancias: [i('ache-a-nota', { superficie: 'teclado', pretas: true })] },
      { porque: 'nota na pauta, nas duas claves: a terceira superfície',
        instancias: [i('que-nota-e-essa', { superficie: 'pauta', claves: ['sol', 'fa'], extensao: 'pauta', acidentes: false })] },
      { porque: 'desenho de acorde no braço e no teclado, em rodízio',
        politica: 'ordem',
        instancias: [
          i('que-acorde-e-esse', { superficie: 'braco', formas: 'abertos' }),
          i('que-acorde-e-esse', { superficie: 'teclado', tipos: ['maior', 'menor', '7', 'm7'] }),
        ] },
    ],
  },
  {
    id: 'ouvido-no-fone', nome: 'doTime.fone.nome', sobre: 'doTime.fone.sobre',
    modo: 'livre', publicacao: RASCUNHO,
    // Os seis itens de ouvido **interativos** (a pessoa responde). Precisam de fone e de uma mão, e é
    // por isso que não são "de bolso" — mas cabem inteiros num ônibus.
    etapas: [
      { porque: 'intervalos, subindo: a unidade de tudo',
        instancias: [i('ouvido-intervalo', { intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' })] },
      { porque: 'as quatro tríades e as três tétrades, em rodízio: tríades primeiro, tétrades depois',
        politica: 'ordem',
        instancias: [
          i('ouvido-acorde', { tipos: ['maior', 'menor', 'dim', 'aum'], arpejo: true, duracao: 2 }),
          i('ouvido-acorde', { tipos: ['7M', '7', 'm7', 'm7b5'], arpejo: true, duracao: 2 }),
        ] },
      { porque: 'escalas e modos, em rodízio: a menor harmônica entra pela sensível, os modos vêm depois',
        politica: 'ordem',
        instancias: [
          i('ouvido-escala', { tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'ambos' }),
          i('ouvido-escala', { tipos: ['dorico', 'frigio', 'lidio', 'mixolidio'], direcao: 'sobe' }),
        ] },
      { porque: 'graus dentro da tonalidade: ouvir a tônica e situar a frase',
        instancias: [i('ouvido-celulas', { escala: 'maior', tamanho: '3' })] },
      { porque: 'nota pelo nome, com referência: o único de ouvido que responde no teclado',
        instancias: [i('ouvido-tecla', { referencia: true, pretas: false })] },
      { porque: 'ritmo de ouvido, nível de entrada',
        instancias: [i('ritmo-ouvido', { nivel: 'duas' })] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  // AS DUAS DO BRAÇO
  //
  // A mesma porta carro-chefe, partida pelo que o mundo exige: uma cabe no ônibus, a outra pede o
  // baixo na mão. Eram uma só, e isso obrigava a pessoa a pular metade em qualquer dos dois casos.
  // ---------------------------------------------------------------------------------------------
  {
    id: 'braco-na-rua', nome: 'doTime.bracoRua.nome', sobre: 'doTime.bracoRua.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    etapas: [
      { minutos: 5, porque: 'reconhecer a casa que o app aponta: mais fácil que achar, e aquece a vista',
        instancias: [i('que-nota-e-essa', { superficie: 'braco', instrumento: 'auto', casas: '0-5' })] },
      // O rodízio de região: a mesma pergunta, em três partes do braço, uma por execução.
      { minutos: 10, politica: 'ordem', porque: 'achar a nota, rodiziando a região: casa, meio do braço, braço inteiro',
        instancias: [
          i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '0-5' }),
          i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '5-9' }),
          i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '0-12' }),
        ] },
      { minutos: 5, porque: 'identificar a distância entre duas casas: é o que transforma nota solta em desenho',
        instancias: [i('que-intervalo-e-esse', { superficie: 'braco', instrumento: 'auto' })] },
      // Identificar e CONSTRUIR são habilidades diferentes, e a segunda é a que serve para tocar.
      { minutos: 5, porque: 'construir o intervalo: dada uma casa, achar a terça, a quinta e a sexta dela',
        instancias: [i('ache-a-nota', { superficie: 'braco', pedido: 'intervalo', intervalos: ['M3', 'J5', 'M6'], instrumento: 'auto', casas: '0-12' })] },
      { minutos: 5, porque: 'desenho de acorde no braço, formas abertas',
        instancias: [i('que-acorde-e-esse', { superficie: 'braco', formas: 'abertos' })] },
    ],
  },
  {
    id: 'braco-com-instrumento', nome: 'doTime.bracoInst.nome', sobre: 'doTime.bracoInst.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    // **O critério é do Paulo**, e é ele que define o que entra: *"mapear o braço é internalizar as
    // posições das notas no braço — então tudo que trabalhar isso pode estar incluso."*
    //
    // Aplicado, ele faz duas coisas. **Tira o drone**: afinar contra uma nota fixa trabalha ouvido e
    // entonação, não posição de nota. E **traz os exercícios de braço de tela**, que trabalham posição
    // diretamente — com o instrumento na mão eles ficam melhores, porque a pessoa acha a nota no braço
    // de verdade e só então confirma na tela. Aqui eles vão com o **braço inteiro**, que é o que dá
    // para alcançar sentado com o instrumento.
    etapas: [
      { minutos: 8, porque: 'achar a nota no braço de verdade: a única etapa que a tela não consegue fazer por você',
        instancias: [i('no-instrumento', { esperar: 8, ouvirAntes: true })] },
      { minutos: 5, porque: 'a distância entre duas casas, braço inteiro: toque as duas e ouça se o desenho bate',
        instancias: [i('que-intervalo-e-esse', { superficie: 'braco', instrumento: 'auto' })] },
      { minutos: 5, porque: 'construir o intervalo a partir de uma casa — com o instrumento, isso vira achar a nota e tocá-la',
        instancias: [i('ache-a-nota', { superficie: 'braco', pedido: 'intervalo', intervalos: ['M3', 'J5', 'M6'], instrumento: 'auto', casas: '0-12' })] },
      { minutos: 6, porque: 'padrões com metrônomo no braço: a posição sob pressão de tempo',
        instancias: [i('tecnica')] },
      { minutos: 6, porque: 'o braço dentro de uma tonalidade, com a harmonia rodando por baixo',
        instancias: [i('backing')] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  {
    id: 'internalizar-tonalidade', nome: 'doTime.tonalidade.nome', sobre: 'doTime.tonalidade.sobre',
    modo: 'guiado', rotacaoDeTonalidade: true, publicacao: RASCUNHO,
    // A rotina que melhor mostra o que o Clave é: morar numa tonalidade e atravessá-la em várias
    // frentes. Em rotação MANUAL — quem sabe se internalizou é quem está estudando (decisão 38).
    etapas: [
      { minutos: 5, porque: 'primeiro o som da tonalidade: três notas dela, para a tônica virar referência',
        instancias: [i('ouvido-celulas', { escala: 'maior', tamanho: '3' })] },
      { minutos: 5, porque: 'as notas dela no braço, só as diatônicas, na região de casa',
        instancias: [i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '0-5' }, DIATONICO)] },
      { minutos: 5, porque: 'a mesma tonalidade noutra região — é o que liga as partes do braço',
        instancias: [i('que-nota-e-essa', { superficie: 'braco', instrumento: 'auto', casas: '5-9' }, DIATONICO)] },
      { minutos: 5, porque: 'os acordes que nascem dela, de ouvido',
        instancias: [i('ouvido-acorde', { tipos: ['maior', 'menor', 'm7', '7M', '7'], arpejo: true, duracao: 2 })] },
      { minutos: 10, porque: 'fecha tocando dentro dela, com a harmonia rodando',
        instancias: [i('backing')] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  {
    id: 'aquecimento-ouvido', nome: 'doTime.ouvido.nome', sobre: 'doTime.ouvido.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    // **Oito minutos**, quatro frentes, dois minutos cada — o Paulo cortou de 15 para 8. E ele está
    // certo pelo nome: quinze minutos com quatro assuntos já era meia sessão, e aquecimento que ocupa
    // meia sessão compete com a sessão em vez de abrir ela.
    //
    // Dois minutos por frente é pouco de propósito: a pessoa pula o que não servir hoje e deixa o
    // resto para o fim, que é o que os dois botões do executor existem para permitir.
    etapas: [
      { minutos: 2, porque: 'intervalo é a unidade; vem primeiro',
        instancias: [i('ouvido-intervalo', { intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' })] },
      { minutos: 2, porque: 'as quatro tríades, incluindo as duas simétricas que confundem',
        instancias: [i('ouvido-acorde', { tipos: ['maior', 'menor', 'dim', 'aum'], arpejo: true, duracao: 2 })] },
      { minutos: 2, porque: 'escala inteira, subindo e descendo: a menor harmônica entra por causa da sensível',
        instancias: [i('ouvido-escala', { tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'ambos' })] },
      { minutos: 2, porque: 'os modos, dois minutos: dose de aquecimento, não de estudo',
        instancias: [i('ouvido-escala', { tipos: ['dorico', 'frigio', 'lidio', 'mixolidio'], direcao: 'sobe' })] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  {
    id: 'leitura-diaria', nome: 'doTime.leitura.nome', sobre: 'doTime.leitura.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    // Altura e ritmo SEPARADOS, que é como se aprende a ler: juntar os dois cedo demais trava os dois.
    etapas: [
      { minutos: 5, porque: 'altura só, numa clave só, sem acidentes',
        instancias: [i('que-nota-e-essa', { superficie: 'pauta', claves: ['sol'], extensao: 'pauta', acidentes: false })] },
      { minutos: 5, porque: 'ritmo só, no nível de entrada (semínima e colcheias)',
        instancias: [i('ritmo-ouvido', { nivel: 'duas' })] },
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
