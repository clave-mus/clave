/**
 * **Digitações de escala no braço** — enumerar os desenhos possíveis de um modo, e julgar o desenho
 * que a pessoa montou.
 *
 * Pedido dele em 25/11: *"o objetivo é decorar os modos gregos no braço do baixo apenas com o
 * celular... o usuário clica nas posições que quiser, montando uma digitação da escala... claro que
 * existem diversas digitações para cada escala, então tem várias respostas certas... seria legal
 * pedir para o usuário escrever diversas digitações para a mesma escala, isso ajuda a sair do
 * shape"*.
 *
 * **Motor novo? Não.** `buscarDigitacoes` já faz a busca no braço por backtracking, e aceita
 * `tipo: 'arpejo'` com corda repetida e contorno subindo — que é exatamente uma escala. Medido
 * antes de escrever uma linha: ré dórico num baixo de quatro cordas, vão de 4 casas, dá **22
 * digitações distintas** usando de duas a quatro cordas. Este arquivo é a camada de escala por
 * cima: quais modos existem, e o que conta como digitação certa.
 *
 * Puro, sem React — como todo `theory/`.
 */
import { buscarDigitacoes, getModo, notasDoModo, type Encaixe, type FamiliaBase } from './digitacoes';
import { midi, mod, type Note } from './core';

/** Uma posição no braço, como a tela a entrega. */
export interface PosicaoDaDigitacao { corda: number; casa: number }

export interface PedidoDeDigitacao {
  tonica: Note;
  familia: FamiliaBase;
  /** O grau da escala que vira tônica do modo: 1 é o modo da própria escala, 2 é o dórico dela. */
  grau: number;
  tuning: readonly number[];
  maxCasa?: number;
  /** Vão máximo da mão, em casas. Corda solta não conta como dedo. */
  maxVaoCasas?: number;
  limite?: number;
  /**
   * **Fechar na oitava**: acrescenta a tônica uma oitava acima da primeira nota, quando ela existe
   * no braço dentro do vão. Desenhos que não conseguem fechar ficam de fora — pedindo oito notas,
   * sugerir um desenho de sete seria sugerir outra coisa.
   */
  oitava?: boolean;
}

/** As classes de altura do modo, na ordem dos graus. */
export function classesDoModo(p: Pick<PedidoDeDigitacao, 'tonica' | 'familia' | 'grau'>): number[] {
  const modo = getModo(p.tonica, p.familia, p.grau);
  return notasDoModo(modo).map(n => mod(midi(n), 12));
}

/**
 * Todos os desenhos do modo no braço, **subindo**, dentro do vão da mão.
 *
 * `cordasDistintas: false` é o que faz disto escala e não acorde: numa escala a mesma corda carrega
 * três ou quatro notas, e exigir uma corda por nota não devolveria desenho nenhum num baixo.
 */
export function digitacoesDaEscala(p: PedidoDeDigitacao): PosicaoDaDigitacao[][] {
  const modo = getModo(p.tonica, p.familia, p.grau);
  const notas = notasDoModo(modo);
  const tons = notas.map((n, i) => ({ role: String(i + 1), pc: mod(midi(n), 12), semisDaFundamental: 0, nota: n }));
  const achadas = [...buscarDigitacoes(tons, {
    tipo: 'arpejo', tuning: p.tuning, maxCasa: p.maxCasa ?? 12,
    maxVaoCasas: p.maxVaoCasas ?? 4, cordasDistintas: false, contorno: 'subindo',
    limite: p.limite ?? 400,
  })];
  const vistas = new Set<string>();
  const saida: PosicaoDaDigitacao[][] = [];
  for (const f of achadas) {
    let pos = f.map((e: Encaixe) => ({ corda: e.corda, casa: e.casa }));
    if (p.oitava) {
      const fechada = fecharNaOitava(pos, p);
      if (!fechada) continue;
      pos = fechada;
    }
    const chave = assinaturaDaDigitacao(pos);
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    saida.push(pos);
  }
  return saida;
}

/**
 * A tônica uma oitava acima da primeira nota, se ela existir no braço **dentro do mesmo vão**.
 * Devolve `null` quando não há — e aí o desenho não fecha, e sai da lista.
 */
function fecharNaOitava(pos: PosicaoDaDigitacao[], p: PedidoDeDigitacao): PosicaoDaDigitacao[] | null {
  const alturaDe = (x: PosicaoDaDigitacao) => p.tuning[x.corda] + x.casa;
  const alturas = pos.map(alturaDe);
  /**
   * **Só fecha o que cabe numa oitava.** Um desenho espalhado por quatro cordas pode abrir vinte e
   * dois semitons, e aí a tônica de cima cairia no MEIO dele — isso não é fechar na oitava, é
   * acrescentar uma nota no miolo. Medido: 22 semitons num desenho de ré dórico no baixo.
   */
  if (Math.max(...alturas) - Math.min(...alturas) >= 12) return null;
  const alvo = Math.min(...alturas) + 12;
  const pressionadas = pos.filter(x => x.casa > 0).map(x => x.casa);
  const maxCasa = p.maxCasa ?? 12;
  const vao = p.maxVaoCasas ?? 4;
  for (let corda = 0; corda < p.tuning.length; corda++) {
    const casa = alvo - p.tuning[corda];
    if (casa < 0 || casa > maxCasa) continue;
    const todas = casa > 0 ? [...pressionadas, casa] : pressionadas;
    if (todas.length > 1 && Math.max(...todas) - Math.min(...todas) > vao) continue;
    if (pos.some(x => x.corda === corda && x.casa === casa)) continue;
    return [...pos, { corda, casa }];
  }
  return null;
}

/** `c0f3 c1f0 …` — o LUGAR exato de um desenho. Dois desenhos iguais em lugares diferentes diferem. */
export function assinaturaDaDigitacao(pos: readonly PosicaoDaDigitacao[]): string {
  return [...pos].sort((a, b) => a.corda - b.corda || a.casa - b.casa)
    .map(p => `c${p.corda}f${p.casa}`).join(' ');
}

/**
 * **A FORMA do desenho** — o que a mão faz, sem onde ela está.
 *
 * Defeito que ele relatou em 25/11: *"quando clico em ver um desenho que não fiz, acho que ele
 * muitas vezes dá o mesmo desenho mas começando numa nota uma oitava acima. aí não adianta... a
 * ideia é o desenho ser diferente, não a oitava"*. Ele está certo, e a causa era a assinatura por
 * lugar: subir o mesmo desenho uma oitava muda todas as casas e nenhuma relação.
 *
 * A forma é a sequência de deslocamentos (corda, casa) a partir da primeira posição. Num braço de
 * quartas, o mesmo desenho noutro par de cordas tem a MESMA forma — e é por isso que ele não serve
 * como sugestão. No violão, atravessar a corda Si muda os deslocamentos de casa, e aí a forma é
 * outra de verdade: a conta cuida dos dois casos sozinha.
 */
export function formaDaDigitacao(pos: readonly PosicaoDaDigitacao[]): string {
  const ordem = [...pos].sort((a, b) => a.corda - b.corda || a.casa - b.casa);
  const [base] = ordem;
  if (!base) return '';
  return ordem.map(p => `${p.corda - base.corda}:${p.casa - base.casa}`).join(' ');
}

/** Por que um desenho foi recusado. A tela escolhe como dizer isso. */
export type Recusa = 'faltam' | 'sobram' | 'desce' | 'vao' | 'repetida';

export interface Veredito { certo: boolean; motivo?: Recusa; faltando?: number[]; sobrando?: number[] }

/**
 * **O desenho que a pessoa montou é uma digitação do modo?**
 *
 * As quatro condições, e o porquê de cada uma:
 *
 * 1. **as classes batem** — todas as do modo, e nenhuma de fora. É o que faz dela aquela escala;
 * 2. **nenhuma classe repetida**, com UMA exceção: a última nota pode fechar na oitava da primeira.
 *    Era recusa até 25/11, e ele relatou — uma digitação de escala vai da tônica à tônica;
 * 3. **sobe** — ordenando por altura, a sequência tem de ser a ordem dos graus a partir da tônica
 *    do modo. Sem isso, qualquer punhado de posições com as classes certas passaria, e o desenho
 *    que se decora é o que sobe;
 * 4. **cabe na mão** — o vão entre a casa mais baixa e a mais alta, sem contar corda solta.
 *
 * Não se compara com a lista de digitações geradas, de propósito: a lista é **sugestão**, e o
 * veredito é regra. Comparar com uma lista faria a busca decidir o que é certo — e aí um desenho
 * legítimo que o `limite` cortou viraria erro.
 */
export function julgarDigitacao(
  pos: readonly PosicaoDaDigitacao[],
  p: Pick<PedidoDeDigitacao, 'tonica' | 'familia' | 'grau' | 'tuning'> & { maxVaoCasas?: number },
): Veredito {
  const classes = classesDoModo(p);
  const alturas = pos.map(x => p.tuning[x.corda] + x.casa).sort((a, b) => a - b);
  const pcs = alturas.map(m => mod(m, 12));

  const faltando = classes.filter(c => !pcs.includes(c));
  const sobrando = [...new Set(pcs.filter(c => !classes.includes(c)))];
  if (sobrando.length) return { certo: false, motivo: 'sobram', sobrando };
  if (faltando.length) return { certo: false, motivo: 'faltam', faltando };

  /**
   * **Fechar na oitava vale** (defeito que ele relatou em 25/11: *"está considerando que errei
   * quando adiciono a oitava, só aceita se eu for até a sétima"*).
   *
   * Uma digitação de escala vai da tônica à tônica — é assim que se toca e é assim que se decora.
   * A regra de "nenhuma classe repetida" continua, com **uma** exceção: a última nota pode ser a
   * primeira classe, uma oitava acima da primeira altura. Qualquer outra repetição segue recusada.
   */
  const fechaNaOitava = alturas.length === classes.length + 1
    && pcs[pcs.length - 1] === pcs[0]
    && alturas[alturas.length - 1] === alturas[0] + 12;
  const corpo = fechaNaOitava ? pcs.slice(0, -1) : pcs;
  if (new Set(corpo).size !== corpo.length) return { certo: false, motivo: 'repetida' };
  if (!fechaNaOitava && alturas.length !== classes.length) return { certo: false, motivo: 'repetida' };

  // Sobe? A partir da tônica do modo, os graus têm de sair na ordem — e as alturas já vêm ordenadas.
  const ordem = corpo.map(c => classes.indexOf(c));
  for (let i = 1; i < ordem.length; i++) if (ordem[i] !== ordem[i - 1] + 1) return { certo: false, motivo: 'desce' };

  const pressionadas = pos.filter(x => x.casa > 0).map(x => x.casa);
  const vao = pressionadas.length > 1 ? Math.max(...pressionadas) - Math.min(...pressionadas) : 0;
  if (vao > (p.maxVaoCasas ?? 4)) return { certo: false, motivo: 'vao' };
  return { certo: true };
}

/**
 * Uma sugestão de desenho **diferente dos que a pessoa já montou** — o *"pedir para o computador
 * dar sugestões de desenhos diferentes do que ele já tinha feito, a fim de expandir a visão do
 * braço"* que ele descreveu.
 *
 * Prefere a mais distante das já feitas: a sugestão que mais muda de lugar é a que mais abre o
 * braço. Distância é a diferença de casa média — grosseira de propósito, e o bastante para não
 * sugerir o mesmo desenho uma casa ao lado.
 */
export function sugerirDigitacao(
  p: PedidoDeDigitacao, jaFeitas: readonly (readonly PosicaoDaDigitacao[])[],
): PosicaoDaDigitacao[] | null {
  const todas = digitacoesDaEscala(p);
  /**
   * **Compara FORMA, não lugar** — pedido dele em 25/11. O mesmo desenho uma oitava acima não é
   * desenho novo, e sugerir isso não expande braço nenhum. Tira também as formas repetidas entre
   * as próprias candidatas: o que sobra são desenhos de verdade diferentes.
   */
  const feitas = new Set(jaFeitas.map(formaDaDigitacao));
  const vistas = new Set<string>();
  const novas = todas.filter(d => {
    const forma = formaDaDigitacao(d);
    if (feitas.has(forma) || vistas.has(forma)) return false;
    vistas.add(forma);
    return true;
  });
  if (!novas.length) return null;
  if (!jaFeitas.length) return novas[Math.floor(Math.random() * novas.length)];
  const casaMedia = (d: readonly PosicaoDaDigitacao[]) => d.reduce((s, x) => s + x.casa, 0) / d.length;
  const medias = jaFeitas.map(casaMedia);
  const distancia = (d: PosicaoDaDigitacao[]) => Math.min(...medias.map(m => Math.abs(casaMedia(d) - m)));
  return novas.reduce((melhor, d) => (distancia(d) > distancia(melhor) ? d : melhor), novas[0]);
}
