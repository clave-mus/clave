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

/**
 * Revisadas pelo Paulo em 03/11/2026, **lendo**: ordem das etapas, durações e o que entra.
 *
 * Só as três que não dependem de ouvir nada. *Internalizar uma tonalidade* e *Aquecimento de ouvido*
 * ficaram em rascunho de propósito: as duas vivem de som, e aprovar sem ouvir seria afirmar uma
 * revisão que não aconteceu — que é exatamente o que o portão da decisão 91 existe para impedir.
 */
const LIDA_E_APROVADA: Publicacao = { estado: 'publicado', revisadoEm: '2026-11-03', por: 'Paulo' };
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
  {
    id: 'de-bolso', nome: 'doTime.bolso.nome', sobre: 'doTime.bolso.sobre',
    modo: 'livre', embaralhar: true, publicacao: LIDA_E_APROVADA,
    etapas: [
      { porque: 'intervalos de sempre: oitava, quinta, quarta e as duas terças, subindo',
        instancias: [i('ouvido-intervalo', { intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' })] },
      { porque: 'tríades e as três tétrades que aparecem em tudo; arpejado, que é o que dá para ouvir no ônibus',
        instancias: [i('ouvido-acorde', { tipos: ['maior', 'menor', '7M', '7', 'm7'], arpejo: true, duracao: 2 })] },
      { porque: 'as duas claves, sem acidentes: é leitura de manutenção, não de estudo novo',
        instancias: [i('que-nota-e-essa', { superficie: 'pauta', claves: ['sol', 'fa'], extensao: 'pauta', acidentes: false })] },
      { porque: 'teoria em texto, o único item que funciona sem som nenhum',
        instancias: [i('quiz-teoria', { temas: ['graus', 'campo', 'tonalidades'] })] },
      { porque: 'o braço na cabeça, sem o braço na mão: primeiras cinco casas',
        instancias: [i('que-nota-e-essa', { superficie: 'braco', instrumento: 'auto', casas: '0-5' })] },
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
    id: 'mapear-braco', nome: 'doTime.braco.nome', sobre: 'doTime.braco.sobre',
    modo: 'guiado', publicacao: LIDA_E_APROVADA,
    etapas: [
      { minutos: 5, porque: 'reconhecer a casa que o app aponta: mais fácil que achar, e aquece a vista',
        instancias: [i('que-nota-e-essa', { superficie: 'braco', instrumento: 'auto', casas: '0-5' })] },
      // A etapa com RODÍZIO: a mesma pergunta, em três partes do braço, uma por execução. É o caso
      // principal do rodízio — variantes do MESMO item, não itens diferentes.
      { minutos: 10, politica: 'ordem', porque: 'achar a nota, rodiziando a região: casa, meio do braço, braço inteiro',
        instancias: [
          i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '0-5' }),
          i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '5-9' }),
          i('ache-a-nota', { superficie: 'braco', instrumento: 'auto', casas: '0-12' }),
        ] },
      { minutos: 5, porque: 'distância entre duas casas: é o que transforma nota solta em desenho',
        instancias: [i('que-intervalo-e-esse', { superficie: 'braco', instrumento: 'auto' })] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  {
    id: 'aquecimento-ouvido', nome: 'doTime.ouvido.nome', sobre: 'doTime.ouvido.sobre',
    modo: 'guiado', publicacao: RASCUNHO,
    // Doze minutos, três frentes. Curta de propósito: é para abrir a sessão, não para ser a sessão.
    etapas: [
      { minutos: 5, porque: 'intervalo é a unidade; vem primeiro',
        instancias: [i('ouvido-intervalo', { intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' })] },
      { minutos: 4, porque: 'as quatro tríades, incluindo as duas simétricas que confundem',
        instancias: [i('ouvido-acorde', { tipos: ['maior', 'menor', 'dim', 'aum'], arpejo: true, duracao: 2 })] },
      { minutos: 3, porque: 'escala inteira, subindo e descendo: a menor harmônica entra por causa da sensível',
        instancias: [i('ouvido-escala', { tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'ambos' })] },
    ],
  },

  // ---------------------------------------------------------------------------------------------
  {
    id: 'leitura-diaria', nome: 'doTime.leitura.nome', sobre: 'doTime.leitura.sobre',
    modo: 'guiado', publicacao: LIDA_E_APROVADA,
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
