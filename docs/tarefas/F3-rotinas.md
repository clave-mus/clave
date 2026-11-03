# F3 · Rotinas — o caminho crítico

**É isto que o beta precisa provar.** Se esta frente ficar vazia enquanto o trabalho se espalha por
microfone, comunidade e arte, o beta não responde nada.

Modelo em [arquitetura.md § 3.3](../arquitetura.md#33-o-modelo-de-rotinas); comportamento em
[beta.md](../beta.md#o-executor-de-rotinas).

**Ordem sugerida:** F3-1 → F3-2 → F3-3 → F3-4 → F3-5 → F3-6 → F3-7. F3-6 e F3-7 podem ir em
paralelo com F3-5.

---

## F3-1 · Modelo e armazenamento

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

## F3-4 · Ciclagem

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

**Não faça:** nenhuma substituição automática por etiqueta em tempo de execução. O app só entrega
o que a pessoa pôs ali (decisão 7).

---

## F3-5 · Editor de rotinas

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
