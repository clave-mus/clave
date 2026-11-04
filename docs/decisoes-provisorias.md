# Decisões provisórias — tomadas sem o Paulo, à espera de aval

> **Por que este arquivo existe.** Em 03/11/2026, à noite, o Paulo autorizou: *"pode tomar algumas
> decisões pelas próximas horas. apenas deixe elas registradas pra que eu possa revisá-las depois."*
>
> A regra nº 1 do projeto diz que a IA não toma decisão de produto. Esta é uma **suspensão explícita
> e com prazo**, não uma revogação — e o preço dela é este arquivo: **toda escolha que normalmente
> exigiria a conversa está aqui**, com o que foi decidido, por quê, e **o que custa reverter**.
>
> **Como usar:** cada entrada se resolve de um de três jeitos — *aprovada* (vira decisão numerada em
> [decisoes.md](decisoes.md) e sai daqui), *revertida* (o código volta, e o motivo fica em
> [guardados.md](guardados.md)), ou *alterada*. Nada aqui é definitivo até você passar o olho.

**Nada neste arquivo publica exercício nem rotina.** O portão da decisão 91 continua valendo: o que
eu construí à noite nasceu `rascunho`.

---

## P1 · Uma etapa de série faz 12 perguntas

**O que eu decidi:** `PERGUNTAS_POR_ETAPA = 12`, em `src/routines/execucao.ts`.

**Por que precisava de decisão:** o modelo de rotina não guarda esse número, e sem ele a etapa de
série **nunca terminava sozinha** — ficava esperando a pessoa clicar, o que no modo guiado é esquisito.

**E a contradição que resolvi no caminho.** A `F3-2` diz duas coisas incompatíveis: *"série termina em
N perguntas, ou N corretas seguidas, ou no tempo, o que vier primeiro"* e *"ao passar do sugerido, aviso
discreto — não avança, não bloqueia, não some com nada"*. Fiz valer a **segunda**: quem termina a etapa
é a contagem, e o tempo só informa. É a mais explícita e a mais coerente com a decisão 4.

**Reverter custa:** uma constante. Mudar para "o tempo também encerra" custa um pouco mais, mas é
localizado em `Sessao.tsx`.

---

## P2 · Começar uma rotina do time **adota-a**

**O que eu decidi:** apertar *Começar* numa rotina do time cria a cópia da pessoa (`copiarRotina`) e
executa a cópia, com um aviso na tela dizendo que foi isso que aconteceu.

**Por que precisava de decisão:** executar a original não funciona. O rodízio grava `ultimaUsada` e o
tempo praticado mora na rotina — e a rotina do time é um objeto do código, não da pessoa. Executar sem
adotar significaria um rodízio que nunca avança entre sessões.

**A alternativa que recusei:** exigir *Adotar* antes de *Começar*. Dois passos para a coisa mais comum
do app, e o segundo passo não ensina nada a quem está começando.

**Reverter custa:** tirar seis linhas de `iniciar`, em `Sessao.tsx`, e pôr o botão *Começar* só nas
adotadas.

---

## P3 · A autoavaliação aparece no histórico, com as palavras da pessoa

**O que eu decidi:** uma etapa de **tarefa** grava `autoavaliacao: 'consegui' | 'com-ajuda' | 'repetir'`
na atividade (não na tentativa), e o histórico mostra isso em texto — *"Consegui com ajuda"*.

**Por que precisava de decisão:** é informação nova numa tela que a decisão 14 protege de virar placar.

**Por que acho que não vira placar:** não é número, não soma, não compara e não vira percentual. É o que
a pessoa disse sobre a própria prática, com as palavras dela. E **não** entra em `correct`, porque o app
não ouve ninguém tocar — tratar isso como acerto afirmaria uma validação que não existe (decisão 5).

**Reverter custa:** uma linha em `Progresso.tsx`. O campo pode ficar gravado sem aparecer.

---

## P4 · No modo livre não há "etapa 3 de 5", nem barra, nem tempo somado

**O que eu decidi:** a rotina livre abre nos **cartões**, com o cronômetro **escondido por padrão**, sem
numeração de etapa, sem barra de progresso e sem tempo total. Tocar num cartão abre a etapa; concluir
volta aos cartões, em vez de "avançar".

**Por que precisava de decisão:** a `F3-3` diz "cronômetro existe e fica quieto" e "tempo total não
existe no modo livre", mas não diz o que fazer com a numeração e a barra — e as duas sugerem progresso
e ordem, que é justamente o que o modo livre não tem.

**Reverter custa:** três condicionais em `Sessao.tsx`.

## P5 · Quais itens ficam atrás de cada uma das oito portas (D2)

**O que eu decidi:** a tabela porta → itens em `src/catalog/portas.ts`, e **o catálogo passou a abrir
"por objetivo" por padrão**, com "por área" como alternativa.

**Por que precisava de decisão:** é taxonomia, e a `CLAUDE.md` diz que taxonomia é decisão de produto.
A decisão 20 nomeou as oito portas e exigiu "pelo menos 4 itens atrás de cada", mas **nunca disse
quais**.

**Como eu derivei, para você poder conferir rápido:** mecanicamente, das etiquetas que os itens já
declaram — `fretboard.*`/`keyboard.*` na porta do instrumento, `ear.*` no ouvido, `notation.*` na
leitura, `theory.*` na teoria, `obj=ritmo` no ritmo, `primaryModule: technique` na técnica, `obj=harmonia`
e `obj=acordes` na harmonia. **A única porta que não sai de etiqueta é o improviso**, porque não há
etiqueta de improvisar: pus ali o que a decisão 79 diz que ela contém — escalas, arpejos, notas-alvo e
vocabulário.

| Porta | Itens | Declarados |
|---|---|---|
| Dominar as notas no instrumento 🚩 | braco-nota, braco-ache, braco-intervalo, teclado-nota, teclado-tecla, acorde-visual, teclado-acorde, ouvido-tecla | 8 |
| Melhorar o ouvido | ouvido-intervalo, ouvido-acorde, ouvido-escala, ouvido-celulas, ouvido-tecla, ritmo-ouvido, ambiente | 7 |
| Acompanhar e entender harmonia | backing, ouvido-acorde, pauta-acorde, teclado-acorde, acorde-visual, quiz-teoria | 6 |
| Aprender teoria musical | quiz-teoria, pauta-armadura, pauta-intervalo, pauta-escala, pauta-acorde, braco-intervalo | 6 |
| Aprender a ler partitura | pauta-nota, pauta-construir, pauta-intervalo, pauta-acorde, pauta-escala, pauta-armadura, leitura, ritmo | 8 |
| Melhorar ritmo e groove | ritmo-ouvido, ritmo, metronomo, deslocamento-ritmico, acento-deslocado, subdivisao-alternada | 6 |
| Melhorar técnica e precisão | tecnica, metronomo, sustentar-e-cortar, legato-staccato, acento-deslocado, subdivisao-alternada | 6 |
| Improvisar e solar | ouvido-celulas, ouvido-escala, pauta-escala, ambiente, backing, braco-ache | 6 |

**Duas coisas que valem o seu olho:**

1. **Ritmo e técnica têm 6 itens declarados, mas só 3 e 2 visíveis hoje** — o resto é rascunho (os
   cinco da tarefa com metrônomo). Então as duas estão **abaixo dos 4 da decisão 20** para quem usa, até
   você revisar aqueles itens. Não escondi as portas: a decisão 20 admitiu a técnica *"sabendo que ela
   enche depois"*, textualmente. O que o código impede é porta **vazia**.
2. **O mesmo item aparece atrás de várias portas**, de propósito — `pauta-acorde` é leitura, harmonia e
   teoria ao mesmo tempo. Obrigá-lo a escolher uma esconderia dois terços do que ele serve.

**Reverter custa:** editar a tabela. Se você quiser outro critério (um item por porta, por exemplo), é
reescrever o arquivo, mas nada mais depende dele.

---

## P6 · Os sete objetivos antigos são descartados na migração, não convertidos

**O que eu decidi:** quem tem `goals: ['jazz']` salvo no navegador fica com `goals: []` e reescolhe no
Perfil, agora entre as oito portas.

**Por que precisava de decisão:** a alternativa é mapear — "jazz" → harmonia? improviso? ouvido? —, e
**qualquer mapeamento inventa uma escolha que a pessoa não fez**. "Repertorio" e "jazz" não correspondem
a porta nenhuma; eram objetivos de antes da decisão 20, e alimentavam o gerador de sessão que já saiu.

**Reverter custa:** uma tabela de conversão em `state/migrate.ts`. Mas quem já abriu o app depois desta
noite já perdeu o valor antigo, então reverter não o traz de volta.

## P7 · `acorde-visual` no piano era `teclado-acorde` pior, e saiu

**O que eu decidi:** ao fundir `pauta-acorde + teclado-acorde + acorde-visual` em `que-acorde-e-esse`,
a superfície **teclado** usa o gerador que era de `teclado-acorde`, e o ramo "piano" de `acorde-visual`
(`pianoChordQuestion`) foi apagado.

**Por que precisava de decisão:** parecia um conflito — dois geradores diferentes para a mesma
superfície — e conflito de conteúdo é seu. Olhando o código, não era: **os dois montavam o acorde na
posição fundamental e marcavam o teclado**, e as únicas diferenças eram que `pianoChordQuestion` tinha a
lista de cinco qualidades chumbada e **ignorava a cascata** (tonalidade, região, material). Ou seja,
`teclado-acorde` fazia o mesmo e melhor.

**O que isso NÃO é:** não é a tabela de digitações de piano (`FM-6`, as 3 linhas em branco do Bernardo).
Aquela não está no código ainda; quando entrar, entra como formas reais, e aí sim há uma escolha a fazer
sobre acorde montado versus posição real.

**Reverter custa:** ressuscitar 6 linhas do histórico do git. Nada depende delas.

---

## P8 · O membro de um grupo de rodízio passou a ser uma instância, não um id

**O que eu decidi:** `GRUPOS` em `catalog/grupos.ts` passou de `itens: string[]` para
`itens: { itemId, settings? }[]`, e nasceu um grupo novo — **"O teclado"**.

**Por que precisava de decisão:** a fusão por superfície forçou. Antes, "O braço" listava
`braco-nota, braco-ache, braco-intervalo`; depois dela, esses três são os mesmos ids de "Leitura na
pauta". Um grupo que listasse só o id ofereceria **leitura de pauta dentro de "O braço"**.

**O grupo novo é consequência, não escopo extra:** existindo "Leitura na pauta" e "O braço" com os
mesmos quatro itens em superfícies diferentes, o teclado ficava como a única superfície sem grupo — e os
seus itens apareceriam sem companheiro nenhum.

**Reverter custa:** o tipo e os três grupos de superfície. Tirar "O teclado" é apagar seis linhas.

---

## P9 · Como as estatísticas e o histórico atravessam a fusão

**O que eu decidi**, em `state/migrate.ts`:

- **O histórico troca o id e MANTÉM o título antigo.** O título gravado é o que a pessoa viu naquele
  dia; reescrevê-lo falsearia o registro. A tela já prefere o título atual quando o item existe.
- **O `parameters_snapshot` da atividade não é remexido.** Mesmo motivo: é o registro do que aconteceu.
- **As estatísticas por item SOMAM.** `pauta-nota` com 10 tentativas e `braco-nota` com 4 viram
  `que-nota-e-essa` com 14. Eram a mesma pergunta em superfícies diferentes, e separá-las agora perderia
  a prática de uma delas.

**A alternativa que recusei:** guardar a estatística por item **e** superfície. É mais informativo e é
trabalho de verdade (muda a chave de `stats` em todo lugar); e como ninguém olha essa tela com lupa
hoje, somar é a escolha honesta.

**Reverter custa:** quem já abriu o app depois desta noite teve as estatísticas somadas, e **somar não
se desfaz** — os números originais não ficaram guardados. Se você quiser por superfície, é para frente,
não para trás.
