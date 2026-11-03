# Clave

**Um ambiente onde você monta a sua rotina de estudo musical e a executa** — com exercícios que
você configura até caberem exatamente no que precisa praticar.

Site e PWA primeiro; apps de iOS e Android depois, a partir do mesmo código. Side-project de quatro
amigos, músicos amadores e estudantes de programação.

---

## ⚠️ Leia antes de mexer no código

**Em 02/11/2026 o produto foi reformulado, e o código ainda é o estado anterior.**

As duas versões anteriores de `docs/decisoes.md` foram **descartadas**: tinham 33 decisões
escritas e justificadas que o código seguiu com disciplina, mas que ninguém tinha tomado de
propósito. A mais visível foi uma **metáfora de academia** que chegou ao título da aba, à
navegação, aos textos e a cinquenta ilustrações.

Várias coisas que você vai encontrar no código **já estão marcadas para sair**, e não são bugs a
consertar nem padrões a seguir:

| No código hoje | Para onde vai | Tarefa |
|---|---|---|
| "GYM", "grupo muscular", `arsenal`, streak, medalhas | Removidos — a metáfora de academia caiu | `F0-2` |
| `suggestSession` monta a sessão por sorteio | Removido; quem escolhe é a pessoa | `F0-3` |
| `pages/Mentor.tsx`, `pages/Comunidade.tsx` | Removidos — maquetes com dados falsos | `F0-3` |
| Cinco abas | Três: Praticar · Catálogo · Perfil | `F0-4` |
| `ExerciseDef` + `ToolDef` | Um tipo só: `CatalogItem` | `F1-1` |
| `mobile: boolean` | Requisitos declarados + deduzidos, cinco contextos | `F1-3` |
| `primaryModule` (uma localização por item) | `areas[]` + `goals[]` — catálogo plano, várias portas | `F1-3` |
| `pauta-nota` / `teclado-nota` / `braco-nota` | Um item com seletor de superfície | `F1-4` |
| Duas ferramentas de leitura (`leitura` e `ritmo`) | Um gerador de partituras só | `F5-3` |
| Estilo "Noturno" (preto, gato, haltere, granulação) | Moderno e simples, tema claro **e** escuro | `F4` |
| **Rotinas não existem** | O objeto central do produto | `F3` ← **caminho crítico** |

**Antes de começar qualquer tarefa, leia a decisão que a originou.** Cada decisão tem a data e o
**motivo**, justamente para ninguém desfazer sem saber o que está desfazendo.

---

## Os documentos

| | |
|---|---|
| **[docs/visao.md](docs/visao.md)** | **A fonte de verdade do produto.** Se o código discordar dela, o código está errado. |
| [docs/decisoes.md](docs/decisoes.md) | As decisões, com data e motivo, e a lista do que ainda está em aberto. |
| [docs/beta.md](docs/beta.md) | O que o beta é, tela a tela. |
| [docs/catalogo.md](docs/catalogo.md) | Como o catálogo é organizado: objeto × tarefa, os oito motores, o portão em três níveis, e o inventário das ~95 famílias. |
| [docs/arquitetura.md](docs/arquitetura.md) | O que existe, o que diverge, e a arquitetura-alvo. |
| [docs/tarefas/](docs/tarefas/) | **O que fazer agora**, em tarefas pequenas com "Pronto quando". |
| [docs/equipe.md](docs/equipe.md) | Quem é quem e quem responde pelo catálogo. |
| [docs/guias/](docs/guias/) | Passo a passo das tarefas 👤: gravar as amostras de áudio, escrever as digitações. |
| [CLAUDE.md](CLAUDE.md) | Como trabalhar aqui com o Claude Code. **Regra nº 1: não decidir produto.** |

---

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # motor de teoria, gerador de ritmo, catálogo, parâmetros, idiomas
npm run build      # build de produção em dist/
npm run lint
```

Node 24 (está no `.nvmrc`). Sem conta, o app funciona 100% local: o progresso fica no
`localStorage` (`clave:v1`) e as tentativas no IndexedDB. Conta é opcional — ver
[Contas](#contas-supabase).

## Onde está cada coisa

```
src/
  theory/         o motor musical, sem nenhuma dependência de interface
    core.ts         notas grafadas, intervalos, escalas, acordes, tonalidades, campo harmônico
    rhythm-cells.ts catálogo de células rítmicas (o vocabulário do gerador)
    rhythm-gen.ts   gerador de compassos: sorteia células, valida a soma, monta quiálteras e ligaduras
  audio/
    engine.ts       síntese com Web Audio e o relógio com antecedência
  exercises/      → vira src/catalog/ em F1-1
    types.ts        os contratos: ExerciseDef, Question, Visual, Surface, Expected, Setting
    catalog.ts      os 20 exercícios: cada um é uma declaração, não uma tela
    params.ts       parâmetros globais  ← vira cascata de cinco camadas em F2-1
    validate.ts     conferência por sentido musical (enarmonia, cifra equivalente, mesma altura)
    taxonomy.ts     módulos e etiquetas controladas e versionadas
    Player.tsx      roda qualquer item do tipo Série: mostra, recebe a resposta, corrige
  tools/          uma tela por ferramenta  ← viram itens de catálogo com tela própria, em F1-1
  components/music/ pauta, teclado, braço e notação rítmica em SVG
  state/
    store.ts        estado no localStorage, na forma pensada para subir a servidor
    attempts.ts     registro imutável de tentativas (formato versionado)
    attemptLog.ts   IndexedDB, não localStorage — o motivo está escrito no arquivo
    account.ts      conta no Supabase
  i18n/           português e inglês, com teste que falha se faltar tradução
  pages/          uma tela por rota
public/logo.svg   a marca: o campo com a letra em negativo (favicon e ícone do PWA)
docs/             ver a tabela acima
```

**Quatro ideias que explicam o resto do código** — e que **ficam**:

1. **O motor musical não conhece a tela.** `src/theory/` devolve notas, intervalos e acordes com a
   **grafia correta para a tonalidade** (em Fá maior aparece Si♭, nunca Lá♯). Nada ali importa React.
2. **Um exercício é uma declaração, não uma tela.** Cada um tem configurações e uma função
   `make(settings, ctx)` que sorteia uma `Question`: *o que mostrar*, *como responder* e *o que
   tocar*. Quem renderiza e corrige é o `Player`, um só para todos.
3. **O relógio do áudio não é o relógio da tela.** `audio/engine.ts` agenda eventos com antecedência
   no Web Audio, porque `setTimeout` não é preciso o suficiente para música.
4. **O estado é local primeiro.** Conta é opcional e entra por cima.

## Criar um exercício

**Antes de criar, veja se não dá para ser modo ou configuração de um item que já existe.** A regra
está na decisão 15 — reuso por padrão, código novo por exceção justificada por escrito. Com ~60
famílias no catálogo de referência, é a única coisa que impede 60 telas.

Se for mesmo família nova: acrescente um item no catálogo com áreas, objetivos, etiquetas,
requisitos de contexto, tipo de término, configurações, padrões e a função `make`. Não precisa
escrever tela nenhuma — o `Player` cuida disso.

O `catalog.test.ts` passa automaticamente a gerar centenas de perguntas do exercício novo e confere
se a resposta certa está sempre entre as opções.

E a família só é publicada depois de passar nos **sete itens do portão de qualidade**
([docs/decisoes.md](docs/decisoes.md#o-portão-de-qualidade-de-exercício)), incluindo a revisão de
ambiguidade teórica pelo dono musical dela.

## Acrescentar uma célula rítmica

`src/theory/rhythm-cells.ts`. Cada célula é uma linha com o padrão em texto — `'8 16 16'`,
`'r8 8'`, `'q. 8'`, `'8 8~ 8 8'`, `'3:2(8 8 8)'` — mais o nível e, se precisar, onde pode começar
(`align`) e em que compassos vale (`meters`). Figuras, pausas, pontos, síncopes, ligaduras e
quiálteras são **deduzidos do padrão**.

`rhythm-gen.test.ts` gera exercícios em todas as fórmulas e níveis e confere a soma de cada
compasso. A notação usa VexFlow, carregada só quando a ferramenta abre.

## Branches e pull requests

Uma branch protegida: **`main`**. *(A `dev` é derrubada em `F0-5`.)*

1. `git switch main && git pull && git switch -c F3-1-modelo-rotinas`
2. **Abra um pull request em rascunho** com o ID da tarefa no título. É isso que avisa os outros
   que você pegou a tarefa.
3. Antes de tirar do rascunho:
   ```bash
   npm ci && npm test && npx tsc --noEmit -p tsconfig.app.json && npm run lint
   ```
4. CI verde e 1 aprovação para entrar na `main`. O Cloudflare comenta um link de prévia no PR.

Não há issues nem board: as tarefas vivem em [docs/tarefas/](docs/tarefas/).

## Publicação

**Cloudflare Pages**, ligado ao repositório, com link de prévia por pull request.

| Configuração | Valor |
| --- | --- |
| Framework preset | `None` (ou `Vite`) |
| Comando de build | `npm run build` |
| Pasta de saída | `dist` |
| Versão do Node | lida do `.nvmrc` |
| Branch de produção | `main` |

As rotas do app são do React Router e rodam no navegador. Para o Cloudflare entregar o app em
qualquer endereço em vez de dar 404, `public/_redirects` contém `/* /index.html 200`.

## Contas (Supabase)

Conta é opcional: sem ela, tudo fica no navegador. Com conta, dá para entrar por e-mail (link
mágico), Google ou Apple; menores de 13 anos seguem sem conta.

Para rodar localmente com conta:

```bash
cp .env.example .env.local
```

Use a chave **anon public** (painel do Supabase → Project Settings → API). A `service_role` nunca
vai para o repositório nem para o navegador. O passo a passo está em
[docs/supabase-setup.md](docs/supabase-setup.md).

A sincronização do progresso local com a conta é a tarefa `F9-1` e **ainda não existe**.
