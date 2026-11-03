# Especificação funcional do beta

O que o beta **é**, tela a tela e recurso a recurso. O *porquê* de cada coisa está em
[decisoes.md](decisoes.md); o *como construir* está em [`tarefas/`](tarefas/).

---

## A hipótese

> **As pessoas montam e mantêm rotinas — com exercícios bons o bastante para valer a pena pôr numa
> rotina.**

**Como se responde:** beta fechado com 20 a 30 músicos (amigos, alunos, grupos de baixo e violão),
por duas semanas, pelo PWA. **Conversa, não painel** — não há análise de uso no beta (decisão 34).

As perguntas a fazer:

- Montaram rotina própria, ou só usaram as do time?
- Voltaram à mesma rotina mais de uma vez?
- Em que momento ficaram olhando a interface em vez de praticar?
- Qual opção foi difícil de achar?
- Usaram o Clave como lugar para estudar, ou ficaram navegando sem entrar numa prática?
- Os exercícios iniciais pareceram fáceis demais, difíceis demais ou adequados?

---

## Escopo

| Entra | Não entra |
|---|---|
| Rotinas: modelo, executor nos dois modos, **editor**, presets do time | Biblioteca pública de rotinas |
| Compartilhar rotina **por link** | Comunidade, perfis, comentários, feed |
| Catálogo **largo** (decisão 48), construído sobre oito motores | Paridade entre áreas |
| Três abas: Praticar · Catálogo · Perfil | Progresso como aba |
| Portas por objetivo | Trilhas de aprendizado |
| Variação automática por sugestão | Diagnóstico de padrões de erro, recomendação automática |
| Afinador, microfone (voz e ritmo relativo) e MIDI — **opcionais e experimentais** | Ritmo alinhado ao clique; polifonia por microfone |
| Notas curtas de teoria dentro dos exercícios | Aulas longas novas, vídeos |
| Contas opcionais (Supabase) e sincronização | Faixas etárias valendo, moderação |
| PWA instalável e offline | Apps de iOS e Android |
| Português e inglês | Espanhol |
| Doação por Pix e Ko-fi | Plano pago, anúncios |
| — | **Mentor com IA** (definitivo) |

---

## Aba 1 · Praticar

A home. Responde "o que eu estudo agora?" em **um toque**.

### Topo: contexto

Um seletor de contexto que filtra a tela inteira: **De bolso · No ônibus · Em silêncio · Com o
instrumento**, mais o marcador **Posso cantar**. O padrão é o último usado.

Não é "quanto tempo você tem?" — tempo é propriedade das rotinas guiadas, e aparece no cartão
delas.

### Corpo: as rotinas da pessoa

Cartões, cada um com nome, modo (livre ou guiado), número de etapas e — só nas guiadas — o tempo
somado. Tocar no cartão começa.

Rotinas cujas etapas não cabem no contexto atual aparecem **esmaecidas com o motivo**
("3 de 6 etapas pedem o instrumento"), nunca escondidas: esconder faz a pessoa achar que perdeu
alguma coisa.

### Rodapé: um card de descoberta

**Um** só, fora das rotinas, com motivo explícito ("você nunca treinou nada de percepção
harmônica") e botão de pôr numa rotina. **Não é sorteio.**

### Rotinas publicadas pelo time

Chegam prontas, e adotá-las cria uma **cópia da pessoa**.

- **De bolso** — só itens sem instrumento, sem microfone e sem canto. Modo livre.
- **Mapear o braço do baixo** — modo guiado, tonalidade configurável, nas versões curta (15–20 min),
  padrão (35–45 min) e completa (50–70 min).
- **Aquecimento de percepção** — modo guiado, 10 min.
- **Leitura diária** — modo guiado, 15 min.

---

## Aba 2 · Catálogo

Todos os itens, com **várias portas sobre o mesmo conjunto** (decisão 19).

### Porta padrão: objetivo

> **O que você quer desenvolver na sua música?**

Oito portas (decisão 20): Dominar as notas no instrumento · Melhorar o ouvido · Acompanhar e
entender harmonia · Aprender teoria musical · Aprender a ler partitura · Melhorar ritmo e groove ·
Melhorar técnica e precisão · O que prepara o improviso.

Mais a saída **"Não sei por onde começar"**, que leva ao diagnóstico.

### Portas secundárias

Por área, por contexto, por instrumento, e busca por texto.

### Cada item

Nome, uma linha de descrição, requisitos de contexto visíveis, e três ações: **começar agora**,
**configurar**, **pôr numa rotina**.

A porcentagem de acerto **não aparece aqui** (decisão 11).

---

## Aba 3 · Perfil

Conta · instrumento e afinação · idioma e grafia das notas · timbre por instrumento · volume dos
exercícios · meta diária (opcional) · **histórico** · apagar progresso · apagar conta · doação.

O **histórico** é discreto e nunca é porta de entrada: tempo estudado por período e por área,
o que foi praticado e com quais configurações. Onde houver proporção, a quantidade de tentativas
aparece junto. Nada de badge, streak, nível ou comparação.

---

## O executor de rotinas

### Modo livre

As etapas como cartões; tocar em qualquer uma abre. Fica o tempo que quiser, sai e volta. O
cronômetro existe e fica quieto. A ordem é sugestão visual.

**"Pratiquei hoje" = qualquer etapa efetivamente usada** — uma tentativa registrada, ou tempo real
num ambiente. **Sem meta de completude**, sem "você deixou 3 etapas por fazer".

### Modo guiado

Etapa atual em primeiro plano com instrução curta e o material musical; tempo sugerido visível;
**próxima** em destaque; lista compacta das etapas ao lado, com salto para qualquer uma.

O cronômetro **informa sem bloquear**: "tempo sugerido atingido", discreto. **Avanço manual
sempre.** Pausa disponível.

### Comum aos dois

- **Herança visível:** "Tonalidade: Dó maior (da rotina)" aparece onde o valor veio de cima.
- **Ciclagem:** uma etapa com várias instâncias resolve uma ao abrir, com botão **"trocar"** ao
  lado. O último usado persiste entre sessões.
- **Embaralhar:** opção de randomizar a ordem das etapas.
- **Esconder o cronômetro.**
- **Fechar e retomar:** voltar à rotina oferece continuar de onde parou.
- **Item que sumiu ou mudou:** aviso e substituto oferecido, nunca falha silenciosa.

### Tela final

Tempo total, etapas visitadas e concluídas, autoavaliação opcional (*consegui / consegui com ajuda
/ preciso repetir*), repetir ou encerrar. Sem celebração, sem pontuação.

---

## O editor de rotinas

Mínimo, mas completo o bastante para a rotina ser de verdade da pessoa:

- Criar, renomear, duplicar e apagar rotina.
- Escolher o modo (livre ou guiado) e ligar embaralhar.
- Definir os parâmetros da rotina (tonalidade, instrumento, afinação, andamento) que as etapas
  herdam.
- Acrescentar etapa a partir do catálogo, configurar, reordenar e remover.
- **Acrescentar instância a uma etapa** (a ciclagem), com o assistente "itens que treinam a mesma
  habilidade" para ajudar a escolher — a escolha final é sempre explícita.
- Definir o tempo sugerido de cada etapa (só guiado).

O desafio de design aqui é mostrar etapa-com-várias-instâncias sem virar árvore de três níveis.
É o primeiro lugar onde "sem deixar a pessoa perdida" é testado de verdade.

---

## Compartilhar rotina por link

Exportar gera um link. Quem abre vê a rotina, o que ela contém e de quem veio, e ganha um botão
**"copiar para as minhas rotinas"**. Nada é publicado; não precisa de conta para receber.

O crédito à rotina de origem fica guardado na cópia.

**Obrigatório desde a v1:** `formatVersion` no formato da rotina, com migração escrita. Link é dado
que sai do controle do app.

---

## Onboarding e nivelamento

1. Instrumento e afinação.
2. Até três objetivos, da mesma lista de oito da porta por objetivo.
3. **Desafios diagnósticos:** para cada objetivo, 4 a 6 itens em duas ou três configurações de
   dificuldade, **usando exercícios que já existem**.
4. Resultado **por objetivo e habilidade, nunca um nível único**. O app **sugere** rotinas e a
   configuração inicial delas.

**Pulável sem penalidade:** quem pula não é marcado como iniciante e nada é bloqueado; a estimativa
só começa com menos evidência.

**Nunca** rotula a pessoa. Nada de "você é intermediário" nem de persona na tela.

---

## Variação automática

No fim de uma série, ou ao abrir as configurações — **nunca durante a prática**:

> *"Você acertou 17 de 20 em 3ªs e 6ªs nas últimas duas sessões. Quer incluir mais intervalos?"*
>
> Todas as opções listadas, duas ou três pré-marcadas.
> **Incluir · Agora não · Não sugerir neste exercício**

Piso de evidência antes de sugerir. A sugestão também **desce** quando a pessoa despenca no degrau
novo. Limiar numa constante única; toda sugestão registrada com aceite ou recusa.

---

## Afinador

Cromático, atalho fixo no cabeçalho. Predefinições: violão/guitarra padrão, Drop D, meio tom
abaixo, baixo de 4 e de 5 cordas.

Mostra a corda mais provável e o quanto falta, em cents, com aviso claro de afinado. O áudio **não
sai do aparelho** — e isso precisa estar escrito na tela e na política de privacidade.

---

## O catálogo do beta

**O trabalho aqui é curadoria e fusão, não adição.** Hoje são 20 exercícios e 6 ferramentas; depois
das fusões e de três itens novos ficam **23 candidatos**, e a meta é **~18 passando nos sete itens
do portão de qualidade**.

### Fusões (decisão 16) — 10 itens viram 4

| Vira | A partir de |
|---|---|
| **Que nota é essa?** com seletor de superfície | `pauta-nota` + `teclado-nota` + `braco-nota` |
| **Ache a nota** com seletor de superfície | `pauta-construir` + `teclado-tecla` + `braco-ache` |
| **Que acorde é esse?** (desenho) | `teclado-acorde` + `acorde-visual` |
| **Gerador de partituras** (decisão 18) | ferramenta `leitura` + ferramenta `ritmo` |

### Candidatos

**Série — teoria, notação e mapa do instrumento**
Que nota é essa? · Ache a nota · Armadura de clave · Intervalo na pauta · Intervalo no braço ·
Acorde escrito na pauta · Que acorde é esse? · Escala na pauta · Quiz de teoria

**Série — percepção**
Que nota tocou? · Intervalo de ouvido · Acorde de ouvido · Escala de ouvido · Graus e células de
ouvido · Ritmo de ouvido · **Quais notas tocaram** *(novo)*

**Ambiente**
Metrônomo · Drone e cronômetro · Backing track · Gerador de partituras ·
**Treinamento auditivo hands-free** *(novo — único habitante de "De bolso")* ·
**Visualizador de escalas, arpejos e desenhos** *(novo — e a superfície compartilhada de toda a
seção de visualização)*

**Tarefa**
Rotinas de técnica com metrônomo progressivo *(vira item registrável, a partir da ferramenta atual)*

### Buracos conhecidos, declarados

- **Técnica tem 1 item.** Enche quando a metade "com instrumento" do catálogo chegar (A3). Não
  vale consertar antes.
- **Voz não existe** — solfejo, cantar a tônica, cantar o grau. É um bloco inteiro da visão, e fica
  fora do beta porque depende de autoavaliação bem desenhada ou de microfone.
- **Backing track não isola instrumentos**, que é o requisito da visão. Depende de A9 (produzir,
  licenciar ou cortar).
- **Ritmo tem 1 item de Série**, mais o gerador. É pouco para a porta "ritmo e groove".

---

## Contas e dados

Opcionais: sem conta, tudo funciona no navegador. Com conta, sincroniza em segundo plano, e no
primeiro login o progresso local migra sem perder nada.

Login por e-mail (link mágico), Google e Apple. Menores de 13 anos seguem sem conta. A conta pode
ser apagada de dentro do app, apagando os dados.

Regra de conflito, documentada: histórico e tentativas **somam**; configurações e rotinas ficam
com a **mais recente**.

---

## PWA

Manifesto, ícones a partir da arte do logo, tela de abertura. Service worker com cache do app e
das ilustrações, para funcionar em modo avião. Aviso de "nova versão disponível".

**Pronto quando:** instala no Android e no iPhone pela tela inicial e faz um exercício offline.
