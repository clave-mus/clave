# F1 · Modelo do catálogo

Transforma `ExerciseDef` + `ToolDef` no **item de catálogo** único, com tipo de término, requisitos
de contexto e classificação plural. Arquitetura-alvo em
[arquitetura.md § 3.1](../arquitetura.md#31-o-item-de-catálogo).

Quase tudo aqui é mecânico e **item por item** — dá para dividir entre várias pessoas.

---

## F1-1 · Tipo unificado de item

**Decisão de origem:** 17. **Bloqueia:** F1-2, F1-3, F2-1.

Em `src/exercises/types.ts`, fundir `ExerciseDef` e `ToolDef` em `CatalogItem`:

- `make(params, ctx)` passa a ser **opcional** (só itens do tipo Série têm).
- Entra `screen?: () => Promise<{ default: ComponentType<ScreenProps> }>` para itens com tela
  própria, carregada sob demanda.
- As 6 ferramentas de `src/exercises/tools.ts` viram itens com `kind: 'ambiente'` e `screen`
  apontando para a tela que já existe em `src/tools/`. Apagar `tools.ts`.
- `src/pages/Treinar.tsx`: `TOOL_COMPONENTS` some; o item diz qual é a tela.
- `group: GroupId` **sai** — era agrupamento de tela, não classificação.
- `state/store.ts`: `arsenal` sai (decisão 4). Onde a home usava, use uma lista vazia provisória
  até F3-3.

Renomear `src/exercises/` → `src/catalog/` nesta tarefa, antes de o diretório crescer.

**Pronto quando:** existe um tipo só, `TOOLS` não existe mais, as seis telas de ferramenta abrem
normalmente, e `npm test` + `tsc` + `lint` passam.

**Não faça:** não mude ainda a classificação nem acrescente campos novos — isso é F1-2 e F1-3.
Mantenha esta tarefa puramente estrutural, para o PR ser revisável.

---

## F1-2 · Tipo de término, requisitos e modos de validação ✅ *feita em 03/11/2026*

**Decisões de origem:** 5, 6. **Depende de:** F1-1.

Acrescentar ao `CatalogItem`:

```ts
kind: 'serie' | 'ambiente' | 'tarefa';
requires: { instrumento?: true; microfone?: true; voz?: true };
validation: ('deterministic' | 'self_report' | 'microphone')[];  // o primeiro é o padrão
```

- Classificar os 26 itens atuais. Os 20 exercícios são `serie`; as 6 ferramentas são `ambiente`,
  **exceto** `tecnica`, que vira `tarefa` (ela pede autoavaliação — ver F6-5).
- `mobile: boolean` **sai**, substituído por `requires` mais os deduzidos (F1-3).
- Criar `src/catalog/termination.ts` com o contrato de cada tipo: quando termina, o que grava, o
  que a tela precisa oferecer.
- `state/attempts.ts`: `validation_type` já existe e já aceita `deterministic`/`self_report`/`none`.
  Ligar ao modo escolhido, em vez de ser fixo por exercício.

**Pronto quando:** todo item declara `kind`, `requires` e `validation`; um teste trava a lista de
ids com o `kind` de cada um; e nenhum item do tipo `ambiente` ou `tarefa` grava `outcome: 'correct'`.

**Feito.** `kind` entrou na F1-1; agora entraram `requires` e `validation`, mais
`src/catalog/context.ts` com os cinco contextos. 15 testes.

O que eles vigiam, e é o que importa: **nenhum item exige microfone**, nenhum tem `midi` como modo
padrão, e todo item com `requires.instrumento` tem **autoavaliação** como padrão (decisão 37).
O dia em que um exercício depender de microfone ou MIDI, o teste acusa.

**Achado:** o contexto **"De bolso" tem zero itens hoje** — o único habitante previsto é o
treinamento auditivo hands-free (`F6-1`), que ainda não existe. Há um teste afirmando isso, com a
instrução de virá-lo para `toBeGreaterThan(0)` quando a F6-1 entrar. Enquanto isso, a Praticar
estaria oferecendo um contexto que não leva a lugar nenhum — o que torna a `F6-1` mais urgente do
que parecia.

**Não faça:** não implemente ainda a autoavaliação na tela (é F3-2) nem o microfone (A7).

---

## F1-3 · Áreas, objetivos e contextos ⚠️ *parcialmente absorvida pela FM-3 em 03/11/2026*

**Decisões de origem:** 19, 20. **Depende de:** F1-1.

> **O que já foi feito, pela [FM-3](FM-motores.md):** a classificação virou **objeto × tarefa**
> (decisão 40), que é melhor que `areas[]` e a substitui; `fitsContext` existe como
> `cabeNoContexto`, em `src/catalog/context.ts`. **O que resta aqui é só `goals[]`** — e ele
> depende dos textos das oito portas (`A4`).

- `primaryModule: ModuleId` vira **`areas: AreaId[]`** — plural. Acaba a regra de "uma localização
  principal".
- Entra **`goals: GoalId[]`**, com os oito objetivos da decisão 20. Os textos deles são A4; use
  chaves de i18n e deixe o texto para quando chegar.
- Reclassificar os 26 itens: um item pode estar em várias áreas e vários objetivos. **Cada um dos
  oito objetivos precisa de pelo menos 4 itens** — se algum ficar com menos, isso é um achado para
  o Paulo, não um problema para resolver sozinho.
- `src/data/modules.ts`: `MODULE_LIST` vira a lista de áreas; a `GOALS` antiga (que só servia ao
  gerador de sessão) é apagada e reescrita.
- Criar **`src/catalog/context.ts`**:
  ```ts
  type Contexto = 'bolso' | 'onibus' | 'silencio' | 'instrumento';
  function fitsContext(item: CatalogItem, c: Contexto, podeCantar: boolean): boolean;
  ```
  Os requisitos `olhos`, `mãos` e `áudio` são **deduzidos**, nunca declarados — ver
  [arquitetura.md § 3.1](../arquitetura.md#os-requisitos-deduzidos). Uma implementação só,
  usada pela home, pelo filtro do catálogo e pelo editor de rotinas.
- `state/attempts.ts`: `primary_module` passa a ser, por definição, `areas[0]`. **Não** migre a
  coluna do Supabase para array — para análise, uma área-casa basta, e array complica consulta.

**Pronto quando:** dá para recuperar, sem inferir nada do nome do item, em quais áreas e objetivos
ele mora e o que ele exige do contexto; e um teste confere que todo objetivo tem ≥4 itens e que
todo item tem ≥1 área.

---

## F1-4 · Fundir as duplicatas por superfície

**Decisão de origem:** 16. **Depende de:** F1-3.

**Doze** itens viram **quatro** (decisão 53 acrescentou duas fusões ao plano original):

| Vira | A partir de |
|---|---|
| `que-nota-e-essa` com seletor de superfície (pauta · teclado · braço) | `pauta-nota` + `teclado-nota` + `braco-nota` |
| `ache-a-nota` com seletor de superfície | `pauta-construir` + `teclado-tecla` + `braco-ache` |
| `que-acorde-e-esse` | `teclado-acorde` + `acorde-visual` + **`pauta-acorde`** |
| **`que-intervalo-e-esse`** | **`pauta-intervalo` + `braco-intervalo`** |

**A fusão dos intervalos conserta um exercício de graça.** `braco-intervalo` era o único item de
intervalo **sem seletor de intervalos** e sem região configurável — o intervalo saía de um passeio
aleatório com distribuição descontrolada. Fundido, ele herda os parâmetros de `pauta-intervalo`.

- A superfície vira **parâmetro** do item, não exercício separado.
- Em `que-nota-e-essa`, a validação muda com a superfície: na pauta a pergunta é de **grafia**
  (`expected: spelled`, Dó♯ ≠ Ré♭); no teclado e no braço é de **altura** (`expected: pitch`).
  Isso já é suportado por `validate.ts` — só precisa ser escolhido pela superfície.
- Em `que-intervalo-e-esse`, o mesmo princípio: na **pauta** a resposta é a **qualidade** (terça
  menor ≠ segunda aumentada, porque a grafia distingue); no **braço** é o **número de semitons**
  (o desenho é o mesmo para as duas).
- **Unificar a extensão:** hoje o teclado usa `oitavas` e o braço usa `casas` para a mesma ideia.
  Vira um parâmetro só, que cada superfície interpreta.
- Incluir o braço de baixo **e** de guitarra em "que nota tocou?".
- **Ids antigos:** rotinas, presets e tentativas apontam para eles. Escrever a migração em
  `state/migrate.ts` mapeando id antigo → id novo + parâmetro de superfície.

**Pronto quando:** os três itens novos existem com seletor de superfície, os seis antigos não
existem mais, o estado salvo de quem já usava o app é migrado, e os testes de catálogo passam.

**Não faça:** não aproveite para redesenhar o layout de celular desses exercícios — é F6-6.

---

## F1-5 · Catálogo em um arquivo por família

**Depende de:** F1-4. **Pode ser feito junto com F1-4, se quem pegar preferir.**

`src/catalog/catalog.ts` tem 672 linhas. Com quatro pessoas mexendo, todo PR toca o mesmo arquivo
e todo PR dá conflito.

- Quebrar em `src/catalog/items/<id>.ts`, um por família.
- `src/catalog/index.ts` monta a lista e os índices por id.
- Os helpers compartilhados (`CLEFS`, `EXT`, `ACC`, `INST`, `FRETS`, `pcOptions`, `chordOption`…)
  vão para `src/catalog/helpers.ts`.

**Pronto quando:** nenhum arquivo de `src/catalog/items/` passa de 120 linhas e os testes passam
sem alteração.

**Não faça:** nenhuma mudança de comportamento. Este PR é só movimentação de código, e precisa ser
revisável como tal.

---

## F1-6 · A tela do catálogo com as portas

**Decisões de origem:** 19, 20, 20b. **Depende de:** F1-3, F0-4. **Bloqueada parcialmente em:** A4.

- Porta padrão: **por objetivo** — "o que você quer desenvolver na sua música?" com os oito.
- Portas secundárias: por área, por contexto, por instrumento, e busca por texto.
- Cada item mostra nome, uma linha, requisitos de contexto, e três ações: **começar agora**,
  **configurar**, **pôr numa rotina** (a terceira fica desligada até F3-5).
- **A porcentagem de acerto não aparece** (decisão 11).
- `src/pages/Treinar.tsx` vira `src/pages/Catalogo.tsx`; os módulos colapsáveis dão lugar às portas.

**Pronto quando:** dá para chegar em "aprender as notas no braço do baixo" pela porta por objetivo,
em dois toques, **sem conhecer a taxonomia**.

**Não faça:** não espere A4 para começar — use chaves de i18n com texto provisório e troque depois.
