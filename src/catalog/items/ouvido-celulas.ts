import { ALL_SCALES, arr, celulaDeGraus, pick, plain, scaleDegreeLabels, scaleDegs, scaleName, shuffle, regiao, tonicaNaRegiao } from '../helpers';
import { acomodarMelodiaEAcorde } from '../../theory/nota-sobre-acorde';
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
    // 1 a 5 (09/11): com uma nota só é "que grau é este, sobre este acorde"; com cinco é a célula
    // de sempre. O Paulo viu que são o mesmo exercício variando o tamanho, e tinha razão.
    { id: 'tamanho', label: ctx.t('settings.cellSize'), type: 'single',
      options: ['1', '2', '3', '4', '5'].map(n => ({ id: n, label: n })) },
    // O acorde de contexto deixou de ser sempre a tônica. O padrão `['1']` reproduz exatamente o
    // comportamento de antes — rotina salva continua soando igual, sem migração.
    { id: 'graus', label: ctx.t('settings.contextChord'), type: 'multi', justify: true,
      options: ['1', '2', '3', '4', '5', '6', '7'].map(n => ({ id: n, label: n })) },
    { id: 'tetrade', label: ctx.t('settings.tetrad'), type: 'toggle' },
    // O Paulo notou (09/11) que a melodia caía embaixo do acorde com frequência, e que isso
    // atrapalha ouvir o grau. Quem se move é o ACORDE — ver `acordeForaDaMelodia`, que explica por
    // quê e traz a medição. "Abaixo" existe porque ele quis manter a opção.
    { id: 'registro', label: ctx.t('settings.melodyRegister'), type: 'single', options: [
      { id: 'acima', label: ctx.t('settings.melodyAbove') },
      { id: 'abaixo', label: ctx.t('settings.melodyBelow') },
    ] }],
  defaults: { escala: 'penta-maior', tamanho: '3', graus: ['1'], tetrade: false, registro: 'acima' },
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

    // O acorde de contexto (09/11). Empilhar terças dentro da escala **só funciona com sete
    // notas**: numa pentatônica as "terças" são saltos de escala, e o grau I sairia [0,4,9] em vez
    // da tríade [0,4,7] que o item sempre tocou — mudaria o som do padrão do item, que é
    // `penta-maior`. Então o campo vale onde existe, e onde não existe fica a tríade de referência
    // de sempre, que é o que estabelece a tonalidade para o ouvido.
    const temCampo = top === 7;
    const possiveis = temCampo ? arr(s.graus, ['1']).map(Number).filter(g => g >= 1 && g <= top) : [];
    const grauDoAcorde = possiveis.length ? pick(possiveis) : 1;
    const acordeNaEscala = temCampo
      ? (s.tetrade ? [0, 2, 4, 6] : [0, 2, 4]).map(p => {
        const i = grauDoAcorde - 1 + p;
        return tonic + semis[i % top] + 12 * Math.floor(i / top);
      })
      : [tonic, tonic + (semis.find(x => x === 3 || x === 4) ?? 4), tonic + 7];

    // Quem se move é o acorde; a melodia só sobe quando descer o acorde o tiraria da região.
    // Os limites são os da região GLOBAL, não os da faixa estreita em que a tônica é sorteada: a
    // faixa estreita diz onde a tônica cai, a região diz o que a pessoa aguenta ouvir e tocar.
    const { acorde, melodia } = acomodarMelodiaEAcorde(
      acordeNaEscala, c.map(i => tonic + semis[i]),
      s.registro === 'abaixo' ? 'abaixo' : 'acima', regiao(ctx));

    return {
      prompt: ctx.t('quiz.cells'),
      visual: { kind: 'ear', hint: ctx.t('quiz.cellsHint', { degree: degs[grauDoAcorde - 1] }) },
      surface: { kind: 'choices', options: shuffle([key(c), ...others]).map(plain) }, expected: { kind: 'option', id: key(c) },
      sound: {
        groups: [acorde, ...melodia.map(n => [n])],
        // Ouvir o acorde sozinho e cada nota sozinha (pedido do Paulo). Aqui separar AJUDA: a
        // pergunta é qual grau cada nota é, e isolá-la não entrega nada — o grau continua a
        // depender de ouvi-la contra o acorde. Em `ouvido-intervalo` seria o oposto.
        partes: [
          { id: 'acorde', label: ctx.t('quiz.partChord'), groups: [acorde] },
          ...melodia.map((nota, n) => ({ id: `n${n}`, label: ctx.t('quiz.partNote', { n: n + 1 }), groups: [[nota]] })),
        ],
      },
      autoplay: true, reveal: key(c),
    };
  },
};
