/**
 * Melodias curtas sorteadas, para a linha **Melodia** do ouvido relativo.
 *
 * Este arquivo é o motivo pelo qual a direção `audiar` mudou de casa (decisão do Paulo em
 * 12/11/2026): uma nota solta não tem gerador, mas uma melodia tem — quantas notas, de que notas,
 * em que extensão, com que salto máximo. Esse gerador é da linha Melodia, e se o "oposto" (ler a
 * melodia e audiá-la) morasse num item de notação, aquele item precisaria do mesmo gerador. Motor
 * duplicado é proibido, então quem tem o gerador tem as duas direções.
 *
 * Nada aqui conhece tela nem tonalidade: recebe as classes de altura permitidas e a faixa, devolve
 * alturas MIDI. Quem resolve tonalidade e material é `catalog/contexto-musical.ts`.
 */
export const MIN_NOTAS = 2;
export const MAX_NOTAS = 8;
/** Salto máximo padrão entre duas notas seguidas: uma quinta justa (decisão do Paulo). */
export const SALTO_PADRAO = 7;

export interface PedidoDeMelodia {
  /** Classes de altura permitidas (0–11). Vem do material e da tonalidade. */
  pcs: number[];
  /** A faixa em que a melodia pode andar, em MIDI. */
  lo: number;
  hi: number;
  /** Quantas notas. */
  n: number;
  /** Salto máximo entre notas seguidas, em semitons. */
  saltoMax: number;
  /**
   * **A chance de cada nota ser uma aproximação cromática**, de 0 a 1.
   *
   * Era uma CONTAGEM (zero a três), e ele corrigiu o desenho em 25/11: *"não necessariamente
   * escolhemos quantas notas cromáticas vai ter, mas sim um botão que tu clica e aí ele tem uma
   * chance relativamente baixa... digamos que uma a cada 5 notas, ou a 4 notas"*.
   *
   * Ele está certo, e o motivo é musical: contagem fixa faz **toda** melodia ter exatamente duas
   * cromáticas, e aí o ouvido aprende a contá-las em vez de reconhecê-las. Com chance, a melodia
   * às vezes não tem nenhuma — e é isso que obriga a ouvir.
   *
   * Os três casos que ele deu antes são o mesmo mecanismo: uma nota a um semitom de uma nota da
   * escala, imediatamente antes dela. O que muda é de onde ela vem — de baixo (o cromático entre 4
   * e 5) ou de cima (o ♭2 caindo na tônica).
   */
  chanceCromatica?: number;
  /**
   * **A cromática resolve, ou fica solta?**
   *
   * `resolvendo` é a definição estrita: a nota de fora é sempre seguida do seu alvo, a meio tom —
   * é o que faz dela aproximação. `livres` deixa a nota de fora aparecer sem resolver, que é outro
   * som (nota alterada solta) e outro exercício de ouvido.
   */
  cromaticasSoltas?: boolean;
  /** Injetável para o teste ser determinístico, como em `amostrasDeCorda`. */
  rnd?: () => number;
}

/**
 * Uma melodia de `n` alturas, cada uma a no máximo `saltoMax` semitons da anterior.
 *
 * **Nota nunca repete logo em seguida.** É a regra que o Paulo escreveu para a linha Nota — *"nunca
 * repetir a exata mesma nota 2 vezes seguidas"* — e dentro de uma melodia ela vale pelo mesmo
 * motivo, só mais forte: duas iguais coladas soam como uma nota mais longa, e a pessoa responderia
 * duas notas tendo ouvido uma.
 *
 * Quando o salto não deixa nenhuma candidata (faixa curta, poucas classes permitidas), o salto é
 * afrouxado para aquela nota em vez de a melodia sair menor. Melodia com menos notas que o pedido
 * seria mentir sobre a configuração; um salto maior é só menos fácil.
 */
export function sortearMelodia(p: PedidoDeMelodia): number[] {
  const rnd = p.rnd ?? Math.random;
  const permitidas: number[] = [];
  for (let m = p.lo; m <= p.hi; m++) if (p.pcs.includes(((m % 12) + 12) % 12)) permitidas.push(m);
  if (!permitidas.length) return Array.from({ length: p.n }, (_, i) => p.lo + i);

  const escolher = (de: number[]) => de[Math.floor(rnd() * de.length)];
  const melodia = [escolher(permitidas)];
  while (melodia.length < p.n) {
    const anterior = melodia[melodia.length - 1];
    const perto = permitidas.filter(m => m !== anterior && Math.abs(m - anterior) <= p.saltoMax);
    // Sem candidata no salto pedido, vale qualquer outra nota: a quantidade pedida é promessa, o
    // salto é preferência.
    const de = perto.length ? perto : permitidas.filter(m => m !== anterior);
    if (!de.length) break;
    melodia.push(escolher(de));
  }
  return p.chanceCromatica ? comAproximacoes(melodia, p) : melodia;
}

/**
 * **As notas de aproximação**, enfiadas na melodia já sorteada.
 *
 * Trocar notas da escala por cromáticas, em vez de acrescentar, é o que mantém a promessa do
 * parâmetro "quantas notas": pedir três notas e ouvir cinco seria mentir sobre a configuração — a
 * mesma regra que o salto já segue mais acima.
 *
 * **A cromática entra ANTES do alvo**, a um semitom, e por isso ela nunca é a última: uma
 * aproximação que não chega em lugar nenhum não é aproximação. Com `cromaticasSoltas`, a exigência
 * cai: a nota de fora aparece onde calhar, e aí o alvo seguinte pode estar a qualquer distância.
 *
 * O alvo nunca é a primeira nota: a melodia precisa dizer onde está antes de sair da escala.
 */
function comAproximacoes(melodia: number[], p: PedidoDeMelodia): number[] {
  const rnd = p.rnd ?? Math.random;
  const chance = Math.max(0, Math.min(1, p.chanceCromatica ?? 0));
  if (!chance) return melodia;
  const naEscala = (m: number) => p.pcs.includes(((m % 12) + 12) % 12);

  const saida = [...melodia];
  /** Os lugares que podem virar cromática: nunca o primeiro, e nunca dois colados. */
  const candidatos = saida.map((_, i) => i).filter(i => i > 0);
  /**
   * **Sorteio por nota, e não uma cota.** Cada lugar candidato tira a sua sorte; o teto é só para
   * a melodia não virar cromatismo quando a chance for alta.
   */
  const teto = Math.max(1, Math.round(melodia.length * Math.min(chance * 2, 0.6)));
  let postas = 0;
  while (candidatos.length && postas < teto) {
    const i = Math.floor(rnd() * candidatos.length);
    if (rnd() >= chance) { candidatos.splice(i, 1); continue; }
    const escolhido = candidatos.splice(i, 1)[0];
    // o alvo é a nota SEGUINTE quando ela existe; sendo a última, o alvo é a anterior e a
    // aproximação vem de volta — continua resolvendo, só que descendo para trás.
    const iAlvo = escolhido + 1 < saida.length ? escolhido + 1 : escolhido - 1;
    const alvo = saida[iAlvo];
    const acima = rnd() < 0.5;
    const candidata = alvo + (acima ? 1 : -1);
    const outra = alvo + (acima ? -1 : 1);
    const vale = (m: number) => m >= p.lo && m <= p.hi && !naEscala(m) && m !== saida[escolhido - 1];
    const nova = vale(candidata) ? candidata : vale(outra) ? outra : null;
    if (nova === null) continue;
    saida[escolhido] = nova;
    postas += 1;
    // Duas cromáticas coladas viram cromatismo, não aproximação: tira os vizinhos da lista.
    for (const vizinho of [escolhido - 1, escolhido + 1]) {
      const onde = candidatos.indexOf(vizinho);
      if (onde >= 0) candidatos.splice(onde, 1);
    }
  }
  if (p.cromaticasSoltas) return saida;

  /**
   * Resolvendo: toda nota de fora tem de estar a um semitom da seguinte. Onde a troca não deixou
   * isso verdadeiro (a seguinte era longe), a nota volta a ser a da escala — melhor uma cromática a
   * menos que uma que não resolve.
   */
  return saida.map((m, i) => {
    if (naEscala(m)) return m;
    const seguinte = saida[i + 1];
    return seguinte !== undefined && Math.abs(seguinte - m) === 1 ? m : melodia[i];
  });
}
