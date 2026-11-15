import { useEffect, useState } from 'react';

/**
 * **As duas medidas da tela que o `mapa-do-braco` precisa**, e elas respondem a eixos diferentes.
 *
 * Isto nasceu de um erro meu que o Paulo pegou na conversa de 13/11: eu havia amarrado o aviso de
 * girar o aparelho e o modo de foco ao mesmo número, e ele perguntou *"isso significa que no
 * computador vai pedir para rotacionar a tela? Porque isso soa meio difícil"*. Soa, e estava errado.
 *
 * Separando:
 *
 * - **o braço inteiro é limitado pela LARGURA.** Medido: em 375 px cada casa fica com 26 px, e a 12ª
 *   casa some de vista; em 667 px (celular deitado), 48 px. O limite útil é ~560;
 * - **a moldura é limitada pela ALTURA.** Medido: o Player pede 951 px de altura, e sobram 375 num
 *   celular deitado. Abaixo de ~480 px não cabe cabeçalho, placar, pé e navegação.
 *
 * E a terceira medida é o que torna o aviso honesto: **`giravel`**. Só se pede para girar o que gira
 * — um aparelho de toque em retrato. Numa janela de desktop estreita não há o que girar, então não
 * se avisa nada: o braço desenha menor e a pessoa redimensiona a janela se quiser.
 */
export interface Tela {
  largura: number;
  altura: number;
  /** O braço inteiro até a 12ª casa é legível nesta largura? */
  cabeOBraco: boolean;
  /** A moldura do app (cabeçalho, placar, pé, navegação) cabe nesta altura? */
  cabeAMoldura: boolean;
  /** Aparelho de toque em retrato: girar resolve. Numa janela de desktop, não. */
  giravelAgora: boolean;
}

/** 560 px: abaixo disto a 12ª casa deixa de ser legível (medido, 40 px por casa). */
const LARGURA_DO_BRACO = 560;
/** 480 px: abaixo disto não cabe braço, botões, linha E a moldura do app. */
const ALTURA_DA_MOLDURA = 480;

/**
 * **A regra, separada da medição** — e separada para poder ser testada.
 *
 * O Paulo só vai testar isto num celular depois do deploy, e a ferramenta de navegador que eu uso
 * não consegue simular um caso importante: janela de desktop estreita **sem** toque, onde não se
 * deve pedir para girar nada. Com a regra pura, os quatro casos cabem num teste.
 */
export function regrasDaTela(m: { largura: number; altura: number; toque: boolean; retrato: boolean }): Tela {
  return {
    largura: m.largura,
    altura: m.altura,
    cabeOBraco: m.largura >= LARGURA_DO_BRACO,
    cabeAMoldura: m.altura >= ALTURA_DA_MOLDURA,
    giravelAgora: m.toque && m.retrato,
  };
}

function medir(): Tela {
  return regrasDaTela({
    largura: window.innerWidth,
    altura: window.innerHeight,
    toque: window.matchMedia('(pointer: coarse)').matches,
    retrato: window.matchMedia('(orientation: portrait)').matches,
  });
}

export function useTela(): Tela {
  const [tela, setTela] = useState<Tela>(medir);
  useEffect(() => {
    const ao = () => setTela(medir());
    /**
     * **Três fontes, e cada uma cobre um buraco da outra** — isto é cuidado com celular real, onde
     * não vou poder olhar o resultado.
     *
     * - `resize` é a fonte principal e basta no desktop e em boa parte do Android;
     * - `visualViewport` é a medida fiel no Safari de iPhone: é ela que muda quando a barra de
     *   endereço se esconde, e o `resize` do `window` nem sempre acompanha;
     * - `orientationchange` dispara **antes** de as dimensões atualizarem no iOS. Medir ali daria o
     *   tamanho antigo e a tela ficaria no modo errado até o próximo evento — então ele mede duas
     *   vezes, agora e depois de um instante, e a segunda é a que vale.
     */
    window.addEventListener('resize', ao);
    window.visualViewport?.addEventListener('resize', ao);
    const aoGirar = () => { ao(); window.setTimeout(ao, 250); };
    window.addEventListener('orientationchange', aoGirar);
    return () => {
      window.removeEventListener('resize', ao);
      window.visualViewport?.removeEventListener('resize', ao);
      window.removeEventListener('orientationchange', aoGirar);
    };
  }, []);
  return tela;
}

/**
 * Esconde a moldura do app enquanto `ativo`, por uma classe na raiz do documento.
 *
 * Uma classe, e não um contexto novo: o Layout fica intocado, o CSS decide o que some, e sair da
 * tela devolve tudo — a limpeza no `return` é o que garante isso mesmo se a pessoa navegar no meio.
 */
export function useFocoDeTela(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;
    document.documentElement.classList.add('foco-exercicio');
    return () => document.documentElement.classList.remove('foco-exercicio');
  }, [ativo]);
}
