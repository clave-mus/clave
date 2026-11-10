# RE · Onde a reorganização parou

Registro de estado da sessão de 09/11/2026, escrito para sobreviver a um resumo de contexto. Se
você está pegando isto do zero: o que importa está nas mensagens de commit, que são longas de
propósito. Este arquivo é o índice.

## A decisão que organiza tudo

**O eixo do catálogo passa a ser a superfície, não a direção.** Aprovado pelo Paulo em 09/11/2026.

Antes: um item por *direção* (identificar num, produzir no outro), com a superfície como parâmetro.
Agora: um item por *superfície* (pauta / instrumento), com a direção como configuração.

As três evidências que fecharam a decisão, todas no próprio código:

1. `ache-a-nota` declarava **três** `skillTags`, uma por superfície — admitia ser três itens;
2. a **validação** mudava com a superfície: na pauta a resposta é a grafia (Dó♯ ≠ Ré♭), no teclado e
   no braço é a altura;
3. a **extensão** também: `pauta/suplementares`, `1/2 oitavas` e faixas de casa são três unidades
   incomparáveis, escondidas umas das outras com `Setting.quando`.

A direção não muda nenhuma das três. O caro era parâmetro e o barato era item.

**Autorizações dele, para não reabrir:** pode matar o histórico (ids novos deixam tentativas antigas
órfãs); o instrumento é configuração com o do perfil por padrão, e a pessoa muda e salva na rotina.

## O molde, para repetir nos que faltam

Está escrito em `src/catalog/items/nota-na-pauta.ts` e `nota-no-instrumento.ts`. A receita:

| | |
|---|---|
| 1 | dois itens novos, um por superfície, com `direcao` como `Setting` single |
| 2 | o do instrumento tem `INST` com piano acrescentado, e `FRETS` com `quando: s => s.instrumento !== 'piano'` |
| 3 | `catalog.ts`: importa os novos, apaga os velhos |
| 4 | apaga os arquivos velhos |
| 5 | `portas.ts`, `grupos.ts`: troca os ids; quem usava `na(id, 'pauta')` passa a `{ itemId }` |
| 6 | `doTime.ts`: as etapas trocam `superficie` por `direcao` |
| 7 | i18n: título e descrição dos novos nos dois idiomas, e fora os velhos |
| 8 | `taxonomy.test.ts` → `STABLE_IDS`; e os testes que citam os ids antigos |

Esperar **dezenas de testes reprovando**. Todos foram consertados dizendo a verdade nova, nenhum
afrouxado — e dois eram erro meu, não do código. Um sinal de que o eixo novo é o certo: o grupo
"leitura na pauta" tinha o comentário *"ache-a-nota na pauta entra mesmo sendo escrever, não ler"*,
uma justificativa que existia só para remendar a estrutura antiga. Saiu.

## As quatro frentes

| | frente | estado |
|---|---|---|
| 1 | acorde no braço pelo gerador | ✅ feito |
| 2 | audiação na leitura | ✅ feito |
| 3 | reorganização: nota ✅ · intervalo ✅ · **acorde a fazer** · absorver o `no-instrumento` a fazer | ⬅️ **próxima** |
| 4 | as duas rotinas do Paulo | depende de 3 |
| 5 | **explorar padrões pela escala** — a tela com a escada | a fazer |

### O par de padrões de escala, em 10/11/2026

A metade de **adivinhar** está pronta e no catálogo: `reconhecer-padroes-escala`, `serie`, roda no
Player, cabe no ônibus. As alternativas são **todas** as posições do padrão (5 na pentatônica, 7 nas
de sete notas), não quatro — não há distrator a inventar nem como descartar por eliminação, e elas
explicam o exercício sozinhas.

A metade de **explorar** não existe. É a tela com a escada clicável, as posições à vista, o drone
sustentado e o link do vídeo — e é com ela que vem o link clicável do ChicagoBassBuddy. No item de
adivinhar o crédito está na descrição, em texto.

Duas coisas que a construção ensinou:

- o padrão **desce** abaixo da tônica (decisão do Paulo), e aí a nota mais grave saía da região. O
  desenho sobe **inteiro**, por oitavas, até caber: um deslocamento só para todas as notas, porque
  mover notas soltas quebraria o contorno — mesma lição de `acomodarMelodiaEAcorde`;
- eu nomeei um atalho de "(mais difícil)" e o teste reprovou: a decisão 100 proíbe nome por nível. O
  teste estava certo.

### Frente 2 — audiação na leitura

Ideia do Paulo, e é melhor que a minha: *"tu vê a melodia, audia, e aí o som das notas vem como
confirmação. Só penso que aí precisa poder ouvir um contexto — 1 nota — pra entrar no tom certo."*

Eu ia fazer uma família de estímulo no `audiar`. A dele é mais barata: `tools/Leitura.tsx` **já tem**
a melodia gerada, as notas e o cursor. Falta ele parar de tocar antes de a pessoa tentar.

Hoje o liga-desliga "ouvir a melodia" toca *junto* com a leitura. O modo novo: a pauta aparece, nada
soa, a pessoa audia, e **aí** pede o som como conferência.

👤 Nota de contexto: uma nota dá a altura mas **não dá o modo** (dó serve a dó maior e a lá menor).
Proposta: configurável, nota ou tríade, com a nota como padrão porque é o mínimo e foi o que ele
pediu.

> **Padrão que apareceu três vezes:** `ouvido-tecla` tem `referencia`, `audiar` tem `referencia`, e
> agora a leitura precisa dela. É o mesmo botão três vezes, e provavelmente devia ser uma coisa só.

### Frente 3 — o que absorver no `no-instrumento`

Desenho dele: a pessoa clica **todas** as posições da nota no braço (ou dentro de uma região), cada
uma uma ou mais vezes; e uma opção com metrônomo para responder no instrumento real.

"Todas as posições" é uma pergunta que **nenhuma superfície do app sabe fazer** — o braço aceita um
toque e confere classe de altura, então qualquer posição certa encerra. É o mesmo molde da
superfície `sequence` que entrou hoje no `Player`: acumula escolhas e só fecha quando completa.

E resolve um defeito de passagem: o item de instrumento fixa uma corda e o gabarito diz **uma**
casa, quando a nota existe em até quatro lugares.

⚠️ `validation` é uma **lista** — "os modos que o item aceita; o primeiro é o padrão". Um item pode
declarar `['deterministic', 'self_report']`. Eu disse ao Paulo que não cabia e estava errado.

### Frente 4 — as rotinas dele

**Reconhecer notas e acordes no violão e no piano:** nota no instrumento (piano, ler e escrever) ·
acorde no instrumento (piano) · acorde no instrumento (violão).

**Leitura de partitura:** nota na pauta (ler e escrever) · acorde na pauta (ler e escrever) ·
melodia na pauta (audiar) — esta última depende da frente 2.

## Decisões 👤 ainda abertas

1. o texto de abertura de `explorar-padroes-escala` (proposta em `PE-padroes-de-escala.md`);
2. a nota de contexto da frente 2: nota, tríade, ou configurável;
3. o `no-instrumento` continua existindo depois de ceder o modo virtual, ou vira só o modo
   "instrumento real com metrônomo" do item de nota;
4. os atalhos dos doze itens sem atalho (`AT-atalhos-em-todo-exercicio.md`), que ele adiou para a
   esfera "público".

## O que mais foi feito hoje, e onde ler

Sessão longa. Em ordem, com o que cada commit registra:

- `dfd1ab5` motor dos padrões de escala, e o campo harmônico da pentatônica
- `e30cc8c` a melodia deixa de soar mais grave que o acorde (51% → 0, medido)
- `bbc02dd` distrator não denuncia a resposta pela nota repetida
- `53e0b54` a oitava se escreve 8, não `1'`
- `21a6eb0` atalhos como entrada do exercício
- `4791a69` responder entre todos os graus, não entre quatro
- `af4b369` atalhos de entrada em dó maior nos quatro itens de percepção
- `ae8212d` a rotina do fone revisada etapa por etapa
- `84d3900` inversões como dificuldade, e a ambiguidade sus2/sus4
- `f7370bd` alternativas de ritmo que não se descartam de olho (26% → 99%)
- `f048db7` português vazando para a interface em inglês
- `6c9c023` focar em células específicas, e as nove essenciais
- `97dbf51` a corda pulsada divergia para NaN e envenenava todo o som
- `aaef24f` o gabarito nomeava uma nota que a pergunta não pediu
- `f6a9374` o ataque da corda deixa de soar metálico
- `23a80c4` uma grafia por vez, não "Ré♯/Mi♭"
- `2ee07f6` os três defeitos da pauta
- `4e23ba4` **a reorganização, primeira etapa**
- `bfe3118` o acorde no braço pelo gerador
