import { ALL_SCALES, CLEFS, arr, assinaturaDaEscala, buildScale, midi, notaGrafada, noteName, optionsWith, pcPermitido, pick, pickClef, plain, quintasDaTonalidade, scaleName, shuffle } from '../helpers';
import type { MessageKey, Note, ScaleId } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';
import { MODOS_DEFAULTS, MODOS_SETTINGS, opcoesDeModo, rotuloComNome, rotuloDoModo, sortearModo } from '../modos';
import { getModo, notasDoModo } from '../../theory/digitacoes';

export const pautaEscala: CatalogItem = {
  id: 'pauta-escala',
  objetos: ['escalas', 'notacao'], tarefas: ['ler'],
  primaryModule: 'leitura', skillTags: ['theory.scale_identification', 'notation.pitch_reading'],
  contentTags: ['scale.major', 'scale.minor', 'scale.modes', 'scale.pentatonic', 'scale.blues', 'clef.treble', 'clef.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **Ler e escrever** — o oposto entrou em 25/11, quando a medição do catálogo mostrou a
     * assimetria: nota e intervalo escreviam na pauta, acorde e escala só liam. A peça que faltava
     * (pauta que acumula notas) existe desde a linha de ouvido.
     */
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'ler', label: ctx.t('settings.readIt') },
      { id: 'escrever', label: ctx.t('scaleOnStaff.writeIt') },
    ] },
    CLEFS(ctx),
    /**
     * **Escalas ou modos** — a mesma rota que o `ouvido-escala` ganhou em 26/11, aqui por pedido
     * dele no mesmo dia: *"sim, eu quero que eles apareçam também na pauta e no braço"*.
     *
     * A lista de escalas não cresce; o painel troca de lista. Os controles e a convenção de nome
     * moram em `catalog/modos.ts`, para os três itens dizerem a mesma coisa do mesmo jeito.
     */
    { id: 'material', label: ctx.t('modes.material'), type: 'single', options: [
      { id: 'escalas', label: ctx.t('modes.materialEscalas') },
      { id: 'modos', label: ctx.t('modes.materialModos') },
    ] },
    { id: 'tipos', label: ctx.t('settings.scales'), type: 'multi', quando: s => s.material !== 'modos',
      options: ALL_SCALES.map(k => ({ id: k, label: scaleName(ctx.t, k) })) },
    ...MODOS_SETTINGS(ctx, s => s.material === 'modos'),
    /**
     * **Fechar na oitava**, como no `escala-no-instrumento`: uma escala vai da tônica à tônica, e
     * foi o que ele relatou lá — parar na sétima era o único aceito. A superfície precisa saber
     * quantas notas esperar, então é controle e não tolerância.
     */
    { id: 'oitava', label: ctx.t('scaleOnInstrument.octave'), type: 'toggle', quando: s => s.direcao === 'escrever' },
  ],
  defaults: { claves: ['sol'], tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'], direcao: 'ler', oitava: true, ...MODOS_DEFAULTS },
  presets: [
    { id: 'ler-a-escala', nome: 'presets.escalaPautaLer', settings: { direcao: 'ler', tipos: ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] } },
    { id: 'escrever-na-pauta', nome: 'presets.escalaPautaEscrever', settings: { direcao: 'escrever', tipos: ['maior', 'menor'], oitava: true } },
    { id: 'escrever-modos', nome: 'presets.escalaPautaModos', settings: { direcao: 'escrever', tipos: ['dorico', 'frigio', 'lidio', 'mixolidio', 'locrio'], oitava: true } },
  ],
  presentation: { gap: 0.32 },
  make(s, ctx) {
    const clef = pickClef(s, ctx);
    /**
     * **A rota dos modos**: as notas saem de `getModo` em vez de `buildScale`, e o nome é o grau.
     * O resto da pergunta — desenhar na pauta, ler, escrever — é o mesmo, e por isso ela entra
     * aqui dentro em vez de virar um `make` paralelo.
     */
    const porModo = s.material === 'modos';
    const types = arr(s.tipos, ['maior']) as ScaleId[];
    const type = pick(types);
    const modo = porModo ? sortearModo(s, pick) : null;
    /**
     * A tônica **grafada pela tonalidade**: em Ré♭ maior a classe 6 é Sol♭, não Fá♯.
     *
     * Era `ROOTS[pc]`, uma lista fixa de doze grafias que não sabe de tonalidade — e aí o enunciado
     * anunciava "escala de Fá♯ maior" sob uma armadura de cinco bemóis. A tônica é o enunciado, e
     * ela tem de concordar com a armadura desenhada ao lado.
     *
     * As OUTRAS notas da escala continuam saindo de `buildScale`, com a grafia que a teoria manda —
     * uma menor harmônica sobre Si tem Lá♯, e trocá-lo por Si♭ faria dela outra escala. Medir isso
     * em 13/11 evitou um conserto errado: o que precisa seguir a tonalidade é a tônica sorteada,
     * não a construção.
     */
    const oct = clef === 'sol' ? 4 : 2;
    const tonic = notaGrafada(ctx, (oct + 1) * 12 + pcPermitido(ctx));
    const notasDaEscala = modo ? notasDoModo(getModo(tonic, modo.familia, modo.grau)) : buildScale(tonic, type);
    const todas = [...notasDaEscala, { ...tonic, oct: tonic.oct + 1 }];
    const notes = s.direcao === 'escrever' && s.oitava === false ? todas.slice(0, -1) : todas;
    const name = (t: Note, id: ScaleId) => ctx.t('quiz.scaleOf', { note: noteName(t, ctx.naming), scale: ctx.t(`theory.scalesInline.${id}` as MessageKey) });
    /** O nome da pergunta: a escala, ou o modo pelo grau (a convenção dele, de 25/11). */
    const nomeDaPergunta = modo
      ? ctx.t('quiz.scaleOfMode', { note: noteName(tonic, ctx.naming), mode: rotuloDoModo(ctx, modo.familia, modo.grau) })
      : name(tonic, type);
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
    /**
     * ⚠️ **Distrator com o mesmo desenho sai da lista** (20/11/2026). O teste do
     * `escala-no-instrumento` achou o par: **as duas melódicas sobem iguais**, e esta pauta desenha
     * a subida — então "Lá menor melódica (clássica)" e "(jazz)" apareciam como duas alternativas
     * para uma figura só. O defeito é daqui também, e a correção é a mesma linha.
     */
    const vistas = new Set([assinaturaDaEscala(tonic, type)]);
    const inedita = (t: ScaleId) => {
      const a = assinaturaDaEscala(tonic, t);
      if (vistas.has(a)) return false;
      vistas.add(a);
      return true;
    };
    /**
     * **Escrever**: o nome da escala é o enunciado, e a pauta é onde se responde. A conferência é o
     * contorno — o conjunto das notas, qualquer ordem de clique, deslocado por oitavas inteiras.
     * Exigir a ordem puniria a ordem dos cliques, que não aparece no resultado escrito.
     */
    if (s.direcao === 'escrever') {
      return {
        prompt: ctx.t('scaleOnStaff.writePrompt', { scale: nomeDaPergunta }),
        visual: { kind: 'text', text: '' },
        surface: { kind: 'staff', clef, accidentals: true, fifths: quintasDaTonalidade(ctx) ?? undefined, quantas: notes.length },
        expected: { kind: 'contorno', midis: notes.map(midi), ordenada: false },
        sound: { groups: notes.map(n => [midi(n)]) }, autoplay: false,
        reveal: modo ? rotuloComNome(ctx, modo.familia, modo.grau) : name(tonic, type),
      };
    }

    /**
     * **Lendo um modo, as alternativas são os pares marcados** — e não as escalas da lista. Todas
     * partem da mesma tônica, pelo mesmo motivo de sempre: com tônicas diferentes, ler a primeira
     * nota descartaria metade sem saber escala nenhuma.
     */
    if (modo) {
      const certa = `${modo.familia}:${modo.grau}`;
      return {
        prompt: ctx.t('quiz.whatScale'),
        visual: { kind: 'staff', clef, fifths: quintasDaTonalidade(ctx) ?? undefined, columns: notes.map(n => [n]) },
        surface: { kind: 'choices', options: opcoesDeModo(ctx, modo.pares), wide: true, compact: modo.pares.length > 8 },
        expected: { kind: 'option', id: certa },
        sound: { groups: notes.map(n => [midi(n)]) },
        reveal: rotuloComNome(ctx, modo.familia, modo.grau),
      };
    }


    const outros = shuffle([
      ...types.filter(t => t !== type),
      ...ALL_SCALES.filter(t => t !== type && !types.includes(t)),
    ]).filter(inedita);
    const pool = [type, ...outros.slice(0, 5)].map(t => name(tonic, t));
    const correct = name(tonic, type);
    return {
      prompt: ctx.t('quiz.whatScale'), visual: { kind: 'staff', clef, fifths: quintasDaTonalidade(ctx) ?? undefined, columns: notes.map(n => [n]) },
      surface: { kind: 'choices', options: optionsWith(correct, [...new Set(pool)], 6).map(plain), wide: true }, expected: { kind: 'option', id: correct },
      sound: { groups: notes.map(n => [midi(n)]) }, reveal: correct,
    };
  },
};
