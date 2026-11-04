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
