# Incluir um item no catálogo

A lista do que precisa estar feito. **Metade tem teste automático** — onde há, o checklist aponta para
o teste em vez de pedir fé.

> Antes de começar, leia [camadas.md](camadas.md). A maioria dos erros deste projeto veio de não saber
> em que camada uma coisa morava.

---

## 0. Antes de escrever código: isto é um item?

**Pergunte primeiro se o que você quer não é parâmetro ou modo de um item que já existe** (decisão 15).
É a única coisa que impede o catálogo de virar 95 telas — são ~95 famílias sobre **oito motores**.

A regra de quando é um item ou dois tem **três casos, e só um funde** (decisão 52):

| Situação | Resultado |
|---|---|
| Trabalha **vários objetos ao mesmo tempo** | **um item**, com vários objetos declarados |
| **Objetos diferentes**, mesma tarefa | **itens diferentes** — identificar intervalo não é identificar acorde |
| **Mesmo objeto e mesma tarefa**, variando só a superfície ou o material | **um item**, com a variação como parâmetro |

E: **aparecer em duas tarefas é etiqueta; inverter o sentido da pergunta é item novo** (decisão 77).
"Análise de escalas" (ver e nomear) e "Construção de escalas" (dado o nome, escrever) são dois.

---

## 1. Declarar o item

**Um arquivo novo em `src/catalog/items/<id>.ts`** (item com `make`) ou uma entrada em
`src/catalog/ambientes.ts` (item com `screen`). Depois, **uma linha em `catalog.ts`**, que é só a lista.

O que é comum mora em `src/catalog/helpers.ts`, e ele reexporta o que vem de `theory/` — então o seu
arquivo abre com **dois imports**, não com cinco.

> **Antes de criar o arquivo, releia a decisão 15.** Item novo quase sempre é **parâmetro ou modo** de
> um que já existe: antes das fusões por superfície havia três telas para "qual nota é essa?". Se for
> mesmo um item novo, o arquivo tem de caber em **120 linhas** — se não couber, provavelmente há motor
> novo escondido ali, e motor novo é outra conversa.

- [ ] **`kind`** — `serie` (N perguntas → evidência) · `ambiente` (a pessoa para quando quer) · `tarefa`
      (autoavaliação, nunca "correto"). Não é configuração: **decide o executor e o que a etapa consegue
      afirmar** (decisão 5). *Travado em `context.test.ts`.*
- [ ] **`requires`** — `instrumento`, `microfone`, `voz`. Só estes três são declarados; olhos, mãos e
      áudio são **deduzidos** (`context.ts`). ⚠️ **Nenhum item pode exigir microfone ou MIDI** (decisões
      43 e 44): são acréscimos opcionais e experimentais. *Travado em `context.test.ts`.*
- [ ] **`validation`** — o primeiro da lista é o padrão. Com instrumento, o padrão é sempre
      `self_report` (decisão 37).
- [ ] **`objetos` e `tarefas`** — a taxonomia (objeto × tarefa). Os dois são plurais; o primeiro objeto é
      a "casa". *Travado em `taxonomy.test.ts`.*
- [ ] **`skillTags` e `contentTags`** — para encontrar e filtrar. **Não as use para agrupar por
      propósito**: é o item 3 abaixo, e usar tag para isso agrupa mal.
- [ ] **`primaryModule`** — o módulo em que ele aparece no catálogo.
- [ ] **`respeita`** — quais parâmetros de prática (`key`, `range`, `material`) o item de fato lê.
      ⚠️ **Não declare de memória:** rode `contexto-declarado.test.ts`, que mede as chamadas reais e
      falha se a lista mentir, para mais ou para menos.
- [ ] **`publicacao: RASCUNHO`** (ou omita — o padrão é rascunho) e **liste o item em
      [revisao-pendente.md](revisao-pendente.md)**, pelo id entre crases. *Travado em
      `publicacao.test.ts`.* **Nunca escreva `publicado`:** é decisão do Paulo (decisões 51 e 91).

---

## 2. As configurações

- [ ] **Toda configuração oferecida muda alguma coisa.** Ou o `make` a lê, ou ela declara `present`
      (muda como o som é tocado). *Travado em `configuracoes-vivas.test.ts`, que mede por Proxy.*
- [ ] **Não espalhe** `{...s}` dentro do `make` — isso leria todas as chaves e esconderia as mortas. O
      teste acusa.
- [ ] **`defaults` só com chaves que existem** como configuração. *Mesmo teste.*
- [ ] **`tier`** (dica de dificuldade) é opcional e **nunca ordena, esconde ou bloqueia** — só pré-marca
      o próximo passo da variação automática (decisão 9). Deixe vazio onde não há ordem natural.
      *Travado em `tiers.test.ts`.*
- [ ] **Configuração que torna a pergunta impossível** → `problema(s, ctx)`, que devolve a mensagem e faz
      o Player **recusar em vez de sortear** (decisão 13). O caso que criou isto: as duas menores
      melódicas são o mesmo áudio subindo.

---

## 3. Os grupos por propósito

- [ ] **A que propósitos este item serve?** Em `src/catalog/grupos.ts`. Um item pode estar em **vários
      grupos** — não é preciso eleger o principal.
- [ ] O critério é **"faz sentido na mesma etapa de rotina"**, não "treina a mesma habilidade". Metrônomo
      e "sustentar e cortar" compartilham `technique.tempo_control` e **não** combinam num aquecimento.
- [ ] Se não couber em nenhum, **deixe fora**: o botão de rodízio só aparece onde há o que oferecer.
- [ ] **O conteúdo dos grupos é curadoria do Paulo.** Proponha, não decida.

---

## 4. Textos

- [ ] **Título e descrição** em `exercises.<id>` (ou `tools.<id>`), **nos dois idiomas**.
- [ ] **Nenhum texto solto na interface** — tudo em `src/i18n/`. *Travado em `i18n.test.ts`, que exige as
      mesmas chaves em `pt` e `en`.*
- [ ] **O inglês não é tradução literal.** "Sem travar" e "sem procurar" não atravessam.
- [ ] ⚠️ **Texto envelhece em silêncio.** Se o item mudou de escopo, releia título e descrição: já
      aconteceu duas vezes ("Células pentatônicas" num item que aceita 13 escalas; a Técnica dizendo
      "três rotinas" quando havia quatro). **Nenhum teste pega isso** — só abrir a tela.

---

## 5. Som e histórico

- [ ] **Grafia correta por tonalidade** — em Fá maior aparece Si♭, nunca Lá♯. `theory/core.ts` resolve;
      não contorne. Para **nome de tonalidade**, use `keyName` (Si♭ maior, não Lá♯ maior).
- [ ] **O relógio do áudio não é o relógio da tela.** Use o agendamento com antecedência de
      `audio/engine.ts`; `setTimeout` não serve para música.
- [ ] **Timbre, volume, duração, arpejo** vêm da camada de apresentação (`audio/presentation.ts`). Um
      parâmetro de som novo entra **só ali** e passa a valer para todo item com áudio.
- [ ] **Se for ferramenta (`screen`), passe o snapshot** ao `useToolLog` — e **grave só o que o item
      usa**. Gravar o que ele ignora faz o histórico afirmar o que não aconteceu.
- [ ] **Andamento nunca é placar** (decisão 82). Se o item tem bpm, ele é configuração neutra; o app
      não o sobe sozinho sem a pessoa pedir, e nunca o comemora.

---

## 6. Teste do item

- [ ] **Centenas de perguntas geradas**, conferindo as invariantes — é o `catalog.test.ts`, que roda
      todo item automaticamente. Um item novo entra nele sem trabalho.
- [ ] **Distratores plausíveis**: diferem da resposta certa em **uma** coisa, e **cada um é uma resposta
      que o próprio gerador poderia ter produzido**. O erro que isto evita já aconteceu: distratores com
      nota repetida, que entregavam a resposta.
- [ ] **Enumere em vez de sortear com tentativa e erro**, onde o espaço for pequeno. Foi o que
      consertou os distratores de verdade.

---

## 7. Olhar o todo

**O passo que mais se esquece**, e o que impede ponta solta no código. Depois de incluir o item:

- [ ] **Ele cria um grupo novo?** Dois itens com o mesmo propósito já são um grupo.
- [ ] **Ele revela uma duplicata?** Se faz o mesmo que outro em outra superfície, **funde** (decisão 16).
      Já aconteceu: doze itens viraram quatro.
- [ ] **Ele devia ser parâmetro de um item que já existe?** Volte ao passo 0.
- [ ] **Ele preenche uma célula vazia da matriz** objeto × tarefa, ou abre uma nova? Ver
      [catalogo.md](catalogo.md).
- [ ] **Algum motor ficou duplicado?** Há **um** gerador de partituras (decisão 18) e **uma**
      implementação de braço virtual (decisão 17).
- [ ] **Alguma contagem em documento mudou?** "~95 famílias", "oito motores", o inventário por objeto.
- [ ] **Rode a suíte inteira.** Vários testes cruzam o catálogo com os documentos e falham de propósito
      quando um item novo não foi listado.

---

## 8. Publicar — só o Paulo

Os **oito portões** (decisões 49 e 85) estão em
[decisoes.md](decisoes.md#o-portão-de-qualidade-de-exercício). Eles não se aplicam todos no mesmo nível:
motor, família e preset têm portões diferentes.

**Nenhuma tarefa publica uma família.** Você entrega o motor testado e o item declarado em `rascunho`; a
revisão musical é passo humano (decisão 51). Como publicar está em
[revisao-pendente.md](revisao-pendente.md).
