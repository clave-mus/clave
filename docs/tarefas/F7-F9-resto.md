# F7 · Variação automática · F8 · Onboarding · F9 · Plataforma

Frentes menores, quase todas dependentes de F3.

---

# F7 · Variação automática

## F7-1 · Motor de sugestão

**Decisão de origem:** 9. **Depende de:** F2-2, e do registro de tentativas (que já existe).

O app observa as tentativas, e no fim de uma série — ou ao abrir as configurações do item —
**propõe abrir o leque**:

> *"Você acertou 17 de 20 em 3ªs e 6ªs nas últimas duas sessões. Quer incluir mais intervalos?"*
>
> **Todas** as opções listadas, duas ou três pré-marcadas pelo `tier` (F2-2).
> **Incluir · Agora não · Não sugerir neste exercício**

As quatro guardas são **requisito, não refinamento**:

1. **Nunca durante a prática.** Só no fim de uma série ou nas configurações. Interromper quem está
   praticando para oferecer configuração é literalmente desorientar a pessoa.
2. **Piso de evidência.** Mínimo de tentativas, distribuídas em pelo menos **duas sessões
   diferentes**. Nada de sugerir com 6 respostas.
3. **A escada desce.** Se a pessoa despencou no leque novo, o app oferece voltar — sem drama, sem
   "você regrediu".
4. **Limiar numa constante única**, num arquivo só (`src/catalog/suggestion.ts`), e **toda sugestão
   registrada com aceite ou recusa** — é assim que o beta calibra o número em vez de a gente
   adivinhar.

Aceitar **altera o preset** daquela etapa, para aquela pessoa. **Nunca altera rotina publicada pelo
time** — a pessoa já está mexendo na cópia dela (F3-6).

Recorte do beta: **por exercício, não por habilidade.**

**Pronto quando:** a sugestão aparece nas condições certas, nunca durante a prática, altera o preset
ao ser aceita, e um teste cobre o piso de evidência e o caminho de descida.

**Não faça:** nenhuma escada rígida, nenhum "nível" por exercício, nenhuma progressão por
habilidade, nenhuma mudança automática sem aceite. Nada de tela de diagnóstico ou de padrões de
erro — é outro produto, e não está no beta.

---

# F8 · Onboarding e nivelamento

## F8-1 · Objetivos e desafios diagnósticos

**Decisões de origem:** 20, 21, 22. **Depende de:** F3-6, F1-6. **Bloqueada parcialmente em:** A4, A5.

1. Instrumento e afinação.
2. Até três objetivos, da mesma lista de oito da porta por objetivo (F1-6).
3. **Desafios diagnósticos:** para cada objetivo, 4 a 6 itens em duas ou três configurações de
   dificuldade, **usando itens que já existem** — nenhum exercício especial de diagnóstico.
4. Resultado **por objetivo e habilidade, nunca um nível único**. O app **sugere** rotinas e a
   configuração inicial delas.

**Pulável sem penalidade:** quem pula não é marcado como iniciante e **nada é bloqueado**; a
estimativa só começa com menos evidência.

Remover do onboarding atual: a autoavaliação por área, a pergunta "como você se descreve", e
qualquer resíduo de `ProfileKind` e `levels`.

**O app nunca rotula a pessoa.** Nada de "você é intermediário", nada de persona na tela
(decisão 21).

**Pronto quando:** terminar o onboarding deixa a pessoa com rotinas sugeridas que fazem sentido para
os objetivos escolhidos, e pular não bloqueia nem rotula nada.

**👤 A calibração (`A5`) — qual configuração corresponde a qual ponto de partida, por objetivo — é
julgamento do time, corrigido com os relatos do beta.** Não há regra científica aqui.

---

# F9 · Plataforma

## F9-1 · Sincronização local ↔ conta

**Decisão de origem:** 35. **Depende de:** F3-1.

- O app continua funcionando sem conta e offline; com conta, sincroniza em segundo plano.
- No primeiro login, o progresso local migra para a conta **sem perder nada**.
- Regra de conflito, documentada: **histórico e tentativas somam; configurações e rotinas ficam com
  a mais recente.**
- Tabelas novas no Supabase para rotinas e sessões de rotina, com Row Level Security por usuário
  (o padrão já está nas migrações existentes).
- As tentativas já têm tabela (`supabase/migrations/20261102120000_attempts.sql`); falta subir as
  do IndexedDB.

**Pronto quando:** estudar offline no celular e depois abrir o computador mostra o mesmo progresso
e as mesmas rotinas.

---

## F9-2 · PWA

**Depende de:** F4-3 (precisa do ícone).

- Manifesto, ícones a partir da arte nova, tela de abertura.
- Service worker com cache do app e dos assets, para funcionar em modo avião.
- Aviso de "nova versão disponível".

**Pronto quando:** instala no Android e no iPhone pela tela inicial e faz um exercício em modo avião.

---

## F9-3 · Notas curtas de teoria dentro dos exercícios

**Decisão de origem:** 24. **Depende de:** F1-6.

- Nota curta (dois ou três parágrafos) anexada ao item, acessível de dentro do exercício: "o que é
  um dominante secundário", "o que a armadura está dizendo".
- As 6 aulas longas que já existem (`src/data/content.ts`) **ficam acessíveis**, sem investimento
  novo. A rota `/estudar/:id` sobrevive; a aba some (F0-4).

**👤 Os textos são do Paulo**, nos dois idiomas.

**Pronto quando:** cada item que pede um conceito tem a nota dele a um toque, dentro do exercício —
sem tirar a pessoa da prática.

**Não faça:** nenhuma trilha, nenhum curso, nenhum vídeo. É nota de rodapé (decisão 24).

---

## F9-4 · Doação

**Decisão de origem:** 26.

Link de Pix e de uma plataforma internacional (Ko-fi ou equivalente) no Perfil. Uma linha
explicando que o Clave é grátis e é mantido por quatro amigos. **Sem selo, sem plano, sem anúncio,
sem nada bloqueado.**

**Pronto quando:** dá para doar pelos dois caminhos, e nenhuma parte do app sugere que pagar
desbloqueia alguma coisa.

---

## F9-5 · 👤 Política de privacidade

Precisa cobrir: contas e dados guardados, **o microfone do afinador (o áudio não sai do aparelho)**,
menores de 13 anos, e o fato de não haver análise de uso no beta (decisão 34).

Página dentro do app e no site, linkada no cadastro e na tela do afinador.

---

# F99 · Beta fechado

**Depende de:** F3 inteira, F1-6, F6-7, F9-2.

20 a 30 músicos (amigos, alunos, grupos de baixo e violão), por duas semanas, **pelo PWA**.

**Conversa, não painel** — não há PostHog no beta (decisão 34). As perguntas a fazer estão em
[beta.md](../beta.md#a-hipótese).

**Pronto quando:** o PWA está publicado, a primeira turma está usando, e há resposta para as
perguntas da hipótese — em especial a única que importa:
**as pessoas montaram rotina própria e voltaram a ela?**
