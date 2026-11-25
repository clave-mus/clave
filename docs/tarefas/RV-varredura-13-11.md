# RV · A varredura de 13/11/2026

> Pedido do Paulo: *"avaliar os erros que tivemos e ver o que tu pode adiantar de correções nos
> outros exercícios que ainda não revisei"*.

Não é uma lista de consertos. É o resultado de olhar as **três rodadas de revisão** dele e perguntar
por que o mesmo defeito voltava — e depois conserta-lo onde ele mora, não onde ele apareceu.

**Estado:** 1539 testes, `tsc` limpo, `lint` sem erro novo (os 9 avisos são os de sempre), `build`
ok. Conferido no navegador. **Os commits seguem locais**, como nas rodadas anteriores.

---

## O padrão que estava por baixo das três rodadas

Ele achava um defeito numa tela. Eu consertava **naquela** tela. O defeito seguia vivo nas outras, e
ele o reencontrava na rodada seguinte — a cada vez parecendo um defeito novo.

A causa era sempre a mesma: **a conta estava copiada em cada item.**

| conta | cópias | o que divergia |
|---|---|---|
| `notaEscrita` | **cinco** | quatro com sustenido fixo; só a de `contexto-musical` olhava a tonalidade |
| `casaDaAltura` | três | duas devolviam a casa 0 da corda mais grave quando o braço não alcança — **nota errada, desenhada calada** |
| `nomeNaTonalidade` | duas | uma sorteava a grafia com `Math.random()`, ignorando a tonalidade |
| `alturaNoBraco` | duas | — |

A de `notaEscrita` é a mais ilustrativa: a tabela de doze pares letra/acidente **já existe no motor**,
em `fromMidi`. O CLAUDE.md diz, nessas palavras, *"`src/theory/core.ts` já resolve isso. Não
contorne"* — e havia seis contornos, um deles escrito por mim em 13/11.

### Um conserto de fundo, de passagem

`notaGrafada` escolhia o lado da grafia por `[1, 3, 5, 8, 10].includes(tonic)`, que **ignora o
modo**: em Ré menor dava sustenido, e Ré menor tem **Si♭**. Era o exemplo do CLAUDE.md ("em Fá maior
aparece Si♭, nunca Lá♯") de cabeça para baixo. Agora o critério é a armadura.

Medido: muda em **seis tonalidades, todas menores** — dó, ré e sol menores passam a bemol; dó♯, ré♯ e
sol♯ menores, a sustenido. Em nenhuma maior muda nada.

---

## O que a varredura achou nos itens que ele não revisou

`src/catalog/varre-superficies.test.ts` faz as mesmas perguntas a **todos** os itens de série: 19
itens × 3 instrumentos × 6 tonalidades × cada parâmetro variado, sobre duas bases de configuração.

| achado | onde | gravidade |
|---|---|---|
| **armadura não desenhada** com tonalidade escolhida | `intervalo-na-pauta`, `acorde-na-pauta`, `pauta-escala` | a decisão D2 valia em três das nove telas de pauta |
| **resposta impossível no teclado**: faixa 48–72 fixa, acorde até 83 | `ouvido-acorde` | ⚠️ aparece como erro da pessoa |
| **resposta impossível no braço**: pedia MIDI 64 num baixo cuja última casa dá 55 | `ouvido-acorde`, `ouvido-intervalo` | ⚠️ idem |
| **tônica contra a armadura**: "escala de Fá♯ maior" sob cinco bemóis | `pauta-escala`, `acorde-na-pauta` | enunciado contradizendo o desenho |
| **braço soando de piano** | `ouvido-acorde`, `ouvido-intervalo`, `melodia-de-ouvido` | a queixa dele de 13/11, nos itens onde ele não chegou |
| **`alturaDoPc` estoura o teto** quando nenhuma oitava da classe cabe na janela | motor, afetando dois itens | oito das doze classes, com a janela estreita do braço |
| **melodia sorteada fora do braço** | `melodia-de-ouvido` | a nota sem casa era desenhada na casa errada |

Os dois de ⚠️ são os piores da lista, e pela mesma razão: **a tecla não existia na tela**. Quem
"errou" não errou nada.

---

## As duas invariantes que eu quis escrever e a medição desmentiu

Ficaram registradas dentro do teste, porque as duas pareciam óbvias e as duas estavam erradas:

1. *"a nota desenhada concorda com a armadura"* — acusou **Fá♯♯ em dó maior**, e eu já estava
   consertando. Mas Si aumentado **é** Si–Ré♯–Fá♯♯; grafar Sol ali faz dele outro acorde. Acorde e
   escala alterados produzem grafia fora da tonalidade **por definição**. O que precisa seguir a
   tonalidade é só a **tônica sorteada**, que é enunciado — e essa entrou;
2. *"toda marca no braço é nota que soa"* — acusou `melodia-de-ouvido` **audiando**, onde a melodia
   não deve tocar: ver e imaginar é o exercício. A invariante proibiria audiar.

Medir antes de afirmar me impediu duas vezes de "consertar" o que estava certo. É a parte desta
rodada que eu mais queria deixar escrita.

---

## Erros meus nesta rodada

- **zerei o acorde do `ouvido-acorde`** com um erro de aliasing: `caberNaFaixa` devolve os mesmos
  arrays quando não desloca, e um `length = 0` na cópia-que-não-era-cópia apagou a fonte. Ficou sem
  nota, sem marca e sem som — e **as três invariantes passaram**, porque pergunta vazia cabe em
  qualquer superfície. Quem pegou foi outro teste, por acidente; daí o guarda "toda pergunta tem
  conteúdo", que é a rede que faltava;
- **deslocar o acorde e esquecer a fundamental**: o contexto soava numa oitava e o desenho estava
  noutra — a referência que deveria ancorar o ouvido apontava para fora do que se vê;
- **o primeiro guarda variava um parâmetro por vez**, e o defeito do teclado vive no cruzamento
  *superfície × conteúdo* (desenhar **e** tétrade). Com uma base só, o teste passava no estado
  anterior: as tríades do padrão chegam a 71, um semitom abaixo do teto fixo de 72;
- **o teto do guarda do som**, escolhido primeiro em 0,6, passava a 0,009 do estado anterior —
  reprovaria por sorte do sorteio, não por defeito. Refiz medindo os dois motores com as mesmas
  sementes;
- **mexi no estado local do preview** para conferir no navegador (tonalidade de três itens, settings
  de um, e o instrumento do perfil) e **não guardei um retrato antes**. Restaurei o que tinha
  registro; o instrumento do perfil ficou em **baixo**, e eu não sei qual era. São dois cliques no
  Perfil, e a lição é copiar o estado antes de mexer nele.

---

## O som do dedo, que veio no mesmo pedido

Ele: *"pode remover ainda mais o agudo percussivo dos dedos. ou deixar ele mais sutil. mas ja
melhorou bastante o som"*. Terceira vez que este defeito volta, e as duas rodadas anteriores
trataram sintomas reais sem **medir o dedo em separado** — por isso voltava.

A medida que o isola é rodar a mesma nota com `rnd = () => 0`: o que sobra na banda de 2–8 kHz é o
dedo. Em relação ao agudo que a corda produz sozinha:

| | antes | depois |
|---|---|---|
| graves do baixo (Mi1, Sol1, Lá1, Mi2) | 0,02 – 0,06 | iguais |
| Mi3 (violão) | 0,95 | 0,31 |
| **Mi4 (violão)** | **1,38** | **0,23** |
| Lá4 (violão) | 0,81 | 0,15 |

Em Mi4 o dedo acrescentava **mais agudo que a corda inteira**, e é exatamente onde ele ouvia metal.
A causa era física errada: o ruído só passava pelo filtro do laço, cujo corte acompanha a
fundamental — **o dedo ficava mais agudo em corda mais fina**, como se a polpa mudasse de material.
Agora passa por um passa-baixa de corte fixo (900 Hz, dois polos), porque o contato dura o mesmo
milissegundo em qualquer corda. A fundamental até subiu (7,3e-2 → 8,7e-2 no Mi4): o ruído deixou de
comer espaço na normalização do pico.

Antes disso tentei compensar a energia que o filtro come, e **piorou** — 1,38 → 3,35 —, porque um
polo cai 6 dB/oitava e devolver a energia total devolve justamente o agudo. Está escrito no motor
para ninguém tentar de novo.

---

## A pergunta de produto que a varredura levantou (regra nº 1)

**Acidentes duplos em tonalidade simples.** `acorde-na-pauta` pode mostrar **Fá♯♯, Ré♯♯ ou Si♭♭ em dó
maior**, e `pauta-escala` o mesmo. Teoricamente está correto — é a grafia de um Si aumentado —, e por
isso não mexi.

Mas "correto" e "bom para estudar" não são a mesma coisa, e **quais grafias o exercício deve sortear
é escolha sua**, não minha. Três caminhos, se você quiser mexer:

1. deixar como está: a teoria manda, e quem estuda acorde aumentado encontra dobrados na vida real;
2. sortear a fundamental de modo a evitar dobrados (preferir a enarmonia que dá grafia simples);
3. um parâmetro: "grafias difíceis — sim / não".

> ## ✅ Decidido em 19/11/2026: **fica como está** (caminho 1)
>
> O Paulo: *"eu acho que a teoria manda e a gente deixa assim"*. Fá♯♯ em dó maior continua
> aparecendo, porque é a grafia certa de um Si aumentado. **Não reabrir**: propor de novo evitar
> dobrados é desperdiçar uma rodada de decisão dele.

Nenhum deles é conserto; são três produtos diferentes. Fica registrado para uma conversa.

---

## Os guardas que ficaram

Todos com **contraprova feita**: cada um reprova o estado anterior ao conserto.

| guarda | onde | o que trava |
|---|---|---|
| a armadura é a da tonalidade | `varre-superficies` | a decisão D2, no catálogo todo |
| a resposta cabe na superfície | idem | teclado e braço, para toda altura esperada |
| toda pergunta tem conteúdo | idem | a rede contra pergunta vazia, que passa nas outras |
| a autoavaliação tem o que conferir | idem | preventivo: o Player espera pelo pedaço `resposta`, e um item sem ele **travaria** |
| o timbre segue a superfície | idem | braço desenhado nunca soa de piano |
| o dedo soa como dedo | `audio/corda.test.ts` | o agudo do dedo contra o da corda, com teto medido dos dois lados |

A exceção, única e com a razão escrita: **`pauta-armadura`**, onde a armadura não é o cenário da
pergunta — **é** a pergunta. É a mesma distinção que o `contexto-musical.ts` já fazia do material: *o
parâmetro filtra o que o app sorteia, não o que o app pergunta.*
