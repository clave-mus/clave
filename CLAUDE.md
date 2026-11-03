# Instruções de trabalho neste projeto

## Regra nº 1: você não toma decisões de produto

Se a tarefa estiver ambígua, se faltar informação, ou se a solução óbvia **contrariar
[docs/visao.md](docs/visao.md)** — **pare e pergunte ao Paulo.**

Não escolha "um caminho razoável". Não resolva por conta. Não registre uma escolha sua como se
fosse decisão acordada do time.

> **Por que esta regra existe.** O `docs/decisoes.md` deste repositório teve duas versões
> anteriores, com 33 decisões escritas e justificadas, que o código seguiu com disciplina — e que
> **ninguém tinha tomado de propósito**. O resultado mais visível foi uma metáfora de academia que
> chegou ao título da aba, à navegação, aos textos e a cinquenta ilustrações, e que o dono do
> produto nunca escolheu. Em 02/11/2026 tudo isso precisou ser refeito.
>
> Decisão de produto se toma em conversa com o Paulo. Nunca dentro de uma tarefa.

O que **é** decisão de produto: escopo, o que entra e o que sai, taxonomia, nome de coisa que a
pessoa vê, metáfora, hierarquia de navegação, o que o app afirma sobre quem usa, e qualquer
"enquanto eu estava aqui, aproveitei para".

O que **não é**: nome de variável, estrutura de pasta, qual algoritmo, como testar.

## Antes de começar: ler nesta ordem

1. **[docs/visao.md](docs/visao.md)** — a fonte de verdade do produto.
2. **A decisão citada na tarefa**, em [docs/decisoes.md](docs/decisoes.md).
3. **A seção correspondente de [docs/arquitetura.md](docs/arquitetura.md)**.
4. A tarefa em [docs/tarefas/](docs/tarefas/), inclusive o **"Não faça"** dela.

Toda tarefa tem um **"Pronto quando"** verificável. Se o que você fez não satisfaz aquela frase,
a tarefa não está pronta.

## Antes de cada tarefa: avisar dificuldade e modelo sugerido

Antes de começar qualquer tarefa, avise com:

- **Dificuldade**: trivial / simples / média / difícil / muito difícil, com uma frase do porquê.
- **Modelo sugerido**: qual modelo equilibra qualidade e economia para *essa* tarefa, e por quê.

Guia de escolha:

- **Haiku** — mecânico e de baixo risco: renomear, formatar, mover código, specs já fechadas.
- **Sonnet** — a maior parte do trabalho: componentes React, testes, configuração, integração com
  APIs documentadas, correção de bug localizado. É o padrão de melhor custo-benefício.
- **Opus** — raciocínio longo ou ambíguo, algoritmos não triviais (DSP, detecção de altura),
  decisões de arquitetura, geração criativa (ilustração, copy, UX), ou qualquer tarefa onde errar
  sai caro de corrigir depois.

O usuário troca de modelo com `/model <nome>`; a sessão não troca sozinha. Para tarefas difíceis ou
caras, **avisar e esperar a decisão** antes de começar.

## Convenções deste código

- **O motor musical não conhece a tela.** Nada em `src/theory/` importa React.
- **Um item de catálogo é uma declaração, não uma tela.** Antes de escrever tela nova, veja se o
  que você quer não é **parâmetro ou modo** de um item que já existe — é a decisão 15, e ela é a
  única coisa que impede o catálogo de virar 60 telas.
- **O relógio do áudio não é o relógio da tela.** Use o agendamento com antecedência de
  `src/audio/engine.ts`; `setTimeout` não serve para música.
- **Motor duplicado é proibido.** Em particular, há **um** gerador de partituras (decisão 18) e
  **uma** implementação de braço virtual (decisão 17).
- **Nada de texto solto na interface.** Todo texto vai para `src/i18n/`, nos dois idiomas. Há teste
  que falha se faltar tradução.
- **Grafia correta por tonalidade.** Em Fá maior aparece Si♭, nunca Lá♯ — `src/theory/core.ts` já
  resolve isso. Não contorne.

## O que nunca entra

Sem perguntar, e nem com pergunta: badges, streaks, XP, níveis, ranking, percentual de domínio,
celebração de recorde, comparação entre pessoas, bpm apresentado como pontuação, qualquer rótulo
sobre quem usa ("você é intermediário"), mentor com IA, música gerada por IA.

A lista completa, com motivo, está no fim de [docs/visao.md](docs/visao.md).

## Geração de assets e tarefas criativas

Quando a tarefa envolver arte, ilustração, análise de imagem, texto de produto ou qualquer coisa
que dependa de julgamento estético: **sinalize e sugira Opus**. E lembre que a direção visual é
decisão do Paulo, tomada vendo propostas — não escolha paleta nem tipografia por conta.

## Rodar

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run lint
npm run build
```

Antes de tirar um PR do rascunho, rode o que o CI roda:

```bash
npm ci && npm test && npx tsc --noEmit -p tsconfig.app.json && npm run lint
```
