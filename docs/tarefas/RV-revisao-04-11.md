# RV · A revisão de 04/11 — o lote executável

As tarefas desta frente saem da [revisão de 04/11](../revisao-04-11.md) e do que foi fechado com o
Paulo em 05 e 06/11. Os **ids são os mesmos da revisão** (`U2`, `B11`, `X3`…), de propósito: o
documento de lá é o contexto, este é o contrato.

> **A ordem abaixo é a ordem de execução**, e ela é por valor-por-esforço, não por tamanho.
> **Uma tarefa por commit.** Antes de cada commit, o que o CI roda:
> ```bash
> npm ci && npm test && npx tsc --noEmit -p tsconfig.app.json && npm run lint
> ```

> **A regra nº 1 vale aqui inteira.** Tudo marcado **👤** é decisão do Paulo e **não se decide
> dentro da tarefa**. Achou ambiguidade que este arquivo não resolve? **Pare e pergunte.**

> **Prioridade de escopo (06/11/2026):** o app está sendo feito **útil para o Paulo** antes de
> utilizável para o público. Buraco de produto que não atrapalha o uso dele amanhã: **anote, não
> conserte de passagem.**

---

## U2 · Contraste do tema escuro

**Tamanho:** trivial. **Diagnóstico é do Paulo**, e está certo.

Os dois cinzas de texto do tema escuro passam em AA raspando e por isso *parecem* apagados:

| Token | Hoje (escuro) | Contraste sobre `--surface` |
|---|---|---|
| `--ink-soft` | `#a39b92` | ~4,7:1 |
| `--ink-faint` | `#8a837c` | ~4,0:1 |

Clarear os dois. Sugestão de partida: `--ink-soft: #c4bcb2` (~9:1), `--ink-faint: #a69e94` (~6,6:1).

⚠️ **Os dois moram em DOIS lugares** em `src/index.css`: dentro de
`@media (prefers-color-scheme: dark)` e dentro de `:root[data-theme="dark"]`. Mudar um só deixa o
bug vivo para metade dos usuários — é a armadilha que o cabeçalho do arquivo descreve.

**Pronto quando:** `--ink-soft` dá ≥ 7:1 e `--ink-faint` ≥ 4,5:1 sobre `--surface` **e** sobre
`--ground`, nos dois blocos escuros, e o tema claro não mudou.

**Não faça:** mexer no tema claro. Mexer no `--ink`. Inventar token novo.

---

## B11 · Os campos granulados: visíveis no escuro, e animados

**Tamanho:** média. **Componente:** `Field`, em `src/components/ui.tsx`.

Duas coisas na mesma superfície.

### a) Eles somem no escuro

É isto que o Paulo chamou de "quadrados vazios". No tema escuro os dois gradientes do campo são
`rgba(179,67,31,0.42)` e `rgba(90,42,112,0.22)` sobre um fundo quase preto — nos cards pequenos
(instrumento, no onboarding) não sobra quase nada e a caixa lê como **vazia**, não como decoração.

Reforçar o campo no escuro até ele ler como forma. Mexer em `--field-1`/`--field-2`, não no
componente.

### b) Eles passam a se mover lentamente

Pedido do Paulo: *"fazer com que os shapes granulados fossem todos animações que vão mudando
lentamente"*.

**Como, sem custar quadro:** os gradientes vão para um **pseudo-elemento maior que a caixa**
(`inset: -25%`), e anima-se **só `transform`** — deriva e rotação, um ciclo de 40 a 60 s, fases
diferentes por `seed` para dois campos lado a lado não pulsarem juntos. `transform` roda no
compositor e não repinta; animar `background-position` nos ~20 campos de uma tela, sim.

**Obrigatório:** `@media (prefers-reduced-motion: reduce)` desliga a animação por completo.

**Pronto quando:** num card de 44 px no tema escuro o campo é visivelmente uma forma colorida, e
não uma caixa vazia; a animação roda sem `background`/`layout`/`paint` no perfil do navegador; e
com `prefers-reduced-motion` ela não existe.

**Não faça:** animar `background-position`, `filter` ou `opacity` do elemento inteiro. Pôr campo
onde não havia. Mexer na regra da direção Campo — ele é **fundo e emblema, nunca botão ou ícone**
(está no cabeçalho de `src/index.css`).

**👤 A velocidade e a amplitude são estéticas.** Entregue conservador (lento e sutil); o Paulo
ajusta vendo.

> ⚠️ A outra metade do `B11` original — *"textos inúteis sob títulos"* — **fica fora desta
> tarefa.** Não deu para identificar quais textos nos prints, e apagar texto por palpite é
> decisão de produto. Perguntar ao Paulo com print apontando.

---

## X3 · Audiação — a família nova

**Tamanho:** grande. **É o maior buraco do catálogo para o uso diário do Paulo.**
**Fechado em grelha, 05–06/11.** Leia a § 2.2 e o `X3` da [revisão](../revisao-04-11.md).

**Um item só, e ele precisa de tela.** Não são cinco itens.

| | |
|---|---|
| **O ciclo** | mostra/toca o estímulo → **você audia** → **você clica** para ouvir o gabarito → confere |
| **O ritmo é seu** | ⚠️ **não é por tempo.** Com tela na mão, o botão é que revela. Nada de contagem regressiva |
| **O app não ouve** | sem microfone nesta rodada. Nem atrás de flag |
| **O app não pergunta se você cantou** | audiar é imaginar; cantar é o que a pessoa faz se o lugar deixa. Mesma lógica do § 6b |

**Os estímulos, como parâmetro do item.** Nesta tarefa, **só os dois primeiros**:

1. **(a) a partir de uma referência** — soa a referência, o enunciado pede um intervalo, uma escala
   ou um arpejo. *Construir primeiro: não precisa de superfície visual nova.*
2. **(d) sequência de graus** — reusa o material do `ouvido-celulas`.

*(b) ler melodia → audiar* e *(c) ver padrão no braço → audiar* **ficam fora**: (b) espera o
gerador de partitura do `X6`, e (c) depende do `M5`.

**A referência e o drone:** a referência **sempre soa** (é o exercício). Drone contínuo é **opção,
desligada por padrão** — ligado, ele dá o centro tonal de graça e facilita demais. O motor de drone
já existe em `src/audio/engine.ts`.

**A autoavaliação, depois de revelar:** pergunta **toda vez** neste item (o Paulo quer ver como
fica), em **um clique fácil**. E é **desligável**:

- o **interruptor é global**, no Perfil, junto de som/tema/idioma — quando incomodar, vai incomodar
  como comportamento, não num exercício só;
- **começa ligado**, e a preferência fica salva;
- a **frequência** é por exercício: audiação pergunta sempre, `tecnica` e `no-instrumento` seguem
  perguntando de vez em quando como hoje.

**No mãos livres.** O mãos livres é **o compilador de tudo que é sem tela** — um gerador de
conteúdo tipo podcast para estudo, com uma porta de entrada só: a pessoa abre, marca o que quer
incluir, dá play. Audiação entra lá como **fonte** em `FONTES`, e **nessa versão o gabarito volta a
ser por tempo**, porque sem tela não há botão.

**Pronto quando:** o item existe, gera as duas famílias de estímulo, revela por clique, registra
autoavaliação, respeita o interruptor global; a fonte de audiação aparece no mãos livres com
gabarito temporizado; e o item está listado em [revisao-pendente.md](../revisao-pendente.md) pelo
id entre crases — **há teste que falha se faltar**.

**Não faça:** microfone. Temporizar o gabarito no item com tela. Construir (b) ou (c). Publicar —
**nasce `RASCUNHO`** (decisão 91); nunca escreva `publicado`.

**👤 Em aberto para o Paulo:** o nome do item e dos dois estímulos na interface.

---

## M5 · Portar o gerador de formas para TypeScript

**Tamanho:** grande, mas **totalmente especificado** — é a tarefa mais mecânica do lote.
**Fonte:** [`docs/doado/gerador_arpejos_baixo.py`](../doado/) e o teste ao lado.

Destrava o `M1` (o ciclador) e a rotina de tonalidade do Paulo.

**Portar os 21 testes PRIMEIRO**, depois o motor até eles passarem. O arquivo de teste doado é a
especificação executável: ele cobre as quatro famílias de escala × sete rotações com grafia
correta, a construção por graus e por fórmula cromática, e a busca de digitações por backtracking.

**Duas decisões do Paulo que o port tem de preservar** (e cada uma tem teste lá):

1. **Corda solta não conta no vão da mão** (`_fret_span_ok`).
2. **Vão padrão 4** para acorde/voicing, **5** para arpejo.

**Onde mora:** `src/theory/` — **nada ali importa React** (regra do projeto). Grafia correta por
tonalidade é de `src/theory/core.ts`; não contorne (em Fá maior é Si♭, nunca Lá♯).

**Pronto quando:** os 21 testes portados passam, e `npx tsc --noEmit` fica limpo.

**Não faça:** tela. Item de catálogo. Sugerir dedos — o motor mostra **formas**, não digitações
(decisão A21). Mexer em `src/theory/core.ts`.

---

## B4 + X9 · Construir intervalo: consertado **e** movido

**Tamanho:** média. ⚠️ **São a mesma tarefa, de propósito** — não conserte o modo dentro do
`ache-a-nota` para depois removê-lo de lá.

Hoje o modo "intervalo a partir de uma nota" do `ache-a-nota` está quebrado: braço vazio, som
estranho, e o gabarito mostra todas as posições sem dizer qual nota era (`B4`).

Ele **sai do `ache-a-nota`** e vira **o par de `que-intervalo-e-esse`** — mesma habilidade, duas
direções (é a classificação objeto × tarefa que o catálogo já tem).

Enquanto move:

- **sem seletor de intervalos** (personalização tem limite — regra nova desta revisão);
- **enarmônicos contam**: quinta aumentada ≠ sexta menor;
- **validar o acidente certo**: a quinta de Si é Fá♯, não Sol♭;
- opção de ver **o nome**, **a posição**, ou os dois.

**Pronto quando:** o modo quebrado não existe mais no `ache-a-nota`; o novo item responde nas
superfícies que declara; há teste cobrindo os dois enarmônicos e o acidente por tonalidade.

**Não faça:** deixar o modo antigo para trás "por compatibilidade". Tocar na migração de ids sem
ler `src/state/migrate.ts` — rotina e histórico de quem já usa apontam para ids.

---

## M4 · Metrônomo em grade única

**Tamanho:** média. **Aprovado pelo Paulo** ("boa, pode ser").

Hoje há um conflito: "escolher quais tempos tocam" e "escolher a subdivisão" são dois controles que
brigam. Eles viram **um**.

**A grade:** a subdivisão **é o tamanho da grade**. Cada posição liga e desliga **independente**, e
**o acento é propriedade da posição**. Isso resolve de graça três coisas que hoje não dão:

- tocar só 2 e 4;
- **1/1 sem acento**;
- silenciar uma posição dentro de um tempo (o "e" do tempo 2), hoje impossível.

Mais: **±1 bpm** (hoje o passo é 4), e **tocar um compasso e silenciar o próximo** (e as
extrapolações: dois e dois, três e um).

**Onde mexe:** `Metronome`, em `src/tools/common.tsx`. O relógio é o de
`src/audio/engine.ts` — **`setTimeout` não serve para música**, e desde o `B1` o `Clock` já espera
o contexto de áudio sair de `suspended`.

**Pronto quando:** a grade liga/desliga por posição, o acento é da posição, ±1 bpm funciona, e o
ciclo de compassos silenciados tem teste.

**Não faça:** manter os dois controles antigos "por enquanto". Relógio novo.

---

## X8 · Achar nota no instrumento, reformado

**Tamanho:** média. Especificação fina do Paulo, na [rotina dele](../rotinas-do-paulo.md).

- **automático, nota a nota**, com tempo configurável entre uma e outra;
- som e gabarito visual **opcionais**;
- **botão de pular**;
- ⚠️ **o gabarito mostra TODAS as posições daquela nota.** Hoje o exercício impõe uma resposta
  certa onde existem várias — é o defeito central, não um detalhe.

**Fica para depois do `M1`** (e **não** entra nesta tarefa): tocar todas as instâncias da nota
**uma corda de cada vez** (para não usar a memória geométrica da oitava), e o aviso de troca com o
metrônomo mudando no último compasso (`1115`). Os dois dependem do ciclador.

**Pronto quando:** o avanço automático respeita o tempo configurado, o pulo funciona, e o gabarito
lista todas as posições da nota no braço declarado.

**Não faça:** construir o ciclador por dentro desta tarefa.

---

## P9 · Ciclo de rotinas

**Tamanho:** grande. **O nome é do Paulo e está fechado: "ciclo de rotinas".**

A rotina de ônibus dele é grande demais para um dia — ele mesmo notou. A saída é **ciclar entre
várias**: abre o ciclo, faz a que está há mais tempo sem fazer, e se não estiver a fim, pula.

**O que marca uma rotina como "feita"** (fechado em 06/11): **qualquer tempo praticado conta, com
piso de uma etapa fechada.** Não é "terminar todas as etapas" (severo demais para ônibus — a
abandonada ficaria eternamente no topo) nem "abrir" (abriu por engano, reordenou o ciclo). O app já
grava atividade por etapa; o dado existe.

**A tela é um carrossel** (pedido do Paulo, 06/11): as rotinas **lado a lado**, e você avança e
volta **girando ou clicando nas outras** — não com botões de "próxima/anterior". *"O carrossel dá a
ideia de ciclo mesmo."*

Caminho recomendado: `scroll-snap-type: x mandatory` com `scroll-snap-align: center` — ganha o
gesto de arrastar no celular de graça —, mais `transform: scale()` e opacidade nas laterais para a
do meio se destacar, e `scrollIntoView({ behavior: 'smooth' })` ao clicar numa lateral. Respeitar
`prefers-reduced-motion`.

**Pronto quando:** o ciclo ordena pela mais antiga sem praticar, uma etapa fechada reordena, o
carrossel arrasta no toque e centraliza no clique, e há teste da ordenação (função pura, separada
da tela).

**Não faça:** carrossel 3D com rotação de perspectiva — o risco de quebrar no celular não paga.
Botões de avançar/voltar como mecanismo principal. **Nada de "você está há X dias sem fazer"** —
isso é cobrança, e cobrança está na lista do que nunca entra.

**👤 Em aberto:** o texto da tela e como o ciclo se cria/edita.

---

## X1 · Leitura rítmica — a metade mecânica

**Tamanho:** média. ⚠️ **Metade de propósito.**

É alta prioridade do Paulo e está na rotina de ônibus. **Esta tarefa faz só a parte mecânica:**

- **ligaduras**;
- **sortear o bpm** a cada exercício, ±10 a 30, com **teto baixo**;
- **volume separado** para o metrônomo e para o exercício;
- **desligar a coloração**;
- preset **"8 posições, 2 notas"**;
- células aditivas das quatro famílias: **binária, ternária, quaternária, pontuadas**.

⚠️ **Fica FORA:** *"mudar os parâmetros a cada rodada"*. É ele que decide se o exercício fica vivo
ou só aleatório — e aleatório é pior que estático. Vai ser grelhado junto com o `X6b`, que tem o
mesmo problema.

**Pronto quando:** as quatro famílias de célula geram compasso válido (o teste de soma por fórmula
de compasso já existe em `src/theory/rhythm-gen.test.ts` e tem de continuar passando), o bpm
sorteado respeita o teto, e os dois volumes são independentes.

**Não faça:** variação entre rodadas. Gabarito sonoro em exercício de leitura — **no estudo de
leitura o gabarito sonoro faz usar o ouvido no lugar dos olhos** (é o aviso do `X2`, e vale aqui).

**👤 Se a granularidade das quatro famílias não bastar** para gerar as células, **pare e pergunte**
— a tabela detalhada está com o Paulo, não neste arquivo.

---

## O que **não** está neste lote, e por quê

| | |
|---|---|
| `M1` o ciclador | 👤 **decidido que é modo, não item** (06/11), mas o desenho fica para depois do `M5` |
| `X1` variação por rodada · `X6`/`X6b` gerador | precisam de grelha — é o que decide se fica vivo ou aleatório |
| `X2` deslocamento · `X5` progressões · `X7` · `X11` · `X12` · `X13` | fila de depois |
| `P1` montar sessão · `P2`/`P3` · `P4` · `P10`–`P13` | 👤 abertos |
| porta "teoria" · Aulas · notas curtas | **esfera "público"**, adiada de propósito em 06/11 |
| `P14` (4º item) | 👤 faltam os textos exatos |
| `M3` voz do mãos livres | **espera o Paulo testar a voz no aparelho dele** — se não houver voz pt instalada, a tarefa muda de natureza |
| `U3`–`U5`, `U10`, `U11` | esperam print apontando |
