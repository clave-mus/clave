# Padrões rítmicos nomeados

Material para o item *Identificar o padrão* (`F6-11`, decisões 84 e 85).

> **Nada aqui entrou no app, e nada entra sem as três regras da decisão 85:**
>
> 1. **Sem fonte, o padrão não entra.**
> 2. Precisa de **revisão por quem conhece a tradição**, além da revisão do dono do produto.
> 3. **Sem essa pessoa, o padrão não entra** — vai para [guardados.md](guardados.md).
>
> Este documento cumpre a regra 1 e **só ela**. A regra 2 é passo humano, e a 3 depende de quem o
> time encontrar. **Toda linha `revisado por:` está em branco de propósito** — é o que impede o
> material de ser usado antes da hora.

**Por que o rigor aqui é maior que no resto do catálogo.** Clave, cáscara, tresillo e cinquillo são
afro-cubanos; telecoteco, partido alto, baião, samba e coco são brasileiros. Nomear e grafar esses
padrões é culturalmente específico, e **há divergência real entre quem ensina**. Errar aqui não é
erro de teoria, é **erro de atribuição** — e num app chamado Clave, feito por brasileiros, isso pesa
diferente.

---

## A convenção de grafia (decidir antes de escrever o resto)

O repositório já tem notação: `src/theory/rhythm-cells.ts`. A clave de son se escreve
`8. 8. q 8 q` **hoje**, sem motor novo.

Mas essa grafia carrega uma escolha: ela põe o ciclo inteiro em **um compasso de 4/4**, com a grade
em semicolcheias (3+3+4+2+4 = 16 semicolcheias). A outra convenção, igualmente comum, põe o mesmo
ciclo em **dois compassos de 4/4**, com a grade em colcheias. As duas estão certas; elas dizem coisas
diferentes sobre onde cai a pulsação.

**Isto é a primeira pergunta para o revisor**, e ela precede todas as outras: trocar de convenção
depois obriga a reescrever cada padrão do arquivo.

---

## Os candidatos

Doze. A coluna **o que o revisor decide** é o que um livro não resolve.

### Afro-cubanos

| Padrão | Origem | O que o revisor decide |
|---|---|---|
| **Clave de son (3-2)** | Cuba | nada de atribuição: `3 3 4 2 4` já está conferido (ver abaixo). Só a convenção de grafia |
| **Clave de son (2-3)** | Cuba | **se entra como padrão próprio ou como "a mesma, começada na outra metade"** — e, se entrar, a grafia exata |
| **Clave de rumba (3-2)** | Cuba | idem: `3 4 3 2 4` está conferido |
| **Tresillo** | Cuba | se é padrão ou **célula** (ele cabe em meio ciclo), e se vale listar separado da clave |
| **Cinquillo** | Cuba / Haiti | a atribuição de origem — a bibliografia o liga aos dois lugares |
| **Cáscara** | Cuba | **a que ele acompanha**: cáscara é padrão de acompanhamento, e a grafia muda com a clave sob a qual está |
| **Habanera** | Cuba | se é padrão rítmico ou **gênero**; o nome é usado para os dois |

### Brasileiros

| Padrão | Origem | O que o revisor decide |
|---|---|---|
| **Telecoteco** | Brasil (samba urbano) | **o caso mais divergente dos doze.** O nome é onomatopeia das sílabas do tamborim, e *quais* ataques ele nomeia varia entre quem ensina. Também: é padrão de tamborim, de caixa, ou de violão? A bibliografia usa os três |
| **Partido alto** | Brasil | é **um** padrão ou uma família; e se o que se ensina como "partido alto" no baixo/violão é o mesmo que no pandeiro |
| **Baião** | Brasil (Nordeste) | a grafia da zabumba; e se o padrão que os métodos de bateria chamam de baião é o que se toca no baião |
| **Samba** | Brasil | qual instrumento o padrão representa — "o samba" não tem um padrão só |
| **Coco** | Brasil (Nordeste) | se o time tem quem conheça. **Se não tiver, vai para guardados** (regra 3) |

---

## O que já está conferido, para não ser escrito errado

A clave de son é `3 3 4 2 4` e a de rumba é `3 4 3 2 4`.

As cinco rotações da de son são `33424`, `34243`, `42433`, `24334` e `43342` — **a de rumba não está
entre elas.** São colares diferentes, não modos do mesmo padrão. **Não escreva numa aula que uma é
modo da outra.**

---

## Fontes

Levantadas em 03/11/2026. São o cumprimento da regra 1, e **não** substituem a regra 2: um livro diz
como se grafa um padrão; ele não revisa a escolha de o chamar daquele nome dentro deste app.

### Afro-cubanos

- **Peñalosa, David. *The Clave Matrix — Afro-Cuban Rhythm: Its Principles and African Origins.***
  Bembé Books, Redway, CA, 2009. ISBN 1-886502-80-3. 318 p. É a referência mais completa em inglês:
  traz os exemplos em notação tradicional **e** em caixa (a grade de células), com capítulo de notas,
  bibliografia e discografia. Cobre son, rumba, guajeo, batá e bembé.
  Resenha acadêmica (útil para saber onde o livro é contestado):
  [Stover, *Ethnomusicology Review*](https://static1.squarespace.com/static/5a711c5b4c0dbfcb70986e89/t/6399b62160a93262707cb264/1671018019108/stover_penalosa_review.pdf)
  · [resenha no RILM/Gale](https://link.gale.com/apps/doc/A295170872/IFME)

### Brasileiros

- **Da Fonseca, Duduka & Weiner, Bob. *Brazilian Rhythms for Drumset.*** Manhattan Music / Alfred.
  Cobre samba, **partido alto**, bossa nova, **baião**, catererê, maracatu, marcha e frevo, com a
  notação de cada um e gravações de referência. Da Fonseca é brasileiro e ensinou no Drummers
  Collective — é fonte de dentro da tradição, não de fora.
  [editora](https://www.alfred.com/products/brazilian-rhythms-for-drumset-00-mmbk0009at)
  · [ficha](https://books.google.com/books/about/Brazilian_Rhythms_for_Drumset.html?id=HuZQUm_hhygC)

- **Livramento, Natália dos Santos. *O violão no samba: um estudo etnográfico em Florianópolis.***
  Dissertação de mestrado, PPGMUS/UDESC, 2017. Etnografia da performance de violonistas no samba, com
  as **concepções nativas** do que é a levada — inclusive o telecoteco como o nome que os músicos
  usam. É a fonte certa para a pergunta "de quem é esse nome?", que nenhum método de bateria responde.
  [texto integral (PDF)](https://sistemabu.udesc.br/pergamumweb/vinculos/00002d/00002dcc.pdf)

- ***Música Popular em Revista*** (IAR/UNICAMP), v. 10, 2025 — artigo que trata do telecoteco como
  sistema de notação silábica brasileira ("té" no ataque forte, "co" no fraco) e da sua relação com a
  caixa e o tamborim. Útil justamente porque **mostra a divergência** em vez de escondê-la.
  [PDF](https://econtents.sbu.unicamp.br/inpec/index.php/muspop/article/download/19941/14936/59924)

- **Ciro de Sousa** e a invenção do telecoteco — nota histórica do Instituto Memória Musical
  Brasileira. Entra como contexto de origem do **nome**, não da grafia.
  [Discografia Brasileira](https://discografiabrasileira.com.br/en/posts/244831/os-110-anos-de-ciro-de-sousa-um-dos-inventores-do-telecoteco)

### O que falta nas fontes

**Nenhuma das acima resolve a convenção de grafia** da primeira seção, porque cada uma escolhe a sua:
os métodos de bateria grafam em 2/4 ou em 4/4 conforme o gênero, e a bibliografia cubana usa a grade
de células. A escolha é do app, e é decisão de produto.

---

## Quem pode ser o revisor de tradição

A regra 2 pede uma pessoa por padrão (ou por grupo de padrões). O que o time tem hoje:

- **Afro-cubanos** — ninguém identificado. Sem essa pessoa, os sete não entram.
- **Brasileiros** — ninguém identificado *ainda*; é a conversa mais fácil de ter, porque o time é
  brasileiro e o Rio e São Paulo têm quem toque samba de roda profissionalmente.

**Enquanto esta seção estiver assim, o item *Identificar o padrão* não tem material e não entra.**
Isso não é atraso: é a regra 3 funcionando.
