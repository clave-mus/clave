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

/** Toca uma altura MIDI. `t` é o tempo absoluto do contexto (use now() + atraso). */
export function tone(m: number, t: number, dur = 1, voice: Voice = 'piano', vel = 0.7) {
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
  } else if (voice === 'violao') {
    add('sawtooth', 1, 0.5); add('triangle', 2, 0.2);
    f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.5);
    env(out, t, 0.28 * vel, 0.004, Math.max(0.5, dur));
    stop = t + Math.max(0.5, dur) + 0.05;
  } else if (voice === 'baixo') {
    // Soava como um "tuc": três defeitos somados. (1) Uma sub-oitava com ganho 0,5 — numa corda Mi de
    // 41 Hz isso põe 20 Hz, que ninguém ouve e que só come headroom. (2) Filtro FIXO em 700 Hz, que mata
    // os harmônicos e deixa abafado. (3) Decay mínimo de 0,35 s, curto demais para uma corda.
    //
    // Agora: a fundamental manda, com harmônicos ímpares para o caráter de corda; o filtro abre no
    // ataque e fecha, que é o que dá o "pluck"; e o decay acompanha a duração pedida.
    add('triangle', 1, 0.9); add('sine', 2, 0.30); add('triangle', 3, 0.12); add('sine', 4, 0.05);
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(420, t + Math.min(0.5, Math.max(0.25, dur * 0.5)));
    f.Q.value = 1.2;
    env(out, t, 0.42 * vel, 0.006, Math.max(1.1, dur * 1.5));
    stop = t + Math.max(1.1, dur * 1.5) + 0.05;
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

/** Drone contínuo (nota pedal) para estudar com contexto harmônico. Devolve a função que para. */
export function drone(midis: number[], vel = 0.7): () => void {
  const c = audio();
  const out = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 900;
  f.connect(out).connect(master);
  const t = c.currentTime;
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.16 * vel, t + 1.2);
  const oscs = midis.flatMap(m => [-6, 6].map(det => {
    const o = c.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = det;
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
  constructor(bpm: number, stepsPerBeat: number, onStep: (index: number, time: number) => void) {
    this.bpm = bpm;
    this.stepsPerBeat = stepsPerBeat;
    this.onStep = onStep;
  }
  get stepDur() {
    return 60 / this.bpm / this.stepsPerBeat;
  }
  start() {
    this.stop();
    this.index = 0;
    this.next = now() + 0.08;
    this.timer = window.setInterval(() => this.tick(), 25);
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
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }
  get running() {
    return this.timer !== undefined;
  }
}

/** Executa algo exatamente quando o som toca (para animar cursores em sincronia). */
export function atTime(t: number, fn: () => void) {
  const ms = Math.max(0, (t - now()) * 1000);
  return window.setTimeout(fn, ms);
}
