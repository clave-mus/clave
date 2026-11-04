# Arquitetura: o que existe, o que diverge, para onde vai

Avaliação do código em 02/11/2026 (~9.700 linhas de TypeScript, 222 testes passando, tudo escrito
por uma pessoa com apoio de IA) e proposta de arquitetura-alvo.

**Premissa:** reescrever do zero seria erro. Há cerca de 1.400 linhas testadas que custam caro e
estão certas. Mas também não se preserva decisão ruim só porque já foi implementada.

---

# Parte 1 · Avaliação do que existe

## 1.1 O que está certo e não se mexe

| Peça | Por que vale |
|---|---|
| **`theory/core.ts`** | Grafia correta por tonalidade: em Fá maior sai **Si♭**, nunca Lá♯. É o erro nº 1 de app de teoria musical, e aqui está resolvido e testado. Sem dependência de React. |
| **`theory/rhythm-cells.ts` + `rhythm-gen.ts`** | Gerador de compassos a partir de um catálogo de células: fórmulas simples, compostas e ímpares, quiálteras, ligaduras entre subdivisões diferentes, figuras pontuadas. **21 testes conferem a soma de cada compasso gerado**, em todos os níveis e fórmulas. |
| **`audio/engine.ts`** | Agendamento com antecedência no Web Audio. `setTimeout` não é preciso o bastante para música; sem isto o metrônomo treme. |
| **`theory/names.ts`** | Nomes de nota, intervalo e cifra com a gramática de cada idioma. |
| **`exercises/validate.ts`** | Equivalência musical de verdade: Dó♯ = Ré♭ quando a pergunta é de altura e ≠ quando é de grafia; `C7M` = `Cmaj7` = `C 7M`; casas diferentes do braço com a mesma altura contam igual. |
| **`state/attempts.ts` + `attemptLog.ts`** | Registro imutável e versionado, em **IndexedDB e não localStorage** — a justificativa está escrita no arquivo e está certa (~500 bytes por tentativa contra ~5 MB de limite). |
| **Infraestrutura** | CI no GitHub Actions rodando testes, tipos e lint em cada PR; Cloudflare Pages com link de prévia por PR; Supabase com Row Level Security nas migrações; i18n com **teste que falha se faltar tradução**. |

**Três ideias do código que também ficam:**

1. **O motor musical não conhece a tela.** Nada em `src/theory/` importa React.
2. **Um exercício é uma declaração, não uma tela.** Em `catalog.ts` cada exercício tem
   configurações e uma função `make(settings, ctx)` que sorteia uma pergunta; quem renderiza e
   corrige é um `Player` só, para todos. **É a ideia estrutural mais valiosa do repositório.**
3. **O relógio do áudio não é o relógio da tela.**

## 1.2 O que está errado

### a) `Visual` e `Surface` são uniões fechadas demais

```ts
type Surface = { kind: 'choices' | 'letters' | 'keyboard' | 'fretboard' | 'staff'; … }
```

Ditado melódico, solfejo com validação, batucar um ritmo, reproduzir uma frase num instrumento
virtual e "cantar o grau" **não cabem**. O catálogo de referência tem dezenas de itens assim.

A tentação errada seria ir acrescentando variantes à união até ela ter quinze membros. A saída
está na decisão 17: item de catálogo com **registro unificado e tela separada quando precisar**.

### b) `primaryModule` obriga cada item a escolher um módulo só

É a causa direta do desequilíbrio visível no app rodando — **Teoria 14 itens, Técnica 2, Percepção
Harmônica 2, Percepção Rítmica 2** — porque tudo que é notação, braço, teclado e escala precisou
caber num módulo e caiu em Teoria.

### c) Ferramenta e exercício são dois tipos com dois caminhos de código

`ExerciseDef` passa pelo `Player`; `ToolDef` aponta para uma tela escrita à mão. Consequências:
o braço virtual tem implementação de exploração e implementação de exercício sem nada garantindo
que se comportem igual, e **ferramenta não entra em rotina sem código especial**.

### d) `exercises/params.ts` é plano

```ts
resolveParams(instrument, stored)  // dois níveis: padrão + escolha da pessoa
```

O modelo de rotinas exige **cinco** níveis em cascata, e exige saber **de onde** cada valor veio
para a tela poder dizer "Tonalidade: Dó maior (da rotina)".

### e) `mobile: boolean` é grosso demais

"De bolso de verdade" (áudio puro, dá para fazer dirigindo) e "dá no ônibus" são contextos
diferentes, e nenhum dos dois é "sem instrumento". Voz não cabe em lugar nenhum.

### f) `data/session.ts` gera sessão aleatória

O gerador automático de sessão contradiz a decisão 1 e já estava marcado para sair. Sai.

### g) A metáfora de academia está no código, não só na arte

Vaza por **13 arquivos** de `src/`, por `index.html` (`Clave · academia musical`), pela navegação
(`GYM` / "cada módulo é um grupo muscular"), pelo `store.ts` (`arsenal`, `streakDays`) e pelo
gerador de arte inteiro.

### h) Duas telas são maquete com dados falsos

`pages/Mentor.tsx` e `pages/Comunidade.tsx` mostram coisas que não existem. **Porta que não abre.**

---

# Parte 2 · Divergências entre o implementado e a visão

| # | No código hoje | Na visão | Tamanho |
|---|---|---|---|
| 1 | Rotinas **não existem** (`pages/Rotinas.tsx` é um título atrás de um flag) | O objeto central do produto, com editor, executor, dois modos, ciclagem e herança | **O maior buraco do projeto** |
| 2 | Identidade "Noturno": preto absoluto, mascote gato, haltere, medalhas, tipografia condensada em caixa alta, vocabulário de academia | Moderna e simples, formas abstratas, **tema claro e escuro** | 463 linhas de gerador + 50 SVGs + CSS |
| 3 | Home monta a sessão sozinha, por sorteio, pesando objetivos e o que se treinou pouco | A pessoa escolhe; o app no máximo **sugere** rotinas a partir de um nivelamento | Tela inteira |
| 4 | `arsenal`: lista plana de exercícios favoritados, **sem presets** | Rotinas com presets absorvem o conceito | Modelo de dados |
| 5 | Progresso é aba, com pílula de streak no cabeçalho | Não é aba; mora no Perfil; sem streak | Navegação + telas |
| 6 | Cinco abas (Hoje · Treinar · Rotinas · Progresso · Perfil) | Proposta: três (Praticar · Catálogo · Perfil) | Navegação |
| 7 | Catálogo navegado por módulo | Catálogo plano com portas por objetivo, área, contexto e busca | Tela + classificação |
| 8 | 16 exercícios, **já sem as duplicatas por superfície** (decisão 16); quase tudo múltipla escolha | ~18 famílias curadas passando nos 7 itens do portão | Curadoria |
| 9 | **Eixo de voz inexistente** — nada de solfejo, cantar a tônica, cantar o grau | Bloco inteiro e explicitamente "muito poderoso" na visão | Famílias novas |
| 10 | Visualizador de escalas/arpejos/shapes **não existe como item** — só componentes dentro de exercícios | Ferramenta central da visão, e superfície compartilhada da seção "Visualização musical" | Item novo + reuso |
| 11 | Backing track existe, **sem isolar/remover instrumentos** | Requisito explícito da visão | Ferramenta + fonte de áudio |
| 12 | Afinador e detecção de altura não existem | No beta | Módulo novo |
| 13 | Público estreitado a "autodidata de cordas"; piano como representação | Instrumentistas iniciante-avançado a intermediário; cordas primeiro **por competência de curadoria**, piano central como superfície | Texto e ênfase |
| 14 | Sem variação automática de dificuldade | Sugestão por regra, com quatro guardas | Motor novo (pequeno) |
| 15 | Sem compartilhamento | Rotina por link, formato versionado | Serialização |
| 16 | PWA não existe | Beta roda em PWA | Manifesto + service worker |

---

# Parte 3 · Arquitetura-alvo

## 3.1 O item de catálogo

Um tipo só, no lugar de `ExerciseDef` + `ToolDef`:

```ts
/** Tudo que aparece no catálogo: exercício, ferramenta, ambiente, tarefa de instrumento. */
interface CatalogItem {
  /** Estável para sempre: rotinas, presets e tentativas apontam para ele. */
  id: string;

  /** Tipo de término (decisão 5). Determina o executor e o que a etapa consegue afirmar. */
  kind: 'serie' | 'ambiente' | 'tarefa';

  /** Requisitos do mundo. O resto (olhos, mãos, áudio) é DEDUZIDO — nunca declarado. */
  requires: { instrumento?: true; microfone?: true; voz?: true };

  /** Quais modos de validação aceita. O primeiro é o padrão. */
  validation: ('deterministic' | 'self_report' | 'microphone')[];

  /** Onde aparece. Note o plural: um item mora em várias portas (decisão 19). */
  areas: AreaId[];
  goals: GoalId[];

  /** O que testa (listas controladas e versionadas — isto já existe e fica). */
  skillTags: SkillTag[];
  contentTags: ContentTag[];

  /** Parâmetros, com dica de dificuldade relativa por opção (decisão 9). */
  params: (ctx: Ctx) => ParamSpec[];
  defaults: ParamValues;

  /** Só para kind: 'serie' — sorteia a pergunta. Já funciona assim hoje. */
  make?: (p: ParamValues, ctx: Ctx) => Question;

  /** Só para 'ambiente' e 'tarefa' — tela própria, carregada sob demanda. */
  screen?: () => Promise<{ default: React.ComponentType<ScreenProps> }>;
}
```

**O que muda em relação ao código de hoje:**

| Hoje | Alvo | Por quê |
|---|---|---|
| `primaryModule: ModuleId` | `areas: AreaId[]` + `goals: GoalId[]` | Decisão 19 — acaba a disputa por localização |
| `mobile: boolean` | `requires` + deduzidos | Decisão: cinco contextos reais |
| `group: GroupId` | **sai** | Era agrupamento de tela, não classificação |
| `ToolDef` separado | `kind: 'ambiente'` + `screen` | Decisão 17 |
| — | `kind` | Decisão 5 |
| — | `validation` | Decisão 6 |
| `Setting` | `ParamSpec` com dica de dificuldade | Decisão 9 |

**O que não muda:** `make(params, ctx) → Question`, com `Visual`, `Expected`, `SoundContent` e o
`Player` comum. É a parte que funciona, e os itens do tipo Série continuam exatamente assim.

**Sobre o registro de tentativas:** a tabela do Supabase tem `primary_module text not null`. Não
vale migrar isso para array — para análise, uma área-casa basta e array complica consulta.
`primary_module` passa a ser, por definição, `areas[0]`, e perde o sentido navegacional.

### Os requisitos deduzidos

Nunca declarados, para não desatualizarem:

```ts
olhos = item.kind !== 'serie' || question.visual.kind !== 'ear'
maos  = item.kind === 'serie' ? question.surface !== undefined : /* a tela diz */
audio = question.sound !== undefined
```

E os cinco contextos saem de uma função só, `fitsContext(item, contexto)` — usada pela home, pelo
filtro do catálogo e pelo editor de rotinas. **Uma implementação, três telas.**

## 3.2 A cascata de parâmetros

Cinco camadas, e cada valor carrega **de onde veio**:

```
1. padrão do item
2. perfil da pessoa      instrumento, afinação, timbres, volume, idioma, grafia
3. parâmetros da rotina  tonalidade, andamento, instrumento, afinação
4. parâmetros da etapa   substituição explícita
5. ajuste na hora        não persiste
```

```ts
type Origin = 'item' | 'perfil' | 'rotina' | 'etapa' | 'agora';
type Resolved<T> = { value: T; origin: Origin };

function resolveParams(layers: Partial<ParamValues>[]): Record<string, Resolved<unknown>>;
```

O `origin` é o que permite a tela dizer **"Tonalidade: Dó maior (da rotina)"**, que é o requisito
de visibilidade da herança. Sem ele, a pessoa não sabe por que o exercício está em Dó.

**Critério de pronto da camada:** acrescentar um parâmetro global novo faz todo item com áudio
respeitá-lo **sem editar o catálogo**, e um item novo se declara sem tocar no motor.

## 3.3 O modelo de rotinas

```ts
interface Routine {
  /** OBRIGATÓRIO desde a v1: link compartilhado é dado fora do controle do app (decisão 23). */
  formatVersion: number;
  id: string;
  name: string;
  notes?: string;
  mode: 'livre' | 'guiado';
  shuffle: boolean;
  /** Herdados pelas etapas, com substituição visível. */
  params: Partial<ParamValues>;
  steps: Step[];
  /** Crédito, quando a rotina veio de um link. */
  from?: { routineId: string; author?: string };
}

interface Step {
  id: string;
  /** Conjunto de instâncias (decisão 7). Uma instância = etapa comum. */
  instances: Instance[];
  policy: 'ordem' | 'sorteio' | 'sorteio-sem-repetir';
  /** Índice da última instância usada. PERSISTE entre sessões — senão o rodízio reinicia sempre. */
  lastUsed?: number;
  /** Só informa; nunca encerra nem bloqueia. Pertence à etapa, não à instância, para a ciclagem
   *  não mudar o tempo sugerido. */
  suggestedSeconds?: number;
  params?: Partial<ParamValues>;
}

interface Instance { itemId: string; params: Partial<ParamValues>; }
```

E a sessão de execução, salva para "fechar a página e retomar":

```ts
interface RoutineSession {
  routineId: string;
  startedAt: number;
  currentStepId: string;
  elapsedByStep: Record<string, number>;
  paused: boolean;
  /** Qual instância cada etapa resolveu nesta execução. */
  resolved: Record<string, number>;
  /** Liga a execução às tentativas gravadas (attempts.session_id já existe). */
  sessionId: string;
}
```

**Três regras de robustez:**

- **Item referenciado sumiu ou mudou de id:** avisar e oferecer substituto, nunca falhar em
  silêncio.
- **Rotina do time adotada vira cópia da pessoa.** Sugestão de variação altera a cópia, nunca a
  original (decisão 9).
- **Migração do `formatVersion` escrita desde a v1**, mesmo que a v1 seja a única que existe.

## 3.4 Estrutura de pastas alvo

```
src/
  theory/      ← fica como está
  audio/       ← fica como está
  catalog/     (era exercises/)
    types.ts     CatalogItem, Question, ParamSpec, ValidationMode
    items/       um arquivo por família, em vez de um catalog.ts de 672 linhas
    params.ts    a cascata
    context.ts   fitsContext + requisitos deduzidos
    validate.ts  ← fica como está
    Player.tsx   ← fica; serve aos itens 'serie'
  routines/    NOVO
    types.ts     Routine, Step, Instance, RoutineSession
    storage.ts   persistência + formatVersion + migração
    share.ts     serializar e ler link
    Runner.tsx   executor: modo livre e modo guiado
    Editor.tsx   editor
  state/       ← attempts.ts e attemptLog.ts ficam; store.ts encolhe
  components/
    music/       ← Staff, Keyboard, Fretboard, RhythmScore ficam (redesign visual)
  pages/
```

**Por que `items/` em vez de um `catalog.ts`:** com 672 linhas e quatro pessoas mexendo, todo PR
toca o mesmo arquivo e todo PR dá conflito. Um arquivo por família resolve, e combina com "cada
família tem um dono musical".

## 3.5 Ordem de migração

Pensada para nunca deixar o app quebrado e para o trabalho ser paralelizável.

1. **Tipo unificado de item** — mecânico. `ToolDef` vira `CatalogItem` com `kind: 'ambiente'`.
2. **`kind`, `requires`, `validation`, `areas[]`, `goals[]`** — mecânico, item por item.
3. **Cascata de parâmetros** — moderado. É a dependência de rotinas.
4. **Rotinas** — o trabalho grande e novo: modelo, armazenamento, executor, editor, link.
5. **Identidade visual** — paralelo e independente de tudo acima.
6. **Fusão das duplicatas por superfície** e aprofundamento da família do braço.
7. **Afinador** — independente.

Os passos 1, 2, 5 e 7 são independentes entre si e podem ser pegos em qualquer ordem. O 3 bloqueia
o 4, e o **4 é o caminho crítico do beta**.

## 3.6 O que se apaga

| Alvo | Linhas |
|---|---|
| `design/art.mjs` e `public/art/` | 463 + 50 SVGs (228 KB) |
| `data/session.ts` | 74 |
| `pages/Mentor.tsx`, `pages/Comunidade.tsx` | 144 |
| `store.ts`: `arsenal`, `streakDays`, `legacyStats` | parcial |
| `exercises/tools.ts` | 14, absorvido |
| `data/modules.ts`: `MODULE_LIST`, `GOALS` | reescrito |
| Todo texto de academia em `i18n/pt.ts` e `en.ts` | parcial |

Nada disso é perda de conhecimento: o motor musical, o gerador de ritmo, o áudio, a validação e o
registro de tentativas — que é onde mora o trabalho difícil — não são tocados.
