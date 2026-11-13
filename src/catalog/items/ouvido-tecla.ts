import { EM_DO_MAIOR, TONALIDADE_LIVRE, alturaDoPc, clave, grauDoPc, grausDaTonalidade, mod, note, noteName, pcNameUm, pcsPermitidas, pick } from '../helpers';
import type { Ctx, Question } from '../helpers';
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

/**
 * Uma altura da classe `pc` que **existe no braço** em vigor, casas 0–12, preferindo as que caem na
 * região pedida. Sem nenhuma na região, vale qualquer uma do braço: melhor sair da região que fazer
 * uma pergunta sem resposta possível — a mesma regra que `regiao` já segue.
 */
function alturaNoBraco(ctx: Ctx, pc: number): number {
  const noBraco = ctx.params.tuning.flatMap(t => Array.from({ length: 13 }, (_, k) => t + k))
    .filter(m => mod(m, 12) === pc);
  const { lo, hi } = ctx.params.range;
  const naRegiao = noBraco.filter(m => m >= lo && m <= hi);
  return pick(naRegiao.length ? naRegiao : noBraco);
}

export const ouvidoTecla: CatalogItem = {
  id: 'ouvido-tecla',
  objetos: ['notas'], tarefas: ['ouvir', 'tocar'],
  primaryModule: 'perception.melodic', skillTags: ['ear.pitch_identification', 'keyboard.note_finding'],
  contentTags: ['pitch.naturals', 'pitch.accidentals'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'referencia', label: ctx.t('settings.reference', { note: noteName(note(0), ctx.naming) }), type: 'toggle' },
    // Sem `quando`: isto é sobre **o que pode soar**, não sobre o teclado. Eu tinha escondido nos
    // modos de letra e grau, e estava errado — acidentes existem em qualquer superfície.
    { id: 'pretas', label: ctx.t('settings.blackKeys'), type: 'toggle' },
    /**
     * **Onde se responde** (`OR-ouvido-relativo.md`, §3.1: *"superfície de resposta (padrão: o
     * instrumento do perfil)"*). O estímulo é som, então não há superfície de estímulo e onde você
     * responde fica livre — é o princípio do §1, e aqui ele é posto para funcionar.
     *
     * ⚠️ **Letras e graus não dão a oitava**, e a oitava é a conferência deste item (decisão de
     * 10/11). O Paulo escolheu mantê-los mesmo assim em 12/11 — *"vale a pena ter letras e números
     * como resposta pra praticar, agrega valor"* —, com a condição de **ficar claro na tela** que
     * ali a oitava não conta. O enunciado muda nesses dois modos, e é só nisso que a conferência
     * relaxa para classe de altura; nos outros três ela segue exata.
     */
    { id: 'onde', label: ctx.t('settings.answerWhere'), type: 'single', options: [
      { id: 'auto', label: ctx.t('settings.myInstrument') },
      { id: 'teclado', label: ctx.t('settings.instrumentPiano') },
      { id: 'braco', label: ctx.t('settings.onNeck') },
      { id: 'pauta', label: ctx.t('settings.onStaff') },
      { id: 'letras', label: ctx.t('settings.byLetters') },
      { id: 'graus', label: ctx.t('settings.byDegrees') },
    ] },
  ],
  defaults: { referencia: true, pretas: false, onde: 'auto' },
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
    const onde = s.onde === 'auto' ? (ctx.params.instrument === 'piano' ? 'teclado' : 'braco') : String(s.onde ?? 'teclado');
    /**
     * **A nota só pode soar onde a resposta cabe.** É a lição que já estava escrita neste item para
     * o teclado — *"o teclado cobre a mesma faixa que pode soar"* — e que a superfície solta
     * reabriu: o som ia até Si5, e um violão nas casas 0–12 chega ao Mi4. Acima disso a pergunta
     * ficava sem resposta possível, que é o defeito de 09/11 de novo.
     *
     * Com letras ou graus não há faixa: a resposta é a classe de altura, e qualquer oitava serve.
     */
    const faixa = onde === 'pauta' ? { lo: 48, hi: 79 } : FAIXA;
    /**
     * No braço, a nota sai do **conjunto de alturas que existem nele**, não de uma faixa.
     *
     * Faixa não serve: o braço de um baixo nas casas 0–12 alcança 28 a 55, e numa janela dessas
     * faltam classes de altura inteiras — `alturaDoPc` então caía no plano B e devolvia uma nota
     * fora do alcance (medido: soava 60 num baixo que chega a 55). Enumerar o que existe é a mesma
     * escolha que consertou os distratores de ritmo: onde o espaço é pequeno, enumere.
     */
    const m = onde === 'braco' ? alturaNoBraco(ctx, p) : alturaDoPc(ctx, p, faixa);
    /**
     * **Letras e graus não carregam oitava**, então ali a conferência é por classe de altura — e o
     * enunciado DIZ isso, porque relaxar em silêncio faria o histórico afirmar o que não aconteceu.
     * Nos outros três modos a oitava continua sendo a resposta.
     */
    const semOitava = onde === 'letras' || onde === 'graus';
    const superficie =
      onde === 'braco' ? { kind: 'fretboard' as const, tuning: ctx.params.tuning, from: 0, to: 12 }
      : onde === 'pauta' ? { kind: 'staff' as const, clef: clave(ctx), accidentals: true }
      : onde === 'letras' ? { kind: 'letters' as const, accidentals: true }
      : onde === 'graus' ? { kind: 'choices' as const, options: grausDaTonalidade(ctx, permitidas) }
      : { kind: 'keyboard' as const, ...faixa };
    const base = s.referencia ? ctx.t('quiz.earNoteRef', { note: noteName(note(0), ctx.naming) }) : ctx.t('quiz.earNote');
    return {
      prompt: semOitava ? `${base} ${ctx.t('quiz.semOitava')}` : base, visual: { kind: 'ear' },
      // O teclado cobre **a mesma faixa que pode soar**. Era 60–71 enquanto o som sorteava em
      // 48–83: soava um ré3, não havia tecla de ré3, e o Paulo tinha de clicar uma oitava acima.
      // A resposta é por classe de altura, então clicar na oitava errada acertava — o errado era a
      // tela mentir sobre o que tinha soado.
      surface: superficie,
      /**
       * **A oitava exata**, não a classe de altura (decisão do Paulo, 10/11/2026: *"fazer com que o
       * exercício receba como resposta correta apenas a oitava específica da nota que foi tocada, e
       * não a mesma nota em outras oitavas como atualmente é"*).
       *
       * Era `pitchClass`, e isso é o que esconde o defeito que ele achou no teclado: clicar a nota
       * certa na oitava errada **acertava**, então nem o acerto denunciava que a tela mostrava uma
       * faixa e o som usava outra.
       *
       * De graça, a revelação melhora: o Player marca de verde toda tecla que valida como certa, e
       * com classe de altura ele pintava **as três oitavas**. Agora pinta uma.
       */
      expected: semOitava
        ? (onde === 'graus' ? { kind: 'option', id: grauDoPc(ctx, mod(m, 12)) } : { kind: 'pitchClass', pc: mod(m, 12) })
        : { kind: 'pitch', midi: m },
      sound: { groups: s.referencia ? [[60], [m]] : [[m]] }, autoplay: true,
      // A oitava entra na revelação porque entrou na resposta: errar a oitava e não saber qual era
      // não ensina nada.
      reveal: semOitava
        ? (onde === 'graus' ? grauDoPc(ctx, mod(m, 12)) : pcNameUm(mod(m, 12), ctx.naming, false))
        : `${pcNameUm(mod(m, 12), ctx.naming, false)}${Math.floor(m / 12) - 1}`,
    };
  },
};
