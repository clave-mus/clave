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
    const others = new Map<string, CellId[][]>();
    for (let tries = 0; others.size < 3 && tries < 60; tries++) { const o = randomBars(cells, 1); if (key(o) !== key(bar)) others.set(key(o), o); }
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
