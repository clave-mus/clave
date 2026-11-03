# F6 · Exercícios novos e curadoria

**O beta é largo** (decisão 48): o catálogo cobre os três instrumentos e as duas metades da
matriz. Isso é afordável porque **largura se mede em motores, não em exercícios** — as ~95 famílias
são presets sobre nove motores, e quatro já existem. Ver [catalogo.md](../catalogo.md).

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
- Remover a ferramenta "internalizar uma tonalidade" e o "copiar link", se ainda existirem.

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

Pontos cinzentos já conhecidos, que a visão marcou explicitamente: enarmonia no comparador de
escalas; "escolha de escala sobre acorde"; harmonização de melodia (não há melhor absoluto — o
caminho é tratar como laboratório de experimentação, com análise da relação de cada acorde com a
melodia, e não como quiz).

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
