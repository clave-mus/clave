# Visão do Clave

Este documento é a **fonte de verdade do produto**. Quando código, tarefa ou decisão discordarem
dele, ele vence — ou ele é alterado de propósito, numa conversa, por quem é dono do produto.

Escrito a partir do documento de visão do Paulo (02/11/2026) e da sessão de descoberta da mesma
data. Substitui integralmente a versão anterior de `docs/decisoes.md`, que foi gerada sem
planejamento humano e não deve ser usada como referência.

---

## O que é o Clave

**Um ambiente onde a pessoa monta a sua rotina de estudo musical e a executa** — com exercícios
que ela configura até caberem exatamente no que precisa praticar.

A frase importa pelo que ela deixa de fora. O Clave **não se vende como "tudo num lugar só"**.
Agregar ferramentas é fácil de copiar e já foi feito: existem catálogos de percepção auditiva
maduros e visualizadores de braço bons. Conveniência de agregação não segura ninguém.

O que nenhum deles faz é deixar a pessoa dizer *exatamente* qual exercício quer, com quais notas,
em qual tonalidade, em qual região do braço, com qual timbre — salvar isso, e encadear numa rotina
que ela repete e adapta. Produto fechado não expõe parâmetro. É nessa fresta que o Clave existe.

### A ordem das três camadas

1. **A rotina é a identidade.** É o objeto central do produto. Tudo — ferramenta, exercício,
   teoria, histórico — só ganha sentido dentro de uma rotina.
2. **A configurabilidade é o mecanismo.** É o que torna a rotina *sua* e não um curso pronto.
   Ninguém acorda querendo configurar; configurar é meio, não fim.
3. **A profundidade pedagógica é a prova de seriedade.** Exercícios que um professor de verdade
   passaria, não os cinco que todo app tem.

---

## O princípio-mestre

> **Estrutura sem rigidez. Maleabilidade sem deixar a pessoa perdida frente a infinitas
> possibilidades.**

As duas metades brigam entre si em quase toda tela, e é nessa briga que o Clave se ganha ou se
perde. Toda decisão de interface precisa responder: *isto adiciona estrutura sem engessar?* e
*isto adiciona liberdade sem desorientar?*

Os princípios que derivam dele:

- **Autonomia** — a pessoa decide o que estudar e como. O app não monta a sessão por ela.
- **Personalização** — ferramentas e exercícios se adaptam à necessidade de cada músico.
- **Flexibilidade** — nenhuma rotina rígida, nenhuma metodologia única imposta.
- **Integração** — reunir dimensões do estudo musical no mesmo ambiente.
- **Simplicidade** — ferramentas completas sem distração nem complexidade desnecessária.
- **Evolução contínua** — o Clave cresce a partir do uso real e do retorno da comunidade.

---

## Os dois regimes de prática

O Clave atende duas situações que exigem posturas opostas. Projetar para uma e espremer a outra
é o erro mais caro possível aqui.

| | **Sem o instrumento** (ônibus, trajeto, espera) | **Prática focada** (30–60 min, quase diária) |
|---|---|---|
| A ordem importa? | Não | Sim |
| O cronômetro importa? | Não | **Sim — é o que impede sair tocando coisa aleatória** |
| Terminar importa? | Não | Mais ou menos |
| O que a pessoa quer ao abrir | "meus exercícios do momento, já configurados" | "me conduz por 40 minutos" |

O dado por baixo é **idêntico** nos dois casos: uma lista de exercícios com os parâmetros
escolhidos. O que muda é a **postura da execução** — ver "Modos de execução" abaixo.

---

## Público

**Instrumentistas de nível iniciante-avançado a intermediário** que estudam de forma independente
e querem uma prática mais intencional, flexível e personalizada.

**Fora de escopo:** iniciantes absolutos. O Clave não é curso do zero, e se vender como tal
afastaria quem já sabe algo.

**Instrumentos: baixo, violão/guitarra e piano, todos no beta** (decisão 48). O baixo vai ficar
mais bem trabalhado que os outros, e tudo bem: **o beta é o começo de uma expansão, não o produto
final.** Com guitarristas e pianistas usando, vem o retorno que hoje falta.

O piano tem **trilha própria**, não é só superfície (decisão 50) — e sai mais barato do que parece,
porque cerca de 60% do catálogo é agnóstico de instrumento e já serve a ele.

Pauta, teclado e braço continuam sendo **superfícies de resposta disponíveis a qualquer pessoa**:
um baixista pode querer responder vendo um teclado.

---

## Os objetos do Clave

### Item de catálogo

**Um bom exercício é um que ajuda o músico a praticar de forma eficaz** — não um que o app
consegue conferir, nem um que o app faz melhor que um papel. Exercício simples pode ser
poderosíssimo. Se o Clave só serve para instruir e mostrar um cronômetro, está bom: o valor está
na rotina, não no átomo. Por isso "o Clave acrescenta pouco a este" nunca corta um item — faz ele
entrar como **preset de um motor existente**, e não como tela nova.

Cada item é classificado por **objeto musical** e **tarefa**, os dois no plural. Ver
[catalogo.md](catalogo.md).

Exercício e ferramenta são **o mesmo tipo de objeto**. Todo item declara classificação, requisitos
de contexto, parâmetros e tipo de término. O que varia é quem desenha a tela.

Isso evita duas implementações do mesmo braço virtual — uma para "explorar" e outra para
"identificar" — e permite que o metrônomo entre numa rotina sem exceção no código.

### Preset

Configuração salva de um item. **É o que dá valor à rotina:** "Intervalos, só 3ªs e 6ªs, só
ascendente, timbre de piano, duas oitavas" a um toque de começar. Sem preset, uma lista de
exercícios é uma pasta de favoritos.

### Etapa

Uma etapa é um **conjunto de instâncias** (item + configuração). Um conjunto de uma instância é
uma etapa comum; com mais de uma, a etapa **cicla** entre elas a cada execução — que é como a
rotina ganha variação sem deixar de ser a mesma rotina.

### Rotina

Lista ordenada de etapas, com parâmetros próprios que as etapas **herdam** (tonalidade,
instrumento, afinação, andamento), com substituição explícita e visível.

### Conjunto de rotinas

Organização de várias rotinas num ciclo, como treino ABC: um dia com foco em ritmo, outro em
percepção melódica, outro em leitura. Faz sentido para rotinas guiadas; não faz para as livres.

---

## Modos de execução

Uma rotina, **dois modos**, guardados na própria rotina:

- **Livre** — as etapas aparecem como cartões; a pessoa toca em qualquer uma, fica o tempo que
  quiser, sai e volta. O cronômetro existe mas fica quieto. A ordem é sugestão visual, não trilho.
- **Guiado** — etapa atual em primeiro plano, tempo sugerido visível, "próxima" em destaque,
  lista compacta das etapas ao lado.

Nos dois: pular para qualquer etapa, esconder o cronômetro, pausar. **O modo é postura padrão, não
jaula.** Há também a opção de **embaralhar** a ordem das etapas.

**"Tempo total" só existe no modo guiado.** Somar os tempos de uma rotina livre seria mentira.

## Rotação de parâmetro

Uma rotina pode ter **um** parâmetro em rotação: uma lista de valores, uma posição atual, e um
histórico de visitas (que valor, quando, quantas sessões). **O avanço é manual por padrão.**

É o que permite *morar numa tonalidade por uma semana* e atravessar várias frentes dentro dela —
notas no braço, regiões, modos, harmonia, vocabulário — e só então passar para a próxima. Avanço
automático quebraria exatamente isso: **quem sabe se internalizou é a pessoa.**

Rotacionam: **tonalidade · região do braço · corda · modo · qualidade de acorde.** Nada mais, para
a rotina não virar um painel de opções.

E o **conjunto de rotinas** (o ciclo ABC) é o mesmo mecanismo com a lista sendo de rotinas em vez
de valores. Uma lista, uma posição, uma regra de avanço — um recurso, não dois.

---

## Tipos de término

O tipo é **propriedade do item no catálogo**, não escolha de configuração. Ele determina o que
aquela etapa consegue afirmar.

| Tipo | Termina quando | O que produz |
|---|---|---|
| **Série** | atinge N perguntas, ou N corretas seguidas, ou o tempo acaba — o que vier primeiro | **evidência**: tentativas com validação determinística |
| **Ambiente** | a pessoa para; a duração sugerida apenas informa | **atividade**: tempo e configuração, sem nota |
| **Tarefa** | a pessoa declara: *consegui / consegui com ajuda / preciso repetir* | **autoavaliação**, marcada como tal — nunca como acerto |

Em todos, **o avanço é manual** e o cronômetro informa sem bloquear ("tempo sugerido atingido",
discreto). Nada de avanço automático.

### Validação é escolha, não imposição

**O item declara quais modos de validação aceita; a pessoa escolhe.** O padrão é **autoavaliação**,
com a tela mostrando o material. Microfone é acréscimo opcional, nunca requisito — nem sempre a
pessoa tem instrumento, microfone ou silêncio.

---

## Contexto: o que cada item exige

Três requisitos são **declarados** no catálogo, porque são fato do mundo:

- `instrumento` — precisa do instrumento em mãos
- `microfone` — precisa captar som
- `voz` — precisa cantar ou vocalizar

Três são **deduzidos** pelo motor, para não desatualizarem:

- `olhos` — o visual é só som, ou tem algo na tela?
- `mãos` — existe superfície de resposta?
- `áudio` — a pergunta toca alguma coisa?

Daí saem os contextos que a pessoa escolhe:

| Contexto | O que entra |
|---|---|
| **De bolso** | nada de olhos, mãos, voz, instrumento ou microfone — só ouvido. Hoje: treinamento auditivo hands-free e imaginar-e-conferir. Contexto quase vazio, e tudo bem. |
| **No ônibus** | olhos e mãos liberados; sem instrumento, microfone ou canto. É onde mora quase tudo. |
| **Em silêncio** | sem áudio — leitura na pauta, braço, quiz de teoria. Para quem esqueceu o fone. |
| **Com o instrumento** | tudo liberado. |
| **Posso cantar** | libera solfejo e afinação vocal. Marcador ortogonal aos demais. |

---

## Variação automática de dificuldade

O app observa, **propõe em linguagem clara**, e a pessoa aceita ou recusa:

> *"Você acertou 17 de 20 em 3ªs e 6ªs nas últimas duas sessões. Quer incluir mais intervalos?"*
> — com **todas** as opções listadas, duas ou três pré-marcadas como "costuma ser o próximo
> passo", e a pessoa marca o que quiser.
>
> **Incluir · Agora não · Não sugerir neste exercício**

**Não existe escada rígida.** Forçar progressão linear onde a ordem é variável é erro pedagógico.
O catálogo carrega, no máximo, uma **dica de dificuldade relativa por opção** — usada só para
pré-marcar, nunca para bloquear ou ordenar.

Quatro guardas, cada uma com um motivo:

- **Nunca durante a prática.** Só no fim de uma série ou ao abrir as configurações. Interromper
  quem está praticando para oferecer configuração é literalmente desorientar a pessoa.
- **Piso de evidência.** Nada de sugerir com 6 respostas; mínimo de tentativas em pelo menos duas
  sessões diferentes.
- **A escada desce também.** Se a pessoa despencou no degrau novo, o app oferece voltar — sem
  drama, sem "você regrediu".
- **Limiar numa constante única**, e **toda sugestão registrada com aceite/recusa**, para o beta
  calibrar o número em vez de a gente adivinhar.

Aceitar a sugestão **altera o preset** daquela etapa, para aquela pessoa. Sugestão **nunca altera
rotina publicada pelo time**: ao adotar uma rotina do time, a pessoa fica com uma cópia sua.

**Recorte do beta: por exercício, não por habilidade.** Progressão por habilidade é a ideia mais
forte e fica guardada para depois — afirmar transferência de habilidade sem dado é irresponsável.

---

## Progresso: deliberadamente discreto

O Clave é **plataforma de estudo séria, não jogo**. Progresso **não é aba** — vive dentro do
Perfil e dentro de cada exercício e rotina. Quem quer, vê; quem não quer, nunca esbarra.

- **Fora:** badges, streaks, XP, níveis, ranking, percentual de domínio, celebração de recorde,
  qualquer comparação entre pessoas.
- **Medida principal: tempo estudado.** É honesta justamente por ser modesta — não afirma domínio,
  não compara, não premia.
- **Nunca misturar** atividade, autoavaliação e evidência validada. Tocar no instrumento sem
  validação é **atividade**, nunca evidência de aprendizagem.
- **Sempre mostrar a quantidade de tentativas** junto de qualquer proporção.

### bpm não é pontuação

Aumentar o metrônomo é a métrica mais fácil de medir e uma das piores de perseguir: muita coisa só
se aprende devagar, e transformar bpm em recorde ensina a pessoa a tocar rápido e sujo.

O app **registra em que andamento a pessoa praticou**, como contexto útil para ela mesma ler
depois. Não mostra recorde, não sugere o próximo degrau, não celebra.

---

## O registro de tentativas é infraestrutura interna

Cada resposta vira um registro imutável com o que foi testado, o que foi perguntado, os parâmetros
em vigor, a resposta estruturada, o resultado e o tipo de validação.

Ele **não existe para alimentar tela de progresso**. Existe por dois motivos:

1. **A variação automática é impossível sem ele.** Para o app dizer "você acertou 17 de 20 em 3ªs
   e 6ªs nas últimas duas sessões", alguém precisa ter guardado o quê e o como.
2. **É como o time descobre que um exercício está quebrado ou mal calibrado.**

---

## Monetização

No beta: **nada**. Doação opcional por Pix e por uma plataforma internacional (Ko-fi ou
equivalente), já que o app sai em português e inglês.

Sem anúncios — trocaríamos público por centavos. Sem plano pago, sem selo, sem infraestrutura de
assinatura. Se um dia houver modelo pago, o princípio guardado é: **vender profundidade, não a
possibilidade de estudar.** Tonalidade, andamento e dificuldade nunca ficam atrás de pagamento —
são o que torna um exercício adequado à pessoa.

---

## Idiomas

**Português e inglês** desde o lançamento. As cifras seguem a convenção de cada idioma (C7M e
Cm7(♭5) em português; Cmaj7 e Cm7♭5 em inglês), e as frases do quiz de teoria são montadas com a
gramática de cada idioma, sem tradução literal. **Espanhol fica para depois.**

---

## Identidade visual

**Moderna e simples**, com o charme das formas abstratas. **Tema claro e tema escuro**, os dois
de primeira classe. Poucas distrações.

A metáfora de **academia está descartada** — foi decisão inicial mal planejada que vazou para
treze arquivos e para a arte inteira. Nada de "grupo muscular", halteres, medalhas ou
"Clave: academia musical".

Direção ainda em aberto, a ser decidida vendo propostas e não lendo descrição.

---

## Plataforma

**Web primeiro** (site e PWA), com React, para depois virar app de iOS e Android a partir do mesmo
código. Se a latência de áudio virar problema, só o módulo de áudio vira plugin nativo.

---

## Fora de escopo, declarado

Para não reabrir a cada conversa:

- **Mentor com IA** — definitivo, não entra.
- **Iniciantes absolutos** e trilhas de curso completas.
- **Música gerada por IA** em qualquer forma, incluindo backing tracks.
- **Visão computacional** para ver o que a pessoa está tocando — ideia boa, projeto à parte.
- **Aprender repertório e músicas** como foco da plataforma. Temas de jazz e erudito são expansão
  futura plausível, não beta.
- **Análise de erros com direcionamento personalizado** e qualquer rótulo sobre a pessoa.
- **Ranking**, em qualquer forma, em qualquer fase.
