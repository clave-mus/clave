# Decisões do Clave

Registro das decisões de produto e plataforma: **o que foi decidido, quando, e por quê.**
Quando uma decisão mudar, edite aqui e anote a data e o motivo — o motivo é o que impede alguém
de desfazer sem saber o que está desfazendo.

Este documento **não repete** a visão. Ele registra escolhas e justificativas; a descrição do
produto está em [visao.md](visao.md).

---

## Histórico do documento

- **22/10/2026** — primeira versão, gerada numa sessão de perguntas e respostas.
- **29/10/2026** — revisão a partir de sete documentos novos.
- **02/11/2026 — reescrito do zero.** As duas versões anteriores foram **descartadas**.

> ### Por que a reescrita
>
> As versões de 22/10 e 29/10 tinham 33 decisões escritas e justificadas, e o código as seguiu com
> disciplina. O problema é que elas foram produzidas **sem planejamento humano genuíno** — o time
> "vibe-codou" o começo, houve falha de comunicação, e decisões que ninguém tomou de propósito
> viraram código.
>
> O resultado mais visível foi a **metáfora de academia**, que nunca foi uma decisão de produto e
> ainda assim chegou ao título da aba, à navegação, aos textos e às cinquenta ilustrações.
>
> **Nem tudo ali estava errado.** Oito decisões sobreviveram por mérito e estão marcadas abaixo
> com **↻ mantida de 29/10**. As outras 25 foram descartadas ou substituídas.

---

## Produto

### 1 · O Clave é um ambiente de rotina de estudo

A rotina é o objeto central: a identidade do produto, não uma funcionalidade dele. A
configurabilidade é o mecanismo que torna a rotina pessoal; a profundidade pedagógica é a prova de
seriedade. Ver [visao.md](visao.md).

**Motivo:** "ter tudo num lugar só" é conveniência de agregação, fácil de copiar e já entregue por
catálogos de percepção maduros e por visualizadores de braço bons. Montar e executar a própria
rotina é a única coisa que nenhum concorrente faz — e portanto a única hipótese cuja resposta não
se obtém olhando para o mercado.

**Substitui:** a decisão 1 de 29/10 ("ambiente de estudo, não academia") e a metáfora de academia
inteira, que não era decisão e sim resíduo.

### 2 · Metáfora de academia descartada · identidade **Campo**

Nada de "grupo muscular", haltere, medalha, "arsenal" ou `Clave: academia musical`.

**Direção escolhida em 02/11/2026: Campo**, entre três propostas (Campo, Régua, Horta). Um campo
de cor granulado como **único** elemento decorativo, por trás de uma base tipográfica muito quieta.
A cor do produto vem do campo, em vez de ser um acento solto por cima dele.

| | Claro | Escuro |
|---|---|---|
| fundo | `#fbf8f4` | `#100f11` |
| superfície | `#ffffff` | `#1a181b` |
| texto | `#1b1917` | `#f1ece6` |
| acento | `#c14a2b` | `#f08a4b` |
| acento sobre destaque sutil | `#9e3c20` | `#f3a575` |

Tipografia: **Instrument Sans**, servida pelo próprio app (`@fontsource`), nunca por CDN — nada do
uso vaza para terceiro. Título e corpo são a mesma família; o que separa é peso e *tracking*.

**A regra que define a direção, e que não se quebra:** o campo aparece **só** em fundo de tela,
cabeçalho e estado vazio. **Nunca** em botão, cartão, ícone ou qualquer coisa que se toque. Sem ela
o Clave vira "mais um app com gradiente", que é o risco declarado desta direção.

**Tema claro e tema escuro, os dois de primeira classe**, com escolha explícita no Perfil (claro /
escuro / seguir o sistema). Todos os pares de cor passam em AA (≥4,5:1) nos dois temas — conferido
com elemento recém-criado, porque trocar `data-theme` por script não recalcula a árvore já
renderizada.

**Motivo:** decisão inicial mal planejada que afetou demais o código. O dono do produto não gosta
da ideia de academia e nunca a escolheu.

**Custo conhecido:** vaza por 13 arquivos de `src/`, por `index.html`, e pelo gerador de arte
inteiro (`design/art.mjs`, 463 linhas, 50 SVGs).

### 3 · Princípio-mestre: estrutura sem rigidez, maleabilidade sem desorientar

É o critério de aceite de toda decisão de interface. Ver [visao.md](visao.md).

### 4 · Dois regimes de prática, um objeto

Uma rotina com **dois modos de execução** (livre e guiado), e não dois objetos diferentes.
O conceito de "paleta" / `arsenal` **morre**: rotinas o absorvem.

**Motivo:** o dado por baixo é idêntico nos dois regimes — uma lista de itens com parâmetros. Só a
postura da execução muda. Dois objetos significariam dois editores, dois executores, e a dúvida
permanente de "isto eu salvo como paleta ou como rotina?".

**O `arsenal` atual é uma pasta de favoritos fingindo ser prática:** guarda *qual* exercício, não
*como ele estava configurado*. O valor está no preset, não no favorito.

### 5 · A etapa declara o seu tipo de término

Três tipos — **Série**, **Ambiente**, **Tarefa** — e o tipo é propriedade do item no catálogo, não
escolha de configuração. Ver [visao.md](visao.md).

**Motivo:** é o único desenho que cobre o catálogo inteiro. Quiz termina por contagem; metrônomo
não termina nunca; "toque esta escala limpo" termina quando a pessoa diz. Uniformizar em tempo
transforma o Clave em app de pomodoro; uniformizar em contagem deixa metade do catálogo de fora.

**Benefício secundário:** o tipo já diz que tipo de prova a etapa gera, então o Progresso não tem
como misturar atividade com evidência por acidente — os dados nascem separados.

### 6 · Validação é escolha da pessoa, não imposição do exercício

O item declara quais modos aceita; o padrão é **autoavaliação**. Microfone é acréscimo opcional.

**Motivo:** nem sempre há instrumento, microfone ou silêncio. Muita gente vai querer praticar com
a tela mostrando o material e julgando por conta própria.

**Consequência de escopo:** o microfone sai do caminho crítico do beta, exceto pelo afinador.

### 7 · Etapa é um conjunto de instâncias (ciclagem)

Uma instância é item + configuração. Uma etapa guarda um conjunto delas e cicla a cada execução.
Conjunto de uma instância = etapa comum, então não existem dois tipos de etapa no modelo.

- A rodada é resolvida **quando a etapa abre**, com botão discreto de **"trocar"**.
- O "último usado" fica guardado na etapa e **sobrevive entre sessões**.
- Política por etapa: em ordem (padrão), sorteado, ou sorteado sem repetir o último.

**A consulta por etiqueta ("exercícios que treinam a mesma habilidade") é assistente de montagem,
não mecanismo de execução.** O app nunca substitui em tempo de execução por algo que a pessoa não
pôs ali, e rotinas não mudam de comportamento sozinhas quando o catálogo cresce.

### 8 · Editor de rotinas entra no beta

Era Fase 2 na versão anterior.

**Motivo:** sem editor, a rotina é a que o time escolheu, com os presets que o time achou bons — e
o produto inteiro perde o sentido. A rotina pessoal **é** a proposta de valor.

### 9 · Variação automática por sugestão, nunca por imposição

O app propõe em linguagem clara e **abre o menu de opções**; a pessoa escolhe. Sem escada rígida.
Quatro guardas obrigatórias. Recorte do beta: **por exercício**, não por habilidade. Ver
[visao.md](visao.md).

**O gatilho é acertos seguidos, não taxa** — ver decisão 55.

**Motivo:** é a resposta direta ao princípio-mestre — a pessoa começa estreito e o Clave *oferece*
abrir, em vez de exigir que ela configure doze parâmetros no primeiro dia.

**Por que sem escada:** forçar progressão linear onde a ordem é variável é erro pedagógico. A
maioria dos parâmetros não tem ordem (não existe "clave de sol mais fácil que clave de fá").

### 10 · bpm é contexto registrado, nunca pontuação

**Motivo:** aumentar o metrônomo é a métrica mais fácil de medir e uma das piores de perseguir.
Muita coisa só se aprende devagar, e transformar bpm em recorde ensina a tocar rápido e sujo.

**Substitui:** a decisão 14 de 29/10, que mantinha "carga em bpm" com recorde pessoal e linha de
evolução. Cancelada inteira.

### 11 · Progresso não é aba, e não é central

Vive dentro do Perfil e de cada item. Medida principal: **tempo estudado**. Fora: badges, XP,
níveis, ranking, percentual de domínio, comparação entre pessoas, e **streak de dias praticados**.

> **Qual streak sai.** O de **dias seguidos praticados** — aquilo é cobrança disfarçada. A
> contagem de **acertos seguidos dentro de uma série** fica, e é visível: é informação útil, e é o
> gatilho da sugestão de variação (decisão 55).

**Motivo:** o Clave é plataforma de estudo séria. Progresso em destaque traz ideia de gamificação,
e o produto não precisa dele tanto quanto a versão anterior supunha.

### 12 · O registro de tentativas é infraestrutura interna ↻ *mantida de 29/10, com novo motivo*

O formato e a gravação ficam. O que muda é a justificativa: **não** existe para alimentar tela de
progresso, e sim porque (a) a variação automática é impossível sem ele e (b) é como o time
descobre que um exercício está quebrado.

**Motivo da mudança de justificativa:** o argumento original era "sem dado gravado não há
diagnóstico depois", e ele perdeu força quando o progresso deixou de ser central. Os dois motivos
novos se sustentam sozinhos.

### 13 · Ambiguidade teórica é preocupação estrutural ↻ *mantida de 29/10*

Antes de publicar uma família, alguém com conhecimento teórico tenta respondê-la de formas
alternativas: há mais de uma resposta defensável? o estímulo tem informação suficiente? a correção
distingue erro conceitual de erro de interpretação?

**Item ambíguo nunca gera "erro do usuário".**

**Motivo:** o catálogo tem vários pontos cinzentos marcados pelo próprio autor ("cuidar
enarmonia", "não há melhor absoluto", "cuidar com os pontos cinzas"). É também algo que quase
nenhum concorrente faz, e portanto diferencial real.

### 14 · Nunca confundir atividade com evidência de aprendizagem ↻ *mantida de 29/10*

Tocar no instrumento sem validação é **atividade**. Só resposta validada é **evidência**.
Autoavaliação é uma terceira coisa, marcada como tal. Sempre mostrar a quantidade de tentativas
junto de qualquer proporção.

### 15 · Reuso por padrão, código novo por exceção ↻ *mantida de 29/10*

Antes de adicionar uma família, verificar se ela pode ser **modo ou configuração** de um motor
existente. Uma família nova se justifica quando muda o objetivo cognitivo, a regra de validação ou
a estrutura da tarefa — não quando muda tonalidade, instrumento, timbre, número de notas ou
formato da resposta.

**Motivo:** o catálogo de referência tem cerca de 60 famílias. Sem essa regra, são 60 telas.

### 16 · Representação musical ≠ instrumento ↻ *mantida de 29/10*

Pauta, teclado e braço são **superfícies de resposta** disponíveis a qualquer pessoa — um baixista
pode querer responder vendo um teclado. Não existe um exercício por instrumento: o conteúdo
musical é compartilhado, e só execução e particularidades técnicas são específicas.

**Consequência:** exercícios que são a mesma tarefa em superfícies diferentes **se fundem** num só
com seletor de superfície.

**Feito em 04/11/2026** (`F1-4`). Onze ids viraram quatro. E a fusão mostrou que esta decisão é mais
forte do que parecia: **a superfície escolhe o que a pergunta consegue cobrar.** "Qual nota é essa?"
valida **grafia** na pauta (Dó♯ ≠ Ré♭, porque a pauta distingue) e **altura** no teclado e no braço
(onde a tecla é a mesma); "qual intervalo é esse?" cobra a **qualidade** na pauta e o **número de
semitons** no braço. Três telas separadas escondiam essa diferença — não eram três cópias, eram três
contratos de validação diferentes com o mesmo nome.

### 17 · Ferramenta e exercício são o mesmo tipo de objeto

Registro unificado, tela separada quando precisar. Itens do tipo Série usam o Player comum; itens
do tipo Ambiente podem ter tela própria.

**Motivo:** três problemas resolvidos de uma vez — o braço virtual deixa de ter duas
implementações (explorar e identificar), a ferramenta entra em rotina sem exceção no código, e
solfejo e ditado entram sem precisar ser espremidos dentro dos tipos `Visual`/`Surface`.

**Substitui:** a separação `ExerciseDef` / `ToolDef` do código atual.

### 18 · O gerador de partituras é infraestrutura ↻ *mantida de 29/10*

Não é uma ferramenta entre outras: alimenta leitura melódica, leitura rítmica, ditado, canto à
primeira vista e localização de notas. Os dois leitores atuais se fundem em um só — **motores
duplicados são proibidos**.

### 19 · Catálogo plano com várias portas

O catálogo é um conjunto de itens etiquetados. A interface oferece várias entradas sobre o mesmo
conjunto: **por objetivo (padrão)**, por área, por contexto, por instrumento, e busca.

**A regra de "uma localização principal" é derrubada.** Um item pode aparecer em três portas sem
problema. O que continua proibido é **duplicar a implementação** — duplicata em visão é
conveniência, duplicata em implementação é dívida.

**Motivo:** a regra antiga produziu o desequilíbrio visível no app de hoje — Teoria com 14 itens,
Técnica com 2, Harmônica com 2, Rítmica com 2 —, porque tudo que era notação, braço, teclado e
escala precisou escolher um módulo só e caiu em Teoria.

**Substitui:** a decisão 6 de 29/10.

### 20 · Oito portas por objetivo no beta

> **Feito em 04/11/2026** (`D2`): `src/catalog/portas.ts`, com os itens de cada porta, e o catálogo
> passou a abrir **por objetivo** por padrão. Quais itens ficam atrás de cada porta está em `P5` de
> [decisoes-provisorias.md](decisoes-provisorias.md), à espera de aval — e **duas portas (ritmo e
> técnica) têm menos de 4 itens visíveis**, porque o resto delas é rascunho.

Uma porta só existe se tiver **pelo menos 4 itens atrás dela e pelo menos um deles bom**.

Dominar as notas no instrumento *(carro-chefe)* · Melhorar o ouvido · Acompanhar e entender
harmonia · Aprender teoria musical · Aprender a ler partitura · Melhorar ritmo e groove · Melhorar
técnica e precisão *(entra sabendo que enche depois)* · Improvisar e solar *(redigida como "o que
prepara o improviso", porque não existe exercício de improvisar)* · mais a saída **"Não sei por
onde começar"**, que leva ao diagnóstico.

**Cortadas por falta de catálogo:** "compor e desenvolver criatividade" (zero itens) e "tocar
melhor com outras pessoas" (é comportamento de conjunto; o backing track arranha e só).
**Cortada por não ser objetivo:** "organizar meus estudos" — isso é o produto, não uma porta.

### 20b · Três abas: Praticar · Catálogo · Perfil

| Aba | O que é |
|---|---|
| **Praticar** | A home. As rotinas da pessoa, incluindo "De bolso". Filtro de contexto no topo. Um toque para começar. |
| **Catálogo** | Todos os itens, entrando por objetivo (padrão), área, contexto, instrumento ou busca. É daqui que se monta rotina. |
| **Perfil** | Conta, instrumento, afinação, idioma, timbres, volume — **e o histórico**, quieto, sem ser porta de entrada. |

O **afinador** é atalho fixo no cabeçalho: uso de 30 segundos não merece navegação.

**Motivo:** cada aba é uma promessa de que há algo ali, e o Clave tem três coisas — praticar,
encontrar e configurar. "Rotinas" não é aba separada porque rotinas **são** a home; "Teoria" não é
aba porque as notas moram dentro dos exercícios; "Progresso" não é aba pela decisão 11.

**Substitui:** as cinco abas de 29/10 (Hoje · Treinar · Rotinas · Progresso · Perfil).

### 21 · Personas são ferramenta do time, nunca da tela

As sete personas de referência servem para revisar decisões ("o Leitor Lento acharia isto?"). O app
**nunca rotula a pessoa**.

**Motivo:** remover o `ProfileKind` do onboarding foi acerto. Não existe nível global — alguém pode
ter harmonia avançada e dificuldade de leitura —, e dizer "você é o autodidata sem direção" é
constrangedor e errado.

### 22 · Nivelamento sugere, não decide

Um diagnóstico curto por objetivo, com itens em duas ou três configurações de dificuldade, usando
exercícios que já existem. O resultado **sugere** rotinas e configuração inicial. É **pulável sem
penalidade**: quem pula não é marcado como iniciante e nada é bloqueado.

Resultado **por objetivo e habilidade, nunca um nível único**.

**Motivo:** o gerador de sessão anterior foi removido por ser aleatório, central demais e rígido.
A pessoa é quem decide; mas um nivelamento que produz **sugestões** de rotina é útil e não tira
controle de ninguém.

**Substitui:** a decisão 5 de 29/10, que removeu qualquer forma de sugestão.

### 23 · Compartilhar rotina por link, sem biblioteca pública

No beta: exportar rotina, mandar o link, a outra pessoa abre e ganha uma cópia para adaptar.
**Nada é publicado** — sem listagem, sem perfil, sem busca, sem conta necessária para receber.
Crédito à rotina de origem.

**Motivo:** a diferença entre link e biblioteca é **jurídica, não técnica**. Publicar texto escrito
por usuário onde outro usuário lê herda, de uma vez: moderação de texto livre (nome e descrição de
rotina são texto livre), botão de denúncia, fila de revisão, termos de uso, LGPD, ECA Digital,
faixas etárias valendo e alguém de plantão.

**E o link já é o diferencial:** entrega exatamente "compartilhar maneiras de estudar", funciona com
quatro usuários, e "meu professor me mandou uma rotina do Clave" é melhor boca a boca do que uma
biblioteca vazia — que é o que uma listagem pública com 30 pessoas no beta seria.

**Consequência técnica obrigatória:** o **formato da rotina precisa ser versionado desde a primeira
versão**, com migração escrita. Link compartilhado é dado que sai do controle do app; mudança de
formato quebra links antigos.

### 24 · Aulas de teoria são nota de rodapé, não curso

Nota curta anexada ao exercício ("o que é um dominante secundário", três parágrafos, dentro do
exercício que pergunta sobre isso). As aulas longas que já existem ficam acessíveis, sem
investimento novo.

**Motivo:** a visão pede "explicações teóricas para ajudar a entender e realizar os exercícios".
Isso é nota de rodapé. Trilha de aprendizado é outro produto.

### 25 · Afinador entra no beta

Cromático, com predefinições para violão/guitarra padrão, Drop D, meio tom abaixo, e baixo de 4 e
5 cordas.

**Motivo:** detectar uma **nota sustentada monofônica** é o caso mais fácil de detecção de altura,
e o afinador **não precisa de baixa latência nem de detecção de ataques** — que é a parte cara.
É trabalho de dias. E é motivo diário de abrir o app para quem toca cordas.

*(Correção registrada: numa estimativa anterior desta sessão o custo do afinador foi somado ao do
microfone nos exercícios, que é um problema bem maior. São coisas diferentes.)*

### 26 · Monetização: doação, e só

Pix e uma plataforma internacional (Ko-fi ou equivalente), já que o app sai em dois idiomas. Sem
anúncios, sem plano, sem selo. Se um dia houver modelo pago: **vender profundidade, não a
possibilidade de estudar** — tonalidade, andamento e dificuldade nunca ficam atrás de pagamento.

### 27 · Idiomas: português e inglês ↻ *mantida de 29/10*

Com cifras por convenção de cada idioma e frases de quiz montadas com gramática própria, sem
tradução literal. Espanhol fica para depois.

### 28 · Nome

"Clave" fica. **Sem nome composto** — nada de "academia musical" nem "music gym".

---

## Plataforma e processo

### 29 · Um código só ↻ *mantida de 29/10*

O mesmo React vira site, PWA e, depois, apps de iOS e Android via Capacitor. Se a latência de áudio
virar problema, só o módulo de áudio vira plugin nativo. **O beta lança site e PWA.**

### 30 · Repositório em organização do GitHub

Criar uma organização (grátis) e **transferir** o repositório `bernardofens/clave` para ela, com
Paulo e Bernardo como donos e os outros dois como membros.

**Motivo:** o repositório está numa conta pessoal e o dono do produto não tem controle
administrativo. A transferência preserva histórico, PRs, configurações e até redireciona os links
antigos. Repositório novo custaria refazer CI, Cloudflare e Supabase e perder o histórico que
explica as decisões.

**Repositório segue público.** Não há segredo (chaves ficam em variável de ambiente) e o valor de
portfólio para quatro estudantes de programação é concreto.

**Substitui:** a decisão 25 de 29/10, que mandava torná-lo privado.

### 31 · Uma branch protegida: `main`

A `dev` é derrubada. Cada tarefa vira branch curta a partir da `main`, com PR para a `main`, CI
verde obrigatório e 1 aprovação. Sem force-push, sem exclusão.

**Motivo:** duas branches protegidas é cerimônia demais para quatro pessoas construindo um beta —
ninguém está cortando release, e cada PR já ganha link de prévia próprio no Cloudflare. **Resolve
de quebra a pendência** de qual branch o Cloudflare publica: produção é a `main`.

### 32 · Tarefas no repositório, draft PR como sinal de "peguei"

As tarefas vivem em [`docs/tarefas/`](tarefas/). Pegar uma tarefa é **abrir um pull request em
rascunho** com o ID da tarefa no título. Se ninguém abriu draft, a tarefa está livre.

**Motivo:** tarefa no repositório faz o agente de IA de cada pessoa ler a tarefa **e todo o
contexto ao redor** na mesma leitura, que é a vantagem decisiva sobre issue no GitHub. E o draft PR
dá o sinal de posse sem board, sem issue, sem ferramenta nova.

### 33 · Decisão de produto é do dono do produto

Os colegas executam tarefas com apoio de agentes de IA e **não tomam decisões de escopo ou de
produto**. Essas se tomam em conversa com o Paulo.

O [CLAUDE.md](../CLAUDE.md) carrega a regra: **se a tarefa estiver ambígua, se faltar informação,
ou se a solução óbvia contrariar a visão — parar e perguntar, nunca resolver por conta.**

**Motivo:** é exatamente a falha que produziu as duas versões anteriores deste documento.

### 34 · Análise de uso: adiada

PostHog estava na Fase 1 anterior. Sai do beta.

**Motivo:** a métrica que ele existia para medir era retenção semanal — métrica de app de
engajamento, vinda da mesma cabeça que escreveu a metáfora de academia. A hipótese do beta agora é
qualitativa (as pessoas montam e mantêm rotinas?), e se responde conversando com 20 a 30 pessoas.

### 35 · Contas opcionais com Supabase ↻ *mantida de 29/10*

Login por e-mail (link mágico), Google e Apple. Sem conta, tudo funciona local. O progresso local
migra para a conta no primeiro login. A conta pode ser apagada de dentro do app. Menores de 13 anos
seguem sem conta.

---

---

## Catálogo

*Decididas em 03/11/2026, na sessão sobre o catálogo. A descrição completa do modelo está em
[catalogo.md](catalogo.md).*

### 36 · O critério de um bom exercício

**Um bom exercício é um que ajuda o músico a praticar de forma eficaz.** Não é um que o app
consegue conferir, e **não é um que o app faz melhor que um papel**.

**Motivo:** o valor do Clave está na **rotina**, não no átomo (decisão 1). Um exercício que é só
"faça isto, aqui está o cronômetro" é uma etapa perfeitamente boa de uma rotina boa. Exercício
simples pode ser mais poderoso que o complexo.

**Consequência que protege a ideia:** *"o Clave acrescenta pouco a este exercício"* **não corta**.
Faz o item ser barato — entra como **preset de um motor existente**, nunca como tela nova.

*(Substitui um critério que eu havia proposto — "o que o Clave faz que um metrônomo e um papel não
fariam?" — e que media valor no exercício em vez de na rotina.)*

### 37 · Com instrumento, o padrão é autoavaliação

O app apresenta a tarefa; a pessoa julga. Validação por áudio é **bônus**, nunca requisito.

**Motivo:** quase todas as linhas de "Validação" do rascunho pedem microfone, e nenhum exercício
pode depender de uma capacidade opcional (decisão 6). Na prática, quase toda a metade "com
instrumento" é do tipo **Tarefa**.

### 38 · Rotação de parâmetro

A rotina avança **um** parâmetro por uma lista de valores, guardando **posição atual** e
**histórico de visitas** (que valor, quando, quantas sessões). **Avanço manual por padrão**;
"depois de N execuções" como opção.

Só rotaciona o que o catálogo declarar rotacionável: **tonalidade · região do braço · corda · modo
· qualidade de acorde**. Andamento **não** — isso é a camada *progressão de andamento*, e bpm não
é pontuação (decisão 10).

**O conjunto ABC é o mesmo mecanismo** com a lista sendo de rotinas em vez de valores. Um recurso,
não dois.

**Motivo:** vem de um plano real — estudar uma tonalidade por vez, por vários dias, atravessando
seis frentes dentro dela. Avanço automático quebraria exatamente esse uso: no terceiro dia o app
jogaria a pessoa na tonalidade seguinte quando ela ainda não está firme. **Quem sabe se
internalizou é ela.**

### 39 · O histórico guarda os parâmetros

O registro de atividade passa a gravar o snapshot de parâmetros, como o registro de tentativas já
faz.

**Motivo:** "em que tonalidade eu pratiquei isto?" é a pergunta que torna a rotação utilizável, e
hoje o `Activity` guarda id, módulo, tempo e acertos — nada dos parâmetros. Sem isso, itens sem
validação não deixam rastro nenhum de conteúdo.

### 40 · Classificação por objeto musical e tarefa

Dois eixos, **os dois no plural**. O **primeiro objeto é a casa**; os outros são etiqueta.
Dez objetos × oito tarefas. Ver [catalogo.md](catalogo.md).

**Regra:** ver a **decisão 52**, que corrige esta redação — são três casos, e só um funde.

**Motivo:** os dois documentos usavam princípios incompatíveis — um por faculdade cognitiva, outro
por objeto musical — e os 5 módulos do código não acomodam nenhum dos dois (já produziram Teoria
com 14 itens e Técnica com 2). Com (objeto, tarefa), seis itens de "intervalo" espalhados por
quatro seções viram **um objeto com seis tarefas**.

**Benefício secundário:** a matriz **mostra os buracos**. Nenhum dos dois documentos deixava isso
visível.

### 41 · Células vazias têm três tipos

**Sem sentido** (ignorar) · **oportunidade** (faz sentido, ninguém prometeu) · **buraco** (deveria
existir e não existe). Hoje há **um buraco**: *Notas e o braço × Ouvir* — e é erro de etiqueta, não
falta de exercício.

Nada disso aparece na tela: a pessoa entra por objetivo, não pela matriz.

### 42 · Cantar é tarefa quando a voz é a resposta; camada quando acompanha o tocar

"Solfejar escalas" no ônibus é tarefa (objeto escalas, tarefa cantar). "Solfejar enquanto percorre
a escala no baixo" é a camada *solfejar* sobre (escalas, tocar).

**Motivo:** os dois documentos discordavam — num, voz é bloco próprio; no outro, é só camada.
A fronteira é operacional: **se dá para fazer sem o instrumento, é tarefa.**

### 43 · Microfone entra no beta, só onde é tecnicamente sólido

Ordem: **voz → ritmo relativo → notas no instrumento**. Tudo atrás de um interruptor
**experimental, desligado por padrão**, e **depois de um espigão** que meça antes de prometer.

- **Altura sustentada** é o caso fácil, e a **voz é o mais fácil de todos** — vogal tem fundamental
  limpa e não há laço de tempo real.
- **Ritmo é relativo:** medir os intervalos entre os ataques da própria pessoa **cancela a latência
  do aparelho**, que é um deslocamento constante. **Classificar, não pontuar.**
- **Ritmo absoluto (alinhado ao clique) fica fora** — é o que exige calibração de latência e é onde
  nasce a fama de "glitchy".
- **"Foi isto que eu ouvi"**: tocar de volta o ritmo detectado torna a percepção da máquina
  inspecionável. Vale como exercício mesmo com a validação desligada.

**Motivo da mudança:** a decisão 15 anterior tratava "microfone" como uma coisa só. São três
problemas com dificuldades muito diferentes, e o afinador — que já está no beta — traz o motor de
detecção de altura inteiro.

### 44 · MIDI entra como quarto modo de validação

Ao lado de `deterministic`, `self_report` e `microphone`. O item declara se aceita; opcional,
experimental, **nunca requisito**.

**Motivo:** MIDI é a validação **mais barata e mais exata** do produto — notas e tempo exatos, sem
DSP, e é o **único** caminho para polifonia, que o microfone nunca vai resolver. Destrava *Tocar
acordes*, *Ler cifras e tocar progressões* e mãos juntas, hoje marcados como não-validáveis.

**O argumento contra é alcance, não custo:** o Safari não suporta Web MIDI, o que exclui iPhone e
iPad; e exige teclado digital. Por isso é acréscimo, não caminho principal da trilha de piano —
prometer a um pianista uma trilha que não funciona no iPhone dele seria pior que não prometer.

**Ganho secundário:** se alguns testadores do beta usarem MIDI, serão os **únicos dados de alta
fidelidade** disponíveis para calibrar os limiares da variação automática.

### 45 · Motor de formas: enumerador com rankings, nunca otimizador

> *Chamava-se "motor de digitações". A `A21` trocou o objeto para **forma** em 03/11/2026 — o
> raciocínio desta decisão não mudou uma linha, e é por isso que ela só foi renomeada.*

Enumerar o que é tocável é fácil e confiável. **Dizer qual é a melhor é impossível** — os pesos
mudam o resultado e especialistas discordam entre si.

**Mostrar várias, rankeadas, e a pessoa escolhe.** Rankings nomeados; **o exercício define o
padrão, a pessoa troca, e a troca fica visível**. Marcado experimental, com botão de reportar — e
os relatos viram curadoria.

**Motivo:** no estudo de referência de digitação de acordes (Radicioni & Lombardo), 100% das
soluções do modelo foram consideradas viáveis por especialistas, mas a primeira opção coincidiu com
a deles em **66,6%** dos casos. Uma em três vezes a sugestão do topo não é a escolhida — devastador
se você mostra uma, irrelevante se mostra cinco.

**E o mais importante: a função de custo pertence ao exercício, não ao motor.** Num exercício de
internalizar o braço, a digitação ergonomicamente ótima é a **errada** — o objetivo é tirar a
pessoa do shape conhecido. Um motor que sempre devolve a mais confortável trabalha contra a função
carro-chefe do Clave.

**Regras de viabilidade (baixo elétrico moderno):** posição P = casa do dedo 1; dedo *f* em
`P+(f−1)`; **o dedo 1 alcança `P−1`**; 2-3-4 não esticam; movimento maior é mudança de posição, de
preferência com o mesmo dedo, deslizando.

### 46 · Digitações não têm nome

Id estável para guardar, **desenho para reconhecer**, texto gerado só como legenda de
acessibilidade e linha de histórico apertada.

**Motivo:** digitação é objeto visual. Ninguém reconhece "a espaçada de três cordas" — reconhece o
desenho, e músico aponta em vez de nomear. A lista curada não vira "as nomeadas": vira **as que
aparecem primeiro**.

### 47 · Número de cordas, afinação e canhoto são perfil, não exercício

O exercício é agnóstico; o braço desenhado é o **seu**. **O catálogo não menciona número de cordas
em lugar nenhum** — nada de "baixo de 4 cordas" num cartão, para não afastar quem toca de 5.

Canhoto é espelho horizontal do desenho. **A convenção exata precisa ser conferida com um canhoto
de verdade** — ninguém no time é.

### 48 · Beta largo

Muitos itens, cobrindo os três instrumentos e as duas metades da matriz, aceitando que o baixo
fique mais bem trabalhado.

**Motivo:** o beta é o começo de uma expansão, não o produto final. Com guitarristas e pianistas
usando, vem o retorno que falta.

**Como isso é afordável: largura se mede em motores, não em exercícios.** As ~95 famílias são
presets sobre **oito motores de catálogo**, apoiados em três bibliotecas que já existem
(teoria, áudio e geração de ritmo). Dos oito, **dois estão prontos e dois estão parciais**.

### 49 · O portão de qualidade se aplica em três níveis

**Motor** (grafia, som, teste automático) — 8 vezes. **Família** (ambiguidade teórica, parâmetros
que importam, "eu usaria amanhã") — ~95 vezes, julgamento musical. **Preset** — nada.

**Motivo:** exigir os sete itens de 95 famílias inviabilizaria o catálogo largo. Teste automático
sobe para o motor; **ambiguidade teórica fica na família e não se move** — é o único que não dá
para automatizar nem delegar.

### 50 · Piano ganha trilha própria

Não só superfície. A metade agnóstica do catálogo (~60%) já serve ao piano sem trabalho extra; o
que falta é **declarar** e acrescentar visualizador de teclado, leitura em duas pautas, campo
harmônico ao teclado, voicings, mãos juntas e separadas e dedilhados.

**Motivo:** num beta largo, "piano é representação, não instrumento" faz um pianista abrir o app,
ver teclado em todo lugar e descobrir que nada é para ele. A diferença entre "piano não é foco" e
"piano tem isto, isto e isto" é a diferença entre desistir no primeiro minuto e dar retorno útil.

**Substitui** a decisão 16 (representação ≠ instrumento) na parte em que ela limitava o piano. O
princípio de que superfícies de resposta são compartilhadas continua valendo.

### 51 · Não há dono musical por área

**O Paulo responde por todas as famílias.** O item 7 do portão muda de "dono nomeado" para "revisão
do dono do produto".

**Consequência operacional, proposital:** **tarefa delegada constrói o motor e a fiação; publicar a
família é passo humano dele.** É a proteção direta contra o que deu errado na primeira versão deste
projeto — IA executando bem uma decisão que ninguém tomou.

### 52 · A regra de fusão tem três casos, não dois

- Um item que **trabalha vários objetos ao mesmo tempo** → **um item, vários objetos**.
- Itens que trabalham **objetos diferentes** na mesma tarefa → **itens diferentes**. Identificar
  intervalo não é identificar acorde.
- Itens que trabalham **o mesmo objeto e a mesma tarefa**, variando só a superfície ou o material →
  **um item**, com a variação como parâmetro.

**Só o terceiro caso funde.** *(Corrige a redação da decisão 40, que dizia "objeto muda, tarefa
igual → um item" e, lida ao pé da letra, colapsaria o catálogo inteiro.)*

### 53 · Mais quatro fusões, além das que a F1-4 previa

Revisão item a item de 03/11. Além das três fusões por superfície já planejadas:

- **"Que acorde é esse?"** passa a fundir **três**: `teclado-acorde` + `acorde-visual` +
  **`pauta-acorde`**. O plano previa dois.
- **"Que intervalo é esse?"** funde `pauta-intervalo` + `braco-intervalo`. A superfície escolhe o
  **tipo de resposta**: na pauta é a qualidade (terça menor ≠ segunda aumentada, porque a grafia
  distingue); no braço é o número de semitons (o desenho é o mesmo).
  *Isso conserta de graça o `braco-intervalo`, que era o único exercício de intervalo **sem
  seletor de intervalos** e sem região configurável — ele herda os de `pauta-intervalo`.*
- **`quiz-teoria` se divide em quatro**, um por objeto: graus e modos · construção de acordes ·
  campo harmônico e sub5 · tonalidades e armaduras. Era o único item ocupando quatro objetos ao
  mesmo tempo, e ninguém que procura "campo harmônico" acha "quiz de teoria". O motor é o mesmo
  (`theoryQuestion` já recebe o tópico): quatro declarações, zero código novo.
- **`ambiente` deixa de existir.** **Não é exercício**: é uma sala com drone, metrônomo e
  cronômetro, sem instrução nem tarefa. O **drone vira camada** disponível em qualquer item, o
  **cronômetro com meta vai para o metrônomo**, e a sala genérica sai. **Nenhum exercício é
  removido** — ao contrário: é o que permite criar os exercícios específicos sem duplicar drone e
  metrônomo em cada um.

Saldo previsto: 26 itens viram **20**, com muito mais parâmetro.

**Feito em 04/11/2026.** O saldo real foi **27**: 16 exercícios e 11 ambientes/tarefas. A diferença não
é erro de conta — é que entre 03/11 e 04/11 entraram os **cinco itens da tarefa com metrônomo**
(decisão 90), que não existiam quando esta decisão foi escrita. E **`ambiente` ainda existe**: tirá-lo
depende de o drone virar camada, que não foi feito.

### 54 · Generalizar para todas as escalas, sempre que possível

Onde um exercício aceita escala, aceita **todas**: maior, menor natural, **harmônica e melódica**,
modos, pentatônicas. Nada de item preso a uma escala só por acidente de implementação.

**Motivo:** `ouvido-celulas` era pentatônico-only sem razão, e o catálogo pede a mesma tarefa em
diatônica. Generalizar custa um parâmetro e evita um item novo.

### 55 · A sugestão de variação dispara em acertos seguidos, não em taxa

*"Você acertou 15 seguidas. Quer incluir mais intervalos?"*

**Motivo:** quando a pessoa escolhe praticar só duas alternativas — maior contra menor, por exemplo
— a **taxa de acerto não significa nada** (o chute dá 50%), mas **15 seguidas significa**. E
praticar só duas é legítimo: o objetivo dela é acertar 100%.

*Substitui o gatilho por taxa da decisão 9.*

**Distinção que precisa ficar clara, porque eu mesmo me confundi:** o que a decisão 11 proíbe é o
**streak de dias praticados** — isso é cobrança disfarçada. **Acertos seguidos dentro de uma série
é informação útil** e fica, inclusive visível. Foi removido por engano na `F0-2` e restaurado.

### 56 · O histórico mostra quantas alternativas havia

Junto da proporção, aparece **entre quantas opções** a pessoa respondeu. "17 de 20, entre 2 opções"
é honesto; "85%" não é — e é o que permite saber depois que ela estava estudando *discernir maior
de menor*.

É a decisão 14 (*sempre mostrar a quantidade junto da proporção*) aplicada também ao número de
alternativas.

### 57 · A cascata de parâmetros precisa de leitores

Conferido em 03/11: o catálogo lê `tuning` em **um** lugar e **nada mais**. `key`, `range`,
`material`, `tempo` e `clef` estão declarados, estão na cascata, e **nenhum exercício os lê** — nem
há controle para eles na tela.

**A consequência é séria: a rotação de tonalidade (decisão 38), do jeito que está, não faria nada.**
A rotina avançaria de Dó para Sol, o histórico registraria Sol, e todo exercício continuaria
sorteando a tônica aleatoriamente.

Por isso **ligar o catálogo na cascata é pré-requisito da rotação**, e vem antes de qualquer
exercício novo. Tarefa `F2-3`.

---

### 58 · "Ouvir e identificar" é um item por objeto, com a superfície de resposta como parâmetro

Os dois documentos duplicavam o bloco inteiro: o `Clave.md` tem a versão respondida **na tela**, o
rascunho tem a mesma coisa respondida **no instrumento**. São cinco pares, e cada par é **um item**
(regra 52: mesmo objeto, mesma tarefa, varia só a superfície).

| Vira | A partir de |
|---|---|
| Intervalo de ouvido | Identificação de intervalos · Encontrar intervalos ouvidos |
| Grau de ouvido | Identificar graus · Encontrar graus ouvidos |
| Acorde de ouvido | Identificar acordes de ouvido · Tocar acordes de ouvido |
| Melodia de ouvido | Reconhecimento de frases · Reprodução no instrumento virtual · Tocar melodias de ouvido |
| Linha de baixo de ouvido | Tirar linhas de baixo de ouvido |

Superfícies: **alternativas na tela · braço virtual · teclado virtual · o instrumento de verdade**.
A validação segue a superfície: na tela é determinística, no instrumento é autoavaliação (ou
microfone, se a pessoa ligou).

**E o contexto escolhe a superfície sozinho.** Esta é a parte de UX, e ela não é opcional: quando a
pessoa diz que está **sem o instrumento**, estes itens assumem a superfície de tela; quando diz que
está **com o instrumento**, assumem o instrumento. Ela pode trocar, mas **nunca precisa** trocar
para o exercício fazer sentido.

Na prática: **o contexto da home vira uma camada de parâmetros** (`origin: 'agora'`), ao lado de
perfil, rotina e etapa. É a cascata da decisão 7 fazendo o trabalho — não é um caso especial.

**Motivo:** sem isso, a pessoa no ônibus abriria "intervalo de ouvido" e encontraria um exercício
pedindo que ela toque no baixo. O item seria o certo e a experiência, errada.

### 59 · Os itens que dependem de áudio gravado saem do beta

Sete itens não são tocáveis com a síntese do `audio/engine.ts` — precisam de **material gravado**,
produzido ou licenciado. E o documento de visão fecha a porta mais fácil: *música de IA está fora*,
em qualquer forma.

Saem do beta e ficam no corpus, marcados **"depende de áudio"**: transcrever trechos · imitar
fraseado · acompanhar por estilo · manter um groove · reconhecimento de forma · identificação de
timbre · percepção de dinâmica e articulação.

**Duas exceções, e os motivos são diferentes:**

- **Responder frases** fica, porque é o único do grupo cujo material pode ser **sintetizado**: o app
  toca uma frase gerada e a pessoa responde tocando. Depende do gerador melódico da `F5-3`, não de
  microfone nem de gravação.
- **Tocar frases de vocabulário** fica **em aberto**: gravar licks de guitarra é viável e o time
  tem guitarristas. É trabalho de músico, não de código, e pode ser divertido. Não entra no beta
  como compromisso, mas também não é descartado.

**Pesquisa de estilo fica parada**, para conversa do grupo. Acompanhamento de música erudita é um
candidato natural para o Bernardo Garcia, se ele quiser — mas é decisão dele e de outra rodada.

---

### 60 · O objeto "Som, timbre e dinâmica" sai inteiro do beta

Seis itens, e nenhum caminho que sobrevivesse:

| Item | O que é | Por que não fica |
|---|---|---|
| Julgamento de afinação | ouvir uma nota ou intervalo levemente desafinado e dizer se está alto ou baixo | **vira preset do afinador** |
| Afinar bends | tocar um bend até a nota-alvo, com retorno em cents | **vira preset do afinador** |
| Identificação de timbre | reconhecer instrumento, tipo de som e efeito | depende de gravação (decisão 59) |
| Percepção de dinâmica e articulação | comparar duas execuções e dizer qual é mais legato, forte ou acentuada | depende de gravação |
| Imitar fraseado e articulação | ouvir um fraseado e reproduzi-lo | depende de gravação · validação duvidosa |
| Controlar a dinâmica | crescendo, decrescendo e acentos em tempos definidos | mede contraste **relativo**, nunca volume absoluto |

Três dependem de gravação, dois têm validação duvidosa, e **os dois que sobram são o afinador com
uma pergunta em volta**. Não chega aos quatro itens que uma porta por objetivo exige (decisão 20),
e é o único objeto cuja metade depende de biblioteca de áudio gravado.

Fecha a questão aberta `C5`. O que sai fica em [guardados.md](guardados.md).

---

### 61 · As duas duplicatas entre os documentos se fundem

O `Clave.md` e o rascunho "com instrumento" foram escritos em momentos diferentes e repetem dois
itens:

- **"Pulso interno (clique que some)"** e **"Tocar em tempo"** são o mesmo exercício. O próprio
  rascunho diz que absorve o pulso interno, mas o item continuou listado nos dois documentos. Um
  item só, com **"clique que some" como preset**.
- **"Leitura rítmica"** e **"Ler e tocar ritmos"** são a mesma tarefa. A diferença — bater palma ou
  tocar uma nota — é **parâmetro de superfície de resposta**, exatamente como na decisão 58.

---

### 62 · O Clave não se restringe a baixo, guitarra e piano

Eu propus cortar **leitura em claves alternativas** (clave de dó alto e tenor, transposição para
Si♭, Mi♭ e Fá) com o argumento de que baixo, guitarra e piano resolvem tudo com clave de sol e
clave de fá. O argumento foi recusado, e o motivo vale mais que o item:

> **Cantores, instrumentistas de sopro e quem só quer desenvolver o ouvido e estudar teoria usam a
> metade agnóstica do catálogo inteira** — que é cerca de 60% dele.

O time ser de baixo, guitarra e piano explica **por onde começamos**, não **para quem o Clave
serve**. Nenhum item sai do catálogo com a justificativa "não é para o nosso instrumento"; essa
justificativa, isolada, não é válida.

Claves alternativas ficam.

---

### 63 · Vocalizar ritmo e cantar guide tones entram no beta

Duas células vazias da matriz que valem preencher, e a coluna *Cantar* era a mais vazia de todas.

- **Vocalizar ritmo** *(Ritmo × Cantar)* — o app mostra ou toca um ritmo e a pessoa o vocaliza.
  Usa o gerador de ritmo que já existe mais autoavaliação, e tapa uma coluna inteira.
- **Cantar os guide tones de uma progressão** *(Harmonia × Cantar)* — cantar a 3ª e a 7ª enquanto a
  progressão toca por baixo.

**Eu havia adiado os guide tones com um argumento que se contradizia sozinho:** aleguei que
dependiam de voz validada, mas **a voz validada está no beta** (`A3`), e a progressão por baixo o
`backing` já toca. Foi corte por inércia, não por análise.

**Criar variações de groove** *(Ritmo × Criar)* fica fora: a restrição é validável, mas o valor do
exercício não está claro e o desenho é vago.

---

### 64 · Voice leading é medição, não julgamento — e é o mesmo padrão do motor de digitações

Conectar acordes escolhendo inversões que minimizem o movimento das vozes **não tem resposta
certa** — tem várias conduções igualmente válidas. Isso o colocaria sob a decisão 13, que proíbe
item ambíguo gerar "erro do usuário".

A saída é a mesma do motor de digitações (decisão 45), e vale a pena ver que é **literalmente o
mesmo problema**: dado um acorde de destino, as vozes podem cair em várias disposições; as regras
físicas filtram; e o que sobra **se ordena por critérios nomeados, nunca se reduz a uma resposta
certa**.

Então o exercício não tem alternativas. **A pessoa escreve ou toca a sua condução, e o app diz onde
ela caiu:**

> *"Você moveu 7 semitons no total. A condução mais econômica move 3. De 24 conduções válidas, 14
> movem menos que a sua, e 9 mantêm mais notas comuns."*

É a escolha do ponteiro do afinador e do ranking de digitações, aplicada à harmonia: **não há "a
certa", há onde a sua está.**

As cinco medidas que não dependem de opinião nenhuma: **movimento total** em semitons · **notas
comuns** mantidas · **maior salto** de uma voz só · **cruzamento de vozes** · **âmbito** respeitado
por voz.

**O corte de escopo que o torna viável:** quatro vozes, posição fechada, e só essas cinco medidas.
As *regras de escrita* — quintas e oitavas paralelas, dobramento, resolução da sensível — são
**camada de Fase 2**, entram como aviso e nunca como erro, e cada uma precisa de uma decisão sobre
**em que tradição ela vale**: no jazz, quintas paralelas são vocabulário.

---

### 65 · Ideia tirada do beta fica registrada, não apagada

Toda ideia que sai do beta vai para [guardados.md](guardados.md), **com o motivo e com o que a
traria de volta** — porque o motivo quase nunca é "a ideia é ruim", e sim "falta uma peça que ainda
não existe".

O arquivo também registra **o que eu propus cortar e foi mantido**, com o motivo da manutenção. Isso
é o que impede o mesmo corte de ser proposto de novo três rodadas adiante.

**Trazer algo de volta é decisão de produto** (regra 1 do `CLAUDE.md`) — não é algo que se faça
dentro de uma tarefa.

---

### 66 · Voice leading: quatro vozes em posição fechada, nas duas superfícies

Fecha o escopo aberto pela decisão 64.

**Quatro vozes, posição fechada.** E a documentação registra **por que isto é revisável**: a decisão
foi tomada por quem toca teclado e por quem escreve código, e **nenhum dos dois é a pessoa certa
para julgar se conjuntos de cordas e tríades abertas deveriam estar no beta**. Se um guitarrista ou
baixista do time disser que falta, **a decisão muda sem precisar de defesa** — não há argumento de
produto preso a ela, só um corte de escopo para caber no beta.

**As duas superfícies de resposta, com seletor** — escrita na pauta e tocada no instrumento, pelo
padrão da decisão 58. Escrita é determinística e cabe no ônibus; tocada é autoavaliação e cabe com
o instrumento. O contexto escolhe o padrão, a pessoa troca.

---

### 67 · No comparador de escalas, enarmônicas são a mesma escala — e isso é a pergunta

Ré♯ menor e Mi♭ menor são a mesma escala com dois nomes. Comparadas por grafia, "diferem em 7
graus", o que é defensável na pauta e absurdo no som; e o app diria "errou" para quem respondeu
"são iguais", que é a resposta musicalmente correta.

**A comparação é por classe de altura.** E quando o par sorteado for enarmônico, **a resposta certa
passa a ser "são a mesma escala"** — o caso-problema vira um dos melhores itens do bloco de
notação, porque reconhecer isso é exatamente o que se quer que a pessoa saiba.

**Com explicação na tela**, para não negligenciar a teoria: as duas grafias existem, servem a
tonalidades diferentes, e a escolha entre elas é de armadura, não de som. Quem é purista está certo,
e o app diz isso em voz alta em vez de fingir que o problema não existe.

---

### 68 · "Que escala serve sobre este acorde?" inverte para sim ou não

Sobre C7 servem mixolídio, blues, alterada, lídia dominante e diminuta de tom e semitom. A pergunta
na forma aberta não tem resposta única, e cai sob a decisão 13.

**Invertida, tem:** *"esta escala serve sobre este acorde?"* — uma escala por vez, sim ou não. Ou as
notas da escala contêm as do acorde, ou não contêm. O exercício fica mais simples e para de mentir.

**"Nota a evitar" sai.** O 4º grau sobre C7 é nota de passagem no blues e dissonância em bebop:
**não é propriedade do acorde, é propriedade do estilo.** Afirmá-la como fato é erro de teoria, não
só ambiguidade.

---

### 69 · Harmonização de melodia é laboratório de transformações nomeadas

Fecha a questão aberta `C6`. Harmonizar uma melodia não tem resposta certa — é o caso mais claro de
todos. Então não é quiz: é **laboratório**, termina por `tarefa` (a pessoa para quando quer), e
**não há correção nenhuma.**

**O que as ferramentas existentes fazem, e por que não serve.** O *Reharmonist* do Band-in-a-Box
gera uma progressão nova inteira a partir da melodia, por gênero. O *Hookpad* sugere acordes a
partir de um banco de músicas analisadas, e escrever acordes para uma melodia inserida é o add-on
pago *Aria*. Na academia há harmonização por cadeias de Markov e o reharmonizador do *Impro-Visor*.
**Todas fazem por você. Nenhuma ensina.** É a brecha.

**O desenho: transformações, não listas de acordes.** Enumerar os acordes que contêm uma nota da
melodia é interseção de conjuntos — trivial, e entrega 40 acordes sem hierarquia, porque
**"interessante" não é computável.** Em vez disso o app oferece **transformações pelo nome**:
trocar o V7 pelo subV7 · interpolar um II antes do V · fazer deste um diminuto de passagem ·
empréstimo modal. A pessoa aplica, o app toca, ela mantém ou desfaz.

Como cada transformação tem **nome de teoria**, usar o laboratório **é** estudar rearmonização — não
é só ouvir resultados bonitos. É o que o botão de gerar progressão não faz.

**O que se mede com exatidão, e serve de ordenação:** que grau da nota da melodia o acorde faz
(fundamental, 3ª, 5ª, 7ª, 9ª, 11ª, 13ª — este é *o* eixo útil) · diatônico ou cromático · função ·
movimento do baixo.

**Corte de escopo:** no beta vão as **transformações nomeadas**. O navegador livre de acordes — ver
todos os que contêm aquela nota — fica para a Fase 2.

**O custo a aceitar:** item sem resposta **não gera evidência de progresso**. Entra no histórico como
tempo praticado e os acordes escolhidos, e nada mais.

---

### 70 · As duas menores melódicas são duas escalas, não uma opção

No uso clássico, a melódica é **definida** pela assimetria: sobe com 6ª e 7ª elevadas, desce como
menor natural. Não é preferência de estilo — é a definição que uma prova de conservatório cobra. No
jazz, "melódica" é a forma ascendente usada nas duas direções, e é conceitualmente **outra escala**:
é a que gera a alterada e a lídia dominante.

Mesmo nome, duas coisas — **e é daí que vinha a ambiguidade, não da direção.** São **duas entradas
separadas** na lista de escalas, nunca um interruptor escondido em configurações. Assim o app não
precisa adivinhar qual foi pedida.

**O guarda de direção continua necessário**, por um motivo que sobrevive à separação: **subindo, as
duas são o mesmo áudio.** Com as duas marcadas e direção só ascendente, o exercício de ouvido
pediria uma distinção fisicamente impossível. Então, nesse caso: **toca descendo também, ou avisa.**

**Em aberto:** os nomes que a pessoa vê — ver `A11`.

---

### 71 · Três enumeradores puros, e eles não são motores

`percorrer` (padrões de escala), `conduções` (voice leading) e `rearmonizações` são **funções puras
sem interface nenhuma**: recebem material musical e devolvem uma lista ordenada por critérios
nomeados. Quem desenha é o motor de partituras ou o visualizador.

Registrar isso tem duas consequências práticas. A primeira é que **contá-los como motores infla a
estimativa de trabalho** — continuam sendo oito motores de catálogo. A segunda é que eles têm a
**mesma forma**, e ela é a resposta recorrente do projeto para problemas sem resposta certa:

> **enumerar o que é válido, ordenar por critérios nomeados, nunca eleger um certo.**

É a decisão 45 (digitações), a 64 (conduções) e a 69 (rearmonização) dizendo a mesma coisa três
vezes. Quando aparecer a quarta, já se sabe o desenho.

---

### 72 · As duas melódicas se chamam "(jazz)" e "(clássica)"

Resolve `A11`. Na lista de escalas aparecem **"menor melódica (jazz)"** e **"menor melódica
(clássica)"**, nessa forma: o nome comum primeiro, a tradição entre parênteses.

Entre *clássica* e *erudita* — as duas corretas em português — fica **clássica**, por dois motivos
práticos: é o par natural de *jazz* no uso corrente de músico, e **tem tradução direta**
(`classical`), enquanto *erudita* não tem equivalente de uma palavra em inglês. Como todo texto vai
para os dois idiomas, o rótulo que traduz sem nota de pé de página é o que serve.

Nenhuma das duas fica sem parênteses. Chamar uma delas de só "menor melódica" afirmaria que **ela**
é a verdadeira e a outra o desvio — e é justamente essa afirmação que criou a ambiguidade da
decisão 70.

---

### 73 · "Notas-pivô" são as notas comuns entre duas posições

Resolve `C1`. São dois conceitos reais com o mesmo nome: notas compartilhadas entre duas **regiões
do braço**, usadas para trocar de região sem quebra; ou notas comuns entre duas **escalas**, usadas
para modular.

É o primeiro — é o uso corrente na pedagogia de cordas. **"Notas-pivô" é preset de *Conectar
regiões do braço*.**

E o segundo conceito **já estava no catálogo com outro nome**: *Alternar entre escalas*. Não havia
escolha entre dois itens a fazer; havia um item duplicado por vocabulário.

---

### 74 · "De onde vêm as fundamentais" é parâmetro, não três exercícios

Resolve `C2`. *"Arpejos sorteados · todos acordes"* podia significar o campo harmônico de uma
tonalidade (os sete diatônicos), uma qualidade nas doze fundamentais, ou uma progressão.

**São as três, como configuração** — a decisão 15 aplicada: `campo harmônico / doze fundamentais /
progressão`. Os três casos são presets de um item.

Efeito colateral útil: com a fonte das fundamentais declarada, o item **passa a ser rotacionável por
tonalidade** (decisão 38) de graça. Com "doze fundamentais" a rotação não faz sentido; com "campo
harmônico" faz todo.

---

### 75 · Walking bass: partitura é a saída, braço é camada — e sai do caminho crítico

Resolve `C3`. Walking bass se lê e se toca: a **partitura é a saída principal**, e a digitação por
cima é o motor de digitações aplicado, que já é parâmetro de vários outros itens. Não são duas
saídas concorrentes.

**E é o item mais caro de todo o motor de progressões.** Gerar walking bass defensável exige notas
de aproximação, notas do acorde nos tempos fortes, condução por graus conjuntos e tratamento de
cromatismo — é um gerador musical com requisitos reais, não um sorteio. Vale fazer, **mas não é o
primeiro item do motor**, e fica fora do caminho crítico do beta.

---

### 76 · Digitação de piano é tabela, não motor

Resolve `C4`. O motor de digitações (decisão 45) **não se estende ao teclado** — e não é corte de
escopo: é que o problema lá é outro.

Digitação de escala no piano é **convencional e fixa**. Dó maior na mão direita é `1-2-3-1-2-3-4`
com passagem do polegar, e é isso que se ensina em todo lugar. **Não há enumeração a fazer porque
não há escolha genuína** — é consulta a uma tabela.

A tabela é pequena: doze maiores e doze menores, duas mãos, mais os arpejos. É **trabalho de digitar
dados, não de algoritmo**, e cai naturalmente para o Bernardo Garcia, que é o pianista clássico do
time.

Consequência: o motor de digitações continua sendo **só de cordas**, e isso deixa de ser lacuna.

---

### 77 · Um item pode carregar mais de uma tarefa

Estende a decisão 52, que dizia isso de **objetos** e calava sobre **tarefas**.

O caso que revelou: `pauta-escala` mostra uma escala na pauta e pergunta qual é; o catálogo listava
*"Análise de escalas"* como item separado, de `nomear`. **É o mesmo exercício** — o estímulo é
notação (`ler`) e a resposta é um rótulo teórico (`nomear`), as duas coisas ao mesmo tempo. O
modelo já aceita (`tarefas` é lista); estava só subpreenchido.

**O que *não* se funde:** *Construção de escalas* é o caminho inverso — dado o nome, escrever as
notas. Item de verdade, e **ainda não existe**.

A regra, para a próxima vez: **aparecer em duas tarefas é etiqueta; inverter o sentido da pergunta é
item novo.**

---

### 78 · As sete transformações de rearmonização

Resolve `A12`. O laboratório da decisão 69 oferece estas, e cada uma tem **nome de teoria** — é o
que faz usá-lo ser estudar, e não só ouvir resultados bonitos. Exemplos em Dó maior, sobre
`Dm7 | G7 | C`:

| # | Transformação | O que faz | No exemplo |
|---|---|---|---|
| 1 | **Trocar a qualidade** | mesma fundamental, outra qualidade | `C` → `Cmaj7` → `C6` → `C7` |
| 2 | **Substituição diatônica** | troca por outro acorde do campo que divide duas notas | `C` → `Am` ou `Em` · `F` → `Dm` |
| 3 | **Interpolar o II** | transforma qualquer dominante num ii–V | `G7` → `Dm7 G7` |
| 4 | **Dominante secundário** | antes de um acorde, põe o dominante *dele* | antes de `Dm7`, põe `A7` |
| 5 | **Substituição por trítono** | troca o dominante pelo que está a um trítono | `G7` → `D♭7` |
| 6 | **Diminuto de passagem** | liga dois acordes a um tom de distância | `C` → `C♯dim7` → `Dm` |
| 7 | **Empréstimo modal** | pega um acorde do modo paralelo | `F` → `Fm` · ou `A♭` em Dó maior |

A ordem é pedagógica, não arbitrária: 1 e 2 são o primeiro dia, 3 e 4 são o vocabulário básico, 5 a
7 é onde fica interessante. **Todas são determinísticas de aplicar** — é o que permite o laboratório
não ter correção e ainda assim não ser vago.

**Duas ficaram fora, por motivos diferentes:**

- **Aproximação cromática** (pôr `E♭m7` antes de `Dm7`) é caso particular das outras e depende de
  estilo e de onde cai no compasso.
- **Pedal de baixo** (o baixo parado enquanto os acordes andam) **não é rearmonização**: não troca
  acorde nenhum, mexe no baixo. É outro eixo, e precisaria do modelo de vozes em vez do modelo de
  acordes. Barata de acrescentar depois.

---

### 79 · Os textos das oito portas

Resolve `A4`. A restrição seguida: **nenhum texto diz nada sobre quem a pessoa é** — todos dizem o
que há atrás da porta. É a decisão 11 aplicada ao texto.

| Porta | Linha de apoio |
|---|---|
| **Dominar as notas no instrumento** 🚩 | Saber onde cada nota está, sem procurar. |
| **Melhorar o ouvido** | Reconhecer o que você ouve — intervalos, acordes, escalas, graus. |
| **Acompanhar e entender harmonia** | Campo harmônico, cifras e condução: o que sustenta a música. |
| **Aprender teoria musical** | Os nomes e as razões por trás do que você já toca. |
| **Aprender a ler partitura** | Da nota escrita ao som, sem travar. |
| **Melhorar ritmo e groove** | Subdivisão, leitura rítmica e tocar no tempo. |
| **Melhorar técnica e precisão** | Coordenação, independência dos dedos e controle do som. |
| **Improvisar e solar** | O que prepara o improviso: escalas, arpejos, notas-alvo e vocabulário. |
| **Não sei por onde começar** | Três perguntas e uma rotina sugerida. Dá para mudar tudo depois. |

**Duas coisas deliberadas nessas linhas.**

A primeira: **nenhuma menciona cronômetro nem registro de prática.** Meu rascunho mencionava, na
porta da técnica, e estava errado — **os dois são universais**, estão em toda rotina. Citá-los numa
porta só sugere que é ali que eles moram.

A segunda: **a última linha é a única que faz uma promessa em vez de descrever conteúdo** —
*"dá para mudar tudo depois"*. Está ali de propósito: é o antídoto da rigidez, e é o que faz alguém
topar responder três perguntas em vez de fechar a tela.

**A versão em inglês** (resolve `A4b`), escrita em 03/11. Não é tradução literal: "sem travar" e "sem
procurar" não atravessam, e o que importa é a linha fazer em inglês o que faz em português — descrever
o conteúdo sem dizer nada sobre quem a pessoa é.

| Porta | Linha de apoio |
|---|---|
| **Master the notes on your instrument** 🚩 | Know where every note is, without hunting for it. |
| **Improve your ear** | Recognise what you hear — intervals, chords, scales, degrees. |
| **Follow and understand harmony** | Diatonic chords, chord symbols and voice leading: what holds the music up. |
| **Learn music theory** | The names and the reasons behind what you already play. |
| **Learn to read sheet music** | From the written note to the sound, without stalling. |
| **Improve rhythm and groove** | Subdivision, rhythm reading, and playing in time. |
| **Improve technique and precision** | Coordination, finger independence, and control of your sound. |
| **Improvise and solo** | What prepares improvisation: scales, arpeggios, target notes, and vocabulary. |
| **I don't know where to start** | Three questions and a suggested routine. You can change all of it later. |

⚠️ **As oito portas ainda NÃO existem no código.** As metas de hoje (`content.pt.ts`) são as sete
antigas — *Improvisar com fluidez, Criar progressões bonitas, Tirar músicas de ouvido…* —, de antes da
decisão 20. Trocá-las é a `D2`, e estes textos esperam lá.

---

### 80 · A porta do improviso se chama "Improvisar e solar"

Mesmo não havendo exercício de improvisar — porque **ninguém procura por "preparar o improviso"**.
A decisão 20 pedia que a porta fosse "redigida como o que prepara o improviso", e a redação honesta
vai na **linha de apoio**, não no rótulo.

O rótulo é como a pessoa encontra a porta; a linha é onde não se mente. Chamar a porta de "Preparar
o improviso" seria honesto e **invisível** — e uma porta que ninguém abre não protege ninguém de
nada.

---

### 81 · A área de técnica vai de 2 famílias para 7, e o critério é o gerador

Antes desta decisão, "técnica" eram **duas famílias** — *Executar padrão técnico com metrônomo* e
*Sincronizar as duas mãos* — e **as duas eram o mesmo recipiente**: "faça um padrão com o
metrônomo". Não havia conteúdo. Era por isso que a linha da porta saía fraca: não havia o que
descrever.

**O princípio que seleciona o que vale:**

> **Em técnica, a contribuição do app é escolher o que você não escolheria.**

Não é validar — a decisão 36 já resolveu isso. É que o ponto inteiro do treino técnico é que **a
pessoa tem padrões de conforto e volta sempre a eles.** Sozinha ela toca 1-2-3-4 e 4-3-2-1, e nunca
2-4-1-3. É a mesma lógica já escrita no guia de digitações: *para internalizar o braço, a digitação
mais confortável é a errada.*

**Cinco com gerador:**

| | Item | O que o app faz |
|---|---|---|
| T1 | **Permutações de dedos** | sorteia uma das **24 ordenações** de 1-2-3-4; a permutação é parâmetro rotacionável (decisão 38) |
| T2 | **Sequência de cordas** | nomeia uma ordem de cordas (`4 2 3 1`) e a pessoa atravessa nessa ordem |
| T3 | **Deslocamento de acento** | mesma figura rítmica, o **acento** muda de lugar a cada rodada |
| T4 | **Subdivisão alternada** | o clique fica no mesmo andamento e **a subdivisão muda** a cada N compassos, avisada um compasso antes |
| T5 | **Troca de posição** | nomeia duas posições e **com que dedo** deslizar entre elas |

**A T4 é a única que a pessoa não consegue fazer sozinha** — não há como mudar a própria programação
de subdivisão enquanto toca. Se fosse uma só, seria ela.

**Duas de instrução e clique, e isso é legítimo:**

| | Item | Por que vale |
|---|---|---|
| T6 | **Sustentar e cortar** | manter a nota N tempos exatos e **cortar no tempo**. Quase ninguém treina *parar* uma nota na hora, e no baixo isso é metade do que faz uma linha soar firme |
| T7 | **Legato e staccato alternados** | mesma passagem, e **o app decide quando trocar**. O gerador é o momento da troca |

**Duas coisas que pareciam itens e não são:**

- **"Independência dos dedos" é a T1 sem o gerador** — tocar 1-2-3-4 em ordens diferentes *é* o
  drill de permutações. Virou **preset da T1**, com a ordem fixa em vez de sorteada.
- **"Aquecimento" é rotina, não item.** Uma sequência de passos nomeados com tempo por passo é
  exatamente o que o modelo de rotina faz, e **não precisa de código nenhum**: é preset de rotina do
  time. Vale como prova de que o modelo está certo.

**Fora: checagem de tensão.** Lesão por esforço é real em estudo de música e ninguém trata disso,
mas **não é exercício** — não há nada a fazer além de notar. Cabe como **nota num passo de rotina**;
como item pareceria enchimento de app de bem-estar.

---

### 82 · Em técnica, o andamento nunca é comemorado

Todos os sete itens da decisão 81 têm andamento, e a área é a mais tentada a transformá-lo em
placar. A regra, que estava dita em conversa e não estava escrita:

**O andamento é configuração, mostrada de forma neutra.** O app **nunca comemora um andamento
maior**, nunca o registra como recorde, e nunca o apresenta como progressão ou carga. O histórico
guarda qual andamento foi praticado do mesmo jeito que guarda qual tonalidade: **informação, não
pontuação.**

**Motivo:** aumentar o andamento demais frequentemente é prejudicial, e para muita coisa o melhor é
fazer bem devagar. Um app que celebra bpm ensina a pessoa a praticar errado. É a decisão 11
aplicada ao único número que o estudo técnico produz naturalmente.

---

### 83 · Deslocamento de padrão rítmico: um tempo, família e modos

Item novo (`T8`), e a estrutura dele vem de três decisões encadeadas.

**O padrão cabe em um tempo.** E essa restrição resolve mais do que parece: quando o padrão
**preenche o ciclo exatamente**, *deslocar* (andar para a direita mantendo a forma) e *rodar*
(tratar como ciclo, o que cai fora do fim volta pelo começo) passam a ser **a mesma operação** — nada
cai fora, porque o fim é o começo. E o **tempo passa a ser o único ciclo que significa algo**: um
padrão de um tempo repetido já é igual em todo tempo, então deslocá-lo dentro do compasso não produz
nada novo.

**O território é finito, e isso é o melhor da ideia.** Contando rotações do mesmo padrão como a mesma
família:

| Subdivisão | Posições | Padrões tocáveis | Famílias |
|---|---|---|---|
| colcheias | 2 | 3 | **2** |
| tercinas | 3 | 7 | **3** |
| semicolcheias | 4 | 15 | **5** |

As cinco de semicolcheia, por inteiro — não há uma sexta:

| Família | Padrão | Modos |
|---|---|---|
| um ataque | `x . . .` | 4 |
| dois juntos | `x x . .` | 4 |
| **dois alternados** | `x . x .` | **2** |
| três ataques | `x x x .` | 4 |
| tudo | `x x x x` | 1 |

**A família é o que se escolhe; os modos são o que se percorre.** O deslocamento é parâmetro
rotacionável (decisão 38), com avanço manual e mostrando por quais já se passou. Isso espelha a
música — é literalmente *escolher a escala e percorrer os modos* — e reaproveita inteira a máquina da
`T1`. A alternativa, 15 padrões numa lista plana, esconde a estrutura que torna o exercício
inteligível.

**A exigência de correção, e ela é obrigatória:** **padrão simétrico tem menos modos do que o ciclo
tem posições.** `x . x .` rodado duas vezes volta a ser ele mesmo: **2 modos, não 4.** Se o app
oferecer quatro, faz a mesma pergunta duas vezes — é o erro das duas melódicas (decisão 70) na menor
escala em que ele pode existir. O item **conta os modos distintos**, não assume que são o tamanho do
ciclo. E aqui isso é verificável por **enumeração exaustiva**: o espaço inteiro tem 15 padrões.

**O custo aceito:** saem os padrões que **atravessam o tempo** — a versão mais difícil e, na
pedagogia de jazz e funk, a mais usada. Atravessar o tempo vira **item separado depois**, se der
saudade, e não parâmetro deste: como parâmetro, voltariam as duas operações e o ciclo ambíguo.

**Não confundir com a T3**, e o teste é simples: na T3 a pessoa toca **as mesmas notas nos mesmos
momentos** e muda só a ênfase; na T8 ela toca **em momentos diferentes.** Se os instantes de ataque
mudam, é a T8.

---

### 84 · A biblioteca de padrões rítmicos nomeados é dado, com quatro consumidores

Clave, cáscara, telecoteco, partido alto, baião, samba, coco, tresillo. **Não é um lugar no app: é
um dado, e quatro coisas o consomem.**

**E não precisa de motor nenhum.** O `src/theory/rhythm-cells.ts` já tem notação de texto para
padrões. A clave de son — intervalos entre ataques de 3, 3, 4, 2 e 4 semicolcheias — se escreve hoje
como `8. 8. q 8 q`, sem uma linha de código novo. **O trabalho é curadoria, não programação.**

| Consumidor | O que faz |
|---|---|
| **A biblioteca** | o dado: nome, padrão, origem, **fonte** |
| **Aula de teoria** | o texto que explica, com os exemplos soando |
| **Item "Identificar o padrão"** | ouve e nomeia — célula *Ritmo × Ouvir*, que já está ocupada |
| **Parâmetro de itens existentes** | leitura rítmica, reproduzir ritmos, a `T8`, e o metrônomo tocando como acompanhamento |

⚠️ **A biblioteca não pode virar item.** "Padrões de clave" como tela seria uma tela que lista
dados — exatamente o modo de falha que a decisão 15 existe para impedir.

**No beta: 8 a 12 padrões, poucos e bem feitos.** Quarenta mal atribuídos valem menos que oito
certos. **"Identificar o padrão" entra** como item: é o consumidor mais óbvio da biblioteca e o que
justifica construí-la.

**Um fato a registrar, para ninguém escrever errado numa aula.** A clave de son é `3 3 4 2 4` e a de
rumba é `3 4 3 2 4`. As cinco rotações da de son são `33424`, `34243`, `42433`, `24334` e `43342` —
**a de rumba não está entre elas.** São colares diferentes, não modos do mesmo. A conexão com a `T8`
é de **conceito**, não de conteúdo.

---

### 85 · Padrão de tradição precisa de fonte citada e de revisão por quem conhece a tradição

Oitava linha do portão de qualidade, e vale **só para o bloco de padrões rítmicos tradicionais**.

Clave e cáscara são afro-cubanas. Telecoteco, partido alto, baião, samba e coco são brasileiras. Há
padrões da África Ocidental. **Nomear e grafar esses padrões é culturalmente específico**, varia por
região e por fonte, e há divergência real entre quem ensina.

Um erro aqui **não é erro de teoria — é erro de atribuição.** Num app chamado **Clave**, feito por
brasileiros, grafar a clave de rumba errada ou chamar de telecoteco uma coisa que não é seria ruim de
um jeito que uma enarmonia trocada não é.

**Portanto:**

1. **Fonte obrigatória por padrão** — método, gravação ou pessoa. Sem fonte, o padrão não existe no
   arquivo.
2. **Revisão por quem conhece a tradição**, além da revisão do dono do produto (decisão 51).
3. **Se o time não tiver essa pessoa para algum padrão, o padrão não entra** — fica em
   [guardados.md](guardados.md), como tudo mais que falta uma peça.

Não é escrúpulo decorativo: é o mesmo critério de todas as decisões deste arquivo. **Não afirmar o
que não se pode sustentar.**

---

### 86 · Salvar o exercício com a configuração é salvar numa rotina — e o "copiar link" sai

A configuração é o trabalho (só terças e sextas, linhas suplementares, Dórico e Lídio) e era a parte
que evaporava: o arsenal guarda só o **id** do item. O "copiar link" era o único jeito de uma
configuração sobreviver ao fim da sessão — **um atalho em volta da falta de rotina**.

Então o botão é **"Salvar numa rotina"**: escolhe uma rotina existente ou cria uma, e grava a
`Instância` (item + configuração) como etapa. **Não há preset solto**, de propósito: seria um terceiro
conceito ao lado de item salvo e de rotina, três coisas na home fazendo quase o mesmo.

**O botão grava a configuração *de agora*, não a que ficou guardada no item.** Por isso ele mora
dentro do `Player`, que é quem a conhece: abrir uma etapa, mexer e salvar de novo grava o que a
pessoa está vendo.

**Abrir uma etapa restaura a configuração dela**, e mexer nas configurações continua funcionando sem
sobrescrever nem a do item nem a da etapa. A configuração viaja no `state` da navegação e não na
URL: é dado da rotina da pessoa, e compartilhar é papel da rotina (decisão 23).

**O "copiar link" estava quebrado, e em silêncio.** O link apontava para `/treinar/:id`, que virou
rota legada na `D1`, e o redirecionamento reescrevia só o `pathname` — **a query sumia**. Quem abria
caía no exercício certo, rodando com as configurações *dele*, sem erro nenhum e sem aviso de
configuração compartilhada. O mesmo defeito atingia qualquer link antigo com `?...` ou `#...`; foi
corrigido à parte (`reescreverRotaLegada`).

**O que isto NÃO é:** o editor de rotinas (`F3-5`) nem o executor (`F3-2`, `F3-3`). A tela só lista
as rotinas no Praticar, abre cada etapa com a configuração salva, tira uma etapa e apaga a rotina.
Ordem, tempo por etapa, modo livre/guiado e rotação continuam sendo desenho do Paulo.

**Estava em aberto, e a decisão 87 fechou:** a tonalidade e a região moravam nos parâmetros globais do
perfil, então **não iam** na etapa salva — "Salvar em Fá maior" não gravava Fá maior. Agora vão.
---

### 87 · Tonalidade, região e material não são do perfil

Concordância do Paulo com uma crítica a uma decisão antiga — e o erro era em parte da cascata que eu
mesmo tinha desenhado: o perfil era uma camada de **todos** os parâmetros. O critério correto:

> **O perfil é quem a pessoa é. Tonalidade, região e material são o que ela está praticando agora.**
> Trocam toda semana, e por morarem fora do exercício ficavam fora de tudo que se salva numa rotina.

| É da pessoa (perfil) | É de prática (exercício → etapa → rotina → "agora") |
|---|---|
| instrumento · afinação · número de cordas · timbre · volume · nomes das notas · canhoto | tonalidade · região · material |

**Onde se escolhe.** Dentro do exercício, no painel "Personalizar", **lembrado por exercício**
(`State.pratica[itemId]`). A rotina, a etapa e a rotação continuam sobrescrevendo, como antes. O
painel do Perfil, que eu tinha feito horas antes, saiu.

**Só aparece o que o item respeita** (`CatalogItem.respeita`). Oferecer "região" num item que a
ignora seria prometer o que não acontece — o mesmo erro de "material diatônico sem tonalidade". E
**a lista é medida, não opinada**: `contexto-declarado.test.ts` instrumenta as funções de contexto e
compara com o que cada `make` realmente chama. Cinco itens não respeitam nada (armadura, teoria,
ritmo, acorde visual…) e isso é legítimo.

**"Salvar numa rotina" passa a gravar a tonalidade.** Ela vai em `Instancia.params`, e abrir a etapa
restaura **o que foi salvo** — inclusive "livre". Etapa é definição completa: "sem tonalidade" quer
dizer livre, não "use a que o item guarda hoje".

**`tempo` global morreu.** Nenhuma tela o lia (Técnica, Leitura, Ritmo, Backing e a comum têm cada
uma o seu `bpm`), e ele ia para o histórico como se fosse o andamento praticado: o Progresso mostrava
"80 bpm" até em exercício de ouvido, que não tem andamento — enquanto as ferramentas, que têm, não
gravavam nada. **O histórico estava errado nos dois sentidos.**

**`clef` global também não é de prática, e é resíduo.** Nenhum item a lê: todos os de pauta têm a
configuração `claves`, e só caem na global se a pessoa desmarcar todas. Fica no tipo como último
recurso, sem controle na tela.

**O registro só afirma o que o item usa.** O histórico e as tentativas gravam `instrument`, `tuning` e,
dos parâmetros de prática, **só os que o item respeita** (`paramsRegistraveis`). Gravar o valor
resolvido de todos faria o histórico afirmar "região: Média" para um exercício de armadura — o padrão
passando por escolha, o mesmo defeito do `tempo` global.

**Estado antigo é limpo, não ignorado** (`migrateSaved`): se `key` continuasse em `params`, a
tonalidade de ontem valeria em todo exercício, vinda de uma camada que não existe mais.

**Fica em aberto:** a **extensão da voz** é pessoal e volta ao perfil quando existir exercício de
canto — hoje não há. Se o item precisar de "uma tonalidade para tudo de hoje", é a barra de foco que
o Paulo descartou por ora (opção B).

---

### 88 · O arsenal sai

Confirmado com o Paulo. O arsenal guardava só o **id** do exercício: um item guardado sem
configuração é **uma rotina de uma etapa que não pode dizer o que a etapa faz.** Com "Salvar numa
rotina" (decisão 86) ele virou segunda forma de salvar a mesma coisa.

**Consequências, e duas delas são do Paulo:**

- **Não há mais atalho de guardar no cartão do catálogo.** A estrela saiu; para guardar, abre-se o
  exercício. Era um atalho conveniente e agora não existe.
- **O Praticar da primeira abertura está vazio** até haver rotinas do time (`F3-6`), porque o
  arsenal vinha com quatro exercícios de partida. Quem monta o conjunto inicial é **curadoria do
  Paulo**, e é isso que enche a tela de quem chega.
- O estado salvo de quem tinha arsenal é descartado (`migrateSaved`), sem conversão: não há usuários
  fora do time.

**Junto, sem ser decisão:** o cartão do catálogo mostrava o **percentual de acerto** por exercício
(`correct / attempts`). "Percentual de domínio" está na lista do que nunca entra, e eu o tinha tirado
do Player na `F0-2`; sobrou aqui. Removido. O cartão continua dizendo quantas vezes foi feito.

---

### 89 · O instrumento virtual é o visualizador, em modo "tocar"

Ideia do Paulo: instrumentos virtuais (piano, violão, guitarra, baixo) como ferramenta — tocar
melodias simples, bends, acordes **sem ter de usar vários dedos** (fixar as notas e depois arpejar,
bater ou tocar em bloco), com parâmetros de cordas, afinação, timbre, intensidade, duração e efeitos.

**Não é um item novo:** é o **mesmo componente** do visualizador de braço e teclado (`F6-3`,
decisão 17), num modo em que ele **soa e responde ao toque**. Uma implementação, vários usos — a
decisão 17 proíbe duas.

**Quase todos os parâmetros já existem**, e não ganham sistema novo: timbre, intensidade, duração e
"bloco ou arpejado" são a camada de apresentação (`audio/presentation.ts`); afinação e timbre por
instrumento são do perfil. Falta o **strum** (arpejo com direção e velocidade).

**A razão de existir, ligada à visão:** a visão diz que agregar ferramentas não segura ninguém, então
um instrumento livre sozinho não diferencia o Clave. O que diferencia é ele ser **superfície de
estudo** — tonalidade e escala marcadas sobre o braço, rótulos em nome/grau/intervalo, "só tocar
notas da tonalidade" — e poder ser salvo numa rotina como tarefa.

**Resolvido em 03/11/2026 (era `A13`, `A14` e `A15`):**

- **O nome é "instrumento virtual"** — simples assim, nas palavras do Paulo. `A13` fechou.
- **Timbre é parâmetro de perfil**, como já é hoje, e continua lá. **Efeito fica fora do beta
  inteiro**: efeito sobre síntese é onde "soa brinquedo" aparece primeiro, e o som do baixo ainda
  não foi ouvido por ninguém. `A14` fechou.
- **Entram no beta três coisas:** melodias simples · marcação de tonalidade e escala sobre o braço ·
  fixar notas e depois arpejar, bater ou tocar em bloco. **Ficam fora bends, pedais, looper e
  capo** — são o que mais depende da qualidade do som, que é o risco que decide tudo ali. `A15`
  fechou.

**O risco que decide tudo é a qualidade do som:** as vozes são sintetizadas, e efeitos e bends sobre
um timbre fraco soam brinquedo (portão 4 do catálogo). Para violão e baixo, síntese de corda pulsada
(Karplus-Strong) dispensa amostras e dá bends e strums naturais; o piano é o difícil. **Antes de
qualquer tela, uma hora de teste de som — avaliada pelo Paulo, porque a IA não ouve.**

---

### 90 · A "tarefa com metrônomo": um motor, cinco famílias

Implementa o motor que o catálogo listava como inexistente. **Uma tela** (`tools/Cadencia.tsx`) e **cinco
famílias** declaradas sobre ela — deslocamento de acento (T3), subdivisão alternada (T4), sustentar e
cortar (T6), legato e staccato (T7) e deslocamento de padrão rítmico (T8) —, pela decisão 15: o que muda
de uma para outra são os controles e o **plano**, não a tela.

**Um plano é um ciclo de compassos.** Cada compasso diz o que acontece em cada célula (acento, ataque,
sustentação, corte, silêncio), o que a pessoa está fazendo e **o que muda no compasso seguinte**. A tela
repete o ciclo.

**Toda mudança é avisada um compasso antes, e só as mudanças.** É o ponto de T4 e T7 — fazer o que a pessoa
não consegue sozinha (mudar a própria programação enquanto toca) sem pegá-la de surpresa —, e é uma
propriedade **provada em todos os planos** por teste, não só implementada.

**Só tocar, nunca ouvir.** O app não escuta nada: mostra o que fazer, marca o momento da mudança e deixa
a avaliação com a pessoa (decisão 37). Por isso os cinco itens são `tarefa`.

**O andamento é configuração neutra** (decisão 82): nenhum plano o carrega, e o motor **nunca o sobe sozinho**.
Quatro cliques de contagem antes do primeiro compasso.

**O relógio troca de subdivisão na primeira célula do compasso novo**, e não na última do anterior: o
intervalo que vem depois da primeira célula já é o da subdivisão nova, e o que veio antes continuou sendo o
da velha. Medido no navegador a 70 bpm: o compasso dura ~3,4 s tanto em colcheias quanto em tercinas e
semicolcheias — o andamento não oscila na troca.

**No deslocamento rítmico, andar pelos modos é manual** (decisão 38) e **para a execução**: mudar o modo
muda o plano, e continuar com índices de outro plano seria tocar o que ninguém pediu.

**Declaradas, não publicadas (decisão 51).** Ver [revisao-pendente.md](revisao-pendente.md).

**Em aberto, e são do Paulo:**

- `A18` e `A19` (o histórico perdido ao fechar a aba, e a falta de "publicado") **foram resolvidos** nas
  decisões 92 e 91.
- `A20` (as 720 ordens de cordas na guitarra) **foi resolvido** na decisão 94.

---

### 91 · "Publicado" existe, e é imposto pelo código

A decisão 51 dizia que *publicar a família é passo humano do Paulo* — mas era só um acordo: nada no código o
fazia valer, e todo item declarado aparecia no catálogo. Com três colegas pondo IAs para construir itens, o
acordo não segura. O mecanismo (`src/catalog/publicacao.ts`):

| Estado | Quem vê | Significado |
|---|---|---|
| `rascunho` | ninguém, fora do modo de revisão | construído, não revisado |
| `legado` | todo mundo | já estava no app antes do portão; **sem revisão formal** |
| `publicado` | todo mundo | revisado pelo Paulo, com `revisadoEm` (AAAA-MM-DD) e `por` |

**O padrão é o estado mais restritivo.** Omitir `publicacao` num item novo é o mesmo que `rascunho`, então
esquecer de declarar nunca expõe nada — e uma IA que constrói um item sem saber desta regra produz um
rascunho, não uma publicação.

**`legado` existe por honestidade.** Os 26 itens que já estavam no app (20 exercícios e 6 ferramentas) não
passaram por revisão formal — a `F6-7` está pendente. Chamá-los de `publicado` afirmaria uma revisão que não
aconteceu; escondê-los esvaziaria o app. `legado` diz o que é verdade: visível, ainda não revisado. Quando o
Paulo revisar um, troca para `publicado`.

**Só o Paulo escreve `publicado`**, e o teste exige a data em ISO e o nome — sem eles, não passa.

**Modo de revisão.** `?revisao=1` no endereço mostra os rascunhos, com uma faixa de aviso e a marca "rascunho"
nos cartões; `?revisao=0` ou o botão "Sair" da faixa desligam. **Não há controle no Perfil, de propósito:**
quem testa o beta não deve esbarrar nele.

**Vale para o que o mecanismo alcança:** itens de catálogo (cartão, página, rotinas salvas no Praticar) e as
rotinas da ferramenta de Técnica. Um rascunho aberto por endereço direto mostra "este item está em revisão",
sem o exercício. Um rascunho some da rotina de quem não está em revisão **antes** do filtro de contexto, para
não ser contado como "escondido porque pede o instrumento".

**O documento não envelhece:** `docs/revisao-pendente.md` tem de listar, pelo id, todo rascunho — um teste
falha se faltar um. É o que os colegas leem, e uma lista velha faria alguém achar que um item está pronto.

**Fica fora do portão** o que não tem tela (os enumeradores de conduções e de rearmonizações): não há o que
esconder, e entram quando ganharem uma.

---

### 92 · O histórico é gravado ao esconder a aba, e uma sessão é uma entrada

Resolve `A18`. O registro só acontecia quando a tela **desmontava**, e fechar ou recarregar a aba no meio de
vinte minutos de prática não desmonta nada: não deixava rastro, em todas as ferramentas e no `Player` — num
produto cuja promessa é que o histórico diz a verdade sobre o que se praticou.

Agora a prática é gravada em **três momentos**, e todos regravam a mesma entrada (`Activity.sessao`):

1. a aba esconde (`visibilitychange`) — o único sinal confiável no celular, onde trocar de app costuma ser o
   último aviso antes de o navegador descartar a aba;
2. a página sai (`pagehide`) — fechar, recarregar, navegar para fora;
3. a tela desmonta — sair para outra tela do app.

**Uma sessão é uma entrada, regravada no lugar**, mantendo o horário original. Sem isso, gravar mais vezes
contaria a mesma prática duas ou três vezes. (`registrarAtividade`, com testes de que repetir atualiza e nunca
duplica.)

**O mesmo mecanismo vale para o `Player` e para as ferramentas** (`useRegistroDePratica`), e lê o que vai gravar
**no momento de gravar**: o que entra no histórico é o que valia no fim. Isso elimina por construção o defeito
do dado velho que o `Player` tinha.

Verificado no navegador: praticar e sair por navegação completa deixa a entrada (tonalidade, andamento,
segundos); esconder e depois sair atualiza a mesma entrada, de 6 para 11 segundos, sem duplicar.

**Limite honesto:** se o navegador matar o processo sem avisar (bateria, queda), os segundos desde a última
gravação se perdem. Gravar a cada minuto fecharia isso; não fiz porque `visibilitychange` já cobre o caso
comum e o custo de escrever no armazenamento a cada tick não se justifica sem um caso real.

---

### 93 · A subida de andamento da Técnica: desligada, lenta, com teto, e gravada

Resolve `A16`. A ferramenta de Técnica trazia **"subir 4 bpm a cada volta" ligado por padrão e sem teto** —
o app aumentando o andamento sozinho, que é exatamente o que a decisão 82 diz que ele nunca faz: o Paulo
avisou desde o começo que aumentar o bpm demais costuma ser prejudicial, e que para muita coisa o melhor é
fazer bem devagar.

**Agora:**

- **Nasce desligada.** É uma opção da pessoa, nunca um padrão.
- **Sobe 4 bpm a cada 2 voltas**, e não a cada uma: metade do ritmo, e a pessoa tem tempo de assentar.
- **Para num teto**, que ela escolhe (sugestão inicial: ♩ = 100). Sem ele, o andamento passava do limite do
  próprio controle da tela (200).
- **Nunca baixa o que a pessoa escolheu.** Se o início já está acima do teto, nada sobe — e a tela diz isso
  ("No teto: o andamento não sobe mais") em vez de deixar a pessoa sem saber por quê.
- **Mexer no controle ou ligar a subida no meio da prática reinicia a base**: a subida continua do que a pessoa
  escolheu, e ligar tarde não faz o andamento saltar pelas voltas que já passaram.

O andamento é **calculado a partir da base** (`andamentoNaVolta`), não somando 4 a cada volta: sem estado
acumulado não há deriva, e o resultado é testável por inteiro.

**O histórico grava o andamento de início e o de fim** (`bpmInicio`, `bpmFim`) — porque com a subida ligada não
existe um valor único, e gravar só um dos dois seria inventar. Aparece como "150 → 162 bpm", e como um número
só quando não mudou. Informação neutra, nunca placar. A pergunta que prendia a gravação do andamento (`A16`)
era exatamente essa.

Verificado no navegador a 150 bpm: 150 → 154 (volta 3) → 158 (volta 5) → 162 (volta 7) e **para no teto** pelas
10 voltas seguintes; ligada no meio da prática, ficou em 150 por mais 2 voltas antes de subir, sem saltar.

---

### 94 · A ordem das cordas é sempre de quatro cordas vizinhas

Resolve `A20`. A `T2` nomeia a ordem em que se atravessam as cordas ("4 2 3 1"). Na guitarra de seis seriam
**720 ordens** (6×5×4×3×2×1), e ninguém as percorre: o contador de "já vi" perde o sentido, e o avanço manual
da decisão 38 vira só um sorteio. No baixo de quatro são 24.

**Agora são sempre 24, de quatro cordas vizinhas, em qualquer instrumento.** Na guitarra a pessoa escolhe **qual
grupo**: Mi-Lá-Ré-Sol, Lá-Ré-Sol-Si ou Ré-Sol-Si-Mi (o baixo de quatro tem um só, e o seletor não aparece).

- **Dentro do grupo, a corda 1 é a mais aguda do grupo** — a convenção de todo músico de cordas, aplicada ao
  conjunto escolhido.
- **A posição no eixo e o que já passou valem por grupo**: a ordem 1-2-3-4 em Mi-Lá-Ré-Sol e em Lá-Ré-Sol-Si são
  exercícios diferentes na mão, e contar uma como "já vista" por causa da outra seria mentir. Voltar a um grupo
  devolve a pessoa ao ponto em que estava.
- **O histórico grava o grupo** (`grupoDeCordas`, 0 = o mais grave) quando há o que escolher.
- **O padrão é o grupo mais grave** (Mi-Lá-Ré-Sol), o equivalente direto do baixo. A pessoa não escolheu um
  padrão; ficou o mais óbvio, e trocar custa um toque.

**Fica em aberto, e é pedagógico:** se quatro cordas vizinhas bastam, ou se atravessar saltando uma corda (Mi-Ré-Si,
por exemplo) é parte do treino que se perde. Com grupos de vizinhas, "saltar" só existe dentro do grupo.

---

### 95 · O rodízio varia o exercício E as variantes dele, e o agrupamento é por propósito

Fecha o escopo do "motor de variabilidade" das rotinas. Três coisas entram:

**a) Rodízio montado à mão.** A pessoa põe vários itens do catálogo numa etapa, como escolhe qualquer
etapa. Sempre possível, sem depender de nada.

**b) Gerador de variantes do mesmo item.** "Pôr no rodízio uma variante para cada tonalidade" — ou para
cada região, ou cada corda. **Era o caso principal e eu quase o perdi:** medi só o assistente de *itens
diferentes*, concluí que servia pouco, e tratei isso como se fosse o valor do rodízio inteiro. O Paulo
apontou. `Instancia` é `{ itemId, settings, params }` e nada exige `itemId` diferente — três variantes
de `braco-ache` em Fá, Sol e Dó sempre foram uma etapa válida. **16 dos 20 exercícios** respeitam
tonalidade, região ou material, então variantes valem em quase todos.

**c) Grupos por propósito**, em `src/catalog/grupos.ts`. E aqui o critério mudou: eu tinha proposto
derivar de `skillTags` ("itens que treinam a mesma habilidade"), e o Paulo mostrou que o critério certo é
**"serve ao mesmo propósito agora"**. Um aquecimento de mão junta exercícios de motricidade porque é
isso que a pessoa quer fazer agora, não porque eles treinem a mesma habilidade — `technique.tempo_control`
junta metrônomo com "sustentar e cortar" porque os dois usam clique.

A objeção que o próprio Paulo levantou — *um exercício serve a vários propósitos, e qual importa?* — se
resolve com o critério certo: **um item entra em vários grupos**, sem eleger um principal.

**Os grupos são curadoria do Paulo.** O botão só aparece onde há o que oferecer: item sem grupo, ou único
visível do grupo, não mostra nada.

**Na tela, duas políticas, não três.** O modelo tem `ordem`, `sorteio-sem-repetir` e `sorteio`; a tela
oferece *em ordem* e *sorteado* (que usa `sorteio-sem-repetir`). O sorteio puro fica no modelo sem
controle: oferecê-lo é oferecer "pode cair o mesmo de novo", que é o que o rodízio existe para evitar.

**Rodízio, embaralhar e rotação são três coisas** — ver [camadas.md](camadas.md#3-as-três-variações-que-fazem-coisas-diferentes).

---

### 96 · O mapa das camadas e o checklist de item novo

Pedido do Paulo, e ele tinha razão: *"esse projeto está ficando bem complexo e eu espero que esteja muito
bem documentado, senão daqui a umas semanas eu não vou conseguir entender tudo que foi feito."*

Os números davam razão a ele: **1.692 linhas e 96 decisões** em `decisoes.md`, e as camadas do produto
existindo **só como decisões em ordem cronológica** — entender como a cascata conversa com o rodízio, a
rotação e o registro exigia ler seis decisões espalhadas entre a 7 e a 94.

**[camadas.md](camadas.md)** é o mapa: os quatro níveis (item → instância → etapa → rotina), as cinco
camadas de parâmetro e quem escreve em cada, as três variações, publicação, o que fica gravado, os
enumeradores, e onde cada coisa mora no código. **Sem história:** só o estado atual, com link para a
decisão. Quando divergirem, a decisão vence.

**[novo-item.md](novo-item.md)** é o checklist de inclusão, também pedido dele — incluindo o passo que ele
nomeou: **"olhar o todo"**, ver se o item novo cria grupo, revela duplicata ou devia ser parâmetro de um
item que já existe. Metade dos passos tem teste automático, e o checklist aponta para o teste em vez de
pedir fé.

**O portão de qualidade dizia "sete" e listava oito** desde a decisão 85. Corrigido em três documentos.

---

### 97 · A tonalidade de uma etapa mora na instância; `Etapa.params` sai

**Correção de uma recomendação minha, e ela estava errada pelo motivo que o próprio Paulo criou.** Eu
havia proposto o contrário — "a tonalidade é da etapa, `Instancia.params` sai" — argumentando que o
rodízio deve variar *o que* se faz, não a tonalidade. Mas na decisão 95 ele pediu exatamente **variantes
do mesmo exercício em tonalidades diferentes** rodiziando numa etapa, e isso **só existe se a instância
tiver tonalidade própria**.

E o código já apontava para cá: **`Etapa.params` nunca foi lido por ninguém.** Era validado em `ehRotina`
e copiado em `copiarRotina`, e nenhum código o consumia — só `Instancia.params` chega ao exercício. Mesma
forma da decisão 57 (cascata sem leitores) e do arsenal (decisão 88): campo declarado que nada usa.

**A tonalidade, a região e o material de uma etapa moram na instância.** `Etapa.params` sai do modelo.
"Esta etapa inteira em Fá" vira **"aplicar a todas"**, um gesto — e o gerador de variantes da decisão 95 já
existe para isso.

Três razões para não manter os dois com a instância vencendo:

1. **Não se perde capacidade:** tudo que `Etapa.params` faria, "aplicar a todas" faz.
2. **Mantém cinco camadas.** Acrescentar uma sexta por um caso que talvez nunca apareça é o que torna
   verdadeira a preocupação do Paulo com a complexidade (decisão 96).
3. **Dois lugares para a mesma informação confundem na tela** — a pessoa teria de entender qual vence.

E os dois quase nunca coexistem na prática: quem fixou a tonalidade da etapa provavelmente **não** está
rodiziando tonalidade.

**O custo, aceito:** trocar a tonalidade de uma etapa com três variantes é um "aplicar a todas" em vez de
uma edição só.

**`segundosSugeridos` continua na etapa**, e está certo: o tempo é da etapa, não da variante. Fosse da
variante, o rodízio mudaria a duração da rotina guiada a cada execução.

---

### 98 · O editor de rotinas

Fecha a `F3-5`, em `/rotina/:id`. Seis capacidades (decisão 95): criar, renomear, duplicar e apagar;
modo e embaralhar; reordenar e remover etapas; tempo sugerido por etapa; tonalidade e região **da
instância**; e o rodízio.

**A lista nunca tem mais de dois níveis.** Era o desafio que a tarefa mandava discutir: mostrar
etapa-com-várias-instâncias sem virar árvore de três níveis. A etapa é uma linha, e o rodízio é uma
**gaveta dentro dela** — não um lugar para onde se navega.

**A linha diz o que varia, nunca um valor que mudaria:** "3 variantes" ou "3 itens", nunca "Fá maior"
numa etapa que rodizia entre Fá, Sol e Dó. **O Praticar fazia exatamente isso** antes desta leva: mostrava
a tonalidade da primeira instância, o que mentia em duas de três execuções. Corrigido, com teste.

**E o Praticar não resolvia o rodízio:** abria sempre a instância 0, então o rodízio não existia na
prática. Agora a etapa resolve (`resolverInstancia`) e **grava `ultimaUsada`** ao abrir — conferido no
navegador: Dó → Ré♭ → Ré → Dó, com a posição persistindo entre aberturas.

**O rodízio não tem nome na interface**, por decisão do Paulo sobre o quanto nomear: a linha mostra o
que varia e a gaveta mostra a lista. "Rotação" continua sendo o nome do outro mecanismo (decisão 38), e
"rodízio" fica nos documentos e no código, onde a distinção precisa ser nomeada.

**"Aplicar a todas"** e **"uma variante por tonalidade"** são os gestos que substituem o `Etapa.params`
que saiu na decisão 97.

**Criar rotina vazia** passou a existir: antes só dava para criar salvando um exercício.

`src/pages/Rotinas.tsx` foi apagado — era um stub de 9 linhas sem rota, e ter `/rotinas` (redirecionamento
legado) e `Rotinas.tsx` ao mesmo tempo era confuso, como o Paulo apontou. Ficou uma coisa só.

**O que ainda não existe:** o executor. `F3-2` (guiado) e `F3-3` (livre) continuam pendentes — hoje a
etapa abre o exercício direto, sem cronômetro por etapa nem tela final.

---

### 99 · Correções da ferramenta de técnica, e o motor de digitações em dúvida

Retorno do Paulo usando a ferramenta. Seis correções, e uma dúvida de rumo que é dele responder.

**O som do baixo era um "tuc"**, e eram três defeitos somados: uma sub-oitava com ganho 0,5 (numa corda
Mi de 41 Hz isso põe **20 Hz**, que ninguém ouve e que só come headroom), um filtro **fixo** em 700 Hz
que matava os harmônicos, e decay mínimo de 0,35 s, curto demais para uma corda. Agora a fundamental
manda, com harmônicos ímpares, o filtro abre no ataque e fecha (é o que dá o *pluck*), e o decay
acompanha a duração.

**Volume do clique e das notas, separados.** Com um só, subir o instrumento subia o clique junto — e o
clique é referência: quem estuda quer a própria nota acima dele, ou o contrário.

**A subdivisão ficava escondida tocando**, o que obrigava a parar para mudar. Agora é visível, e trocar
reinicia o relógio (a subdivisão é a grade dele).

**O espaço reativava o último botão clicado** em vez de dar play — tocar em "Sortear" e apertar espaço
sorteava de novo. É comportamento padrão do navegador; aqui atrapalha. O espaço agora é sempre
começar/parar, menos dentro de campo de texto.

**"Tônica, quinta e oitava" usava o dedo 2 na tônica.** O Paulo toca **1 na tônica, 2 na quinta, 4 na
oitava**, e ele é o baixista. Corrigido. Eu não soube explicar de onde veio o 2.

**"Ordem das cordas" punha tudo na casa 5** — o que é uma pestana, e **no baixo pestana não se faz**. As
casas agora sobem uma a cada corda do grupo, mantendo a mão numa posição. E o exercício **deixou de dizer
qual dedo usar**: ali o ponto é atravessar as cordas, e o dedo é escolha de quem toca.

**"Troca de posição" (T5) foi removida** — "exercício nada a ver", nas palavras dele. Saiu o item, o
enumerador em `theory/tecnica.ts`, os textos e o eixo rotacionável.

---

### `A21`, resolvido em 03/11/2026: é a forma, não a digitação

**O Paulo decidiu pela coluna "forma" da tabela abaixo.** A `FM-2` encolhe: dizer o dedo passa a ser
**opcional, item a item**, em vez de obrigatório — a `T1` (permutações) continua precisando, porque ali
o dedo *é* o exercício, e a `T2` já tinha deixado de dizer. O guia de digitações que pedia 10–15
sequências dele **está desatualizado** e precisa ser reescrito para formas.

O registro de como se chegou lá fica abaixo, porque o argumento vale mais que a conclusão.

O Paulo levantou, e é a dúvida mais importante desta leva:

> *"quando eu falava de digitações esse tempo todo eu imaginava não uma tablatura mas sim um mapa do
> braço com as notas destacadas com círculos. eu entendo que isso na verdade são shapes/formas."*

E deu dois casos que o modelo atual não cobre: ele toca **o lá com os dedos 2 e 4 juntos**, e a digitação
muda conforme o que vem antes. O enumerador da `FM-2` produz **uma sequência de dedos por nota** — e isso
pode ser mais rígido e mais específico do que o problema pede.

**A suspeita é que haja duas coisas diferentes sob o mesmo nome:**

| | O que é | Onde isso vive |
|---|---|---|
| **Forma** | onde as notas estão no braço, marcadas com círculos. Cega para ritmo e para dedo | é o **visualizador** (`F6-3`) |
| **Digitação** | que dedo em cada nota, em ordem | é a `FM-2` |

Se a forma é o que importa na maior parte dos casos, a `FM-2` encolhe muito — e **dizer o dedo vira
opcional, item a item**, em vez de obrigatório. A `T1` (permutações) continua precisando, porque ali o
dedo *é* o exercício; a `T2` já deixou de dizer.

*Era o que estava escrito antes da decisão:* "isto não se resolve sem o Paulo, e muda o escopo de uma
tarefa grande." Resolveu-se: **forma**.

---

### 100 · Atalhos por conteúdo, as doze tônicas visíveis, textos no imperativo e o percentual fora

Quatro coisas aprovadas pelo Paulo, feitas juntas.

**Atalhos de configuração, nomeados pelo conteúdo.** `CatalogItem.presets`: no exercício de acordes de
ouvido são *Maior e menor · Só tríades · Só tétrades · Com suspensos · Todas as qualidades*.

**Não são níveis**, e isso é o ponto: nomear "1, 2, 3" afirmaria uma progressão linear que nem sempre
existe, e a decisão 9 proíbe. Os nomes descrevem **o que muda**, não quem é mais avançado — e há teste
recusando nome que contenha número, "nível", "básico", "avançado", "fácil" ou "difícil", nos dois
idiomas.

**As doze tônicas sempre visíveis.** Antes elas só apareciam depois de sair de "Livre", e à primeira
vista o controle parecia ter três opções — foi o que o Paulo viu. Agora são treze botões numa linha, e
maior/menor aparece abaixo quando há tônica escolhida.

**Os textos no imperativo.** Havia **dois padrões misturados**: uns usavam imperativo ("Identifique a
nota escrita na pauta") e três **repetiam a pergunta que já aparece na tela** ("Qual é a tecla
marcada?"). Uniformizados, nos dois idiomas. `pauta-acorde` dizia "Dê a cifra", que não é como se fala.

**O percentual de acerto saiu da página de progresso.** Era o `A17`: a taxa de acerto **não significa
nada** — o chute dá 50% (decisão 55) — e "percentual de domínio" está na lista do que nunca entra. Fica
a contagem (`6/23 respostas certas`), que é fato e não nota.

---

### 101 · Bug: três exercícios de braço repetiam a mesma pergunta para sempre

O Paulo relatou que "a nota nunca muda". **Era verdade, e pior do que parecia:** medido, `braco-nota` e
`braco-intervalo` davam **1 posição distinta em 200 sorteios**.

**A causa.** `casaPermitida` interseccionava as casas do braço com a **região em MIDI**. Num baixo com
casas 0–5 e a região padrão (48–72), sobrava **uma única casa no braço inteiro** — a corda Sol na casa
5 —, e `pick` devolvia sempre ela.

**E a causa da causa é conceitual:** num exercício de braço, **a região é a faixa de casas**, que a
pessoa escolhe. A região em MIDI foi feita para ouvido e pauta ("quero praticar no grave"), e
sobrepô-la ao braço mede a mesma coisa com duas unidades diferentes. Os três itens de braço entraram em
`REGIAO_NAO_SE_APLICA`, ao lado dos de pauta.

**Por que nenhum teste pegou.** `contexto-declarado.test.ts` conferia `respeita` contra as **chamadas às
funções** de `contexto-musical` — e `casaPermitida` lia `ctx.params.range` **direto**. O furo está
fechado: `ctx.params` agora é espionado por Proxy no teste, e qualquer leitura direta de um parâmetro
não declarado falha.

Esse teste novo pegou mais três itens de pauta lendo `range` sem declarar. Ali é legítimo e documentado
(a altura é ditada pela clave), e conferi que eles ficam estáveis em qualquer região — 7 e 9 perguntas
distintas no grave, no agudo e em tudo.

---

### 102 · Corda pulsada, e o nome da corda no braço

**O som de violão e baixo passou a ser Karplus-Strong** — ruído curto num atraso realimentado do
tamanho do período. É o que dá timbre de **corda** sem amostra nenhuma: o ruído do ataque é o dedo, e o
filtro na realimentação come os agudos a cada volta, como numa corda real.

A síntese por osciladores não dava isso, e era a razão do "tuc": **oscilador produz forma de onda fixa,
e corda tem espectro que muda enquanto soa.** A correção anterior (decisão 99) melhorou os parâmetros,
mas não mudava a natureza do problema.

**O Paulo precisa ouvir e dizer.** Eu não ouço — o que fiz foi trocar um método por outro que a
literatura diz ser o certo para corda. Se ainda não servir, o caminho seguinte é amostra gravada, e aí
é trabalho de músico.

**O nome de cada corda aparece à esquerda do braço** (pedido do Paulo): sem ele é fácil se confundir
sobre em que corda se está, ainda mais na guitarra, onde há duas cordas Mi.

---

## A hipótese do beta

> **As pessoas montam e mantêm rotinas — com exercícios bons o bastante para valer a pena pôr numa
> rotina.**

As duas metades são obrigatórias. A primeira sozinha permitiria encher a rotina com qualquer coisa;
a segunda sozinha é corrida de catálogo contra concorrentes com anos de vantagem.

**Como se responde:** beta fechado com 20 a 30 músicos, por duas semanas, pelo PWA. Conversa, não
painel. As perguntas: montaram rotina própria ou só usaram as do time? voltaram à mesma rotina?
em que momento ficaram olhando a interface em vez de praticar? qual opção foi difícil de achar?
usaram o Clave como lugar para estudar ou ficaram navegando sem entrar numa prática?

### O portão de qualidade de exercício

Nenhuma família é publicada sem passar nos oito:

1. **Resposta única e defensável** — alguém tentou responder de outro jeito e não conseguiu.
2. **Os parâmetros que importam existem** — tonalidade, região, material, andamento.
3. **Grafia e convenção corretas** — Si♭ em Fá maior; cifra na convenção do idioma.
4. **Som decente** — timbre e volume que não soem como bipe de micro-ondas.
5. **Alguém do time usaria de verdade amanhã** — não "é um exercício válido".
6. **Teste automático** gerando centenas de perguntas e conferindo as invariantes.
7. **Revisado pelo dono do produto** — ver decisão 51.
8. **Fonte citada e revisão de tradição** — **só para padrões rítmicos tradicionais** (decisão 85).
   Sem fonte, o padrão não entra.

Os oito **não se aplicam todos no mesmo nível**: motor, família e preset têm portões diferentes.
Ver a decisão 49 e [catalogo.md](catalogo.md#o-portão-de-qualidade-em-três-níveis).

---

### 103 · Padrão rítmico declara o seu próprio vão; e a ferramenta de harmonia não é backing track

Duas decisões da mesma rodada (03/11/2026), ambas tomadas pelo Paulo.

**O vão do padrão rítmico** (fecha a primeira pergunta da `F6-11`). A grafia dos padrões nomeados tinha
duas convenções possíveis e incompatíveis, e escolher errado obrigaria a reescrever os doze padrões
depois:

| | Como fica | Problema |
|---|---|---|
| **um compasso de 4/4, grade em semicolcheias** | é o que `rhythm-cells.ts` aceita hoje (`span <= barTicks`) | cada metade da clave vale 2 tempos, e o nome **"3-2" deixa de se referir a nada** — na literatura ele nomeia os dois compassos |
| **dois compassos de 4/4, grade em colcheias** | é a convenção dominante para clave | o baião e o telecoteco se escrevem em **um** compasso na tradição deles |

**Nenhuma das duas: cada padrão declara o seu próprio vão.** Clave e cáscara em dois compassos de 4/4;
baião, telecoteco e samba em um, como a tradição deles escreve.

**O que isso obriga, e é a parte boa:** `padrão` **não é** `célula`. Célula é material de leitura
rítmica e cabe num compasso por definição; padrão é um **colar nomeado, com origem, fonte e revisor**,
e o seu vão é propriedade dele. Eram dois objetos sob um nome, como já aconteceu com forma e digitação
(`A21`). Não precisa de motor novo — a notação de `rhythm-cells.ts` serve inteira.

**A ferramenta de harmonia não se chama "backing track"** (fecha `A9`). As três saídas que `A9` listava
eram produzir, licenciar royalty-free ou cortar; **nenhuma das três.** O que existe — a harmonia do
campo harmônico, sintetizada, para tocar por cima — já serve ao uso que a rotina *Internalizar uma
tonalidade* faz dela. O que estava errado era o **nome**: "backing track" promete gravação, e prometer
gravação para síntese é o portão 4 do catálogo ("soa brinquedo") aberto pelo texto, não pelo som.

Produzir as gravações é trabalho de músico — o Paulo, o Cavazzo e o Schultz — e cabe depois do beta.
**O nome novo não foi escolhido** e virou `A22`: nome de coisa que a pessoa vê é decisão de produto, e
não se toma dentro de uma tarefa.

---

### 104 · A autoavaliação mede esforço; e o portão de publicação fica desligado até o beta

Duas decisões do Paulo, em 04/11/2026.

**A autoavaliação de uma etapa de tarefa passou a ser *consegui com facilidade / consegui com esforço /
não consegui*.** Era *consegui / consegui com ajuda / preciso repetir*, e a versão nova é melhor por
dois motivos que valem registrar:

- **"com ajuda" é sobre a tela, não sobre a pessoa.** Numa tarefa de instrumento, "ajuda" pode ser o
  nome da nota à vista, o metrônomo, a forma desenhada — e isso é configuração, não resultado.
- **"preciso repetir" é um plano, não uma observação.** As outras duas respostas descrevem o que
  acabou de acontecer; essa descrevia o que a pessoa pretende fazer depois, que é outra pergunta.

**Facilidade e esforço são o que se percebe ao terminar**, e as três respostas passam a medir a mesma
coisa em três graus. Continua valendo o essencial: **autoavaliação nunca vira acerto** (decisão 5), e
aparece no histórico com as palavras da pessoa, nunca convertida em número.

*A migração traduz os valores guardados. `consegui → com facilidade` e `com ajuda → com esforço` são
exatas; `preciso repetir → não consegui` é a mais próxima, e não é exata — fica dito.*

---

**O portão de publicação fica desligado até o beta.** Nas palavras dele: *"acho que só precisamos usar
a coisa de publicado e rascunho depois que lançarmos o beta. agora, ainda não."*

Com quatro pessoas testando e nenhum usuário, esconder metade do catálogo **atrasa o teste e não
protege ninguém** — não há "quem usa" para proteger.

**O que NÃO foi feito, e é a diferença que importa: nada virou `publicado`.** O Paulo disse "pode
publicar todos", e marcar os sete rascunhos como publicados registraria *"revisado pelo Paulo, em tal
data"* — uma revisão que não aconteceu, que é exatamente o erro que a decisão 91 existe para impedir.
Em vez disso, **o portão inteiro desligou**: `PORTAO_LIGADO = false`, em `src/catalog/publicacao.ts`.

O efeito é o que ele pediu (o catálogo todo à vista, sem precisar de `?revisao=1`), e o estado de cada
item **continua verdadeiro**. Virar para o beta é trocar `false` por `true` numa linha, e
[revisao-pendente.md](revisao-pendente.md) segue listando o que falta revisar, com teste que a mantém
completa.

**Os testes passaram a exercitar os dois lados.** `visivel(p, revisao, portao)` recebe o estado do
portão, e as suítes ligam-no de propósito: é o comportamento do **beta** que precisa de guarda, e ele
deixou de ser o padrão. Testar só o padrão deixaria metade sem teste justamente na metade que vai
valer quando houver gente de fora usando.

---

### 105 · As rotinas se partem pelo que o mundo exige, não pelo assunto

Pedido do Paulo em 04/11/2026, e é a correção de um erro meu: eu tinha feito **uma** rotina "De bolso"
com cinco assuntos diferentes, e **metade das etapas não cabia no bolso de verdade** — pauta e braço
pedem olhar e tocar na tela.

**O eixo certo não é o assunto: é o que a prática exige do mundo.** Cinco rotinas viraram nove:

| Rotina | O que ela exige |
|---|---|
| **De bolso** | só ouvido. Nenhuma etapa pede olhar nem responder |
| **Teoria no silêncio** | só olhos. Nenhuma etapa faz nem recebe som |
| **Mapear o instrumento na rua** | olhos e dedos na tela, sem instrumento |
| **Treino de ouvido no fone** | fone e uma mão livre |
| **Mapear o braço na rua** | olhos e dedos na tela |
| **Mapear o braço com o instrumento** | o instrumento na mão |

**A consequência que vale mais que a divisão:** a rotina "De bolso" só existe porque o **ciclo sem
tela** (`F6-1`) existe — e ela é **quatro variações do mesmo item**, com objetos e tempos de pensar
diferentes. Foi isso que obrigou `ScreenProps` a receber a configuração da instância: sem ela, quatro
etapas do mesmo ambiente seriam quatro cópias idênticas.

**Nada impõe ordem.** As quatro de "não estou com o instrumento" são **modo livre** (cartões, qualquer
ordem), e o executor guiado ganhou **"deixar para o final"** ao lado de "pular" — e as duas são coisas
diferentes: pular marca a etapa como passada, deixar para o final diz *"não agora"* e a devolve no fim,
sem desfecho.

**Um achado, não um descuido:** `braco-com-instrumento` tem **três** etapas. Os itens que exigem o
instrumento hoje são técnica, harmonia, drone e as cinco tarefas com metrônomo, e **nenhum deles
pergunta uma nota do braço**. Falta o exercício que pede para tocar a nota no instrumento de verdade —
é a `F6-4`, e até ela essa rotina é sobre *tocar*, não sobre *mapear*.

---

### 106 · Número no histórico não é proibido — o que é proibido é ser central

Esclarecimento do Paulo em 04/11/2026, sobre a decisão 14 e a decisão 100.

> *"não sou totalmente contra números no histórico de progresso. o que eu não queria era tornar isso
> uma coisa central do produto. se o usuário quiser ver seus acertos, claro, vamos mostrar! só não
> vamos esfregar na cara dele pra não gamificar a coisa."*

**A regra não é "sem números": é "nada central, nada esfregado na cara".** Isto muda como as decisões
14 e 100 devem ser lidas por quem vier depois:

- **O que continua fora** é o que *gamifica*: percentual apresentado como domínio, recorde, sequência
  de dias, comparação entre pessoas, andamento como pontuação, rótulo sobre quem usa.
- **O que pode entrar** é contagem que a pessoa foi procurar. O histórico já mostra `acertos/total`, e
  isso está certo; mostrar mais, no Perfil, a pedido dela, também estaria.
- **O que não muda:** o percentual de acerto segue fora (decisão 100) — não porque é número, mas porque
  **o chute dá 50% e o número não significa nada**. E autoavaliação nunca vira acerto (decisão 5).

**A diferença entre as duas coisas é onde o número mora, não se ele existe.** Progresso não é aba
(decisão 11), e é isso que impede o número de ser central — não a ausência dele.

---

### 107 · A tabela de digitações de piano é responsabilidade da IA, com a dúvida escrita

O Bernardo Garcia declinou: disse que **não quer tomar essa decisão e não teria certeza**. O Paulo
passou a `FM-6` para mim.

**Isto muda o que a tabela pode afirmar.** Ela ia ser "revisada por um pianista"; passa a ser
"compilada de fontes, com a confiança de cada linha escrita". A diferença não é de forma: é que
**nenhuma linha pode ser apresentada como convenção estabelecida sem fonte que a estabeleça** — e onde
as fontes divergirem, a tabela registra a divergência em vez de escolher.

É a mesma regra dos padrões rítmicos (decisão 85) aplicada a um caso em que o revisor não existe: o que
não tem fonte não entra, e o que tem fonte entra **dizendo qual**.

---

### 108 · A área de técnica mostra a forma, não a tablatura — e deixa de ter o segundo braço

Aplica a `A21` ao código, em 04/11/2026. A `A21` decidiu *forma, não digitação*; os documentos e a
`FM-2` foram reescritos na hora, mas **a ferramenta de técnica continuava desenhando tablatura** — casas
numeradas sobre linhas de corda, com o dedo embaixo.

E ela desenhava isso **com um SVG próprio**, que era uma **segunda implementação de braço** — o que a
decisão 17 proíbe desde sempre. As duas coisas saíram juntas, porque eram a mesma coisa: o componente
de braço compartilhado já desenha o que a `A21` pediu (casas marcadas com círculos), e a tablatura
existia porque havia um desenho paralelo para mantê-la.

**O que entrou:** o `Fretboard` compartilhado, com as casas da rotina marcadas e **a de agora
destacada**. A ordem não se perde — ela é ouvida no metrônomo e vista no destaque que anda. O que se
ganha é o **desenho**, que é o que fica na cabeça depois.

**O dedo só aparece onde o dedo é o exercício** (a `T1`, permutações). Nas outras, qual dedo usar é
escolha de quem toca.

**Duas correções que só apareceram olhando a tela**, e valem registro porque são o tipo de coisa que um
teste não pega sozinho:

1. **A primeira versão marcava a sequência inteira**, e a `tqo` virou uma nuvem de **19 círculos** —
   ela sobe o braço inteiro, uma fundamental por vez. O desenho se perdia exatamente como se perdia na
   tablatura, só de outro jeito. O corte é o **alcance da mão** (5 casas em volta da casa de agora), e
   tem a propriedade certa: a forma **anda** com a mão em vez de somar tudo.
2. **A cor precisava ser declarada nas duas**, destaque e resto: o padrão do `Fretboard` já é `--mu`,
   então marcar só o destaque deixava as oito casas **da mesma cor**. Conferido no navegador — oito
   círculos, nenhum distinguível.

A lógica foi para `tools/tecnica-rotinas.ts` (`formaSobAMao`, `janelaDaMao`) com 11 testes, **porque no
navegador o destaque só anda com o relógio do áudio rodando** — e teste que depende de áudio real não é
teste. A propriedade travada não é um número máximo de casas (nove numa mão de cinco trastes é uma
forma legítima): é que a mão **recorta** a sequência, que era o bug.

---

### 109 · "Mapear o braço" é internalizar as posições — e é isso que define o que entra na rotina

Resposta do Paulo, em 04/11/2026, a uma pergunta minha sobre a rotina *Mapear o braço com o
instrumento* estar fina:

> *"mapear o braço é uma expressão que eu entendo como internalizar as posições das notas no braço.
> então tudo que trabalhar isso pode estar incluso."*

**Isto é um critério, não uma lista** — e é melhor que uma lista, porque decide casos futuros. Aplicado
às quatro etapas que a rotina tinha, ele faz duas coisas que eu não teria feito sozinho:

- **Tira o drone.** Afinar contra uma nota fixa trabalha **ouvido e entonação**, não posição de nota.
  Era a etapa que eu havia posto por ser "com o instrumento", e "com o instrumento" nunca foi o
  critério.
- **Traz os exercícios de braço de tela.** Eles trabalham posição **diretamente**, e eu os tinha
  excluído por não exigirem o instrumento — o que, pelo critério dele, é irrelevante. Com o instrumento
  na mão eles ficam **melhores**: a pessoa acha a nota no braço de verdade e só então confirma na tela.

**A consequência que vale registrar:** as duas rotinas de braço passaram a **compartilhar itens**, e a
diferença entre elas deixou de ser a lista de exercícios — é o **enquadramento** (instrumento na mão ou
não) e o **vão do braço** (regiões em rodízio na rua, braço inteiro com o instrumento). Isso contraria
um pouco a decisão 105, que partiu as rotinas "pelo que o mundo exige": aqui as duas exigem coisas
diferentes do mundo e **pedem os mesmos exercícios**. As duas coisas convivem, mas é bom saber que
convivem.

**E a mesma conversa cortou o aquecimento de ouvido de 15 para 8 minutos**, dois por frente. Ele está
certo pelo nome: quinze minutos com quatro assuntos já era meia sessão, e aquecimento que ocupa meia
sessão **compete** com a sessão em vez de abrir ela. Dois minutos por frente é pouco de propósito — a
pessoa pula o que não servir hoje e deixa o resto para o fim, que é o que os dois botões do executor
existem para permitir.

---

## Em aberto

Decisões que ainda não foram tomadas, com quem precisa decidir.

| # | Questão | Quem decide | Bloqueia |
|---|---|---|---|
| A5 | **Calibração do diagnóstico** — qual configuração corresponde a qual ponto de partida | time, corrigido no beta | `D4` |
| A6 | **Limiar da variação automática** — quantos acertos, em quantas sessões | time, calibrado no beta | nada: é uma constante num arquivo |
| A7 | **Microfone nos exercícios** — entra se o time se empolgar; não está no caminho crítico | time | nada |
| A8 | **Biblioteca pública de rotinas** — desenhada no beta, construída depois | Paulo | nada |
| C7 | **Convenção de canhoto no desenho do braço.** `C1` a `C6` foram resolvidos em 03/11 (decisões 60, 69, 73 a 76). Este **não é falta de decisão: é falta de pessoa** — ninguém no time é canhoto, e espelhar errado produz um braço que parece certo para destros e é inútil para quem usa. Implementar como opção de perfil e **não afirmar convenção** até alguém canhoto conferir | um canhoto de verdade | o desenho de braço espelhado |
| A10 | **Tipografia definitiva** — Instrument Sans é a escolha atual; vale conferir no uso real | Paulo | nada |

## Pendências fora do código

- ✅ **Criar a organização no GitHub** e transferir o repositório — o Bernardo transferiu (04/11/2026).
- **O deploy do Cloudflare Pages quebrou com a transferência**, e isso era esperado: a integração com
  git do Pages guarda o dono antigo internamente, o webhook do GitHub deixa de casar, e **o painel não
  tem opção de reapontar**. Pela documentação do próprio Cloudflare, a saída é **desconectar e
  reconectar do zero** ou **criar um projeto novo**.
  **O deploy foi movido para dentro do repositório** (`.github/workflows/deploy.yml`) justamente por
  isso: ele depende de um **token**, não de quem é o dono, e sobrevive à próxima mudança de dono.
  Faltam dois segredos no repositório — `CLOUDFLARE_API_TOKEN` (permissão *Account · Cloudflare Pages ·
  Edit*) e `CLOUDFLARE_ACCOUNT_ID`. Sem eles o fluxo avisa e passa, em vez de ficar vermelho a cada push.
- **Marcar produção = `main`** no projeto do Pages.
- **Proteger a `main`**: PR obrigatório, CI verde, 1 aprovação, sem force-push.
- **Revisão de ambiguidade teórica** de cada família antes de publicá-la (decisão 13).
- **Política de privacidade** do beta: contas, microfone do afinador, menores.
- **Busca da marca "Clave"** no INPI e no USPTO antes de pagar contas de desenvolvedor.
- **Conta de doação** (Pix e Ko-fi ou equivalente).
