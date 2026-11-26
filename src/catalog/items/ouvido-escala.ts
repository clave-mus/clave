import { ALL_SCALES, DIRECAO, EM_DO_MAIOR, MODES, TONALIDADE_LIVRE, arr, midi, notaGrafada, noteName, pick, scaleName, scaleSound, tonicaNaRegiao, TIMBRE, TIMBRE_DEFAULTS, vozDaPergunta } from '../helpers';
import type { ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem, Ctx, Question, SettingValue } from '../types';
import { getModo, notasDoModo } from '../../theory/digitacoes';
import { MODOS_DEFAULTS, MODOS_SETTINGS, opcoesDeModo, rotuloComNome, sortearModo } from '../modos';

/**
 * **Que modo soou** — a rota `modos` do item, decidida com ele em 26/11.
 *
 * As alternativas partem **todas da mesma tônica**, como no `pauta-escala`: com tônicas diferentes
 * nos nomes, ler a primeira nota descartaria metade das opções sem ouvir escala nenhuma.
 *
 * O enunciado e as alternativas dizem o **grau** (*"4º modo da menor melódica"*); a revelação
 * acrescenta o nome tradicional quando ele existe. É a convenção que ele fixou em 25/11 para a
 * digitação, e reusá-la é o que mantém os dois exercícios falando a mesma língua.
 */
function perguntaDeModo(s: Record<string, SettingValue>, ctx: Ctx): Question {
  const { familia, grau, pares } = sortearModo(s, pick);
  const tonic = tonicaNaRegiao(ctx, { lo: 55, hi: 62 });
  const notas = notasDoModo(getModo(notaGrafada(ctx, tonic), familia, grau));
  const alturas = [...notas.map(midi), midi(notas[0]) + 12];
  const ms = s.direcao === 'desce' ? [...alturas].reverse()
    : s.direcao === 'ambos' ? [...alturas, ...[...alturas].reverse().slice(1)] : alturas;

  const certa = `${familia}:${grau}`;
  const opcoes = opcoesDeModo(ctx, pares);
  const revelacao = rotuloComNome(ctx, familia, grau);

  if (s.estimulo === 'escrito') {
    return {
      prompt: ctx.t('quiz.audiateScaleByName', { scale: revelacao, note: noteName(notaGrafada(ctx, tonic), ctx.naming) }),
      visual: { kind: 'text', text: '' },
      surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
      sound: {
        groups: [[tonic]],
        partes: [
          { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonic]] },
          { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: ms.map(m => [m]) },
        ],
      },
      autoplay: false, reveal: revelacao, presentation: vozDaPergunta(s),
    };
  }
  return {
    prompt: ctx.t('quiz.whatScale'), visual: { kind: 'ear' },
    surface: { kind: 'choices', options: opcoes, wide: true, compact: opcoes.length > 8 },
    expected: { kind: 'option', id: certa },
    sound: { groups: ms.map(m => [m]) }, autoplay: true, reveal: revelacao, presentation: vozDaPergunta(s),
  };
}

export const ouvidoEscala: CatalogItem = {
  id: 'ouvido-escala',
  objetos: ['escalas'], tarefas: ['ouvir'],
  primaryModule: 'ouvido', skillTags: ['ear.scale_quality'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **Audiar uma escala pelo NOME** — o modo que faltava, e que o item `audiar` fazia sozinho até
     * 20/11. Com ele aposentado (decisão do Paulo), o que ele cobrava precisa existir aqui, senão a
     * aposentadoria deixa buraco: *"o que existe atualmente no Audiar não pode ser perdido"*.
     *
     * **Só pelo nome, e não na pauta**: escala escrita na pauta já é outro item (`pauta-escala`).
     * Aqui o enunciado diz "audie a escala menor harmônica de Lá", toca a tônica, e o gabarito fica
     * no botão — é o exercício de ouvir por dentro, sem notação nenhuma.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    /**
     * **O que entra no sorteio: escalas ou modos** — decisão dele em 26/11.
     *
     * Ele pediu os modos das duas menores e viu o problema junto: *"talvez fique muita coisa para
     * selecionar cada escala de uma só vez"*. Medido, ele tinha razão — cadastrar os modos das
     * menores como escalas levaria a lista de **13 para 25 chips**, e não só aqui: `ALL_SCALES` é
     * lido em 25 lugares, então pauta e braço ganhariam 25 também, sem ninguém pedir.
     *
     * Então o painel troca de lista em vez de crescer: `escalas` é a lista de sempre, `modos` é
     * **família × grau** — 3 interruptores e 7 chips cobrindo 21 modos. O eixo é o mesmo que o
     * `escala-no-instrumento` já usa para montar digitação, e o motor (`getModo`) é o mesmo.
     */
    { id: 'material', label: ctx.t('modes.material'), type: 'single', options: [
      { id: 'escalas', label: ctx.t('modes.materialEscalas') },
      { id: 'modos', label: ctx.t('modes.materialModos') },
    ] },
    { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', quando: s => s.material !== 'modos',
      options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    ...MODOS_SETTINGS(ctx, s => s.material === 'modos'),
    DIRECAO(ctx),
    /**
     * **O timbre** — compartilhado em `TIMBRE`, de `helpers` (19/11): o do perfil, um escolhido, ou
     * sorteado a cada pergunta. O sorteio é o que treina ouvir independente do timbre.
     */
    ...TIMBRE(ctx),
  ],
  defaults: { estimulo: 'som', tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'sobe',
    ...MODOS_DEFAULTS, ...TIMBRE_DEFAULTS },
  /**
   * "Todas as escalas, uma etapa só" (Paulo, 09/11) — e isso **obriga** `direcao: 'ambos'`. Não é
   * gosto: com as duas menores melódicas marcadas e só subindo, o `problema` acima recusa a
   * pergunta, porque o áudio é idêntico (decisão 70). Só descendo elas se distinguem.
   */
  presets: [
    { id: 'todas', nome: 'presets.escalasTodas', settings: { tipos: ALL_SCALES, direcao: 'ambos' }, params: EM_DO_MAIOR },
    { id: 'tres', nome: 'presets.escalasTres', settings: { tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'ambos' }, params: EM_DO_MAIOR },
    { id: 'modos', nome: 'presets.escalasModos', settings: { tipos: MODES, direcao: 'sobe' }, params: EM_DO_MAIOR },
    { id: 'livre', nome: 'presets.escalasLivre', settings: { tipos: ALL_SCALES, direcao: 'ambos' }, params: TONALIDADE_LIVRE },
    /**
     * Os atalhos da rota dos modos (26/11). O da menor melódica é o que ele pediu primeiro, e o
     * "todos os modos" só faz sentido depois de reconhecer os de uma família — 21 alternativas é
     * a versão difícil.
     */
    { id: 'modos-melodica', nome: 'presets.escalasModosMelodica',
      settings: { material: 'modos', familia: ['menor-melodica-jazz'], graus: ['1', '2', '3', '4', '5', '6', '7'], direcao: 'sobe' }, params: EM_DO_MAIOR },
    { id: 'modos-harmonica', nome: 'presets.escalasModosHarmonica',
      settings: { material: 'modos', familia: ['menor-harmonica'], graus: ['1', '2', '3', '4', '5', '6', '7'], direcao: 'sobe' }, params: EM_DO_MAIOR },
    { id: 'modos-todos', nome: 'presets.escalasModosTodos',
      settings: { material: 'modos', familia: ['maior', 'menor-harmonica', 'menor-melodica-jazz'], graus: ['1', '2', '3', '4', '5', '6', '7'], direcao: 'sobe' }, params: EM_DO_MAIOR },
  ],
  presentation: { gap: 0.3 },
  // As duas melódicas são IDÊNTICAS subindo (decisão 70). Com as duas marcadas e direção só
  // ascendente, a pergunta é fisicamente impossível de responder: é o mesmo áudio. Recusar é o
  // que a decisão 13 manda — item ambíguo não pode gerar "erro do usuário".
  problema(s, ctx) {
    const types = arr(s.tipos, []) as ScaleId[];
    const asDuas = types.includes('menor-melodica') && types.includes('menor-melodica-jazz');
    return asDuas && (s.direcao ?? 'sobe') === 'sobe' ? ctx.t('player.sameAscending') : null;
  },
  make(s, ctx) {
    if (s.material === 'modos') return perguntaDeModo(s, ctx);
    const types = arr(s.tipos, ['maior', 'menor']) as ScaleId[];
    const type = pick(types);
    const tonic = tonicaNaRegiao(ctx, { lo: 55, hi: 62 });
    const ms = scaleSound(tonic, type, s.direcao);
    /**
     * Audiando: o enunciado **diz a escala**, só a tônica soa, e a escala inteira fica no botão de
     * gabarito. A autoavaliação espera esse botão — julgar antes de conferir é julgar no vácuo.
     */
    if (s.estimulo === 'escrito') {
      return {
        prompt: ctx.t('quiz.audiateScaleByName', { scale: scaleName(ctx.t, type), note: noteName(notaGrafada(ctx, tonic), ctx.naming) }),
        visual: { kind: 'text', text: '' },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonic]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonic]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: ms.map(m => [m]) },
          ],
        },
        autoplay: false, reveal: scaleName(ctx.t, type), presentation: vozDaPergunta(s),
      };
    }
    return {
      prompt: ctx.t('quiz.whatScale'), visual: { kind: 'ear' },
      surface: { kind: 'choices', options: types.map(t => ({ id: t, label: scaleName(ctx.t, t) })), wide: true }, expected: { kind: 'option', id: type },
      sound: { groups: ms.map(m => [m]) }, autoplay: true, reveal: scaleName(ctx.t, type), presentation: vozDaPergunta(s),
    };
  },
};
