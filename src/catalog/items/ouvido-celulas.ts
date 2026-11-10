import { ALL_SCALES, arr, celulaDeGraus, pick, plain, scaleDegreeLabels, scaleDegs, scaleName, shuffle, regiao, tonicaNaRegiao } from '../helpers';
import { acomodarMelodiaEAcorde } from '../../theory/nota-sobre-acorde';
import type { ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Dó maior, pedido do Paulo como padrão deste exercício. Tonalidade é parâmetro de PRÁTICA, não
 * configuração do item (decisão 87) — por isso vem no `params` do atalho, e não nos `settings`.
 * Uma referência só, compartilhada: um objeto novo por preset quebraria o `useMemo` de `params`.
 */
const EM_DO_MAIOR = { key: { tonic: 0, mode: 'maior' } } as const;

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
    // atrapalha ouvir o grau. Quem se move é o ACORDE — ver `acomodarMelodiaEAcorde`, que explica por
    // quê e traz a medição. "Abaixo" existe porque ele quis manter a opção.
    { id: 'registro', label: ctx.t('settings.melodyRegister'), type: 'single', options: [
      { id: 'acima', label: ctx.t('settings.melodyAbove') },
      { id: 'abaixo', label: ctx.t('settings.melodyBelow') },
    ] },
    // Pedido do Paulo (09/11): "ao inves de termos só 4 alternativas, a gente tenha que escolher
    // entre todas opções possiveis". Quatro alternativas dão pista — descartar duas já deixa
    // cinquenta por cento. Escolher entre todos os graus não dá pista nenhuma.
    { id: 'resposta', label: ctx.t('settings.answerMode'), type: 'single', options: [
      { id: 'todos', label: ctx.t('settings.answerAll') },
      { id: 'alternativas', label: ctx.t('settings.answerFour') },
    ] }],
  defaults: { escala: 'penta-maior', tamanho: '3', graus: ['1'], tetrade: false, registro: 'acima', resposta: 'todos' },
  /**
   * Os atalhos (09/11/2026). **O primeiro é a entrada do item** — quem abre sem nada salvo cai
   * nele, e o Paulo pediu que fosse o mais simples de todos: uma nota, escala maior, dó maior.
   *
   * Os quatro primeiros são dele, com os nomes dele. Os três últimos são proposta minha, e o que
   * cada um acrescenta de verdade:
   *
   * - **sobre o V** — ouvir graus contra a dominante é outra habilidade que ouvi-los contra a
   *   tônica: é onde a função tonal aperta, e onde a terça da escala vira sétima do acorde;
   * - **acorde sorteado** — o contexto muda a cada rodada, então a tônica precisa ser reencontrada
   *   toda vez. É a versão difícil e a mais parecida com música de verdade;
   * - **escala menor** — o campo menor é outro mundo, e uma nota é a porta de entrada dele.
   */
  presets: [
    { id: 'uma-nota', nome: 'presets.celulaUmaNota', settings: { escala: 'maior', tamanho: '1', graus: ['1'], tetrade: false, registro: 'acima', resposta: 'todos' }, params: EM_DO_MAIOR },
    { id: 'tres-notas', nome: 'presets.celulaTresNotas', settings: { escala: 'maior', tamanho: '3', graus: ['1'], tetrade: false, registro: 'acima', resposta: 'todos' }, params: EM_DO_MAIOR },
    { id: 'cinco-notas', nome: 'presets.celulaCincoNotas', settings: { escala: 'maior', tamanho: '5', graus: ['1'], tetrade: false, registro: 'acima', resposta: 'todos' }, params: EM_DO_MAIOR },
    { id: 'pentatonica', nome: 'presets.celulaPentatonica', settings: { escala: 'penta-maior', tamanho: '5', graus: ['1'], tetrade: false, registro: 'acima', resposta: 'todos' }, params: EM_DO_MAIOR },
    { id: 'sobre-o-v', nome: 'presets.celulaSobreOV', settings: { escala: 'maior', tamanho: '3', graus: ['5'], tetrade: false, registro: 'acima', resposta: 'todos' }, params: EM_DO_MAIOR },
    { id: 'acorde-sorteado', nome: 'presets.celulaAcordeSorteado', settings: { escala: 'maior', tamanho: '3', graus: ['1', '2', '3', '4', '5', '6', '7'], tetrade: false, registro: 'acima', resposta: 'todos' }, params: EM_DO_MAIOR },
    { id: 'menor', nome: 'presets.celulaMenor', settings: { escala: 'menor', tamanho: '1', graus: ['1'], tetrade: false, registro: 'acima', resposta: 'todos' }, params: EM_DO_MAIOR },
  ],
  presentation: { gap: 0.55},
  make(s, ctx) {
    const id = (ALL_SCALES.includes(s.escala as ScaleId) ? s.escala : 'penta-maior') as ScaleId;
    const degs = scaleDegreeLabels(id);
    const semis = [...scaleDegs(id).map(([, semi]) => semi), 12];
    const top = semis.length - 1;
    const size = Number(s.tamanho ?? 3);
    const c = celulaDeGraus(top, size);

    // BUG 2 (consertado): os distratores eram células sorteadas do zero e diferiam demais. A
    // visão pede o contrário — "distratores que diferem em apenas uma nota".
    //
    // BUG 3 (09/11, visto pelo Paulo): o teste de antes só proibia repetição **adjacente**, que é
    // tudo que a regra da célula garante — graus vizinhos distam 1 ou 2 posições, nunca 0.
    // Repetição NÃO adjacente passava — `1 3 1` é célula válida — e
    // aparecia nos distratores de forma independente da resposta certa. Com a certa sendo `1 3 5`
    // e um distrator `1 3 1`, descartar sem ouvir é trivial; e com a certa sendo `1 3 1` e nenhum
    // distrator repetindo, a resposta se entrega.
    //
    // A correção: todo distrator tem a **mesma assinatura de repetição** da resposta certa — quais
    // posições tocam o mesmo grau. `1 3 1` → `0,1,0`; `1 3 5` → `0,1,2`.
    const assinatura = (x: number[]) => {
      const ordem = new Map<string, number>();
      return x.map(i => degs[i]).map(g => ordem.get(g) ?? (ordem.set(g, ordem.size), ordem.size - 1)).join(',');
    };
    const daCerta = assinatura(c);

    // O pool são TODAS as células válidas deste tamanho, por busca em profundidade. Enumerar é o
    // certo aqui porque o espaço é minúsculo (no máximo 8 inícios × 4 passos ^ 4), e porque foi
    // sortear com tentativa e erro que produziu os casos inválidos do bug 1.
    //
    // Enumerar o conjunto inteiro, em vez de só "troque uma posição", é o que faz a assinatura
    // caber: com a certa sendo `1 3 1`, trocar uma posição quase sempre quebra a repetição, e nas
    // bordas da escala sobrava **um** candidato. A ordenação por distância preserva a intenção da
    // visão — os que diferem em uma nota vêm primeiro, e dois só quando não há três de um.
    const todas: number[][] = [];
    const andar = (atual: number[]) => {
      if (atual.length === size) { todas.push(atual); return; }
      for (const passo of [-2, -1, 1, 2]) {
        const v = atual[atual.length - 1] + passo;
        if (v >= 0 && v <= top) andar([...atual, v]);
      }
    };
    for (let v = 0; v <= top; v++) andar([v]);

    const key = (x: number[]) => x.map(i => degs[i]).join(' ');
    const distancia = (x: number[]) => x.reduce((n, v, k) => n + (v === c[k] ? 0 : 1), 0);
    const candidatas = todas.filter(x => key(x) !== key(c) && assinatura(x) === daCerta);
    const others = new Set<string>();
    for (let d = 1; d <= size && others.size < 3; d++) {
      for (const v of shuffle(candidatas.filter(x => distancia(x) === d))) {
        if (others.size >= 3) break;
        others.add(key(v));
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
      // Os dois modos entregam **o mesmo `expected`** — `{ kind: 'option', id: '1 3 5' }`. Por
      // isso trocar de modo não mexe em validação, histórico nem distrator: muda só a tela.
      surface: s.resposta === 'alternativas'
        ? { kind: 'choices', options: shuffle([key(c), ...others]).map(plain) }
        : { kind: 'sequence', comprimento: size, options: degs.slice(0, top + 1).map(plain) },
      expected: { kind: 'option', id: key(c) },
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
