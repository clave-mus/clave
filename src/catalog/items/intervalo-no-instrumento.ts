import { INST, arr, mod, tonicaDeContexto, paresNoBraco, pcNameUm, pcPermitida, pick, semiOptions, semisDoIntervalo, semitoneName, tuningOf, vozDoBraco } from '../helpers';
import { INTERVALS } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Intervalo no instrumento: **identificar** o que está marcado, ou **construir** a partir de uma nota.
 *
 * Metade de `que-intervalo-e-esse` mais metade de `faca-o-intervalo`. O porquê do eixo está em
 * `nota-na-pauta.ts`; a prova específica deste par está em `intervalo-na-pauta.ts` — a regra do
 * braço estava escrita **nos dois** itens antigos, e no segundo com um "vale igual aqui".
 *
 * ## A resposta é o número de semitons, não a qualidade
 *
 * O desenho de uma terça menor e de uma segunda aumentada no braço é **o mesmo**. Cobrar a
 * qualidade seria cobrar o que não está ali. Na pauta é o contrário, e por isso os dois itens têm
 * vocabulários de resposta diferentes — que separados deixam de precisar de `Setting.quando`.
 *
 * ## O que a fusão antiga já tinha consertado, e segue valendo
 *
 * `braco-intervalo` era o único item de intervalo **sem seletor de intervalos**, e o par saía de um
 * passeio aleatório com distribuição descontrolada. O seletor filtra os pares enumerados.
 *
 * E `faca-o-intervalo` no braço nasceu quebrado (`B4`) e foi consertado em `X9`: braço vazio, som
 * estranho, e a revelação mostrava todas as posições da classe de altura sem dizer qual nota era.
 * Aqui a revelação nomeia a nota com **uma** grafia, como no item de nota.
 */
export const intervaloNoInstrumento: CatalogItem = {
  id: 'intervalo-no-instrumento',
  objetos: ['intervalos'], tarefas: ['nomear', 'tocar'],
  primaryModule: 'theory',
  skillTags: ['theory.interval_naming', 'fretboard.interval_shapes'],
  contentTags: ['interval.simple', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  /**
   * Material **passou a valer no braço** (pedido do Paulo, 10/11/2026).
   *
   * Era um achado da reorganização: `que-intervalo-e-esse` declarava `['key','material']` porque a
   * metade da PAUTA lia os dois, e a metade do braço nunca leu nenhum. A declaração era a união das
   * superfícies, e o painel oferecia tonalidade e material dentro do braço onde não faziam nada.
   *
   * Em vez de só declarar a verdade (`[]`), o braço passou a de fato respeitar: com material
   * diatônico e tonalidade fixa, **as duas notas do par têm de estar na tonalidade**. É a restrição
   * real da música — os intervalos que se encontram tocando numa tonalidade são os que aquela
   * tonalidade produz, e o tamanho muda com o grau: a terça de Dó é maior, a de Ré é menor.
   *
   * Medido antes de fazer, no violão até a casa 9: 453 pares no total, **138 sobrevivem** ao filtro
   * de dó maior (30%), e **nenhum tamanho zera** — o mais magro fica com 4. E onde afina, a magreza
   * é verdadeira: o semitom em dó maior existe só em Mi→Fá e Si→Dó, e o trítono só em Fá→Si.
   */
  respeita: ['key', 'material', 'range'],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'identificar', label: ctx.t('settings.nameIt') },
      { id: 'construir', label: ctx.t('settings.buildIt') },
      { id: 'audiar', label: ctx.t('settings.audiateIt') },
    ] },
    INST(ctx),
    { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: INTERVALS.map(i => ({ id: i.id, label: ivLabelSemis(i.id, ctx), tier: i.tier })) },
  ],
  defaults: { direcao: 'identificar', instrumento: 'auto', intervalos: ['m2', 'M2', 'm3', 'M3', 'J4', 'J5', 'm6', 'M6', 'J8'] },
  make(s, ctx) {
    const tuning = tuningOf(s, ctx);
    const querSemis = new Set(arr(s.intervalos, ['M3']).map(semisDoIntervalo));
    const noMaterial = (x: { s1: number; f1: number; d: number }) => {
      const a = tuning[x.s1] + x.f1;
      return pcPermitida(ctx, a) && pcPermitida(ctx, a + x.d);
    };
    const todos = paresNoBraco(tuning);
    // Em escada: o tamanho pedido E o material; só o tamanho; qualquer par. O material nunca zera
    // com as tonalidades de hoje (medido), mas a escada protege de uma seleção estreita futura.
    const pares = todos.filter(x => querSemis.has(x.d) && noMaterial(x));
    const par = pares.length ? pick(pares)
      : (p2 => p2.length ? pick(p2) : pick(todos))(todos.filter(x => querSemis.has(x.d)));
    const lo = tuning[par.s1] + par.f1;

    if (s.direcao === 'audiar') {
      return {
        prompt: ctx.t('quiz.audiateIntervalOnNeck'),
        visual: { kind: 'fretboard', tuning, from: 0, to: 9, marks: [{ s: par.s1, f: par.f1, label: '1' }, { s: par.s2, f: par.f2, color: 'var(--ve)' }] },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonicaDeContexto(ctx, lo)]], instrument: vozDoBraco(tuning),
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonicaDeContexto(ctx, lo)]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [[lo], [lo + par.d]] },
          ],
        },
        autoplay: false, reveal: semitoneName(par.d, ctx.conv),
      };
    }
    if (s.direcao === 'construir') {
      const alvoPc = mod(lo + par.d, 12);
      return {
        prompt: ctx.t('quiz.tapIntervalFrom', { interval: semitoneName(par.d, ctx.conv) }),
        visual: { kind: 'fretboard', tuning, from: 0, to: 9, marks: [{ s: par.s1, f: par.f1, label: '1' }] },
        surface: { kind: 'fretboard', tuning, from: 0, to: 9 }, expected: { kind: 'pitchClass', pc: alvoPc },
        sound: { groups: [[lo]], instrument: vozDoBraco(tuning) },
        reveal: pcNameUm(alvoPc, ctx.naming, Math.random() < 0.5),
      };
    }
    return {
      prompt: ctx.t('quiz.whatInterval'),
      visual: { kind: 'fretboard', tuning, from: 0, to: 9, marks: [{ s: par.s1, f: par.f1, label: '1' }, { s: par.s2, f: par.f2, color: 'var(--ve)' }] },
      surface: { kind: 'choices', options: semiOptions(ctx) }, expected: { kind: 'option', id: String(par.d) },
      sound: { groups: [[lo], [lo + par.d]], instrument: vozDoBraco(tuning) }, reveal: semitoneName(par.d, ctx.conv),
    };
  },
};

/** O rótulo do intervalo **em semitons**, que é o que o braço cobra. */
function ivLabelSemis(id: string, ctx: Parameters<typeof semitoneName>[0] extends never ? never : { conv: 'pt' | 'en' }): string {
  return semitoneName(semisDoIntervalo(id), ctx.conv);
}
