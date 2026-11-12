# OR · Ouvido relativo — a reformulação

Desenho do Paulo em 10/11/2026, decidido com ele em uma rodada de sete perguntas. Este documento é
a fonte de verdade da reformulação; as tarefas saem dele.

> **A ideia central, nas palavras dele:** *"no fim é quase a mesma habilidade aplicada à diferentes
> coisas"*. O que hoje são exercícios-ilha passa a ser uma matriz: cada objeto musical (nota,
> melodia, intervalo harmônico, qualidade de acorde, grau do campo) com as mesmas colunas.

---

## 1. Os dois princípios

**Fixar um contexto é o padrão.** Toda rodada começa estabelecendo um centro tonal — tônica ou
cadência. Ele já vale para os itens de percepção desde 09/11; aqui passa a ser estrutural.

**O estímulo define o item; a resposta é parâmetro.** Esta frase resolve o conflito aparente com a
reorganização de 09–10/11, e vale escrever por extenso porque o Paulo levantou a dúvida:

- a reorganização trocou o eixo para **a superfície do ESTÍMULO**: em `nota-na-pauta` você *lê* uma
  pauta; em `nota-no-instrumento` você *olha* um braço;
- em exercício de ouvido o estímulo é **som** — não há superfície de estímulo. Então **onde você
  responde** fica livre: pauta, piano, violão, baixo ou botões.

Os dois desenhos são a mesma ideia de dois ângulos, não um contra o outro.

---

## 2. A decisão que encolheu o trabalho: o "oposto" é uma direção, não uma coluna

O Paulo descreveu, para cada linha, um "oposto" — ler a coisa, ouvir o contexto, audiar, e ouvir o
gabarito como conferência. Parecia cinco exercícios novos. **Não é nenhum.**

No oposto, o que os olhos recebem é **notação ou instrumento** — que é exatamente o estímulo dos
itens que já existem. Então o oposto é um **terceiro valor** do seletor de direção que eles já têm:

| item | direções hoje | com o oposto |
|---|---|---|
| `nota-na-pauta` | ler · escrever | ler · escrever · **audiar** |
| `nota-no-instrumento` | identificar · achar | identificar · achar · **audiar** |
| `intervalo-na-pauta` | ler · escrever | ler · escrever · **audiar** |
| `intervalo-no-instrumento` | identificar · construir | identificar · construir · **audiar** |
| acorde na pauta / no instrumento | *(a reorganizar)* | ler · desenhar · **audiar** |

E o padrão está provado: **o modo já existe**, construído em 10/11 no gerador de leitura — a pauta
aparece, nada soa, você audia, e o som vem como conferência, com nota ou tríade de contexto.

---

## 3. A matriz

Cinco linhas. Todas com: contexto antes, resposta em superfície escolhida, e a direção `audiar`
disponível no item de notação/instrumento correspondente.

### 3.1 Nota

| | |
|---|---|
| estímulo | uma nota, depois do contexto |
| resposta | a nota que tocou, na superfície escolhida |
| ⚠️ conferência | **a oitava exata**, não a classe de altura |

**A oitava exata só aqui** (decisão do Paulo). Hoje a resposta é por classe de altura, e clicar a
oitava errada acerta — foi isso que escondeu o bug do teclado que ele achou em 09/11.

Parâmetros: restringir às notas de dó maior, dó menor, ou as doze · restringir a notas que ele
escolhe · extensão livre até duas oitavas acima e abaixo · superfície de resposta (padrão: o
instrumento do perfil) · timbre.

Duas regras de geração, dele:

- **nunca a tônica na mesma altura da referência** — só oitavas dela;
- **nunca a mesma nota duas vezes seguidas**, e variar passando por várias, *"mas com alguma
  repetição para não ser um shuffle perfeito"*.

> A segunda é a única coisa da lista que pede **motor novo e genérico**: um sorteio com peso que
> decai para quem saiu recente. Nenhum exercício do app tem isso hoje, e serviria a todos.

### 3.2 Melodia

| | |
|---|---|
| estímulo | de 3 a 8 notas (padrão 3), depois do contexto |
| resposta | as notas, na ordem |
| ⚠️ conferência | **contorno** — ver §4 |

Parâmetros: quantidade (2 a 8, padrão 3) · as mesmas restrições de nota e extensão · **salto máximo
entre notas** (padrão: quinta justa) · superfície · timbre.

Interface: botões para ouvir as notas separadas — **já existe** (`partes`, no Player).

### 3.3 Intervalo harmônico

| | |
|---|---|
| estímulo | duas ou três notas juntas, depois do contexto |
| resposta | as notas |
| ⚠️ conferência | **contorno** |

Parâmetros: **se a nota central sempre participa** · quantidade (2, máximo 3) · restrições de nota e
extensão · superfície · timbre com sustain bom, para o intervalo segurar.

### 3.4 Qualidades de acorde

| | |
|---|---|
| estímulo | um acorde, depois da tônica |
| resposta | dois modos: alternativas com a descrição, **ou** desenhar o acorde na pauta, no piano ou no violão |

Parâmetros: **fundamental sempre a mesma** (padrão: sim, dó) · qualidades · extensões · inversões ·
superfície (padrão: o instrumento do perfil, ou piano se for baixo) · timbre · arpejar antes · qual
cadência de contexto.

> ⚠️ **Fundamental fixa muda a pergunta**, e isto já foi aprendido em 10/11 no acorde do braço: se é
> sempre dó, "que acorde é" tem uma resposta. Com fundamental fixa **e** inversões ligadas, a
> pergunta vira *qual nota está no baixo*. Com fundamental fixa e só qualidades, vira *qual
> qualidade*. São três perguntas diferentes conforme o que está fixo, e o item tem de escolher.

### 3.5 Acordes num campo harmônico

| | |
|---|---|
| estímulo | contexto (cadência por padrão) e um acorde do campo — ou de fora dele |
| resposta | **qual grau**, e opcionalmente a qualidade também |
| ⚠️ conferência | **uma pergunta, não duas** (decisão do Paulo) |

Só acerta quem acerta as duas partes. Duas perguntas separadas inflariam o histórico e deixariam a
pessoa "80% certa" por acertar só o grau.

Parâmetros: qual campo (padrão dó maior) · detalhamento da resposta · tétrades ou tríades (padrão
tétrades) · inversões · extensões · quais graus incluir (padrão todos) · **empréstimos modais**
(padrão não) · arpejar antes · qual cadência.

Os empréstimos já estão aprovados (09/11): o grupo do **menor paralelo** — `iv`, `♭VI`, `♭VII`,
`♭III`, `iiø` — mais o **♭II napolitano** como sabor à parte.

---

## 4. A conferência nova: contorno

Hoje existem duas, e nenhuma serve a melodia:

| | problema |
|---|---|
| `pitchClass` | frouxa demais — acerta na oitava errada. Foi o que esconderia o bug do teclado |
| `pitch` | rígida demais para melodia — exigiria a oitava absoluta de cada nota |

O Paulo pediu a do meio, e definiu bem: *"não dá pro usuário ouvir uma nota, saber qual é, ouvir uma
nota acima e dizer que estava abaixo"*.

**A regra:** a resposta está certa se **toda** nota dela está deslocada da esperada pelo **mesmo**
número de oitavas. O conjunto inteiro pode subir ou descer junto; notas soltas, não.

```
esperado  [60, 64, 67]
certo     [60, 64, 67]   deslocamento 0
certo     [48, 52, 55]   deslocamento −12 em TODAS
errado    [60, 52, 67]   a do meio desceu sozinha → o contorno inverteu
```

É um `Expected` novo e serve melodia, intervalo harmônico e os padrões de escala.

---

## 5. Contexto: duas cadências

Decidido: **ii–V–I** e **I–IV–V–I**. A primeira para jazz, a segunda porque é o jeito mais claro de
estabelecer tonalidade. Mais a tônica sozinha e a tríade, que já existem.

É um gerador novo — ritmo, voicing e registro das cadências. Não é grande, mas não é nada.

---

## 6. Nome e módulo: junta o nome, mantém a medida

A porta se chama **Ouvido relativo**. O Paulo tem razão de que "percepção melódica e harmônica" é
jargão, e que no fundo é uma habilidade só.

Mas os módulos `perception.melodic` e `perception.harmonic` **continuam existindo por baixo**. Eles
governam cor, histórico e Progresso, e é o que permite o app dizer que o harmônico está atrás do
melódico. Nome é para a pessoa; módulo é para a medida, e não precisam coincidir.

> Vale registrar a tensão: em 09/11 o próprio Paulo disse que melódico e harmônico são dois ouvidos
> — *"sem ordem no tempo, o ouvido tem de ouvir a fusão"* —, e foi por isso que a rotina do fone tem
> duas etapas de intervalo em vez de uma com "misto". As duas coisas são verdade em granularidades
> diferentes, e esta decisão preserva as duas.

---

## 7. Timbre: piano de amostras, e o pré-requisito que ele expôs

Decidido: **piano de amostras**, só onde é piano. O drone e as cordas continuam sintetizados — a
corda pulsada soa como corda, e o drone precisa sustentar indefinidamente, o que amostra não faz bem.

Também pedido: **um synth mais limpo** como opção, e **a duração das notas sempre configurável**.

### O custo, medido em 10/11

O app todo são **1,22 MB**, dos quais **580 KB são a VexFlow** — que só baixa ao abrir a leitura
rítmica. A primeira carga real é ~640 KB.

Um piano decente: uma amostra a cada três semitons por ~4 oitavas, com as de permeio por
transposição. São ~16 amostras de 2–4 s; a 96–128 kbps mono, 30–50 KB cada → **500–800 KB**, da
mesma ordem da VexFlow, e carregável só quando um exercício com som abre.

### ⚠️ O pré-requisito

**O app não funciona offline.** Não há service worker nem manifest — só `logo.svg` em `public/`.

O sintetizador de hoje tem a virtude de não depender de rede: sempre soa. Trocar por amostras **sem
cache offline tornaria o caso de uso principal do Paulo pior** — ele estuda no ônibus, e o exercício
começaria em silêncio esperando download.

**O cache offline vem antes do piano**, e vale sozinho: hoje, num ônibus sem sinal, o app
provavelmente não abre.

---

## 8. O que já existe, o que falta

| | estado |
|---|---|
| contexto fixo como padrão | ✅ |
| ouvir as notas separadas (`partes`) | ✅ |
| responder entre todas as opções (`sequence`) | ✅ |
| superfícies de resposta pauta/teclado/braço | ✅ existem |
| inversões em qualidades | ✅ |
| direção `audiar` no gerador de leitura | ✅ |
| motivos pela escala — desafio | ✅ |
| relação melodia-harmonia — exploração 1 | ✅ |
| empréstimos modais | 🟡 aprovados, não implementados |
| reorganização do par de **acorde** | ❌ |
| conferência por **contorno** | ❌ |
| **cadências** como contexto | ❌ |
| direção `audiar` nos itens de nota, intervalo e acorde | ❌ |
| **campo harmônico** (grau do campo) | ❌ |
| sorteio **anti-repetição** | ❌ |
| **oitava exata** em "Nota" | ❌ |
| superfície de resposta como parâmetro dos de ouvido | ❌ |
| botões por **grau** | ❌ |
| motivos pela escala — **exploração** | ❌ |
| relação melodia-harmonia — exploração 2 e os quizzes | ❌ |
| **piano de amostras** | ❌ |
| **cache offline** | ✅ feito em 10/11 |

---

## 9. Relação melodia-harmonia: o que faltava na lista dele

O Paulo pediu ajuda para pensar. O que acrescentei, em ordem de valor:

1. **Onde a melodia fica em relação ao acorde** — acima, dentro ou abaixo. Muda a percepção
   drasticamente, e sabemos porque consertamos exatamente isto em 09/11 no `ouvido-celulas`: a mesma
   nota dentro do acorde ou uma oitava acima dele é quase outro intervalo para o ouvido. É o
   parâmetro que mais faltava;
2. **Um terceiro modo de quiz: a resposta é a RELAÇÃO, não o acorde.** O exercício é sobre função —
   "este Dó é a sétima deste acorde". Os dois modos dele perguntam o acorde ou o par grau+nota; este
   pergunta a coisa que o exercício ensina;
3. **Filtrar por "só notas que não pertencem ao acorde"** — o subconjunto difícil e valioso, as
   tensões. Hoje a exploração mistura, e as de fora são as que importam;
4. **Quando a melodia soa** em relação ao acorde — antes, junto, ou depois. Junto é fusão; depois é
   melodia sobre harmonia. Habilidades diferentes;
5. arpejar ou bloco, e a inversão — que ele já havia listado.

---

## 10. Motivos pela escala

De **3 a 6 notas** (alinhado em 10/11; ele havia escrito 3–5 numa mensagem e 3–6 no documento
anterior). O desenho completo está em `PE-padroes-de-escala.md`, e a metade de adivinhar está no ar.

Falta a **exploração**: a escada clicável, as posições à vista, o drone, e o link do vídeo do
ChicagoBassBuddy — que é onde o crédito clicável mora.

O texto de abertura foi aprovado em 10/11/2026 e está em `PE-padroes-de-escala.md`, §4.

---

## 11. Ordem proposta

Por valor sobre custo, não por posição na matriz:

1. ~~**cache offline**~~ — ✅ feito em 10/11. Service worker em `public/sw.js`, manifest, e
   aquecimento das telas sob demanda. Verificado com o servidor **desligado**: o app abre, navega e
   a leitura rítmica desenha partitura;
2. **conferência por contorno** + **oitava exata em Nota** — pequenas, e consertam a frouxura que
   hoje deixa acertar na oitava errada;
3. **direção `audiar`** nos itens de nota e intervalo — o padrão já está provado na leitura, e
   fecha uma coluna inteira da matriz;
4. **reorganização do par de acorde** — mecânica, o molde está escrito;
5. **cadências como contexto** — gerador novo, pequeno;
6. **campo harmônico** com os empréstimos;
7. **sorteio anti-repetição**, genérico;
8. **piano de amostras**;
9. **superfície de resposta como parâmetro** nos de ouvido;
10. **relação melodia-harmonia** — exploração 2 e os três quizzes. É o mais caro e, nas palavras
    dele, *"um dos exercícios mais difíceis e valiosos do app"*;
11. **exploração dos motivos** pela escala.
