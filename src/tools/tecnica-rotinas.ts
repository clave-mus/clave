// As rotinas da ferramenta de técnica: dados e geradores, sem interface.
// Separado do componente para poder ser testado — e para o arquivo da tela exportar só componente.
import type { Publicacao } from '../catalog/publicacao';
import { LEGADO, RASCUNHO } from '../catalog/publicacao';
import type { MessageKey, Translate } from '../i18n';
import { casasDaTroca, codificarTroca, decodificarTroca, indiceDaCorda, permutacoesDe, trocasDePosicao } from '../theory/tecnica';

export interface Pos { s: number; f: number; finger?: number }

/**
 * Eixo que o APP escolhe, não a pessoa — é o critério da decisão 81: *em técnica, a contribuição do
 * app é escolher o que você não escolheria.* Sozinha, a pessoa toca 1-2-3-4 e 4-3-2-1 e nunca
 * 2-4-1-3.
 *
 * O avanço é **manual** (decisão 38): o app mostra o valor e quais já passaram, e quem decide seguir
 * é quem está tocando.
 */
interface Eixo {
  /** É também o nome do parâmetro rotacionável (`ROTACIONAVEIS`) e a chave gravada no histórico. */
  id: 'digitacao' | 'ordemDeCordas' | 'trocaDePosicao';
  /** Depende do número de cordas: com seis, a ordem das cordas tem 720 valores. */
  valores: (cordas: number) => string[];
  rotulo: MessageKey;
  /** Como o valor aparece na tela. */
  mostrar: (valor: string, t: Translate) => string;
}

const espacado = (v: string) => [...v].join(' ');

export interface Routine {
  id: string; name: MessageKey; desc: MessageKey; for: ('violao' | 'baixo' | 'piano')[];
  build: (strings: number, valor: string) => Pos[];
  eixo?: Eixo;
  /** Mesmo portão dos itens de catálogo (decisão 91): omitir é rascunho. */
  publicacao?: Publicacao;
}

export const ROUTINES: Routine[] = [
  {
    publicacao: LEGADO,
    id: 'tqo', name: 'technique.tqoName', desc: 'technique.tqoDesc', for: ['violao', 'baixo'],
    build: () => [3, 5, 7, 8, 5, 3].flatMap((r, i) => {
      const s = i % 2; // alterna raiz na corda mais grave e na seguinte
      return [{ s, f: r, finger: 2 }, { s: s + 1, f: r + 2, finger: 4 }, { s: s + 2, f: r + 2, finger: 4 }, { s: s + 1, f: r + 2, finger: 4 }];
    }),
  },
  {
    publicacao: LEGADO,
    id: 'aranha', name: 'technique.spiderName', desc: 'technique.spiderDesc', for: ['violao', 'baixo'],
    build: n => {
      const out: Pos[] = [];
      for (let pos = 1; pos <= 3; pos++) {
        for (let s = 0; s < n; s++) for (let k = 0; k < 4; k++) out.push({ s, f: pos + k, finger: k + 1 });
        for (let s = n - 1; s >= 0; s--) for (let k = 3; k >= 0; k--) out.push({ s, f: pos + 1 + k, finger: k + 1 });
      }
      return out;
    },
  },
  {
    // T1 (decisão 81). "Independência dos dedos" é esta rotina com a ordem fixa, não item separado.
    publicacao: RASCUNHO,
    id: 'permutacoes', name: 'technique.permName', desc: 'technique.permDesc', for: ['violao', 'baixo'],
    eixo: { id: 'digitacao', valores: () => permutacoesDe(4), rotulo: 'technique.permOrder', mostrar: espacado },
    build: (n, valor) => {
      const ordem = [...(valor || permutacoesDe(4)[0])].map(Number);
      // um dedo por casa a partir da casa 5: o dedo f mora em 4 + f
      const naCorda = (s: number) => ordem.map(f => ({ s, f: 4 + f, finger: f }));
      const subindo = Array.from({ length: n }, (_, s) => naCorda(s)).flat();
      const descendo = Array.from({ length: n }, (_, s) => naCorda(n - 1 - s)).flat();
      return [...subindo, ...descendo];
    },
  },
  {
    // T2 (decisão 81): o app nomeia a ORDEM em que se atravessam as cordas. Sozinha, a pessoa vai de
    // uma corda à vizinha — nunca 4 2 3 1. A corda 1 é a mais aguda (`indiceDaCorda`).
    publicacao: RASCUNHO,
    id: 'cordas', name: 'technique.cordsName', desc: 'technique.cordsDesc', for: ['violao', 'baixo'],
    eixo: { id: 'ordemDeCordas', valores: n => permutacoesDe(n), rotulo: 'technique.cordsOrder', mostrar: espacado },
    build: (n, valor) => {
      const ordem = [...(valor || permutacoesDe(n)[0])].map(Number).filter(c => c >= 1 && c <= n);
      // uma nota por corda, na casa 5, atravessando na ordem pedida — duas vezes, para dar ritmo
      const volta = ordem.map(c => ({ s: indiceDaCorda(c, n), f: 5 }));
      return [...volta, ...volta];
    },
  },
  {
    // T5 (decisão 81): deslizar de uma posição para outra com UM dedo, e o app escolhe qual — porque
    // quase todo mundo desliza com o indicador e foge do anelar e do mindinho.
    publicacao: RASCUNHO,
    id: 'troca', name: 'technique.swapName', desc: 'technique.swapDesc', for: ['violao', 'baixo'],
    eixo: {
      id: 'trocaDePosicao', valores: () => trocasDePosicao().map(codificarTroca), rotulo: 'technique.swapOrder',
      mostrar: (v, t) => { const x = decodificarTroca(v); return x ? t('technique.swapShow', { from: x.de, to: x.para, finger: x.dedo }) : v; },
    },
    build: (n, valor) => {
      const troca = decodificarTroca(valor) ?? trocasDePosicao()[0];
      const { de, para } = casasDaTroca(troca);
      return Array.from({ length: n }, (_, s) => s).flatMap(s => [
        { s, f: de, finger: troca.dedo }, { s, f: para, finger: troca.dedo },
        { s, f: de, finger: troca.dedo }, { s, f: para, finger: troca.dedo },
      ]);
    },
  },
  {
    publicacao: LEGADO,
    id: 'cinco', name: 'technique.fiveName', desc: 'technique.fiveDesc', for: ['piano'],
    build: () => [60, 62, 64].flatMap(r => {
      const up = [0, 2, 4, 5, 7];
      const seq = [...up, ...up.slice(0, -1).reverse()];
      return seq.map((semi, i) => ({ s: 0, f: r + semi, finger: i < 5 ? i + 1 : 9 - i }));
    }),
  },
];
