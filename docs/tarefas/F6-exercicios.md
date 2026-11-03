# F6 · Exercícios novos e curadoria

**O beta é largo** (decisão 48): o catálogo cobre os três instrumentos e as duas metades da
matriz. Isso é afordável porque **largura se mede em motores, não em exercícios** — as ~95 famílias
são presets sobre oito motores de catálogo, e metade deles já existe ou está parcial.
Ver [catalogo.md](../catalogo.md).

**O trabalho aqui é curadoria e fusão, não adição.** O portão de qualidade se aplica em três
níveis (decisão 49): pesado no **motor**, de julgamento musical na **família**, nenhum no
**preset**.

A regra que vale em toda esta frente é a decisão 15: **reuso por padrão, código novo por exceção
justificada por escrito.** Antes de criar família nova, verifique se ela pode ser modo ou
configuração de um motor existente. Se não puder, a justificativa vai no PR e responde:
*esta capacidade é essencial para validar o produto no beta?*

---

## F6-1 · Treinamento auditivo hands-free

**Depende de:** F1-2. **Tipo:** `ambiente`.

Sessão de áudio contínua: toca a pergunta (intervalo, escala, acorde, grau), faz uma **pausa** para
a pessoa pensar, toca o gabarito, segue. A pessoa nunca responde nada.

- `requires: {}` — nada de instrumento, microfone ou voz. É o **único habitante do contexto "De
  bolso"**, o que dá para fazer até dirigindo.
- `validation: ['none']`, `outcome: 'unscored'`. Produz **atividade, não evidência** — e isso é
  esperado, não um defeito.
- Parâmetros: o que tocar (intervalos / escalas / acordes / graus), duração da pausa, quantos itens
  por sessão, se anuncia a resposta em voz ou só a toca.
- Reusa o conteúdo musical dos exercícios de ouvido que já existem — **não é motor novo**.

**Pronto quando:** dá para pôr o fone, travar a tela, e a sessão rodar do começo ao fim sem nenhum
toque.

---

## F6-2 · Quais notas tocaram

**Depende de:** F1-2, F2-2. **Tipo:** `serie`.

3 a 5 notas em sequência; a pessoa responde no teclado ou no braço.

- **Limite de salto configurável** (o que impede sequências impossíveis de ouvir).
- Material permitido: cromático ou só da tonalidade (vem da cascata, F2-1).
- Superfície de resposta: teclado ou braço (baixo e guitarra).
- É configuração dos motores que já existem — **não deve precisar de código novo** além do item.

**Pronto quando:** o item existe, passa no teste que gera centenas de perguntas e confere que a
resposta certa é alcançável na superfície oferecida.

---

## F6-3 · Visualizador de escalas, arpejos e desenhos

**Decisões de origem:** 16, 17. **Depende de:** F1-1, F4-4. **Tipo:** `ambiente`.

A ferramenta central da visão que **não existe hoje** — e, pela decisão 17, ela é a **mesma
superfície** usada pelos exercícios de identificação. Uma implementação, dois usos.

- Exploração livre do braço (baixo, violão, guitarra) e do teclado: escalas, modos, arpejos com
  inversões e extensões, tríades e tétrades, desenhos de acorde, CAGED.
- Navegar por região do braço; ver as notas, os graus ou os intervalos.
- **Comparador de escalas** — ver duas escalas e as diferenças entre elas, cuidando da enarmonia.
- Exploração de tonalidade: as notas, acordes e escalas que pertencem a ela.

**Modo "tocar" (decisão 89).** O mesmo componente passa a **soar e responder ao toque**. Ideias do
Paulo, **ainda não decididas para o beta** (`A15`): tocar melodias simples; **fixar notas** e depois
**arpejar, bater (strum) ou tocar em bloco** — acorde sem vários dedos; bends ligados e desligados;
parâmetros de cordas, afinação, timbre, intensidade e duração; efeitos e timbres com requisitos
extras (`A14`). **Reaproveite a camada de apresentação** (`audio/presentation.ts`): timbre,
intensidade, duração e "bloco ou arpejado" já existem. Só o strum é novo.

**O nome está em aberto** (`A13`). Não escolha um: trate "visualizador" como nome provisório.

**Antes de qualquer tela: um teste de som.** As vozes são sintetizadas, e efeitos e bends sobre um
timbre fraco soam brinquedo. Violão e baixo podem usar síntese de corda pulsada (Karplus-Strong);
o piano é o difícil. **Quem avalia o som é o Paulo** — uma IA não ouve.

**Pronto quando:** o mesmo componente de braço serve à exploração livre **e** aos exercícios de
identificar desenho, sem duas implementações.

**👤 A curadoria do que vale mostrar (quais digitações, quais regiões, o que é CAGED útil) é do
Paulo (baixo) e do Cavazzo (guitarra).**

---

## F6-4 · Aprofundar a família do braço

**Depende de:** F1-4, F6-3. **É a porta carro-chefe do catálogo.**

"Dominar as notas no instrumento" é o objetivo mais forte e mais concreto do Clave. É aqui que o
beta precisa ser **visivelmente bom**.

- Nomear a nota de uma casa; achar a casa de uma nota (já existem — F1-4 os funde).
- Intervalos pelo desenho entre duas casas (já existe).
- A partir de uma nota, localizar a terça, a quinta, a sexta… em várias posições.
- Desenhos de tríade e tétrade, com inversões, por conjunto de cordas.
- Extensões de escala para a direita e para a esquerda do braço.
- Modos gregos e suas digitações possíveis, no baixo.

Tudo como **parâmetro e modo** dos motores existentes sempre que possível (decisão 15).

**Pronto quando:** o objetivo "dominar as notas no instrumento" tem conteúdo suficiente para
sustentar a rotina "Mapear o braço do baixo" nas três durações (F3-6).

---

## F6-5 · Rotinas de técnica viram item registrável

**Depende de:** F1-2. **Tipo:** `tarefa`.

A ferramenta `tecnica` existe (`src/tools/Tecnica.tsx`, metrônomo progressivo). Vira item de
catálogo do tipo **Tarefa**, com autoavaliação ao fim.

- Permutações de digitação como parâmetro.
- Registra em **que andamento** a pessoa praticou — **como contexto, nunca como recorde**
  (decisão 10). Sem "melhor marca", sem próximo degrau sugerido, sem celebração.
- Autoavaliação: *consegui / consegui com ajuda / preciso repetir* → `outcome: 'self_assessed'`.

**Pronto quando:** entra numa rotina como etapa do tipo Tarefa, grava a autoavaliação e o andamento,
e nada no app apresenta o andamento como pontuação.

---

## F6-9 · Dividir o quiz de teoria em quatro

**Decisão de origem:** 53. **Depende de:** FM-3.

`quiz-teoria` cobre seis tópicos e ocupa **quatro objetos ao mesmo tempo** — é o único assim. E o
problema é de porta: quem procura campo harmônico não procura "quiz de teoria".

Vira quatro itens, um por objeto:

| Item | Objeto | Tópicos de hoje |
|---|---|---|
| Graus e modos | `escalas` | `graus`, `modos` |
| Construção de acordes | `acordes` | `acordes` |
| Campo harmônico | `harmonia` | `campo`, `sub5` |
| Tonalidades e armaduras | `notacao` | `tonalidades` |

**O motor é o mesmo:** `theoryQuestion(topico, ctx)` já recebe o tópico. São quatro declarações e
zero código novo.

**Atenção aos ids:** `quiz-teoria` está em `STABLE_IDS` (e estava no `arsenal` padrão, que saiu na decisão 88). A migração precisa
mapear o id antigo para um dos novos — sugestão: o de **graus e modos**, que é o tópico padrão.

**Contrato de saída:** o teste de ids estáveis passa com a migração; e um teste confere que cada um
dos quatro tem **um objeto só**.

---

## F6-10 · Generalizar as escalas e as direções ✅ *feita em 03/11/2026*

**Decisões de origem:** 54, e os achados da revisão de 03/11.

Três consertos e uma generalização, todos em itens que já existem.

**`ouvido-celulas` — dois bugs reais:**

1. **As células repetem nota nas bordas.** O gerador é
   `out.push(clamp(anterior + pick([-2,-1,1,2]), 0, 5))`; ao chegar no 0 ou no 5, o `clamp` devolve
   o mesmo grau e sai `5 5 4`. Célula com nota repetida não é célula. **Sortear a direção dentro do
   que cabe**, em vez de cortar depois.
2. **Os distratores diferem demais.** Hoje são células sorteadas do zero. O documento de visão pede
   o contrário: *"distratores que diferem em apenas uma nota"*. **Gerar alterando uma nota da
   certa.**

**Generalizar a escala (decisão 54):** `ouvido-celulas` é pentatônico-only sem razão. Passa a
aceitar maior, menor natural, **harmônica e as duas melódicas**, modos e as duas pentatônicas. O
mesmo vale para qualquer item preso a uma escala por acidente.

**As duas menores melódicas são duas entradas na lista, não um interruptor** (decisão 70):

| Entrada | Rótulo (pt · en) | Subindo | Descendo |
|---|---|---|---|
| `menor-melodica` | menor melódica (clássica) · melodic minor (classical) | 6ª e 7ª elevadas | menor natural |
| `menor-melodica-jazz` | menor melódica (jazz) · melodic minor (jazz) | 6ª e 7ª elevadas | igual, 6ª e 7ª elevadas |

**As duas levam parênteses** (decisão 72). Chamar uma delas de só "menor melódica" afirmaria que ela
é a verdadeira e a outra o desvio — e é exatamente essa afirmação que criou a ambiguidade.

**Direção como parâmetro:** `ouvido-escala` só toca **subindo** — e menor natural, harmônica e
melódica se distinguem muito melhor **descendo**. Entra `sobe / desce / ambos`.

**O guarda que a decisão 70 exige, e ele é obrigatório:** **subindo, a melódica clássica e a jazz
são o mesmo áudio.** Com as duas marcadas e direção só ascendente, o exercício pede uma distinção
**fisicamente impossível** — é item ambíguo gerando "erro do usuário", o que a decisão 13 proíbe.
Nesse caso, ou toca descendo também, ou avisa e não deixa seguir.

**Contrato de saída:** teste que gera centenas de células e confere que **nenhuma repete nota**;
teste que confere que **todo distrator difere da resposta certa em exatamente uma nota**; o teste de
catálogo rodando com todas as escalas novas; e **um teste que prova o guarda**: com as duas
melódicas marcadas e direção ascendente, o item não produz pergunta — ele recusa a configuração.

---

## F6-6 · Lote de correções do piloto

**Depende de:** F1-4.

Coisas que a reforma da camada não resolve sozinha, levantadas no uso real:

- Layout de celular de "que nota é essa?" e de "que nota tocou?".
- Feedback de "que nota tocou?": cor imediata na tecla e aviso claro de acerto.
- Em "que nota tocou?": tirar a chance de cair sempre a nota dó; material permitido (só maior, só
  menor, todas) em vez de liga/desliga de teclas pretas; nota central configurável; extensão até
  duas oitavas.
- Extensão de linhas suplementares configurável em "que nota é essa?".
- Trocar entre intervalo harmônico junto e separado **sem resetar** o intervalo.
- Remover a ferramenta "internalizar uma tonalidade" ~~e o "copiar link"~~ *(o "copiar link" saiu em 03/11/2026, decisão 86 — estava quebrado)*, se ainda existir.
- **Tonalidade de referência em "que nota tocou?"**: hoje é um liga-desliga que sempre toca Dó.
  Virando `nenhuma / tônica / cadência / escala`, ele **vira o "identificar graus"** do catálogo,
  sem exercício novo.
- **Inversões** e **arpejo ou bloco** valem para as três superfícies depois da fusão do grupo C;
  hoje só `pauta-acorde` tem inversões e só `ouvido-acorde` tem arpejo.

**Pronto quando:** a lista está fechada e cada item foi conferido num celular de verdade.

---

## F6-7 · 👤 Revisão de ambiguidade teórica

**Decisão de origem:** 13. **Bloqueia a publicação de cada família.**

Antes de uma família ir para o beta, **o Paulo** tenta respondê-la de formas alternativas e
verifica (não há dono musical por área — decisão 51):

- Há mais de uma resposta defensável?
- O estímulo tem informação suficiente para escolher uma?
- A questão depende de um contexto que não foi informado?
- A correção automática distingue erro conceitual de erro de interpretação?

**Itens ambíguos ou sem solução única não devem gerar "erro do usuário".** Ou se corrige o item, ou
se aceita mais de uma resposta, ou se retira a família.

**Os pontos cinzentos conhecidos já foram decididos** na rodada de 03/11 — esta tarefa não
precisa redecidi-los, só verificar que o código os obedece:

| Ponto cinzento | Resolução |
|---|---|
| Enarmonia no comparador de escalas | comparação **por classe de altura**; par enarmônico tem como resposta certa *"são a mesma escala"*, com explicação na tela (decisão 67) |
| Escolha de escala sobre acorde | a pergunta **inverte** para *"esta escala serve sobre este acorde?"*, sim ou não. **"Nota a evitar" sai**: é propriedade do estilo, não do acorde (decisão 68) |
| Harmonização de melodia | **laboratório de transformações nomeadas**, sem correção, terminando por `tarefa` (decisão 69) |
| Voice leading | **medição, não julgamento**: a pessoa escreve a condução e o app diz onde ela caiu entre as válidas (decisão 64) |
| Análise de forma e frase | **saiu do beta** — onde termina uma frase é interpretativo. Está em [guardados.md](../guardados.md) |
| Menor melódica clássica × jazz | **duas escalas**, não uma opção, e subindo são o mesmo áudio — ver o guarda na `F6-10` (decisão 70) |

**Pronto quando:** cada família publicada tem a data da revisão registrada.

---

## F6-8 · 👤 Metade "com instrumento" do catálogo ✅ *recebida e classificada em 03/11/2026*

O rascunho chegou e foi absorvido: as famílias estão em
[catalogo.md](../catalogo.md#o-inventário), classificadas por objeto e tarefa, com o motor de cada
uma e as fusões já aplicadas.

O que resta são sete miudezas de leitura, em
[Questões abertas do catálogo](../catalogo.md#questões-abertas-do-catálogo) — nenhuma bloqueia a
construção dos motores.

O que o rascunho confirmou:

- Ele é quase todo do tipo **Tarefa** (autoavaliação), não de Série. O executor de `F3-2` precisa
  suportar isso, e **o padrão de validação com instrumento é autoavaliação** (decisão 37).
- Ele enche **Controle motor** e **Ritmo**, que estavam vazios.
- Ele trouxe os dois motores compartilhados — padrões e digitações —, agora na frente
  [FM](FM-motores.md).

**Continua valendo: não invente exercício de instrumento fora do catálogo.** Se faltar alguma
coisa, isso é conversa com o Paulo, não decisão de tarefa.

---

## F6-11 · 👤 Biblioteca de padrões rítmicos nomeados

**Decisões de origem:** 84, 85. **Bloqueia:** o item *Identificar o padrão*.

**Isto é tarefa de curadoria, não de código** — e o código que falta é quase nenhum, porque
`src/theory/rhythm-cells.ts` já tem a notação. A clave de son se escreve `8. 8. q 8 q` (intervalos
de 3, 3, 4, 2 e 4 semicolcheias) **hoje**, sem motor novo.

**8 a 12 padrões, poucos e bem feitos.** Quarenta mal atribuídos valem menos que oito certos.

Formato, em `docs/padroes-ritmicos.md`, uma entrada por padrão:

```md
### Clave de son (3-2)

- **padrão:** `8. 8. q 8 q`
- **intervalos:** 3 3 4 2 4 (semicolcheias)
- **origem:** Cuba
- **fonte:** <método, gravação ou pessoa>
- **revisado por:** <quem conhece a tradição> · <data>
```

**As três regras da decisão 85, e elas são bloqueantes:**

1. **Sem fonte, o padrão não entra no arquivo.**
2. Precisa de **revisão por quem conhece a tradição**, além da revisão do dono do produto.
3. **Se o time não tiver essa pessoa para algum padrão, o padrão não entra** — vai para
   [guardados.md](../guardados.md).

**Por quê tão rígido aqui, e não nos outros itens.** Clave e cáscara são afro-cubanas; telecoteco,
partido alto, baião, samba e coco são brasileiras. Nomear e grafar esses padrões é culturalmente
específico e há divergência real entre quem ensina. **Erro aqui não é erro de teoria — é erro de
atribuição**, e num app chamado Clave, feito por brasileiros, isso pesa diferente.

**Um fato já conferido, para não ser escrito errado:** a clave de son é `3 3 4 2 4` e a de rumba é
`3 4 3 2 4`. As cinco rotações da de son são `33424`, `34243`, `42433`, `24334` e `43342` — **a de
rumba não está entre elas.** São colares diferentes, não modos do mesmo. **Não escreva numa aula que
uma é modo da outra.**

**Pronto quando:** 8 a 12 padrões existem, cada um com fonte e com revisor nomeado e datado; e o item
*Identificar o padrão* consegue sortear entre eles sem nenhum `TODO` no caminho.
