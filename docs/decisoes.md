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

Vive dentro do Perfil e de cada item. Medida principal: **tempo estudado**. Fora: badges, streaks,
XP, níveis, ranking, percentual de domínio, comparação entre pessoas.

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

Nenhuma família é publicada sem passar nos sete:

1. **Resposta única e defensável** — alguém tentou responder de outro jeito e não conseguiu.
2. **Os parâmetros que importam existem** — tonalidade, região, material, andamento.
3. **Grafia e convenção corretas** — Si♭ em Fá maior; cifra na convenção do idioma.
4. **Som decente** — timbre e volume que não soem como bipe de micro-ondas.
5. **Alguém do time usaria de verdade amanhã** — não "é um exercício válido".
6. **Teste automático** gerando centenas de perguntas e conferindo as invariantes.
7. **Dono musical nomeado** — ver [equipe.md](equipe.md).

---

## Em aberto

Decisões que ainda não foram tomadas, com quem precisa decidir.

| # | Questão | Quem decide | Bloqueia |
|---|---|---|---|
| A3 | **Metade "com instrumento" do catálogo** — documento em elaboração | Paulo | Técnica e os exercícios de instrumento |
| A4 | **Os textos das 8 portas por objetivo**, em dois idiomas, incluindo uma que o Schultz escolheria | Paulo | `D2` |
| A5 | **Calibração do diagnóstico** — qual configuração corresponde a qual ponto de partida | time, corrigido no beta | `D4` |
| A6 | **Limiar da variação automática** — quantos acertos, em quantas sessões | time, calibrado no beta | nada: é uma constante num arquivo |
| A7 | **Microfone nos exercícios** — entra se o time se empolgar; não está no caminho crítico | time | nada |
| A8 | **Biblioteca pública de rotinas** — desenhada no beta, construída depois | Paulo | nada |
| A10 | **Tipografia definitiva** — Instrument Sans é a escolha atual; vale conferir no uso real | Paulo | nada |
| A9 | **Backing tracks** — produzir, licenciar royalty-free, ou cortar. **Música de IA está fora.** | Paulo | a ferramenta de backing |

## Pendências fora do código

- **Criar a organização no GitHub** e transferir o repositório (só o Bernardo pode transferir).
- **Religar o Cloudflare Pages** à organização e marcar produção = `main`.
- **Proteger a `main`**: PR obrigatório, CI verde, 1 aprovação, sem force-push.
- **Revisão de ambiguidade teórica** de cada família antes de publicá-la (decisão 13).
- **Política de privacidade** do beta: contas, microfone do afinador, menores.
- **Busca da marca "Clave"** no INPI e no USPTO antes de pagar contas de desenvolvedor.
- **Conta de doação** (Pix e Ko-fi ou equivalente).
