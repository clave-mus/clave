// Motor de som do Clave: tudo sintetizado com Web Audio, sem arquivos de áudio.
// O navegador só libera som depois de um toque do usuário, então o contexto é criado sob demanda.

export type Voice = 'piano' | 'violao' | 'pad' | 'baixo' | 'orgao';
export type Drum = 'bumbo' | 'caixa' | 'chimbal' | 'aro' | 'clique' | 'clique-forte';

let ctx: BaseAudioContext | null = null;
let master: GainNode;
let noise: AudioBuffer;

/** Ganho final de tudo o que o motor toca; o volume das perguntas (vel) vem antes, em cada nota. */
export const MASTER_GAIN = 0.8;

function build(c: BaseAudioContext) {
  ctx = c;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master = c.createGain();
  master.gain.value = MASTER_GAIN;
  // limitador no fim: com o volume dos exercícios mais alto, acordes de várias notas não estouram
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  master.connect(comp).connect(limiter).connect(c.destination);
  noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

/** Troca o contexto de áudio, para renderizar fora do tempo real (testes e medições de volume). */
export function useAudioContext(c: BaseAudioContext) {
  build(c);
}

export function audio(): BaseAudioContext {
  if (!ctx) build(new AudioContext());
  if (ctx!.state === 'suspended' && ctx instanceof AudioContext) void ctx.resume();
  return ctx!;
}
export const now = () => audio().currentTime;
export const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/**
 * Atraso de fase do passa-baixa de um polo do laço, **na frequência pedida**, em amostras.
 *
 * Precisa ser na frequência pedida, não no DC: compensando pelo valor de DC, o violão saía 124
 * cents alto no Mi5 e 230 no Sol♯5. Com o valor exato, zero cent em toda a extensão útil.
 */
function faseDoFiltro(k: number, f: number, sr: number): number {
  const w = (2 * Math.PI * f) / sr;
  const a = 1 - k;
  return Math.atan2(a * Math.sin(w), 1 - a * Math.cos(w)) / w;
}

/** Magnitude do passa-baixa de um polo do laço na frequência pedida. */
function magDoFiltro(k: number, f: number, sr: number): number {
  const w = (2 * Math.PI * f) / sr;
  const a = 1 - k;
  return k / Math.hypot(1 - a * Math.cos(w), a * Math.sin(w));
}

/**
 * O corte do filtro do laço acompanha a nota, no mínimo este múltiplo da fundamental.
 *
 * Sem isto a corda **morria nas agudas**. O ganho do laço é por volta, e a 1000 Hz são mil voltas
 * por segundo: com o corte fixo em 3200, o filtro come 3,2% por volta e `0,968¹⁰⁰⁰` é zero — a nota
 * sumia em 0,1 s. Medido: de MIDI 80 para cima não havia altura nenhuma para medir, e eu quase
 * registrei isso como "desafina" quando o defeito era não soar.
 */
const CORTE_MINIMO_EM_FUNDAMENTAIS = 10;

/** Timbre de cada corda: corte base do laço, tempo de queda de 60 dB, e volume relativo. */
const CORDAS = {
  violao: { corte: 3200, t60: 1.8, vel: 0.55 },
  baixo: { corte: 1800, t60: 2.2, vel: 0.9 },
} as const;

/**
 * Corda pulsada (Karplus-Strong), **calculada em JS e tocada como buffer**.
 *
 * ## O bug que isto conserta (09/11/2026)
 *
 * O Paulo: *"a nota tem o mesmo bug antigo — soa bizarra a primeira vez, depois não soa mais. Esse
 * erro é inato aos sons de cordas."* Ele estava certo na localização e na causa.
 *
 * A versão anterior montava o laço com **nós vivos do WebAudio** — um `DelayNode` realimentado por
 * um `BiquadFilter` e um ganho de perda. Medi o grafo num `OfflineAudioContext`:
 *
 * - **ele divergia.** O pico de amplitude chegava a 2,6 × 10²³ (deveria ser ≤ 1), e não era a
 *   ressonância do filtro: com Q de Butterworth ainda ia a 6 × 10¹³;
 * - **e produzia NaN.** No Lá4, 22.916 amostras não-finitas num render de 3 s;
 * - a altura saía errada em **toda** nota: 440 Hz pedidos soavam 191.
 *
 * O NaN é o que explica a segunda metade do sintoma. `master` é compartilhado e permanente, e NaN
 * que passa por um nó de ganho o envenena — **tudo que tocar depois fica em silêncio**. Daí "soa
 * bizarra uma vez, depois não soa mais".
 *
 * (Um `DelayNode` dentro de um ciclo também não consegue atrasar menos de um bloco de render, 128
 * amostras, o que já impediria qualquer altura acima de ~344 Hz de sair certa.)
 *
 * ## Por que calcular em JS resolve
 *
 * O laço vira uma conta de uma linha por amostra, com ganho `decaimento × |H|` sempre menor que 1 —
 * **não pode divergir**. O resultado é um `AudioBuffer`: se algum dia produzir lixo, o lixo morre
 * com aquela nota, porque não há nó permanente no caminho. E um `BufferSource` **para**, o que
 * conserta de passagem o segundo defeito: `registrar(out, [], …)` recebia lista vazia, então
 * `pararTudo()` não tinha o que parar e a corda anterior seguia soando por cima da seguinte.
 *
 * A parte fracionária do atraso é por interpolação linear. Testei allpass de Jaffe-Smith também, e
 * **linear mediu melhor** (0 cents contra 16 no Mi1).
 */
/**
 * As amostras de uma corda pulsada. **Pura**: nenhum nó de áudio, nada do navegador.
 *
 * Separada de `cordaPulsada` de propósito — é o que torna a conta testável sem AudioContext, e
 * testá-la é o ponto: foi exatamente a falta de teste que deixou o bug de divergência passar.
 * `audio/corda.test.ts` chama esta função, não uma cópia dela.
 */
export function amostrasDeCorda(
  m: number, sr: number, corteBase: number, t60: number, total: number,
  /** Ruído do ataque. Injetável só para o teste poder ser determinístico. */
  rnd: () => number = () => Math.random() * 2 - 1,
): Float32Array {
  const f = hz(m);
  const corte = Math.max(corteBase, f * CORTE_MINIMO_EM_FUNDAMENTAIS);
  const k = 1 - Math.exp((-2 * Math.PI * corte) / sr);
  /**
   * A perda por volta sai do **tempo** de queda, não de um número fixo.
   *
   * Com perda fixa, o decaimento dependia da altura: a mesma perda por volta some muito mais rápido
   * numa nota aguda, que dá mais voltas por segundo. Aqui o alvo é cair 60 dB em `t60` segundos em
   * qualquer altura, e desconta-se o que o filtro do laço já come. O teto de 0,9995 é a trava de
   * estabilidade — ganho de laço igual ou acima de 1 é o que fazia a versão anterior divergir.
   */
  const alvo = Math.exp(-Math.log(1000) / (t60 * f));
  const decaimento = Math.min(0.9995, alvo / magDoFiltro(k, f, sr));
  // comprimento do laço em amostras, descontada a fase do filtro: é isto que afina a corda
  const L = Math.max(3, sr / f - faseDoFiltro(k, f, sr));
  const N = Math.floor(L);
  const frac = L - N;
  const x = new Float32Array(total);
  // o ataque: um estouro curto de ruído, do tamanho de uma volta da corda — é o "dedo"
  const exc = Math.max(2, Math.round(sr / f));
  for (let i = 0; i < exc; i++) x[i] = rnd() * (1 - i / exc);
  // o laço: passa-baixa de um polo come os agudos a cada volta, que é o que uma corda real faz
  let estado = 0;
  for (let i = N + 1; i < total; i++) {
    const lido = (1 - frac) * x[i - N] + frac * x[i - N - 1];
    estado += k * (lido - estado);
    x[i] = decaimento * estado;
  }
  return x;
}

function cordaPulsada(m: number, t: number, dur: number, vel: number, corda: typeof CORDAS[keyof typeof CORDAS]) {
  const c = audio();
  const sr = c.sampleRate;
  const total = Math.ceil(sr * (Math.max(dur, 0.35) + 0.5));
  const buf = c.createBuffer(1, total, sr);
  buf.getChannelData(0).set(amostrasDeCorda(m, sr, corda.corte, corda.t60, total));

  const fonte = c.createBufferSource();
  fonte.buffer = buf;
  const out = c.createGain();
  out.gain.value = vel;
  fonte.connect(out).connect(master);
  out.gain.setValueAtTime(vel, t);
  out.gain.setTargetAtTime(0.0001, t + Math.max(dur, 0.35), 0.18);
  fonte.start(t);
  registrar(out, [fonte], t + total / sr);
}

/** Toca uma altura MIDI. `t` é o tempo absoluto do contexto (use now() + atraso). */
export function tone(m: number, t: number, dur = 1, voice: Voice = 'piano', vel = 0.7) {
  // violão e baixo são cordas: a síntese por osciladores não dá o timbre delas
  if (voice === 'baixo') return cordaPulsada(m, t, dur, CORDAS.baixo.vel * vel, CORDAS.baixo);
  if (voice === 'violao') return cordaPulsada(m, t, dur, CORDAS.violao.vel * vel, CORDAS.violao);
  const c = audio();
  const out = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.connect(out).connect(master);
  const oscs: OscillatorNode[] = [];
  const add = (type: OscillatorType, mult: number, gain: number, detune = 0) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = hz(m) * mult;
    o.detune.value = detune;
    g.gain.value = gain;
    o.connect(g).connect(f);
    oscs.push(o);
  };
  let stop = t + dur + 0.1;
  if (voice === 'piano') {
    add('triangle', 1, 0.7); add('sine', 2, 0.25); add('sine', 3, 0.06);
    f.frequency.setValueAtTime(4200, t);
    f.frequency.exponentialRampToValueAtTime(900, t + Math.max(0.4, dur));
    env(out, t, 0.32 * vel, 0.006, Math.max(0.6, dur * 1.4));
    stop = t + Math.max(0.6, dur * 1.4) + 0.05;
  } else if (voice === 'pad') {
    add('sawtooth', 1, 0.3, -7); add('sawtooth', 1, 0.3, 7); add('sine', 0.5, 0.3);
    f.frequency.value = 1100;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.13 * vel, t + 0.25);
    out.gain.setValueAtTime(0.13 * vel, t + dur);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    stop = t + dur + 0.55;
  } else {
    add('sine', 1, 0.6); add('sine', 2, 0.3); add('sine', 4, 0.12);
    f.frequency.value = 3000;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.03);
    out.gain.setValueAtTime(0.16 * vel, t + dur);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    stop = t + dur + 0.15;
  }
  oscs.forEach(o => { o.start(t); o.stop(stop); });
  registrar(out, oscs, stop);
}

// ---------------------------------------------------------------------------
// Parar o que está soando
// ---------------------------------------------------------------------------

/**
 * O que ainda pode soar. Sem isto, tocar de novo enquanto o acorde anterior decai **sobrepõe os dois**
 * — e quem está identificando um acorde de ouvido escuta a soma de dois acordes, que é outra coisa.
 */
/** Qualquer fonte que se possa parar: oscilador ou buffer (a corda pulsada é buffer). */
type Paravel = { stop(when: number): void };
const soando = new Set<{ out: GainNode; oscs: Paravel[] }>();

function registrar(out: GainNode, oscs: Paravel[], stop: number) {
  const nó = { out, oscs };
  soando.add(nó);
  // limpa sozinho quando a nota termina, para o conjunto não crescer para sempre
  const atraso = Math.max(0, (stop - now()) * 1000) + 60;
  setTimeout(() => soando.delete(nó), atraso);
}

/**
 * Silencia tudo com um corte curto (25 ms) em vez de instantâneo: cortar o ganho de uma vez produz
 * estalo, que é pior que o som sobreposto.
 */
export function pararTudo() {
  const t = now();
  for (const { out, oscs } of soando) {
    try {
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
      oscs.forEach(o => o.stop(t + 0.03));
    } catch { /* nó já parado: nada a fazer */ }
  }
  soando.clear();
}

/** Toca grupos de notas em sequência; cada grupo soa junto (acorde) ou arpejado. */
export function playGroups(groups: number[][], opts: { gap?: number; dur?: number; voice?: Voice; arp?: number } = {}) {
  const { gap = 0.75, dur = 0.9, voice = 'piano', arp = 0 } = opts;
  const t0 = now() + 0.05;
  groups.forEach((g, i) => g.forEach((m, j) => tone(m, t0 + i * gap + j * arp, dur, voice)));
  return groups.length * gap;
}

export function drum(kind: Drum, t: number, vel = 1) {
  const c = audio();
  const g = c.createGain();
  g.connect(master);
  if (kind === 'bumbo') {
    const o = c.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    env(g, t, 0.9 * vel, 0.003, 0.32);
    o.connect(g); o.start(t); o.stop(t + 0.4);
    return;
  }
  if (kind === 'clique' || kind === 'clique-forte') {
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.value = kind === 'clique-forte' ? 1760 : 1180;
    env(g, t, 0.22 * vel, 0.001, 0.035);
    o.connect(g); o.start(t); o.stop(t + 0.06);
    return;
  }
  const src = c.createBufferSource();
  src.buffer = noise;
  const f = c.createBiquadFilter();
  src.connect(f).connect(g);
  if (kind === 'caixa') {
    f.type = 'highpass'; f.frequency.value = 1400;
    env(g, t, 0.45 * vel, 0.002, 0.16);
    const o = c.createOscillator(); const og = c.createGain();
    o.type = 'triangle'; o.frequency.value = 190;
    env(og, t, 0.3 * vel, 0.002, 0.08);
    o.connect(og).connect(master); o.start(t); o.stop(t + 0.12);
  } else if (kind === 'chimbal') {
    f.type = 'highpass'; f.frequency.value = 7500;
    env(g, t, 0.18 * vel, 0.001, 0.045);
  } else {
    f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 4;
    env(g, t, 0.35 * vel, 0.001, 0.05);
  }
  src.start(t); src.stop(t + 0.3);
}

/**
 * Os dois caracteres do drone.
 *
 * `fundo` é o de sempre — serra escura, feita para ficar embaixo sem incomodar. `destaque` nasceu
 * em 07/11/2026 para "Relações entre melodia e harmonia", onde a melodia precisa ser **ouvida
 * como melodia** por cima do acorde: onda triangular, filtro aberto e ataque mais rápido, para
 * falar na frente em vez de somar à massa.
 */
export type Carater = 'fundo' | 'acorde' | 'destaque';
/**
 * As alavancas de timbre de um drone, e o que cada uma muda no que se ouve:
 *
 * | | |
 * |---|---|
 * | `tipo` | o brilho bruto da onda: `sine` é oco, `triangle` é doce, `sawtooth` é cheio, `square` é nasal |
 * | `corte` | quanto do agudo passa — abaixa para escurecer, levanta para o som cortar por cima |
 * | `det` | desafinação entre as duas vozes, em cents. **É o que faz o som "mexer"** — e, passando de ~4, vira tremor audível |
 * | `harm` | um parcial à oitava, bem baixinho. Dá brilho **sem** batimento, que é o outro jeito de mudar o timbre |
 * | `ataque` | quanto tempo até o volume cheio |
 */
interface PerfilDeDrone { tipo: OscillatorType; corte: number; ataque: number; ganho: number; det: number; harm?: number }
const CARATER: Record<Carater, PerfilDeDrone> = {
  // ⚠️ `fundo` é o drone de sempre (Ambiente, Audiar) e **não muda**: ataque longo e dois
  // osciladores desafinados são o que dá corpo a uma nota pedal que fica minutos no ar.
  fundo: { tipo: 'sawtooth', corte: 900, ataque: 1.2, ganho: 0.16, det: 6 },
  // `acorde` e `destaque` nasceram para "Relações entre melodia e harmonia", onde se aperta e se
  // quer ouvir AGORA — ataque longo ali é espera, não corpo (pedido do Paulo, 09/11).
  acorde: { tipo: 'sawtooth', corte: 1100, ataque: 0.05, ganho: 0.17, det: 4 },
  // A melodia andou nos dois extremos: ±6 cents tremia demais, 0 ficou parado demais. ±2,5 é
  // movimento sem batimento perceptível — a ~3 Hz o ouvido ouve tremor, a ~1 Hz ouve vida.
  // O `harm` entra junto: brilho por parcial, que destaca sem mexer na afinação.
  destaque: { tipo: 'triangle', corte: 2800, ataque: 0.03, ganho: 0.2, det: 2.5, harm: 0.12 },
};

/**
 * Todo drone vivo, para nenhum ficar tocando sozinho.
 *
 * Existe porque aconteceu: um drone ficou soando depois que a tela já tinha trocado. Com a
 * limpeza só no efeito do React, qualquer caminho que não passe por ele (um erro no meio, um
 * remonte estranho do modo de desenvolvimento) deixa som órfão — e não há como calá-lo sem
 * recarregar a página.
 */
const vivos = new Set<() => void>();

/** Cala todo drone vivo. A tela chama ao montar e ao sair, e assim nada atravessa a navegação. */
export function pararDrones() {
  for (const parar of [...vivos]) parar();
  vivos.clear();
}

/**
 * Drone contínuo (nota pedal) para estudar com contexto harmônico. Devolve a função que para.
 *
 * ⚠️ `carater` entra **no fim e opcional** de propósito: os chamadores antigos (`Audiar`,
 * `Ambiente`) não mudam uma linha nem um som.
 */
export function drone(midis: number[], vel = 0.7, carater: Carater = 'fundo'): () => void {
  const { tipo, corte, ataque, ganho, det, harm } = CARATER[carater];
  const c = audio();
  const out = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = corte;
  f.connect(out).connect(master);
  const t = c.currentTime;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(ganho * vel, t + ataque);
  const vozes = det === 0 ? [0] : [-det, det];
  const oscs = midis.flatMap(m => vozes.map(cents => {
    const o = c.createOscillator();
    o.type = tipo; o.frequency.value = hz(m); o.detune.value = cents;
    o.connect(f); o.start(t);
    return o;
  }));
  // O parcial à oitava: brilho sem batimento. Vai por um ganho próprio, bem abaixo do principal.
  if (harm) {
    const g = c.createGain();
    g.gain.value = harm;
    g.connect(f);
    for (const m of midis) {
      const o = c.createOscillator();
      o.type = 'sine'; o.frequency.value = hz(m + 12);
      o.connect(g); o.start(t);
      oscs.push(o);
    }
  }
  let parado = false;
  const parar = () => {
    if (parado) return; // chamar duas vezes (efeito + `pararDrones`) não pode reagendar nada
    parado = true;
    vivos.delete(parar);
    const s = c.currentTime;
    out.gain.cancelScheduledValues(s);
    out.gain.setValueAtTime(out.gain.value, s);
    out.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
    oscs.forEach(o => o.stop(s + 0.7));
  };
  vivos.add(parar);
  return parar;
}

/**
 * Relógio com antecedência: chama `onStep` para cada subdivisão um pouco antes da hora,
 * com o tempo exato em que o som deve sair. É o que mantém metrônomo e backing track no tempo.
 */
export class Clock {
  bpm: number;
  stepsPerBeat: number;
  private timer: number | undefined;
  private next = 0;
  private index = 0;
  private onStep: (index: number, time: number) => void;
  /** Context a que `aoResumir` está ligado, para desligar em `stop()`. */
  private ctx: BaseAudioContext | undefined;
  private aoResumir: (() => void) | undefined;
  constructor(bpm: number, stepsPerBeat: number, onStep: (index: number, time: number) => void) {
    this.bpm = bpm;
    this.stepsPerBeat = stepsPerBeat;
    this.onStep = onStep;
  }
  get stepDur() {
    return 60 / this.bpm / this.stepsPerBeat;
  }
  /**
   * B1: o primeiro toque cria o contexto, mas ele some suspenso até o navegador liberar o som —
   * e enquanto suspenso, `now()` fica **congelado**. Ancorar `next` contra um tempo congelado faz
   * os primeiros passos colarem (todos "devidos" assim que o contexto resumir) e depois travar (o
   * relógio nunca mais encontra um `horizon` maior que `next`). Por isso só se ancora quando o
   * contexto já está `running` de verdade — senão, espera o `statechange`.
   */
  start() {
    this.stop();
    this.index = 0;
    const c = audio();
    const comecar = () => {
      this.next = now() + 0.08;
      this.timer = window.setInterval(() => this.tick(), 25);
    };
    if (c.state === 'running') { comecar(); return; }
    this.ctx = c;
    this.aoResumir = () => { if (c.state === 'running') this.pararEspera(comecar); };
    c.addEventListener('statechange', this.aoResumir);
  }
  private pararEspera(depois?: () => void) {
    if (this.ctx && this.aoResumir) this.ctx.removeEventListener('statechange', this.aoResumir);
    this.ctx = undefined;
    this.aoResumir = undefined;
    depois?.();
  }
  private tick() {
    const horizon = now() + 0.12;
    while (this.next < horizon) {
      this.onStep(this.index, this.next);
      this.index++;
      this.next += this.stepDur;
    }
  }
  stop() {
    this.pararEspera();
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }
  get running() {
    return this.timer !== undefined || !!this.aoResumir;
  }
}

/** Executa algo exatamente quando o som toca (para animar cursores em sincronia). */
export function atTime(t: number, fn: () => void) {
  const ms = Math.max(0, (t - now()) * 1000);
  return window.setTimeout(fn, ms);
}
