// As cinco famílias da "tarefa com metrônomo": o que cada uma oferece de controle e que plano monta.
//
// Cada família é uma DECLARAÇÃO sobre o mesmo motor (decisão 15): não há uma tela por família. O que
// muda é só isto — os controles, o plano e, no deslocamento rítmico, o eixo de avanço manual.
//
// Sem interface: nada aqui importa React, para poder ser testado.
import type { MessageKey } from '../i18n';
import type { ModuleId } from '../catalog/taxonomy';
import { planoAcento, planoArticulacao, planoDeslocamento, planoSubdivisao, planoSustentar, type Plano } from '../theory/cadencia';
import { desenho, familias, modosDistintos, type Grade, type Padrao } from '../theory/deslocamento';

export type Valores = Record<string, string | string[]>;

/** Uma opção de um controle: ou uma chave de tradução, ou um texto que não se traduz (um desenho). */
export interface Opcao { id: string; chave?: MessageKey; texto?: string }

export interface Controle { id: string; rotulo: MessageKey; multi?: boolean; opcoes: Opcao[] }

export interface Eixo {
  rotulo: MessageKey;
  valores: string[];
  mostrar: (valor: string) => string;
}

export type FamiliaId = 'acento-deslocado' | 'subdivisao-alternada' | 'sustentar-e-cortar' | 'legato-staccato' | 'deslocamento-ritmico';

export interface Familia {
  id: FamiliaId;
  modulo: ModuleId;
  padroes: Valores;
  controles: (v: Valores) => Controle[];
  /** Por que não dá para começar com estes valores, ou `null`. */
  problema?: (v: Valores) => MessageKey | null;
  plano: (v: Valores, eixo?: string) => Plano;
  /** Só o deslocamento rítmico: o que se percorre à mão, depois de escolhida a família do padrão. */
  eixo?: (v: Valores) => Eixo;
  /**
   * Conserta valores que deixaram de fazer sentido depois de uma escolha. Trocar a grade muda quantas
   * famílias existem (5 → 2), e uma escolha antiga não pode apontar para o nada — nem na conta, nem
   * na tela, que compara chip a chip e ficaria sem nenhum marcado.
   */
  normalizar?: (v: Valores) => Valores;
}

const um = (v: Valores, id: string, padrao: string): string => {
  const x = v[id];
  return typeof x === 'string' ? x : padrao;
};
const varios = (v: Valores, id: string): string[] => (Array.isArray(v[id]) ? (v[id] as string[]) : []);
const numeros = (ids: string[]): Opcao[] => ids.map(id => ({ id, texto: id }));
const SUBS = (ids: number[]): Opcao[] => ids.map(s => ({ id: String(s), chave: `cadence.sub_${s}` as MessageKey }));

const COMPASSOS: Controle = { id: 'compassos', rotulo: 'cadence.bars', opcoes: numeros(['1', '2', '4']) };

const decodificarPadrao = (valor: string): Padrao => valor.split(',').filter(Boolean).map(Number);

/** A grade e a família escolhidas, com a família presa ao que existe (trocar a grade muda quantas há). */
function escolha(v: Valores) {
  const grade = Number(um(v, 'grade', '4')) as Grade;
  const todas = familias(grade);
  const indice = Math.min(Math.max(0, Number(um(v, 'familia', '0'))), todas.length - 1);
  return { grade, todas, familia: todas[indice] };
}

export const FAMILIAS: Record<FamiliaId, Familia> = {
  'acento-deslocado': {
    id: 'acento-deslocado', modulo: 'technique', padroes: { porTempo: '4', compassos: '2' },
    controles: () => [{ id: 'porTempo', rotulo: 'cadence.perBeat', opcoes: SUBS([2, 3, 4]) }, COMPASSOS],
    plano: v => planoAcento(Number(um(v, 'porTempo', '4')), Number(um(v, 'compassos', '2'))),
  },
  'subdivisao-alternada': {
    id: 'subdivisao-alternada', modulo: 'technique', padroes: { subs: ['2', '3', '4'], compassos: '2' },
    controles: () => [{ id: 'subs', rotulo: 'cadence.subs', multi: true, opcoes: SUBS([1, 2, 3, 4]) }, COMPASSOS],
    problema: v => (varios(v, 'subs').length < 2 ? 'cadence.needTwo' : null),
    // sempre da mais lenta para a mais rápida, qualquer que seja a ordem em que foram marcadas
    plano: v => planoSubdivisao(varios(v, 'subs').map(Number).sort((a, b) => a - b), Number(um(v, 'compassos', '2'))),
  },
  'sustentar-e-cortar': {
    id: 'sustentar-e-cortar', modulo: 'technique', padroes: { segurar: '2' },
    controles: () => [{ id: 'segurar', rotulo: 'cadence.holdFor', opcoes: numeros(['1', '2', '3']) }],
    plano: v => planoSustentar(Number(um(v, 'segurar', '2'))),
  },
  'legato-staccato': {
    id: 'legato-staccato', modulo: 'technique', padroes: { compassos: '2' },
    controles: () => [COMPASSOS],
    plano: v => planoArticulacao(Number(um(v, 'compassos', '2'))),
  },
  'deslocamento-ritmico': {
    id: 'deslocamento-ritmico', modulo: 'perception.rhythmic', padroes: { grade: '4', familia: '0' },
    controles: v => {
      const { grade, todas } = escolha(v);
      return [
        { id: 'grade', rotulo: 'cadence.perBeat', opcoes: SUBS([2, 3, 4]) },
        { id: 'familia', rotulo: 'cadence.family', opcoes: todas.map((p, i) => ({ id: String(i), texto: desenho(p, grade) })) },
      ];
    },
    normalizar: v => {
      const { todas } = escolha(v);
      return { ...v, familia: String(Math.min(Math.max(0, Number(um(v, 'familia', '0'))), todas.length - 1)) };
    },
    eixo: v => {
      const { grade, familia } = escolha(v);
      return {
        rotulo: 'cadence.mode',
        valores: modosDistintos(familia, grade).map(m => m.join(',')),
        mostrar: valor => desenho(decodificarPadrao(valor), grade),
      };
    },
    plano: (v, eixo) => {
      const { grade, familia } = escolha(v);
      return planoDeslocamento(eixo ? decodificarPadrao(eixo) : familia, grade);
    },
  },
};

export const valoresPadrao = (f: Familia): Valores => JSON.parse(JSON.stringify(f.padroes));
