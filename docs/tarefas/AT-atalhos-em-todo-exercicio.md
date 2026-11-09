# AT · Atalhos em todo exercício

Pedido do Paulo em 09/11/2026, depois de criar os sete atalhos do `ouvido-celulas`:

> Quero que depois a gente pense em presets pra TODOS os exercícios, e que isso seja uma parte
> importante da interface. Encontre uma boa maneira de encaixar isso.

**Isto é proposta, não tarefa pronta.** A escolha de onde os atalhos aparecem é decisão dele, e os
nomes são curadoria dele — está escrito no próprio tipo: *"o nome de cada preset é curadoria do dono
do produto"*.

---

## 1. Onde estamos

Os atalhos **já existem** desde a decisão 100, e são bons: chips nomeados pelo conteúdo, nunca por
nível. O que falta não é mecanismo.

| | |
|---|---|
| itens `serie` com arquivo próprio | 15 |
| com atalhos declarados | 3 — `ouvido-acorde`, `ritmo-ouvido`, `ouvido-celulas` |
| sem atalhos | 12 |

Os doze sem: `ache-a-nota`, `audiar`, `faca-o-intervalo`, `ouvido-escala`, `ouvido-intervalo`,
`ouvido-tecla`, `pauta-armadura`, `pauta-escala`, `que-acorde-e-esse`, `que-intervalo-e-esse`,
`que-nota-e-essa`, `teoria-intervalos`.

### O problema real

**O atalho é a entrada do exercício, e está escondido atrás de "Personalizar".** Para ver os sete
atalhos do `ouvido-celulas` a pessoa precisa abrir um painel chamado *personalizar* — ou seja,
precisa decidir que vai configurar algo antes de descobrir que não precisa configurar nada. É o
oposto do que um atalho serve para ser.

Desde 09/11 o primeiro atalho **é** o estado inicial do item, o que melhora bastante: quem abre já
cai no mais simples. Mas continua sem saber que os outros seis existem.

---

## 2. Quatro lugares possíveis 👤

### (a) Uma fila de chips sempre visível, acima da pergunta

O mais direto. Custo: ruído durante a prática, e um toque errado troca o exercício no meio da
sessão.

### (b) Uma tela de entrada: escolher o atalho antes de começar

Literalmente "o atalho é a entrada". A pessoa abre o item, vê os atalhos como cartões, escolhe, e
aí o exercício começa. Custo: um toque a mais **toda vez**, inclusive para quem já sabe o que quer
— e o Paulo estuda no ônibus, onde toque a mais pesa.

### (c) Manter no painel, mas abrir o painel na primeira visita ao item

Barato e discreto. Custo: resolve só a primeira vez, e não dá aos atalhos o peso que ele pediu.

### (d) No catálogo: o item se abre nos seus atalhos ⬅️ **minha recomendação**

Cada cartão do catálogo pode se expandir nos atalhos daquele item, e tocar num atalho abre o
exercício **já naquele atalho**. "Reconhecer melodia na harmonia" passa a oferecer, ali mesmo,
*Uma nota · Três notas · Cinco notas · Pentatônica · Sobre o V · Acorde sorteado · Menor*.

Por que este:

- **é onde a escolha já acontece.** Escolher o que praticar é o que se faz no catálogo; escolher
  como praticar, dentro do exercício. O atalho é "o quê", não "como";
- **engorda o catálogo sem criar tela nenhuma.** É a decisão 15 funcionando a favor: um item é uma
  declaração, e 15 itens com seis atalhos cada dão ~90 pontos de entrada sobre os mesmos oito
  motores. Era exatamente o medo que a decisão 15 existe para evitar — 95 telas — resolvido do lado
  certo;
- **não custa toque a quem já sabe:** o cartão continua abrindo o item direto, e os atalhos são
  um segundo gesto opcional;
- **não suja a tela de prática.** O painel "Personalizar" segue existindo para quem quer mexer
  fino, com os mesmos chips.

Nada impede (d) **e** (c) juntos.

---

## 3. A ideia que vale mais que o lugar

Se os atalhos vão ser parte importante da interface, o ganho maior não é onde ficam os chips: é
**virarem o vocabulário comum do app**.

Hoje uma etapa de rotina guarda um punhado de configurações — um objeto. A pessoa que abre a rotina
vê "Reconhecer melodia na harmonia" e não sabe qual dos sete recortes está ali. O histórico tem o
mesmo problema: todas as tentativas do item caem no mesmo balde, e "acertei 80%" mistura *uma nota
em dó maior* com *três notas sobre acorde sorteado*, que não são o mesmo exercício nem de longe.

Com atalhos nomeados, as três coisas passam a falar a mesma língua:

| hoje | com atalho |
|---|---|
| etapa: "Reconhecer melodia na harmonia" | etapa: "Reconhecer melodia na harmonia · Sobre o V" |
| histórico: um balde por item | um balde por atalho, comparável consigo mesmo |
| catálogo: 15 cartões | 15 cartões que se abrem no que de fato se pratica |

**Isto é decisão de produto, e é maior que a tarefa.** Em particular, separar o histórico por
atalho mexe em como o Progresso conta — e nada disso pode virar percentual de domínio nem rótulo
sobre quem usa, que a visão proíbe. Fica registrado aqui para o Paulo decidir, não para eu fazer.

---

## 4. O que a tarefa seria, depois da decisão

1. **Declarar atalhos nos doze itens que não têm.** Mecânico depois que os nomes existem, e o
   `presets.test.ts` já pega atalho escrito errado — configuração inexistente, valor que não é
   opção, nome sem tradução nos dois idiomas, primeiro atalho que não gera pergunta válida.
2. **Os nomes.** 👤 Curadoria do Paulo, item por item. É o passo caro, e é o único que não pode ser
   delegado: um atalho mal nomeado é pior que atalho nenhum, porque promete um recorte e entrega
   outro.
3. **O lugar**, conforme a decisão da seção 2.
4. Se a seção 3 for aprovada: etapa de rotina e histórico passam a guardar o id do atalho.

### Para ajudar a decidir os nomes

Proponho eu rascunhar, para cada um dos doze, **três a cinco atalhos candidatos com o motivo de
cada um** — como fiz com "sobre o V", "acorde sorteado" e "menor". O Paulo corta, renomeia e
aprova. Assim ele gasta a rodada de decisão julgando propostas concretas, em vez de inventando de
página branca. É o que funcionou nos sete deste exercício.

---

## 5. Não faça

- **Atalho com nome de nível.** Nem "básico", nem "intermediário", nem "avançado" — decisão 100, e
  está no comentário do tipo. O nome diz o **conteúdo**.
- **Atalho que é só "tudo ligado".** `ouvido-acorde` tem um, e faz sentido ali porque a lista de
  qualidades é o próprio eixo do item. Não generalizar.
- **Mais de uns sete por item.** Passando disso a fila deixa de ser atalho e volta a ser
  configuração, só com mais cliques.
- **Inventar nome por conta.** Ver a regra nº 1 do `CLAUDE.md`.
