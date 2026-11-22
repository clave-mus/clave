import {
  ESCUTA_ACIMA, ESCUTA_DEFAULTS, FRETS, GRAUS_ESCOLHIDOS, INST, alturaDeTeclado, bracoDoPerfil, alturaDoPc, arr, casaPermitida, fretRange, mod, nomeNaTonalidade,
  pcOptions, pcsDosGraus, pick, regiao, teclasPermitidas, tuningOf, vozDoBraco,
} from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Nota no instrumento: **identificar** o que está marcado, ou **achar** o que foi pedido.
 *
 * ## O que este item absorveu (reorganização de 09/11/2026)
 *
 * As metades de teclado e braço de `que-nota-e-essa` e de `ache-a-nota`. O porquê do eixo novo está
 * em `nota-na-pauta.ts`; aqui vale registrar o que o Paulo disse que fechou a decisão:
 *
 * > "você não percebe que são a mesma coisa?"
 *
 * Ele estava certo. "Que nota é essa, marcada no braço" e "ache o Ré♯ no braço" são a mesma
 * pergunta virada, com a mesma validação (altura, não grafia) e a mesma unidade de extensão
 * (faixas de casa). O que as separava era só a direção.
 *
 * ## O instrumento é configuração, com o do perfil por padrão
 *
 * Decisão dele: *"nos de instrumento, o padrão vira o instrumento padrão do usuário. Mas ele sempre
 * pode mudar isso dentro do instrumento e salvar isso como um preset nas suas próprias rotinas."*
 *
 * É isso que impede este item de virar três ("nota no piano", "nota no violão", "nota no baixo") — e
 * é o que permite uma rotina pedir piano numa etapa e violão na seguinte.
 */
export const notaNoInstrumento: CatalogItem = {
  id: 'nota-no-instrumento',
  objetos: ['notas'], tarefas: ['nomear', 'tocar'],
  primaryModule: 'instrumento',
  skillTags: ['keyboard.note_naming', 'keyboard.note_finding', 'fretboard.note_naming', 'fretboard.note_finding'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'instrument.keyboard', 'instrument.guitar', 'instrument.bass'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    /**
     * **"Incluir teclas pretas" saiu em 13/11**, aqui também, pela mesma razão do `ouvido-tecla`:
     * tecla preta é grau alterado, e quem escolhe graus já disse se os quer. O Paulo pediu que a
     * seleção fosse por grau e ligada ao material — *"analise quais outros exercicios estao com esse
     * mesmo problema e resolva"* —, e este era o outro.
     *
     * A seleção vale para o braço **e** para o teclado: restringir aos graus 1-3-5 é um exercício
     * legítimo nas duas superfícies, e antes só havia o interruptor, e só no piano.
     */
    GRAUS_ESCOLHIDOS(ctx),
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'identificar', label: ctx.t('settings.nameIt') },
      { id: 'achar', label: ctx.t('settings.findIt') },
      /**
       * **O `audiar` saiu daqui em 12/11** e foi para a linha de ouvido correspondente: audiar é
       * ouvido, e quem tem o gerador tem as duas direções (`OR-ouvido-relativo.md`, §2).
       */
    ] },
    // `auto` é o instrumento do perfil. Mudar aqui e salvar na rotina é o caminho que o Paulo pediu.
    // `INST` já traz "o meu (do perfil)", violão e baixo; aqui o piano entra junto, porque neste
    // item ele é um instrumento como os outros e não uma superfície à parte.
    { ...INST(ctx), options: [...(INST(ctx).options ?? []), { id: 'piano', label: ctx.t('settings.instrumentPiano') }] },
    { ...FRETS(ctx), quando: s => s.instrumento !== 'piano' },
    /**
     * **Quais cordas entram** (Paulo, 12/11; padrão: todas). Seis opções, porque o braço mais largo
     * do app tem seis cordas; num baixo as duas últimas não aparecem — a lista real sai da afinação
     * em vigor, no `make`, e marcar uma corda que não existe simplesmente não acha casa nenhuma.
     *
     * A numeração é a de quem toca: 1ª é a mais AGUDA, e as cordas de `tuning` vão da grave para a
     * aguda — a conversão é `tuning.length - n`, e há teste conferindo.
     */
    { id: 'cordas', label: ctx.t('settings.strings'), type: 'multi', justify: true, quando: s => s.instrumento !== 'piano',
      options: ['1', '2', '3', '4', '5', '6'].map(n => ({ id: n, label: n + 'ª' })) },
    /**
     * **Perguntar pela nota ou pela ALTURA EXATA** (Paulo, 12/11: *"quero que também tenha a opção
     * de pedir uma altura de nota específica — como E1 — aí tem menos respostas corretas. Que isso
     * seja um parâmetro, não o padrão"*).
     *
     * Com `altura`, a resposta certa é uma posição só (ou as poucas que dão aquela altura); com
     * `nota`, qualquer posição daquela classe serve. É a mesma distinção que `nota-na-pauta` faz
     * entre ler (sem oitava) e escrever (com oitava).
     */
    { id: 'pergunta', label: ctx.t('settings.whatToAsk'), type: 'single', quando: s => s.instrumento !== 'piano',
      options: [{ id: 'nota', label: ctx.t('settings.askNoteName') }, { id: 'altura', label: ctx.t('settings.askExactPitch') }] },
    /**
     * **Todas as posições daquela nota**, e não uma (pedido do Paulo em 10/11: *"clicar em todas
     * posicoes da nota no braço"*).
     *
     * Esperou dois dias por uma razão boa: precisava da superfície que ACUMULA respostas, e ela só
     * nasceu em 12/11 com o `Surface.quantas`. Construí-la antes teria sido motor órfão — o projeto
     * já teve dois.
     *
     * É outra habilidade que achar uma: achar uma é reconhecer a nota; achar todas é **ver o braço
     * como mapa**, saber que o mesmo Fá está na casa 1 da 6ª, na 6 da 5ª, na 11 da 4ª. Por isso é
     * parâmetro e não padrão: quem está aprendendo a nota não deve ser cobrado pelo mapa inteiro.
     *
     * Só na direção `achar`, e só no braço: no teclado uma classe de altura tem uma tecla por
     * oitava, e "todas" ali é outra pergunta (qual oitava), que a direção `altura` já faz.
     */
    { id: 'todasAsPosicoes', label: ctx.t('settings.allPositions'), type: 'toggle',
      quando: s => s.instrumento !== 'piano' && s.direcao === 'achar' && s.pergunta !== 'altura' },
    { id: 'oitavas', label: ctx.t('settings.octaves'), type: 'single', quando: s => s.instrumento === 'piano',
      options: [{ id: '1', label: '1' }, { id: '2', label: '2' }] },
    /**
     * **Ouvir uma ou duas oitavas acima**, só com o braço do baixo escolhido — pedido dele em
     * 20/11. Soma em `transpor`, que é apresentação: a nota continua sendo a que é, e a resposta
     * continua sendo a casa onde ela mora de verdade.
     */
    ...ESCUTA_ACIMA(ctx, s => s.instrumento === 'baixo'),
  ],
  // Braço TODO por padrão (Paulo, 12/11): quem abre o item quer o instrumento que toca, inteiro —
  // casas 0–5 é um recorte de estudo, e recorte é escolha, não entrada.
  // O instrumento começa no do perfil — resolvido em `defaultsDo`, não por uma opção "auto".
  defaults: { direcao: 'identificar', casas: '0-12', cordas: ['1', '2', '3', '4', '5', '6'], pergunta: 'nota', todasAsPosicoes: false, oitavas: '2', grausEscolhidos: [], ...ESCUTA_DEFAULTS },
  defaultsDo: ctx => ({ instrumento: ctx.params.instrument === 'piano' ? 'piano' : bracoDoPerfil(ctx) }),
  make(s, ctx): Question {
    if (s.instrumento === 'piano') {
      const { lo, hi } = regiao(ctx, { lo: 48, hi: s.oitavas === '1' ? 59 : 71 });
      if (s.direcao === 'achar') {
        const p = pick(pcsDosGraus(ctx, arr(s.grausEscolhidos, [])));
        const soa = alturaDoPc(ctx, p, { lo, hi });
        return {
          prompt: ctx.t('quiz.tapNote', { note: nomeNaTonalidade(ctx, p, Math.random() < 0.5) }),
          visual: { kind: 'text', text: '' },
          surface: { kind: 'keyboard', lo, hi }, expected: { kind: 'pitchClass', pc: p },
          sound: { groups: [[soa]] }, reveal: nomeNaTonalidade(ctx, p),
        };
      }
      const m = alturaDeTeclado(ctx, s, lo, hi);
      return {
        prompt: ctx.t('quiz.whatNote'), visual: { kind: 'keyboard', lo, hi, marks: [m] },
        surface: { kind: 'choices', options: teclasPermitidas(ctx, s) }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
        sound: { groups: [[m]] }, reveal: nomeNaTonalidade(ctx, mod(m, 12)),
      };
    }

    const tuning = tuningOf(s, ctx);
    const [from, to] = fretRange(s);
    const cordas = Array.isArray(s.cordas) ? s.cordas : undefined;
    const { str, f, m } = casaPermitida(tuning, from, to, ctx, cordas, pcsDosGraus(ctx, arr(s.grausEscolhidos, [])));
    // Perguntando pela ALTURA exata, o gabarito é a altura (uma posição, ou as poucas que a dão);
    // perguntando pela nota, qualquer posição daquela classe de altura serve.
    const porAltura = s.pergunta === 'altura';
    const gabarito = porAltura ? { kind: 'pitch' as const, midi: m } : { kind: 'pitchClass' as const, pc: mod(m, 12) };
    const comOitava = (nome: string) => (porAltura ? `${nome}${Math.floor(m / 12) - 1}` : nome);
    if (s.direcao === 'achar') {
      // Uma grafia só, sorteada, e a mesma no enunciado e no gabarito — ver `pcNameUm`.
      const bemol = Math.random() < 0.5;
      const nome = nomeNaTonalidade(ctx, mod(m, 12), bemol);
      /**
       * **Todas as posições**: a resposta é o conjunto de casas daquela nota na faixa visível, e a
       * conferência é contorno **não ordenada** — a ordem em que a pessoa varre o braço não é
       * resposta nenhuma.
       *
       * As posições saem das cordas que a pessoa incluiu, não do braço todo: oferecer uma corda
       * desligada como resposta certa seria pedir o que a configuração dela excluiu.
       */
      if (s.todasAsPosicoes && !porAltura) {
        const cordasAtivas = cordas?.length
          ? [...new Set(cordas.map(x => tuning.length - Number(x)).filter(i => i >= 0 && i < tuning.length))]
          : tuning.map((_, i) => i);
        const inicio = from === 0 ? 0 : from + 1;
        const posicoes: number[] = [];
        for (const st of cordasAtivas) for (let casa = inicio; casa <= to; casa++) {
          if (mod(tuning[st] + casa, 12) === mod(m, 12)) posicoes.push(tuning[st] + casa);
        }
        return {
          prompt: ctx.t('quiz.tapAllPositions', { note: nome }), visual: { kind: 'text', text: '' },
          surface: { kind: 'fretboard', tuning, from, to, quantas: posicoes.length },
          expected: { kind: 'contorno', midis: posicoes, ordenada: false },
          sound: { groups: [[m]], instrument: vozDoBraco(tuning) },
          reveal: ctx.t('quiz.howManyPositions', { note: nome, n: String(posicoes.length) }),
        };
      }
      return {
        prompt: ctx.t('quiz.tapNoteOnNeck', { note: comOitava(nome) }), visual: { kind: 'text', text: '' },
        surface: { kind: 'fretboard', tuning, from, to }, expected: gabarito,
        sound: { groups: [[m]], instrument: vozDoBraco(tuning) },
        reveal: ctx.t('quiz.atFret', { note: comOitava(nome), fret: f }),
      };
    }
    return {
      prompt: ctx.t('quiz.whatNote'), visual: { kind: 'fretboard', tuning, from, to, marks: [{ s: str, f }] },
      surface: { kind: 'choices', options: pcOptions(ctx.naming) }, expected: { kind: 'pitchClass', pc: mod(m, 12) },
      sound: { groups: [[m]], instrument: vozDoBraco(tuning) }, reveal: nomeNaTonalidade(ctx, mod(m, 12)),
    };
  },
};
