# Revisão de 04/11/2026 — o plano

O Paulo usou o app e escreveu uma revisão de ponta a ponta: interface, remoções, reformulações e as
**rotinas que ele quer usar amanhã**. Este documento é a tradução daquilo em tarefas.

> **Como usar.** As tarefas estão numeradas por trilha (`B` bug, `P` produto, `X` exercício, `M`
> motor, `R` rotina). A ordem de execução está na seção **"A fila"**, no fim — e ela é por
> **desbloqueio**, não por tamanho.
>
> **Quem implementa pode ser um modelo mais simples.** Cada tarefa diz o que é, onde mexe e como se
> sabe que ficou pronta. O que exigir julgamento musical ou de produto está marcado **👤** e **não
> deve ser decidido dentro da tarefa** — é a regra nº 1.

---

## 1. As decisões que esta revisão derruba

Três decisões nossas caem, e é melhor dizer isso em voz alta do que deixar o código contradizer o
documento.

### 1.1 A decisão 16 (fusão por superfície) estava errada — **parcialmente**

Fundimos onze itens em quatro porque "a mesma pergunta em superfícies diferentes é o mesmo
exercício". O Paulo, usando: *"essas superfícies são diferentes demais pro exercício ser o mesmo.
Pense: como a pessoa chegaria nesses exercícios? Ela pensaria: quero praticar leitura de partitura,
ou então: quero ficar melhor em reconhecer as notas no instrumento."*

**Ele está certo sobre a porta de entrada e nós estávamos certos sobre o motor.** A fusão foi boa
para o código (um motor, uma validação por superfície) e ruim para a navegação (um item que é três
coisas na cabeça de quem procura).

**O corte certo é outro:** separar **leitura** (pauta) de **instrumento** (braço/teclado), e dentro
de instrumento deixar a escolha ser **uma só** — pauta · teclado · baixo · violão —, em vez de
"braço" e depois "violão ou baixo".

Ver `P2`.

### 1.2 A decisão 105 já tinha caído; a 109 cai agora como regra de catálogo

Rotina é **sessão**: o que se faz de uma vez. E o Paulo foi além: **"montar uma sessão" é o principal
call to action do app**, e a sessão pode virar rotina depois. Isso muda a tela inicial inteira
(`P1`).

### 1.3 "Personalização tem limite"

Palavras dele, e é uma regra nova que vale para o catálogo todo:

> *"não tem porque personalizar dificuldade em um exercício tão simples — e isso serve de lição que
> podemos extrapolar: personalização tem limite. Exercícios fáceis demais não precisam de progressão
> assim."*

E o irmão disso, que aparece em **cinco** exercícios diferentes:

> *"opções que deveriam ser complementares estão sendo mutuamente exclusivas"*

Ver `P5` e `P6`.

---

## 2. O que ele vai usar — e o que falta

Esta é a parte que decide a fila. Ele listou o que praticaria **hoje**; abaixo está o que existe, o
que está quebrado e o que não existe.

### 2.1 Treino de ouvido no bolso (hands-free)

| O que ele quer | Estado |
|---|---|
| Podcast: enunciado → tempo → gabarito, sem tocar na tela | existe (`maos-livres`) |
| **Voz de verdade** | ⚠️ depende da síntese do navegador; **não verificado no aparelho dele** |
| Escolher vozes | ❌ |
| Quantas vezes repete o estímulo | ❌ |
| Graus mais devagar | 🐛 `B8` |
| Gabarito não colar no próximo enunciado | 🐛 `B8` |

### 2.2 Rotinas de ônibus (sem instrumento, com fone)

| Assunto | O que existe | O que falta |
|---|---|---|
| **Leitura rítmica** | `ritmo` | variabilidade de verdade (`X1`) — é **alta prioridade** dele |
| **Deslocar padrão** | `deslocamento-ritmico` (rascunho) | reformulação inteira (`X2`) |
| **Reconhecer de ouvido** | intervalo, acorde, escala, células | **progressões** (`X5`), **ordem variada de graus** (`X4`) |
| **Audiação** | ❌ **nada** | a família inteira (`X3`) — e é o maior buraco |
| **Mapear o braço no ônibus** | braço na tela | **ver padrão → audiar → conferir** (`X3c`) |
| **Teoria** | os cinco itens | quase todos saem (`P7`); fica intervalo em texto |
| **Leitura** | `leitura` (gerador) | **ler → audiar → gabarito** (`X3b`); gerador fraco (`X6`) |

> ⚠️ **A rotina de ônibus dele é grande demais para um dia** — ele mesmo notou. A saída que ele
> propôs é **ciclar entre várias**, e isso é um objeto novo que o modelo não tem: um **conjunto de
> rotinas** que lembra qual foi a última e oferece a mais antiga. Ver `P9`. 👤 **O nome é dele.**

### 2.3 Rotina com o baixo

Tudo aqui depende de **um motor que não existe**, e ele mesmo percebeu o padrão:

> *"note que esse padrão de exercício de embaralhar as coisas e pedir pro usuário tocar por X
> compassos e depois mudar pra outro acorde é bem recorrente"*

**É um motor só** (`M1`, *o ciclador*): sorteia ou embaralha uma lista de alvos, fica X compassos em
cada um, **avisa visualmente o próximo** e **sonoramente que a troca vem**, e mostra a forma no
braço. Com ele, viram configuração:

- arpejos por grau do campo (tríade e tétrade, subindo, descendo, os dois)
- digitações e posições variadas
- combinações de graus (1256 etc.) por grau do campo
- modos gregos com sequência sorteada de graus
- pentatônicas diatônicas à tonalidade

**O que falta além do motor:** 👤 **as formas e posições**, que o Paulo disse que vai listar
(*"aqui vou precisar elaborar e listar as posições e shapes"*). Sem elas o motor não tem o que
mostrar — é a mesma dependência da `FM-2`.

### 2.4 Jazz standards

Checklist por música, com passos fixos (cantar a melodia → tocar → tônicas → quintas → terças →
sétimas → arpejo sorteado → two-feel → walking). **É uma funcionalidade nova** (`P10`): manutenção de
repertório por checklist, sem banco de músicas.

---

## 3. Bugs — a trilha `B`

Em ordem de quanto atrapalham o uso.

| | O quê | Onde |
|---|---|---|
| **B1** | **Áudio quebrado na primeira vez**: baixo e violão tocam tudo junto, depois silêncio. Atinge vários exercícios | `audio/engine.ts` · `cordaPulsada` |
| **B2** | "Editar" na rotina do time leva a **404** | `Praticar`/`Sessao` → `/rotina/time:x` não existe no editor |
| **B3** | Voltar de um exercício **reseta o catálogo** para "por objetivo" | `Treinar.tsx` — o estado do seletor não sobrevive à navegação. **Conferir todos os links de volta** |
| **B4** | **Modo "intervalo a partir de uma nota" não funciona**: braço vazio, som bizarro, mostra todas as posições sem dizer a nota | `items/ache-a-nota.ts` |
| **B5** | Toggles de intervalo **em inglês** no idioma português | `helpers.ts` · `ACHAR` |
| **B6** | **Idioma padrão deve ser português** | `i18n` |
| **B7** | Slider do metrônomo erra no celular (sobe e desce) | `tools/common.tsx` |
| **B8** | Hands-free: **graus rápidos demais**, e o gabarito **cola no próximo enunciado** | `tools/MaosLivres.tsx` |
| **B9** | `maior com sétima maior` aparece como `com sétima maior` | `i18n` · `theory.chords` |
| **B10** | Rotinas de técnica: **visualizações bugadas, nenhuma para o baixo** → por ora **só texto** | `tools/Tecnica.tsx` |
| **B11** | **Quadrados vazios e textos inúteis** sob títulos (objetivos, metrônomo) empurram o conteúdo. **Varrer a plataforma** | várias telas |

## 4. Interface — a trilha `U`

| | O quê |
|---|---|
| **U1** | **Certo e errado muito pouco visíveis.** Padronizar **uma cor para certo e outra para errado** em todo o app, e mostrar o ✓ **também no acerto** (hoje só no erro) |
| **U2** | **Tema escuro sem contraste** — textos e desenhos |
| **U3** | **Pautas azuis** em alguns lugares e não em outros. A de "que ritmo tocou" é a boa: **padronizar por ela** |
| **U4** | Pautas **claras demais no tema claro** (leitura rítmica) |
| **U5** | Metrônomo **azul e ilegível** |
| **U6** | Catálogo em **masonry** (estilo pinterest), não em grade |
| **U7** | Botões de resposta de acorde **menores** e em **hierarquia de complexidade** (maior/menor primeiro, m7M por último) |
| **U8** | Lista de "tipos" de acorde **justificada** — hoje sobram itens sozinhos na linha |
| **U9** | Gerador de leitura no celular: opções grandes **empurram a pauta**; **cronômetro discreto** |
| **U10** | **Desenhos das claves feios** — refazer |
| **U11** | Técnica/deslocamento: quadrados vazios **pretos somem no fundo**; quadrados **mudam de tamanho** na subdivisão alternada |

## 5. Produto e estrutura — a trilha `P`

| | O quê | 👤 |
|---|---|---|
| **P1** | **"Montar uma sessão" vira o CTA principal.** A tela inicial pergunta *"como você quer praticar agora?"* (sai o "boa tarde"), e o fluxo pergunta **o que praticar, como você consegue praticar e quanto tempo tem** (ou livre). A sessão montada pode **virar rotina** | 👤 o fluxo |
| **P2** | **Separar leitura de instrumento no catálogo.** `que-nota-e-essa` e `ache-a-nota` viram pares: *na pauta* e *no instrumento*. Dentro de instrumento, **uma escolha só**: teclado · baixo · violão | 👤 |
| **P3** | **Áreas Teoria e Leitura separadas.** Leitura = tudo que é pauta. Teoria = o resto | 👤 |
| **P4** | **Agrupar pares opostos por habilidade.** "Reconhecer nota ↔ encontrar nota" e "reconhecer intervalo ↔ construir intervalo" são a mesma habilidade em duas direções. Não é um exercício só — é um **agrupamento** no catálogo | 👤 o nome |
| **P5** | **Varredura: opções aditivas que viraram exclusivas.** Confirmado em leitura rítmica (níveis), acordes de ouvido (suspensos) e "que ritmo é esse" (tercinas × semicolcheias). **Varrer todos** |  |
| **P6** | **Varredura: opções redundantes.** Tonalidade + material cromático dizem a mesma coisa; "região grave/média/aguda" não tem função clara em vários itens. **Varrer todos** |  |
| **P7** | **Remoções.** Aulas (todas, e os links sobre os exercícios) · `sustentar-e-cortar` · `legato-staccato` · os itens de teoria **menos** intervalos em texto | ✅ decidido |
| **P8** | "Rotinas do time" → **"Rotinas da comunidade"**. **Suas rotinas vêm antes.** Na rotina da comunidade, só **Começar**; "adotar" aparece depois | ✅ decidido |
| **P9** | **Ciclo de rotinas** *(nome dele)*: ciclar entre rotinas, oferecendo a que está há mais tempo sem fazer | ✅ |
| **P10** | **Checklist de repertório** (jazz standards), com passos fixos por música | 👤 |
| **P11** | **Nivelamento geral e por habilidade**, gerando rotina especializada | 👤 |
| **P12** | **Tags/etiquetas**: hoje não fazem nada visível. Repensar — e o filtro "só sem instrumento" precisa do par **"só com instrumento"** | 👤 |
| **P13** | Ferramentas (metrônomo, afinador, drone) **fora de Técnica**, em lugar próprio | 👤 |
| **P14** | Textos: *"Melhorar ritmo e groove"* → *"ritmo e pulso interno"* · *"Instrumento"* → *"Instrumento principal"* · *"que nota é a mesma tecla"* → *"enarmônica"* · nomes descritivos em `que-nota-e-essa`, `ache-a-nota`, `no-instrumento` | 👤 |

## 6. Exercícios — a trilha `X`

| | O quê | Tamanho |
|---|---|---|
| **X1** | **Leitura rítmica de verdade** (alta prioridade). Células aditivas (a tabela dele: binária, ternária, quaternária, pontuadas) · **ligaduras** · sortear bpm (±10–30, teto baixo) · **mudar parâmetros a cada rodada** · preset "8 posições, 2 notas" · volume separado · desligar coloração | grande |
| **X2** | **Deslocamento de padrão, reformulado.** Dois níveis (manual e automático) · o padrão **atravessa compassos** · metrônomo mais lento e **distinto** do padrão · opção de partitura · mais explicativo. ⚠️ **Não dar gabarito sonoro** — no estudo de leitura, o gabarito sonoro faz usar o ouvido no lugar dos olhos | grande |
| **X3** | **Audiação — a família inteira.** `a` solfejar intervalo/escala/arpejo a partir de uma referência → gabarito · `b` ler melodia → audiar → gabarito · `c` ver padrão no braço → audiar → gabarito · `d` receber sequência de graus → audiar · `e` audiar ritmo. **Validação por microfone é opcional e não é prioridade** | grande |
| **X4** | **Ordem variada de graus** nas escalas e modos: começa na tônica grave, sobe passando por todas, volta à tônica | média |
| **X5** | **Reconhecer progressões.** Tocar acordes dizendo nome e grau, depois perguntar · progressões de 4 compassos · **dicas progressivas** (revela um grau por vez) · inversões, extensões, empréstimo modal | grande |
| **X6** | **Gerador de leitura, reformulado.** A ferramenta antiga está em `docs/doado/leitura-partituras/` e tem os modos que faltam: padrões de escala (terças, quartas, zigue-zague, grupos, Hanon), arpejos com cifra, groove com *fill*, nota pivô, enclosures, e **posição do braço como filtro de notas**. Levar também as **âncoras de tempo** (mudar BPM sem reiniciar). ⚠️ **Não copiar a interface** — ver `X6b` | grande |
| **X6b** | **O problema de UX do gerador antigo**, nas palavras dele: *"era tão customizável que era difícil de usar"*. São ~60 controles, e **26 são pesos de 0 a 100**. O desenho proposto: **(1) preset primeiro, parâmetro depois** — a pessoa escolhe "síncopes em 4/4" e começa; **(2) peso vira lista de marcar** — o que a pessoa quer dizer é *quais figuras podem aparecer*, não a probabilidade de cada uma; o peso contínuo é ferramenta de especialista e vai para uma gaveta "avançado"; **(3) o que varia, varia a cada rodada** — em vez de a pessoa configurar vinte coisas, o exercício muda sozinho entre as rodadas (ele já pediu isso em `X1`) | média |
| **X7** | **Reconhecer o baixo**: acorde + nota grave, dizer que grau o baixo tocou | média |
| **X8** | **Achar nota no instrumento, reformulado.** Automático nota a nota, com tempo configurável · som e gabarito visual opcionais · botão de pular · **gabarito mostra TODAS as posições** (hoje impõe uma resposta certa onde há várias) | média |
| **X9** | **Construir intervalo, consertado e movido.** Sai de `ache-a-nota` e vira o par de `que-intervalo-e-esse` · sem escolha de intervalos · **enarmônicos** (quinta aumentada ≠ sexta menor) · validar o acidente certo (a quinta de Si é Fá♯) · opção de ver o **nome**, a **posição** ou os dois | média |
| **X10** | **Linhas suplementares como limite**, não como liga/desliga | pequena |
| **X11** | **Acordes: extensões e inversões** (nona, décima segunda…) | média |
| **X12** | **Jogo de arrastar**: 4 notas marcadas no braço/teclado e 4 peças com nomes para encaixar | média |
| **X13** | **Teoria dos modos**: *"lídio é um modo menor com quais alterações?"* e *"de qual grau do campo menor?"* — perguntar pelos **dois** campos | pequena |

## 6b. **Internalizar e Automatizar** — os dois modos do ciclador

Fechado com o Paulo em 05/11/2026. **Isto vale para a família do ciclador** — shapes de arpejo,
caminhos de escala, combinações de graus, modos — **e para mais nada.** Ele recusou
explicitamente leitura rítmica e técnica, e a recusa é boa: nos dois a camada de nomes não é o
ponto.

### O que são, e o que NÃO são

> **Atenção é finita, e os dois modos existem porque não dá para carregar as duas coisas ao mesmo
> tempo.**

| | **Internalizar** *(padrão)* | **Automatizar** |
|---|---|---|
| A atenção está em | **som e significado** — o nome, o grau, o intervalo, a qualidade do arpejo | **a mão** — destreza, regularidade, velocidade |
| O que se larga | nada; é por isso que é difícil | **o nomear**, de propósito |
| O que se ganha | a nota deixa de ser uma casa e vira um som com nome | a capacidade liberada vira velocidade |

**Nenhum dos dois é o modo fácil**, e isto precisa estar escrito porque a tentação de desenhar como
escada é grande. Nas palavras dele: *"solfejar enquanto toca é muito difícil, e essa é a prática
mais importante."* **Os dois são atenção plena, apontada para lugares diferentes.**

**A velocidade não define o modo** — ela é o que se **compra** ao largar o nome. Tocar rápido
solfejando é quase impossível; tocar devagar sem solfejar não serve para nada. As duas combinações
cruzadas são vazias, e é por isso que existem dois modos e não quatro.

**O gatilho de troca é a monotonia, não o desempenho.** *"Quando o modo zen se tornar monótono"* —
não "quando você dominar". Quem decide é quem pratica, e **isso não vira medida**.

### ⚠️ A assimetria que parece invertida e não é

| | Nomes das notas |
|---|---|
| **Internalizar** | **escondidos** por padrão, com um toque para conferir |
| **Automatizar** | **podem aparecer** — e há uma opção de ligar e desligar |

O modo cujo propósito **é** nomear **esconde** os nomes; o modo que **larga** o nomear pode
mostrá-los. Parece ao contrário e é exatamente certo:

- Em **internalizar**, mostrar o nome deixa a pessoa **ler em vez de produzir** — e destrói o
  exercício.
- Em **automatizar**, o nome é só contexto. Nas palavras dele: *"continua sendo legal ter uma noção
  do lugar das notas, só deixa de ser prioridade."* Não carrega nada, então mostrar não custa.

**Esconder em automatizar seria economia de tela, nunca mecânica** — ele foi explícito. A opção de
ver ou não ver fica.

### O app não verifica — e tudo bem

**Não há como saber se a pessoa está solfejando.** O que o app faz é **configurar em volta**: dar
tempo ou não, pôr metrônomo ou não, mostrar ou esconder os nomes. O modo é **um preset mais uma
declaração de intenção** — e o Paulo achou suficiente. Nomear a intenção é coisa que um app de
estudo consegue fazer, e cobrar não é.

### A tela muda de cor

Pedido dele: **cada modo tem a sua paleta**, com uma transição entre as duas. É o que torna o modo
perceptível sem precisar ler um rótulo.

Dois cuidados para quem implementar:

- **Cor não pode ser o único sinal.** O nome do modo fica visível junto — daltonismo, e também
  telas no sol.
- **Respeitar `prefers-reduced-motion`** na transição.
- ⚠️ Isto **multiplica a superfície de tema**, e o tema escuro já tem problema de contraste (`U2`).
  Resolver a `U2` **antes** de criar duas paletas novas, ou o problema nasce dobrado.

### Onde aplica — o teste

Duas condições, e as duas precisam valer:

> **(1) a pessoa está tocando** · **(2) há uma camada de nomes que dá para carregar ou largar**

| | |
|---|---|
| Shapes de arpejo, caminhos de escala, combinações de graus, modos | ✅ a família do ciclador |
| Leitura rítmica · técnica | ❌ recusado por ele |
| Achar nota no instrumento | ❌ o nome **é** a pergunta; largá-lo não deixa exercício |
| Hands-free e audiação | ❌ não há parte motora para descarregar |
| Teoria em texto | ❌ |

👤 **Fica em aberto:** se este par compartilha vocabulário com *guiado × livre* das rotinas, que é um
eixo parecido um nível acima. São conceitos diferentes (lá é a ordem das etapas; aqui é onde está a
atenção), então **provavelmente não devem compartilhar** — mas vale decidir de propósito.

---

## 7. Motores — a trilha `M`

| | O quê |
|---|---|
| **M1** | **O ciclador.** Embaralha ou sorteia alvos, fica X compassos em cada, avisa o próximo **visualmente** e a troca **sonoramente**, mostra a forma. É a base de **toda** a rotina de baixo dele. **Tem dois modos**, *Internalizar* (padrão) e *Automatizar* — ver § 6b, e leia antes de desenhar: a assimetria dos nomes das notas parece invertida e não é |
| **M2** | **Arquitetura de ajudas reutilizáveis** (ele listou): repetir o estímulo · mudar a velocidade **sem gerar outra questão** · separar o que soou junto · ouvir nota a nota · ouvir referência tonal · mostrar o visual · dica progressiva · revelar o gabarito. Hoje parte disso existe espalhada e sem contrato |
| **M3** | **Voz para o hands-free**: escolha de voz, velocidade, repetições do estímulo |
| **M5** | **Portar o gerador de formas** (`docs/doado/gerador_arpejos_baixo.py`) para TypeScript, com os 21 testes **portados primeiro**. Ele calcula modo → acorde por graus → **posições no braço**, e é o que destrava a `M1` e a `FM-2`. Preservar as duas decisões dele: corda solta não conta no vão, e vão 4 para voicing / 5 para arpejo |
| **M5b** | **Caminhos de escala.** Uma escala é um acorde com mais notas, para a busca: `kind: 'arpeggio'` + `direction: 'ascending'` com os 7 graus **já gera os caminhos de subir a escala no braço**. ⚠️ **O problema novo é explosão** — milhares de caminhos quase idênticos. A chave que os distingue é a **distribuição por corda** (3-3-2, 2-2-2-2…), que é como baixista e guitarrista já falam disso. Serve de dedupe **e** de filtro ("quero 3 notas por corda"). **Não sugerir dedos** — mostrar o caminho (`A21`) |
| **M5c** | **Extensões de escala**: dada uma posição âncora, que notas da escala alcançam **à esquerda, à direita, acima e abaixo** — sem deslocar a mão, e com um deslocamento. É outra pergunta sobre o mesmo índice de braço, não outro motor |
| **M4** | **Metrônomo reformulado**: ±1 bpm · escolher **quais tempos tocam** · tocar um compasso e silenciar o próximo (e extrapolações) · modo 1/1 sem acento. ⚠️ Há um conflito entre "escolher tempos" e "subdivisão" — 👤 resolver antes |

---

## 8. A fila

Ordenada por **desbloqueio**, não por tamanho. O que está em cima destrava o que está embaixo.

**Primeiro — tirar a areia da engrenagem** *(nada disso é grande, e tudo atrapalha todo uso)*
`B1` áudio · `B6` idioma · `B2` 404 · `B3` navegação · `U1` certo/errado · `B11` quadrados vazios

**Segundo — o ônibus, que é onde ele estuda todo dia**
`B8` + `M3` hands-free · `X1` leitura rítmica · `X3a` audiação (o primeiro) · `P9` conjunto de rotinas · `R1` as rotinas de ônibus

**Terceiro — o catálogo deixar de confundir**
`P7` remoções · `P2`+`P3` leitura × instrumento · `P5`+`P6` varreduras · `P8` comunidade · `P14` nomes

**Quarto — o baixo** *(deixou de estar bloqueado)*
`M5` portar o gerador de formas · `M1` o ciclador · `R2` a rotina de tonalidade

**Depois** — `P1` montar sessão · `X5` progressões · `X6` gerador · `X2` deslocamento · o resto

---

## 9. O que **não** decidir dentro de uma tarefa

Tudo marcado 👤 acima, mais estes, que o Paulo deixou explicitamente em aberto:

- ✅ o nome: é **"ciclo de rotinas"**
- ✅ as **formas do baixo**: ele deu um **algoritmo** em vez de uma lista — `M5`
- ✅ o **gerador de leitura**: está em `docs/doado/leitura-partituras/`
- ✅ as **revisões da versão antiga**: ele conferiu, não há nada novo
- o nome do agrupamento de pares opostos (`P4`)
- o conflito entre "quais tempos tocam" e "subdivisão" no metrônomo (`M4`)
- ✅ combinações de graus: **as duas** — escolher ou sortear

E uma regra que esta revisão criou e vale para todas elas:

> **Personalização tem limite.** Exercício fácil não precisa de progressão configurável — fechar o
> padrão é melhor que oferecer escolha que não muda nada.
