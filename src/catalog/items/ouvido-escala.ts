import { ALL_SCALES, DIRECAO, EM_DO_MAIOR, MODES, TONALIDADE_LIVRE, arr, notaGrafada, noteName, pick, scaleName, scaleSound, tonicaNaRegiao, TIMBRE, TIMBRE_DEFAULTS, vozDaPergunta } from '../helpers';
import type { ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

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
    { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    DIRECAO(ctx),
    /**
     * **O timbre** — compartilhado em `TIMBRE`, de `helpers` (19/11): o do perfil, um escolhido, ou
     * sorteado a cada pergunta. O sorteio é o que treina ouvir independente do timbre.
     */
    ...TIMBRE(ctx),
  ],
  defaults: { estimulo: 'som', tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'sobe', ...TIMBRE_DEFAULTS },
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
