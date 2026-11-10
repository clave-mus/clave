import { ALL_SCALES, DIRECAO, EM_DO_MAIOR, MODES, TONALIDADE_LIVRE, arr, pick, scaleName, scaleSound, tonicaNaRegiao } from '../helpers';
import type { ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const ouvidoEscala: CatalogItem = {
  id: 'ouvido-escala',
  objetos: ['escalas'], tarefas: ['ouvir'],
  primaryModule: 'perception.melodic', skillTags: ['ear.scale_quality'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    DIRECAO(ctx),
  ],
  defaults: { tipos: ['maior', 'menor', 'menor-harmonica'], direcao: 'sobe' },
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
    return {
      prompt: ctx.t('quiz.whatScale'), visual: { kind: 'ear' },
      surface: { kind: 'choices', options: types.map(t => ({ id: t, label: scaleName(ctx.t, t) })), wide: true }, expected: { kind: 'option', id: type },
      sound: { groups: ms.map(m => [m]) }, autoplay: true, reveal: scaleName(ctx.t, type),
    };
  },
};
