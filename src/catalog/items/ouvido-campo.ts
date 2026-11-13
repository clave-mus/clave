import { EM_DO_MAIOR, arr, pick, randInt, regiao, scaleName, tonicaNaRegiao } from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem, SettingValue } from '../types';
import { grauDaFundamental, materialDoCampo, opcoesDeEmprestimo, type CampoDoExercicio } from '../../theory/campo-harmonico';
import { CADENCIAS, acordeNoTeto, caberNaFaixa, cadenciaHarmonica } from '../../theory/cadencia-harmonica';

const EM_LA_MENOR = { key: { tonic: 9, mode: 'menor' } } as const;
/** O material filtrado pelo que a pessoa incluiu: graus marcados + empréstimos marcados. */
function poolDe(s: Record<string, SettingValue>, conv: 'pt' | 'en' = 'pt') {
  const campo: CampoDoExercicio = s.campo === 'menor' ? 'menor' : 'maior';
  const graus = arr(s.graus, ['1', '2', '3', '4', '5', '6', '7']);
  // Os dois lidos SEMPRE, de propósito: `configuracoes-vivas` mede por Proxy o que o make lê.
  const doMaior = Array.isArray(s.emprestimos) ? s.emprestimos : [];
  const doMenor = Array.isArray(s.emprestimosMenor) ? s.emprestimosMenor : [];
  const emprestimos = campo === 'menor' ? doMenor : doMaior;
  return materialDoCampo(campo, s.tetrades !== false, conv)
    .filter(a => (a.emprestimo ? emprestimos.includes(a.id) : graus.includes(a.id.slice(1))));
}

/**
 * Graus do campo harmônico (`OR-ouvido-relativo.md`, §3.5): soa um contexto (cadência por padrão)
 * e depois UM acorde do campo — ou um empréstimo de fora dele. A pergunta é qual grau soou.
 * Complemento de `ouvido-acorde`: lá toda qualidade soa sobre a MESMA fundamental e a pergunta é
 * a cor; aqui cor e lugar vêm juntos — **grau e qualidade numa pergunta só** (decisão do Paulo:
 * duas perguntas inflariam o histórico e deixariam a pessoa "80% certa" acertando só o grau). O
 * romano já diz os dois: responder `IV` onde era `iv` é erro. "Só o grau" é o modo mais fácil.
 */
export const ouvidoCampo: CatalogItem = {
  id: 'ouvido-campo',
  objetos: ['harmonia', 'acordes'], tarefas: ['ouvir'],
  primaryModule: 'perception.harmonic', skillTags: ['ear.harmonic_function'],
  contentTags: ['harmony.diatonic_field', 'chord.triads', 'chord.sevenths'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range'],
  publicacao: RASCUNHO,
  settings: ctx => [
    /**
     * **De onde vem a pergunta** (modelo de 12/11; ver `melodia-de-ouvido`). `escrito` é o oposto
     * que o Paulo descreveu para esta linha: *"ler um grau do campo harmônico, ouvir o contexto,
     * audiar seu arpejo, ouvir a resposta pra conferir"*.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    { id: 'campo', label: ctx.t('settings.field'), type: 'single',
      options: (['maior', 'menor'] as const).map(m => ({ id: m, label: scaleName(ctx.t, m) })) },
    { id: 'tetrades', label: ctx.t('settings.tetrads'), type: 'toggle' },
    { id: 'graus', label: ctx.t('settings.fieldDegrees'), type: 'multi', justify: true,
      options: ['1', '2', '3', '4', '5', '6', '7'].map(g => ({ id: g, label: g })) },
    // Um chip de empréstimo por campo, porque as listas são OUTRAS (`theory/campo-harmonico.ts`).
    { id: 'emprestimos', label: ctx.t('settings.borrowed'), type: 'multi', justify: true, podeVazio: true,
      quando: s => s.campo !== 'menor', options: opcoesDeEmprestimo('maior') },
    { id: 'emprestimosMenor', label: ctx.t('settings.borrowed'), type: 'multi', justify: true, podeVazio: true,
      quando: s => s.campo === 'menor', options: opcoesDeEmprestimo('menor') },
    { id: 'resposta', label: ctx.t('settings.answerDetail'), type: 'single',
      options: [{ id: 'romano', label: ctx.t('settings.answerRoman') }, { id: 'grau', label: ctx.t('settings.answerDegreeOnly') }] },
    // Como em `ouvido-acorde`, inversão é dificuldade, não pergunta — e é segura: há teste varrendo
    // que nenhum par do material divide o mesmo conjunto de classes de altura.
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle' },
    { id: 'contexto', label: ctx.t('settings.patternContext'), type: 'single',
      options: [{ id: 'ii-V-I', label: ctx.t('settings.contextIIVI') }, { id: 'I-IV-V-I', label: ctx.t('settings.contextIIVVI') },
        { id: 'nota', label: ctx.t('settings.contextTonic') }] },
    { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true,
      present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
    { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.5, max: 4, step: 0.1,
      format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) },
  ],
  defaults: { estimulo: 'som', campo: 'maior', tetrades: true, graus: ['1', '2', '3', '4', '5', '6', '7'], emprestimos: [],
    emprestimosMenor: [], resposta: 'romano', inversoes: false, contexto: 'ii-V-I', arpejo: false, duracao: 2 },
  presets: [
    { id: 'maior-tetrades', nome: 'presets.campoTetrades', settings: { campo: 'maior', tetrades: true, emprestimos: [] }, params: EM_DO_MAIOR },
    { id: 'maior-triades', nome: 'presets.campoTriades', settings: { campo: 'maior', tetrades: false, emprestimos: [] }, params: EM_DO_MAIOR },
    { id: 'maior-emprestimos', nome: 'presets.campoEmprestimos', settings: { campo: 'maior', tetrades: true, emprestimos: ['iv', 'bVI', 'bVII', 'bIII', 'iio', 'bII'] }, params: EM_DO_MAIOR },
    { id: 'menor-tetrades', nome: 'presets.campoMenor', settings: { campo: 'menor', tetrades: true, emprestimosMenor: [] }, params: EM_LA_MENOR },
    { id: 'menor-triades', nome: 'presets.campoMenorTriades', settings: { campo: 'menor', tetrades: false, emprestimosMenor: [] }, params: EM_LA_MENOR },
    { id: 'menor-dominante', nome: 'presets.campoMenorDominante', settings: { campo: 'menor', tetrades: true, emprestimosMenor: ['V', 'viio'] }, params: EM_LA_MENOR },
    { id: 'menor-emprestimos', nome: 'presets.campoMenorEmprestimos', settings: { campo: 'menor', tetrades: true, emprestimosMenor: ['V', 'viio', 'IV', 'ii', 'bII'] }, params: EM_LA_MENOR },
  ],
  presentation: { gap: 0.45 },
  // Com um acorde só não há o que perguntar (decisão 13: recusar, não sortear).
  problema: (s, ctx) => (poolDe(s).length < 2 ? ctx.t('player.campoVazio') : null),
  make(s, ctx) {
    const pool = poolDe(s, ctx.conv);
    const alvo = pick(pool);
    const tonica = tonicaNaRegiao(ctx, { lo: 55, hi: 64 });

    // No menor a cadência sai da HARMÔNICA: o v da natural não puxa, e ii°–V7–i é como o menor
    // cadencia de verdade. Os ALVOS seguem sendo os da natural; V7/vii°7 entram só como empréstimo.
    const cadencia = CADENCIAS.find(c => c === s.contexto);
    const contexto: number[][] = cadencia
      ? cadenciaHarmonica(cadencia, tonica, s.campo === 'menor' ? 'menor-harmonica' : 'maior', s.tetrades !== false)
      : [[tonica]];

    let ms = acordeNoTeto(tonica, alvo.semis);
    if (s.inversoes) for (let k = randInt(0, ms.length - 1); k > 0; k--) ms.push(ms.shift()! + 12);

    /**
     * Com tétrades, o teto de registro derruba o V7 (e alvos como o vii) uma oitava abaixo da
     * tônica, furando o piso da região. `caberNaFaixa` sobe o conjunto INTEIRO — contexto e alvo
     * juntos, porque deslocar um sem o outro mudaria a relação entre eles, que é a pergunta.
     */
    const { lo, hi } = regiao(ctx);
    const juntos = caberNaFaixa([...contexto, ms], lo, hi);
    for (let g = 0; g < contexto.length; g++) contexto[g] = juntos[g];
    ms = juntos[juntos.length - 1];

    // No modo "só o grau", iv e IV viram o MESMO botão `4` — daí o filtro de repetidos.
    const soGrau = s.resposta === 'grau';
    const nomeDe = (a: typeof alvo) => (soGrau ? grauDaFundamental(a.semi) : a.roman);
    const vistos = new Set<string>();
    const options = pool.filter(a => !vistos.has(nomeDe(a)) && vistos.add(nomeDe(a)))
      .map(a => ({ id: nomeDe(a), label: nomeDe(a) }));

    /**
     * **Audiar**: o grau está escrito (o algarismo romano), o contexto toca, e o arpejo do acorde
     * fica no botão de conferência. Arpejado, não em bloco: audiar um acorde é audiar as notas dele.
     */
    if (s.estimulo === 'escrito') {
      return {
        prompt: ctx.t('quiz.audiateDegreeChord', { degree: alvo.roman }), visual: { kind: 'text', text: '' },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: contexto,
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: contexto },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: ms.map(m => [m]) },
          ],
        },
        autoplay: false, reveal: alvo.roman,
      };
    }
    return {
      prompt: ctx.t('quiz.earFieldChord'), visual: { kind: 'ear' },
      // Em ordem de fundamental, SEM embaralhar: é a ordem do campo, botão parado entre rodadas
      // deixa a mão aprender o mapa, e a ordem não carrega a resposta.
      surface: { kind: 'choices', options, compact: options.length > 8 },
      expected: { kind: 'option', id: nomeDe(alvo) },
      sound: {
        // O grupo VAZIO entre contexto e alvo é um respiro de um `gap` (Paulo, 12/11: "precisa de um
        // tempo maior entre o contexto e o acorde"), e `arpejaveis` deixa o arpejo só no alvo — o
        // contexto é harmonia, e arpejá-lo tira dele o que ele estabelece.
        groups: [...contexto, [], ms], arpejaveis: [contexto.length + 1],
        partes: [
          { id: 'contexto', label: ctx.t('quiz.partContext'), groups: contexto },
          { id: 'acorde', label: ctx.t('quiz.partChord'), groups: [ms] },
        ],
      },
      autoplay: true, reveal: alvo.roman,
    };
  },
};
