# Clave

Um app para praticar música no tempo que você tem. Você monta a sua paleta de exercícios e, ao
abrir, escolhe o que treinar — com ou sem o instrumento por perto. Site, PWA e, mais adiante,
apps de iOS e Android a partir do mesmo código.

Público principal: quem já toca cordas (violão, guitarra, baixo), estuda sozinho e sem estrutura.

---

## ⚠️ Leia antes de mexer no código

**O código e o plano divergem de propósito, agora.** Em 29/10/2026 o produto foi redesenhado:
`docs/decisoes.md` e `docs/fase-1.md` descrevem **o destino**, e o código ainda é **o estado
anterior**. A Fase 1 é o caminho de um ao outro.

O que isso significa na prática: várias coisas que você vai encontrar no código **já estão
marcadas para sair**, e não são bugs a consertar nem padrões a seguir.

| No código hoje | Para onde vai |
|---|---|
| Seis áreas (`ouvido`, `tecnica`, `mapeamento`, `harmonia`, `ritmo`, `leitura`) | Teoria · Técnica · Percepção {Melódica, Harmônica, Rítmica} — tarefa `F1-01b` |
| `suggestSession` monta a sessão automaticamente | Removido; a escolha passa a ser da pessoa — `D2` |
| `areaXP`, `levelOf`, `badges`, `bestStreak` | Removidos; progresso vira consistência / atividade / evidência — `D6` |
| `ProfileKind` e `levels` (autoavaliação por área no onboarding) | Substituídos por desafios diagnósticos — `D4` |
| Flags `premium` em `content.ts`, selos "Clave+" | Removidos; tudo é grátis — decisão 16, tarefa `F1-01a` |
| Ferramenta "internalizar uma tonalidade" e "copiar link" | Removidas — `C4` |
| Duas ferramentas de leitura (`leitura` e `ritmo`) | Fundidas num motor só — `C3` |
| `pauta-nota`, `teclado-nota` e `braco-nota` (mesma tarefa, três superfícies) | Um exercício com seletor de superfície — `C4` |

**Antes de começar qualquer tarefa, leia a decisão que a originou** em
[docs/decisoes.md](docs/decisoes.md). Cada decisão alterada tem a data e o **motivo** da mudança,
justamente para ninguém desfazer sem saber o que está desfazendo.

---

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # motor de teoria, gerador de ritmo, catálogo de exercícios, faixa de idade
npm run build      # build de produção em dist/
npm run lint
npm run art        # regera as ilustrações em public/art a partir de design/art.mjs
```

Node 24 (está no `.nvmrc`). Sem conta, o app funciona 100% local: o progresso fica no
`localStorage`, na chave `clave:v1`. Conta é opcional — ver [Contas](#contas-supabase).

## Onde está cada coisa

```
src/
  theory/         o motor musical, sem nenhuma dependência de interface
    core.ts         notas grafadas, intervalos, escalas, acordes, tonalidades, campo harmônico
    rhythm.ts       presets e tipos de ritmo
    rhythm-cells.ts catálogo de células rítmicas (o vocabulário do gerador)
    rhythm-gen.ts   gerador de compassos: sorteia células, valida a soma, monta quiálteras e ligaduras
  audio/
    engine.ts       síntese com Web Audio e o relógio com antecedência (metrônomo, melodia, backing)
  exercises/
    types.ts        os contratos: ExerciseDef, Question, Visual, Answer, Sound, Setting
    catalog.ts      os 20 exercícios: cada um é uma declaração, não uma tela
    tools.ts        as 7 ferramentas (cada uma tem tela própria em src/tools/)
    Player.tsx      roda qualquer exercício do catálogo: mostra, recebe a resposta, corrige
  tools/            uma tela por ferramenta (metrônomo, leitura, ritmo, técnica, backing, ambiente)
  components/
    music/          pauta, teclado, braço e notação rítmica em SVG
    ui.tsx          peças de interface (botões, chips, painéis)
    Layout.tsx      navegação (cabeçalho no desktop, barra de abas no celular)
  data/
    areas.ts        as áreas, instrumentos, objetivos e perfis
    content.ts      aulas (MODULES), trilhas (ROADMAPS), gêneros (GENRES)
    session.ts      gerador de sessão e XP por área  ← sai na Fase 1
  state/
    store.ts        estado do usuário em localStorage, com a forma pensada para subir a servidor
    account.ts      conta no Supabase (login, perfil)
    age.ts          faixa de idade a partir da data de nascimento
  pages/            uma tela por rota
design/
  art.mjs           gerador das ilustrações (estilo Noturno) → public/art
  kit.html          kit visual de referência, aberto no navegador
docs/
  decisoes.md       as 33 decisões de produto e plataforma, com data e motivo
  fase-1.md         as tarefas da Fase 1, com dependências e "Pronto quando"
  supabase-setup.md passo a passo para criar o projeto Supabase
public/
  art/              ilustrações geradas (não editar à mão — rodar npm run art)
  _redirects        /* /index.html 200, para o Cloudflare não dar 404 nas rotas do app
```

**Quatro ideias que explicam o resto do código:**

1. **O motor musical não conhece a tela.** `src/theory/` devolve notas, intervalos e acordes com a
   **grafia correta para a tonalidade** (em Fá maior aparece Si♭, nunca Lá♯). Nada ali importa React.
2. **Um exercício é uma declaração, não uma tela.** Em `catalog.ts`, cada exercício tem
   configurações e uma função `make(settings, ctx)` que sorteia uma `Question`: *o que mostrar*
   (`Visual`: pauta, teclado, braço, só som ou texto), *como responder* (`Answer`) e *o que tocar*
   (`Sound`). Quem renderiza e corrige é o `Player`, um só para todos.
3. **O relógio do áudio não é o relógio da tela.** `audio/engine.ts` agenda eventos com
   antecedência no Web Audio, porque `setTimeout` não é preciso o suficiente para música.
4. **O estado é local primeiro.** `store.ts` guarda tudo no navegador e o app funciona inteiro
   offline. Conta é opcional e entra por cima: `src/sync/` mantém o aparelho igual à conta.

## O que existe hoje

- **Hoje** — você diz quanto tempo tem e se está com o instrumento, e o app monta uma sessão
  pesando objetivos, nível declarado e o que você treinou pouco. *(Vira a paleta de escolha — `D2`.)*
- **Treinar** — 20 exercícios, todos personalizáveis. Por área: mapeamento 6, ouvido 5,
  harmonia 5, leitura 3, ritmo 1 — e **técnica 0**, que hoje só tem ferramenta.
- **Ferramentas** — 7: metrônomo; "solfejar e tocar" (drone + metrônomo + cronômetro com meta);
  backing track com análise de graus e sugestão de escalas; gerador de leitura (notas ou ritmo,
  em loop de 4 compassos); leitura rítmica (compassos gerados em 2/4, 3/4, 4/4 e 6/8, cinco
  níveis); rotinas de técnica com metrônomo progressivo; e "internalizar uma tonalidade".
- **Estudar** — aulas no formato *por que importa / como encaixar / passo a passo / pratique*,
  trilhas e gêneros. *(Vira a área Teoria, ao lado dos quizzes — `D1`.)*
- **Progresso** — nível por área, medalhas, histórico. *(Vira consistência / atividade /
  evidência — `D6`.)*
- **Comunidade** e **Mentor** — prévias, com dados de exemplo. Saem da navegação na Fase 1; a
  comunidade é Fase 2 e 3, o mentor é Fase 1.5.

## Tarefas comuns

### Criar um exercício

Acrescente um objeto em `src/exercises/catalog.ts`: área, grupo, se dá para fazer sem o
instrumento (`mobile`), as configurações, os valores padrão e a função `make`. Não precisa escrever
tela nenhuma — o `Player` cuida disso.

O teste `catalog.test.ts` passa automaticamente a gerar centenas de perguntas do exercício novo e
confere se a resposta certa está sempre entre as opções. Se o seu exercício quebrar essa regra,
o teste acusa.

**Antes de criar:** veja se não dá para ser **modo ou configuração** de um exercício que já existe.
A regra está na decisão 11 — reuso por padrão, código novo por exceção justificada.

### Acrescentar uma célula rítmica

`src/theory/rhythm-cells.ts`. Cada célula é uma linha com o padrão em texto — `'8 16 16'`,
`'r8 8'`, `'q. 8'`, `'8 8~ 8 8'`, `'3:2(8 8 8)'` — mais o nível e, se precisar, onde pode começar
(`align`) e em que compassos vale (`meters`). Figuras, pausas, pontos, síncopes, ligaduras e
quiálteras são **deduzidos do padrão**, e é isso que os filtros da tela usam.

`rhythm-gen.test.ts` gera exercícios em todas as fórmulas e níveis e confere a soma de cada
compasso. A notação usa VexFlow, carregada só quando a ferramenta abre.

### Mexer nas ilustrações

Não edite `public/art/` à mão: é gerado. As ilustrações são desenhadas em código em
`design/art.mjs` (estilo Noturno, paleta fechada) e saem com `npm run art`. Para ver a paleta e
os componentes, abra `design/kit.html` no navegador.

### Acrescentar texto de interface

Os idiomas (português e inglês) são a tarefa `F1-01a` e ainda não existem: hoje os textos estão
embutidos nas telas. **Se você está fazendo tela nova, leia a `F1-01a` primeiro** — tela escrita
antes dela vira retrabalho de tradução.

## Branches e pull requests

```
dev   ← branch padrão, onde o trabalho se integra. Os pull requests vão para cá.
main  ← linha estável. dev entra em main quando a release fecha.
```

As duas são protegidas: só entram por pull request, com o check "Testes, tipos e lint" verde e a
branch atualizada. A `main` exige **1 aprovação**; a `dev`, nenhuma. Nenhuma das duas aceita
force-push ou exclusão.

1. Crie a branch a partir da `dev`: `git switch dev && git pull && git switch -c minha-tarefa`
2. Rode o que o CI roda, antes de abrir o PR:
   ```bash
   npm ci
   npm test
   npx tsc --noEmit -p tsconfig.app.json
   npm run lint
   ```
3. Abra o pull request **para a `dev`**. O GitHub Actions
   ([.github/workflows/ci.yml](.github/workflows/ci.yml)) roda testes, tipos e lint, e o
   Cloudflare Pages comenta um link de prévia.
4. Alguém do time revisa. Para entrar na `main`, aprovação é obrigatória.

## Publicação

O site é publicado pelo **Cloudflare Pages**, ligado ao repositório: cada pull request ganha um
link de prévia próprio.

| Configuração no Cloudflare Pages | Valor |
| --- | --- |
| Framework preset | `None` (ou `Vite`) |
| Comando de build | `npm run build` |
| Pasta de saída | `dist` |
| Versão do Node | lida do `.nvmrc` |
| Branch de produção | **a confirmar** — ver abaixo |

**Pendência:** a branch padrão do repositório passou a ser a `dev` em 29/10, e a branch de
produção do Cloudflare precisa ser conferida no painel. Se continuar em `main`, o site público
atualiza só quando uma release fecha — o que pode ser o desejado, mas é bom ser de propósito.
Está registrado nas pendências de [docs/decisoes.md](docs/decisoes.md).

As rotas do app (`/treinar`, `/estudar`…) são do React Router e rodam no navegador. Para o
Cloudflare entregar o app em qualquer endereço em vez de dar 404, `public/_redirects` contém
`/* /index.html 200`; o Vite o copia para `dist/` no build.

## Contas (Supabase)

Conta é opcional: sem ela, tudo fica no navegador. Com conta, dá para entrar por e-mail (link
mágico), Google ou Apple; menores de 13 anos nunca chegam a criar conta.

Para rodar localmente com conta, copie o exemplo e preencha com os dados do projeto
(painel do Supabase → Project Settings → API):

```bash
cp .env.example .env.local
```

Use a chave **anon public**. A `service_role` nunca vai para o repositório nem para o navegador.

O passo a passo completo — criar o projeto, rodar o schema, configurar os três logins — está em
[docs/supabase-setup.md](docs/supabase-setup.md).

Com conta, o progresso sincroniza em segundo plano (`src/sync/`, tarefa B2): o primeiro login
leva para a conta o que estava no aparelho; tentativas e histórico somam; configurações ficam com
a versão mais recente. As regras estão em [docs/sincronizacao.md](docs/sincronizacao.md).

## Decisões e plano

- **[docs/decisoes.md](docs/decisoes.md)** — as 33 decisões de produto e plataforma, com a data e
  o **motivo** de cada revisão. É a resposta para "por que isto é assim?".
- **[docs/fase-1.md](docs/fase-1.md)** — as tarefas da Fase 1, em quatro frentes, com dependências
  e um "Pronto quando" verificável em cada uma. É a resposta para "o que eu faço agora?".
- **[CLAUDE.md](CLAUDE.md)** — como trabalhar neste repositório com o Claude Code.

Não há issues nem board no GitHub: as tarefas vivem no `docs/fase-1.md`.
