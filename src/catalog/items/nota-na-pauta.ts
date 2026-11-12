import { CLEFS, EXT, midi, tonicaDeContexto, mod, notaNaPauta, noteName, pickClef, randAcc, stepRange } from '../helpers';
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
      // A terceira direção (10/11/2026): o "oposto" do desenho do Paulo. Ver `OR-ouvido-relativo.md`.
      { id: 'audiar', label: ctx.t('settings.audiateIt') },
    ] },
    CLEFS(ctx), EXT(ctx),
    { id: 'acidentes', label: ctx.t('settings.accidentals'), type: 'toggle' },
  ],
  defaults: { direcao: 'ler', claves: ['sol'], extensao: 'pauta', acidentes: false },
  presets: [
    { id: 'ler', nome: 'presets.pautaLer', settings: { direcao: 'ler', claves: ['sol'], extensao: 'pauta', acidentes: false } },
    { id: 'escrever', nome: 'presets.pautaEscrever', settings: { direcao: 'escrever', claves: ['sol'], extensao: 'pauta', acidentes: false } },
    { id: 'com-acidentes', nome: 'presets.pautaAcidentes', settings: { direcao: 'ler', claves: ['sol'], extensao: 'pauta', acidentes: true } },
    { id: 'clave-de-fa', nome: 'presets.pautaClaveFa', settings: { direcao: 'ler', claves: ['fa'], extensao: 'pauta', acidentes: false } },
  ],
  make(s, ctx): Question {
    const clef = pickClef(s, ctx);
    const n = notaNaPauta(ctx, stepRange(clef, s.extensao), () => randAcc(s.acidentes));
    /**
     * **Audiar**: a nota aparece escrita, o contexto toca, você canta por dentro, e o gabarito só
     * soa quando você pede. O padrão é o mesmo que entrou no gerador de leitura em 10/11.
     *
     * `autoplay: false` e o gabarito em `partes` não são detalhe: se a nota tocasse sozinha, o
     * exercício seria ouvir e comparar, que é o outro exercício.
     */
    if (s.direcao === 'audiar') {
      const tonica = tonicaDeContexto(ctx, midi(n));
      return {
        prompt: ctx.t('quiz.audiateNote'), visual: { kind: 'staff', clef, columns: [[n]] },
        surface: { kind: 'autoavaliacao' }, expected: { kind: 'option', id: 'facil' },
        sound: {
          groups: [[tonica]],
          partes: [
            { id: 'contexto', label: ctx.t('quiz.partContext'), groups: [[tonica]] },
            { id: 'resposta', label: ctx.t('quiz.partAnswer'), groups: [[midi(n)]] },
          ],
        },
        autoplay: false, reveal: `${noteName(n, ctx.naming)}${n.oct}`,
      };
    }
    if (s.direcao === 'escrever') {
      return {
        prompt: ctx.t('quiz.writeNote', { note: `${noteName(n, ctx.naming)}${n.oct}` }), visual: { kind: 'text', text: '' },
        surface: { kind: 'staff', clef, accidentals: !!s.acidentes },
        // A oitava entra no esperado: quem escreve escolhe a linha, então a altura é dela.
        expected: { kind: 'spelled', letter: n.letter, acc: n.acc, oct: n.oct },
        sound: { groups: [[midi(n)]] }, reveal: `${noteName(n, ctx.naming)}${n.oct}`,
      };
    }
    return {
      prompt: ctx.t('quiz.whatNote'), visual: { kind: 'staff', clef, columns: [[n]] },
      surface: { kind: 'letters', accidentals: !!s.acidentes },
      // Lendo, a oitava NÃO entra: a pergunta é que nota é, e o nome não tem oitava.
      expected: { kind: 'spelled', letter: mod(n.letter, 7), acc: n.acc },
      sound: { groups: [[midi(n)]] }, reveal: noteName(n, ctx.naming) + n.oct,
    };
  },
};
