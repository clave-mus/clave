import { ALL_SCALES, celulaDeGraus, plain, scaleDegreeLabels, scaleDegs, scaleName, shuffle, tonicaNaRegiao } from '../helpers';
import type { ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ouvidoCelulas: CatalogItem = {
  id: 'ouvido-celulas',
  objetos: ['escalas', 'melodia'], tarefas: ['ouvir'],
  primaryModule: 'perception.melodic', skillTags: ['ear.scale_degrees'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: LEGADO,
  // Era pentatônico-only sem razão (decisão 54): a célula é um desenho de graus, e graus existem
  // em qualquer escala. Agora aceita todas, inclusive as duas melódicas.
  settings: ctx => [{ id: 'escala', label: ctx.t('settings.scale'), type: 'single', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    { id: 'tamanho', label: ctx.t('settings.cellSize'), type: 'single', options: [{ id: '3', label: '3' }, { id: '4', label: '4' }] }],
  defaults: { escala: 'penta-maior', tamanho: '3' },
  presentation: { gap: 0.55},
  make(s, ctx) {
    const id = (ALL_SCALES.includes(s.escala as ScaleId) ? s.escala : 'penta-maior') as ScaleId;
    const degs = scaleDegreeLabels(id);
    const semis = [...scaleDegs(id).map(([, semi]) => semi), 12];
    const top = semis.length - 1;
    const size = Number(s.tamanho ?? 3);
    // O que define uma célula: graus vizinhos distam 1 ou 2 posições, e **nunca se repetem**.
    // Isto é uma só regra, e ela vale igual para a resposta certa e para os distratores — foi
    // onde eu errei na primeira tentativa desta tarefa: consertei a certa e recriei o bug nos
    // distratores, com 30% deles saindo `6 6 6`. Distrator que não é célula válida entrega a
    // resposta.
    const valida = (x: number[]) => x.every((v, k) => k === 0 || [1, 2].includes(Math.abs(v - x[k - 1])));

    // BUG 1 (consertado): o gerador antigo era `clamp(anterior + pick([-2,-1,1,2]), 0, top)`, e
    // nas bordas o clamp devolvia o MESMO grau — saía `5 5 4`. Agora o passo é sorteado DENTRO
    // do que cabe, em vez de cortado depois. A função mora em helpers.ts (`celulaDeGraus`) —
    // `audiar` (X3) usa a mesma regra para gerar a sequência de graus que a pessoa audia.
    const c = celulaDeGraus(top, size);
    const key = (x: number[]) => x.map(i => degs[i]).join(' ');

    // BUG 2 (consertado): os distratores eram células sorteadas do zero e diferiam demais. A
    // visão pede o contrário — "distratores que diferem em apenas uma nota".
    //
    // São ENUMERADOS, não sorteados: todas as células válidas que trocam uma posição da certa.
    // Enumerar aqui é o certo porque o espaço é minúsculo (no máximo 8 posições × 4 notas), e
    // sortear com tentativa e erro é o que produzia os casos inválidos.
    const umaNotaDiferente = (base: number[]) => {
      const out: number[][] = [];
      for (let i = 0; i < base.length; i++) {
        for (let v = 0; v <= top; v++) {
          if (v === base[i]) continue;
          const cand = base.slice(); cand[i] = v;
          if (valida(cand)) out.push(cand);
        }
      }
      return out;
    };
    const others = new Set<string>();
    for (const v of shuffle(umaNotaDiferente(c))) {
      if (others.size >= 3) break;
      if (key(v) !== key(c)) others.add(key(v));
    }
    // Célula encurralada (bordas estreitas): abre para duas notas de diferença, ainda válidas.
    // Melhor um distrator a duas notas do que três opções em vez de quatro.
    if (others.size < 3) {
      for (const base of shuffle(umaNotaDiferente(c))) {
        for (const v of shuffle(umaNotaDiferente(base))) {
          if (others.size >= 3) break;
          if (key(v) !== key(c)) others.add(key(v));
        }
        if (others.size >= 3) break;
      }
    }
    const tonic = tonicaNaRegiao(ctx, { lo: 57, hi: 64 });
    const terca = semis.find(x => x === 3 || x === 4) ?? 4;
    const triad = [tonic, tonic + terca, tonic + 7];
    return {
      prompt: ctx.t('quiz.cells'), visual: { kind: 'ear', hint: ctx.t('quiz.cellsHint') },
      surface: { kind: 'choices', options: shuffle([key(c), ...others]).map(plain) }, expected: { kind: 'option', id: key(c) },
      sound: { groups: [triad, ...c.map(i => [tonic + semis[i]])] }, autoplay: true, reveal: key(c),
    };
  },
};
