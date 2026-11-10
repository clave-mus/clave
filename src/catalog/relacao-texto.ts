// A frase que descreve a relação entre a melodia e o acorde — "Relações entre melodia e harmonia"
// (nome do Paulo, 07/11/2026).
//
// O motor (`theory/nota-sobre-acorde.ts`) apura os fatos; aqui eles viram frase, e **só aqui** o
// produto usa a única palavra avaliativa que o Paulo autorizou: *"pode gerar tensão"*, e **apenas
// onde há semitom** — que foi o critério que ele deu, *"óbvias de gerar tensão por uma questão
// matemática"*. Nenhuma outra combinação recebe adjetivo: dizer que uma nona "soa aberta" ou que
// uma quarta "fica suspensa" seria juízo que ninguém decidiu.
//
// Todo texto mora em `src/i18n/`; aqui só se escolhe a chave e se preenchem os campos.
import { noteName, type Note } from '../theory/core';
import { intervalName } from '../theory/names';
import { reduzir, type RelacaoNotaAcorde } from '../theory/nota-sobre-acorde';
import type { MessageKey } from '../i18n';
import type { Ctx } from './types';

/** Os graus que um acorde pode ter, como a frase os chama. */
const GRAU: Record<number, MessageKey> = {
  1: 'melodyHarmony.degree_1', 3: 'melodyHarmony.degree_3',
  5: 'melodyHarmony.degree_5', 7: 'melodyHarmony.degree_7',
};

export interface OpcoesDeTexto {
  /** Trazer o intervalo para dentro da oitava (padrão) ou nomeá-lo como de fato soa. */
  reduzido?: boolean;
}

/**
 * A frase inteira: o que a nota é no acorde, e o atrito quando existe.
 *
 * Os atritos vêm em lista porque o tipo permite, mas numa tríade **nunca há mais de um**: duas
 * notas do acorde a um semitom da mesma melodia estariam a uma oitava uma da outra, e tríade não
 * repete classe de altura. Com tétrade isso deixa de valer, e aí a frase já junta as duas.
 */
export function descreverRelacao(
  r: RelacaoNotaAcorde,
  o: { melodia: Note; simbolo: string; ctx: Ctx } & OpcoesDeTexto,
): string {
  const { ctx, melodia, simbolo, reduzido = true } = o;
  const nota = noteName(melodia, ctx.naming);

  const principal = r.grauDoAcorde !== null
    ? ctx.t('melodyHarmony.isChordTone', { note: nota, degree: ctx.t(GRAU[r.grauDoAcorde]), chord: simbolo })
    : ctx.t('melodyHarmony.isNotChordTone', {
      note: nota, chord: simbolo,
      interval: intervalName(reduzido ? reduzir(r.intervalo) : r.intervalo, ctx.conv),
    });

  const atritos = r.atritos.map(a => ctx.t('melodyHarmony.clash', {
    distance: ctx.t(a.semitons === 1 ? 'melodyHarmony.distSemitone' : 'melodyHarmony.distMinorNinth'),
    note: noteName(a.nota, ctx.naming),
    degree: ctx.t(GRAU[a.grau]),
  }));

  return [principal, ...atritos].join(' ');
}
