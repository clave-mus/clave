import { ALL_SCALES, plain, regiao, scaleName, shuffle, tonicaNaRegiao } from '../helpers';
import type { ScaleId } from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem } from '../types';
import { acordeDoCampo, escalaDoCampo, lerPadrao, posicoesDoPadrao, rotulo, sortearPadrao } from '../../theory/padrao-de-escala';
import { CADENCIAS, cadenciaHarmonica } from '../../theory/cadencia-harmonica';

/**
 * Reconhecer padrões pela escala — a metade de adivinhar do par que o Paulo desenhou em
 * `docs/tarefas/PE-padroes-de-escala.md`.
 *
 * Um desenho de poucas notas soa começando em algum grau da escala. A pergunta é **onde ele
 * começou**, e a resposta são os graus que soaram.
 *
 * ## Por que esta metade saiu primeiro (10/11/2026)
 *
 * O Paulo quis levar o exercício para o ônibus. Das duas metades, esta é a que **não precisa de tela
 * própria**: é `serie`, o Player a roda, e `theory/padrao-de-escala.ts` já faz toda a música — 25
 * testes, escrito antes. A exploração com a escada clicável é a peça caras, e fica para depois.
 *
 * ## As alternativas são TODAS as posições, não quatro
 *
 * Com 5 ou 7 posições, mostrar todas é ao mesmo tempo mais simples e mais difícil: não há distrator
 * a inventar nem como descartar por eliminação. E elas explicam o exercício sozinhas — quem lê
 * `1-3-2-5`, `2-4-3-6`, `3-5-4-6` entende que o desenho é o mesmo e que a pergunta é onde começa.
 *
 * É a mesma escolha que o Paulo fez para o `ouvido-celulas`: *"ao invés de termos só 4
 * alternativas, a gente tenha que escolher entre todas opções possiveis"*.
 *
 * ## A tônica é sorteada a cada rodada
 *
 * Sem isso a altura absoluta entrega a resposta, e o exercício viraria memória de frequência.
 *
 * ## `padrao` não é declarado
 *
 * Ele chega pela navegação quando a tela de exploração existir (`lerAbertura` + a camada `local` do
 * Player fazem uma chave sem controle no painel chegar ao `make`). Enquanto a exploração não existe,
 * o padrão é sorteado a cada rodada — que é a versão mais difícil e mais geral do mesmo exercício.
 */
export const reconhecerPadroesEscala: CatalogItem = {
  id: 'reconhecer-padroes-escala',
  objetos: ['escalas', 'melodia'], tarefas: ['ouvir'],
  primaryModule: 'perception.melodic', skillTags: ['ear.scale_degrees'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: RASCUNHO,
  settings: ctx => [
    { id: 'escala', label: ctx.t('settings.scale'), type: 'single', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    { id: 'tamanho', label: ctx.t('settings.patternSize'), type: 'single',
      options: ['3', '4', '5', '6'].map(n => ({ id: n, label: n })) },
    /**
     * A **cadência** é o contexto mais forte, e é por isso que ela é o padrão (decisão do Paulo em
     * 10/11/2026): uma nota dá a altura e não dá o modo — dó serve a dó maior e a lá menor —, uma
     * tríade dá o modo e não dá a função, e a cadência dá as duas. É o que a música usa para dizer
     * onde você está.
     */
    { id: 'contexto', label: ctx.t('settings.patternContext'), type: 'single', options: [
      { id: 'ii-V-I', label: ctx.t('settings.contextIIVI') },
      { id: 'I-IV-V-I', label: ctx.t('settings.contextIIVVI') },
      { id: 'triade', label: ctx.t('settings.contextTriad') },
      { id: 'tetrade', label: ctx.t('settings.contextTetrade') },
      { id: 'nota', label: ctx.t('settings.contextTonic') },
    ] },
  ],
  // Pentatônica como padrão, decisão do Paulo.
  defaults: { escala: 'penta-maior', tamanho: '4', contexto: 'ii-V-I' },
  presets: [
    { id: 'penta-tres', nome: 'presets.padraoPentaTres', settings: { escala: 'penta-maior', tamanho: '3', contexto: 'triade' } },
    { id: 'penta-quatro', nome: 'presets.padraoPentaQuatro', settings: { escala: 'penta-maior', tamanho: '4', contexto: 'triade' } },
    { id: 'maior-quatro', nome: 'presets.padraoMaiorQuatro', settings: { escala: 'maior', tamanho: '4', contexto: 'triade' } },
    { id: 'so-tonica', nome: 'presets.padraoSoTonica', settings: { escala: 'penta-maior', tamanho: '4', contexto: 'nota' } },
  ],
  presentation: { gap: 0.4 },
  make(s, ctx) {
    const escala = (ALL_SCALES.includes(s.escala as ScaleId) ? s.escala : 'penta-maior') as ScaleId;
    const padrao = lerPadrao(s.padrao) ?? sortearPadrao(Number(s.tamanho ?? 4));
    const posicoes = posicoesDoPadrao(escala, padrao);
    const certa = posicoes[Math.floor(Math.random() * posicoes.length)];
    const tonic = tonicaNaRegiao(ctx, { lo: 55, hi: 64 });

    /**
     * O contexto estabelece a tônica; sem ele não há como situar o padrão.
     *
     * A cadência soa como **vários** grupos em sequência, a tônica e a tríade como um só — e por
     * isso `contexto` é uma lista de grupos, não um grupo.
     */
    const cadencia = CADENCIAS.find(c => c === s.contexto);
    const contexto: number[][] = cadencia
      ? cadenciaHarmonica(cadencia, tonic, escalaDoCampo(escala), s.tetrade === true)
      : [s.contexto === 'nota' ? [tonic] : acordeDoCampo(escala, 1, s.contexto === 'tetrade').map(semi => tonic + semi)];
    /**
     * O padrão pode **descer** abaixo da tônica (decisão do Paulo: "o padrao pode repetir grau e
     * descer"), e aí a nota mais grave cai fora da região. O teste `contexto-musical` pegou: com a
     * tônica em 59 e um deslocamento negativo, soava 48.
     *
     * O desenho sobe **inteiro**, por oitavas, até caber. Um deslocamento só para todas as notas:
     * mover notas soltas quebraria o contorno, que é justamente o que a pessoa identifica — foi a
     * mesma lição de `acomodarMelodiaEAcorde`.
     */
    const cru = certa.semis.map(semi => tonic + semi);
    let sobe = 0;
    while (Math.min(...cru) + sobe < regiao(ctx).lo) sobe += 12;
    const notas = cru.map(m => m + sobe);

    return {
      prompt: ctx.t('quiz.whichPosition'),
      visual: { kind: 'ear', hint: ctx.t('quiz.whichPositionHint') },
      // Todas as posições, na ordem da escala: a pergunta é onde o desenho começou.
      surface: { kind: 'choices', options: shuffle(posicoes.map(p => rotulo(p))).map(plain), wide: true },
      expected: { kind: 'option', id: rotulo(certa) },
      sound: {
        groups: [...contexto, ...notas.map(m => [m])],
        // Ouvir em pedaços: o contexto sozinho e cada nota. Separar aqui AJUDA e não entrega — o
        // grau de uma nota só existe contra a tônica.
        partes: [
          { id: 'contexto', label: ctx.t('quiz.partContext'), groups: contexto },
          ...notas.map((m, n) => ({ id: `n${n}`, label: ctx.t('quiz.partNote', { n: n + 1 }), groups: [[m]] })),
        ],
      },
      autoplay: true, reveal: rotulo(certa),
    };
  },
};
