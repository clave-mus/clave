// A grade do metrônomo (M4, 06/11/2026).
import { describe, expect, it } from 'vitest';
import { gradePadrao, passoDaGrade, PROXIMO_ESTADO, type EstadoPosicao } from './metronomo';

describe('gradePadrao', () => {
  it('tem compassos × subdivisao posições, tudo ligado, só a primeira acentuada', () => {
    const g = gradePadrao(4, 2);
    expect(g).toHaveLength(8);
    expect(g[0]).toBe('acentuada');
    expect(g.slice(1).every(e => e === 'ligada')).toBe(true);
  });
});

describe('PROXIMO_ESTADO', () => {
  it('cicla desligada → ligada → acentuada → desligada', () => {
    let e: EstadoPosicao = 'desligada';
    e = PROXIMO_ESTADO[e]; expect(e).toBe('ligada');
    e = PROXIMO_ESTADO[e]; expect(e).toBe('acentuada');
    e = PROXIMO_ESTADO[e]; expect(e).toBe('desligada');
  });
});

describe('passoDaGrade — posição e compasso', () => {
  it('conta a posição dentro do compasso e o número do compasso', () => {
    const grade = gradePadrao(4, 1); // 4 posições por compasso
    expect(passoDaGrade(0, 4, 1, grade, { tocar: 1, silenciar: 0 })).toMatchObject({ pos: 0, compasso: 0 });
    expect(passoDaGrade(3, 4, 1, grade, { tocar: 1, silenciar: 0 })).toMatchObject({ pos: 3, compasso: 0 });
    expect(passoDaGrade(4, 4, 1, grade, { tocar: 1, silenciar: 0 })).toMatchObject({ pos: 0, compasso: 1 });
    expect(passoDaGrade(11, 4, 1, grade, { tocar: 1, silenciar: 0 })).toMatchObject({ pos: 3, compasso: 2 });
  });

  it('"só tempos 2 e 4": desligar as posições 0 e 2 faz os outros tempos não tocarem', () => {
    const grade: EstadoPosicao[] = ['desligada', 'acentuada', 'desligada', 'ligada'];
    expect(passoDaGrade(0, 4, 1, grade, { tocar: 1, silenciar: 0 }).toca).toBe(false);
    expect(passoDaGrade(1, 4, 1, grade, { tocar: 1, silenciar: 0 }).toca).toBe(true);
    expect(passoDaGrade(2, 4, 1, grade, { tocar: 1, silenciar: 0 }).toca).toBe(false);
    expect(passoDaGrade(3, 4, 1, grade, { tocar: 1, silenciar: 0 }).toca).toBe(true);
  });

  it('"1/1 sem acento": um compasso, uma posição, ligada mas não acentuada', () => {
    const grade: EstadoPosicao[] = ['ligada'];
    const passo = passoDaGrade(0, 1, 1, grade, { tocar: 1, silenciar: 0 });
    expect(passo.toca).toBe(true);
    expect(passo.estado).toBe('ligada');
  });

  it('silenciar só o "e" do tempo 2, num compasso de colcheias (subdivisao 2)', () => {
    // posições: 1(f), 1+e, 2(f), 2+e, 3(f), 3+e, 4(f), 4+e — desliga só a posição 3 (o "e" do tempo 2)
    const grade: EstadoPosicao[] = ['acentuada', 'ligada', 'ligada', 'desligada', 'ligada', 'ligada', 'ligada', 'ligada'];
    expect(passoDaGrade(3, 4, 2, grade, { tocar: 1, silenciar: 0 }).toca).toBe(false);
    expect(passoDaGrade(2, 4, 2, grade, { tocar: 1, silenciar: 0 }).toca).toBe(true);
    expect(passoDaGrade(4, 4, 2, grade, { tocar: 1, silenciar: 0 }).toca).toBe(true);
  });
});

describe('passoDaGrade — ciclo de compassos silenciados', () => {
  const grade = gradePadrao(4, 1);

  it('tocar:1, silenciar:0 nunca silencia (o padrão de sempre)', () => {
    for (let i = 0; i < 40; i++) expect(passoDaGrade(i, 4, 1, grade, { tocar: 1, silenciar: 0 }).silenciado).toBe(false);
  });

  it('1 e 1: compassos pares tocam, ímpares silenciam', () => {
    const ciclo = { tocar: 1, silenciar: 1 };
    for (let compasso = 0; compasso < 6; compasso++) {
      const i = compasso * 4; // primeira posição daquele compasso
      expect(passoDaGrade(i, 4, 1, grade, ciclo).silenciado, `compasso ${compasso}`).toBe(compasso % 2 === 1);
    }
  });

  it('2 e 2: dois compassos tocam, dois silenciam, em ciclo', () => {
    const ciclo = { tocar: 2, silenciar: 2 };
    const silenciados = Array.from({ length: 8 }, (_, compasso) => passoDaGrade(compasso * 4, 4, 1, grade, ciclo).silenciado);
    expect(silenciados).toEqual([false, false, true, true, false, false, true, true]);
  });

  it('3 e 1: três tocam, um silencia', () => {
    const ciclo = { tocar: 3, silenciar: 1 };
    const silenciados = Array.from({ length: 8 }, (_, compasso) => passoDaGrade(compasso * 4, 4, 1, grade, ciclo).silenciado);
    expect(silenciados).toEqual([false, false, false, true, false, false, false, true]);
  });

  it('compasso silenciado não toca mesmo com a posição ligada', () => {
    const passo = passoDaGrade(4, 4, 1, grade, { tocar: 1, silenciar: 1 }); // compasso 1, posição 0 (acentuada)
    expect(passo.estado).toBe('acentuada');
    expect(passo.silenciado).toBe(true);
    expect(passo.toca).toBe(false);
  });
});
