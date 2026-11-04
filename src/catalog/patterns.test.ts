import { describe, expect, it } from 'vitest';
import { aplicavel, grauDaPos, oitavaDaPos, percorrer, PRESETS, type Percurso } from './patterns';

/** Os tamanhos de escala que o Clave usa: pentatônica (5) até cromática (12). */
const TAMANHOS = [5, 6, 7, 8, 9, 10, 11, 12];

const TODOS: Percurso[] = [
  { kind: 'sequencial' },
  { kind: 'intervalo', grau: 3 },
  { kind: 'intervalo', grau: 4 },
  { kind: 'intervalo', grau: 5 },
  { kind: 'intervalo', grau: 6 },
  { kind: 'intervalo', grau: 7 },
  { kind: 'pedal', grau: 1 },
  { kind: 'pedal', grau: 5 },
  { kind: 'vizinha', k: 1 },
  { kind: 'vizinha', k: -1 },
  { kind: 'grupos', n: 3 },
  { kind: 'grupos', n: 4 },
  { kind: 'grupos', n: 3, passo: 3 },
];
const nome = (p: Percurso) => JSON.stringify(p);

describe('motor de padrões', () => {
  it.each(TODOS.map(p => [nome(p), p] as const))('%s produz sequência em toda escala de 5 a 12', (_, p) => {
    for (const tamanho of TAMANHOS.filter(t => aplicavel(t, p))) {
      const seq = percorrer(tamanho, p, { direcao: 'ambos' });
      expect(seq.length).toBeGreaterThan(0);
      // posição pode passar da oitava e pode ser negativa (vizinha inferior da tônica);
      // o que não pode é o GRAU sair da escala
      for (const pos of seq) {
        const g = grauDaPos(pos, tamanho);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThan(tamanho);
        expect(Number.isInteger(pos)).toBe(true);
      }
      // nada longe demais: no máximo uma oitava para cada lado do trecho pedido
      expect(Math.min(...seq)).toBeGreaterThanOrEqual(-tamanho);
      expect(Math.max(...seq)).toBeLessThanOrEqual(2 * tamanho);
    }
  });

  it.each(TODOS.map(p => [nome(p), p] as const))('%s: descer é o espelho exato de subir', (_, p) => {
    for (const tamanho of TAMANHOS.filter(t => aplicavel(t, p))) {
      const sobe = percorrer(tamanho, p, { direcao: 'sobe' });
      const desce = percorrer(tamanho, p, { direcao: 'desce' });
      expect(desce).toEqual([...sobe].reverse());
    }
  });

  it.each(TODOS.map(p => [nome(p), p] as const))('%s: "ambos" é subir e descer sem repetir o ápice', (_, p) => {
    for (const tamanho of TAMANHOS.filter(t => aplicavel(t, p))) {
      const sobe = percorrer(tamanho, p, { direcao: 'sobe' });
      const ambos = percorrer(tamanho, p, { direcao: 'ambos' });
      expect(ambos.slice(0, sobe.length)).toEqual(sobe);
      expect(ambos.length).toBe(sobe.length * 2 - 1);
      expect(ambos[ambos.length - 1]).toBe(sobe[0]);
    }
  });

  it('recusa escala pequena demais', () => {
    expect(() => percorrer(1, { kind: 'sequencial' })).toThrow();
  });

  it('o que não cabe na escala sai vazio, e `aplicavel` avisa antes', () => {
    // sétimas é um salto de 6 posições: não existe numa pentatônica de 5
    expect(aplicavel(5, { kind: 'intervalo', grau: 7 })).toBe(false);
    expect(percorrer(5, { kind: 'intervalo', grau: 7 })).toEqual([]);
    // na diatônica, existe
    expect(aplicavel(7, { kind: 'intervalo', grau: 7 })).toBe(true);
    expect(percorrer(7, { kind: 'intervalo', grau: 7 }).length).toBeGreaterThan(0);
  });
});

describe('as sequências que o músico espera', () => {
  it('sequencial sobe a oitava inteira', () => {
    expect(percorrer(7, { kind: 'sequencial' })).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('terças são 1-3-2-4-3-5… (em grau)', () => {
    const emGrau = percorrer(7, { kind: 'intervalo', grau: 3 }).map(p => p + 1);
    expect(emGrau).toEqual([1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8]);
  });

  it('terças descendentes são 8-6-7-5-6-4… — e não sextas', () => {
    const emGrau = percorrer(7, { kind: 'intervalo', grau: 3 }, { direcao: 'desce' }).map(p => p + 1);
    expect(emGrau.slice(0, 6)).toEqual([8, 6, 7, 5, 6, 4]);
  });

  it('pedal na tônica é 1-2-1-3-1-4…', () => {
    const emGrau = percorrer(7, { kind: 'pedal', grau: 1 }).map(p => p + 1);
    expect(emGrau.slice(0, 8)).toEqual([1, 2, 1, 3, 1, 4, 1, 5]);
  });

  it('nota e vizinha inferior é 1-7-2-1-3-2…, com o 7 na oitava de baixo', () => {
    const seq = percorrer(7, { kind: 'vizinha', k: 1 });
    expect(seq.slice(0, 6)).toEqual([0, -1, 1, 0, 2, 1]);
    // a vizinha do primeiro grau é o sétimo grau da oitava de baixo
    expect(grauDaPos(seq[1], 7)).toBe(6);
    expect(oitavaDaPos(seq[1], 7)).toBe(-1);
  });

  it('grupos de 3 são 1-2-3, 2-3-4, 3-4-5…', () => {
    const emGrau = percorrer(7, { kind: 'grupos', n: 3 }).map(p => p + 1);
    expect(emGrau.slice(0, 9)).toEqual([1, 2, 3, 2, 3, 4, 3, 4, 5]);
  });

  it('grupos com passo 3 não se sobrepõem: 1-2-3, 4-5-6…', () => {
    const emGrau = percorrer(7, { kind: 'grupos', n: 3, passo: 3 }).map(p => p + 1);
    expect(emGrau).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('salto de oitava sobe só as notas escolhidas', () => {
    const seq = percorrer(7, { kind: 'sequencial' }, { saltoDeOitava: [1, 3] });
    expect(seq).toEqual([0, 1 + 7, 2, 3 + 7, 4, 5, 6, 7]);
  });
});

describe('o padrão é por posição, não por número de grau', () => {
  // É a regra que faz um motor só servir a pentatônica, diatônica e simétricas.
  // Pentatônica maior de Dó: Dó Ré Mi Sol Lá — 5 posições, mas os graus pulam o 4 e o 7.
  const GRAU_DA_PENTA = [1, 2, 3, 5, 6]; // nome do grau de cada posição

  const comoOMusicoChama = (posicoes: number[]) =>
    posicoes.map(p => GRAU_DA_PENTA[grauDaPos(p, 5)] + 7 * oitavaDaPos(p, 5));

  it('o mesmo motivo de 4 posições muda de nome ao subir, mas não muda de forma', () => {
    const motivo = (inicio: number) => [inicio, inicio + 1, inicio + 2, inicio + 3];
    expect(comoOMusicoChama(motivo(0))).toEqual([1, 2, 3, 5]);
    expect(comoOMusicoChama(motivo(1))).toEqual([2, 3, 5, 6]);
    // a partir do grau 5 (Sol), que é a posição 3
    expect(comoOMusicoChama(motivo(3))).toEqual([5, 6, 8, 9]);
  });

  it('o motor percorre a pentatônica sem nenhum caso especial', () => {
    const seq = percorrer(5, { kind: 'grupos', n: 4 });
    expect(seq.slice(0, 4)).toEqual([0, 1, 2, 3]);
    expect(seq.slice(4, 8)).toEqual([1, 2, 3, 4]);
  });
});

describe('presets', () => {
  it('todos têm id único e produzem sequência onde se aplicam', () => {
    expect(new Set(PRESETS.map(p => p.id)).size).toBe(PRESETS.length);
    for (const preset of PRESETS) {
      for (const tamanho of TAMANHOS.filter(t => aplicavel(t, preset.percurso))) {
        expect(percorrer(tamanho, preset.percurso, { direcao: preset.direcao }).length).toBeGreaterThan(0);
      }
    }
  });

  it('todo preset se aplica à escala diatônica', () => {
    for (const p of PRESETS) expect(aplicavel(7, p.percurso)).toBe(true);
  });

  it('nenhum id é uma sequência bruta de números', () => {
    // o preset é nomeado pelo que a pessoa faz, nunca por "1-3-2-4" (catalogo.md)
    for (const p of PRESETS) expect(p.id).not.toMatch(/^[\d-]+$/);
  });
});
