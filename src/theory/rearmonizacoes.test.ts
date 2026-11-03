// Contrato da FM-5 (decisões 69 e 78).
//
// A única invariante que o laboratório precisa garantir é que **toda transformação mantém a nota da
// melodia pertencente ao acorde resultante** — é o que o torna utilizável. O resto é conferência das
// sete transformações contra casos escritos à mão.
//
// Nenhum teste afirma que uma rearmonização é melhor que outra. O laboratório não corrige.
import { describe, expect, it } from 'vitest';
import {
  cabeAMelodia, comuns, grauNaTonalidade, medirHarmonia, opcoes, pcsDe, TRANSFORMACOES,
  type Acorde, type ContextoHarmonico, type TransformacaoId,
} from './rearmonizacoes';
import { mod } from './core';

const C = 0, D = 2, E = 4, F = 5, G = 7, A = 9, Bb = 10, Db = 1, Cs = 1, Ab = 8;
const a = (fundamental: number, qualidade: Acorde['qualidade']): Acorde => ({ fundamental, qualidade });
const nomes = (xs: Acorde[]) => xs.map(x => `${['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][x.fundamental]}${x.qualidade}`);
const em = (acorde: Acorde, extra: Partial<ContextoHarmonico> = {}): ContextoHarmonico =>
  ({ acorde, tonica: C, modo: 'maior', ...extra });
const trans = (id: TransformacaoId) => TRANSFORMACOES.find(t => t.id === id)!;

describe('as sete transformações existem, e só as sete (decisão 78)', () => {
  it('estão todas, na ordem pedagógica', () => {
    expect(TRANSFORMACOES.map(t => t.id)).toEqual([
      'qualidade', 'diatonica', 'interpolar-ii', 'dominante-secundario',
      'subv7', 'diminuto-passagem', 'emprestimo-modal',
    ]);
  });

  it('as duas recusadas não estão: aproximação cromática e pedal de baixo', () => {
    const ids = TRANSFORMACOES.map(t => String(t.id));
    expect(ids).not.toContain('aproximacao-cromatica');
    expect(ids).not.toContain('pedal');
  });
});

describe('substituição por trítono (a que mais ensina)', () => {
  it('G7 vira D♭7 — um trítono acima', () => {
    expect(nomes(trans('subv7').aplicar(em(a(G, '7'))))).toEqual(['C#7']);
  });

  it('e os dois compartilham o MESMO trítono: é o que faz a substituição funcionar', () => {
    const g7 = pcsDe(a(G, '7'));           // G B D F
    const db7 = pcsDe(a(Db, '7'));         // Db F Ab Cb(=B)
    const triton = [11, 5];                // Si e Fá
    for (const p of triton) {
      expect(g7, `G7 tem ${p}`).toContain(p);
      expect(db7, `Db7 tem ${p}`).toContain(p);
    }
  });

  it('o baixo passa a descer meio tom em vez de cair uma quinta', () => {
    expect(mod(C - G, 12)).toBe(5);   // G → C: quinta justa descendente (5 semitons acima)
    expect(mod(C - Db, 12)).toBe(11); // Db → C: meio tom descendente
  });

  it('só se aplica a dominante', () => {
    expect(trans('subv7').aplicavel(em(a(G, '7')))).toBe(true);
    expect(trans('subv7').aplicavel(em(a(C, '7M')))).toBe(false);
    expect(trans('subv7').aplicavel(em(a(D, 'm7')))).toBe(false);
  });
});

describe('as outras seis, contra casos escritos à mão', () => {
  it('interpolar o II: G7 vira Dm7 G7', () => {
    expect(nomes(trans('interpolar-ii').aplicar(em(a(G, '7'))))).toEqual(['Dm7', 'G7']);
  });

  it('dominante secundário: antes de Dm7, põe A7', () => {
    const r = trans('dominante-secundario').aplicar(em(a(C, '7M'), { proximo: a(D, 'm7') }));
    expect(nomes(r)).toEqual(['C7M', 'A7']);
  });

  it('dominante secundário precisa de um próximo, e não se aplica sobre dominante', () => {
    expect(trans('dominante-secundario').aplicavel(em(a(C, '7M')))).toBe(false);
    expect(trans('dominante-secundario').aplicavel(em(a(G, '7'), { proximo: a(C, '7M') }))).toBe(false);
  });

  it('diminuto de passagem: entre C e Dm entra C♯dim7', () => {
    const r = trans('diminuto-passagem').aplicar(em(a(C, 'maior'), { proximo: a(D, 'menor') }));
    expect(nomes(r)).toEqual(['Cmaior', 'C#dim7']);
  });

  it('diminuto de passagem só cabe quando o próximo está a um tom', () => {
    expect(trans('diminuto-passagem').aplicavel(em(a(C, 'maior'), { proximo: a(D, 'menor') }))).toBe(true);
    expect(trans('diminuto-passagem').aplicavel(em(a(C, 'maior'), { proximo: a(F, 'maior') }))).toBe(false);
    expect(trans('diminuto-passagem').aplicavel(em(a(C, 'maior')))).toBe(false);
  });

  // O critério é FUNÇÃO, não contagem de notas comuns — e este teste é o que pegou isso. C7M e F7M
  // dividem Dó e Mi, mas F é subdominante e não substitui a tônica.
  it('substituição diatônica troca dentro da mesma função: I ↔ iii ↔ vi', () => {
    expect(nomes(trans('diatonica').aplicar(em(a(C, '7M')))).sort()).toEqual(['Am7', 'Em7']);
    for (const x of trans('diatonica').aplicar(em(a(C, '7M')))) {
      expect(comuns(x, a(C, '7M'))).toBeGreaterThanOrEqual(2);
    }
  });

  it('e não atravessa função: do IV só sai o ii, do V só sai o vii', () => {
    expect(nomes(trans('diatonica').aplicar(em(a(F, '7M'))))).toEqual(['Dm7']);
    expect(nomes(trans('diatonica').aplicar(em(a(G, '7'))))).toEqual(['Bm7b5']);
  });

  it('empréstimo modal: em Dó maior, o IV vira Fm7, e aparecem ♭VI e ♭VII', () => {
    const doIV = nomes(trans('emprestimo-modal').aplicar(em(a(F, '7M'))));
    expect(doIV).toContain('Fm7');
    expect(doIV).toContain('Ab7M');
    expect(doIV).toContain('Bb7');
  });

  it('trocar a qualidade mantém a fundamental e muda só a qualidade', () => {
    for (const x of trans('qualidade').aplicar(em(a(C, 'maior')))) {
      expect(x.fundamental).toBe(C);
      expect(x.qualidade).not.toBe('maior');
    }
  });
});

describe('a invariante: a melodia sempre cabe', () => {
  it('toda opção, em toda tonalidade, acomoda a nota da melodia', () => {
    let total = 0;
    for (let tonica = 0; tonica < 12; tonica++) {
      for (const modo of ['maior', 'menor'] as const) {
        for (const qualidade of ['maior', 'menor', '7M', '7', 'm7', 'm7b5'] as const) {
          for (let grau = 0; grau < 12; grau++) {
            for (let nota = 0; nota < 12; nota++) {
              const ctx: ContextoHarmonico = {
                acorde: a(mod(tonica + grau, 12), qualidade), tonica, modo,
                melodia: [60 + nota], proximo: a(mod(tonica + grau + 2, 12), 'menor'),
              };
              for (const o of opcoes(ctx)) {
                for (const x of o.resultado) {
                  expect(cabeAMelodia(x, ctx.melodia), `${o.id}: ${nomes([x])} com nota ${nota}`).toBe(true);
                }
                total++;
              }
            }
          }
        }
      }
    }
    expect(total).toBeGreaterThan(5000);
  });

  it('cabeAMelodia aceita nota do acorde e tensão natural, e recusa o resto', () => {
    expect(cabeAMelodia(a(C, '7M'), [E])).toBe(true);   // 3ª
    expect(cabeAMelodia(a(C, '7M'), [D])).toBe(true);   // 9ª
    expect(cabeAMelodia(a(C, '7M'), [A])).toBe(true);   // 13ª
    expect(cabeAMelodia(a(C, '7M'), [Db])).toBe(false); // ♭9 sobre maior com sétima maior
    expect(cabeAMelodia(a(C, 'maior'), undefined)).toBe(true);
  });

  it('nenhuma opção vem vazia', () => {
    for (const o of opcoes(em(a(G, '7'), { proximo: a(C, '7M'), melodia: [62] }))) {
      expect(o.resultado.length, o.id).toBeGreaterThan(0);
    }
  });
});

describe('as medidas', () => {
  it('o grau da melodia é exato — é o eixo útil', () => {
    expect(medirHarmonia(a(C, '7M'), em(a(C, '7M'), { melodia: [C] })).grauDaMelodia).toBe(1);
    expect(medirHarmonia(a(C, '7M'), em(a(C, '7M'), { melodia: [E] })).grauDaMelodia).toBe(3);
    expect(medirHarmonia(a(C, '7M'), em(a(C, '7M'), { melodia: [G] })).grauDaMelodia).toBe(5);
    expect(medirHarmonia(a(C, '7M'), em(a(C, '7M'), { melodia: [D] })).grauDaMelodia).toBe(9);
    expect(medirHarmonia(a(C, '7M'), em(a(C, '7M'), { melodia: [A] })).grauDaMelodia).toBe(13);
  });

  it('acusa cromatismo e função', () => {
    const emC = em(a(C, '7M'));
    expect(medirHarmonia(a(G, '7'), emC).funcao).toBe('dominante');
    expect(medirHarmonia(a(F, '7M'), emC).funcao).toBe('subdominante');
    expect(medirHarmonia(a(C, '7M'), emC).funcao).toBe('tonica');
    expect(medirHarmonia(a(Ab, '7M'), emC).cromatico).toBe(true);
    expect(medirHarmonia(a(Ab, '7M'), emC).funcao).toBeNull();
  });

  it('o movimento do baixo vem com sinal, pelo caminho mais curto', () => {
    expect(medirHarmonia(a(C, '7M'), em(a(C, '7M')), a(G, '7')).movimentoDoBaixo).toBe(5);
    expect(medirHarmonia(a(C, '7M'), em(a(C, '7M')), a(Cs, '7')).movimentoDoBaixo).toBe(-1);
  });

  it('grauNaTonalidade acha os sete e recusa os cromáticos', () => {
    expect(grauNaTonalidade(a(C, '7M'), C, 'maior')).toBe(1);
    expect(grauNaTonalidade(a(G, '7'), C, 'maior')).toBe(5);
    expect(grauNaTonalidade(a(Bb, '7'), C, 'maior')).toBeNull();
    expect(grauNaTonalidade(a(Bb, '7'), C, 'menor')).toBe(7);
  });
});
