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
 * Corda pulsada (Karplus-Strong): ruído curto num atraso realimentado do tamanho do período.
 *
 * É o que dá timbre de **corda** sem amostra nenhuma — o ruído do ataque vira o "dedo", e o filtro na
 * realimentação come os agudos a cada volta, que é o que uma corda real faz. Substitui a síntese por
 * osciladores em violão e baixo, que soava "tuc": oscilador dá forma de onda fixa, e corda tem espectro
 * que muda enquanto soa.
 */
function cordaPulsada(m: number, t: number, dur: number, vel: number, brilho: number, decaimento: number) {
  const c = audio();
  const periodo = 1 / hz(m);
  const amostras = Math.max(2, Math.round(c.sampleRate * periodo));

  // o ataque: um estouro curto de ruído, do tamanho de uma volta da corda
  const exc = c.createBuffer(1, amostras, c.sampleRate);
  const d = exc.getChannelData(0);
  for (let i = 0; i < amostras; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / amostras);
  const fonte = c.createBufferSource();
  fonte.buffer = exc;

  // o laço: atraso de um período, com perda e passa-baixa — é ele que faz a corda decair
  const atraso = c.createDelay(0.2);
  atraso.delayTime.value = periodo;
  const perda = c.createGain();
  perda.gain.value = decaimento;
  const abafa = c.createBiquadFilter();
  abafa.type = 'lowpass';
  abafa.frequency.value = brilho;

  const out = c.createGain();
  out.gain.value = vel;
  fonte.connect(atraso);
  atraso.connect(abafa).connect(perda).connect(atraso);  // realimentação
  atraso.connect(out).connect(master);

  const fim = t + Math.max(dur, 0.4) + 0.6;
  out.gain.setValueAtTime(vel, t);
  out.gain.setTargetAtTime(0.0001, t + Math.max(dur, 0.35), 0.18);
  fonte.start(t);
  fonte.stop(t + periodo * 2);
  registrar(out, [], fim);
}

/** Toca uma altura MIDI. `t` é o tempo absoluto do contexto (use now() + atraso). */
export function tone(m: number, t: number, dur = 1, voice: Voice = 'piano', vel = 0.7) {
  // violão e baixo são cordas: a síntese por osciladores não dá o timbre delas
  if (voice === 'baixo') return cordaPulsada(m, t, dur, 0.9 * vel, 1800, 0.993);
  if (voice === 'violao') return cordaPulsada(m, t, dur, 0.55 * vel, 3200, 0.986);
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
const soando = new Set<{ out: GainNode; oscs: OscillatorNode[] }>();

function registrar(out: GainNode, oscs: OscillatorNode[], stop: number) {
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
export type Carater = 'fundo' | 'destaque';
const CARATER: Record<Carater, { tipo: OscillatorType; corte: number; ataque: number; ganho: number }> = {
  fundo: { tipo: 'sawtooth', corte: 900, ataque: 1.2, ganho: 0.16 },
  destaque: { tipo: 'triangle', corte: 2600, ataque: 0.25, ganho: 0.22 },
};

/**
 * Drone contínuo (nota pedal) para estudar com contexto harmônico. Devolve a função que para.
 *
 * ⚠️ `carater` entra **no fim e opcional** de propósito: os chamadores antigos (`Audiar`,
 * `Ambiente`) não mudam uma linha nem um som.
 */
export function drone(midis: number[], vel = 0.7, carater: Carater = 'fundo'): () => void {
  const { tipo, corte, ataque, ganho } = CARATER[carater];
  const c = audio();
  const out = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = corte;
  f.connect(out).connect(master);
  const t = c.currentTime;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(ganho * vel, t + ataque);
  const oscs = midis.flatMap(m => [-6, 6].map(det => {
    const o = c.createOscillator();
    o.type = tipo; o.frequency.value = hz(m); o.detune.value = det;
    o.connect(f); o.start(t);
    return o;
  }));
  return () => {
    const s = c.currentTime;
    out.gain.cancelScheduledValues(s);
    out.gain.setValueAtTime(out.gain.value, s);
    out.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
    oscs.forEach(o => o.stop(s + 0.7));
  };
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
