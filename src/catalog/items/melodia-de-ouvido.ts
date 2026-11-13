import { CADENCIAS, acordeNoTeto, caberNaFaixa, cadenciaHarmonica } from '../../theory/cadencia-harmonica';
import { grauDaFundamental } from '../../theory/campo-harmonico';
import { MAX_NOTAS, MIN_NOTAS, SALTO_PADRAO, sortearMelodia } from '../../theory/melodia';
import { clave, grausDaTonalidade, mod, pcNameUm, pcsPermitidas, plain, regiao, tonicaNaRegiao } from '../helpers';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem, Question, Surface } from '../types';

/**
 * **Melodia de ouvido** — a linha §3.2 do `OR-ouvido-relativo.md`, e o molde do modelo novo.
 *
 * ## O modelo que este item estreia (decisão do Paulo, 12/11/2026)
 *
 * Ele perguntou onde entraria *"ler uma sequência de graus — 1543 — e conseguir audiá-la, ouvindo
 * apenas um contexto"*, e a pergunta não tinha resposta: o `audiar` estava pendurado em seis itens
 * de **notação**, e nenhum deles é melodia. Daí a troca de modelo:
 *
 * > **O item é o objeto musical e o seu gerador. Direção (ouvir / audiar) e superfície são
 * > parâmetros.**
 *
 * O argumento que decidiu é o gerador: nota solta não tem, melodia tem (quantas notas, quais, em
 * que extensão, com que salto). Se o audiar morasse num `melodia-na-pauta`, aquele item precisaria
 * do mesmo gerador — e motor duplicado é proibido. Quem tem o gerador tem as duas direções.
 *
 * ## As duas direções
 *
 * | | estímulo | resposta |
 * |---|---|---|
 * | `ouvir` | contexto e a melodia tocada | as notas, **na ordem**, na superfície escolhida |
 * | `audiar` | contexto tocado e a melodia **escrita** | autoavaliação, com o gabarito num botão |
 *
 * A conferência de `ouvir` é o **contorno** (§4): o conjunto pode estar deslocado por oitavas, desde
 * que todas as notas juntas — é o que separa "ouviu o desenho" de "acertou a altura absoluta".
 */
/**
 * Dó maior **e só as notas dela**. Os atalhos de entrada precisam do material junto: com a
 * tonalidade sozinha o material segue cromático (é o padrão), e "três notas em dó maior" entregava
 * `1-♭6-♭7-7` — melodia cromática com salto de quinta não é entrada de nada. O rascunho do Paulo
 * pede exatamente estes três recortes: notas de dó maior, de dó menor, ou todas.
 */
const EM_DO_DIATONICO = { key: { tonic: 0, mode: 'maior' }, material: 'diatonico' } as const;

export const melodiaDeOuvido: CatalogItem = {
  id: 'melodia-de-ouvido',
  objetos: ['melodia', 'notas'], tarefas: ['ouvir', 'audiar'],
  primaryModule: 'perception.melodic', skillTags: ['ear.scale_degrees', 'ear.audiation'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'key.major', 'key.minor'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: RASCUNHO,
  settings: ctx => [
    /**
     * **De onde vem a pergunta**: do som, ou do que está escrito.
     *
     * O id é `estimulo` e não `direcao` de propósito. `direcao` já quer dizer **direção melódica**
     * (sobe, desce, juntas) em `ouvido-intervalo`, `ouvido-escala` e nos padrões — e aquele é o
     * sentido musical certo da palavra. O eixo novo é outro: muda por onde o enunciado chega, que é
     * exatamente o que o modelo de 12/11 chama de estímulo.
     */
    { id: 'estimulo', label: ctx.t('settings.stimulus'), type: 'single', options: [
      { id: 'som', label: ctx.t('settings.hearIt') },
      { id: 'escrito', label: ctx.t('settings.readAndAudiate') },
    ] },
    { id: 'notas', label: ctx.t('settings.howManyNotes'), type: 'range', min: MIN_NOTAS, max: MAX_NOTAS, step: 1,
      format: v => String(v) },
    /**
     * A superfície vale para as DUAS direções, e é o mesmo parâmetro: ouvindo, é onde se responde;
     * audiando, é onde a melodia aparece escrita. Foi o que o rascunho dele descreveu desde o começo.
     *
     * ⚠️ `teclado` e `braco` não entram como estímulo do `audiar`: mostrar uma melodia ali exige
     * numerar as marcas para a ordem ser visível, e o teclado não tem rótulo em marca. Audiando, a
     * superfície cai para a pauta — e isto está anotado em `revisao-pendente.md`.
     */
    { id: 'superficie', label: ctx.t('settings.answerWhere'), type: 'single', options: [
      { id: 'auto', label: ctx.t('settings.myInstrument') },
      { id: 'teclado', label: ctx.t('settings.instrumentPiano') },
      { id: 'braco', label: ctx.t('settings.onNeck') },
      { id: 'pauta', label: ctx.t('settings.onStaff') },
      { id: 'graus', label: ctx.t('settings.byDegrees') },
    ] },
    { id: 'salto', label: ctx.t('settings.maxLeap'), type: 'range', min: 1, max: 12, step: 1,
      format: v => ctx.t('settings.semitones', { n: String(v) }) },
    { id: 'contexto', label: ctx.t('settings.patternContext'), type: 'single', options: [
      { id: 'ii-V-I', label: ctx.t('settings.contextIIVI') },
      { id: 'I-IV-V-I', label: ctx.t('settings.contextIIVVI') },
      { id: 'nota', label: ctx.t('settings.contextTonic') },
    ] },
    { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.3, max: 2, step: 0.1,
      format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) },
  ],
  defaults: { estimulo: 'som', notas: 3, superficie: 'auto', salto: SALTO_PADRAO, contexto: 'ii-V-I', duracao: 0.9 },
  presets: [
    { id: 'tres', nome: 'presets.melodiaTres', settings: { estimulo: 'som', notas: 3, salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'graus', nome: 'presets.melodiaGraus', settings: { estimulo: 'som', notas: 3, superficie: 'graus', salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'cinco', nome: 'presets.melodiaCinco', settings: { estimulo: 'som', notas: 5, salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'audiar-graus', nome: 'presets.melodiaAudiarGraus', settings: { estimulo: 'escrito', notas: 4, superficie: 'graus', salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
    { id: 'audiar-pauta', nome: 'presets.melodiaAudiarPauta', settings: { estimulo: 'escrito', notas: 3, superficie: 'pauta', salto: SALTO_PADRAO, contexto: 'ii-V-I' }, params: EM_DO_DIATONICO },
  ],
  presentation: { gap: 0.55 },
  make(s, ctx): Question {
    const n = Math.round(Number(s.notas ?? 3));
    const { lo, hi } = regiao(ctx);
    const melodia = sortearMelodia({ pcs: pcsPermitidas(ctx), lo, hi, n, saltoMax: Math.round(Number(s.salto ?? SALTO_PADRAO)) });
    const tonica = tonicaNaRegiao(ctx, { lo: 55, hi: 64 });
    const cadencia = CADENCIAS.find(c => c === s.contexto);
    // O contexto cabe na MESMA faixa da melodia: nada soa fora do que a superfície desenha.
    const contexto: number[][] = caberNaFaixa(cadencia
      ? cadenciaHarmonica(cadencia, tonica, ctx.params.key?.mode === 'menor' ? 'menor-harmonica' : 'maior', true)
      : [acordeNoTeto(tonica, [0])], lo, hi);

    const audiando = s.estimulo === 'escrito';
    // Audiando, a melodia não toca: só o contexto. Ver `partes`, que é onde o gabarito mora.
    const grupos = audiando ? [...contexto] : [...contexto, [], ...melodia.map(m => [m])];
    const partes = [
      { id: 'contexto', label: ctx.t('quiz.partContext'), groups: contexto },
      ...(audiando
        ? [{ id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: melodia.map(m => [m]) }]
        : melodia.map((m, i) => ({ id: `n${i}`, label: ctx.t('quiz.partNote', { n: i + 1 }), groups: [[m]] }))),
    ];
    const grau = (m: number) => grauDaFundamental(m - tonica);
    const emGraus = melodia.map(grau).join('-');
    const comNomes = melodia.map(m => pcNameUm(mod(m, 12), ctx.naming, false)).join('-');

    // Audiando, a superfície MOSTRA a melodia e a resposta é autoavaliação.
    if (audiando) {
      const naPauta = s.superficie !== 'graus';
      return {
        prompt: naPauta ? ctx.t('quiz.audiateMelody') : ctx.t('quiz.audiateDegrees', { degrees: emGraus }),
        visual: naPauta
          ? { kind: 'staff', clef: clave(ctx), columns: melodia.map(m => [notaEscrita(m)]) }
          // Convenção do Player: num visual `text`, **o enunciado é o conteúdo** (ver os outros
          // itens que o usam). Os graus vão no `prompt`; aqui fica vazio, como nos demais.
          : { kind: 'text', text: '' },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: { groups: grupos, partes }, autoplay: false,
        reveal: `${emGraus}  ·  ${comNomes}`,
      };
    }

    const onde = s.superficie === 'auto' ? (ctx.params.instrument === 'piano' ? 'teclado' : 'braco') : String(s.superficie);
    /**
     * Respondendo por **graus**, a superfície é a `sequence` que já existe (a mesma do
     * `ouvido-celulas`): escolher entre todos os graus, em ordem. Nas outras três, é a superfície
     * do instrumento ou da pauta **acumulando** `n` alturas, e a conferência é o contorno.
     */
    const superficie: Surface = onde === 'graus'
      ? { kind: 'sequence', options: grausDaTonalidade(ctx).map(g => plain(g.id)), comprimento: n, separador: '-' }
      : onde === 'pauta' ? { kind: 'staff', clef: clave(ctx), accidentals: true, quantas: n }
      // O teclado cobre **o que soou**, não só a região: `caberNaFaixa` pode empurrar o contexto
      // acima do teto quando ele não cabe inteiro, e a tela não pode mentir sobre o que soou (o
      // teste `superficie-cobre-o-som` guarda isso desde 09/11).
      : onde === 'teclado' ? { kind: 'keyboard', lo: Math.min(lo, ...grupos.flat()), hi: Math.max(hi, ...grupos.flat()), quantas: n }
      : { kind: 'fretboard', tuning: ctx.params.tuning, from: 0, to: 12, quantas: n };

    return {
      prompt: ctx.t('quiz.earMelody'),
      visual: { kind: 'ear', hint: ctx.t('quiz.earMelodyHint') },
      surface: superficie,
      expected: onde === 'graus' ? { kind: 'option', id: emGraus } : { kind: 'contorno', midis: melodia },
      sound: { groups: grupos, partes }, autoplay: true,
      reveal: `${emGraus}  ·  ${comNomes}`,
    };
  },
};

/** A nota escrita de uma altura, na grafia com sustenido — a pauta precisa de letra e acidente. */
function notaEscrita(m: number) {
  const pc = mod(m, 12);
  const letra = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc];
  const acc = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][pc];
  return { letter: letra as 0, acc, oct: Math.floor(m / 12) - 1 };
}
