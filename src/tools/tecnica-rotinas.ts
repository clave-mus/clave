// As rotinas da ferramenta de técnica: dados e geradores, sem interface.
// Separado do componente para poder ser testado — e para o arquivo da tela exportar só componente.
import type { Publicacao } from '../catalog/publicacao';
import { LEGADO, RASCUNHO } from '../catalog/publicacao';
import type { MessageKey, Translate } from '../i18n';
import { CORDAS_DO_GRUPO, indiceDaCorda, indicesDoGrupo, permutacoesDe } from '../theory/tecnica';

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
  id: 'digitacao' | 'ordemDeCordas';
  /** Depende do número de cordas: com seis, a ordem das cordas tem 720 valores. */
  valores: (cordas: number) => string[];
  rotulo: MessageKey;
  /** Como o valor aparece na tela. */
  mostrar: (valor: string, t: Translate) => string;
}

const espacado = (v: string) => [...v].join(' ');

export interface Routine {
  id: string; name: MessageKey; desc: MessageKey; for: ('violao' | 'baixo' | 'piano')[];
  /** `grupo` só importa a quem declara `grupos`: qual conjunto de quatro cordas vizinhas (0 = o mais grave). */
  build: (strings: number, valor: string, grupo: number) => Pos[];
  /** A rotina trabalha com um grupo de quatro cordas, e a tela deixa escolher qual quando há mais de um. */
  grupos?: true;
  eixo?: Eixo;
  /** Mesmo portão dos itens de catálogo (decisão 91): omitir é rascunho. */
  publicacao?: Publicacao;
}

export const ROUTINES: Routine[] = [
  {
    publicacao: LEGADO,
    id: 'tqo', name: 'technique.tqoName', desc: 'technique.tqoDesc', for: ['violao', 'baixo'],
    // Tônica com o dedo 1, quinta com o 2, oitava com o 4 — é a digitação que o Paulo usa, e ele é o
    // baixista. A versão anterior começava no dedo 2, o que ele não soube explicar nem reconheceu.
    build: () => [3, 5, 7, 8, 5, 3].flatMap((r, i) => {
      const s = i % 2; // alterna a raiz entre a corda mais grave e a seguinte
      return [
        { s, f: r, finger: 1 },                 // tônica
        { s: s + 1, f: r + 2, finger: 2 },      // quinta
        { s: s + 2, f: r + 2, finger: 4 },      // oitava
        { s: s + 1, f: r + 2, finger: 2 },      // quinta, voltando
      ];
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
    grupos: true,
    // sempre 24 ordens, de quatro cordas vizinhas: com as seis da guitarra seriam 720 (ver CORDAS_DO_GRUPO)
    eixo: { id: 'ordemDeCordas', valores: () => permutacoesDe(CORDAS_DO_GRUPO), rotulo: 'technique.cordsOrder', mostrar: espacado },
    build: (n, valor, grupo) => {
      const indices = indicesDoGrupo(grupo, n);
      const q = indices.length;
      // dentro do grupo, 1 é a corda mais AGUDA DO GRUPO (indiceDaCorda); `indices[0]` é a mais grave
      const ordem = [...(valor || permutacoesDe(q)[0])].map(Number).filter(c => c >= 1 && c <= q);
      // **Casas diferentes por corda, não todas na 5.** Tudo na mesma casa é uma pestana, e no baixo
      // pestana não se faz — o exercício é atravessar as cordas, não segurar um acorde. As casas sobem
      // uma a cada corda do grupo, o que mantém a mão numa posição só.
      // **Sem dedo**: aqui o ponto é a ordem das cordas, e qual dedo usar é escolha de quem toca.
      const volta = ordem.map(c => {
        const i = indiceDaCorda(c, q);
        return { s: indices[i], f: 5 + i };
      });
      return [...volta, ...volta];
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

// ---------------------------------------------------------------------------
// A forma sob a mão (A21)
// ---------------------------------------------------------------------------

/** Uma casa marcada no braço. Mesmo formato do `Fretboard` (decisão 17: há um só). */
export interface Marca { s: number; f: number; color: string; label?: string }

/** O alcance da mão, em casas. É o mesmo critério do guia de formas. */
export const ALCANCE = 5;

/** A janela de casas que a mão cobre agora. */
export function janelaDaMao(seq: readonly Pos[], idx: number) {
  const casaAtual = idx >= 0 && idx < seq.length ? seq[idx].f : (seq[0]?.f ?? 0);
  const from = Math.max(0, casaAtual - 1);
  return { from, to: from + ALCANCE - 1 };
}

/**
 * **A forma sob a mão**, e não a sequência inteira (`A21`).
 *
 * A primeira versão marcava todas as casas que a rotina usa, e isso virou uma nuvem de 19 círculos na
 * `tqo` — que sobe o braço inteiro, uma fundamental por vez. O desenho se perdia exatamente como se
 * perdia na tablatura, só de outro jeito.
 *
 * O corte é o **alcance da mão**, e tem a propriedade certa: a forma **anda** com a mão quando o
 * exercício sobe o braço, em vez de somar tudo.
 *
 * **A cor é declarada nas duas**, destaque e resto: o padrão do `Fretboard` já é `--mu`, então marcar
 * só o destaque deixaria todas as casas da mesma cor.
 *
 * `comDedo` só é verdade onde o dedo **é** o exercício (a `T1`). Fora dela, qual dedo usar é escolha de
 * quem toca — foi o que a `A21` decidiu.
 */
export function formaSobAMao(seq: readonly Pos[], idx: number, comDedo: boolean): Marca[] {
  const { from, to } = janelaDaMao(seq, idx);
  const porCasa = new Map<string, Marca>();
  seq.forEach((p, i) => {
    if (p.f < from || p.f > to) return;
    const chave = `${p.s}:${p.f}`;
    const agora = i === idx;
    // a de agora sempre vence: se a mesma casa aparece duas vezes na sequência, o destaque manda
    if (!porCasa.has(chave) || agora) {
      porCasa.set(chave, {
        s: p.s, f: p.f,
        color: agora ? 'var(--mu)' : 'var(--cream)',
        ...(comDedo && p.finger ? { label: String(p.finger) } : {}),
      });
    }
  });
  return [...porCasa.values()];
}
