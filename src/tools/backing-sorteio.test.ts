// **A progressão sorteada** — o *surprise play along* (26/11).
//
// O motor é pequeno e mora fora da tela, então dá para contar o que ele produz em vez de olhar.
import { describe, expect, it } from 'vitest';
import { ehMarca, lerGuardado, resolverProgressao, sortearProgressao, SORTEIO_PADRAO, type Item } from './backing-progressao';

/** Um sorteio determinístico, para o teste contar em vez de torcer. */
const emSequencia = (xs: number[]) => { let i = 0; return (a: number, b: number) => a + (xs[i++ % xs.length] % (b - a + 1)); };

const compassos = (items: Item[]) => items.filter(it => !ehMarca(it));

describe('o sorteio', () => {
  it('dá o número de compassos pedido, e nenhuma marca ocupa compasso', () => {
    for (const n of [1, 4, 8, 12, 24]) {
      const items = sortearProgressao({ ...SORTEIO_PADRAO, compassos: n }, 'maior', 0);
      expect(compassos(items)).toHaveLength(n);
    }
    // Pedir absurdo não quebra: o motor aperta nos limites em vez de devolver lixo.
    expect(compassos(sortearProgressao({ ...SORTEIO_PADRAO, compassos: 999 }, 'maior', 0)).length).toBeLessThanOrEqual(24);
    expect(compassos(sortearProgressao({ ...SORTEIO_PADRAO, compassos: 0 }, 'maior', 0))).toHaveLength(1);
  });

  /**
   * **Aleatório de verdade é o padrão** — decisão dele, contra a minha recomendação: *"quero que o
   * padrão seja aleatório... a ideia é ser aleatório mesmo."* Em 200 sorteios de oito compassos,
   * os sete graus aparecem, e o último compasso não é sempre o I.
   */
  it('sem funções, todo grau pode sair e o fim não é sempre a tônica', () => {
    const vistos = new Set<number>(); let tonicaNoFim = 0;
    for (let i = 0; i < 200; i++) {
      const items = compassos(sortearProgressao(SORTEIO_PADRAO, 'maior', 0)) as { deg: number }[];
      items.forEach(c => vistos.add(c.deg));
      if (items[items.length - 1].deg === 1) tonicaNoFim++;
    }
    expect([...vistos].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(tonicaNoFim, 'o sorteio está cadenciando sem ninguém pedir').toBeLessThan(80);
  });

  it('com funções, o último compasso é a tônica e a ordem anda T → S → D', () => {
    for (let i = 0; i < 50; i++) {
      const cs = compassos(sortearProgressao({ ...SORTEIO_PADRAO, porFuncoes: true }, 'maior', 0)) as { deg: number; emp?: string }[];
      expect(cs[cs.length - 1].deg).toBe(1);
      const GRUPOS = [[1, 3, 6], [2, 4], [5, 7]];
      cs.slice(0, -1).forEach((c, k) => {
        if (c.emp) return; // empréstimo não pertence a grupo funcional
        expect(GRUPOS[k % 3], `compasso ${k}: grau ${c.deg} fora do grupo`).toContain(c.deg);
      });
    }
  });

  it('empréstimos entram, e com parcimônia', () => {
    let comEmp = 0, total = 0;
    for (let i = 0; i < 100; i++) {
      for (const c of compassos(sortearProgressao({ ...SORTEIO_PADRAO, emprestimos: true }, 'maior', 0)) as { emp?: string }[]) {
        total++; if (c.emp) comEmp++;
      }
    }
    // Um em quatro é o alvo; a margem é larga porque é sorteio.
    expect(comEmp / total).toBeGreaterThan(0.1);
    expect(comEmp / total, 'de fora demais deixa de ser desvio').toBeLessThan(0.4);
    // E desligado, nenhum.
    const semEmp = compassos(sortearProgressao(SORTEIO_PADRAO, 'maior', 0)) as { emp?: string }[];
    expect(semEmp.some(c => c.emp)).toBe(false);
  });

  it('a modulação entra entre compassos, nunca antes do primeiro', () => {
    const items = sortearProgressao({ ...SORTEIO_PADRAO, compassos: 8, modulaCada: 4 }, 'maior', 0, emSequencia([0, 1, 2, 3]));
    expect(ehMarca(items[0]), 'modulou antes de existir tonalidade').toBe(false);
    const marcas = items.filter(ehMarca);
    expect(marcas).toHaveLength(1);
    for (const m of marcas) expect(Math.abs(m.mod.fifths)).toBeLessThanOrEqual(6);
  });

  /** O teste que importa de verdade: o que sai do sorteio **toca**. */
  it('toda progressão sorteada vira acordes que soam', () => {
    for (const o of [SORTEIO_PADRAO, { ...SORTEIO_PADRAO, emprestimos: true },
      { ...SORTEIO_PADRAO, porFuncoes: true }, { ...SORTEIO_PADRAO, modulaCada: 2, emprestimos: true }]) {
      for (let i = 0; i < 30; i++) {
        const items = sortearProgressao(o, 'maior', 0);
        const { chords } = resolverProgressao(items, { fifths: 0, mode: 'maior' }, true, 'pt');
        expect(chords.length).toBe(compassos(items).length);
        for (const c of chords) {
          expect(c.symbol.length, 'acorde sem cifra').toBeGreaterThan(0);
          expect(c.vozes.length, 'acorde sem vozes para soar').toBeGreaterThan(2);
          expect(c.scales.length, 'acorde sem escala para improvisar — é o que o exercício pede').toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('o esconder e o sorteio sobrevivem a fechar o app', () => {
  /**
   * São jeito de estudar, não escolha de uma sessão: quem usa o *surprise play along* volta a ele
   * amanhã, e reconfigurar quatro chips toda vez é o tipo de atrito que faz o modo não ser usado.
   */
  it('guardado e lido de volta', () => {
    const guardado = JSON.stringify({
      items: [{ deg: 1 }], fifths: 0, mode: 'maior', tetrads: true, style: 'swing', bpm: 120,
      esconder: true, sorteio: { compassos: 12, emprestimos: true, modulaCada: 4, porFuncoes: true },
    });
    const lido = lerGuardado(guardado);
    expect(lido?.esconder).toBe(true);
    expect(lido?.sorteio).toEqual({ compassos: 12, emprestimos: true, modulaCada: 4, porFuncoes: true });
  });

  /** ⚠️ Sorteio torto vindo de uma versão antiga (ou de uma mão no navegador) cai no padrão. */
  it('sorteio inválido é descartado em vez de virar estado quebrado', () => {
    const comLixo = (sorteio: unknown) => lerGuardado(JSON.stringify({
      items: [{ deg: 1 }], fifths: 0, mode: 'maior', tetrads: true, style: 'swing', bpm: 120, sorteio,
    }))?.sorteio;
    expect(comLixo({ compassos: 999, emprestimos: true, modulaCada: 0, porFuncoes: false })).toBeUndefined();
    expect(comLixo({ compassos: 8 })).toBeUndefined();
    expect(comLixo('oito')).toBeUndefined();
    expect(comLixo(undefined)).toBeUndefined();
  });
});
