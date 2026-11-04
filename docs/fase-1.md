> # ⚠️ DOCUMENTO SUPERADO — não use
>
> Este plano foi **substituído** em 02/11/2026 por [tarefas/](tarefas/), depois da reformulação
> do produto. Ele descreve decisões que foram descartadas (metáfora de academia, cinco abas,
> rotinas na Fase 2, carga em bpm, PostHog, biblioteca pública de rotinas).
>
> Está aqui só como registro histórico. **Nenhuma tarefa deste arquivo deve ser executada.**
> O plano atual é [tarefas/README.md](tarefas/README.md).

---

# Fase 1 · O núcleo

Objetivo: lançar o Clave como **site e PWA**, sem comunidade, com o núcleo que faz o
intermediário autodidata de cordas voltar toda semana. Os apps de loja, os vídeos nas aulas, o
mentor com IA e o microfone nos exercícios ficam para a **Fase 1.5**.

Decisões de origem em [decisoes.md](decisoes.md), revisadas em 29/10/2026.

**Sucesso:** 25% de quem cria conta ainda estuda na 4ª semana, com 3 ou mais sessões por semana.

## Como está dividido

```
F1-00 Fundação (concluída)
   ↓
F1-01 Base comum · idiomas + taxonomia e módulos      (bloqueia toda tela nova)
   ↓
   ├── Frente A · Som:        A1 → A2
   ├── Frente B · Contas e PWA: B1 → B2 → B3 → B4
   ├── Frente C · Motores:    C1 → C2 → C3 → C4
   └── Frente D · Telas:      D1 → D2 → D3 → D4 → D5 → D6
                                   ↓
                         F1-99 Beta fechado (PWA)
```

**F1-01 vem antes de tudo o que é tela.** Toda tela feita antes dos idiomas vira retrabalho de
tradução, e toda tela feita antes da taxonomia vira retrabalho de reclassificação.

**A frente D depende de C1** (camada de parâmetros) para D3 e D5, e de D2 para D4.
Fora disso as frentes andam em paralelo.

**Sobre o tamanho das frentes:** A e B encolheram (A3 e B5 saíram para a Fase 1.5) e C e D são
novas e grandes. A divisão de 22/10 — uma frente por pessoa — não serve mais. A sugestão é duas
pessoas em C e D e uma pessoa cobrindo A e B, que são as frentes mais fechadas e mais
independentes.

As tarefas marcadas com 👤 são do time, fora do código.

---

## F1-00 · Fundação — parcialmente concluída

**Feito:** git iniciado; repositório no GitHub com os três; GitHub Actions rodando `npm test`,
`tsc` e `npm run lint` em cada pull request; Cloudflare Pages com link de prévia por pull request.

**Linha de trabalho (29/10):** `main` é a linha estável, `dev` é onde o trabalho se integra.
Os pull requests vão para `dev`; `dev` entra em `main` quando a release fecha.

**Ainda falta:**

- [ ] Proteger `main` e `dev` — em 29/10 a `main` não tinha nenhuma proteção.
- [ ] Tornar o repositório privado, como manda a decisão 25 — em 29/10 ele estava público.
- [ ] Decidir qual branch o Cloudflare Pages publica como produção.

---

## F1-01 · Base comum

### F1-01a · Português e inglês

- Todos os textos das telas num arquivo por idioma; seletor no perfil e detecção automática.
- Cifras por convenção do idioma (7M/maj7, m7(♭5)/m7♭5, ° / dim).
- Motor de frases do quiz de teoria com gramática de cada idioma.
- Conteúdo traduzido: aulas, exercícios, ferramentas, nomes de módulos, objetivos.
- Teste automático que falha se faltar alguma tradução.
- Tirar os selos "Clave+" e as menções a plano pago.

**Pronto quando:** o app inteiro funciona em inglês sem nenhum texto em português sobrando,
e o teste de traduções passa.

### F1-01b · Taxonomia e módulos

- Substituir as seis áreas atuais pelos módulos `theory`, `technique`, `perception.melodic`,
  `perception.harmonic`, `perception.rhythmic`. `routines` é organizador, não módulo de habilidade.
- Reclassificar os 20 exercícios e as aulas; notação e símbolos vão para Teoria.
- Cada exercício ganha `exercise_id` estável, `primary_module`, `skill_tags` e `content_tags`.
  As etiquetas são controladas e versionadas — nada de texto livre.
- Rotas e rótulos nos dois idiomas.
- Redesenhar as seis ilustrações de área em `design/art.mjs` para os módulos novos.
- Remover `ProfileKind`, `levels`, `badges`, `bestStreak`, `areaXP`, `levelOf` e `TonalityPlan`.

**Pronto quando:** todo exercício e toda aula têm módulo principal e etiquetas, e dá para
recuperar quais habilidades e conteúdos um exercício testa **sem inferir nada do nome dele**.

---

## Frente A · Som

### A1 · Detecção de altura pelo microfone

- Módulo de captura com permissão do microfone, rodando fora da thread principal (AudioWorklet).
- Algoritmo de detecção de altura para uma nota por vez (YIN ou McLeod), com limiar de confiança
  e de volume para ignorar ruído.
- Detector de ataques (onsets).
- Calibração de latência: o app toca cliques, escuta pelo microfone e mede o atraso do aparelho
  uma vez.
- Testes com amostras gravadas de violão, baixo e voz (afinado, desafinado, com ruído).

**Pronto quando:** detecta a nota certa em ±10 cents nas amostras de teste, em menos de 100 ms,
e funciona no Chrome, no Safari (iPhone) e no Firefox.

### A2 · Afinador

- Tela de afinador cromático no visual Noturno (ponteiro tipo VU de rádio antigo).
- Predefinições: violão/guitarra padrão, Drop D, meio tom abaixo, baixo de 4 e de 5 cordas.
- Mostra a corda mais provável e o quanto falta (em cents), com aviso quando está afinado.
- Atalho "Afinar antes de começar" na home quando o contexto é com instrumento.

**Pronto quando:** afina um violão e um baixo reais de ponta a ponta, num celular e num computador.

---

## Frente B · Contas, dados e PWA

### B1 · Supabase e contas

- Projeto Supabase (plano gratuito) com tabelas: perfil (com data de nascimento e faixa etária),
  histórico, tentativas, paleta, configurações, cargas e rotinas em andamento.
- Regras de acesso por usuário (Row Level Security): cada um só lê e escreve o que é seu.
- Login por e-mail (link mágico), Google e Apple.
- Coleta da data de nascimento no cadastro; menores de 13 anos seguem sem conta.
- Apagar a conta de dentro do app, apagando todos os dados.

**Pronto quando:** dá para criar conta, entrar nos três jeitos e apagar a conta, e outra conta
não consegue ler os dados da primeira (testado).

### B2 · Sincronização local-first

- O app continua funcionando sem conta e offline; com conta, sincroniza em segundo plano.
- No primeiro login, o progresso local migra para a conta sem perder nada.
- Regra de conflito simples e documentada (histórico e tentativas somam; configurações ficam com
  a mais recente).

**Pronto quando:** estudar offline no celular e depois abrir o computador mostra o mesmo progresso.

### B3 · PostHog

- Eventos definidos pelo time: sessão começou e terminou, exercício feito, ferramenta usada,
  afinador usado, carga registrada, rotina iniciada e concluída.
- Sem gravação de sessão, sem captura automática, sem cookie de rastreamento; dados na Europa.
- Usuário com conta identificado pelo ID interno. De 13 a 17 anos, só no agregado.
- Opção "Não enviar estatísticas de uso" no perfil.
- Painel de retenção por semana (a métrica de sucesso da fase).

**Pronto quando:** o painel de retenção mostra dados de teste e a opção de não enviar
comprovadamente para os envios.

### B4 · PWA

- Manifesto, ícones a partir da arte do logo, tela de abertura no visual Noturno.
- Service worker com cache do app e das ilustrações, para funcionar offline.
- Aviso de "nova versão disponível".

**Pronto quando:** instala no Android e no iPhone pela tela inicial e faz um exercício em modo avião.

---

## Frente C · Motores

### C1 · Camada de parâmetros compartilhados (primeira da frente)

Separar conteúdo musical, apresentação, superfície de resposta e validação. Construir a camada
e migrar os exercícios aos poucos — não tentar fechar toda a lista de revisões de uma vez.

- Separar superfície de resposta de regra de validação, hoje fundidas no mesmo tipo.
- Validação com equivalência semântica: enarmonias, cifras equivalentes em espaço e
  maiúsculas, posições diferentes que produzem a mesma altura.
- Tirar timbre, volume, intervalo entre notas e arpejo de dentro da geração da pergunta;
  resolver na hora de tocar, a partir de um perfil de apresentação.
- Criar tipo de parâmetro numérico (faixa) — hoje só existem lista única, múltipla e liga/desliga.
- Pôr os parâmetros globais no contexto compartilhado: tonalidade/centro tonal, região e
  extensão, andamento, material permitido, clave, instrumento e afinação.
- Timbre vira configuração global por instrumento.
- Volume geral mais alto nos exercícios de som.

**Pronto quando:** adicionar um parâmetro global novo faz todo exercício com áudio respeitá-lo
**sem editar o catálogo**, e um exercício novo se declara sem tocar no motor.

### C2 · Instrumentação de tentativas

- Cada tentativa grava: `exercise_id`, `primary_module`, `skill_tags`, `content_tags` (com a
  versão das etiquetas), `parameters_snapshot`, resposta estruturada, `outcome`
  (`correct` / `partial` / `incorrect` / `self_assessed` / `unscored`), `validation_type`
  (`deterministic` / `self_report` / `none`), tempo de resposta, pistas, repetições e sessão.
- `error_code` só quando a evidência permite classificar; na dúvida, `unclassified`.
- Pergunta de confiança opcional e ocasional ao fim de uma série ("foi chute" / "tive dúvida" /
  "tive certeza") — nunca a cada tentativa.
- Substitui os contadores agregados atuais, que não guardam o que foi perguntado nem respondido.
- **Não** implementar resumo de padrões, regras de recomendação nem tela de diagnóstico: Fase 2.

**Pronto quando:** dá para consultar, a partir dos dados gravados, quais habilidades e conteúdos
foram testados e com que tipo de validação, sem inferir nada do nome do exercício.

### C3 · Gerador de partituras unificado

Fundir o gerador de leitura e a leitura rítmica num só motor, que passa a ser infraestrutura
para vários exercícios.

- Manter o motor rítmico atual: compassos simples, compostos e ímpares, quiálteras, ligaduras de
  prolongação entre subdivisões diferentes, figuras pontuadas, células rítmicas e validação de
  coerência das configurações.
- Portar do protótipo (VexFlow 4.2.2, MIT): modos de geração melódica (aleatório, arpejos com
  cifra, groove I–IV–V–I com variação, nove padrões de escala incluindo Hanon, nota pivô,
  enclosures), rolagem contínua com âncoras de tempo, agendador de áudio com lookahead, grafia
  enarmônica correta por tonalidade e agrupamento de hastes com tratamento de pausas nas pontas.
- Mudar o andamento durante a execução sem reiniciar a partitura; pausar e continuar no ponto.
- Contagem regressiva, barra de espaço, liga/desliga separado de contagem, notas e metrônomo.
- Opção de **não colorir** as notas no modo rítmico.
- Fica para a Fase 1.5: páginas estáticas de 2/3/4 linhas, biblioteca de timbres, espanhol,
  ghost notes e staccato, posições de braço e seleção de cordas.

**Pronto quando:** existe um motor só, ele gera leitura melódica e rítmica a partir das mesmas
configurações, e trocar o andamento no meio da execução não reinicia a partitura.

### C4 · Famílias novas e lote de correções

Famílias novas, todas como configuração de motor existente — o portão serve como critério de
aceite de C1. Código novo só por exceção, com justificativa escrita respondendo "esta capacidade
é essencial para validar o produto na Fase 1?".

- **Quais notas tocaram** — 3 a 5 notas em sequência, com limite de salto configurável.
- **Inversões em "adivinhe o acorde"** — parâmetro de conteúdo, mais escolha entre ouvir só o
  arpejo, arpejo e acorde, ou só o acorde; duração do acorde configurável; botão que sustenta
  enquanto pressionado; variar a tonalidade entre perguntas.
- **Função do baixo no acorde** — mesma família de acordes, resposta trocada para "qual nota
  está embaixo".
- **Permutações de digitação** viram exercício registrável em Técnica, a partir da ferramenta que
  já existe.

Fusão dos exercícios duplicados por superfície (decisão 4): "que nota é essa?" na pauta, no
teclado e no braço viram um exercício com seletor de superfície; o mesmo para os dois de acorde.
Isso inclui conectar "que nota tocou?" ao braço de baixo e guitarra.

Lote de correções do piloto que a camada não resolve sozinha:

- Layout de celular de "em que nota é essa?" e de "que nota tocou?".
- Feedback de "que nota tocou?": cor imediata na tecla, aviso claro de acerto.
- Em "que nota tocou?": tirar a chance de cair a nota dó; material permitido (só maior, só menor,
  todas as notas) em vez de liga/desliga de teclas pretas; nota central configurável; extensão
  até duas oitavas.
- Extensão de linhas suplementares configurável em "em que nota é essa?".
- Trocar entre intervalo harmônico junto e separado **sem resetar** o intervalo.
- Ícone novo para a clave de fá em `design/art.mjs`.
- Remover a ferramenta "internalizar uma tonalidade" e o "copiar link".

**Pronto quando:** as quatro famílias funcionam sem motor novo (ou com exceção justificada e
registrada), os exercícios duplicados por superfície viraram um, e o lote está fechado.

---

## Frente D · Telas

### D1 · Navegação e catálogo

- Cinco abas: **Hoje · Treinar · Rotinas · Progresso · Perfil**.
- Treinar é o catálogo: módulos colapsáveis, menos rolagem, sem aba "Ferramentas" no topo.
- Teoria absorve a antiga área Estudar: aulas e quizzes lado a lado, com os guias práticos
  ligados aos exercícios correspondentes.
- **Porta por objetivo:** "o que você quer conseguir?" leva direto ao grupo certo de exercícios,
  a partir da lista de objetivos. É o que faz "conhecer as notas no braço" ser encontrável.
- Comunidade e Mentor saem da navegação. A pílula de streak sai do cabeçalho.

**Pronto quando:** dá para chegar em "aprender as notas no braço do baixo" pela porta por
objetivo, em dois toques, sem conhecer a taxonomia.

### D2 · Home: a paleta e a escolha

- A paleta pessoal lidera a tela: exercícios e rotinas que a pessoa priorizou, a um toque de começar.
- Tempo disponível e com/sem instrumento são contexto da tela inteira e **filtram a paleta**.
- Um card de novidade fora da paleta, com motivo explícito ("você nunca treinou nada de X") e
  botão de pôr na paleta. Não é sorteio.
- Remover a seção "Sua sessão", o botão "Sortear outra" e o gerador de sessão.
- A porcentagem de acerto sai de cima da estrela de favoritar e perde destaque.

**Pronto quando:** com "5 min, sem instrumento" escolhido, a paleta mostra só o que cabe, e
começar um exercício leva um toque.

### D3 · Rotinas: executor e presets

Depende de C1 para a herança de parâmetros.

- Modelo de dados: rotina (nome, instrumento, afinação, tonalidade padrão, lista ordenada de
  etapas), etapa (referência ao `exercise_id` + configuração + posição), sessão (etapa atual,
  tempos, estado de pausa, parâmetros efetivamente usados) e tentativa por visita.
- Herança de parâmetros com substituição explícita e visível ("Tonalidade: Dó maior (da rotina)").
- Executor a partir da tela de sessão que já existe: etapa atual com instrução curta, material
  musical, cronômetro crescente por etapa, anterior/próxima, pausa, salto para uma etapa, lista
  compacta de etapas.
- Avanço **manual**; o cronômetro informa ("tempo sugerido atingido", discreto) e não avança
  sozinho nem bloqueia.
- Salvar e retomar: fechar a página e voltar oferece continuar de onde parou.
- Tela final simples: tempo total, etapas visitadas e concluídas, autoavaliação opcional
  ("consegui" / "consegui com ajuda" / "preciso repetir"), repetir ou encerrar.
- Presets publicados pelo time, incluindo **"Mapear o braço do baixo"** com tonalidade
  configurável e armadura visível, nas versões curta (15–20 min), padrão (35–45 min) e completa
  (50–70 min).
- Aviso e migração se um exercício referenciado mudar ou sair, em vez de falhar em silêncio.
- **Sem editor de rotinas:** Fase 2.

**Pronto quando:** dá para começar o preset do braço em outra tonalidade, pausar, voltar uma
etapa, fechar a página e retomar de onde parou, sem perder tempo nem resultado.

### D4 · Onboarding e nivelamento

Depende de C1 (configurações dos exercícios) e de D2 (a paleta).

- Instrumento, objetivos (até três) e os **desafios diagnósticos**: para cada objetivo, 4 a 6
  itens em duas ou três configurações de dificuldade, usando exercícios existentes.
- Resultado por objetivo e habilidade, **nunca um nível único**. Escolhe a configuração inicial
  da paleta.
- **Pulável sem penalidade:** quem pula não é marcado como iniciante e nada é bloqueado.
- Remover o passo de autoavaliação por área e a pergunta "como você se descreve".
- 👤 Calibração: decidir qual configuração corresponde a qual ponto de partida, por objetivo.

**Pronto quando:** terminar o onboarding deixa a pessoa numa paleta que faz sentido para os
objetivos que ela escolheu, e pular os desafios não bloqueia nem rotula nada.

### D5 · Carga em bpm

- Registrar "limpo a X bpm" ao fim das rotinas de técnica, do gerador de leitura e do backing track.
- Recorde pessoal por rotina, com data; próximo degrau já preenchido ao abrir a rotina.
- Linha de evolução no Progresso.
- Rótulo **"autodeclarado"** visível junto do número.
- **Não** implementar: insígnias, celebração de recorde, total agregado, comparação entre
  rotinas da própria pessoa ou entre pessoas.

**Pronto quando:** dá para registrar, ver o recorde com a data e a linha de evolução, e a próxima
vez que a rotina abre o degrau seguinte já está sugerido.

### D6 · Progresso: consistência, atividade, evidência

- Três blocos separados e rotulados: **consistência** (dias praticados, meta escolhida pela
  pessoa, dias de descanso), **atividade** (o que praticou, com quais configurações, por quanto
  tempo, distribuição por módulo) e **evidência de aprendizagem** (só onde houve validação real).
- Na Fase 1, execução no instrumento aparece em atividade, **nunca** em evidência.
- Exibir sempre a quantidade de tentativas junto de qualquer proporção.
- Sem cores alarmistas, sem ranking, sem notificação insistente.
- O mentor por regras continua acessível a partir daqui.

**Pronto quando:** as três categorias estão visualmente separadas e nenhuma sessão de instrumento
sem validação aparece como evidência de aprendizagem.

---

## 👤 Fora do código

- **Política de privacidade e textos legais:** cobrir microfone (o áudio não sai do aparelho),
  contas, PostHog e menores. Página no app e no site, linkada no cadastro.
- **Marca:** busca no INPI e no USPTO antes de pagar contas de desenvolvedor (Fase 1.5).
- **Revisão de ambiguidade teórica** das famílias de exercício antes de publicá-las.
- **Calibração** dos desafios diagnósticos (ver D4).

**Pronto quando:** a política está publicada e linkada, e a verificação de marca não mostrou
bloqueio.

---

## F1-99 · Beta fechado

- Beta com 20 a 30 músicos (amigos, alunos, grupos de baixo e violão) por duas semanas, **pelo PWA**.
- Corrigir o que aparecer; acompanhar a retenção no PostHog.
- Perguntas a fazer, além do que o painel mostra: os exercícios iniciais pareceram fáceis demais,
  difíceis demais ou adequados? em que momento a pessoa ficou olhando a interface em vez de
  praticar? qual opção foi difícil de encontrar? ela usou o app como lugar para estudar ou ficou
  navegando por ferramentas sem entrar numa prática?
- Calibrar os limiares de evidência do diagnóstico e os desafios diagnósticos com o que aparecer.

**Pronto quando:** o PWA está publicado, o painel de retenção está acompanhando a primeira turma,
e temos resposta para as perguntas acima.
