# F4 · Identidade visual

Substitui o estilo "Noturno" (preto absoluto, mascote gato, haltere, medalhas, tipografia
condensada em caixa alta, vocabulário de academia) por algo **moderno e simples, com o charme das
formas abstratas, em tema claro e tema escuro**.

**Direção escolhida: Campo** (decisão 2). O que resta aqui é a arte (F4-3) e os componentes
musicais (F4-4).

Roda **em paralelo** a todo o resto. Nada em F0–F3 depende daqui.

---

## F4-1 · 👤 Escolher a direção visual ✅ *Campo, escolhida em 02/11/2026*

**Bloqueia:** F4-2, F4-3, F4-4.

Produzir **2 ou 3 direções** completas o bastante para se decidir olhando, cada uma com: paleta nos
dois temas, tipografia, tratamento das formas abstratas, e uma tela de exemplo (a Praticar) e um
exercício.

O que já está decidido e qualquer direção precisa respeitar:

- **Tema claro e tema escuro, os dois de primeira classe.** Não é "o escuro é o de verdade e o
  claro é um favor".
- Moderno e simples; poucas distrações.
- Formas abstratas com charme — é o que o Paulo gostou nas referências.
- **Nada de academia**: sem haltere, medalha, mascote, "grupo muscular".
- Legibilidade de notação musical nos dois temas: pauta, teclado e braço precisam funcionar em
  fundo claro **e** escuro, o que o estilo atual não garante.

**Pronto quando:** o Paulo escolheu uma direção e ela está registrada como decisão em
[decisoes.md](../decisoes.md), fechando `A1`.

---

## F4-2 · Tokens e os dois temas ✅ *feita em 02/11/2026*

**Depende de:** F4-1.

- Reescrever as variáveis CSS de `src/index.css` como **tokens semânticos** (`--fundo`,
  `--superficie`, `--texto`, `--texto-fraco`, `--acento`, `--linha`…), não nomes de cor
  (`--bk`, `--mu`, `--co`, `--ve`).
- Definir a paleta clara em `:root`, redefinir só os tokens no bloco escuro, e permitir escolha
  explícita (claro / escuro / seguir o sistema) no Perfil.
- Remover a granulação (`--grain`) e o `skewX` dos chips e tags, se a direção escolhida não os
  mantiver.
- Teste ou verificação de contraste nos dois temas.

**Pronto quando:** trocar o tema no Perfil muda o app inteiro sem nenhum ponto de cor presa, e
nenhuma cor tem a única definição dentro de um bloco de tema.

---

## F4-3 · Arte nova

**Depende de:** F4-1. **Decisão de origem:** 2.

- Apagar `design/art.mjs` (463 linhas), `design/kit*.html`, `assets/`, `assets-noturno/` e
  `public/art/` (50 SVGs, 228 KB).
- Produzir a arte nova na direção escolhida: logo, ícone do PWA, emblemas de área (se a direção
  pedir), e as ilustrações que as telas realmente usarem — **não recriar 50 por recriar**.
- Se a arte continuar sendo gerada em código, manter o script e o `npm run art`; se for desenhada
  à mão, apagar o script e versionar os SVGs direto.

**Pronto quando:** não há nenhum asset do estilo Noturno no repositório e nenhuma tela mostra
imagem quebrada.

---

## F4-4 · Componentes musicais no visual novo

**Depende de:** F4-2.

`Staff`, `Keyboard`, `Fretboard` e `RhythmScore` em `src/components/music/` **ficam** — a lógica
está certa. O que muda é a aparência: cores por token, legibilidade nos dois temas, tamanhos de
toque adequados no celular.

**Pronto quando:** os quatro componentes ficam legíveis nos dois temas, num celular e num
computador, e nenhum deles tem cor escrita direto no código.
