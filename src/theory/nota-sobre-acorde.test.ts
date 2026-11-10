// A nota da melodia sobre cada acorde do campo (ideia do Paulo, 07/11/2026).
//
// Os dois primeiros testes são os **exemplos que ele deu**, literais — se algum deles quebrar, o
// motor deixou de dizer o que ele pediu que dissesse.
import { describe, expect, it } from 'vitest';
import { analisar, melodiaAcimaDe, notasCromaticas, vozear } from './nota-sobre-acorde';
import { buildChord, buildScale, harmonicField, midi, mod, note, noteName, type ModoDoCampo } from './core';

const C = note(0, 0, 4); // Dó4
const campoDeDo = harmonicField(C, 'maior');
/** A relação da melodia `mel` sobre o grau `g` (1..7) de Dó maior. */
const sobre = (g: number, mel: ReturnType<typeof note>) => {
  const d = campoDeDo[g - 1];
  const v = vozear(d.root, d.chord, mel);
  return { ...analisar(v.acorde, v.melodia, d.chord), v, d };
};

describe('os exemplos do Paulo', () => {
  it('Dó sobre Dó maior: a melodia é a fundamental do acorde', () => {
    const r = sobre(1, C);
    expect(r.grauDoAcorde).toBe(1);
    expect(r.atritos).toEqual([]);
  });

  it('Dó sobre Mi menor: não é nota do acorde, e atrita com o Si — a quinta', () => {
    const r = sobre(3, C);
    expect(r.grauDoAcorde).toBeNull();
    expect(r.atritos).toHaveLength(1);
    expect(r.atritos[0].grau, 'o Si é a quinta de Mi menor').toBe(5);
    expect(noteName(r.atritos[0].nota, 'pt')).toBe('Si');
    expect(r.atritos[0].semitons).toBe(1);
    // e o intervalo de Mi até Dó é uma sexta menor
    expect(r.intervalo).toEqual({ num: 6, semis: 8 });
  });
});

describe('notas de fora da escala (pedido de 07/11)', () => {
  const doze = notasCromaticas(C, 'maior');

  it('são doze, em ordem de altura, começando na tônica', () => {
    expect(doze).toHaveLength(12);
    expect(doze.map(x => x.label)).toEqual(['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']);
  });

  it('o exemplo do Paulo: ♭6 em Dó maior é Lá♭, nunca Sol♯', () => {
    const b6 = doze.find(x => x.label === '♭6')!;
    expect(noteName(b6.nota, 'pt')).toBe('Lá♭');
  });

  it('cada grau alterado mantém a letra do grau e só muda o acidente', () => {
    expect(noteName(doze.find(x => x.label === '♭2')!.nota, 'pt')).toBe('Ré♭');
    expect(noteName(doze.find(x => x.label === '♭3')!.nota, 'pt')).toBe('Mi♭');
    expect(noteName(doze.find(x => x.label === '♭5')!.nota, 'pt')).toBe('Sol♭');
    expect(noteName(doze.find(x => x.label === '♭7')!.nota, 'pt')).toBe('Si♭');
  });

  it('marca o que é do campo e o que é de fora — maior tem 7 dentro e 5 fora', () => {
    expect(doze.filter(x => x.noCampo).map(x => x.label)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('os graus se nomeiam contra a MAIOR, então em menor o Dó continua ♭3', () => {
    const la = note(5, 0, 4);
    const menor = notasCromaticas(la, 'menor');
    const b3 = menor.find(x => x.label === '♭3')!;
    expect(noteName(b3.nota, 'pt')).toBe('Dó');
    expect(b3.noCampo, 'em Lá menor o Dó é do campo').toBe(true);
    const terca = menor.find(x => x.label === '3')!;
    expect(noteName(terca.nota, 'pt')).toBe('Dó♯');
    expect(terca.noCampo, 'e o Dó♯ é de fora').toBe(false);
  });

  it('nos quatro campos: sempre 12 notas, 12 classes de altura distintas', () => {
    for (const modo of ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as ModoDoCampo[]) {
      const d = notasCromaticas(C, modo);
      expect(d).toHaveLength(12);
      expect(new Set(d.map(x => mod(midi(x.nota), 12))).size, modo).toBe(12);
      expect(d.filter(x => x.noCampo).length, `${modo}: o campo tem 7 notas`).toBe(7);
    }
  });

  it('toda nota de fora serve ao motor como qualquer outra', () => {
    for (const d of campoDeDo) {
      for (const g of doze.filter(x => !x.noCampo)) {
        const v = vozear(d.root, d.chord, g.nota);
        const r = analisar(v.acorde, v.melodia, d.chord);
        expect(midi(v.melodia)).toBeGreaterThan(Math.max(...v.acorde.map(midi)));
        expect(r.intervalo.num).toBeGreaterThan(0);
      }
    }
  });
});

describe('vozear', () => {
  it('a melodia fica SEMPRE acima da nota mais aguda do acorde', () => {
    for (const modo of ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as ModoDoCampo[]) {
      for (const d of harmonicField(C, modo)) {
        for (const mel of buildScale(C, modo)) {
          const v = vozear(d.root, d.chord, mel);
          expect(midi(v.melodia), `${d.symbol} / ${noteName(mel, 'pt')}`).toBeGreaterThan(Math.max(...v.acorde.map(midi)));
        }
      }
    }
  });

  it('preserva a grafia da melodia — só muda a oitava', () => {
    const mel = note(6, -1, 4); // Si♭
    const v = vozear(C, 'maior', mel);
    expect(v.melodia.letter).toBe(mel.letter);
    expect(v.melodia.acc).toBe(mel.acc);
  });

  it('o acorde sai em posição fundamental: a fundamental é a nota mais grave', () => {
    for (const d of campoDeDo) {
      const v = vozear(d.root, d.chord, C);
      expect(midi(v.acorde[0])).toBe(Math.min(...v.acorde.map(midi)));
    }
  });
});

describe('melodiaAcimaDe: a nota fica PARADA quando o acorde troca', () => {
  const acordes = campoDeDo.map(d => buildChord(d.root, d.chord));

  it('uma única oitava serve para todos os sete acordes do campo', () => {
    for (const mel of buildScale(C, 'maior')) {
      const m = melodiaAcimaDe(acordes, mel, C);
      for (const ac of acordes) {
        expect(midi(m), `${noteName(mel, 'pt')}`).toBeGreaterThan(Math.max(...ac.map(midi)));
      }
    }
  });

  it('e é a MESMA nota para qualquer acorde — era o que pulava com `vozear`', () => {
    const mel = note(0, 0, 4);
    const fixa = melodiaAcimaDe(acordes, mel, C);
    const porAcorde = campoDeDo.map(d => midi(vozear(d.root, d.chord, mel).melodia));
    expect(new Set(porAcorde).size, 'vozear dá oitavas diferentes conforme o acorde').toBeGreaterThan(1);
    expect(new Set(campoDeDo.map(() => midi(fixa))).size, 'a fixa não muda').toBe(1);
  });

  it('vale nos quatro campos e nas doze notas', () => {
    for (const modo of ['maior', 'menor', 'menor-harmonica', 'menor-melodica'] as ModoDoCampo[]) {
      const acs = harmonicField(C, modo).map(d => buildChord(d.root, d.chord));
      for (const g of notasCromaticas(C, modo)) {
        const m = melodiaAcimaDe(acs, g.nota, C);
        for (const ac of acs) expect(midi(m), `${modo} ${g.label}`).toBeGreaterThan(Math.max(...ac.map(midi)));
      }
    }
  });
});

describe('a nota pertencer ao acorde é por classe de altura, não por grafia', () => {
  it('a tônica sobre o I é a fundamental, sobre o vi é a terça, sobre o IV é a quinta', () => {
    expect(sobre(1, C).grauDoAcorde).toBe(1); // Dó em Dó maior
    expect(sobre(6, C).grauDoAcorde).toBe(3); // Dó em Lá menor
    expect(sobre(4, C).grauDoAcorde).toBe(5); // Dó em Fá maior
  });

  it('Sol♯ e Lá♭ contam igual — é exercício de ouvido, e é a mesma tecla', () => {
    const la = note(5, 0, 4);
    const campoHarm = harmonicField(la, 'menor-harmonica');
    const v = harmonicField(la, 'menor-harmonica')[4]; // grau V: Mi maior, com Sol♯
    const comSustenido = analisar(vozear(v.root, v.chord, note(4, 1, 4)).acorde, vozear(v.root, v.chord, note(4, 1, 4)).melodia, v.chord);
    const comBemol = analisar(vozear(v.root, v.chord, note(5, -1, 4)).acorde, vozear(v.root, v.chord, note(5, -1, 4)).melodia, v.chord);
    expect(campoHarm[4].chord).toBe('maior');
    expect(comSustenido.grauDoAcorde).toBe(comBemol.grauDoAcorde);
    expect(comSustenido.grauDoAcorde).toBe(3); // Sol♯ é a terça de Mi maior
  });
});

describe('atrito: só semitom real, e nos dois sentidos de leitura', () => {
  it('Fá sobre Dó maior atrita com a terça — a nota de evitar mais conhecida', () => {
    const r = sobre(1, note(3, 0, 4));
    expect(r.atritos.map(a => a.grau)).toEqual([3]);
  });

  it('Fá sobre Mi menor atrita com a FUNDAMENTAL, a uma nona menor', () => {
    const r = sobre(3, note(3, 0, 4));
    expect(r.atritos).toHaveLength(1);
    expect(r.atritos[0].grau).toBe(1);
    expect(r.atritos[0].semitons, 'nona menor, não segunda menor').toBe(13);
  });

  // Este caso é a razão de o motor medir altura real e não classe de altura. Si e Dó são "um
  // semitom" em qualquer tabela, mas aqui o Dó do acorde está uma oitava abaixo do Si da melodia:
  // soa como sétima maior aberta, e não como o atrito do exemplo do Mi menor.
  it('Si sobre Dó maior NÃO atrita: o Dó do acorde ficou uma oitava abaixo', () => {
    const r = sobre(1, note(6, 0, 4));
    expect(r.grauDoAcorde).toBeNull();
    expect(r.atritos).toEqual([]);
    expect(r.intervalo).toEqual({ num: 7, semis: 11 });
  });

  it('Ré sobre Dó maior não atrita, e soa como nona', () => {
    const r = sobre(1, note(1, 0, 4));
    expect(r.grauDoAcorde).toBeNull();
    expect(r.atritos).toEqual([]);
    expect(r.intervalo.num, 'soa acima do acorde, então é nona e não segunda').toBe(9);
  });

  it('a distância medida é a real, nunca a da classe de altura', () => {
    for (const d of campoDeDo) {
      for (const mel of buildScale(C, 'maior')) {
        const v = vozear(d.root, d.chord, mel);
        const r = analisar(v.acorde, v.melodia, d.chord);
        for (const a of r.atritos) {
          expect([1, 13]).toContain(a.semitons);
          expect(Math.abs(midi(v.melodia) - midi(a.nota))).toBe(a.semitons);
        }
      }
    }
  });
});

describe('a varredura inteira, nos quatro campos', () => {
  const MODOS: ModoDoCampo[] = ['maior', 'menor', 'menor-harmonica', 'menor-melodica'];

  it('toda combinação nota × acorde produz um resultado coerente', () => {
    for (const modo of MODOS) {
      for (const d of harmonicField(C, modo)) {
        for (const mel of buildScale(C, modo)) {
          const v = vozear(d.root, d.chord, mel);
          const r = analisar(v.acorde, v.melodia, d.chord);
          const grausDoAcorde = v.acorde.map(n => mod(midi(n), 12));
          const ehDoAcorde = grausDoAcorde.includes(mod(midi(v.melodia), 12));
          expect(r.grauDoAcorde !== null, `${modo} ${d.symbol}/${noteName(mel, 'pt')}`).toBe(ehDoAcorde);
          expect(r.intervalo.num).toBeGreaterThan(0);
        }
      }
    }
  });

  it('são 7 acordes e 7 notas em cada campo — 49 combinações, 196 no total', () => {
    let n = 0;
    for (const modo of MODOS) n += harmonicField(C, modo).length * buildScale(C, modo).length;
    expect(n).toBe(196);
  });

  it('a nota do acorde nunca atrita consigo mesma', () => {
    for (const modo of MODOS) {
      for (const d of harmonicField(C, modo)) {
        for (const mel of buildScale(C, modo)) {
          const v = vozear(d.root, d.chord, mel);
          const r = analisar(v.acorde, v.melodia, d.chord);
          if (r.grauDoAcorde !== null) expect(r.atritos.map(a => a.grau)).not.toContain(r.grauDoAcorde);
        }
      }
    }
  });
});
