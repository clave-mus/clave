// Enumerador de conduções de voz (FM-4, decisões 64, 66 e 71). Função pura, sem interface nenhuma.
//
// **Não é um motor.** É um enumerador, como o `percorrer` dos padrões e o `deslocamento`: recebe
// material musical e devolve uma lista ordenada por critérios nomeados. Quem desenha é o motor de
// partituras ou o visualizador.
//
// A razão de existir, que é a mesma do motor de digitações (decisão 45): **conectar acordes não tem
// resposta certa.** Há várias conduções igualmente válidas, e declarar uma delas "a certa" seria
// item ambíguo gerando "erro do usuário", que a decisão 13 proíbe.
//
// A saída é a mesma: enumerar o que é válido, medir, e **nunca eleger**. O exercício não tem
// alternativas — a pessoa escreve ou toca a condução dela e o app diz *onde ela caiu*:
//
//   "Você moveu 7 semitons. A mais econômica move 3. De 24 conduções válidas, 14 movem menos que a
//    sua, e 9 mantêm mais notas comuns."
//
// Medição, nunca julgamento.
//
// **Escopo: quatro vozes, posição fechada** (decisão 66) — e esse corte está marcado como revisável
// na própria decisão, porque foi tomado por quem não toca instrumento de cordas.
//
// As cinco medidas abaixo são as únicas que não dependem de opinião. As *regras de escrita* —
// quintas e oitavas paralelas, dobramento, resolução da sensível — ficam de fora de propósito (ver
// docs/guardados.md): cada uma precisa de uma decisão sobre em que tradição vale, porque no jazz
// quintas paralelas são vocabulário.
import { CHORDS, mod, type ChordId } from './core';

/** Quatro alturas MIDI, do baixo ao soprano. Sempre crescentes. */
export type Voicing = readonly [number, number, number, number];

/** O âmbito de uma voz, em MIDI. Baixo, tenor, contralto e soprano, nessa ordem. */
export interface Ambito { lo: number; hi: number }

/**
 * Âmbitos corais de referência. Largos de propósito: apertar é decisão do exercício, não do
 * enumerador — e um enumerador que filtra demais não é enumerador.
 */
export const AMBITOS_CORAL: readonly Ambito[] = [
  { lo: 40, hi: 60 }, // baixo:     Mi2 – Dó4
  { lo: 48, hi: 67 }, // tenor:     Dó3 – Sol4
  { lo: 55, hi: 74 }, // contralto: Sol3 – Ré5
  { lo: 60, hi: 81 }, // soprano:   Dó4 – Lá5
];

/** O que se mede de uma condução. Cinco números, nenhuma opinião. */
export interface Medidas {
  /** Soma dos semitons percorridos pelas quatro vozes. */
  movimentoTotal: number;
  /** Quantas vozes ficaram exatamente na mesma altura. */
  notasComuns: number;
  /** O maior movimento de uma voz só. */
  maiorSalto: number;
  /** Alguma voz passou por cima da vizinha. */
  cruzamento: boolean;
  /** Todas as vozes dentro do âmbito declarado. */
  noAmbito: boolean;
}

const ORDENADO = (v: readonly number[]) => v.every((m, i) => i === 0 || m >= v[i - 1]);

/** As classes de altura que o acorde exige, sem oitava. */
export function pcsDoAcorde(fundamental: number, id: ChordId): number[] {
  return CHORDS[id].degs.map(([, semis]) => mod(fundamental + semis, 12));
}

/**
 * Todas as disposições de quatro vozes do acorde, em posição fechada, dentro dos âmbitos.
 *
 * **Posição fechada** aqui quer dizer: as três vozes de cima cabem dentro de uma oitava. O baixo
 * fica livre, que é como a escrita coral realmente funciona.
 *
 * Toda classe de altura do acorde aparece pelo menos uma vez; com tríade, uma delas é dobrada — e
 * **qual** dobrar é regra de escrita, que esta função deliberadamente não opina (decisão 64).
 */
export function disposicoes(fundamental: number, id: ChordId, ambitos: readonly Ambito[] = AMBITOS_CORAL): Voicing[] {
  const pcs = pcsDoAcorde(fundamental, id);
  const alturas = ambitos.map(a => {
    const out: number[] = [];
    for (let m = a.lo; m <= a.hi; m++) if (pcs.includes(mod(m, 12))) out.push(m);
    return out;
  });

  const out: Voicing[] = [];
  for (const b of alturas[0]) for (const t of alturas[1]) {
    if (t < b) continue;
    for (const c of alturas[2]) {
      if (c < t) continue;
      for (const s of alturas[3]) {
        if (s < c) continue;
        if (s - t > 12) continue; // posição fechada: as três de cima dentro de uma oitava
        const v = [b, t, c, s] as const;
        if (new Set(v.map(m => mod(m, 12))).size !== pcs.length) continue; // o acorde inteiro soa
        out.push(v);
      }
    }
  }
  return out;
}

/** As cinco medidas da passagem de uma disposição para outra. */
export function medir(de: Voicing, para: Voicing, ambitos: readonly Ambito[] = AMBITOS_CORAL): Medidas {
  const passos = para.map((m, i) => Math.abs(m - de[i]));
  return {
    movimentoTotal: passos.reduce((a, b) => a + b, 0),
    notasComuns: passos.filter(p => p === 0).length,
    maiorSalto: Math.max(...passos),
    cruzamento: !ORDENADO(para),
    noAmbito: para.every((m, i) => m >= ambitos[i].lo && m <= ambitos[i].hi),
  };
}

/** Uma condução: para onde se vai e o que isso custa. */
export interface Conducao { para: Voicing; medidas: Medidas }

/**
 * Todas as conduções válidas de `de` para o acorde pedido, **sem eleger nenhuma**.
 *
 * Vêm ordenadas por movimento total e, no empate, por notas comuns e menor salto. **A ordem é
 * conveniência de leitura, não um ranking de qualidade** — a primeira não é "a certa", é só a mais
 * econômica. Dizer qual serve é da pessoa; medir é do app.
 */
export function conducoes(de: Voicing, fundamental: number, id: ChordId, ambitos: readonly Ambito[] = AMBITOS_CORAL): Conducao[] {
  return disposicoes(fundamental, id, ambitos)
    .map(para => ({ para, medidas: medir(de, para, ambitos) }))
    .sort((a, b) =>
      a.medidas.movimentoTotal - b.medidas.movimentoTotal
      || b.medidas.notasComuns - a.medidas.notasComuns
      || a.medidas.maiorSalto - b.medidas.maiorSalto);
}

/** Onde a condução da pessoa caiu entre as válidas. É o que a tela mostra, e é só isso. */
export interface Situacao {
  /** As medidas da condução que a pessoa escreveu ou tocou. */
  suas: Medidas;
  /** Quantas conduções válidas existem ao todo. */
  validas: number;
  /** O menor movimento total possível. */
  menorMovimento: number;
  /** Quantas movem menos que a dela. */
  movemMenos: number;
  /** Quantas mantêm mais notas comuns que a dela. */
  mantemMais: number;
  /** A condução dela é uma das válidas? Falso quando sai do âmbito ou cruza vozes. */
  valida: boolean;
}

/**
 * Situar a condução da pessoa — a função que o exercício chama.
 *
 * Repare no que ela **não** devolve: nenhum booleano "certo", nenhuma nota, nenhuma pontuação. Só
 * posições relativas, que a pessoa interpreta.
 */
export function situar(de: Voicing, sua: Voicing, fundamental: number, id: ChordId, ambitos: readonly Ambito[] = AMBITOS_CORAL): Situacao {
  const todas = conducoes(de, fundamental, id, ambitos);
  const suas = medir(de, sua, ambitos);
  const pcs = pcsDoAcorde(fundamental, id);
  const tocaOAcordeInteiro = new Set(sua.map(m => mod(m, 12))).size === pcs.length
    && sua.every(m => pcs.includes(mod(m, 12)));
  return {
    suas,
    validas: todas.length,
    menorMovimento: todas.length ? todas[0].medidas.movimentoTotal : 0,
    movemMenos: todas.filter(c => c.medidas.movimentoTotal < suas.movimentoTotal).length,
    mantemMais: todas.filter(c => c.medidas.notasComuns > suas.notasComuns).length,
    valida: tocaOAcordeInteiro && !suas.cruzamento && suas.noAmbito,
  };
}
