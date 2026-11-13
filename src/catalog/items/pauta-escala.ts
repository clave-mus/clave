import { ALL_SCALES, CLEFS, ROOTS, arr, buildScale, midi, noteName, optionsWith, pcPermitido, pick, pickClef, plain, scaleName, shuffle } from '../helpers';
import type { MessageKey, Note, ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

export const pautaEscala: CatalogItem = {
  id: 'pauta-escala',
  objetos: ['escalas', 'notacao'], tarefas: ['ler'],
  primaryModule: 'theory', skillTags: ['theory.scale_identification', 'notation.pitch_reading'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues', 'clef.treble', 'clef.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'material'],
  publicacao: LEGADO,
  settings: ctx => [CLEFS(ctx), { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) }],
  defaults: { claves: ['sol'], tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] },
  presentation: { gap: 0.32 },
  make(s, ctx) {
    const clef = pickClef(s, ctx);
    const types = arr(s.tipos, ['maior']) as ScaleId[];
    const type = pick(types);
    const tonic = { ...ROOTS[pcPermitido(ctx)], oct: clef === 'sol' ? 4 : 2 };
    const notes = [...buildScale(tonic, type), { ...tonic, oct: tonic.oct + 1 }];
    const name = (t: Note, id: ScaleId) => ctx.t('quiz.scaleOf', { note: noteName(t, ctx.naming), scale: ctx.t(`theory.scalesInline.${id}` as MessageKey) });
    /**
     * **Todas as alternativas têm a MESMA tônica**, e diferem só no tipo de escala.
     *
     * O defeito que isto conserta (Paulo, 12/11): *"é muito fácil saber a resposta só vendo qual é
     * a nota inicial, pois as alternativas têm isso no nome"*. O lote anterior misturava alguns
     * nomes com a tônica certa e quatro com outras tônicas — então ler a primeira nota da pauta
     * descartava quatro de seis sem saber escala nenhuma. E com um tipo só marcado (o padrão!), a
     * resposta era a ÚNICA com a tônica certa: o exercício virava leitura de uma nota.
     *
     * Agora a tônica não carrega informação, e o que distingue as alternativas é o que o exercício
     * pergunta: que escala é.
     *
     * Os tipos distratores saem primeiro dos que a pessoa marcou; se forem poucos, completam-se com
     * os vizinhos de `ALL_SCALES`. É a tensão consciente com a regra de "distrator que o gerador
     * poderia ter produzido" — aqui vale menos que não entregar a resposta de graça.
     */
    const outros = shuffle([...types.filter(t => t !== type), ...ALL_SCALES.filter(t => t !== type && !types.includes(t))]);
    const pool = [type, ...outros.slice(0, 5)].map(t => name(tonic, t));
    const correct = name(tonic, type);
    return {
      prompt: ctx.t('quiz.whatScale'), visual: { kind: 'staff', clef, columns: notes.map(n => [n]) },
      surface: { kind: 'choices', options: optionsWith(correct, [...new Set(pool)], 6).map(plain), wide: true }, expected: { kind: 'option', id: correct },
      sound: { groups: notes.map(n => [midi(n)]) }, reveal: correct,
    };
  },
};
