import { EM_DO_MAIOR, TONALIDADE_LIVRE, alturaDoPc, note, noteName, pcName, pcsPermitidas, pick } from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * A faixa em que a nota soa **e** o teclado que a pessoa vê. Uma constante só, de propósito: eram
 * dois números diferentes em dois lugares, e foi exatamente isso que deu errado.
 *
 * Dó2 a Si5: o dó central (60) fica no meio, com duas oitavas abaixo e uma acima — que é o que o
 * Paulo pediu ao dizer "um dó central e teclas abaixo e acima dele".
 */
const FAIXA = { lo: 48, hi: 83 };

export const ouvidoTecla: CatalogItem = {
  id: 'ouvido-tecla',
  objetos: ['notas'], tarefas: ['ouvir', 'tocar'],
  primaryModule: 'perception.melodic', skillTags: ['ear.pitch_identification', 'keyboard.note_finding'],
  contentTags: ['pitch.naturals', 'pitch.accidentals'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [{ id: 'referencia', label: ctx.t('settings.reference', { note: noteName(note(0), ctx.naming) }), type: 'toggle' }, { id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle' }],
  defaults: { referencia: true, pretas: false },
  /**
   * Os dois atalhos são as duas habilidades distintas que este item pode treinar, e é a
   * **referência** que as separa — foi a saída para a dúvida do Paulo sobre ele ser redundante com
   * os intervalos:
   *
   * - com referência e dó maior, a pergunta é "que grau é", respondida no teclado;
   * - sem referência e sem tonalidade, é nomear a altura sem âncora nenhuma — e **nenhum outro
   *   item do catálogo treina isso**.
   */
  presets: [
    { id: 'grau', nome: 'presets.teclaGrau', settings: { referencia: true, pretas: true }, params: EM_DO_MAIOR },
    { id: 'brancas', nome: 'presets.teclaBrancas', settings: { referencia: true, pretas: false }, params: EM_DO_MAIOR },
    { id: 'sem-ancora', nome: 'presets.teclaSemAncora', settings: { referencia: false, pretas: true }, params: TONALIDADE_LIVRE },
  ],
  presentation: { gap: 0.9 },
  make(s, ctx): Question {
    const permitidas = pcsPermitidas(ctx).filter(x => s.pretas || ![1, 3, 6, 8, 10].includes(x));
    const p = pick(permitidas);
    const m = alturaDoPc(ctx, p, FAIXA);
    return {
      prompt: s.referencia ? ctx.t('quiz.earNoteRef', { note: noteName(note(0), ctx.naming) }) : ctx.t('quiz.earNote'), visual: { kind: 'ear' },
      // O teclado cobre **a mesma faixa que pode soar**. Era 60–71 enquanto o som sorteava em
      // 48–83: soava um ré3, não havia tecla de ré3, e o Paulo tinha de clicar uma oitava acima.
      // A resposta é por classe de altura, então clicar na oitava errada acertava — o errado era a
      // tela mentir sobre o que tinha soado.
      surface: { kind: 'keyboard', ...FAIXA }, expected: { kind: 'pitchClass', pc: p },
      sound: { groups: s.referencia ? [[60], [m]] : [[m]] }, autoplay: true,
      reveal: pcName(m, ctx.naming),
    };
  },
};
