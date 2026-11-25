# Publicação: o que está em rascunho, e como se publica

A decisão 51 diz que *tarefa delegada constrói o motor e a fiação; publicar a família é passo humano
do Paulo.* Desde a decisão 91 isso **é imposto pelo código**, não só combinado.

> ## ⚠️ O portão está DESLIGADO até o beta (decisão 104)
>
> Em 04/11/2026 o Paulo pediu o catálogo inteiro à vista enquanto o time testa: `PORTAO_LIGADO = false`,
> em `src/catalog/publicacao.ts`. **Rascunho aparece para todos, sem `?revisao=1`.**
>
> **Nada virou `publicado`** — isso afirmaria uma revisão que não aconteceu. O estado de cada item
> continua verdadeiro, e esta lista continua sendo o que falta revisar **antes do beta**, quando o
> portão volta a valer. Virar é trocar `false` por `true` naquela linha.

## Os três estados

| Estado | Quem vê | O que significa |
|---|---|---|
| **`rascunho`** | **ninguém**, a não ser no modo de revisão | construído, ainda não revisado. **É o padrão**: um item novo que não declara `publicacao` já nasce assim |
| **`legado`** | todo mundo | já estava no app **antes** deste portão existir. Visível, mas **sem revisão formal** — a revisão de ambiguidade (`F6-7`) ainda está pendente. Chamá-lo de "publicado" afirmaria uma revisão que não aconteceu |
| **`publicado`** | todo mundo | revisado pelo Paulo, com **data e nome** registrados. **Só ele** muda um item para cá |

O padrão é o estado **mais restritivo**: esquecer de declarar nunca expõe nada.

## Para quem constrói itens (colegas e as IAs deles)

- **Todo item novo é `rascunho`.** Declare `publicacao: RASCUNHO` (de `src/catalog/publicacao.ts`) ou
  omita o campo. **Nunca** escreva `publicado` ou `legado` num item novo: `legado` é só para o que já
  existia, e `publicado` é decisão do Paulo.
- **Liste o item neste arquivo.** Um teste (`publicacao.test.ts`) falha se um rascunho não aparecer aqui
  pelo id entre crases — é o que impede este documento de envelhecer.
- Para ver o seu rascunho funcionando: abra o app com **`?revisao=1`** no endereço
  (`http://localhost:5173/?revisao=1`). Aparece uma faixa avisando, e os rascunhos ganham a marca
  "rascunho". `?revisao=0` desliga, e o botão "Sair" da faixa também.
- **Não há controle para isso no Perfil, de propósito**: quem testa o beta não deve esbarrar nele.

## Para o Paulo: como publicar

Depois de revisar um item (ouvir, tocar, conferir o que a tabela abaixo diz que só você confere), troque no
código:

```ts
publicacao: { estado: 'publicado', revisadoEm: '2026-11-04', por: 'Paulo' },
```

E **tire a linha do item deste arquivo**. O teste exige data no formato `AAAA-MM-DD` e um nome; sem eles,
`publicado` não passa.

## Em rascunho agora

### Técnica — rotinas da ferramenta `tecnica` (decisão 81)

| Id | Família | O que só você confere |
|---|---|---|
| `permutacoes` | **T1** · permutações de dedos | se tocar a ordem na casa 5 (o dedo *f* em `4 + f`) é uma boa postura para o exercício |
| `cordas` | **T2** · ordem das cordas | a convenção (corda 1 = mais aguda **do grupo**) e o que tocar em cada corda: hoje uma nota na casa 5, duas voltas. **Sempre quatro cordas vizinhas** (24 ordens), com seletor de grupo na guitarra — ver a decisão 94 e se quatro vizinhas bastam |

### Rotinas do time (F3-6)

**Sete** (eram nove: *Teoria no silêncio* e *Mapear o instrumento na rua* saíram, e as duas de braço viraram uma). Reescritas em 04/11/2026 depois da revisão do Paulo, e por isso **todas voltaram a
rascunho** — o conteúdo mudou, e o estado diz a verdade. Com o portão desligado (decisão 104) isso não
esconde nada de ninguém.

Cada etapa carrega um campo `porque` que não aparece na tela: é o argumento de ter escolhido aquele
exercício ali, para a revisão não ter de reconstruir o raciocínio.

| Id | Modo | Etapas | O que só você confere |
|---|---|---|---|
### Modos e parâmetros novos de 13/11 — para a sua revisão musical

Não são itens novos (nenhum nasceu rascunho por isso), são **parâmetros** de itens que já existiam.
Mas cada um muda o que o exercício pede, e a revisão de ambiguidade é sua:

| onde                                                      | o quê                                                                  | confira                                                                                                                                    |
| --------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `ouvido-intervalo`                                        | a resposta pode ser **as notas** (contorno), e elas podem ser **três** | se três notas empilhadas ainda é um exercício de intervalo ou já é acorde; e se `comTonica` (partir sempre da tônica) deveria ser o padrão |
| `ouvido-tecla` · `melodia-de-ouvido` · `ouvido-intervalo` | **restringir às notas que você escolhe**                               | se a restrição deveria cruzar com a tonalidade (hoje cruza: escolher ré♭ em dó maior diatônico não o traz)                                 |
| todos com som                                             | o **synth limpo** como timbre                                          | se ele soa bem no fone e se o nível bate com o piano (medi 1,18× — 1,4 dB acima)                                                           |
| `ouvido-celulas`                                          | a **cadência como antessala**, ligada só no atalho `acorde-sorteado`   | se vale ligá-la também nos outros atalhos, ou se o acorde sozinho basta                                                                    |
| `nota-no-instrumento`                                     | **todas as posições** da nota no braço                                 | se a conta de posições em casas 0–12 é exercício ou maratona (num violão, um Fá tem 4 ou 5 posições)                                       |
| `ouvido-acorde`                                           | **fundamental fixa ou sorteada** (padrão fixa)                         | se sorteada deveria ser o padrão em algum atalho                                                                                           |
|                                                           |                                                                        |                                                                                                                                            |

---

| `melodia-de-ouvido` | **a linha §3.2 e o molde do modelo novo** (12/11): o item é o objeto musical e o seu gerador; direção (ouvir/audiar) e superfície são parâmetros. Ouvindo, responde-se a melodia em ordem na superfície escolhida, com conferência por **contorno**; audiando, a melodia aparece escrita (pauta ou graus, tipo `1-5-4-3`), só o contexto toca e o gabarito fica num botão. Audiando no teclado ou no braço, a melodia aparece **animada**, nota por nota, com 900 ms em cada (pedido dele em 13/11) — e com `prefers-reduced-motion` as marcas vêm numeradas de uma vez, porque a ordem é informação e não enfeite. Confira o salto padrão (quinta justa), as 3 notas de padrão, e se audiar por graus é claro o bastante sem o nome das notas |
| `notas-acordes-e-leitura` | **a rotina que o Paulo pediu para si** (10/11): notas e acordes no violão E no piano, depois a pauta — ler, correr e audiar. O instrumento de cada etapa é declarado, não `auto`, porque a rotina diz "nos dois". ⚠️ **Falta a terceira parte que ele pediu**: audiar uma melodia ESCRITA de poucas notas. Hoje só existe audiar uma nota; várias notas na pauta é outro objeto (melodia), e se isso é parâmetro ou item novo é decisão dele (decisão 15) |
| `ouvido-campo` | graus do campo harmônico de ouvido (`OR-ouvido-relativo.md`, §3.5): cadência de contexto e um acorde — qual grau soou? Grau e qualidade numa pergunta só, pelo algarismo romano. Empréstimos modais opcionais: no maior o grupo do menor paralelo + ♭II; no menor V e vii° da harmônica, IV e ii do dórico, e ♭II (12/11/2026). Confira a cadência do menor sair da harmônica, e os rótulos romanos |
| `percepcao-ritmica` | rotina nova, com o desenho do Paulo: ouvir o ritmo escrito e depois quatro etapas de leitura variando os recursos — pontuadas, quiálteras, as três juntas, e as nove células essenciais. O `ritmo-ouvido` veio da rotina do fone, onde era a única etapa não melódica |
| `de-bolso` | livre | 4 | **o tempo de pensar de cada variação** (6, 10, 12 e 5 s) e se as quatro são os cortes certos dos seis objetos |
| `ouvido-no-fone` | livre | 8 | uma etapa por assunto, sem rodízio — confira se oito cartões é demais numa tela de celular |
| `mapear-braco` | guiada, 30 min | 5 | a fusão das duas antigas. Confira o **rodízio entre identificar e construir** intervalo (etapa 3), e se a última etapa (a que pede o instrumento) atrapalha quem está na rua |
| `internalizar-tonalidade` | guiada, 30 min, rotação | 5 | a ordem das cinco frentes, e se 12 tonalidades em quartas é o ciclo certo |
| `aquecimento-ouvido` | guiada, **8 min** | 4 | dois minutos por frente, a pedido do Paulo. Confira se 2 min dá tempo de entrar no assunto |
| `leitura-diaria` | guiada, 15 min | 3 | separar altura de ritmo antes de juntar |

> **O achado que esta rotina expôs foi resolvido** em 04/11: `no-instrumento` existe e é a primeira
> etapa dela. Era o único buraco óbvio do catálogo — todos os exercícios de braço aconteciam na tela, e
> nenhum pedia para tocar no instrumento de verdade.
>
> **E o critério de inclusão agora é explícito** (decisão 109): *"mapear o braço é internalizar as
> posições das notas no braço — então tudo que trabalhar isso pode estar incluso."* Aplicado, ele tirou
> o **drone** (que trabalha entonação, não posição) e trouxe os dois exercícios de braço de tela, com o
> **braço inteiro** — porque com o instrumento na mão a pessoa acha a nota no braço de verdade e só
> então confirma na tela. **As duas rotinas de braço passaram a compartilhar itens**, e a diferença
> entre elas é o enquadramento e o vão do braço, não a lista.

### Aproximações cromáticas na melodia (25/11/2026)

Parâmetro novo do `melodia-de-ouvido`, do seu pedido: *"tanto entre notas, como entre o 4 e o 5,
como se aproximando de uma nota, como fazendo um ♭2-1"*. Os três casos são o mesmo mecanismo — uma
nota a meio tom de uma nota da escala, imediatamente antes dela.

| o quê | confira |
|---|---|
| **a cromática substitui, não acrescenta** | pedindo cinco notas, soam cinco. Confira se é isso que você espera, ou se a aproximação devia ser uma nota a MAIS |
| **é interruptor, não cota** (25/11) | ligado, cada nota candidata tem ~22% de chance — uma em cada quatro ou cinco, como você pediu. Umas melodias saem sem nenhuma, e é isso que obriga a ouvir em vez de contar. Confira se a frequência está boa no uso |
| **resolvendo × soltas** | resolvendo é a definição estrita (cai no alvo a meio tom); soltas é outro som, a nota alterada sem destino. Dois atalhos, um para cada |
| **nunca duas coladas, nunca a primeira** | duas cromáticas seguidas viram cromatismo, e começar fora da escala tira a referência antes de a melodia dizer onde está |
| ⚠️ **a grafia na pauta** | audiando, a cromática aparece escrita, e quem decide a grafia é a tonalidade: em dó maior o pc 3 sai **Mi♭**. Subindo para o Mi, o certo musical seria **Ré♯**. A regra "grafia pela tonalidade" é antiga e vale em todo o resto do app — mudar para "grafia pela direção da aproximação" é decisão sua, e vale só aqui |

### Montar digitação de modo no braço (25/11/2026)

Modo novo do `escala-no-instrumento`, decidido com ele em 25/11 (Q1): no braço, "ler o nome e
marcar as notas" virou **montar uma digitação**, com dezenas de respostas certas.

| o quê | confira |
|---|---|
| **o veredito** | decisão sua de 25/11: ele julga **se é a escala**, e nada mais — classes do modo, nenhuma repetida, subindo em ordem de grau. O vão da mão saiu: é critério de **sugestão**, não de correção. Confira se "subindo" é restritivo demais — hoje um desenho que desce é recusado |
| **o enunciado pelo grau** | *"monte uma digitação do 4º modo da escala maior, a partir de Lá"*. Foi sua decisão (Q3): o número no enunciado, e o nome tradicional na revelação quando existe |
| **as três famílias** | maior, menor harmônica e menor melódica. A menor natural é o 6º grau da maior, e por isso não é família à parte |
| **o braço alto** | as cordas com o dobro do espaçamento. Medido deitado: casa de ~70 px, corda de ~59 px, contra os 24 px de antes. Confira com o dedo |
| **não dá para repetir nota** | tocar a mesma classe duas vezes é ignorado no clique (pedido dele em 25/11: *"não tem sentido, só atrapalha"*). A exceção é a oitava que fecha o desenho |
| **2 a 5 desenhos na rodada** | eles chegam numa pergunta só: cada sete posições são um desenho, e a conferência exige que todos sejam válidos **e diferentes entre si**. Confira se montar cinco seguidos cansa ou se é o treino certo |
| **o botão de sugestão** | aparece depois de responder, nunca antes (antes seria pedir a resposta). Ele exclui o que você acabou de montar e as sugestões já vistas **por FORMA** — o mesmo desenho uma oitava acima não conta como novo (você relatou em 25/11) —, numera as notas na ordem de subida, e avisa quando acabaram |
| **fechar na oitava** | ligado por padrão: a digitação vai da tônica à tônica, oito toques. Era recusado até você relatar. Desligando, são sete, parando na sétima. Confira qual dos dois você quer como padrão |
| **a recusa de região apertada** | com as casas 0–5 e vão de 3 costuma existir **um** desenho só; pedir cinco ali é recusado com a saída escrita (abrir casas, alargar o vão, ou pedir menos) |

### Escrever acorde e escala na pauta (25/11/2026)

Fecha a simetria que a medição do catálogo mostrou: nota e intervalo tinham ler **e** escrever na
pauta; acorde e escala só liam, enquanto do lado do instrumento as quatro famílias já escreviam.

| o quê | confira |
|---|---|
| **a conferência é por ALTURA, não por grafia** | escrevendo UMA nota (`nota-na-pauta`) a conferência é a grafia, porque a pauta distingue Dó♯ de Ré♭. Escrevendo um acorde ou uma escala, é o contorno — exigir a grafia de cada nota transformaria um erro de enarmonia em acorde errado. É a escolha que o `ouvido-acorde` já fazia; confira se você concorda com ela aqui |
| **a inversão vai na cifra** | `C/E`, como no instrumento |
| **a escala fecha na oitava** | ligado por padrão, oito notas |
| ⚠️ **a ordem dos cliques não conta** | escrevendo a escala, o contorno é o conjunto. Exigir a ordem puniria a ordem dos cliques, que não aparece no resultado escrito — mas talvez você queira que escrever uma escala seja escrevê-la **subindo**, e aí é outra conferência |

### Desenhar o acorde no instrumento (25/11/2026)

Direção nova do `acorde-no-instrumento`, a pedido dele: *"pensei que já tivesse um exercício de
desenhar o acorde no instrumento, crie isso"*. Ele tinha razão em esperar — desenhar acorde existia
**de ouvido** (`ouvido-acorde`), não a partir da **cifra escrita**. São exercícios diferentes.

| o quê | confira |
|---|---|
| a conferência é **contorno não ordenado** | as notas do acorde, em qualquer ordem de clique e em qualquer oitava, desde que todas deslocadas juntas. Mesma regra do `ouvido-acorde` desenhando |
| **o acorde cabe no braço** | o guarda pegou antes da tela: um acorde montado sobre a região 48–72 chegava a MIDI 80, e a casa 12 de um violão dá 76. Agora o bloco desce por oitavas até caber |
| **braço alto e em foco** | três ou quatro toques certeiros num celular deitado |
| **inversões** | você decidiu em 25/11 que sim. Aqui ela é **pergunta**, e não dificuldade: o enunciado pede em cifra com baixo (`C/E`), porque é assim que aparece numa grade — e ler isso é parte do exercício. A revelação diz por extenso. Confira se a cifra com baixo é a forma certa de pedir, ou se você prefere "dó maior, 1ª inversão" |
| ⚠️ **extensões** | o desenho cobra tríades e tétrades do seletor de qualidades; acorde com extensão (9, 11, 13) não entra ainda |

### Escala no instrumento (20/11/2026)

| Id | O que só você confere |
|---|---|
| `escala-no-instrumento` | **Se o desenho é reconhecível.** O nome é seu; o resto pede o seu ouvido e o seu olho. No piano, a escala acende uma oitava com a **tônica rotulada `1`** — sem isso dó maior e ré dórico são a mesma figura, e eu preferi marcar a tônica a tirar os modos do sorteio. No braço, acendem **todas as posições da escala na região**, com a tônica no acento: confira se isso se lê como escala ou como mancha, principalmente com a região inteira (0–12). Confira também que **desenhar** só existe no piano — no braço eu precisaria de um motor de digitação de escala que não existe, e inventar um seria decisão musical sua |

### Graus no braço, com metrônomo (20/11/2026)

Modo novo do `no-instrumento`, que você escolheu como casa dele (a opção 1 das três). Não é item
novo, então nada nasceu rascunho — mas muda o que o exercício pede:

| o quê | confira |
|---|---|
| **o alvo pode ser um grau**, e aí são as **doze** classes contra a tônica escolhida | se incluir os alterados é certo (o seu exemplo era `♭3`, que é alterado em maior) ou se os sete da tonalidade bastariam |
| **metrônomo em vez de cronômetro**: 60 bpm e 2 compassos em cada alvo por padrão, com a revelação durando **um compasso** | se dois compassos dão tempo de tocar o grau em todas as posições de uma região de cinco casas — num baixo são 2 ou 3 posições, num violão até 5 |
| **a região passou a valer**, e o padrão dela aqui é **até a 5ª casa** | é diferente dos outros itens de braço, que abrem o braço inteiro. Aqui a tarefa é tocar em TODAS as posições da região, e o braço inteiro viraria maratona |
| **a tônica se escolhe na tela** | nos outros itens ela é parâmetro de prática; esta é tarefa de tela própria, sem painel, então ela oferece a sua — como o Relações e o Acompanhamentos já fazem |

### O modo quiz da relação melodia-harmonia (20/11/2026)

Não são itens novos — são **modos** de `ouvido-campo` e `ouvido-celulas`, e por isso nada nasceu
rascunho. Mas cada um muda o que o exercício pede, e a revisão musical é sua:

| onde | o quê | confira |
|---|---|---|
| `ouvido-campo` | **nota segurada sobre o acorde**, com posição (por cima · no meio · por baixo) | se reconhecer o grau **através** da nota parada é difícil na medida certa; se "no meio" se ouve como nota ou some dentro do acorde; e se por baixo, com o acorde subindo de oitava para abrir espaço, ainda soa como o mesmo exercício |
| `ouvido-celulas` | **o par** (que acorde + que graus) e **a relação** (`♭7`, `5`) | se o par com dois acordes é a porta de entrada certa — você escreveu que começar com poucos graus é o recomendado —, e se a relação sozinha é mesmo o degrau do meio entre os dois |
| os dois | **os nomes dos dez atalhos novos** | a redação é sua; eu escrevi uma primeira versão descritiva |
| `ouvido-celulas` | **o nome do item** | ele deixou de ser "células de graus" faz tempo: aceita uma nota só, acorde qualquer do campo, e agora pergunta o acorde. O documento de 07/11 já anotava que o nome ia ficar para trás |

### A oitava de escuta nas superfícies de baixo (20/11/2026)

Não é item novo — é **parâmetro** de cinco itens, e a revisão musical é sua. Pedido seu: *"nos
exercícios com superfície de baixo, sempre dê pra escolher ouvir as notas uma ou duas oitavas
acima"*. Entrou em `ouvido-tecla`, `ouvido-intervalo`, `ouvido-intervalo-harmonico`,
`melodia-de-ouvido`, `nota-no-instrumento` e `intervalo-no-instrumento`, sempre escondido onde a
superfície não é braço de baixo.

**Duas coisas para você decidir:**

1. **O padrão é "na altura real".** Pode ser que, no baixo, uma oitava acima devesse ser o padrão —
   você ligou o equivalente por padrão no `mapa-do-braco` em 15/11 (ver abaixo).
2. **No `mapa-do-braco` o parâmetro NÃO entrou**, porque ali já existe o `somAudivel`, que você
   revisou em 15/11: um interruptor que sobe o arpejo inteiro por oitavas até passar dos 300 Hz que
   um alto-falante de celular reproduz, ligado por padrão no baixo. Ele resolve o mesmo problema de
   forma automática. Pôr os dois seria dois controles para uma coisa — se você preferir a escolha
   explícita de uma ou duas oitavas lá também, ele vira o parâmetro novo e o interruptor sai.

### Intervalo harmônico, item próprio (20/11/2026)

| Id | O que só você confere |
|---|---|
| `ouvido-intervalo-harmonico` | **Se a divisão rendeu o que você esperava dela.** Era o modo `juntas` do `ouvido-intervalo`, e agora é item, com os mesmos parâmetros e o mesmo gerador — o que mudou é que ele se acha no catálogo pelo nome e tem atalhos próprios. Confira: se o **timbre padrão** serve (você escreveu *"synths de timbre limpo e bom sustain pra segurar o intervalo um pouco"*, e hoje o padrão é o timbre do perfil, que no seu caso é baixo); se os três modos de resposta — nomear, apontar as notas, audiar as notas — fazem sentido todos aqui; e se **três notas** ainda é intervalo ou já é acorde (a mesma dúvida que estava anotada no melódico) |

### Explorar padrões pela escala (`PE`, 20/11/2026)

| Id | O que só você confere |
|---|---|
| `explorar-padroes-escala` | **Se a escada é mesmo o gesto certo.** O padrão se escreve clicando degrau por degrau, e os deslocamentos saem do primeiro clique — então clicar 3 · 5 · 4 · 7 escreve o mesmo desenho que 1 · 3 · 2 · 5. Confira se isso é óbvio usando, ou se falta a tela dizer. Confira também: o **piso em dó3**, que é onde o padrão soa (com salto de ±2 e seis notas ele chega perto do dó5); o **intervalo entre as notas** ao apertar uma posição (420 ms, para dar tempo de ouvir sem arrastar); e se a **pentatônica maior como padrão** continua sendo a escala de entrada certa. A exploração sai sem braço virtual e sem metrônomo, as duas por sua decisão |

### Mãos livres (`F6-1`)

| Id | O que só você confere |
|---|---|
| `maos-livres` | **o som e a voz.** A resposta é dita pela síntese de fala do navegador, e a voz varia muito entre aparelhos — em alguns Android a voz portuguesa não vem instalada (a tela avisa e repete o som em vez de dizer). Confira também se o **tempo de pensar** padrão (6 s) é razoável, e se as seis fontes — intervalos, acordes, escalas, modos, graus, notas — são as que valem num ciclo sem tela |

### No instrumento (`F6-4`)

| Id | O que só você confere |
|---|---|
| `no-instrumento` | **se o exercício serve.** Ele é a única coisa no app que pede para tocar no braço de verdade — mostra a nota, espera, revela **todas** as casas onde ela existe na faixa inteira (X8, 06/11/2026: antes marcava uma só, sorteada), e termina na autoavaliação. O app **não ouve**, e por isso o que ele consegue afirmar é pouco: que você praticou, e o que você achou de si. Confira os tempos padrão de espera (8 s) e de exibição da resposta (4 s), e se "ouvir a nota antes" ajuda ou entrega demais |

### Relações entre melodia e harmonia (`MH`, 07/11/2026)

| Id | O que só você confere |
|---|---|
| `relacoes-melodia-harmonia` | **Se a frase está musicalmente certa, combinação por combinação.** Ela é gerada, não escrita à mão: o motor apura o grau, o intervalo e o semitom, e a única palavra avaliativa é *"pode gerar tensão"*, só onde há atrito — foi o critério que você deu. Há teste varrendo as 196 combinações atrás de adjetivo que ninguém autorizou, mas **nenhum teste sabe se a frase é boa de ler**. Confira também: o trítono sai como **♭5** e não ♯4 (escolha, para os cinco alterados ficarem todos em bemol); o **timbre novo do drone** (`destaque`, triangular) soa mesmo como melodia por cima do acorde; e se o rótulo curto da grade (`6ªm`, `4ª+`) comunica ou se atrapalha |

### Faça o intervalo (`X9`+`B4`, revisão de 04/11/2026)

| Id | O que só você confere |
|---|---|
| `intervalo-na-pauta` e `intervalo-no-instrumento` (era `faca-o-intervalo`) | o par de `que-intervalo-e-esse`. Veio do modo "intervalo" de `ache-a-nota`, que estava quebrado no braço (B4) — aqui o braço só pede a classe de altura (igual ao par: o desenho não distingue quinta aumentada de sexta menor), e a pauta pede a grafia certa (`transpose()`, igual já fazia antes). **Não tem a opção "ver nome, posição, ou os dois"** que a tarefa original pedia — implementá-la direito mexeria na revelação genérica do Player, compartilhada por todo item de braço, e não quis arriscar isso sob pressa; hoje a revelação é a mesma de todo item de braço (nome + posições que batem) |

### Tarefa com metrônomo — itens de catálogo (decisão 90)

| Id | Família | O que só você confere |
|---|---|---|
| `acento-deslocado` | **T3** · deslocamento de acento | o clique: o acento é o `clique-forte` e a subdivisão um `clique` mais baixo — **se dá para ouvir o acento mover** |
| `subdivisao-alternada` | **T4** · subdivisão alternada | a ordem fixa (da mais lenta para a mais rápida) e o aviso um compasso antes |
| `deslocamento-ritmico` | **T8** · deslocamento de padrão | os 15 padrões e se a pulsação ancorada no primeiro tempo ajuda ou atrapalha |

> `sustentar-e-cortar` (T6) e `legato-staccato` (T7) saíram do catálogo (revisão de 04/11, `P7`).

**Os textos** (títulos e descrições, em português e inglês) saíram das tabelas das decisões 81 e 83, mas
são rascunhos: nome de coisa que a pessoa vê é decisão do Paulo.

## Enumeradores (sem tela, fora do portão)

| Item | Onde | O que conferir |
|---|---|---|
| **FM-4** · conduções de voz | `theory/conducoes.ts` | as cinco medidas e os âmbitos corais (largos de propósito). **O corte de quatro vozes está marcado como revisável** (decisão 66) |
| **FM-5** · rearmonizações | `theory/rearmonizacoes.ts` | as sete transformações (decisão 78), e **a questão em aberto** de onde a nota da melodia cai dentro do compasso |

Não têm tela, então não há o que esconder; entram no portão quando ganharem uma.

## Escalas e ouvido (decisões 70 e 72)

Já estão no app como `legado`, mas as mudanças recentes pedem o seu olho:

- As **duas melódicas** e o nome "(jazz)" / "(clássica)".
- O guarda que recusa a configuração impossível, e o texto da recusa.
- Os **dois bugs** de `ouvido-celulas` e o item generalizado para as 13 escalas.

## O que ainda NÃO foi feito, e não é revisão

- A **tabela de piano** (`FM-6`) está fechada (04/11): as 3 linhas em branco foram preenchidas com
  fonte e com a conferência do polegar, e **um erro foi encontrado** na mão esquerda de Si♭ menor. Os
  arpejos ficaram só na convenção de fundamental branca — ver o motivo lá.
- A **biblioteca de padrões rítmicos** (`F6-11`) tem os doze candidatos e as fontes levantadas em
  [padroes-ritmicos.md](padroes-ritmicos.md), **sem nenhuma notação nova escrita** — falta o
  **revisor de tradição** (decisão 85, regra 2), que é pessoa, não documento. Nada dali entra no app.
- As **22 gravações** (`A0`) e as digitações de baixo (`FM-2`).
- Os **22 itens `legado`** esperam a revisão da `F6-7` para virarem `publicado`. (Eram 26: as fusões
  por superfície e a divisão do quiz de teoria mudaram a conta, não o trabalho.)
