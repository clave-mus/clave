// O contexto musical que os itens leem da cascata (F2-3, decisão 57).
//
// Antes disto, `key`, `range`, `material`, `tempo` e `clef` estavam declarados em
// `GlobalParams` e **nenhum exercício os lia** — o catálogo sorteava tudo em faixas escritas no
// código. A consequência era que a rotação de tonalidade (decisão 38) não faria nada: a rotina
// avançaria de Dó para Sol e os exercícios continuariam sorteando a tônica no aleatório.
//
// A regra de ouro de todas as funções daqui: **respeitar o parâmetro quando ele está definido e
// sortear livremente quando não está.** `key: null` quer dizer "livre", é o padrão, e quem não
// escolheu tonalidade quer variedade — não Dó maior em tudo.
//
// E é por isso que elas moram num arquivo só: acrescentar um parâmetro musical novo se faz aqui,
// e passa a valer para todo item sem editar o catálogo. É o critério de pronto da F2-1.
import { applyKey, buildScale, clefBottom, fromMidi, fromStep, majorTonic, midi, mod, note, pcNameUm, pick, randInt, transpose, type Clef, type ModoDoCampo, type Note } from '../theory/core';
import type { GlobalParams } from './params';
import type { Ctx } from './types';

/** A tonalidade em vigor, ou `null` quando é livre. */
export const tonalidade = (ctx: Ctx) => ctx.params.key;

/**
 * Só as notas da tonalidade importam, ou qualquer nota serve?
 *
 * **O que `material` governa, e o que ele não governa.** Ele restringe a **escolha livre de nota**
 * — quando o exercício ia sortear qualquer altura, passa a sortear só as da tonalidade. Ele
 * **não** mexe no conteúdo musical declarado: se a pergunta é "que escala é esta?" e a resposta é
 * menor harmônica, as notas dela saem da tonalidade **por definição**, e isso está certo.
 *
 * Em uma frase: material filtra o que o app sorteia, não o que o app pergunta.
 */
export const soDiatonico = (ctx: Ctx) => ctx.params.material === 'diatonico' && ctx.params.key !== null;

/**
 * As classes de altura permitidas agora.
 *
 * Com `material: 'diatonico'` e uma tonalidade definida, são as sete da escala. Caso contrário, as
 * doze — que é o padrão, e tem que continuar sendo.
 */
export function pcsPermitidas(ctx: Ctx): number[] {
  const k = ctx.params.key;
  if (!soDiatonico(ctx) || !k) return Array.from({ length: 12 }, (_, i) => i);
  const tonica = note(0, 0, 4);
  const escala = buildScale({ ...tonica, letter: 0 }, k.mode === 'menor' ? 'menor' : 'maior');
  return escala.map(n => mod(midi(n) + k.tonic, 12));
}

/**
 * As classes de altura permitidas, **cruzadas com as notas que a pessoa escolheu**.
 *
 * Pedido do Paulo, em três linhas do rascunho dele: *"restringir à notas específicas da seleção do
 * usuário"*. Ele aparece na Nota, na Melodia e no Intervalo harmônico — é parâmetro das três, e
 * por isso a conta mora aqui e não em cada item.
 *
 * A restrição entra **depois** do material: escolher notas não abre o que a tonalidade fechou. Se o
 * cruzamento ficar vazio, vale o material — melhor sortear dentro da tonalidade do que não ter
 * pergunta; quem recusa configuração impossível é o `problema()` do item, que sabe de quantas notas
 * precisa.
 *
 * `escolhidas` são classes de altura como texto (o que um `multi` guarda), e vazio quer dizer "sem
 * restrição" — o padrão.
 */
export function pcsEscolhidas(ctx: Ctx, escolhidas: readonly string[] | undefined): number[] {
  const doMaterial = pcsPermitidas(ctx);
  if (!escolhidas?.length) return doMaterial;
  const pedidas = new Set(escolhidas.map(Number).filter(n => Number.isFinite(n)).map(n => mod(n, 12)));
  const cruzado = doMaterial.filter(pc => pedidas.has(pc));
  return cruzado.length ? cruzado : doMaterial;
}

/**
 * **Os graus que a pessoa pode escolher**, e os ids deles — o desenho que o Paulo pediu em 13/11.
 *
 * Ele: *"ao inves de definir quais notas vao tocar pelo nome 'só essas notas', seria melhor definir
 * pelo grau 'so esses graus'. E que isso tenha relação direta com o material cromático ou só a
 * tonalidade — quando tu limita so pra tonalidade, mudam as opcoes selecionadas. se é dó maior, por
 * exemplo, sai b3 e tal."*
 *
 * ## Por que grau resolve três coisas de uma vez
 *
 * Escolher **notas pelo nome** obrigava a saber, de cabeça, quais notas a tonalidade tem: para
 * praticar os sete graus de Ré maior era preciso marcar Ré, Mi, Fá♯… e ainda ligar "incluir teclas
 * pretas", senão o Fá♯ não saía. Ele relatou os dois incômodos, e os dois morrem aqui:
 *
 * 1. **a lista segue o material.** Com "só a tonalidade", os graus oferecidos são os da tonalidade —
 *    em dó maior some o ♭3; em dó menor, aparece. A seleção não precisa ser refeita por tonalidade;
 * 2. **"incluir teclas pretas" deixa de existir.** Tecla preta é grau alterado, e quem escolhe graus
 *    já disse se os quer. Dois controles para a mesma coisa era o que o deixava avulso;
 * 3. **o grau é o que o exercício de ouvido mede.** Pedir "Fá♯" é pedir uma letra; pedir "o grau 3"
 *    é pedir a relação — e é a relação que a pessoa treina.
 */
export const GRAUS_DO_MATERIAL = (ctx: Ctx): { id: string; label: string }[] =>
  pcsPermitidas(ctx)
    .slice()
    .sort((a, b) => mod(a - (ctx.params.key?.tonic ?? 0), 12) - mod(b - (ctx.params.key?.tonic ?? 0), 12))
    .map(pc => ({ id: String(mod(pc - (ctx.params.key?.tonic ?? 0), 12)), label: grauDoPc(ctx, pc) }));

/**
 * As classes de altura permitidas, cruzadas com os **graus** que a pessoa escolheu.
 *
 * Os ids são distâncias em semitons a partir da tônica (`'0'` é a tônica, `'3'` é o ♭3), e não
 * classes de altura: é isso que faz a seleção **sobreviver à troca de tonalidade**. Marcar 1-3-5 em
 * dó maior e passar para sol maior continua sendo 1-3-5, agora em sol — se os ids fossem notas,
 * virava outra coisa.
 */
export function pcsDosGraus(ctx: Ctx, graus: readonly string[] | undefined): number[] {
  const doMaterial = pcsPermitidas(ctx);
  if (!graus?.length) return doMaterial;
  const tonica = ctx.params.key?.tonic ?? 0;
  const pedidos = new Set(graus.map(Number).filter(Number.isFinite).map(g => mod(tonica + g, 12)));
  const cruzado = doMaterial.filter(pc => pedidos.has(pc));
  return cruzado.length ? cruzado : doMaterial;
}

/**
 * As **quintas** da tonalidade em vigor (−7..7), ou `null` com tonalidade livre.
 *
 * É o número que a pauta precisa para desenhar a armadura e que `applyKey` precisa para grafar a
 * nota. Sem isto, `nota-na-pauta` desenhava sempre a armadura de dó mesmo praticando em Sol maior —
 * e aí todo Fá♯ precisava de um sustenido escrito à mão, o que o Paulo relatou em 12/11 como "muito
 * trabalho de ligar o sustenido".
 */
export function quintasDaTonalidade(ctx: Ctx): number | null {
  const k = ctx.params.key;
  if (!k) return null;
  // A relativa menor tem a MESMA armadura da maior três semitons acima (lá menor = dó maior).
  const pcMaior = mod(k.mode === 'menor' ? k.tonic + 3 : k.tonic, 12);
  return QUINTAS_POR_PC[pcMaior];
}

/**
 * Quintas que dão cada classe de altura como tônica maior, **na grafia usual**: dó♯ maior (7
 * sustenidos) não; ré♭ maior (5 bemóis) sim — é como a música escreve, e é a lista de doze que o
 * seletor de tonalidade oferece.
 *
 * Saiu de dentro de `quintasDaTonalidade` em 26/11 para `tonicaGrafada` poder usá-la. Uma tabela
 * só: duas divergiriam no primeiro ajuste.
 */
const QUINTAS_POR_PC: Record<number, number> = { 0: 0, 1: -5, 2: 2, 3: -3, 4: 4, 5: -1, 6: 6, 7: 1, 8: -4, 9: 3, 10: -2, 11: 5 };

/**
 * **A tônica de uma tonalidade, grafada como a armadura dela manda.**
 *
 * Existe por um defeito que ele viu duas vezes e eu medi em 26/11: com **tonalidade livre**, a
 * tônica sorteada era grafada por `notaGrafada`, que escolhe sustenido sempre. Cair na classe 3, 8
 * ou 10 produzia **Ré♯, Sol♯ e Lá♯ maior** — tonalidades que o seletor nem oferece (ele oferece
 * Mi♭, Lá♭ e Si♭) e cujo campo harmônico tem graus ilegíveis:
 *
 * | tonalidade | graus que saem |
 * |---|---|
 * | Ré♯ maior | `F♯♯m7`, `C♯♯m7(♭5)` |
 * | Sol♯ maior | `F♯♯m7(♭5)` |
 * | Lá♯ maior | `C♯♯m7`, `F♯♯m7`, `G♯♯m7(♭5)` |
 *
 * São 3 das 24 combinações de classe × modo — e o que ele leu na tela foi *"a fundamental de
 * C♯♯m7♭5"*. Nas menores não há problema: ré♯, sol♯ e lá♯ menor são tonalidades de verdade.
 *
 * ⚠️ Isto grafa **a tônica**, não uma nota qualquer: quem grafa nota solta é `notaGrafada`, e ali
 * sustenido por padrão está certo — não há armadura para consultar.
 */
export function tonicaGrafada(pc: number, mode: ModoDoCampo, oct = 4): Note {
  const pcMaior = mod(mode === 'maior' ? pc : pc + 3, 12);
  const maior = majorTonic(QUINTAS_POR_PC[pcMaior]);
  const t = mode === 'maior' ? maior : transpose(maior, { num: 6, semis: 9 });
  return { ...t, oct };
}

/**
 * A nota de um passo diatônico **grafada pela tonalidade**: em Sol maior, o passo do fá é Fá♯.
 *
 * Sem isto o filtro de material era por CLASSE DE ALTURA, e grafia errada passava: em Sol maior a
 * classe 4 é permitida (é o Mi), e `Fá♭` tem classe 4 — então o exercício pedia "Fá♭" numa
 * tonalidade que não tem Fá♭ nenhum. Bug que o Paulo achou em 12/11.
 */
export function notaDaTonalidade(ctx: Ctx, passo: number): Note {
  const f = quintasDaTonalidade(ctx);
  return f === null ? fromStep(passo, 0) : applyKey(passo, f);
}

/**
 * Os passos diatônicos que a pauta deve usar: os que **caem dentro da região**, sem passar do que a
 * clave alcança.
 *
 * Substituiu o parâmetro "extensão" (pauta / com linhas suplementares) em 12/11, a pedido do Paulo:
 * dois degraus grossos para a mesma coisa que a região já diz com precisão, e um controle a mais num
 * painel que ele achou cheio demais. O limite externo continua sendo a clave — seis linhas
 * suplementares para cada lado é o que ainda se lê.
 */
export function passosDaRegiao(clef: Clef, ctx: Ctx): [number, number] {
  const b = clefBottom(clef);
  const [minimo, maximo] = [b - 6, b + 14];
  const { lo, hi } = ctx.params.range;
  let baixo = maximo, alto = minimo;
  for (let st = minimo; st <= maximo; st++) {
    const m = midi(fromStep(st, 0));
    if (m >= lo && m <= hi) { baixo = Math.min(baixo, st); alto = Math.max(alto, st); }
  }
  // Região que não cruza a clave nenhuma: vale o que a clave alcança, para haver pergunta.
  return baixo > alto ? [minimo, maximo] : [baixo, alto];
}

/**
 * **A faixa que uma clave lê sem incomodar**, em MIDI.
 *
 * O Paulo diagnosticou o problema sozinho em 13/11: *"entendi por que nao aparecia a nota certa —
 * por que as notas sorteadas estavam graves demais pra clave de sol. evite que isso aconteça. ponha
 * um limite de acordo com a clave."*
 *
 * Medido: a clave de sol tem a linha de baixo no Mi4 (64) e a de cima no Fá5 (77); com duas linhas
 * suplementares para cada lado, lê de 57 a 84. A região padrão vai de 48 a 72, então sorteava notas
 * de 48 a 56 — três a cinco linhas suplementares abaixo, que é leitura de especialista, não de
 * exercício.
 *
 * Duas suplementares é o limite escolhido: é o que se lê sem contar linhas. Quem quiser mais abre a
 * região, e aí a conta respeita a escolha — este limite **aperta**, nunca alarga.
 */
export function faixaDaClave(clef: Clef): { lo: number; hi: number } {
  const b = clefBottom(clef);
  return { lo: midi(fromStep(b - 4, 0)), hi: midi(fromStep(b + 12, 0)) };
}

/**
 * **Botões por grau** (linha aberta do `OR-ouvido-relativo.md`, §8; pedida pelo Paulo em 12/11:
 * *"e deixa os graus também"*).
 *
 * O grau de uma classe de altura em relação à tônica em vigor — `1`, `♭3`, `5`… Com tonalidade
 * livre não há grau nenhum, e aí a lista cai nos doze semitons contados da própria nota: é o que
 * sobra de verdade quando não há centro.
 */
const GRAUS_POR_SEMI = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'];

export const grauDoPc = (ctx: Ctx, pc: number): string =>
  GRAUS_POR_SEMI[mod(pc - (ctx.params.key?.tonic ?? 0), 12)];

/**
 * Os graus que podem ser resposta, em ordem.
 *
 * `pcs` é **a lista exata do que pode soar**, e passá-la não é opcional por capricho: o item filtra
 * mais que o material (o `ouvido-tecla` tira as teclas pretas, por exemplo), e oferecer um grau que
 * nunca pode ser a resposta é ruído — mede-se escolher entre o que existe, não descartar fantasmas.
 * Sem a lista, vale o material.
 */
export const grausDaTonalidade = (ctx: Ctx, pcs?: number[]): { id: string; label: string }[] =>
  (pcs ?? pcsPermitidas(ctx))
    .map(pc => grauDoPc(ctx, pc))
    .sort((a, b) => GRAUS_POR_SEMI.indexOf(a) - GRAUS_POR_SEMI.indexOf(b))
    .map(g => ({ id: g, label: g }));

/** Uma classe de altura que o material permite. */
export function pcPermitido(ctx: Ctx): number {
  return pick(pcsPermitidas(ctx));
}

/** A classe de altura é permitida pelo material em vigor? */
export function pcPermitida(ctx: Ctx, p: number): boolean {
  return pcsPermitidas(ctx).includes(mod(p, 12));
}

/**
 * A região em MIDI, interseccionada com o que o item pede.
 *
 * O item continua podendo ter a sua própria faixa — um exercício de leitura em clave de fá não
 * deve pular para a região aguda só porque a pessoa configurou assim. O que a região global faz é
 * **apertar**, nunca alargar.
 */
export function regiao(ctx: Ctx, doItem?: { lo: number; hi: number }): { lo: number; hi: number } {
  const g = ctx.params.range;
  if (!doItem) return g;
  const lo = Math.max(g.lo, doItem.lo);
  const hi = Math.min(g.hi, doItem.hi);
  // só quando a intersecção é vazia a do item vence — melhor sair da região do que não ter o que
  // tocar. Intersecção estreita é legítima: uma nota cabe em qualquer faixa.
  return hi > lo ? { lo, hi } : doItem;
}

/** Uma altura MIDI dentro da região, respeitando o material. */
export function alturaNaRegiao(ctx: Ctx, doItem?: { lo: number; hi: number }): number {
  const { lo, hi } = regiao(ctx, doItem);
  const permitidas = pcsPermitidas(ctx);
  const candidatas: number[] = [];
  for (let m = lo; m <= hi; m++) if (permitidas.includes(mod(m, 12))) candidatas.push(m);
  return candidatas.length ? pick(candidatas) : randInt(lo, hi);
}

/**
 * A tônica a usar: a da tonalidade quando há uma, sorteada na região quando não há.
 *
 * Devolve uma **altura MIDI**, já dentro da região — é o que os exercícios de ouvido precisam para
 * parar de usar faixas escritas no código.
 */
export function tonicaNaRegiao(ctx: Ctx, doItem?: { lo: number; hi: number }): number {
  const { lo, hi } = regiao(ctx, doItem);
  const k = ctx.params.key;
  if (!k) return randInt(lo, hi);
  // a oitava mais grave da tonalidade que cabe na região
  const base = lo + mod(k.tonic - lo, 12);
  const oitavas: number[] = [];
  for (let m = base; m <= hi; m += 12) oitavas.push(m);
  return oitavas.length ? pick(oitavas) : base;
}

/**
 * Uma nota escrita na pauta que cabe na região e no material.
 *
 * Os itens de pauta geram por **degrau da pauta**, não por MIDI — e por isso eram os que mais
 * facilmente ignoravam a região. Esta função faz a ponte: enumera os degraus da faixa pedida,
 * descarta os que caem fora da região em MIDI ou fora do material, e sorteia entre os que sobram.
 */
export function notaNaPauta(ctx: Ctx, passos: [number, number], acidente: () => number): Note {
  const { lo, hi } = ctx.params.range;
  const permitidas = pcsPermitidas(ctx);
  const quintas = quintasDaTonalidade(ctx);
  const candidatas: Note[] = [];
  for (let st = passos[0]; st <= passos[1]; st++) {
    /**
     * **Com tonalidade fixa, a armadura dita a grafia**: um candidato por passo, e nunca um que a
     * tonalidade não escreve. Era este o bug de 12/11 — varrendo `[0, 1, -1]` em toda tonalidade, o
     * `Fá♭` entrava em Sol maior porque o FILTRO era por classe de altura (a classe 4 é permitida,
     * é o Mi) e a grafia não era conferida. Na pauta grafia é identidade.
     *
     * Sem tonalidade (livre), aí sim os três acidentes são candidatos legítimos.
     */
    const grafias = quintas === null ? [0, 1, -1].map(acc => fromStep(st, acc)) : [applyKey(st, quintas)];
    for (const n of grafias) {
      const m = midi(n);
      if (m >= lo && m <= hi && permitidas.includes(mod(m, 12))) candidatas.push(n);
    }
  }
  if (!candidatas.length) return fromStep(randInt(passos[0], passos[1]), acidente());
  // o acidente pedido pelo item ainda manda: sem acidentes ligados, só naturais
  const acc = acidente();
  const doAcidente = candidatas.filter(n => n.acc === acc);
  return pick(doAcidente.length ? doAcidente : candidatas.filter(n => n.acc === 0).length ? candidatas.filter(n => n.acc === 0) : candidatas);
}

/**
 * A altura de uma **classe de altura dada**, dentro da região.
 *
 * Existe porque encaixar a classe na oitava de uma altura sorteada (`m - m%12 + pc`) **pode cair
 * abaixo do piso** — foi um bug real, pego pelo teste de piso da F2-3. Aqui a oitava é escolhida
 * entre as que cabem.
 */
export function alturaDoPc(ctx: Ctx, pcAlvo: number, doItem?: { lo: number; hi: number }): number {
  const { lo, hi } = regiao(ctx, doItem);
  const candidatas: number[] = [];
  for (let m = lo; m <= hi; m++) if (mod(m, 12) === mod(pcAlvo, 12)) candidatas.push(m);
  if (candidatas.length) return pick(candidatas);
  // nenhuma oitava cabe: a mais próxima do piso, sem descer abaixo dele
  return lo + mod(pcAlvo - lo, 12);
}

/** A clave de leitura: a do item quando ele escolheu, a global quando não. */
export function clave(ctx: Ctx, doItem?: Clef): Clef {
  return doItem ?? ctx.params.clef;
}

/**
 * Uma nota escrita, grafada segundo a tonalidade quando há uma.
 *
 * É o que impede Lá♯ de aparecer em Fá maior — o motor de teoria já sabe grafar, mas só se alguém
 * disser qual é a tonalidade.
 *
 * **Esta é a única função que grafa uma altura, e passou a ser em 13/11.** Havia cinco cópias da
 * mesma tabela de doze pares letra/acidente: esta, e uma `notaEscrita` local em cada um de
 * `ouvido-tecla`, `ouvido-acorde`, `ouvido-intervalo` e `melodia-de-ouvido` — as quatro com
 * sustenido fixo, nenhuma olhando a tonalidade. Era a razão de o mesmo defeito reaparecer em telas
 * diferentes: o Paulo relatou *"na tonalidade diz Ré♭, no exercício diz Dó♯"* no `ouvido-tecla`, e
 * consertar lá não consertava as outras três.
 *
 * Duas coisas mudaram aqui ao recolher as cópias:
 *
 * 1. a tabela saiu, e quem grafa é `fromMidi`, do motor — o CLAUDE.md diz *"`src/theory/core.ts` já
 *    resolve isso. Não contorne"*, e seis implementações eram seis contornos;
 * 2. **o critério passou a ser a armadura, não a tônica.** Era `[1, 3, 5, 8, 10].includes(tonic)`,
 *    que ignora o modo: em Ré menor dava sustenido, e Ré menor tem **Si♭**. Isso errava exatamente
 *    o caso do CLAUDE.md, de cabeça para baixo.
 *
 * Medido, muda em **seis tonalidades, todas menores**, e em nenhuma maior: dó, ré e sol menores
 * passam a grafar com bemol (as armaduras têm 3, 1 e 2 bemóis), e dó♯, ré♯ e sol♯ menores passam a
 * grafar com sustenido (4, 6 e 5 sustenidos). As duas metades são conserto: a tônica sozinha não
 * diz de que lado a armadura cai, porque não sabe o modo.
 */
export function notaGrafada(ctx: Ctx, m: number): Note {
  const f = quintasDaTonalidade(ctx);
  return fromMidi(m, f !== null && f < 0 ? 'flat' : 'sharp');
}

/**
 * O **nome** de uma classe de altura na tonalidade em vigor: em Ré♭ maior, a classe 1 é Ré♭, não
 * Dó♯. A irmã de `notaGrafada` para o texto — uma pergunta escrita, um gabarito revelado.
 *
 * `bemolSeLivre` só decide **quando não há tonalidade**, e existe para preservar uma intenção que
 * estava no código de `nota-no-instrumento`: ali a grafia é sorteada a cada rodada (*"uma grafia só,
 * sorteada, e a mesma no enunciado e no gabarito"*), para não treinar sempre o mesmo lado da
 * enarmonia. O que estava errado não era o sorteio e sim sortear **também quando há tonalidade** —
 * em Sol maior o exercício pedia "Ré♭" em metade das rodadas, que é a queixa do Paulo de 13/11 vista
 * de outro ângulo.
 *
 * É a regra de ouro deste arquivo aplicada à grafia: respeitar o parâmetro quando ele está definido,
 * sortear quando não está.
 */
export function nomeNaTonalidade(ctx: Ctx, p: number, bemolSeLivre = false): string {
  const f = quintasDaTonalidade(ctx);
  return pcNameUm(p, ctx.naming, f === null ? bemolSeLivre : f < 0);
}

/** O que gravar no snapshot de uma tentativa ou atividade. */
export function snapshotMusical(p: GlobalParams) {
  return {
    instrument: p.instrument, tuning: p.tuning, key: p.key, range: p.range,
    material: p.material, clef: p.clef,
  };
}
