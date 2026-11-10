import { INST, arr, mod, paresNoBraco, pcNameUm, pick, semiOptions, semisDoIntervalo, semitoneName, tuningOf, vozDoBraco } from '../helpers';
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
   * **Nada.** E isto é um achado da reorganização, pego pelo teste `contexto-declarado`.
   *
   * `que-intervalo-e-esse` declarava `['key', 'material']` porque a metade da PAUTA lia os dois
   * (via `notaNaPauta`). A metade do braço nunca leu nenhum: ela enumera os pares do braço e filtra
   * por semitons. A declaração antiga era a **união** das superfícies — então o painel de prática
   * oferecia tonalidade e material dentro do braço, onde não faziam nada.
   *
   * É o mesmo defeito que o controle de material tem com tonalidade livre: controle morto ensina a
   * pessoa errado. Separado, cada item declara o que de fato lê.
   *
   * 👤 Oportunidade, não feita aqui: o braço **poderia** respeitar material, filtrando os pares para
   * as notas da tonalidade. Seria comportamento novo, não reorganização, e é escolha do Paulo.
   */
  respeita: [],
  publicacao: LEGADO,
  settings: ctx => [
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'identificar', label: ctx.t('settings.nameIt') },
      { id: 'construir', label: ctx.t('settings.buildIt') },
    ] },
    INST(ctx),
    { id: 'intervalos', label: ctx.t('settings.intervals'), type: 'multi', options: INTERVALS.map(i => ({ id: i.id, label: ivLabelSemis(i.id, ctx), tier: i.tier })) },
  ],
  defaults: { direcao: 'identificar', instrumento: 'auto', intervalos: ['m2', 'M2', 'm3', 'M3', 'J4', 'J5', 'm6', 'M6', 'J8'] },
  make(s, ctx) {
    const tuning = tuningOf(s, ctx);
    const querSemis = new Set(arr(s.intervalos, ['M3']).map(semisDoIntervalo));
    const pares = paresNoBraco(tuning).filter(x => querSemis.has(x.d));
    const par = pares.length ? pick(pares) : pick(paresNoBraco(tuning));
    const lo = tuning[par.s1] + par.f1;

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
