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

## F4-3 · Arte nova ✅ *feita em 02/11/2026 — Campo puro*

**Depende de:** F4-1. **Decisão de origem:** 2.

**O que foi feito.** O Campo, como direção, praticamente não pede ilustração: o campo de cor é o
único elemento decorativo. Então a arte não foi *substituída*, foi **trocada de natureza**.

- Entrou `<Field>` em `src/components/ui.tsx`: um bloco com dois gradientes radiais e granulação,
  com os centros derivados de uma **semente** (o id do módulo, do gênero, do instrumento). Cada
  item ganha um campo próprio e estável, **sem nenhum asset**. Ocupa os mesmos espaços de layout
  que as ilustrações ocupavam, então nenhuma tela ficou com buraco.
- Entrou `public/logo.svg`: a marca, o campo com a letra em negativo. Serve de favicon e de ícone
  do PWA.
- Saíram, por serem do estilo Noturno e não terem mais uso: `design/`, `public/art/` (50 SVGs),
  `assets/`, `assets-noturno/`, `kit.html`, `kit-noturno.html`, o sandbox de arte em `src/*.mjs` e
  `src/*.html`, e o script `npm run art`. Cerca de 1 MB.
- Saiu também o campo `art` de `ModuleBase`, `ToolDef`, `INSTRUMENTS`, `ROADMAPS` e `GENRES` — não
  existe mais asset por item, e deixar o campo sugeriria que existe.

**O mascote não se perdeu.** `design/art.mjs` era o **gerador**, não o resultado: as 50
ilustrações saíam dele. Enquanto o arquivo estiver no histórico, elas são regeneráveis:

```bash
git show <commit-anterior>:design/art.mjs > design/art.mjs
git show <commit-anterior>:design/build.mjs > design/build.mjs
node design/build.mjs      # regera public/art/
```

Se um dia o gato voltar, ele volta redesenhado na paleta Campo — ver a conversa de 02/11, em que
a opção escolhida foi "Campo puro por enquanto".

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
