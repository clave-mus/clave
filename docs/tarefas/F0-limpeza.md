# F0 · Limpeza e base

Tira do caminho o que foi decidido sem planejamento e prepara a casa. **Quase tudo aqui é
mecânico** — é a melhor frente para quem está entrando no projeto.

Nenhuma tarefa de F0 depende de outra, exceto onde dito.

---

## F0-1 · Visão e regras no repositório ✅ *feita em 02/11/2026*

Visão, decisões, arquitetura, especificação do beta, equipe e tarefas dentro do repositório, e o
`CLAUDE.md` com a regra de não decidir produto.

**Por quê:** o documento de visão morava fora do repositório, e nenhum agente de IA dos colegas
tinha como lê-lo. Essa foi a causa raiz de tudo o que está sendo refeito.

---

## F0-2 · Tirar a metáfora de academia ✅ *feita em 02/11/2026*

**Decisão de origem:** 2.

A metáfora vaza por 13 arquivos de `src/`, por `index.html` e pela arte. Esta tarefa cobre
**texto e navegação**; a arte é F4-3.

- `index.html`: título vira `Clave`, sem "academia musical" (decisão 28).
- `src/i18n/pt.ts` e `en.ts`: tirar "GYM"/"academia", "grupo muscular", "arsenal", "medalha",
  "sequência/streak" e tudo que fale de treino de academia. Reescrever os textos afetados —
  `train.tag`, `train.sub`, `home.arsenal`, `home.streak*`, e o que o grep encontrar.
- `src/components/Layout.tsx`: remover a pílula de streak do cabeçalho.
- `src/pages/Progresso.tsx` e `src/exercises/Player.tsx`: tirar as menções a medalha e sequência.
- `src/state/store.ts`: remover `streakDays`. O campo `arsenal` sai em F1-1.
- `src/state/migrate.ts`: a migração que removia `badges`/`bestStreak` continua necessária (há
  gente com estado salvo); só o vocabulário novo muda.

```bash
grep -rniE "academia|gym|muscul|haltere|medalha|streak|arsenal" src/ index.html
```

**Pronto quando:** o grep acima não acha nada em `src/` nem em `index.html` fora de comentários de
migração, e o teste de traduções passa.

**Não faça:** não mexa em `design/art.mjs` nem em `public/art/` — é F4-3, e precisa da direção
visual antes.

---

## F0-3 · Remover o gerador de sessão e as telas-maquete ✅ *feita em 02/11/2026*

**Decisões de origem:** 1, 22.

- Apagar `src/data/session.ts` (`suggestSession`, `Block`, XP por área).
- Apagar `src/pages/Mentor.tsx` e `src/pages/Comunidade.tsx`, e as rotas delas em `App.tsx`.
  São maquetes com dados falsos — porta que não abre.
- `src/pages/Hoje.tsx`: remover a seção "Sua sessão", o botão "Sortear outra" e tudo que venha de
  `suggestSession`. A home é reconstruída em F3-3; por enquanto deixe só a saudação, o seletor de
  contexto e a lista de itens favoritados.
- `src/pages/Sessao.tsx`: fica, mas desligada da rota — ela vira a base do executor de rotinas
  (F3-2). Não apague. *(Feito: ficou autossuficiente, com `Block` e `moduleOf` locais.)*
- Limpar os textos de i18n que ficarem órfãos.

**Pronto quando:** não existe mais nenhum caminho que monte sessão automaticamente, nenhuma rota
leva a uma tela com dados de exemplo, e `npm test` + `tsc` + `lint` passam.

**Não faça:** não apague `Sessao.tsx`.

---

## F0-4 · Três abas ✅ *feita em 02/11/2026*

**Decisão de origem:** 20b. **Bloqueia:** toda tela nova.

Navegação nova: **Praticar · Catálogo · Perfil**, mais o afinador como atalho fixo no cabeçalho
(a tela dele é F5-2; por enquanto o atalho pode levar a um lugar vazio marcado como em construção,
ou ficar escondido atrás de um flag).

- `src/components/Layout.tsx` e `src/components/nav.ts`: três abas no celular, três links no
  desktop.
- Rotas: `/` (Praticar), `/catalogo`, `/perfil`. `/treinar` e `/estudar` **redirecionam** para
  `/catalogo` — há links salvos por aí.
- `/progresso` deixa de ser aba e passa a ser `/perfil/historico`.
- `/rotinas` some como aba (rotinas **são** a Praticar); a rota de uma rotina específica fica
  `/rotina/:id` e entra em F3.
- `/comunidade` e `/mentor` deixam de existir (F0-3).
- Remover a flag `ROUTINES_READY`.

**Pronto quando:** as três abas existem e funcionam no celular e no desktop, nenhum link antigo dá
404, e `nav.test.ts` cobre os redirecionamentos.

**Não faça:** não redesenhe nada visualmente aqui — é F4. Esta tarefa é só estrutura de navegação.

---

## F0-5 · 👤 Derrubar a `dev` e proteger a `main`

**Decisão de origem:** 31.

1. Garantir que `dev` e `main` estão iguais (`git log main..dev` vazio).
2. Trocar a branch padrão do repositório para `main`.
3. Proteção na `main`: exigir pull request, CI "Testes, tipos e lint" verde, branch atualizada,
   1 aprovação; bloquear force-push e exclusão.
4. Apagar a `dev`.
5. No Cloudflare Pages, marcar **produção = `main`**. *(Resolve a pendência antiga de qual branch
   publica.)*
6. Atualizar a seção de branches do `README.md`.

**Pronto quando:** só existe uma branch protegida, `main`, e um PR não entra sem CI verde e
aprovação.

---

## F0-6 · 👤 Organização no GitHub

**Decisão de origem:** 30. **Só o Bernardo pode executar** (a transferência é da conta dele).

1. Criar a organização (grátis), com Paulo e Bernardo como donos e os outros dois como membros.
2. `bernardofens/clave` → Settings → General → Transfer ownership → a organização.
3. Religar o Cloudflare Pages ao repositório novo e refazer a variável de ambiente, se preciso.
4. Conferir se o Supabase e os segredos do GitHub Actions continuam valendo.

**Pronto quando:** o repositório está na organização, os quatro têm acesso, e um PR novo ainda
ganha link de prévia do Cloudflare.

**Não bloqueia nada.** Pode acontecer a qualquer momento, inclusive depois de muita coisa já ter
entrado — a transferência preserva histórico, PRs e configurações, e redireciona os links antigos.
