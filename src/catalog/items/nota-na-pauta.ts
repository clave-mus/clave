import { CLEFS, midi, passosDaRegiao, quintasDaTonalidade, mod, notaNaPauta, noteName, pickClef, randAcc } from '../helpers';
import type { Question } from '../helpers';
import { LEGADO } from '../publicacao';
import type { CatalogItem } from '../types';

/**
 * Nota na pauta: **ler** o que está escrito, ou **escrever** o que foi pedido.
 *
 * ## Por que este item existe (reorganização de 09/11/2026)
 *
 * Ele é metade de `que-nota-e-essa` mais metade de `ache-a-nota`. A fusão anterior juntou os itens
 * por **direção** (identificar num item, produzir no outro) e deixou a **superfície** como
 * parâmetro. O Paulo viu que estava invertido, e o código concordava com ele em três lugares:
 *
 * - o `ache-a-nota` declarava **três** `skillTags`, uma por superfície — o item admitia ser três;
 * - a **validação** mudava com a superfície, não com a direção: na pauta a resposta é a GRAFIA
 *   (Dó♯ ≠ Ré♭, porque a pauta distingue), no teclado e no braço é a ALTURA;
 * - a **extensão** também: `pauta/suplementares`, `1/2 oitavas` e faixas de casa são três unidades
 *   incomparáveis, e viviam escondidas umas das outras com `Setting.quando`.
 *
 * A direção, essa sim, não muda nada disso: ler e escrever na pauta usam a mesma unidade de
 * extensão, a mesma validação por grafia e a mesma habilidade de notação. O caro era parâmetro e o
 * barato era item; agora é o contrário.
 *
 * Um sinal de que o eixo novo está certo: o grupo "leitura na pauta" tinha o comentário *"ache-a-nota
 * na pauta entra mesmo sendo escrever, não ler: serve ao mesmo propósito"*. Aquela justificativa
 * existia só para remendar a estrutura antiga, e aqui deixa de ser necessária.
 */
export const notaNaPautaItem: CatalogItem = {
  id: 'nota-na-pauta',
  objetos: ['notas', 'notacao'], tarefas: ['nomear', 'ler', 'escrever'],
  primaryModule: 'theory',
  skillTags: ['notation.pitch_reading', 'notation.pitch_writing'],
  contentTags: ['pitch.naturals', 'pitch.accidentals', 'clef.treble', 'clef.bass', 'staff.ledger_lines'],
  kind: 'serie', requires: {}, validation: ['deterministic'], mobile: true,
  respeita: ['key', 'range', 'material'],
  publicacao: LEGADO,
  settings: ctx => [
    // A direção é a configuração barata: a mesma pergunta, virada do avesso.
    { id: 'direcao', label: ctx.t('settings.direction2'), type: 'single', options: [
      { id: 'ler', label: ctx.t('settings.readIt') },
      { id: 'escrever', label: ctx.t('settings.writeIt') },
      /**
       * **O `audiar` saiu daqui em 12/11.** Ele morou neste seletor de 10 a 12/11, e foi para a
       * linha de ouvido correspondente (`ouvido-tecla`, estímulo `escrito`).
       *
       * O motivo, decidido com o Paulo: audiar é ouvido, e **quem tem o gerador tem as duas
       * direções**. A pergunta dele — *"onde entraria ler uma sequência de graus, 1543, e audiá-la?"*
       * — não tinha resposta com o audiar aqui: este item sabe de pauta, não de melodia nem de grau.
       * Ver `OR-ouvido-relativo.md`, §2.
       */
    ] },
    CLEFS(ctx),
    /**
     * **A extensão saiu em 12/11**, a pedido do Paulo: *"seria interessante definir a nota mínima e
     * máxima ao invés de dizer só se quer linha suplementar ou não"*. Ela dizia "pauta" ou "com
     * linhas suplementares", dois degraus grossos para a mesma coisa que a REGIÃO já expressa com
     * precisão — e era um controle a mais num painel que ele achou cheio demais. Os passos da pauta
     * agora saem da região (ver `passosDaRegiao`), limitados pelo que a clave alcança.
     */
    /**
     * **Acidentes só fazem sentido sem tonalidade fixa** (decidido com o Paulo em 12/11).
     *
     * Ele: *"acho que tem configurações demais pra coisas parecidas — pedir sustenidos e bemóis,
     * cromático ou só tonalidade, tonalidade…"*. Com uma tonalidade escolhida, ela já diz **quais**
     * acidentes existem e **como** a nota se escreve; ligar "sustenidos e bemóis" por cima só
     * produzia a contradição que ele viu (Fá♭ em Sol maior). Então o controle desaparece quando há
     * tonalidade, e a armadura passa a aparecer na pauta.
     */
    { id: 'acidentes', label: ctx.t('settings.accidentals'), type: 'toggle',
      quando: () => quintasDaTonalidade(ctx) === null },
  ],
  defaults: { direcao: 'ler', claves: ['sol'], acidentes: false },
  presets: [
    { id: 'ler', nome: 'presets.pautaLer', settings: { direcao: 'ler', claves: ['sol'], acidentes: false } },
    { id: 'escrever', nome: 'presets.pautaEscrever', settings: { direcao: 'escrever', claves: ['sol'], acidentes: false } },
    { id: 'com-acidentes', nome: 'presets.pautaAcidentes', settings: { direcao: 'ler', claves: ['sol'], acidentes: true } },
    { id: 'clave-de-fa', nome: 'presets.pautaClaveFa', settings: { direcao: 'ler', claves: ['fa'], acidentes: false } },
  ],
  make(s, ctx): Question {
    const clef = pickClef(s, ctx);
    const n = notaNaPauta(ctx, passosDaRegiao(clef, ctx), () => randAcc(s.acidentes));
    // A armadura da tonalidade em vigor, desenhada na pauta (e `undefined` com tonalidade livre).
    const fifths = quintasDaTonalidade(ctx) ?? undefined;
    if (s.direcao === 'escrever') {
      return {
        prompt: ctx.t('quiz.writeNote', { note: `${noteName(n, ctx.naming)}${n.oct}` }), visual: { kind: 'text', text: '' },
        surface: { kind: 'staff', clef, accidentals: !!s.acidentes, fifths },
        // A oitava entra no esperado: quem escreve escolhe a linha, então a altura é dela.
        expected: { kind: 'spelled', letter: n.letter, acc: n.acc, oct: n.oct },
        sound: { groups: [[midi(n)]] }, reveal: `${noteName(n, ctx.naming)}${n.oct}`,
      };
    }
    return {
      prompt: ctx.t('quiz.whatNote'), visual: { kind: 'staff', clef, fifths, columns: [[n]] },
      surface: { kind: 'letters', accidentals: !!s.acidentes },
      // Lendo, a oitava NÃO entra: a pergunta é que nota é, e o nome não tem oitava.
      expected: { kind: 'spelled', letter: mod(n.letter, 7), acc: n.acc },
      sound: { groups: [[midi(n)]] }, reveal: noteName(n, ctx.naming) + n.oct,
    };
  },
};
