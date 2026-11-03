# F3 · Rotinas — o caminho crítico

**É isto que o beta precisa provar.** Se esta frente ficar vazia enquanto o trabalho se espalha por
microfone, comunidade e arte, o beta não responde nada.

Modelo em [arquitetura.md § 3.3](../arquitetura.md#33-o-modelo-de-rotinas); comportamento em
[beta.md](../beta.md#o-executor-de-rotinas).

**Ordem sugerida:** F3-1 → F3-2 → F3-3 → F3-4 → F3-5 → F3-6 → F3-7. F3-6 e F3-7 podem ir em
paralelo com F3-5.

---

## F3-1 · Modelo e armazenamento ✅ *feita em 03/11/2026*

**Decisões de origem:** 4, 5, 7, 23. **Depende de:** F2-1. **Bloqueia:** todo o resto de F3.

Criar `src/routines/types.ts` e `src/routines/storage.ts` com `Routine`, `Step`, `Instance` e
`RoutineSession` exatamente como em
[arquitetura.md § 3.3](../arquitetura.md#33-o-modelo-de-rotinas).

Três coisas que **não** podem ser deixadas para depois:

1. **`formatVersion` desde a v1, com migração escrita** — mesmo que a v1 seja a única que existe.
   Link compartilhado é dado que sai do controle do app (decisão 23); quando o formato mudar, link
   antigo quebra se não houver migração. Escrever agora custa uma função; escrever depois custa
   links quebrados de gente real.
2. **`Step.lastUsed` persiste** entre sessões. Se o rodízio reiniciar a cada abertura, a ciclagem
   não existe na prática — a pessoa cai sempre na primeira instância.
3. **`suggestedSeconds` pertence à etapa, não à instância.** Senão a ciclagem muda o tempo sugerido
   e a rotina guiada fica de duração variável sem motivo.

Guardar em `localStorage` junto do resto do estado (`clave:v1`), com a forma já pensada para subir
ao Supabase em F9-1.

**Pronto quando:** dá para criar, ler, alterar e apagar rotina pelo código; um teste cria uma
rotina da v1, sobe a versão de formato, roda a migração e confere que nada se perdeu.

**Feito.** `src/routines/types.ts` e `storage.ts`, com 24 testes. A corrente de migração está
montada e **vazia de propósito** — a v1 é a única que existe, e a máquina precisa estar pronta
antes de precisar dela. Um buraco na corrente é **recusa**, nunca entrada meio migrada.

Um bug que o teste pegou: `copiarRotina` fazia cópia rasa, então adotar uma rotina do time e
mexer numa configuração alterava **a do time junto**. Agora é cópia profunda de `settings`,
`params` e `valores` da rotação.

**Não faça:** nenhuma interface. Esta tarefa é modelo, persistência e testes.

---

## F3-2 · Executor, modo guiado

**Decisões de origem:** 4, 5. **Depende de:** F3-1.

Construir a partir de `src/pages/Sessao.tsx`, que já existe e está desligada da rota (F0-3).

- Etapa atual em primeiro plano: instrução curta e o material musical da instância resolvida.
- **Tempo sugerido visível**, cronômetro **crescente**. Ao passar do sugerido, aviso discreto
  ("tempo sugerido atingido") — **não avança, não bloqueia, não some com nada**.
- **Avanço manual**: anterior / próxima, e salto para qualquer etapa pela lista compacta ao lado.
- Pausa.
- **Herança visível**: onde o valor veio de cima, escrever a origem — *"Tonalidade: Dó maior (da
  rotina)"*. Usa a `origin` de F2-1.
- **Esconder o cronômetro** (a pessoa pode querer o modo guiado sem relógio).
- Os três tipos de término (F1-2) se comportam diferente no fim da etapa:
  - **Série** — termina em N perguntas, ou N corretas seguidas, ou no tempo, o que vier primeiro.
  - **Ambiente** — só termina quando a pessoa sai.
  - **Tarefa** — oferece *consegui / consegui com ajuda / preciso repetir*, gravado como
    `self_assessed`, **nunca** como `correct`.
- **Fechar e retomar**: salvar a `RoutineSession` e, ao voltar, oferecer continuar de onde parou.
- **Item que sumiu ou mudou de id**: avisar e oferecer substituto. Nunca falhar em silêncio.
- Tela final: tempo total, etapas visitadas e concluídas, autoavaliação opcional, repetir ou
  encerrar. **Sem celebração, sem pontuação.**

**Pronto quando:** dá para começar uma rotina guiada, pausar, voltar uma etapa, fechar a página e
retomar de onde parou — sem perder tempo nem resultado.

**Não faça:** nada de avanço automático. Nenhuma tela de parabéns.

---

## F3-3 · Executor, modo livre, e a aba Praticar

**Decisões de origem:** 4, 20b. **Depende de:** F3-1, F0-4.

O modo livre e a home são a mesma tarefa, porque a home **é** a lista de rotinas.

**A aba Praticar:**

- Topo: seletor de contexto (**De bolso · No ônibus · Em silêncio · Com o instrumento** + marcador
  **Posso cantar**), que filtra a tela inteira. Padrão: o último usado. Usa `fitsContext` (F1-3).
- Corpo: cartões de rotina com nome, modo, número de etapas e — só nas guiadas — o tempo somado.
  **"Tempo total" não existe no modo livre** (somar seria mentira).
- Rotina que não cabe no contexto aparece **esmaecida com o motivo** ("3 de 6 etapas pedem o
  instrumento"), **nunca escondida**.
- Rodapé: **um** card de descoberta, fora das rotinas, com motivo explícito ("você nunca treinou
  nada de percepção harmônica") e botão de pôr numa rotina. **Não é sorteio.**

**O modo livre:**

- As etapas como cartões; tocar em qualquer uma abre. Sai e volta à vontade.
- Cronômetro existe e **fica quieto**.
- **"Pratiquei hoje" = qualquer etapa efetivamente usada** — uma tentativa registrada ou tempo real
  num ambiente. Sem meta de completude, sem "você deixou 3 etapas por fazer".

**Pronto quando:** com "De bolso" escolhido, a Praticar mostra só o que cabe (e explica o que não
cabe), e começar uma etapa leva um toque.

**Não faça:** não traga de volta nada que monte sessão automaticamente. Não ponha porcentagem de
acerto nos cartões.

---

## F3-4 · Ciclagem ✅ *lógica feita em 03/11/2026; falta a tela*

**Decisão de origem:** 7. **Depende de:** F3-2, F3-3.

Uma etapa com várias instâncias resolve **uma ao abrir**:

- Políticas: `ordem` (rodízio, padrão), `sorteio`, `sorteio-sem-repetir`.
- Botão discreto **"trocar"** ao lado da etapa, que resolve outra instância na hora.
- `lastUsed` atualizado e **persistido**.
- Uma etapa com **uma** instância é uma etapa comum — nenhum caminho de código especial, nenhuma
  interface diferente.
- **Embaralhar** a ordem das etapas (propriedade da rotina) é independente da ciclagem e entra
  aqui também.

**Pronto quando:** abrir a mesma rotina três vezes seguidas entrega instâncias diferentes numa
etapa com três instâncias, mesmo fechando o navegador entre uma e outra.

**Feito (lógica).** `src/routines/ciclagem.ts`: `resolverInstancia`, `trocarInstancia` e
`ordemDasEtapas`, com o gerador aleatório injetável para o teste ser determinístico. Falta ligar
na tela, junto com F3-2 e F3-3.

Detalhe de implementação que vale saber: `sorteio-sem-repetir` **sorteia entre as outras e
remapeia**, em vez de sortear de novo até dar diferente. Laço de repetição com gerador ruim pode
não terminar.

**Não faça:** nenhuma substituição automática por etiqueta em tempo de execução. O app só entrega
o que a pessoa pôs ali (decisão 7).

---

## F3-5 · Editor de rotinas

> **O que já existe (decisão 86):** "Salvar numa rotina" em todo item, a lista de rotinas no Praticar
> abrindo cada etapa com a configuração salva, tirar etapa e apagar rotina. Em `src/routines/edicao.ts`
> (`anexarInstancia`, `removerEtapa`) e `src/components/SalvarNaRotina.tsx`. **Não é o editor:** falta
> reordenar, tempo por etapa, modo livre/guiado, conjuntos de instâncias e rotação — e o desenho disso
> é do Paulo. Aproveite as funções puras; não reescreva.

**Decisão de origem:** 8. **Depende de:** F3-1, F1-6.

Mínimo, mas completo o bastante para a rotina ser de verdade da pessoa — sem editor, a proposta de
valor inteira não existe.

- Criar, renomear, duplicar e apagar rotina.
- Escolher modo (livre / guiado) e ligar embaralhar.
- Parâmetros da rotina (tonalidade, instrumento, afinação, andamento), herdados pelas etapas.
- Acrescentar etapa a partir do catálogo, configurar, **reordenar** e remover.
- **Acrescentar instância a uma etapa** (a ciclagem), com o assistente *"itens que treinam a mesma
  habilidade"* para ajudar a escolher — consulta pelas `skillTags`. A escolha final é sempre
  explícita e salva.
- Tempo sugerido por etapa (só guiado).
- Mostrar, em cada etapa, quais parâmetros vêm da rotina e quais foram substituídos ali.

**O desafio de design é mostrar etapa-com-várias-instâncias sem virar árvore de três níveis.** É o
primeiro lugar onde o princípio-mestre — *maleabilidade sem deixar a pessoa perdida* — é testado de
verdade. Se a solução ficar confusa, **pare e fale com o Paulo** antes de entregar.

**Pronto quando:** dá para montar do zero uma rotina com 5 etapas, uma delas com 3 instâncias,
definir a tonalidade na rotina, substituir a tonalidade numa etapa, reordenar, salvar e executar.

---

## F3-6 · Rotinas publicadas pelo time

**Decisões de origem:** 8, 9. **Depende de:** F3-1. **Pode ir em paralelo com F3-5.**

Quatro rotinas prontas, que chegam com o app:

- **De bolso** — modo livre; só itens sem instrumento, sem microfone e sem canto.
- **Internalizar uma tonalidade** — modo guiado, **em rotação por tonalidade** (F3-8), com seis
  etapas: referência tonal (armadura e sonoridade) · notas no braço · regiões do braço · modos ·
  harmonia (tríades, arpejos, voicings diatônicos) · vocabulário melódico. É o plano de estudo
  real do Paulo e é a rotina que melhor mostra o que o Clave é: morar numa tonalidade por vários
  dias e atravessá-la na horizontal e na vertical.
- **Mapear o braço do baixo** — modo guiado, tonalidade configurável e armadura visível, nas
  versões curta (15–20 min), padrão (35–45 min) e completa (50–70 min).
- **Aquecimento de percepção** — modo guiado, 10 min.
- **Leitura diária** — modo guiado, 15 min.

**Regra obrigatória:** adotar uma rotina do time **cria uma cópia da pessoa**. A sugestão de
variação (F7-1) altera a cópia, **nunca** a original.

**Pronto quando:** as quatro aparecem na Praticar, adotá-las cria cópia editável, e dá para começar
o preset do braço em outra tonalidade.

**👤 O conteúdo musical destas rotinas é curadoria do Paulo** (baixo) — a tarefa de código é a
estrutura e o carregamento.

---

## F3-7 · Compartilhar por link

**Decisão de origem:** 23. **Depende de:** F3-1. **Pode ir em paralelo com F3-5.**

- `src/routines/share.ts`: serializar a rotina (com `formatVersion`) e montar o link.
- Tela de recebimento: mostra o nome, o que a rotina contém e de quem veio, com o botão
  **"copiar para as minhas rotinas"**.
- **Não precisa de conta para receber.**
- Crédito à origem guardado na cópia (`from`).
- Link curto o bastante para caber no WhatsApp. Se a rotina serializada for grande demais para a
  URL, guardar no Supabase e pôr só o id no link — **mas sem nenhuma listagem pública** (é o
  limite inteiro da decisão 23).

**Pronto quando:** dá para mandar uma rotina pelo WhatsApp, a outra pessoa abrir sem conta e ficar
com uma cópia que ela pode editar.

**Não faça:** nenhuma listagem, nenhum perfil, nenhuma busca, nenhum comentário. O momento em que
o Clave publica texto de usuário onde outro usuário lê, ele herda moderação, denúncia, termos de
uso, LGPD e ECA — e isso é a decisão 23 inteira, não um detalhe.

---

## F3-8 · Rotação de parâmetro ✅ *lógica feita em 03/11/2026; falta a tela*

**Decisão de origem:** 38. **Depende de:** F3-1, F2-1.

A rotina avança **um** parâmetro por uma lista de valores. É o que permite *morar numa tonalidade
por uma semana* e atravessar várias frentes dentro dela antes de passar para a próxima.

```ts
interface Rotacao {
  /** Qual parâmetro. Só os declarados rotacionáveis no catálogo. */
  param: 'tonalidade' | 'regiao' | 'corda' | 'modo' | 'qualidadeAcorde';
  /** A lista: ciclo de quartas, cromática, ou escolhida pela pessoa. */
  valores: ParamValue[];
  posicao: number;
  /** Padrão: manual. */
  avanco: { kind: 'manual' } | { kind: 'execucoes'; n: number };
  /** Que valor, quando, quantas sessões. É o que responde "já passei por Sol?". */
  visitas: { valor: ParamValue; em: number; sessoes: number }[];
}
```

**O avanço é manual por padrão, e isso não é preguiça de desenho.** Avanço automático quebra o caso
de uso que originou o recurso: no terceiro dia o app jogaria a pessoa na tonalidade seguinte quando
ela ainda não está firme na atual. **Quem sabe se internalizou é ela.**

O **conjunto de rotinas** (ciclo ABC) é o **mesmo objeto** com a lista sendo de rotinas em vez de
valores. Uma lista, uma posição, uma regra de avanço — implemente uma vez.

**Contrato de saída:** teste que percorre uma rotação de 12 tonalidades com avanço manual,
fechando e reabrindo o app entre cada avanço, e confere que posição e histórico de visitas
sobrevivem; e um teste que garante que **nenhum parâmetro não-declarado-rotacionável** pode entrar
numa `Rotacao`.

**Pronto quando:** dá para pôr "Mapear o braço do baixo" em rotação por tonalidade, praticar em Sol
por três sessões, avançar para Ré quando quiser, e ver depois por quais tonalidades já passou.

**Feito (lógica).** `src/routines/rotacao.ts`: `efeitoDaRotacao`, `registrarExecucao`, `avancar`,
`voltar`, `irPara`, `jaPassouPor` e `aindaNaoVisitados`, mais as listas `CICLO_DE_QUARTAS` e
`CROMATICA`. Falta ligar na tela.

Duas coisas que o código trava:

- **`registrarExecucao` nunca avança sozinho.** Com `avanco: 'execucoes'` ele devolve
  `podeAvancar: true`, e quem avança continua sendo quem chama. O módulo não decide pela pessoa.
- **`ALVO_DA_ROTACAO`** diz onde cada eixo aterrissa: tonalidade e região viram **parâmetro
  global**; corda, modo e qualidade de acorde viram **configuração da instância**. Um item que
  queira ser rotacionado por um eixo de configuração precisa usar aquele id — é convenção de
  código, e está documentada no arquivo.

**Não faça:** nada de rotacionar andamento — isso é a camada *progressão de andamento*, e bpm não é
pontuação (decisão 10). Nada de rotacionar vários parâmetros ao mesmo tempo.

---

## F3-9 · O histórico guarda os parâmetros ✅ *feita em 03/11/2026; corrigida e completada na faxina do mesmo dia*

> **A marca ✅ estava só meio verdadeira.** O contrato pedia que uma atividade sem validação (um
> `ambiente`) deixasse rastro do conteúdo, mas o teste provava apenas que o **armazenamento** aceita
> um snapshot — e das cinco ferramentas só o `Ambiente` passava um, e só com a tônica do drone.
> Corrigido: Backing grava **tonalidade e andamento**, Ritmo e Leitura gravam **andamento** e
> compasso/modo, Técnica grava **rotina e ordem dos dedos**. **Cada ferramenta grava só o que usa**:
> gravar região ou material onde a ferramenta os ignora seria afirmar o que não aconteceu.
>
> Dois outros defeitos que o histórico tinha, e que o teste da tarefa não pegava: o `Player` gravava
> os parâmetros do momento em que **montou**, não os do fim (mudar a tonalidade no meio do exercício
> gravava a antiga); e gravava o valor **resolvido** de tudo, então a região padrão entrava no
> histórico de exercícios que não têm região (`paramsRegistraveis`, `respeita`).
>
> **Em aberto, e é do Paulo (`A16`):** a Técnica **não grava andamento**, porque com "subir 4 bpm a
> cada volta" ligado não existe um valor único — escolher o inicial ou o final seria inventar.

**Decisão de origem:** 39. **Depende de:** F2-1. **Bloqueia:** F3-8 ser útil.

Hoje `Activity` em `src/state/store.ts` guarda id, módulo, tempo e acertos — **nada dos
parâmetros**. Sem isso, "em que tonalidade eu pratiquei isto?" não tem resposta, e itens sem
validação não deixam rastro nenhum de conteúdo.

- `Activity` ganha `parameters_snapshot`, no mesmo formato que `state/attempts.ts` já usa.
- O histórico no Perfil passa a mostrar a configuração ao lado do item.
- Migração: atividades antigas ficam sem o campo, e a tela lida com isso sem quebrar.

**Contrato de saída:** teste que grava uma atividade sem validação nenhuma (um `ambiente`) e
recupera depois em que tonalidade e região ela rodou.

**Feito.** `Activity.snapshot` em `store.ts`, com a mesma forma do `parameters_snapshot` de uma
tentativa — de propósito, para a análise ler os dois do mesmo jeito. `useToolLog` aceita o
snapshot, o `Player` grava o que já tinha em mãos, e o histórico no Perfil mostra a tonalidade e o
andamento ao lado do item. Atividade antiga, sem snapshot, continua válida.
