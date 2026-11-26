import { CHORDS, EM_DO_MAIOR, SCALES, arr, chordSymbol, mod, notaGrafada, pick, randInt, regiao, scaleName, tonicaNaRegiao, TIMBRE, TIMBRE_DEFAULTS, vozDaPergunta } from '../helpers';
import { qualidadeEnfeitada } from '../enfeites';
import { voicingsDe } from '../../theory/voicings';
import { VER_O_QUE_SOOU, faixaDaRevelacao, noteName } from '../helpers';
import { midi } from '../../theory/core';
import { RASCUNHO } from '../publicacao';
import type { CatalogItem, SettingValue } from '../types';
import { GRAUS_CROMATICOS, grauDaFundamental, materialDoCampo, opcoesDeEmprestimo, type CampoDoExercicio } from '../../theory/campo-harmonico';
import { acomodarMelodiaEAcorde } from '../../theory/nota-sobre-acorde';
import { CADENCIAS, alvoConduzido, caberNaFaixa, cadenciaHarmonica } from '../../theory/cadencia-harmonica';

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
  primaryModule: 'ouvido', skillTags: ['ear.harmonic_function'],
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
    /**
     * **Enfeitar o acorde do grau** (pedido do Paulo em 19/11): *"adicionar inversões e
     * extensões/voicings diatônicas (ou não diatônicos, como #9 em dominante e afins)"*.
     *
     * É **eixo próprio**, e não um terceiro valor de "tríades/tétrades": aquele botão escolhe o
     * tamanho do acorde, e este responde outra pergunta — *o acorde do grau vem vestido?*
     *
     * Quem decide o que combina com o quê é `comMesmoNucleo`, em `catalog/enfeites.ts`, e dela sai
     * de graça a regra que ele enunciou: `♯9`, `♭9` e `♭13` só grudam em dominante.
     *
     * **Só com tétrades**, porque é de onde as extensões penduram: sobre uma tríade o motor não tem
     * o que oferecer (medido: nenhuma qualidade tem o mesmo núcleo de `maior`), e um controle que
     * não faz nada é pior que um controle a menos.
     */
    { id: 'enfeites', label: ctx.t('settings.chordDressing'), type: 'single', quando: s => s.tetrades !== false, options: [
      { id: 'nenhum', label: ctx.t('settings.dressingNone') },
      { id: 'extensoes', label: ctx.t('settings.dressingExtensions') },
      { id: 'alterados', label: ctx.t('settings.dressingAltered') },
    ] },
    /**
     * **Como o acorde soa**, o mesmo parâmetro que o `ouvido-acorde` ganhou nesta mesma data — um
     * eixo que já existe em dois itens não vira um terceiro desenho.
     *
     * Só no modo de ouvir: audiando, o acorde é o gabarito que se produz na cabeça, e um voicing
     * espalhado entre duas mãos não é o que se pede para audiar.
     */
    { id: 'voicing', label: ctx.t('settings.chordVoicing'), type: 'single', quando: s => s.estimulo === 'som', options: [
      { id: 'fechado', label: ctx.t('settings.voicingClose') },
      { id: 'piano', label: ctx.t('settings.voicingPiano') },
    ] },
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
    // Com voicing o baixo já pode ser qualquer grau: inverter de novo seria meia função repetida.
    { id: 'inversoes', label: ctx.t('settings.inversions'), type: 'toggle', quando: s => !comVoicing(s) },
    /**
     * **Ver as notas ao conferir** — o mesmo teclado da Tônica e do Qualidades de acordes, pedido
     * dele para os três de uma vez em 26/11.
     *
     * ⚠️ Mostra **o acorde da pergunta**, não a cadência inteira: a cadência é contexto, e marcar
     * tudo que soou desde o começo faria o teclado dizer "foram estas doze notas".
     */
    VER_O_QUE_SOOU(ctx),
    /**
     * **Os acordes da cadência de contexto**, e o padrão são tríades desde 19/11 (pedido dele:
     * *"seria bom se a cadência de contexto pudesse ser só de tríades"*).
     *
     * Antes a cadência seguia o tamanho do acorde-alvo, e com tétrades ela chegava à pergunta com
     * quatro notas em cada acorde — mais massa para firmar o mesmo centro, e mais chance de
     * competir com o que vem depois. O contexto existe para dizer onde é a tônica; tríades dizem
     * isso com menos tinta.
     */
    { id: 'contextoAcordes', label: ctx.t('settings.contextChords'), type: 'single', quando: s => s.contexto !== 'nota', options: [
      { id: 'triades', label: ctx.t('settings.contextTriads') },
      { id: 'comoOAlvo', label: ctx.t('settings.contextLikeTarget') },
    ] },
    { id: 'contexto', label: ctx.t('settings.patternContext'), type: 'single',
      options: [{ id: 'ii-V-I', label: ctx.t('settings.contextIIVI') }, { id: 'I-IV-V-I', label: ctx.t('settings.contextIIVVI') },
        { id: 'nota', label: ctx.t('settings.contextTonic') }] },
    /**
     * **A melodia por cima** — o "modo quiz · melodia fixa" que ele desenhou: *"segura-se uma
     * melodia e varia o acorde que está abaixo; o usuário tem que responder corretamente qual
     * acorde está soando"*.
     *
     * A pergunta não muda — continua sendo qual grau soou. O que muda é que há uma nota parada por
     * cima, e é ela que torna o exercício outro: o mesmo Dó é a fundamental do I, a ♭7 do ii e a
     * ♭6 do iii, e reconhecer o acorde **através** dela é a habilidade.
     *
     * `fixa` é o modo dele, e a nota se escolhe. `sorteada` é a versão difícil: a nota também muda,
     * e aí nem ela serve de âncora — só se revela no fim.
     */
    { id: 'melodia', label: ctx.t('settings.melodyOnTop'), type: 'single', quando: s => s.estimulo !== 'escrito', options: [
      { id: 'nenhuma', label: ctx.t('settings.melodyNone') },
      { id: 'fixa', label: ctx.t('settings.melodyFixed') },
      { id: 'sorteada', label: ctx.t('settings.melodyRandom') },
    ] },
    { id: 'notaDaMelodia', label: ctx.t('settings.whichMelodyNote'), type: 'single',
      quando: s => s.estimulo !== 'escrito' && s.melodia === 'fixa',
      options: GRAUS_CROMATICOS.map((g, i) => ({ id: String(i), label: g })) },
    /**
     * **Onde a nota mora dentro do acorde** (pedido dele em 20/11, quando perguntou o que faltava
     * nos parâmetros). A mesma relação soa outra coisa com a nota embaixo: por cima ela é melodia,
     * por baixo ela vira o baixo do acorde e a função inteira muda de cara.
     */
    { id: 'posicaoDaMelodia', label: ctx.t('settings.melodyPosition'), type: 'single',
      quando: s => s.estimulo !== 'escrito' && s.melodia !== 'nenhuma', options: [
        { id: 'topo', label: ctx.t('settings.melodyTop') },
        { id: 'meio', label: ctx.t('settings.melodyMiddle') },
        { id: 'baixo', label: ctx.t('settings.melodyBottom') },
      ] },
    { id: 'arpejo', label: ctx.t('settings.arpeggiate'), type: 'toggle', soPresentation: true,
      present: v => ({ chord: v ? 'arpeggio-block' : 'block' }) },
    { id: 'duracao', label: ctx.t('settings.sustain'), type: 'range', min: 0.5, max: 4, step: 0.1,
      format: v => `${v.toFixed(1)} s`, soPresentation: true, present: v => ({ dur: Number(v) }) },
    /**
     * **O timbre** — compartilhado em `TIMBRE`, de `helpers` (19/11): o do perfil, um escolhido, ou
     * sorteado a cada pergunta. O sorteio é o que treina ouvir independente do timbre.
     */
    ...TIMBRE(ctx),
  ],
  defaults: { verOQueSoou: true, estimulo: 'som', campo: 'maior', tetrades: true, graus: ['1', '2', '3', '4', '5', '6', '7'], emprestimos: [], enfeites: 'nenhum', voicing: 'fechado', contextoAcordes: 'triades', ...TIMBRE_DEFAULTS,
    emprestimosMenor: [], resposta: 'romano', inversoes: false, contexto: 'ii-V-I', arpejo: false, duracao: 2,
    melodia: 'nenhuma', notaDaMelodia: '0', posicaoDaMelodia: 'topo' },
  presets: [
    { id: 'maior-tetrades', nome: 'presets.campoTetrades', settings: { campo: 'maior', tetrades: true, emprestimos: [] }, params: EM_DO_MAIOR },
    { id: 'maior-triades', nome: 'presets.campoTriades', settings: { campo: 'maior', tetrades: false, emprestimos: [] }, params: EM_DO_MAIOR },
    { id: 'maior-emprestimos', nome: 'presets.campoEmprestimos', settings: { campo: 'maior', tetrades: true, emprestimos: ['iv', 'bVI', 'bVII', 'bIII', 'iio', 'bII'] }, params: EM_DO_MAIOR },
    { id: 'menor-tetrades', nome: 'presets.campoMenor', settings: { campo: 'menor', tetrades: true, emprestimosMenor: [] }, params: EM_LA_MENOR },
    { id: 'menor-triades', nome: 'presets.campoMenorTriades', settings: { campo: 'menor', tetrades: false, emprestimosMenor: [] }, params: EM_LA_MENOR },
    { id: 'menor-dominante', nome: 'presets.campoMenorDominante', settings: { campo: 'menor', tetrades: true, emprestimosMenor: ['V', 'viio'] }, params: EM_LA_MENOR },
    { id: 'menor-emprestimos', nome: 'presets.campoMenorEmprestimos', settings: { campo: 'menor', tetrades: true, emprestimosMenor: ['V', 'viio', 'IV', 'ii', 'bII'] }, params: EM_LA_MENOR },
    // O caso que ele descreveu, pronto para usar: o V vestido de ♭9/♯9, que é onde a alteração
    // aparece na música de verdade.
    { id: 'maior-alterados', nome: 'presets.campoAlterados', settings: { campo: 'maior', tetrades: true, emprestimos: [], enfeites: 'alterados' }, params: EM_DO_MAIOR },
    /**
     * **Os três atalhos do modo quiz · melodia fixa** (20/11). Eles existem porque o modo tem três
     * maneiras de ser usado, e sem atalho cada uma pede quatro cliques no painel:
     *
     * - a **tônica segurada por cima** é o exemplo do documento dele, o Dó contra os sete graus;
     * - **por baixo** é a mesma nota virando o baixo do acorde, que muda a função inteira de cara;
     * - **sorteada** tira a âncora: nem a nota se sabe, e ela só se revela no fim.
     */
    { id: 'melodia-por-cima', nome: 'presets.campoMelodiaPorCima',
      settings: { campo: 'maior', tetrades: false, emprestimos: [], melodia: 'fixa', notaDaMelodia: '0', posicaoDaMelodia: 'topo' }, params: EM_DO_MAIOR },
    { id: 'melodia-por-baixo', nome: 'presets.campoMelodiaPorBaixo',
      settings: { campo: 'maior', tetrades: false, emprestimos: [], melodia: 'fixa', notaDaMelodia: '0', posicaoDaMelodia: 'baixo' }, params: EM_DO_MAIOR },
    { id: 'melodia-sorteada', nome: 'presets.campoMelodiaSorteada',
      settings: { campo: 'maior', tetrades: true, emprestimos: [], melodia: 'sorteada', posicaoDaMelodia: 'topo' }, params: EM_DO_MAIOR },
    /**
     * **E dois que faltavam para as maneiras ANTIGAS de usar** — ele pediu atalhos para todos os
     * modos, e dois eixos do item não tinham nenhum: audiar o acorde a partir do grau escrito, e
     * responder só pelo número do grau, sem algarismo romano nem qualidade.
     */
    { id: 'audiar-o-grau', nome: 'presets.campoAudiar',
      settings: { estimulo: 'escrito', campo: 'maior', tetrades: true, emprestimos: [] }, params: EM_DO_MAIOR },
    { id: 'so-o-numero', nome: 'presets.campoSoONumero',
      settings: { campo: 'maior', tetrades: false, emprestimos: [], resposta: 'grau' }, params: EM_DO_MAIOR },
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
      ? cadenciaHarmonica(cadencia, tonica, s.campo === 'menor' ? 'menor-harmonica' : 'maior', s.contextoAcordes === 'comoOAlvo' && s.tetrades !== false)
      : [[tonica]];

    /**
     * **O acorde do grau, vestido se a pessoa pediu** — e o gabarito não muda com isso: um V
     * vestido de ♯9 continua sendo o V. É o ponto do parâmetro, e foi decisão dele: a habilidade
     * aqui é achar a função por trás da roupa.
     *
     * O enfeite vale **só no alvo**. A cadência de contexto fica seca: ela existe para firmar o
     * centro antes da pergunta, e vesti-la embaralharia a referência — a mesma razão pela qual ela
     * também não é arpejada.
     */
    const familias = FAMILIAS[String(s.enfeites ?? 'nenhum')] ?? [];
    const vestindo = familias.length > 0 && s.tetrades !== false;
    /**
     * **O enfeite respeita a tonalidade** — e isto veio do ouvido dele em 19/11: o `Bm9♭5` do viiø
     * e o `Cmaj7♯11` do I soaram mal, e os dois põem nota de fora do campo (um dó♯ e um fá♯ em dó
     * maior) sem função nenhuma. A regra está em `enfeitesDe`; aqui só se diz onde o acorde está.
     *
     * **Dominante é o V, e só ele**: `♭VII7` e o `IV7` do menor têm forma de dominante e não
     * resolvem na tônica — vesti-los de ♭9 soa como acidente. Foi decisão dele.
     */
    const escala = SCALES[s.campo === 'menor' ? 'menor' : 'maior'].degs.map(([, semi]) => semi);
    const qualidade = vestindo
      ? qualidadeEnfeitada(alvo.chord, familias, { escala, semi: alvo.semi, dominante: alvo.semi === 7 && alvo.chord === '7' })
      : alvo.chord;
    const semis = qualidade === alvo.chord ? alvo.semis : CHORDS[qualidade].degs.map(([, x]) => alvo.semi + x);
    /**
     * **E o voicing de piano**, quando ligado. `voicingsDe` coloca as notas sozinho dentro da
     * região das duas mãos; o que importa de `raiz` é a classe de altura.
     *
     * O `??` cai na pilha fechada em vez de numa pergunta muda — aqui o motor sempre tem o que
     * devolver (não há "sem fundamental" neste item), e o cinto existe porque um acorde vazio já
     * passou por três invariantes uma vez.
     */
    const raiz = notaGrafada(ctx, tonica + alvo.semi);
    const doMotor = comVoicing(s) ? voicingsDe(raiz, qualidade, {}) : [];
    /**
     * **O alvo continua a condução do contexto** (19/11): a cadência agora conduz as vozes, e o
     * acorde da pergunta entrando empilhado da fundamental soaria como anúncio — a diferença de
     * registro e de empilhamento viraria pista, que é o que `acordeNoTeto` existia para evitar.
     *
     * Com voicing de piano ligado, quem manda é o motor de voicings: ali a pessoa pediu
     * explicitamente outra coisa.
     */
    let ms = doMotor.length
      ? doMotor[randInt(0, doMotor.length - 1)].todas.map(midi)
      : alvoConduzido(tonica, semis, contexto[contexto.length - 1] ?? null);
    if (s.inversoes && !comVoicing(s)) for (let k = randInt(0, ms.length - 1); k > 0; k--) ms.push(ms.shift()! + 12);

    /**
     * Com tétrades, o teto de registro derruba o V7 (e alvos como o vii) uma oitava abaixo da
     * tônica, furando o piso da região. `caberNaFaixa` sobe o conjunto INTEIRO — contexto e alvo
     * juntos, porque deslocar um sem o outro mudaria a relação entre eles, que é a pergunta.
     */
    const { lo, hi } = regiao(ctx);
    const juntos = caberNaFaixa([...contexto, ms], lo, hi);
    for (let g = 0; g < contexto.length; g++) contexto[g] = juntos[g];
    ms = juntos[juntos.length - 1];

    /**
     * **A revelação diz a cifra que soou** quando o eixo dos enfeites está ligado (decisão dele,
     * 19/11). Sem ela, "V7" não conta o que você acabou de ouvir — e saber que era um Sol7(♯9) é
     * metade do aprendizado. Desligado, segue sendo só o romano, como sempre foi.
     */
    const revelacaoDoAcorde = vestindo ? `${alvo.roman} · ${chordSymbol(raiz, qualidade, ctx.conv)}` : alvo.roman;

    /**
     * **A nota parada por cima** (ou por baixo, ou no meio) — o modo "melodia fixa" dele.
     *
     * A altura sai da POSIÇÃO pedida, e não de uma oitava escrita: por cima é a primeira ocorrência
     * da classe acima do topo do acorde, por baixo a primeira abaixo da base, e no meio a que cai
     * dentro do bloco (ou a mais próxima do centro, quando o bloco é apertado demais para ter uma).
     * Depois ela é puxada de volta para dentro da região — nada soa fora do que a pessoa aguenta.
     */
    const comMelodia = s.estimulo !== 'escrito' && s.melodia !== 'nenhuma' && s.melodia !== undefined;
    const semiDaMelodia = s.melodia === 'sorteada' ? randInt(0, 11) : Number(s.notaDaMelodia ?? 0);
    const pcDaMelodia = mod(tonica + semiDaMelodia, 12);
    const naClasse = (ref: number, acima: boolean) => {
      let m = ref;
      while (mod(m, 12) !== pcDaMelodia) m += acima ? 1 : -1;
      return m;
    };
    const melodia = (() => {
      if (!comMelodia) return null;
      const pos = String(s.posicaoDaMelodia ?? 'topo');
      /**
       * **No meio, a nota cai dentro do bloco** — e só aí. Se nenhuma oitava da classe couber entre
       * a base e o topo do acorde (um acorde fechado de três notas tem vãos pequenos), ela vira
       * "por cima", que é o lugar musical padrão de uma melodia.
       */
      if (pos === 'meio') {
        const dentro = naClasse(Math.min(...ms) + 1, true);
        if (dentro < Math.max(...ms) && dentro >= lo && dentro <= hi) return dentro;
      }
      /**
       * **Por cima e por baixo passam por `acomodarMelodiaEAcorde`** — o motor que o `ouvido-celulas`
       * já usa, e que resolve o caso difícil: quando não há oitava livre do lado pedido, **quem se
       * move é o acorde**, não a nota.
       *
       * Escrevi primeiro à mão e a medição pegou: pedindo "por baixo" com a região começando em 48,
       * a nota era empurrada de volta para dentro do acorde e soava **acima** da nota mais grave
       * dele — a tela prometia uma coisa e o som fazia outra, calado.
       */
      const alvoDaNota = pos === 'baixo' ? naClasse(Math.min(...ms) - 1, false) : naClasse(Math.max(...ms) + 1, true);
      const r = acomodarMelodiaEAcorde(ms, [alvoDaNota], pos === 'baixo' ? 'abaixo' : 'acima', { lo, hi });
      ms = r.acorde;
      return r.melodia[0];
    })();
    /** A revelação diz o acorde e, havendo melodia, que nota estava segurando por cima. */
    const revelacao = melodia === null
      ? revelacaoDoAcorde
      : `${revelacaoDoAcorde}  ·  ${GRAUS_CROMATICOS[semiDaMelodia]}`;

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
        // Audiando, o enunciado precisa dizer **o que** audiar: pedir "o V7" e tocar um V7(♯9) de
        // gabarito seria pedir uma coisa e conferir outra.
        prompt: ctx.t('quiz.audiateDegreeChord', { degree: revelacao }), visual: { kind: 'text', text: '' },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: contexto,
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: contexto },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: ms.map(m => [m]) },
          ],
        },
        autoplay: false, reveal: revelacao, presentation: vozDaPergunta(s),
      };
    }
    /** O que soa no lugar do alvo: o acorde, com a nota segurada quando ela existe. */
    const comSoar = melodia === null ? ms : [...ms, melodia].sort((a, b) => a - b);
    return {
      prompt: ctx.t('quiz.earFieldChord'),
      /**
       * Com melodia escolhida, o enunciado DIZ qual é: ela é a âncora, não a pergunta. Sorteada,
       * ele cala — ali nem ela se sabe, e é esse o grau de dificuldade a mais.
       *
       * O texto **não diz onde ela está**, e isso é conserto: ele dizia "por cima" e a posição é
       * escolha — com a nota por baixo, o enunciado mentia. A posição quem sabe é quem a escolheu.
       */
      visual: { kind: 'ear', hint: melodia !== null && s.melodia === 'fixa'
        ? ctx.t('quiz.holdingNote', { note: GRAUS_CROMATICOS[semiDaMelodia] }) : undefined },
      // Em ordem de fundamental, SEM embaralhar: é a ordem do campo, botão parado entre rodadas
      // deixa a mão aprender o mapa, e a ordem não carrega a resposta.
      surface: { kind: 'choices', options, compact: options.length > 8 },
      expected: { kind: 'option', id: nomeDe(alvo) },
      sound: {
        // O grupo VAZIO entre contexto e alvo é um respiro de um `gap` (Paulo, 12/11: "precisa de um
        // tempo maior entre o contexto e o acorde"), e `arpejaveis` deixa o arpejo só no alvo — o
        // contexto é harmonia, e arpejá-lo tira dele o que ele estabelece.
        groups: [...contexto, [], comSoar], arpejaveis: [contexto.length + 1],
        /**
         * ⚠️ **O pedaço "acorde" toca o que SOA, melodia junto** — e não o acorde limpo.
         *
         * Com a melodia por cima, oferecer o acorde sozinho desfaria o exercício num clique: a
         * pergunta vira a de sempre, e a nota parada deixa de atrapalhar. O que se pode isolar é a
         * **melodia**, que é a âncora — e é literalmente o que ele descreveu, *"um drone que pode
         * ser ligado e desligado"*.
         */
        partes: [
          { id: 'contexto', label: ctx.t('quiz.partContext'), groups: contexto },
          { id: 'acorde', label: ctx.t('quiz.partChord'), groups: [comSoar] },
          ...(melodia === null ? [] : [{ id: 'melodia', label: ctx.t('quiz.partMelody'), groups: [[melodia]] }]),
        ],
      },
      autoplay: true, reveal: revelacao, presentation: vozDaPergunta(s),
      /**
       * O teclado do que soou **no lugar do alvo** — o acorde e a nota segurada, se houver. A
       * fundamental vai nomeada, grafada pela tonalidade (`raiz` já saiu de `notaGrafada`).
       */
      ...(s.verOQueSoou !== false && comSoar.length
        ? (() => {
            // ⚠️ Pela CLASSE, não pela nota mais grave: com inversão ou voicing a fundamental não
            // está no baixo, e rotular o baixo de fundamental seria afirmar o contrário do que soou.
            const fund = comSoar.find(m => ((m % 12) + 12) % 12 === ((midi(raiz) % 12) + 12) % 12);
            return { revelacao: { kind: 'keyboard' as const, ...faixaDaRevelacao(comSoar), notas: comSoar,
              ...(fund !== undefined ? { rotulos: { [fund]: noteName(raiz, ctx.naming) } } : {}) } };
          })()
        : {}),
    };
  },
};

/** As famílias de enfeite que cada valor do seletor liga. "Alterados" inclui as extensões. */
const FAMILIAS: Record<string, string[]> = {
  nenhum: [],
  extensoes: ['extensoes'],
  alterados: ['extensoes', 'alterados'],
};
/** O voicing de piano está em vigor? Só no modo de ouvir — ver o comentário na configuração. */
const comVoicing = (s: Record<string, SettingValue>) => s.estimulo === 'som' && s.voicing === 'piano';
