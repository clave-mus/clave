// **As duas regras de tela do modo de foco**, uma por eixo (14/11/2026).
//
// Este teste existe porque o Paulo só vai poder testar o modo de foco num celular **depois do
// deploy** — "capriche para evitar erros" —, e porque a ferramenta de navegador que eu uso não
// simula um dos casos: janela de desktop estreita **sem** toque. Com a regra separada da medição,
// os quatro casos cabem aqui.
//
// A confusão que estas regras desfazem foi dele: eu havia amarrado o aviso de girar e o modo de
// foco ao mesmo número, e ele perguntou *"isso significa que no computador vai pedir para
// rotacionar a tela? Porque isso soa meio difícil"*.
import { describe, expect, it } from 'vitest';
import { regrasDaTela } from './useTela';

const CASOS = [
  // nome, medidas, o que deve acontecer
  ['celular em pé', { largura: 375, altura: 812, toque: true, retrato: true },
    { braco: false, moldura: true, pedirParaGirar: true }],
  ['celular deitado', { largura: 667, altura: 375, toque: true, retrato: false },
    { braco: true, moldura: false, pedirParaGirar: false }],
  ['tablet em pé', { largura: 768, altura: 1024, toque: true, retrato: true },
    { braco: true, moldura: true, pedirParaGirar: false }],
  ['desktop', { largura: 1280, altura: 800, toque: false, retrato: false },
    { braco: true, moldura: true, pedirParaGirar: false }],
  // O caso que o navegador de teste não simula, e a razão desta função ser pura.
  ['janela de desktop estreita', { largura: 520, altura: 800, toque: false, retrato: true },
    { braco: false, moldura: true, pedirParaGirar: false }],
  // Uma janela baixa no desktop entra em foco (a moldura não cabe) e **não** pede para girar.
  ['janela de desktop baixa', { largura: 1280, altura: 420, toque: false, retrato: false },
    { braco: true, moldura: false, pedirParaGirar: false }],
] as const;

describe('as regras de tela', () => {
  it.each(CASOS)('%s', (_nome, medidas, esperado) => {
    const t = regrasDaTela(medidas);
    expect(t.cabeOBraco, 'o braço inteiro cabe na largura').toBe(esperado.braco);
    expect(t.cabeAMoldura, 'a moldura do app cabe na altura').toBe(esperado.moldura);
    /**
     * **Pedir para girar é o cruzamento das duas coisas**: o braço não cabe E o aparelho gira.
     * Nunca se pede para girar um computador, nem se pede nada quando o braço já cabe.
     */
    expect(!t.cabeOBraco && t.giravelAgora, 'pedir para girar').toBe(esperado.pedirParaGirar);
  });

  it('nenhum desktop recebe pedido para girar, em largura nenhuma', () => {
    for (let largura = 300; largura <= 1600; largura += 20) {
      for (const altura of [380, 420, 700, 1000]) {
        const t = regrasDaTela({ largura, altura, toque: false, retrato: largura < altura });
        expect(!t.cabeOBraco && t.giravelAgora, `${largura}x${altura}`).toBe(false);
      }
    }
  });

  it('o foco depende só da altura, e o aviso só da largura e do giro', () => {
    // mesma altura, larguras diferentes: o foco não muda
    expect(regrasDaTela({ largura: 400, altura: 375, toque: true, retrato: false }).cabeAMoldura)
      .toBe(regrasDaTela({ largura: 900, altura: 375, toque: true, retrato: false }).cabeAMoldura);
    // mesma largura, alturas diferentes: o braço não muda
    expect(regrasDaTela({ largura: 667, altura: 375, toque: true, retrato: false }).cabeOBraco)
      .toBe(regrasDaTela({ largura: 667, altura: 900, toque: true, retrato: false }).cabeOBraco);
  });
});
