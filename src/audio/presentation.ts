// Perfil de apresentação: COMO o conteúdo de uma pergunta soa (C1). A pergunta só diz quais notas
// tocar; timbre, volume, intervalo entre notas, arpejo e andamento são resolvidos aqui, na hora de
// tocar, a partir de camadas (padrão < global < exercício < configuração da pessoa). Um parâmetro de
// som novo entra só neste arquivo e passa a valer para todo exercício com áudio.
import type { SoundContent } from '../catalog/types';
import { drum, now, tone, type Voice } from './engine';

export interface Presentation {
  voice: Voice;
  /** Intensidade das notas (a "velocidade" que o motor recebe). 2 é o padrão dos exercícios: medido
   *  fora do tempo real, uma nota de piano a 0,7 tinha pico de −21 dBFS, baixo demais; a 2,0 chega
   *  a −12 e o acorde de sétima a −1, sem passar do limitador do motor. */
  volume: number;
  /** Segundos entre um grupo de notas e o seguinte. */
  gap: number;
  /** Segundos entre as notas de um mesmo grupo (0 = juntas). */
  arp: number;
  /** Duração de cada nota, em segundos. */
  dur: number;
  /** Como tocar um grupo de várias notas: junto, arpejado ou arpejado e depois junto. */
  chord: 'block' | 'arpeggio' | 'arpeggio-block';
  /** Andamento dos ritmos (contagem e ataques). */
  bpm: number;
}

export const DEFAULT_PRESENTATION: Presentation = {
  voice: 'piano', volume: 2, gap: 0.75, arp: 0, dur: 0.9, chord: 'block', bpm: 84,
};

/** Junta as camadas; as últimas valem mais. Campos ausentes ficam com o valor de baixo. */
export function resolvePresentation(layers: (Partial<Presentation> | undefined)[]): Presentation {
  const out = { ...DEFAULT_PRESENTATION };
  for (const layer of layers) {
    if (!layer) continue;
    for (const [k, v] of Object.entries(layer)) if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** Linha do tempo das notas, em segundos a partir do começo: [midi, início][]. */
export function schedule(content: SoundContent, p: Presentation): { notes: [number, number][]; length: number } {
  const notes: [number, number][] = [];
  let t = 0;
  for (const group of content.groups) {
    if (group.length > 1 && p.chord !== 'block') {
      group.forEach((m, i) => notes.push([m, t + i * p.gap]));
      t += group.length * p.gap;
      if (p.chord === 'arpeggio') continue;
    }
    group.forEach((m, i) => notes.push([m, t + i * p.arp]));
    t += p.gap;
  }
  return { notes, length: t };
}

/** Ajuste de nível de cada timbre, para que todos soem igualmente altos no mesmo volume. Medido fora
 *  do tempo real, a 2,0 e em tríade (e em nota solta): o violão saía ~6 dB abaixo do piano, o baixo ~4
 *  dB e o órgão ~7 dB acima. Sem isso, trocar de timbre no Perfil mudaria o volume sem querer. */
export const VOICE_LEVEL: Record<Voice, number> = { piano: 1, pad: 1, violao: 1.8, baixo: 0.6, orgao: 0.45 };

/** Reforço dos tambores em relação às notas, para o mesmo volume. O aro é ruído de banda estreita e
 *  soa muito mais baixo que uma nota (pico −29 dBFS contra −21 a 0,7); o clique da contagem é agudo e
 *  já chega perto. Medidos fora do tempo real para ficarem no nível das notas. */
export const DRUM_GAIN = { click: 1.5, accent: 3 };

/** Toca o conteúdo com a apresentação dada. Devolve a duração, em segundos. */
export function playContent(content: SoundContent, p: Presentation): number {
  if (content.drums) {
    const beat = 60 / p.bpm;
    const t0 = now() + 0.1;
    for (let i = 0; i < 4; i++) drum(i === 0 ? 'clique-forte' : 'clique', t0 + i * beat, p.volume * DRUM_GAIN.click);
    content.drums.forEach(o => drum('aro', t0 + (4 + o) * beat, p.volume * DRUM_GAIN.accent));
    for (let i = 0; i < 4; i++) drum('clique', t0 + (4 + i) * beat, 0.35 * p.volume * DRUM_GAIN.click);
    return 8 * beat;
  }
  const t0 = now() + 0.05;
  const { notes, length } = schedule(content, p);
  const vel = p.volume * VOICE_LEVEL[p.voice];
  notes.forEach(([m, t]) => tone(m, t0 + t, p.dur, p.voice, vel));
  return length;
}
