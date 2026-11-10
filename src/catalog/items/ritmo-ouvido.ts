import { CELLS, arr, randomBars, shuffle } from '../helpers';
import type { CellId, MessageKey } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Grupos de figuras que **se somam** (P5, 06/11/2026).
 *
 * Antes eram seis níveis exclusivos — `semis` OU `tercinas` —, e quem queria os dois juntos não
 * tinha como. É o defeito que a revisão chamou de *"opções que deveriam ser complementares estão
 * sendo mutuamente exclusivas"*. Agora a pessoa marca o que pode aparecer, e as células são a união
 * dos grupos marcados.
 */
const GRUPOS: { id: string; cells: CellId[] }[] = [
  { id: 'basico', cells: ['q', '8-8'] },
  { id: 'pausas', cells: ['qr', 'h'] },
  { id: 'contratempo', cells: ['8r-8'] },
  { id: 'semis', cells: ['16x4', '8-16-16', '16-16-8'] },
  { id: 'sincope', cells: ['8-8', '8.-16', '16-8-16', '8r-8'] },
  { id: 'tercinas', cells: ['3x8'] },
];

/**
 * Os seis níveis antigos, agora **atalhos** — o mesmo desenho de `ouvido-acorde`. Cada um reproduz
 * exatamente as células que o nível antigo tinha (o teste confere); nada se perdeu, só deixou de ser
 * a única forma de escolher.
 */
const ATALHOS: { id: string; grupos: string[] }[] = [
  { id: 'duas', grupos: ['basico'] },
  { id: 'pausas', grupos: ['basico', 'pausas'] },
  { id: 'contratempo', grupos: ['basico', 'contratempo'] },
  { id: 'semis', grupos: ['basico', 'semis'] },
  { id: 'sincope', grupos: ['sincope'] },
  { id: 'tercinas', grupos: ['basico', 'tercinas'] },
];

/**
 * As células de uma seleção de grupos.
 *
 * Se a união tem menos de duas células (só `contratempo`, ou só `tercinas`), o compasso sairia
 * igual em todos os tempos e **não haveria três alternativas diferentes** para a pergunta — então a
 * base entra. É a única situação em que o app acrescenta algo que a pessoa não marcou.
 */
export function celulasDe(grupos: readonly string[]): CellId[] {
  const uniao = [...new Set(GRUPOS.filter(g => grupos.includes(g.id)).flatMap(g => g.cells))];
  return uniao.length >= 2 ? uniao : [...new Set<CellId>([...uniao, 'q', '8-8'])];
}

/**
 * A **assinatura grosseira** de um compasso: o que se vê numa alternativa sem ouvir nada.
 *
 * Pedido do Paulo (09/11/2026), com a lógica da assinatura de repetição do `ouvido-celulas`:
 * *"faça com que alternativas com semibreve nao apareçam em ritmos sem semibreve e coisas afins.
 * deixe tudo mais parecido"*.
 *
 * São três coisas que a pessoa lê de relance: quais figuras aparecem, quantos ataques há, e se tem
 * pausa. Antes os quatro compassos eram sorteados **independentes**, e bastava um deles ter uma
 * semibreve para se descartar de olho.
 */
function assinatura(bar: readonly CellId[]): string {
  const figuras = new Set<string>();
  let ataques = 0, pausa = false;
  for (const c of bar) {
    for (const ev of CELLS[c].events) {
      figuras.add(String(ev.d) + (ev.dot ? '.' : ''));
      if (ev.rest) pausa = true; else ataques++;
    }
  }
  return `${[...figuras].sort().join(',')}|${ataques}|${pausa ? 'r' : '-'}`;
}

/**
 * O compasso é montável pelo gerador?
 *
 * Mesma regra de `randomBars`: célula de dois tempos só começa em tempo par. Sem conferir isto,
 * permutar `[h, q, q]` produziria `[q, h, q]` — uma mínima atravessando a divisão do compasso, que
 * precisa de ligadura para se escrever e que o gerador nunca produz. Distrator que o gerador não
 * poderia ter feito entrega a resposta, e foi o bug 2 do `ouvido-celulas`.
 */
function montavel(bar: readonly CellId[]): boolean {
  let left = 4;
  for (const c of bar) {
    const beats = CELLS[c].beats;
    if (beats > left) return false;
    if (beats === 2 && left % 2 !== 0) return false;
    left -= beats;
  }
  return left === 0;
}

/** As ordens distintas das mesmas células. No máximo quatro células por compasso: 24 arranjos. */
function permutacoes(xs: readonly CellId[]): CellId[][] {
  if (xs.length <= 1) return [[...xs]];
  const out: CellId[][] = [];
  const vistos = new Set<CellId>();
  xs.forEach((x, i) => {
    if (vistos.has(x)) return;
    vistos.add(x);
    for (const resto of permutacoes([...xs.slice(0, i), ...xs.slice(i + 1)])) out.push([x, ...resto]);
  });
  return out;
}

export const ritmoOuvido: CatalogItem = {
  id: 'ritmo-ouvido',
  objetos: ['ritmo'], tarefas: ['ouvir'],
  primaryModule: 'perception.rhythmic', skillTags: ['ear.rhythm_recognition', 'notation.rhythm_reading'],
  contentTags: ['rhythm.quarter', 'rhythm.eighth', 'rhythm.sixteenth', 'rhythm.rests', 'rhythm.syncopation', 'rhythm.triplets'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [{
    id: 'figuras', label: ctx.t('settings.rhythmValues'), type: 'multi',
    options: GRUPOS.map(g => ({ id: g.id, label: ctx.t(`settings.rhythmGroup_${g.id}` as MessageKey) })),
  }],
  defaults: { figuras: ['basico'] },
  presets: ATALHOS.map(a => ({ id: a.id, nome: `theory.rhythmPresets.${a.id}` as MessageKey, settings: { figuras: a.grupos } })),
  presentation: { bpm: 84 },
  make(s, ctx) {
    const cells = celulasDe(arr(s.figuras, ['basico']));
    const bar = randomBars(cells, 1);
    const key = (b: CellId[][]) => b[0].join('|');
    const chave = (b: readonly CellId[]) => b.join('|');
    const others = new Map<string, CellId[][]>();
    const juntar = (b: CellId[]) => { if (chave(b) !== chave(bar[0])) others.set(chave(b), [b]); };

    // Primeiro: as **mesmas células em outra ordem**. É o distrator mais difícil que existe aqui —
    // todas as alternativas ficam com as mesmas figuras, o mesmo número de ataques e as mesmas
    // pausas, e a única diferença é ONDE cada coisa cai. Que é a pergunta.
    for (const perm of shuffle(permutacoes(bar[0]))) {
      if (others.size >= 3) break;
      if (montavel(perm)) juntar(perm);
    }
    // Depois: compassos diferentes com a MESMA assinatura. Entra quando a ordem não dá três —
    // `[q,q,q,q]` tem uma ordem só, e `[h,h]` também.
    const daCerta = assinatura(bar[0]);
    for (let tries = 0; others.size < 3 && tries < 200; tries++) {
      const o = randomBars(cells, 1);
      if (assinatura(o[0]) === daCerta) juntar(o[0]);
    }
    // Último recurso: qualquer compasso. Melhor um distrator descartável que três alternativas.
    for (let tries = 0; others.size < 3 && tries < 60; tries++) juntar(randomBars(cells, 1)[0]);
    const opts = shuffle([{ id: key(bar), label: '', rhythm: bar }, ...[...others].map(([k, b]) => ({ id: k, label: '', rhythm: b }))]);
    const onsets: number[] = [];
    let t = 0;
    bar[0].forEach(c => CELLS[c].events.forEach(ev => { if (!ev.rest) onsets.push(t); t += ev.d; }));
    return {
      prompt: ctx.t('quiz.rhythm'), visual: { kind: 'ear', hint: ctx.t('quiz.rhythmHint') },
      surface: { kind: 'choices', options: opts, wide: true }, expected: { kind: 'option', id: key(bar) },
      sound: { groups: [], drums: onsets }, autoplay: true, reveal: ctx.t('quiz.rhythmReveal'),
    };
  },
};
