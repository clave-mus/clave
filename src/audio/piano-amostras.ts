/**
 * Piano de amostras (`OR-ouvido-relativo.md`, §7): o timbre padrão dos exercícios de ouvido deixa
 * de ser sintetizado e passa a ser um piano de verdade — **só onde é piano**. Cordas e drone
 * continuam sintetizados: a corda pulsada soa como corda, e o drone sustenta indefinidamente, o
 * que amostra não faz.
 *
 * ## As amostras
 *
 * **Salamander Grand Piano** (Alexander Holm, licença CC-BY 3.0 — o crédito está no README e em
 * `public/amostras/piano/CREDITOS.txt`), uma amostra a cada três semitons de C2 a C6; o que fica
 * entre duas sai por transposição da mais próxima (no máximo 1 semitom de desvio — inaudível como
 * artefato de `playbackRate`). Recodificadas para mono 64 kbps com 5 s de cauda: **684 KB** no
 * total, dentro do orçamento de 500–800 KB medido no §7.
 *
 * ## O carregamento é preguiçoso e o som nunca espera a rede
 *
 * A primeira nota de piano dispara o download; **até cada amostra decodificar, vale o sintetizado**
 * — que sempre soa. É o desenho do §7: trocar o timbre sem cache tornaria o ônibus pior, então o
 * fallback é estrutural, não excepcional. O service worker guarda `/amostras/` como guarda
 * `/assets/`, e offline o piano continua de verdade depois da primeira visita.
 *
 * Este módulo não toca nada: ele só carrega, decodifica e responde "qual buffer serve para esta
 * nota". Tocar — ganho, envelope, registrar para o `pararTudo` — é do `engine.ts`, como sempre.
 */

export interface Amostra { nome: string; midi: number }

/** C2–C6 a cada três semitons. Há teste conferindo que cada nome existe em `public/amostras/piano/`. */
export const AMOSTRAS: Amostra[] = ['C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6']
  .map((nome, i) => ({ nome, midi: 36 + i * 3 }));

/** A amostra mais próxima da altura pedida. Empate desce: transpor para cima clareia menos o timbre. */
export function amostraMaisProxima(m: number): Amostra {
  let melhor = AMOSTRAS[0];
  for (const a of AMOSTRAS) if (Math.abs(a.midi - m) < Math.abs(melhor.midi - m)) melhor = a;
  return melhor;
}

/** Quanto acelerar/retardar o buffer para a amostra soar na altura pedida. */
export const taxaDeTransposicao = (m: number, base: number): number => 2 ** ((m - base) / 12);

export interface AmostraDecodificada {
  buffer: AudioBuffer;
  /** Pico de amplitude do buffer, para o motor normalizar o volume ao nível do sintetizado. */
  pico: number;
}

const decodificadas = new Map<string, AmostraDecodificada>();
let carregamentoDisparado = false;

/**
 * Dispara o download e a decodificação de todas as amostras, uma vez. Cada uma fica disponível
 * assim que decodifica — não é tudo-ou-nada: as primeiras notas já podem sair amostradas enquanto
 * as outras chegam. Falha de rede é silenciosa de propósito: o sintetizado cobre.
 */
export function carregarAmostras(c: BaseAudioContext): void {
  if (carregamentoDisparado) return;
  carregamentoDisparado = true;
  for (const a of AMOSTRAS) {
    // try/catch além do .catch: fora do navegador (teste), fetch de URL relativa lança SÍNCRONO.
    try {
    void fetch(`${import.meta.env.BASE_URL}amostras/piano/${a.nome}.mp3`)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then(dados => c.decodeAudioData(dados))
      .then(buffer => {
        const canal = buffer.getChannelData(0);
        let pico = 0;
        for (let i = 0; i < canal.length; i++) pico = Math.max(pico, Math.abs(canal[i]));
        decodificadas.set(a.nome, { buffer, pico: pico || 1 });
      })
      .catch(() => {});
    } catch { /* sem rede ou sem navegador: o sintetizado cobre */ }
  }
}

/**
 * O buffer que serve para a altura `m`, se já decodificou — e a taxa para afiná-lo. `null` enquanto
 * não há: o motor cai no sintetizado. A PRIMEIRA chamada dispara o carregamento, que é o "só quando
 * um exercício com som abre" do §7.
 */
export function amostraDePiano(m: number, c: BaseAudioContext): (AmostraDecodificada & { taxa: number }) | null {
  carregarAmostras(c);
  const alvo = amostraMaisProxima(m);
  const pronta = decodificadas.get(alvo.nome);
  return pronta ? { ...pronta, taxa: taxaDeTransposicao(m, alvo.midi) } : null;
}

/** Só para teste: volta ao estado de página recém-aberta. */
export function esquecerAmostras(): void {
  decodificadas.clear();
  carregamentoDisparado = false;
}
