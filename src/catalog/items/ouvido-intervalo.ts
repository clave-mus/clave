import { EM_DO_MAIOR, SEMI_TIER, TODOS_OS_INTERVALOS, TONALIDADE_LIVRE, alturaNaRegiao, arr, clave, pick, semiOptions, semitoneName, tonicaDeContexto } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/** A nota escrita de uma altura, na grafia com sustenido. */
function notaEscrita(m: number) {
  const pc = ((m % 12) + 12) % 12;
  return { letter: [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc] as 0, acc: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][pc], oct: Math.floor(m / 12) - 1 };
}

export const ouvidoIntervalo: CatalogItem = {
  id: 'ouvido-intervalo',
  objetos: ['intervalos'], tarefas: ['ouvir'],
  primaryModule: 'perception.melodic', skillTags: ['ear.interval_identification'],
  contentTags: ['interval.simple'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **De onde vem a pergunta** (modelo de 12/11). `escrito` é o oposto desta linha: *"ler duas
     * notas, audiar o intervalo e ouvir a resposta como conferência"*.
     *
     * ⚠️ **O que esta migração NÃO fez**: o §3.3 pede que, ouvindo, a resposta sejam **as notas**
     * numa superfície (com conferência por contorno), e aqui ela continua sendo o NOME do intervalo
     * em alternativas. Trocar isso é mexer na pergunta do item, não na direção — peça própria, e
     * está anotada em `revisao-pendente.md`.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: semiOptions(ctx).map(o => ({ ...o, tier: SEMI_TIER[Number(o.id)] })) },
    { id: 'direcao', label: ctx.t('settings.direction'), type: 'single', options: [{ id: 'sobe', label: ctx.t('settings.up') }, { id: 'desce', label: ctx.t('settings.down') }, { id: 'juntas', label: ctx.t('settings.together') }, { id: 'misto', label: ctx.t('settings.mixed') }] }],
  defaults: { estimulo: 'som', intervalos: ['3', '4', '5', '7', '12'], direcao: 'sobe' },
  /**
   * O Paulo quis os doze intervalos e dó maior como entrada, e **melódicos e harmônicos como
   * etapas distintas** na rotina dele — daí os dois primeiros atalhos serem o mesmo conteúdo em
   * direções diferentes, e não um atalho com "misto".
   *
   * O terceiro existe para dar o caminho de volta: ver `TONALIDADE_LIVRE` em `helpers`.
   */
  presets: [
    { id: 'melodicos', nome: 'presets.intervalosMelodicos', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'sobe' }, params: EM_DO_MAIOR },
    { id: 'harmonicos', nome: 'presets.intervalosHarmonicos', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'juntas' }, params: EM_DO_MAIOR },
    { id: 'descendo', nome: 'presets.intervalosDescendo', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'desce' }, params: EM_DO_MAIOR },
    { id: 'livre', nome: 'presets.intervalosLivre', settings: { intervalos: TODOS_OS_INTERVALOS, direcao: 'misto' }, params: TONALIDADE_LIVRE },
  ],
  make(s, ctx) {
    const ids = arr(s.intervalos, ['4', '7']);
    const d = Number(pick(ids));
    const base = alturaNaRegiao(ctx, { lo: 52, hi: 67 });
    const dir = s.direcao === 'misto' ? pick(['sobe', 'desce', 'juntas']) : s.direcao;
    const groups = dir === 'juntas' ? [[base, base + d]] : dir === 'desce' ? [[base + d], [base]] : [[base], [base + d]];
    /**
     * **Audiar**: as duas notas aparecem na pauta, o contexto toca, e o intervalo fica no botão de
     * conferência — na forma que a configuração pede (juntas ou em sequência).
     *
     * A pauta é a superfície do estímulo aqui, e não há seletor: as duas notas de um intervalo
     * harmônico soam juntas, e marcar duas posições num braço sem dizer qual é qual não ajuda. O
     * §3.3 lista mais superfícies, e elas vêm com a peça que também muda a RESPOSTA.
     */
    if (s.estimulo === 'escrito') {
      const tonica = tonicaDeContexto(ctx, base);
      return {
        prompt: ctx.t('quiz.audiateInterval'),
        visual: { kind: 'staff', clef: clave(ctx), columns: dir === 'juntas' ? [[base, base + d].map(notaEscrita)] : groups.map(g => g.map(notaEscrita)) },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups },
          ],
        },
        autoplay: false, reveal: semitoneName(d, ctx.conv),
      };
    }
    return {
      prompt: ctx.t('quiz.earInterval'), visual: { kind: 'ear', hint: ctx.t(dir === 'juntas' ? 'quiz.hintTogether' : dir === 'desce' ? 'quiz.hintDown' : 'quiz.hintUp') },
      surface: { kind: 'choices', options: ids.map(i => ({ id: i, label: semitoneName(Number(i), ctx.conv) })) }, expected: { kind: 'option', id: String(d) },
      sound: { groups }, autoplay: true, reveal: semitoneName(d, ctx.conv),
    };
  },
};
